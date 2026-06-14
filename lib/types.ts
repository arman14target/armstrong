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

export interface ActiveSession {
  workoutType: WorkoutType;
  startedAt: string;
  setWeights: Record<string, number>;
  completedSetIds: string[];
  activeRestSetId?: string;
  restEndsAt?: string;
  /** Workout template snapshot at session start — used to revert on cancel. */
  baselineWorkout: WorkoutTemplate;
}

export interface AppData {
  workouts: Record<WorkoutType, WorkoutTemplate>;
  activeSession: ActiveSession | null;
  workoutSetupSeen?: Partial<Record<WorkoutType, boolean>>;
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
    activeSession: null,
  };
}
