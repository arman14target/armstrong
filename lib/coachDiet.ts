import { AppData } from "@/lib/types";
import {
  createPlannedFoodEntry,
  formatGoalLabel,
  formatMealSlotLabel,
  MealSlot,
  PlannedMealInput,
  sumDailyNutrition,
  type FoodEntry,
  type NutritionProfile,
} from "@/lib/nutrition";
import { toLocalDateKey } from "@/lib/workoutCalendar";

export const DIET_PLAN_PREFIX = "[[DIET_PLAN:";
export const DIET_PLAN_SUFFIX = "]]";

export interface CoachDietPlan {
  meals: PlannedMealInput[];
  dietaryRestrictions?: string;
}

const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

const DIET_PLANNING_PROMPT = `

Diet plan generation:
- When the user asks for a meal plan, diet plan, or what to eat, generate a simple daily plan with breakfast, lunch, dinner, and 1–2 snacks
- Keep meals practical and easy to prep — common whole foods, not fancy recipes
- Target their daily protein goal from the nutrition context below; spread protein across meals
- Show each meal with estimated calories, protein (g), carbs (g), and fat (g)
- After presenting meals, ask if the plan looks okay and whether they have any allergies or food restrictions
- Only offer to add the plan to their food tracker after they confirm (or after you adjust for allergies)
- When they confirm and you are ready for them to tap "Add to food tracker", end your message with exactly one line:
  [[DIET_PLAN:{"meals":[{"name":"...","mealSlot":"breakfast","calories":400,"proteinG":35,"carbsG":40,"fatG":10},...],"dietaryRestrictions":"optional notes"}]]
- mealSlot must be one of: breakfast, lunch, dinner, snack
- Include 4–6 meals total; protein across meals should reach their daily protein target
- Never include the marker without asking permission in the same message
- Do not mention markers to the user — they are internal signals only`;

function formatNutritionContext(profile: NutritionProfile): string {
  return [
    `Goal: ${formatGoalLabel(profile.goal)}`,
    `Daily targets: ${profile.dailyCalories} kcal, ${profile.proteinG}g protein, ${profile.carbsG}g carbs, ${profile.fatG}g fat`,
    `Stats: ${profile.weightKg} kg, ${profile.heightCm} cm, age ${profile.age}, ${profile.sex}`,
  ].join("\n");
}

function formatTodayFoodLog(entries: FoodEntry[]): string {
  if (entries.length === 0) {
    return "Nothing logged today yet.";
  }

  const totals = sumDailyNutrition(entries);
  const lines = entries.map((entry) => {
    const slot = entry.mealSlot ? ` (${formatMealSlotLabel(entry.mealSlot)})` : "";
    const status = entry.fromPlan
      ? entry.completed
        ? " [plan, eaten]"
        : " [plan, not eaten]"
      : "";
    return `- ${entry.name}${slot}: ${entry.calories} kcal, P ${entry.proteinG}g${status}`;
  });

  return [
    ...lines,
    `Logged so far: ${totals.calories} kcal, ${totals.proteinG}g protein`,
  ].join("\n");
}

export function appendDietCoachPrompt(basePrompt: string, data: AppData): string {
  const todayKey = toLocalDateKey(new Date());
  const todayEntries = data.foodLog?.[todayKey] ?? [];

  if (!data.nutritionProfile) {
    return `${basePrompt}

Nutrition context:
User has not set up nutrition targets yet. If they ask for a meal plan, tell them to open the Food tracker tab first to set their stats and daily targets — you need those to hit their protein goal accurately.`;
  }

  return `${basePrompt}${DIET_PLANNING_PROMPT}

Nutrition context:
${formatNutritionContext(data.nutritionProfile)}

Today's food log (${todayKey}):
${formatTodayFoodLog(todayEntries)}`;
}

function normalizeMealSlot(value: unknown): MealSlot | undefined {
  const raw = String(value ?? "").toLowerCase().trim();
  if (MEAL_SLOTS.includes(raw as MealSlot)) {
    return raw as MealSlot;
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
  if (raw.includes("snack")) {
    return "snack";
  }

  return undefined;
}

function asPositiveNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.round(parsed);
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
    calories: asPositiveNumber(record.calories),
    proteinG: asPositiveNumber(record.proteinG),
    carbsG: asPositiveNumber(record.carbsG),
    fatG: asPositiveNumber(record.fatG),
  };
}

function normalizeDietPlan(value: unknown): CoachDietPlan | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const meals = Array.isArray(record.meals)
    ? record.meals
        .map(normalizeMeal)
        .filter((meal): meal is PlannedMealInput => meal !== null)
    : [];

  if (meals.length === 0) {
    return null;
  }

  const dietaryRestrictions =
    typeof record.dietaryRestrictions === "string"
      ? record.dietaryRestrictions.trim()
      : undefined;

  return {
    meals,
    dietaryRestrictions: dietaryRestrictions || undefined,
  };
}

export function parseDietPlan(content: string): CoachDietPlan | null {
  const start = content.indexOf(DIET_PLAN_PREFIX);
  if (start === -1) {
    return null;
  }

  const jsonStart = start + DIET_PLAN_PREFIX.length;
  const end = content.indexOf(DIET_PLAN_SUFFIX, jsonStart);
  if (end === -1) {
    return null;
  }

  try {
    return normalizeDietPlan(JSON.parse(content.slice(jsonStart, end)));
  } catch {
    return null;
  }
}

export function stripDietPlanMarker(content: string): string {
  const start = content.indexOf(DIET_PLAN_PREFIX);
  if (start === -1) {
    return content;
  }

  const jsonStart = start + DIET_PLAN_PREFIX.length;
  const end = content.indexOf(DIET_PLAN_SUFFIX, jsonStart);
  if (end === -1) {
    return content;
  }

  const before = content.slice(0, start).trimEnd();
  const after = content.slice(end + DIET_PLAN_SUFFIX.length).trimStart();

  if (before && after) {
    return `${before}\n${after}`;
  }

  return before || after;
}

export function canApplyDietPlan(data: AppData): boolean {
  return Boolean(data.nutritionProfile);
}

export function applyDietPlan(
  data: AppData,
  plan: CoachDietPlan,
  dateKey: string = toLocalDateKey(new Date()),
): AppData {
  const existingEntries = data.foodLog?.[dateKey] ?? [];
  const keptEntries = existingEntries.filter((entry) => !entry.fromPlan);
  const plannedEntries = plan.meals.map(createPlannedFoodEntry);

  return {
    ...data,
    foodLog: {
      ...data.foodLog,
      [dateKey]: [...keptEntries, ...plannedEntries],
    },
  };
}

export function describeDietPlan(plan: CoachDietPlan): string {
  const mealCount = plan.meals.length;
  const totalProtein = plan.meals.reduce((sum, meal) => sum + meal.proteinG, 0);
  return `Added ${mealCount} planned meals to your food tracker (${totalProtein}g protein across the plan). Check off each meal when you eat it.`;
}

export function getDietPlanApplyLabel(): string {
  return "Add to food tracker";
}

export function formatDietPlanPreview(plan: CoachDietPlan): string {
  return plan.meals
    .map((meal) => {
      const slot = meal.mealSlot ? `${formatMealSlotLabel(meal.mealSlot)}: ` : "";
      return `${slot}${meal.name} — ${meal.calories} kcal, P ${meal.proteinG}g`;
    })
    .join("\n");
}
