const STORAGE_KEY = "armstrong-workout-setup-intent";

export type WorkoutSetupMode = "batch" | "manual";

interface WorkoutSetupIntent {
  workoutId: string;
  mode: WorkoutSetupMode;
}

export function setWorkoutSetupIntent(
  workoutId: string,
  mode: WorkoutSetupMode,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const intent: WorkoutSetupIntent = { workoutId, mode };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

export function consumeWorkoutSetupIntent(
  workoutId: string,
): WorkoutSetupMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  sessionStorage.removeItem(STORAGE_KEY);

  try {
    const intent = JSON.parse(raw) as WorkoutSetupIntent & {
      type?: string;
    };
    const id = intent.workoutId ?? intent.type;
    if (id === workoutId && (intent.mode === "batch" || intent.mode === "manual")) {
      return intent.mode;
    }
  } catch {
    return null;
  }

  return null;
}
