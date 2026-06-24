import { getApiBaseUrl } from "@/lib/api/client";
import { t } from "@/lib/i18n/t";

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

export interface ExerciseDetail {
  id: string;
  name: string;
  category: string;
  primaryMuscle: string;
  equipment?: string;
  level?: string;
  instructions: string[];
  imageUrls: string[];
}

interface FreeExerciseRecord {
  id?: string;
  slug?: string;
  name?: string;
  category?: string;
  equipment?: string;
  level?: string;
  instructions?: string[];
  primaryMuscles?: string[];
  /** From our backend API. */
  image?: string | null;
  media?: Array<{ url: string; type: string }>;
  /** From the GitHub fallback dataset. */
  images?: string[];
}

interface CatalogIndexes {
  exercises: ExerciseSearchResult[];
  bySlug: Map<string, FreeExerciseRecord>;
  byName: Map<string, ExerciseSearchResult>;
}

function resolveImageUrl(record: FreeExerciseRecord): string | undefined {
  return resolveImageUrls(record)[0];
}

function resolveImageUrls(record: FreeExerciseRecord): string[] {
  const fromMedia = record.media
    ?.filter((item) => item.type === "IMAGE")
    .map((item) => item.url)
    .filter(Boolean);
  if (fromMedia && fromMedia.length > 0) {
    return fromMedia;
  }

  if (record.image) {
    return [record.image];
  }

  return (record.images ?? [])
    .map((image) => `${GITHUB_IMAGE_BASE}/${image}`)
    .filter(Boolean);
}

function recordSlug(record: FreeExerciseRecord, index: number): string {
  return record.slug ?? record.id ?? String(index);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

let catalogIndexesPromise: Promise<CatalogIndexes> | null = null;

function formatMuscleLabel(muscles: string[] | undefined): string {
  const primary = muscles?.[0]?.trim();
  if (!primary) {
    return t("exercise.generalMuscle");
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

function mapSearchResult(
  record: FreeExerciseRecord,
  index: number,
): ExerciseSearchResult | null {
  const name = record.name?.trim();
  if (!name) {
    return null;
  }

  return {
    id: recordSlug(record, index),
    name,
    category: record.category?.trim() || "Strength",
    primaryMuscle: formatMuscleLabel(record.primaryMuscles),
    imageUrl: resolveImageUrl(record),
  };
}

function mapExerciseDetail(
  record: FreeExerciseRecord,
  index = 0,
): ExerciseDetail | null {
  const searchResult = mapSearchResult(record, index);
  if (!searchResult) {
    return null;
  }

  return {
    id: searchResult.id,
    name: searchResult.name,
    category: searchResult.category,
    primaryMuscle: searchResult.primaryMuscle,
    equipment: record.equipment?.trim() || undefined,
    level: record.level?.trim() || undefined,
    instructions: (record.instructions ?? []).filter((step) => step.trim()),
    imageUrls: resolveImageUrls(record),
  };
}

async function loadCatalogIndexes(): Promise<CatalogIndexes> {
  if (!catalogIndexesPromise) {
    catalogIndexesPromise = fetch(catalogUrl())
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Exercise search is unavailable right now. Try again in a moment.",
          );
        }

        const payload = (await response.json()) as FreeExerciseRecord[];
        const bySlug = new Map<string, FreeExerciseRecord>();
        const byName = new Map<string, ExerciseSearchResult>();
        const exercises: ExerciseSearchResult[] = [];

        payload.forEach((record, index) => {
          if (!isBodybuildingExercise(record)) {
            return;
          }

          const searchResult = mapSearchResult(record, index);
          if (!searchResult) {
            return;
          }

          exercises.push(searchResult);
          bySlug.set(searchResult.id, record);
          byName.set(normalizeName(searchResult.name), searchResult);
        });

        return { exercises, bySlug, byName };
      })
      .catch((error: unknown) => {
        catalogIndexesPromise = null;
        throw error;
      });
  }

  return catalogIndexesPromise;
}

async function loadCatalog(): Promise<ExerciseSearchResult[]> {
  const indexes = await loadCatalogIndexes();
  return indexes.exercises;
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

/** Exact catalog name match — user picked a standard exercise, not custom text. */
export async function findCatalogExerciseByName(
  name: string,
): Promise<ExerciseSearchResult | null> {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const indexes = await loadCatalogIndexes();
  return indexes.byName.get(normalizeName(trimmed)) ?? null;
}

export async function getExerciseDetail(
  slug: string,
): Promise<ExerciseDetail | null> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return null;
  }

  const base = getApiBaseUrl();
  if (base) {
    const response = await fetch(
      `${base}/api/exercises/${encodeURIComponent(trimmed)}`,
    );
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(
        "Exercise details are unavailable right now. Try again in a moment.",
      );
    }

    const record = (await response.json()) as FreeExerciseRecord;
    return mapExerciseDetail({
      ...record,
      id: record.slug ?? record.id ?? trimmed,
    });
  }

  const indexes = await loadCatalogIndexes();
  const record = indexes.bySlug.get(trimmed);
  if (!record) {
    return null;
  }

  return mapExerciseDetail(record);
}
