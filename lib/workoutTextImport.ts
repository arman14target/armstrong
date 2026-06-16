import { sendCoachMessage } from "@/lib/gemini";
import { isTimeBasedExercise } from "@/lib/timeBasedExercises";
import { BatchExercisePreset } from "@/lib/workoutBatches";

const EXTRACTION_PROMPT = `You extract a single workout day from free-form user text for the Armstrong gym app.

Return ONLY valid JSON — no markdown, no commentary — matching this schema:
{
  "exercises": [
    {
      "name": string,
      "sets": number,
      "reps": number,
      "durationSeconds": number | null,
      "restSeconds": number,
      "weightKg": number
    }
  ]
}

Rules:
- Parse every exercise the user describes into the list, in order.
- sets: default 3 if not specified.
- For weight-based exercises: reps is rep count (default 10), durationSeconds is null, weightKg is 0 if not specified.
- For time-based exercises (plank, wall sit, holds, dead hang, etc.): set durationSeconds to hold time in seconds, reps to 1, weightKg to 0.
- restSeconds: default 60 between sets; parse "1 min", "90s", etc.
- Convert lbs to kg for weightKg when needed.
- Include all exercises even if details are vague — use sensible defaults.
- Do not add exercises the user did not mention.`;

export interface WorkoutTextImportExercise {
  name: string;
  sets: number;
  reps: number;
  durationSeconds: number | null;
  restSeconds: number;
  weightKg: number;
}

function parseJsonFromModelText(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenceMatch ? fenceMatch[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not parse workout plan. Try rephrasing your program.");
  }

  return JSON.parse(raw.slice(start, end + 1));
}

function asPositiveNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function asNonNegativeNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function normalizeExercise(value: unknown): WorkoutTextImportExercise | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = String(record.name ?? "").trim();
  if (!name) {
    return null;
  }

  const durationRaw = record.durationSeconds;
  const durationSeconds =
    durationRaw === null || durationRaw === undefined
      ? null
      : Math.round(asPositiveNumber(durationRaw, 0)) || null;

  const timeBased = durationSeconds !== null || isTimeBasedExercise(name);

  return {
    name,
    sets: Math.round(asPositiveNumber(record.sets, 3)),
    reps: timeBased
      ? Math.round(asPositiveNumber(durationSeconds ?? record.reps, 45))
      : Math.round(asPositiveNumber(record.reps, 10)),
    durationSeconds: timeBased ? (durationSeconds ?? Math.round(asPositiveNumber(record.reps, 45))) : null,
    restSeconds: Math.round(asPositiveNumber(record.restSeconds, 60)),
    weightKg: asNonNegativeNumber(record.weightKg, 0),
  };
}

export function parseWorkoutTextImportPayload(raw: unknown): WorkoutTextImportExercise[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid workout data from import.");
  }

  const record = raw as Record<string, unknown>;
  const exercises = Array.isArray(record.exercises)
    ? record.exercises
        .map(normalizeExercise)
        .filter((exercise): exercise is WorkoutTextImportExercise => exercise !== null)
    : [];

  if (exercises.length === 0) {
    throw new Error("No exercises found. Describe at least one exercise.");
  }

  return exercises;
}

export function toBatchPresets(exercises: WorkoutTextImportExercise[]): BatchExercisePreset[] {
  return exercises.map((exercise) => ({
    name: exercise.name,
    setCount: exercise.sets,
    reps: exercise.durationSeconds ?? exercise.reps,
    weightKg: exercise.weightKg,
    restSeconds: exercise.restSeconds,
    isTimeBased: exercise.durationSeconds !== null || isTimeBasedExercise(exercise.name),
  }));
}

export async function extractWorkoutFromText(text: string): Promise<BatchExercisePreset[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Describe your workout before importing.");
  }

  const response = await sendCoachMessage(
    [],
    `Extract workout exercises from this user description:\n\n${trimmed}`,
    EXTRACTION_PROMPT,
  );

  const exercises = parseWorkoutTextImportPayload(parseJsonFromModelText(response));
  return toBatchPresets(exercises);
}
