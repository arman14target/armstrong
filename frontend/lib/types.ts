export type WorkoutType = "push" | "leg" | "abs" | "pull";

export const WORKOUT_TYPES: WorkoutType[] = ["push", "leg", "abs", "pull"];

export const WORKOUT_LABELS: Record<WorkoutType, string> = {
  push: "Push Day",
  leg: "Leg Day",
  abs: "Abs Day",
  pull: "Pull Day",
};

import type { FoodEntry, NutritionProfile } from "./nutrition";
import type { WorkoutDayTheme } from "./workoutDayTheme";

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
  theme?: WorkoutDayTheme;
  sticker?: string;
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

/** A single completed set's real logged values. */
export interface LoggedSet {
  weight: number;
  reps: number;
}

/** One exercise as actually performed in a session (completed sets only). */
export interface LoggedExercise {
  name: string;
  sets: LoggedSet[];
}

/**
 * Real per-session record captured at finish, so history shows what actually
 * happened rather than the template's latest numbers. Optional only for
 * entries logged before this field existed.
 */
export interface WorkoutSessionSnapshot {
  exercises: LoggedExercise[];
}

export interface WorkoutDayEntry {
  workoutId: string;
  completedAt: string;
  durationSeconds?: number;
  snapshot?: WorkoutSessionSnapshot;
}

/** Preferred display unit for body weight. Stored values are always kg. */
export type WeightUnit = "kg" | "lb";

/** A single body-weight measurement. `date` is a local YYYY-MM-DD key. */
export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface AppData {
  workouts: Record<WorkoutType, WorkoutTemplate>;
  customWorkouts: CustomWorkoutDay[];
  activeSession: ActiveSession | null;
  workoutSetupSeen?: Partial<Record<string, boolean>>;
  /** Local YYYY-MM-DD dates when any workout was finished. */
  workoutCompletionDates?: string[];
  /** YYYY-MM-DD → workouts finished that day. */
  workoutDayLog?: Record<string, WorkoutDayEntry[]>;
  nutritionProfile?: NutritionProfile;
  /** YYYY-MM-DD → foods logged that day. */
  foodLog?: Record<string, FoodEntry[]>;
  /** Body-weight history, oldest → newest, at most one entry per day. */
  weightLog?: WeightEntry[];
  /** Optional goal weight (kg) the user is working toward. */
  targetWeightKg?: number;
  /** Weight when the journey started; stays fixed when logging same-day updates. */
  weightBaselineKg?: number;
  /** Display unit for weights; values are stored in kg regardless. */
  weightUnit?: WeightUnit;
  /** When true, show calories, fat, and full nutrition detail. */
  advancedNutrition?: boolean;
  /** BCP 47 app display locale (e.g. en-US, de-CH). */
  locale?: string;
  /** When true, hide default split days — show coach-imported custom days only. */
  coachPlanActive?: boolean;
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
