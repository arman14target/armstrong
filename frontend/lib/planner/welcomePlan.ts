import type { AppData } from "@/lib/types";
import type { NutritionSex } from "@/lib/nutrition";
import {
  applyDietPlannerImport,
  applyGymPlannerImport,
} from "@/lib/planner/plannerImport";
import type { WeightUnit } from "@/lib/types";
import {
  DEFAULT_GYM_INPUTS,
  generateGymPlan,
  type DaysPerWeek,
  type GymEquipment,
  type GymFocus,
  type GymPlanInputs,
  type GymPlanResult,
} from "@/lib/planner/gymPlan";
import { DEFAULT_DIET_INPUTS, generateDietPlan } from "@/lib/planner/dietPlan";
import type { ExperienceLevel } from "@/lib/planner/experience";

export interface WelcomePlanInputs {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: NutritionSex;
  targetWeightKg: number;
  weightUnit: WeightUnit;
  experience: ExperienceLevel;
  daysPerWeek: DaysPerWeek;
  focus: GymFocus;
  equipment: GymEquipment;
}

export const DEFAULT_WELCOME_INPUTS: WelcomePlanInputs = {
  weightKg: DEFAULT_GYM_INPUTS.weightKg,
  heightCm: DEFAULT_GYM_INPUTS.heightCm,
  age: DEFAULT_GYM_INPUTS.age,
  sex: DEFAULT_GYM_INPUTS.sex,
  experience: DEFAULT_GYM_INPUTS.experience,
  daysPerWeek: DEFAULT_GYM_INPUTS.daysPerWeek,
  focus: DEFAULT_GYM_INPUTS.focus,
  equipment: DEFAULT_GYM_INPUTS.equipment,
  targetWeightKg: DEFAULT_DIET_INPUTS.targetWeightKg,
  weightUnit: "kg",
};

export function toGymPlanInputs(inputs: WelcomePlanInputs): GymPlanInputs {
  return {
    weightKg: inputs.weightKg,
    heightCm: inputs.heightCm,
    age: inputs.age,
    sex: inputs.sex,
    experience: inputs.experience,
    daysPerWeek: inputs.daysPerWeek,
    focus: inputs.focus,
    equipment: inputs.equipment,
  };
}

export function defaultManualExercisePlan(): GymPlanResult {
  return generateGymPlan(DEFAULT_GYM_INPUTS);
}

export function applyDefaultManualExercisePlan(data: AppData): AppData {
  return applyGymPlannerImport(data, defaultManualExercisePlan());
}

export function applyWelcomePlanImport(
  data: AppData,
  inputs: WelcomePlanInputs,
): AppData {
  const gymPlan = generateGymPlan(toGymPlanInputs(inputs));
  const dietPlan = generateDietPlan({
    weightKg: inputs.weightKg,
    heightCm: inputs.heightCm,
    age: inputs.age,
    sex: inputs.sex,
    targetWeightKg: inputs.targetWeightKg,
    experience: inputs.experience,
  });

  const withWorkout = applyGymPlannerImport(data, gymPlan);
  const withDiet = applyDietPlannerImport(withWorkout, {
    weightKg: inputs.weightKg,
    heightCm: inputs.heightCm,
    age: inputs.age,
    sex: inputs.sex,
    targetWeightKg: inputs.targetWeightKg,
    experience: inputs.experience,
  }, dietPlan);

  return {
    ...withDiet,
    weightUnit: inputs.weightUnit,
  };
}
