import type { NutritionGoal } from "@/lib/nutrition";
import type { ExperienceLevel } from "@/lib/planner/experience";

export interface GoalTimelineEstimate {
  weeks: number;
  targetChangeKg: number;
  weeklyRateKg: number;
  goalLabel: string;
}

export interface GoalTimelineInput {
  weightKg: number;
  goal: NutritionGoal;
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

  return {
    amateur: 0.25,
    intermediate: 0.35,
    advanced: 0.3,
    pro: 0.2,
  }[experience];
}

function computeTargetChangeKg(
  weightKg: number,
  goal: NutritionGoal,
  experience: ExperienceLevel,
): number {
  if (goal === "cut") {
    const pct = experience === "amateur" ? 0.08 : 0.1;
    return Math.min(Math.max(weightKg * pct, 3), 12);
  }

  const pct = experience === "pro" ? 0.03 : 0.05;
  return Math.min(Math.max(weightKg * pct, 2), 8);
}

export function estimateGoalTimeline(input: GoalTimelineInput): GoalTimelineEstimate {
  const weeklyRateKg = weeklyChangeKg(input.goal, input.experience);
  const targetChangeKg =
    Math.round(computeTargetChangeKg(input.weightKg, input.goal, input.experience) * 10) / 10;
  const rawWeeks = Math.ceil(targetChangeKg / weeklyRateKg);
  const weeks = Math.max(6, Math.min(rawWeeks, 40));

  return {
    weeks,
    targetChangeKg,
    weeklyRateKg,
    goalLabel: input.goal === "cut" ? "fat loss" : "lean mass gain",
  };
}
