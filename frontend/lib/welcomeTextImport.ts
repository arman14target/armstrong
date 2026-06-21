import type { CoachDietPlan } from "@/lib/coachDiet";
import type { CoachGymPlan } from "@/lib/coachWorkout";
import { sendCoachMessage } from "@/lib/gemini";
import { refineImportedDays, type ImportDay } from "@/lib/onboardingDayNames";
import type { PlannedMealInput } from "@/lib/nutrition";

const GYM_EXTRACTION_PROMPT = `You extract a full workout program from free-form user text for the Armstrong gym app.

Return ONLY valid JSON — no markdown, no commentary — matching this schema:
{
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
- Parse every training day the user describes. If they only list exercises without day labels, group into one "Full Body" day.
- Map training days to slots: push/chest/shoulders → push; pull/back → pull; legs/lower → leg; abs/core → abs.
- Day names MUST be precise gym labels: "Push Day", "Pull Day", "Leg Day", "Abs Day", or "Full Body" — never "Day 1" or "Upper Body A/B".
- Each exercise needs sets (default 3), reps (default 10), restSeconds (default 90), weightKg (0 if not specified).
- Convert lbs to kg when needed.
- Include every exercise the user mentioned. Do not invent exercises they did not describe.`;

const DIET_EXTRACTION_PROMPT = `You extract a daily meal plan from free-form user text for the Armstrong gym app.

Return ONLY valid JSON — no markdown, no commentary — matching this schema:
{
  "meals": [
    {
      "name": string,
      "mealSlot": "breakfast" | "lunch" | "dinner" | "snack",
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number
    }
  ]
}

Rules:
- Parse every meal the user describes into the list.
- mealSlot must be breakfast, lunch, dinner, or snack.
- Include 3–6 meals when possible.
- Estimate calories and macros when the user only names foods.
- Use reasonable whole-food portions.
- Do not invent meals the user did not mention.`;

function parseJsonFromModelText(text: string): unknown {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenceMatch ? fenceMatch[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not parse your plan. Try rephrasing it.");
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
  return Math.round(parsed);
}

function normalizeSlot(value: unknown): ImportDay["slot"] {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "push" || raw === "pull" || raw === "leg" || raw === "abs") {
    return raw;
  }
  return "custom";
}

function normalizeExercise(value: unknown): ImportDay["exercises"][number] | null {
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
    sets: Math.round(asPositiveNumber(record.sets, 3)),
    reps: Math.round(asPositiveNumber(record.reps, 10)),
    restSeconds: Math.round(asPositiveNumber(record.restSeconds, 90)),
    weightKg: asNonNegativeNumber(record.weightKg, 0),
  };
}

function normalizeDay(value: unknown): ImportDay | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const exercises = Array.isArray(record.exercises)
    ? record.exercises
        .map(normalizeExercise)
        .filter((exercise): exercise is ImportDay["exercises"][number] => exercise !== null)
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

function normalizeMealSlot(value: unknown): PlannedMealInput["mealSlot"] {
  const raw = String(value ?? "").toLowerCase().trim();
  if (raw === "breakfast" || raw === "lunch" || raw === "dinner" || raw === "snack") {
    return raw;
  }
  if (raw.includes("breakfast")) {
    return "breakfast";
  }
  if (raw.includes("lunch")) {
    return "lunch";
  }
  if (raw.includes("dinner") || raw.includes("supper")) {
    return "dinner";
  }
  return "snack";
}

function normalizeMeal(value: unknown): PlannedMealInput | null {
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
    mealSlot: normalizeMealSlot(record.mealSlot),
    calories: asNonNegativeNumber(record.calories, 0),
    proteinG: asNonNegativeNumber(record.proteinG, 0),
    carbsG: asNonNegativeNumber(record.carbsG, 0),
    fatG: asNonNegativeNumber(record.fatG, 0),
  };
}

function parseGymPlanPayload(raw: unknown): CoachGymPlan {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid workout data from import.");
  }

  const record = raw as Record<string, unknown>;
  const days = Array.isArray(record.days)
    ? record.days
        .map(normalizeDay)
        .filter((day): day is ImportDay => day !== null)
    : [];

  if (days.length === 0) {
    throw new Error("No workout days found. Describe at least one training day.");
  }

  const refinedDays = refineImportedDays(days);

  return {
    days: refinedDays.map((day) => ({
      name: day.name,
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds,
      })),
    })),
  };
}

function parseDietPlanPayload(raw: unknown): CoachDietPlan {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid meal data from import.");
  }

  const record = raw as Record<string, unknown>;
  const meals = Array.isArray(record.meals)
    ? record.meals
        .map(normalizeMeal)
        .filter((meal): meal is PlannedMealInput => meal !== null)
    : [];

  if (meals.length === 0) {
    throw new Error("No meals found. Describe at least one meal.");
  }

  return { meals };
}

export async function extractGymPlanFromText(text: string): Promise<CoachGymPlan> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Describe your exercise program before continuing.");
  }

  const response = await sendCoachMessage(
    [],
    `Extract the workout program from this user description:\n\n${trimmed}`,
    GYM_EXTRACTION_PROMPT,
  );

  return parseGymPlanPayload(parseJsonFromModelText(response));
}

export async function extractDietPlanFromText(text: string): Promise<CoachDietPlan> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Describe your meal plan before continuing.");
  }

  const response = await sendCoachMessage(
    [],
    `Extract the daily meal plan from this user description:\n\n${trimmed}`,
    DIET_EXTRACTION_PROMPT,
  );

  return parseDietPlanPayload(parseJsonFromModelText(response));
}
