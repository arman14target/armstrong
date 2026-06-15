export type WorkoutType = "push" | "leg" | "abs" | "pull";

export const WORKOUT_TYPES: WorkoutType[] = ["push", "leg", "abs", "pull"];

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  push: "Push Day",
  leg: "Leg Day",
  abs: "Abs Day",
  pull: "Pull Day",
};

export interface SetConfig {
  id: string;
  restSeconds: number;
  lastWeight?: number;
  lastReps?: number;
}

export interface Move {
  id: string;
  name: string;
  sets: SetConfig[];
}

export interface WorkoutTemplate {
  moves: Move[];
  lastCompletedAt?: string;
  lastSessionDurationSeconds?: number;
}

export interface CustomWorkoutDay extends WorkoutTemplate {
  id: string;
  name: string;
}

export interface ActiveSession {
  workoutType: string;
  startedAt: string;
  setWeights: Record<string, number>;
  setReps: Record<string, number>;
  completedSetIds: string[];
  activeRestSetId?: string;
  restEndsAt?: string;
  /** Workout template snapshot at session start — used to revert on cancel. */
  baselineWorkout: WorkoutTemplate;
}

import type { NutritionProfile } from "./nutrition";

export interface AppData {
  workouts: Record<WorkoutType, WorkoutTemplate>;
  customWorkouts: CustomWorkoutDay[];
  activeSession: ActiveSession | null;
  workoutSetupSeen?: Partial<Record<string, boolean>>;
  /** Local YYYY-MM-DD dates when any workout was finished. */
  workoutCompletionDates?: string[];
  nutritionProfile?: NutritionProfile;
}

export function isWorkoutType(value: string): value is WorkoutType {
  return WORKOUT_TYPES.includes(value as WorkoutType);
}

export function createDefaultSet(): SetConfig {
  return {
    id: crypto.randomUUID(),
    restSeconds: 90,
  };
}

export function createDefaultMove(name: string): Move {
  return {
    id: crypto.randomUUID(),
    name,
    sets: [createDefaultSet(), createDefaultSet(), createDefaultSet()],
  };
}

export function createDefaultAppData(): AppData {
  return {
    workouts: {
      push: { moves: [] },
      leg: { moves: [] },
      abs: { moves: [] },
      pull: { moves: [] },
    },
    customWorkouts: [],
    activeSession: null,
  };
}
