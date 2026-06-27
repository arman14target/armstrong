import type { ActiveSession, AppData, WorkoutTemplate } from "@/lib/types";
import { getWorkoutTemplate } from "@/lib/workouts";
import { toLocalDateKey } from "@/lib/workoutCalendar";

export function shouldReuseActiveSession(
  session: ActiveSession | null | undefined,
  workoutId: string,
  template: WorkoutTemplate | undefined,
  now: Date = new Date(),
): boolean {
  if (!session || session.workoutType !== workoutId || !session.startedAt) {
    return false;
  }

  const startedAt = new Date(session.startedAt);
  if (toLocalDateKey(startedAt) !== toLocalDateKey(now)) {
    return false;
  }

  if (template?.lastCompletedAt) {
    const completedAt = new Date(template.lastCompletedAt);
    if (completedAt.getTime() >= startedAt.getTime()) {
      return false;
    }
  }

  return true;
}

export function getInProgressSessionWorkoutId(data: AppData): string | null {
  const session = data.activeSession;
  if (!session?.workoutType || !session.startedAt) {
    return null;
  }

  const template = getWorkoutTemplate(data, session.workoutType);
  if (!shouldReuseActiveSession(session, session.workoutType, template)) {
    return null;
  }

  return session.workoutType;
}

// Stores typed-but-not-completed set values on the session so a half-logged
// workout survives the app closing. Completion is tracked by completedSetIds,
// so writing a draft here never marks the set complete. Returns the same
// session reference when nothing changes, so callers can skip a write.
export function applySetDraft(
  session: ActiveSession,
  workoutId: string,
  setId: string,
  weight?: number,
  reps?: number,
): ActiveSession {
  if (
    session.workoutType !== workoutId ||
    (weight === undefined && reps === undefined) ||
    session.completedSetIds.includes(setId)
  ) {
    return session;
  }

  return {
    ...session,
    setWeights:
      weight !== undefined
        ? { ...session.setWeights, [setId]: weight }
        : session.setWeights,
    setReps:
      reps !== undefined
        ? { ...(session.setReps ?? {}), [setId]: reps }
        : (session.setReps ?? {}),
  };
}
