import { describe, expect, it } from "vitest";
import {
  calculateBmr,
  calculateNutritionTargets,
  countsTowardDailyTotals,
  sumDailyNutrition,
} from "@/lib/nutrition";
import type { FoodEntry } from "@/lib/nutrition";

function food(partial: Partial<FoodEntry>): FoodEntry {
  return {
    id: "x",
    name: "f",
    calories: 100,
    proteinG: 10,
    carbsG: 5,
    fatG: 2,
    loggedAt: "2026-06-19T00:00:00.000Z",
    ...partial,
  };
}

describe("calculateBmr (Mifflin–St Jeor)", () => {
  const base = { weightKg: 80, heightCm: 180, age: 30 } as const;

  it("adds 5 for male", () => {
    // 10*80 + 6.25*180 - 5*30 + 5
    expect(calculateBmr({ ...base, sex: "male" })).toBe(1780);
  });

  it("subtracts 161 for female", () => {
    expect(calculateBmr({ ...base, sex: "female" })).toBe(1614);
  });
});

describe("calculateNutritionTargets", () => {
  it("computes a bulk target with protein at 2 g/kg", () => {
    const t = calculateNutritionTargets({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: "male",
      goal: "bulk",
    });
    // TDEE 1780*1.55 = 2759, +400 surplus = 3159
    expect(t.dailyCalories).toBe(3159);
    expect(t.proteinG).toBe(160);
    expect(t.fatG).toBe(88);
    expect(t.carbsG).toBe(432);
  });

  it("floors daily calories at 1200 for a tiny cut", () => {
    const t = calculateNutritionTargets({
      weightKg: 35,
      heightCm: 150,
      age: 25,
      sex: "female",
      goal: "cut",
    });
    expect(t.dailyCalories).toBe(1200);
  });
});

describe("countsTowardDailyTotals", () => {
  it("counts a normal logged food", () => {
    expect(countsTowardDailyTotals(food({}))).toBe(true);
  });

  it("counts a plan meal only once completed", () => {
    expect(countsTowardDailyTotals(food({ fromPlan: true }))).toBe(false);
    expect(
      countsTowardDailyTotals(food({ fromPlan: true, completed: true })),
    ).toBe(true);
  });
});

describe("sumDailyNutrition", () => {
  it("sums only entries that count", () => {
    const totals = sumDailyNutrition([
      food({ calories: 100, proteinG: 10 }),
      food({ calories: 200, proteinG: 20, fromPlan: true }), // not eaten -> excluded
      food({ calories: 300, proteinG: 30, fromPlan: true, completed: true }),
    ]);
    expect(totals.calories).toBe(400);
    expect(totals.proteinG).toBe(40);
  });
});
