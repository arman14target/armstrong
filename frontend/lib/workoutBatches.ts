import { Move, WorkoutType } from "@/lib/types";
import { isTimeBasedExercise } from "@/lib/timeBasedExercises";

export interface BatchExercisePreset {
  name: string;
  setCount: number;
  reps: number;
  weightKg: number;
  restSeconds: number;
  isTimeBased?: boolean;
}

export interface WorkoutBatch {
  id: string;
  name: string;
  description: string;
  exercises: BatchExercisePreset[];
}

export function formatRestSeconds(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} min rest`;
  }

  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")} rest`;
  }

  return `${seconds}s rest`;
}

export function formatExercisePresetLine(preset: BatchExercisePreset): string {
  const rest =
    preset.restSeconds >= 60 && preset.restSeconds % 60 === 0
      ? `${preset.restSeconds / 60} min`
      : `${preset.restSeconds}s`;
  return `${preset.name} - ${preset.setCount} sets - ${preset.reps} reps - ${rest}`;
}

export function createMoveFromPreset(preset: BatchExercisePreset): Move {
  const timeBased = preset.isTimeBased ?? isTimeBasedExercise(preset.name);

  return {
    id: crypto.randomUUID(),
    name: preset.name,
    sets: Array.from({ length: preset.setCount }, () => ({
      id: crypto.randomUUID(),
      restSeconds: preset.restSeconds,
      lastWeight:
        !timeBased && preset.weightKg > 0 ? preset.weightKg : undefined,
      lastReps: preset.reps > 0 ? preset.reps : undefined,
    })),
  };
}

export const WORKOUT_BATCHES: Record<WorkoutType, WorkoutBatch[]> = {
  push: [
    {
      id: "push-chest",
      name: "Chest & Push Day",
      description: "Classic push split with bench, shoulders, and triceps.",
      exercises: [
        { name: "Bench Press", setCount: 3, reps: 8, weightKg: 80, restSeconds: 60 },
        { name: "Incline DB Press", setCount: 3, reps: 10, weightKg: 28, restSeconds: 60 },
        { name: "Overhead Press", setCount: 3, reps: 8, weightKg: 40, restSeconds: 60 },
        { name: "Cable Fly", setCount: 3, reps: 12, weightKg: 15, restSeconds: 45 },
        { name: "Tricep Pushdown", setCount: 3, reps: 12, weightKg: 25, restSeconds: 45 },
      ],
    },
  ],
  pull: [
    {
      id: "pull-back",
      name: "Back & Pull Day",
      description: "Deadlifts, rows, and arms for a full pull session.",
      exercises: [
        { name: "Deadlift", setCount: 3, reps: 5, weightKg: 100, restSeconds: 90 },
        { name: "Lat Pulldown", setCount: 3, reps: 10, weightKg: 55, restSeconds: 60 },
        { name: "Barbell Row", setCount: 3, reps: 8, weightKg: 60, restSeconds: 60 },
        { name: "Face Pull", setCount: 3, reps: 15, weightKg: 15, restSeconds: 45 },
        { name: "Hammer Curl", setCount: 3, reps: 12, weightKg: 14, restSeconds: 45 },
      ],
    },
  ],
  leg: [
    {
      id: "leg-day",
      name: "Leg Day",
      description: "Squats, hinges, and isolation for lower body.",
      exercises: [
        { name: "Squat", setCount: 3, reps: 5, weightKg: 100, restSeconds: 90 },
        { name: "Romanian Deadlift", setCount: 3, reps: 8, weightKg: 80, restSeconds: 60 },
        { name: "Leg Press", setCount: 3, reps: 10, weightKg: 120, restSeconds: 60 },
        { name: "Leg Curl", setCount: 3, reps: 12, weightKg: 40, restSeconds: 45 },
        { name: "Calf Raise", setCount: 3, reps: 15, weightKg: 60, restSeconds: 45 },
      ],
    },
  ],
  abs: [
    {
      id: "abs-core",
      name: "Abs & Core Day",
      description: "Core strength and stability circuit.",
      exercises: [
        { name: "Hanging Leg Raise", setCount: 3, reps: 12, weightKg: 0, restSeconds: 45 },
        { name: "Cable Crunch", setCount: 3, reps: 15, weightKg: 30, restSeconds: 45 },
        { name: "Ab Wheel", setCount: 3, reps: 10, weightKg: 0, restSeconds: 45 },
        { name: "Pallof Press", setCount: 3, reps: 12, weightKg: 15, restSeconds: 45 },
        { name: "Plank Hold", setCount: 3, reps: 1, weightKg: 0, restSeconds: 30 },
      ],
    },
  ],
};

export function getWorkoutBatch(
  workoutType: WorkoutType,
  batchId: string,
): WorkoutBatch | undefined {
  return WORKOUT_BATCHES[workoutType].find((batch) => batch.id === batchId);
}

export function getDefaultWorkoutBatch(workoutType: WorkoutType): WorkoutBatch {
  return WORKOUT_BATCHES[workoutType][0];
}

export function createEmptyWorkoutBatch(name: string): WorkoutBatch {
  return {
    id: "custom",
    name,
    description: "Add exercises for your custom workout day.",
    exercises: [],
  };
}
