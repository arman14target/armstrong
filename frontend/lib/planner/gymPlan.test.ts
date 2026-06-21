import { describe, expect, it } from "vitest";
import { generateGymPlan } from "@/lib/planner/gymPlan";

describe("generateGymPlan", () => {
  it("builds the right number of training days", () => {
    const plan = generateGymPlan({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: "male",
      experience: "intermediate",
      daysPerWeek: 4,
      focus: "hypertrophy",
      equipment: "full_gym",
    });

    expect(plan.days).toHaveLength(4);
    expect(plan.splitName).toContain("Upper");
    expect(plan.days.map((day) => day.name)).toEqual([
      "Push & Pull",
      "Squats & Hinges",
      "Shoulders & Back",
      "Quads & Glutes",
    ]);
  });

  it("swaps to home alternatives", () => {
    const plan = generateGymPlan({
      weightKg: 70,
      heightCm: 170,
      age: 28,
      sex: "female",
      experience: "amateur",
      daysPerWeek: 3,
      focus: "balanced",
      equipment: "home",
    });

    const names = plan.days.flatMap((d) => d.exercises.map((e) => e.name));
    expect(names.some((n) => /push-up|goblet|band/i.test(n))).toBe(true);
  });

  it("assigns more weekly sets at pro tier", () => {
    const amateur = generateGymPlan({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: "male",
      experience: "amateur",
      daysPerWeek: 4,
      focus: "hypertrophy",
      equipment: "full_gym",
    });
    const pro = generateGymPlan({
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: "male",
      experience: "pro",
      daysPerWeek: 4,
      focus: "hypertrophy",
      equipment: "full_gym",
    });

    expect(pro.weeklySets).toBeGreaterThan(amateur.weeklySets);
  });
});
