import { WorkoutType } from "@/lib/types";

const STORAGE_KEY = "armstrong-workout-setup-intent";

export type WorkoutSetupMode = "batch" | "manual";

interface WorkoutSetupIntent {
  type: WorkoutType;
  mode: WorkoutSetupMode;
}

export function setWorkoutSetupIntent(
  type: WorkoutType,
  mode: WorkoutSetupMode,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const intent: WorkoutSetupIntent = { type, mode };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

export function consumeWorkoutSetupIntent(
  type: WorkoutType,
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
    const intent = JSON.parse(raw) as WorkoutSetupIntent;
    if (intent.type === type && (intent.mode === "batch" || intent.mode === "manual")) {
      return intent.mode;
    }
  } catch {
    return null;
  }

  return null;
}
