import i18n from "@/lib/i18n";
import {
  AppData,
  CustomWorkoutDay,
  Move,
  WORKOUT_TYPES,
  WorkoutDayEntry,
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
    return i18n.t(`workout.${id}`);
  }

  return findCustomWorkout(data, id)?.name ?? i18n.t("common.workout");
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

export function updateCustomWorkoutName(
  data: AppData,
  workoutId: string,
  name: string,
): AppData {
  const trimmed = name.trim();
  if (!trimmed || !findCustomWorkout(data, workoutId)) {
    return data;
  }

  return {
    ...data,
    customWorkouts: data.customWorkouts.map((workout) =>
      workout.id === workoutId ? { ...workout, name: trimmed } : workout,
    ),
  };
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

export function getWorkoutDatesForMonth(
  log: Record<string, WorkoutDayEntry[]> | undefined,
  year: number,
  month: number,
): Set<string> {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return new Set(
    Object.keys(log ?? {}).filter(
      (dateKey) =>
        dateKey.startsWith(monthPrefix) && (log?.[dateKey]?.length ?? 0) > 0,
    ),
  );
}

export function getWorkoutEntriesForDate(
  log: Record<string, WorkoutDayEntry[]> | undefined,
  dateKey: string,
): WorkoutDayEntry[] {
  return log?.[dateKey] ?? [];
}

export function logWorkoutDayEntry(
  log: Record<string, WorkoutDayEntry[]> | undefined,
  entry: WorkoutDayEntry,
): Record<string, WorkoutDayEntry[]> {
  const dateKey = toLocalDateKey(new Date(entry.completedAt));
  const dayEntries = log?.[dateKey] ?? [];

  return {
    ...log,
    [dateKey]: [...dayEntries, entry],
  };
}

export function migrateWorkoutDayLog(data: AppData): Record<string, WorkoutDayEntry[]> {
  if (data.workoutDayLog && Object.keys(data.workoutDayLog).length > 0) {
    return data.workoutDayLog;
  }

  const log: Record<string, WorkoutDayEntry[]> = {};

  for (const type of WORKOUT_TYPES) {
    const completedAt = data.workouts[type].lastCompletedAt;
    if (!completedAt) {
      continue;
    }

    const dateKey = toLocalDateKey(new Date(completedAt));
    log[dateKey] = [
      ...(log[dateKey] ?? []),
      {
        workoutId: type,
        completedAt,
        durationSeconds: data.workouts[type].lastSessionDurationSeconds,
      },
    ];
  }

  for (const workout of data.customWorkouts ?? []) {
    if (!workout.lastCompletedAt) {
      continue;
    }

    const dateKey = toLocalDateKey(new Date(workout.lastCompletedAt));
    log[dateKey] = [
      ...(log[dateKey] ?? []),
      {
        workoutId: workout.id,
        completedAt: workout.lastCompletedAt,
        durationSeconds: workout.lastSessionDurationSeconds,
      },
    ];
  }

  return log;
}
