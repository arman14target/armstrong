import {
  AppData,
  CustomWorkoutDay,
  Move,
  WORKOUT_LABELS,
  WORKOUT_TYPES,
  WorkoutTemplate,
  WorkoutType,
  isWorkoutType,
} from "@/lib/types";
import type { WorkoutDayTheme } from "@/lib/workoutDayTheme";
import { toLocalDateKey } from "@/lib/workoutCalendar";

export function isBuiltinWorkoutType(id: string): id is WorkoutType {
  return isWorkoutType(id);
}

export function findCustomWorkout(
  data: AppData,
  id: string,
): CustomWorkoutDay | undefined {
  return data.customWorkouts.find((workout) => workout.id === id);
}

export function isValidWorkoutId(data: AppData, id: string): boolean {
  return isBuiltinWorkoutType(id) || findCustomWorkout(data, id) !== undefined;
}

export function getWorkoutLabel(data: AppData, id: string): string {
  if (isBuiltinWorkoutType(id)) {
    return WORKOUT_LABELS[id];
  }

  return findCustomWorkout(data, id)?.name ?? "Workout";
}

export function getWorkoutTemplate(
  data: AppData,
  id: string,
): WorkoutTemplate | undefined {
  if (isBuiltinWorkoutType(id)) {
    return data.workouts[id];
  }

  const custom = findCustomWorkout(data, id);
  if (!custom) {
    return undefined;
  }

  return {
    moves: custom.moves,
    lastCompletedAt: custom.lastCompletedAt,
    lastSessionDurationSeconds: custom.lastSessionDurationSeconds,
  };
}

export function listAllWorkoutIds(data: AppData): string[] {
  return [...WORKOUT_TYPES, ...data.customWorkouts.map((workout) => workout.id)];
}

export function countLoggedWorkouts(data: AppData): number {
  const builtinLogged = WORKOUT_TYPES.filter(
    (type) => data.workouts[type].lastCompletedAt,
  ).length;
  const customLogged = data.customWorkouts.filter(
    (workout) => workout.lastCompletedAt,
  ).length;

  return builtinLogged + customLogged;
}

export function applyWorkoutTemplate(
  data: AppData,
  id: string,
  template: WorkoutTemplate,
): AppData {
  if (isBuiltinWorkoutType(id)) {
    return {
      ...data,
      workouts: {
        ...data.workouts,
        [id]: template,
      },
    };
  }

  return {
    ...data,
    customWorkouts: data.customWorkouts.map((workout) =>
      workout.id === id
        ? {
            ...workout,
            moves: template.moves,
            lastCompletedAt: template.lastCompletedAt,
            lastSessionDurationSeconds: template.lastSessionDurationSeconds,
          }
        : workout,
    ),
  };
}

export function updateWorkoutMoves(
  data: AppData,
  id: string,
  updater: (moves: Move[]) => Move[],
): AppData {
  const template = getWorkoutTemplate(data, id);
  if (!template) {
    return data;
  }

  return applyWorkoutTemplate(data, id, {
    ...template,
    moves: updater(template.moves),
  });
}

export function createCustomWorkoutDay(
  name: string,
  options?: { theme?: WorkoutDayTheme; sticker?: string },
): CustomWorkoutDay {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    moves: [],
    theme: options?.theme,
    sticker: options?.sticker,
  };
}

export function collectLegacyCompletionDates(data: AppData): string[] {
  const dates = new Set<string>();

  for (const type of WORKOUT_TYPES) {
    const completedAt = data.workouts[type].lastCompletedAt;
    if (completedAt) {
      dates.add(toLocalDateKey(new Date(completedAt)));
    }
  }

  for (const workout of data.customWorkouts ?? []) {
    if (workout.lastCompletedAt) {
      dates.add(toLocalDateKey(new Date(workout.lastCompletedAt)));
    }
  }

  return [...dates];
}

export function addCompletionDate(
  dates: string[] | undefined,
  completedAt: string,
): string[] {
  const dateKey = toLocalDateKey(new Date(completedAt));
  const current = dates ?? [];

  if (current.includes(dateKey)) {
    return current;
  }

  return [...current, dateKey];
}

export function getCompletionDatesForMonth(
  dates: string[] | undefined,
  year: number,
  month: number,
): Set<string> {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return new Set(
    (dates ?? []).filter((dateKey) => dateKey.startsWith(monthPrefix)),
  );
}
