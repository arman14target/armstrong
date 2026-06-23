import { describe, expect, it } from "vitest";
import {
  calculateBmr,
  calculateNutritionTargets,
  countsTowardDailyTotals,
  createNutritionProfile,
  formatDailyMacroSummary,
  formatFoodEntryMacros,
  formatProfileMacroTargets,
  inferNutritionGoal,
  resolveTargetWeightKg,
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

describe("inferNutritionGoal", () => {
  it("returns cut when goal weight is below current", () => {
    expect(inferNutritionGoal(80, 75)).toBe("cut");
  });

  it("returns bulk when goal weight is above current", () => {
    expect(inferNutritionGoal(80, 85)).toBe("bulk");
  });

  it("returns maintain when weights match", () => {
    expect(inferNutritionGoal(80, 80)).toBe("maintain");
  });
});

describe("createNutritionProfile", () => {
  it("derives goal from target weight", () => {
    const profile = createNutritionProfile({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: "male",
      targetWeightKg: 75,
    });
    expect(profile.goal).toBe("cut");
    expect(profile.targetWeightKg).toBe(75);
  });

  it("resolves legacy target from stored goal", () => {
    expect(resolveTargetWeightKg({ weightKg: 80, goal: "bulk" })).toBe(83);
    expect(resolveTargetWeightKg({ weightKg: 80, goal: "cut" })).toBe(75);
  });
});

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
      targetWeightKg: 83,
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
      targetWeightKg: 30,
    });
    expect(t.dailyCalories).toBe(1200);
  });
});

describe("nutrition display", () => {
  const sample = {
    calories: 500,
    proteinG: 40,
    carbsG: 50,
    fatG: 12,
  };

  it("shows protein and carbs only in basic mode", () => {
    expect(formatFoodEntryMacros(sample, false)).toBe("P 40g · C 50g");
    expect(formatDailyMacroSummary(sample, false)).toBe("P 40g · C 50g");
    expect(
      formatProfileMacroTargets(
        { dailyCalories: 2200, proteinG: 160, carbsG: 220, fatG: 70 },
        false,
      ),
    ).toBe("P 160g · C 220g");
  });

  it("shows full macros in advanced mode", () => {
    expect(formatFoodEntryMacros(sample, true)).toBe(
      "500 kcal · P 40g · C 50g · F 12g",
    );
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
