export interface ImportExercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  weightKg: number;
}

export type ImportDaySlot = "push" | "pull" | "leg" | "abs" | "custom";

export interface ImportDay {
  slot: ImportDaySlot;
  name: string;
  exercises: ImportExercise[];
}

const VAGUE_NAME_PATTERN =
  /\b(upper|lower)\s*body|day\s*[ab]\b|\bworkout\s*[1234]\b|training\s*day\s*[1234]/i;

const PUSH_KEYWORDS = [
  "bench",
  "press",
  "fly",
  "tricep",
  "pushdown",
  "dip",
  "shoulder",
  "ohp",
  "overhead",
  "chest",
  "incline",
  "decline",
  "pec",
  "push-up",
  "pushup",
];

const PULL_KEYWORDS = [
  "row",
  "pulldown",
  "pull-up",
  "pullup",
  "chin",
  "curl",
  "face pull",
  "lat",
  "deadlift",
  "back",
  "shrug",
  "rear delt",
];

const LEG_KEYWORDS = [
  "squat",
  "lunge",
  "leg press",
  "rdl",
  "romanian",
  "leg curl",
  "leg extension",
  "calf",
  "hip thrust",
  "glute",
  "hamstring",
  "quad",
  "split squat",
];

const ABS_KEYWORDS = [
  "crunch",
  "plank",
  "raise",
  "core",
  " ab",
  "abs",
  "twist",
  "hanging",
  "sit-up",
  "situp",
];

const CANONICAL_NAMES: Record<ImportDaySlot, string> = {
  push: "Push Day",
  pull: "Pull Day",
  leg: "Leg Day",
  abs: "Abs Day",
  custom: "Full Body",
};

type MuscleScores = {
  push: number;
  pull: number;
  leg: number;
  abs: number;
};

function scoreExercises(exercises: ImportExercise[]): MuscleScores {
  const scores: MuscleScores = { push: 0, pull: 0, leg: 0, abs: 0 };

  for (const exercise of exercises) {
    const name = exercise.name.toLowerCase();

    if (PUSH_KEYWORDS.some((keyword) => name.includes(keyword))) {
      scores.push += 1;
    }
    if (PULL_KEYWORDS.some((keyword) => name.includes(keyword))) {
      scores.pull += 1;
    }
    if (LEG_KEYWORDS.some((keyword) => name.includes(keyword))) {
      scores.leg += 1;
    }
    if (ABS_KEYWORDS.some((keyword) => name.includes(keyword))) {
      scores.abs += 1;
    }
  }

  return scores;
}

function pickPrimarySlot(scores: MuscleScores): ImportDaySlot {
  const ranked = [
    ["push", scores.push],
    ["pull", scores.pull],
    ["leg", scores.leg],
    ["abs", scores.abs],
  ] as [ImportDaySlot, number][];
  ranked.sort((left, right) => right[1] - left[1]);

  const [topSlot, topScore] = ranked[0];
  const [, secondScore] = ranked[1];

  if (topScore === 0) {
    return "custom";
  }

  if (topSlot === "leg" && scores.abs >= 2 && scores.abs >= secondScore) {
    return "leg";
  }

  return topSlot;
}

function isVagueDayName(name: string): boolean {
  return VAGUE_NAME_PATTERN.test(name) || /^day\s*\d+$/i.test(name.trim());
}

function focusSuffix(exercises: ImportExercise[]): string | null {
  const names = exercises.map((exercise) => exercise.name.toLowerCase());

  if (names.some((name) => name.includes("chest") || name.includes("bench"))) {
    return "Chest Focus";
  }
  if (names.some((name) => name.includes("shoulder") || name.includes("ohp"))) {
    return "Shoulders Focus";
  }
  if (names.some((name) => name.includes("back") || name.includes("row"))) {
    return "Back Focus";
  }
  if (names.some((name) => name.includes("squat") || name.includes("quad"))) {
    return "Quads Focus";
  }
  if (names.some((name) => name.includes("hamstring") || name.includes("rdl"))) {
    return "Posterior Chain";
  }

  return null;
}

function buildCanonicalName(
  slot: ImportDaySlot,
  exercises: ImportExercise[],
  usedNames: Set<string>,
): string {
  if (slot === "leg" && scoreExercises(exercises).abs >= 2) {
    const legCore = "Leg & Core Day";
    if (!usedNames.has(legCore)) {
      return legCore;
    }
  }

  const base = CANONICAL_NAMES[slot];

  if (!usedNames.has(base)) {
    return base;
  }

  const suffix = focusSuffix(exercises);
  if (suffix) {
    const focused = `${base} — ${suffix}`;
    if (!usedNames.has(focused)) {
      return focused;
    }
  }

  let variant = 2;
  while (usedNames.has(`${base} ${variant}`)) {
    variant += 1;
  }

  return `${base} ${variant}`;
}

export function refineImportedDayName(
  day: ImportDay,
  usedNames: Set<string>,
): ImportDay {
  const shouldRefine =
    isVagueDayName(day.name) ||
    day.slot === "custom" ||
    /\b(upper|lower)\b/i.test(day.name);

  if (!shouldRefine && !usedNames.has(day.name)) {
    usedNames.add(day.name);
    return day;
  }

  const scores = scoreExercises(day.exercises);
  const slot =
    day.slot !== "custom" && !isVagueDayName(day.name)
      ? day.slot
      : pickPrimarySlot(scores);

  const name = buildCanonicalName(slot, day.exercises, usedNames);
  usedNames.add(name);

  return {
    ...day,
    slot,
    name,
  };
}

export function refineImportedDays(days: ImportDay[]): ImportDay[] {
  const usedNames = new Set<string>();

  return days.map((day) => refineImportedDayName(day, usedNames));
}
