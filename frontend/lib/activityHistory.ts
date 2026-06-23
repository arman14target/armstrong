import {
  countsTowardDailyTotals,
  sumDailyNutrition,
  type DailyNutritionTotals,
} from "./nutrition";
import type { AppData, WorkoutDayEntry } from "./types";
import { getWorkoutLabel } from "./workouts";

export type ActivityDayWorkoutSummary = {
  workoutId: string;
  label: string;
  durationSeconds?: number;
  completedAt: string;
  exercises: string[];
};

export type ActivityDaySummary = {
  dateKey: string;
  workouts: ActivityDayWorkoutSummary[];
  food: DailyNutritionTotals | null;
  foodNames: string[];
};

function exerciseNamesFromEntry(entry: WorkoutDayEntry): string[] {
  const names = entry.snapshot?.exercises.map((exercise) => exercise.name) ?? [];
  return [...new Set(names)];
}

export function buildActivityDaySummaries(
  data: AppData,
  foodLog: AppData["foodLog"],
  workoutDayLog: AppData["workoutDayLog"],
): ActivityDaySummary[] {
  const byDate = new Map<string, ActivityDaySummary>();

  const ensureDay = (dateKey: string): ActivityDaySummary => {
    const existing = byDate.get(dateKey);
    if (existing) {
      return existing;
    }

    const created: ActivityDaySummary = {
      dateKey,
      workouts: [],
      food: null,
      foodNames: [],
    };
    byDate.set(dateKey, created);
    return created;
  };

  for (const [dateKey, entries] of Object.entries(workoutDayLog ?? {})) {
    for (const entry of entries) {
      const day = ensureDay(dateKey);
      day.workouts.push({
        workoutId: entry.workoutId,
        label: getWorkoutLabel(data, entry.workoutId),
        durationSeconds: entry.durationSeconds,
        completedAt: entry.completedAt,
        exercises: exerciseNamesFromEntry(entry),
      });
    }
  }

  for (const [dateKey, entries] of Object.entries(foodLog ?? {})) {
    const eaten = entries.filter(countsTowardDailyTotals);
    if (eaten.length === 0) {
      continue;
    }

    const day = ensureDay(dateKey);
    day.food = sumDailyNutrition(eaten);
    day.foodNames = eaten.map((entry) => entry.name);
  }

  return [...byDate.values()]
    .filter((day) => day.workouts.length > 0 || day.food !== null)
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
}
