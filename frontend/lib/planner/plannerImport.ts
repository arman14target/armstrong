import { applyDietPlan, type CoachDietPlan } from "@/lib/coachDiet";
import { applyGymPlan, type CoachGymPlan } from "@/lib/coachWorkout";
import { createNutritionProfile, type PlannedMealInput } from "@/lib/nutrition";
import type { DietPlanInputs, DietPlanResult } from "@/lib/planner/dietPlan";
import type { GymPlanResult } from "@/lib/planner/gymPlan";
import { loadAppData, saveAppData } from "@/lib/storage";
import type { AppData } from "@/lib/types";
import { scheduleCloudSync } from "@/lib/cloudSyncScheduler";

export function parsePlannerReps(reps: string): number {
  const range = reps.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) {
    return Math.round((Number(range[1]) + Number(range[2])) / 2);
  }

  const single = reps.match(/(\d+)/);
  return single ? Number(single[1]) : 10;
}

export function dietPlannerToCoachDietPlan(plan: DietPlanResult): CoachDietPlan {
  const meals: PlannedMealInput[] = plan.meals.map((meal) => ({
    name: meal.foods.join(" · "),
    mealSlot: meal.slot,
    calories: meal.calories,
    proteinG: meal.proteinG,
    carbsG: meal.carbsG,
    fatG: meal.fatG,
  }));

  return { meals };
}

export function gymPlannerToCoachGymPlan(plan: GymPlanResult): CoachGymPlan {
  return {
    days: plan.days.map((day) => ({
      name: day.name,
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: parsePlannerReps(exercise.reps),
        restSeconds: exercise.restSeconds,
      })),
    })),
  };
}

export function applyDietPlannerImport(
  data: AppData,
  inputs: DietPlanInputs,
  plan: DietPlanResult,
): AppData {
  const withProfile: AppData = {
    ...data,
    nutritionProfile: createNutritionProfile({
      weightKg: inputs.weightKg,
      heightCm: inputs.heightCm,
      age: inputs.age,
      sex: inputs.sex,
      goal: inputs.goal,
    }),
  };

  return applyDietPlan(withProfile, dietPlannerToCoachDietPlan(plan));
}

export function applyGymPlannerImport(data: AppData, plan: GymPlanResult): AppData {
  return applyGymPlan(data, gymPlannerToCoachGymPlan(plan));
}

export function saveDietPlannerImport(inputs: DietPlanInputs, plan: DietPlanResult): AppData {
  const next = applyDietPlannerImport(loadAppData(), inputs, plan);
  saveAppData(next);
  scheduleCloudSync();
  return next;
}

export function saveGymPlannerImport(plan: GymPlanResult): AppData {
  const next = applyGymPlannerImport(loadAppData(), plan);
  saveAppData(next);
  scheduleCloudSync();
  return next;
}
