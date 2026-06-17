export type NutritionGoal = "bulk" | "cut";
export type NutritionSex = "male" | "female";

export interface NutritionInputs {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: NutritionSex;
  goal: NutritionGoal;
}

export interface NutritionTargets {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionProfile extends NutritionInputs, NutritionTargets {
  calculatedAt: string;
}

/** Moderately active — typical for regular gym training (3–5 days/week). */
const ACTIVITY_MULTIPLIER = 1.55;
const BULK_SURPLUS_KCAL = 400;
const CUT_DEFICIT_KCAL = 500;

const PROTEIN_G_PER_KG: Record<NutritionGoal, number> = {
  bulk: 2,
  cut: 2.2,
};

const FAT_CALORIE_RATIO = 0.25;

function round(value: number): number {
  return Math.round(value);
}

/** Mifflin–St Jeor basal metabolic rate (kcal/day). */
export function calculateBmr(inputs: Pick<NutritionInputs, "weightKg" | "heightCm" | "age" | "sex">): number {
  const { weightKg, heightCm, age, sex } = inputs;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTdee(
  inputs: Pick<NutritionInputs, "weightKg" | "heightCm" | "age" | "sex">,
): number {
  return calculateBmr(inputs) * ACTIVITY_MULTIPLIER;
}

export function calculateNutritionTargets(inputs: NutritionInputs): NutritionTargets {
  const tdee = calculateTdee(inputs);
  const goalCalories =
    inputs.goal === "bulk"
      ? tdee + BULK_SURPLUS_KCAL
      : tdee - CUT_DEFICIT_KCAL;

  const dailyCalories = round(Math.max(goalCalories, 1200));

  const proteinG = round(inputs.weightKg * PROTEIN_G_PER_KG[inputs.goal]);
  const proteinCalories = proteinG * 4;

  const fatCalories = dailyCalories * FAT_CALORIE_RATIO;
  const fatG = round(fatCalories / 9);

  const carbCalories = Math.max(
    0,
    dailyCalories - proteinCalories - fatG * 9,
  );
  const carbsG = round(carbCalories / 4);

  return {
    dailyCalories,
    proteinG,
    carbsG,
    fatG,
  };
}

export function createNutritionProfile(inputs: NutritionInputs): NutritionProfile {
  return {
    ...inputs,
    ...calculateNutritionTargets(inputs),
    calculatedAt: new Date().toISOString(),
  };
}

export function formatGoalLabel(goal: NutritionGoal): string {
  return goal === "bulk" ? "Bulk" : "Cut";
}

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
  /** From a coach-generated diet plan — counts toward totals only when completed. */
  fromPlan?: boolean;
  completed?: boolean;
  mealSlot?: MealSlot;
}

export interface PlannedMealInput {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealSlot?: MealSlot;
}

export interface DailyNutritionTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function countsTowardDailyTotals(entry: FoodEntry): boolean {
  if (entry.fromPlan) {
    return entry.completed === true;
  }

  return true;
}

export function sumDailyNutrition(entries: FoodEntry[]): DailyNutritionTotals {
  return entries.filter(countsTowardDailyTotals).reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      proteinG: totals.proteinG + entry.proteinG,
      carbsG: totals.carbsG + entry.carbsG,
      fatG: totals.fatG + entry.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function sumPlannedMealNutrition(entries: FoodEntry[]): DailyNutritionTotals {
  return entries
    .filter((entry) => entry.fromPlan)
    .reduce(
      (totals, entry) => ({
        calories: totals.calories + entry.calories,
        proteinG: totals.proteinG + entry.proteinG,
        carbsG: totals.carbsG + entry.carbsG,
        fatG: totals.fatG + entry.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
}

export function formatMealSlotLabel(slot: MealSlot): string {
  return {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
  }[slot];
}

export function createPlannedFoodEntry(
  data: PlannedMealInput,
): FoodEntry {
  return {
    ...data,
    id: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
    fromPlan: true,
    completed: false,
  };
}

export function createFoodEntry(
  data: Pick<FoodEntry, "name" | "calories" | "proteinG" | "carbsG" | "fatG">,
): FoodEntry {
  return {
    ...data,
    id: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
  };
}

export function getFoodDatesForMonth(
  foodLog: Record<string, FoodEntry[]> | undefined,
  year: number,
  month: number,
): Set<string> {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return new Set(
    Object.keys(foodLog ?? {}).filter(
      (dateKey) =>
        dateKey.startsWith(monthPrefix) && (foodLog?.[dateKey]?.length ?? 0) > 0,
    ),
  );
}
