import { inferNutritionGoal, type NutritionGoal } from "@/lib/nutrition";
import type { ExperienceLevel } from "@/lib/planner/experience";

export interface GoalTimelineEstimate {
  weeks: number;
  targetChangeKg: number;
  weeklyRateKg: number;
  goalLabel: string;
}

export interface GoalTimelineInput {
  weightKg: number;
  targetWeightKg: number;
  experience: ExperienceLevel;
}

function weeklyChangeKg(goal: NutritionGoal, experience: ExperienceLevel): number {
  if (goal === "cut") {
    return {
      amateur: 0.5,
      intermediate: 0.65,
      advanced: 0.55,
      pro: 0.4,
    }[experience];
  }

  if (goal === "maintain") {
    return 0.15;
  }

  return {
    amateur: 0.25,
    intermediate: 0.35,
    advanced: 0.3,
    pro: 0.2,
  }[experience];
}

export function estimateGoalTimeline(input: GoalTimelineInput): GoalTimelineEstimate {
  const goal = inferNutritionGoal(input.weightKg, input.targetWeightKg);
  const weeklyRateKg = weeklyChangeKg(goal, input.experience);
  const targetChangeKg =
    Math.round(Math.abs(input.targetWeightKg - input.weightKg) * 10) / 10;
  const rawWeeks =
    targetChangeKg > 0 ? Math.ceil(targetChangeKg / weeklyRateKg) : 0;
  const weeks = Math.max(6, Math.min(rawWeeks || 6, 40));

  return {
    weeks,
    targetChangeKg,
    weeklyRateKg,
    goalLabel:
      goal === "cut"
        ? "fat loss"
        : goal === "bulk"
          ? "lean mass gain"
          : "maintenance",
  };
}
