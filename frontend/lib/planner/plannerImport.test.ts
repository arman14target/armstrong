import { describe, expect, it } from "vitest";
import { createDefaultAppData } from "@/lib/types";
import {
  applyDietPlannerImport,
  applyGymPlannerImport,
  dietPlannerToCoachDietPlan,
  gymPlannerToCoachGymPlan,
  parsePlannerReps,
} from "@/lib/planner/plannerImport";
import { generateDietPlan } from "@/lib/planner/dietPlan";
import { generateGymPlan } from "@/lib/planner/gymPlan";

describe("parsePlannerReps", () => {
  it("averages rep ranges", () => {
    expect(parsePlannerReps("8-12")).toBe(10);
    expect(parsePlannerReps("4-6")).toBe(5);
  });

  it("parses single values", () => {
    expect(parsePlannerReps("5")).toBe(5);
  });
});

describe("planner import", () => {
  it("maps diet plan into nutrition profile and planned meals", () => {
    const inputs = {
      weightKg: 80,
      heightCm: 180,
      age: 30,
      sex: "male" as const,
      goal: "bulk" as const,
      experience: "intermediate" as const,
    };
    const plan = generateDietPlan(inputs);
    const coachPlan = dietPlannerToCoachDietPlan(plan);

    expect(coachPlan.meals).toHaveLength(4);
    expect(coachPlan.meals[0]?.mealSlot).toBe("breakfast");

    const next = applyDietPlannerImport(createDefaultAppData(), inputs, plan);
    expect(next.nutritionProfile?.dailyCalories).toBe(plan.targets.dailyCalories);

    const today = Object.keys(next.foodLog ?? {})[0];
    expect(next.foodLog?.[today]?.filter((entry) => entry.fromPlan)).toHaveLength(4);
  });

  it("maps gym plan into custom workout days", () => {
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
    const coachPlan = gymPlannerToCoachGymPlan(plan);

    expect(coachPlan.days).toHaveLength(4);
    expect(coachPlan.days[0]?.exercises[0]?.reps).toBeTypeOf("number");

    const next = applyGymPlannerImport(createDefaultAppData(), plan);
    expect(next.coachPlanActive).toBe(true);
    expect(next.customWorkouts).toHaveLength(4);
    expect(next.customWorkouts[0]?.moves.length).toBeGreaterThan(0);
  });
});
