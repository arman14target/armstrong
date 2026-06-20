import type { FoodEntry } from "./nutrition";
import type { AppData, WorkoutDayEntry } from "./types";
import { getWorkoutLabel } from "./workouts";

export type ActivityHistoryWorkoutItem = {
  kind: "workout";
  dateKey: string;
  timestamp: string;
  workoutId: string;
  label: string;
  durationSeconds?: number;
};

export type ActivityHistoryFoodItem = {
  kind: "food";
  dateKey: string;
  timestamp: string;
  entryId: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fromPlan?: boolean;
  completed?: boolean;
};

export type ActivityHistoryItem =
  | ActivityHistoryWorkoutItem
  | ActivityHistoryFoodItem;

export function buildActivityHistory(
  data: AppData,
  foodLog: Record<string, FoodEntry[]> | undefined,
  workoutDayLog: Record<string, WorkoutDayEntry[]> | undefined,
): ActivityHistoryItem[] {
  const items: ActivityHistoryItem[] = [];

  for (const [dateKey, entries] of Object.entries(workoutDayLog ?? {})) {
    for (const entry of entries) {
      items.push({
        kind: "workout",
        dateKey,
        timestamp: entry.completedAt,
        workoutId: entry.workoutId,
        label: getWorkoutLabel(data, entry.workoutId),
        durationSeconds: entry.durationSeconds,
      });
    }
  }

  for (const [dateKey, entries] of Object.entries(foodLog ?? {})) {
    for (const entry of entries) {
      items.push({
        kind: "food",
        dateKey,
        timestamp: entry.loggedAt,
        entryId: entry.id,
        name: entry.name,
        calories: entry.calories,
        proteinG: entry.proteinG,
        carbsG: entry.carbsG,
        fatG: entry.fatG,
        fromPlan: entry.fromPlan,
        completed: entry.completed,
      });
    }
  }

  return items.sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  );
}
