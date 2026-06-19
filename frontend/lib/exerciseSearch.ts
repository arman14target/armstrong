import { getApiBaseUrl } from "@/lib/api/client";

/** Fallback dataset when our backend API isn't configured. */
const EXERCISE_CATALOG_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const GITHUB_IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

/** Prefer our backend (curated catalog + media); fall back to GitHub. */
function catalogUrl(): string {
  const base = getApiBaseUrl();
  return base ? `${base}/api/exercises` : EXERCISE_CATALOG_URL;
}

/** Lifting-focused categories from the dataset. */
const BODYBUILDING_CATEGORIES = new Set(["strength", "powerlifting"]);

const EXCLUDED_NAME_PATTERN =
  /stretch|warm[- ]?up|cardio|burpee|jump rope|jumping jack|mountain climber|running|jogging|sprint/i;

export interface ExerciseSearchResult {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  /** Demonstration image, when available. */
  imageUrl?: string;
}

interface FreeExerciseRecord {
  id?: string;
  name?: string;
  category?: string;
  primaryMuscles?: string[];
  /** From our backend API. */
  image?: string | null;
  /** From the GitHub fallback dataset. */
  images?: string[];
}

function resolveImageUrl(record: FreeExerciseRecord): string | undefined {
  if (record.image) {
    return record.image;
  }
  const first = record.images?.[0];
  return first ? `${GITHUB_IMAGE_BASE}/${first}` : undefined;
}

let catalogPromise: Promise<ExerciseSearchResult[]> | null = null;

function formatMuscleLabel(muscles: string[] | undefined): string {
  const primary = muscles?.[0]?.trim();
  if (!primary) {
    return "General";
  }

  return primary.charAt(0).toUpperCase() + primary.slice(1);
}

function isBodybuildingExercise(record: FreeExerciseRecord): boolean {
  const category = record.category?.trim().toLowerCase();
  const name = record.name?.trim() ?? "";

  if (!category || !BODYBUILDING_CATEGORIES.has(category)) {
    return false;
  }

  if (EXCLUDED_NAME_PATTERN.test(name)) {
    return false;
  }

  return true;
}

function scoreMatch(name: string, query: string): number {
  const normalizedName = name.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  const words = normalizedQuery.split(/\s+/).filter(Boolean);

  if (normalizedName === normalizedQuery) {
    return 0;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 1;
  }

  if (words.every((word) => normalizedName.includes(` ${word}`))) {
    return 2;
  }

  if (words.every((word) => normalizedName.includes(word))) {
    return 3;
  }

  return 4;
}

async function loadCatalog(): Promise<ExerciseSearchResult[]> {
  if (!catalogPromise) {
    catalogPromise = fetch(catalogUrl())
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Exercise search is unavailable right now. Try again in a moment.",
          );
        }

        const payload = (await response.json()) as FreeExerciseRecord[];
        return payload
          .filter(isBodybuildingExercise)
          .map((record, index): ExerciseSearchResult | null => {
            const name = record.name?.trim();
            if (!name) {
              return null;
            }

            return {
              id: record.id ?? String(index),
              name,
              category: record.category?.trim() || "Strength",
              primaryMuscle: formatMuscleLabel(record.primaryMuscles),
              imageUrl: resolveImageUrl(record),
            };
          })
          .filter((record): record is ExerciseSearchResult => record !== null);
      })
      .catch((error: unknown) => {
        catalogPromise = null;
        throw error;
      });
  }

  return catalogPromise;
}

const POPULAR_EXERCISE_QUERIES = [
  "bench press",
  "squat",
  "deadlift",
  "lat pulldown",
  "shoulder press",
  "barbell curl",
  "leg press",
  "cable fly",
  "tricep pushdown",
  "lateral raise",
];

function rankExercises(
  catalog: ExerciseSearchResult[],
  query: string,
  limit: number,
): ExerciseSearchResult[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  return catalog
    .filter((exercise) => {
      const normalizedName = exercise.name.toLowerCase();
      return words.every((word) => normalizedName.includes(word));
    })
    .sort((left, right) => {
      const leftScore = scoreMatch(left.name, query);
      const rightScore = scoreMatch(right.name, query);
      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, limit);
}

export async function searchExercises(
  query: string,
  limit = 6,
): Promise<ExerciseSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const catalog = await loadCatalog();
  return rankExercises(catalog, trimmed, limit);
}

export async function getPopularExercises(
  limit = 12,
): Promise<ExerciseSearchResult[]> {
  const catalog = await loadCatalog();
  const popular: ExerciseSearchResult[] = [];
  const seen = new Set<string>();

  for (const query of POPULAR_EXERCISE_QUERIES) {
    const match = rankExercises(catalog, query, 1)[0];
    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      popular.push(match);
    }
  }

  if (popular.length < limit) {
    for (const exercise of catalog) {
      if (seen.has(exercise.id)) {
        continue;
      }

      seen.add(exercise.id);
      popular.push(exercise);
      if (popular.length >= limit) {
        break;
      }
    }
  }

  return popular.slice(0, limit);
}
