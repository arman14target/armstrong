import type { CoachChatMessage } from "@/lib/gemini";
import { sendCoachMessage } from "@/lib/gemini";
import { createNutritionProfile, type NutritionGoal, type NutritionSex } from "@/lib/nutrition";
import { loadAppData, saveAppData } from "@/lib/storage";
import {
  AppData,
  createDefaultAppData,
} from "@/lib/types";
import {
  BatchExercisePreset,
  createMoveFromPreset,
} from "@/lib/workoutBatches";
import { themeForSlot } from "@/lib/workoutDayTheme";
import { refineImportedDays } from "@/lib/onboardingDayNames";
import { createCustomWorkoutDay } from "@/lib/workouts";

const EXTRACTION_PROMPT = `You extract structured onboarding data from an Armstrong coach chat transcript.

Return ONLY valid JSON — no markdown, no commentary — matching this schema:
{
  "profile": {
    "sex": "male" | "female",
    "age": number,
    "weightKg": number,
    "heightCm": number | null,
    "nutritionGoal": "bulk" | "cut",
    "fitnessGoal": string
  },
  "days": [
    {
      "slot": "push" | "pull" | "leg" | "abs" | "custom",
      "name": string,
      "exercises": [
        {
          "name": string,
          "sets": number,
          "reps": number,
          "restSeconds": number,
          "weightKg": number
        }
      ]
    }
  ]
}

Rules:
- Infer profile from everything the user shared (goal, gender, age, weight). Convert lbs to kg if needed.
- nutritionGoal: "bulk" for gain muscle/mass/weight; "cut" for lose fat/weight/leanness; default "bulk" if unclear.
- sex: infer from gender; default "male" only if truly unknown.
- heightCm: use stated height (convert ft/in to cm) or null if not given.
- Map training days to slots: push/chest/shoulders → push; pull/back → pull; legs/lower → leg; abs/core → abs.
- Day names MUST be precise gym labels: "Push Day", "Pull Day", "Leg Day", "Abs Day", "Leg & Core Day", or "Full Body" — NEVER "Upper Body A/B", "Lower Body A/B", "Day 1", or "Workout 1".
- Infer the correct precise name from exercises when the coach used vague labels.
- If two days share a type, differentiate with focus (e.g. "Push Day — Chest Focus", "Leg Day 2") — not letters A/B.
- Each exercise needs sets (default 3), reps (default 10), restSeconds (default 60), weightKg (0 if not specified).
- Include every exercise from the coach's latest workout plan.
- Use the most recent plan if the coach revised it.`;

export interface OnboardingImportExercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  weightKg: number;
}

export interface OnboardingImportDay {
  slot: "push" | "pull" | "leg" | "abs" | "custom";
  name: string;
  exercises: OnboardingImportExercise[];
}

export interface OnboardingImportProfile {
  sex: NutritionSex;
  age: number;
  weightKg: number;
  heightCm: number | null;
  nutritionGoal: NutritionGoal;
  fitnessGoal: string;
}

export interface OnboardingImportPayload {
  profile: OnboardingImportProfile;
  days: OnboardingImportDay[];
}

function parseJsonFromModelText(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenceMatch ? fenceMatch[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Coach plan could not be parsed. Try Restart and chat again.");
  }

  return JSON.parse(raw.slice(start, end + 1));
}

function asNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalizeSex(value: unknown): NutritionSex {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("female") || raw.includes("woman") || raw === "f") {
    return "female";
  }
  return "male";
}

function normalizeNutritionGoal(value: unknown): NutritionGoal {
  return String(value ?? "").toLowerCase() === "cut" ? "cut" : "bulk";
}

function normalizeSlot(value: unknown): OnboardingImportDay["slot"] {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "push" || raw === "pull" || raw === "leg" || raw === "abs") {
    return raw;
  }
  return "custom";
}

function normalizeExercise(value: unknown): OnboardingImportExercise | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = String(record.name ?? "").trim();
  if (!name) {
    return null;
  }

  return {
    name,
    sets: Math.round(asNumber(record.sets, 3)),
    reps: Math.round(asNumber(record.reps, 10)),
    restSeconds: Math.round(asNumber(record.restSeconds, 60)),
    weightKg: asNumber(record.weightKg, 0),
  };
}

function normalizeDay(value: unknown): OnboardingImportDay | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const exercises = Array.isArray(record.exercises)
    ? record.exercises
        .map(normalizeExercise)
        .filter((exercise): exercise is OnboardingImportExercise => exercise !== null)
    : [];

  if (exercises.length === 0) {
    return null;
  }

  const name = String(record.name ?? "Training Day").trim() || "Training Day";

  return {
    slot: normalizeSlot(record.slot),
    name,
    exercises,
  };
}

export function parseOnboardingImportPayload(raw: unknown): OnboardingImportPayload {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid plan data from coach.");
  }

  const record = raw as Record<string, unknown>;
  const profileRecord =
    record.profile && typeof record.profile === "object"
      ? (record.profile as Record<string, unknown>)
      : null;

  if (!profileRecord) {
    throw new Error("Missing profile in coach plan.");
  }

  const days = Array.isArray(record.days)
    ? record.days
        .map(normalizeDay)
        .filter((day): day is OnboardingImportDay => day !== null)
    : [];

  if (days.length === 0) {
    throw new Error("No workout days found in the coach plan.");
  }

  return {
    profile: {
      sex: normalizeSex(profileRecord.sex),
      age: Math.round(asNumber(profileRecord.age, 25)),
      weightKg: asNumber(profileRecord.weightKg, 70),
      heightCm:
        profileRecord.heightCm === null || profileRecord.heightCm === undefined
          ? null
          : Math.round(asNumber(profileRecord.heightCm, 0)) || null,
      nutritionGoal: normalizeNutritionGoal(profileRecord.nutritionGoal),
      fitnessGoal: String(profileRecord.fitnessGoal ?? "").trim() || "Training",
    },
    days: refineImportedDays(days),
  };
}

function estimateHeightCm(sex: NutritionSex, weightKg: number): number {
  const bmi = 22;
  const heightCm = Math.round(Math.sqrt(weightKg / bmi) * 100);
  const min = sex === "male" ? 160 : 150;
  const max = sex === "male" ? 200 : 185;
  return Math.min(Math.max(heightCm, min), max);
}

function toPreset(exercise: OnboardingImportExercise): BatchExercisePreset {
  return {
    name: exercise.name,
    setCount: exercise.sets,
    reps: exercise.reps,
    restSeconds: exercise.restSeconds,
    weightKg: exercise.weightKg,
  };
}

export function applyOnboardingImport(
  data: AppData,
  payload: OnboardingImportPayload,
): AppData {
  const heightCm =
    payload.profile.heightCm ?? estimateHeightCm(payload.profile.sex, payload.profile.weightKg);

  const customWorkouts = payload.days.map((day, index) => {
    const { theme, sticker } = themeForSlot(day.slot, day.name, index);
    const custom = createCustomWorkoutDay(day.name, { theme, sticker });
    custom.moves = day.exercises.map((exercise) =>
      createMoveFromPreset(toPreset(exercise)),
    );
    return custom;
  });

  const workoutSetupSeen: Record<string, boolean> = {};
  for (const workout of customWorkouts) {
    workoutSetupSeen[workout.id] = true;
  }

  return {
    ...data,
    coachPlanActive: true,
    workouts: createDefaultAppData().workouts,
    customWorkouts,
    activeSession: null,
    workoutSetupSeen,
    nutritionProfile: createNutritionProfile({
      weightKg: payload.profile.weightKg,
      heightCm,
      age: payload.profile.age,
      sex: payload.profile.sex,
      goal: payload.profile.nutritionGoal,
    }),
  };
}

function formatTranscript(messages: CoachChatMessage[]): string {
  return messages
    .map((message) => {
      const speaker = message.role === "coach" ? "Coach" : "User";
      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

export async function extractOnboardingImportPayload(
  messages: CoachChatMessage[],
): Promise<OnboardingImportPayload> {
  const transcript = formatTranscript(messages);
  const response = await sendCoachMessage(
    [],
    `Extract onboarding data from this transcript:\n\n${transcript}`,
    EXTRACTION_PROMPT,
  );

  return parseOnboardingImportPayload(parseJsonFromModelText(response));
}

export async function importOnboardingFromChat(
  messages: CoachChatMessage[],
): Promise<OnboardingImportPayload> {
  const payload = await extractOnboardingImportPayload(messages);
  const current = loadAppData();
  const next = applyOnboardingImport(current, payload);
  saveAppData(next);
  return payload;
}
