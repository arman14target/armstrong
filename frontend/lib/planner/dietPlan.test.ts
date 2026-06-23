import { describe, expect, it } from "vitest";
import { generateDietPlan } from "@/lib/planner/dietPlan";

describe("generateDietPlan", () => {
  it("returns four meals that roughly sum to daily targets", () => {
    const plan = generateDietPlan({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: "male",
      targetWeightKg: 83,
      experience: "intermediate",
    });

    expect(plan.meals).toHaveLength(4);
    const mealCalories = plan.meals.reduce((sum, m) => sum + m.calories, 0);
    expect(mealCalories).toBeGreaterThan(plan.targets.dailyCalories * 0.9);
    expect(mealCalories).toBeLessThan(plan.targets.dailyCalories * 1.1);
  });

  it("increases protein at pro tier", () => {
    const amateur = generateDietPlan({
      weightKg: 75,
      heightCm: 175,
      age: 25,
      sex: "female",
      targetWeightKg: 70,
      experience: "amateur",
    });
    const pro = generateDietPlan({
      weightKg: 75,
      heightCm: 175,
      age: 25,
      sex: "female",
      targetWeightKg: 70,
      experience: "pro",
    });

    expect(pro.targets.proteinG).toBeGreaterThan(amateur.targets.proteinG);
  });
});
