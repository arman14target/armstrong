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

export function createCustomWorkoutDay(name: string): CustomWorkoutDay {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    moves: [],
  };
}
