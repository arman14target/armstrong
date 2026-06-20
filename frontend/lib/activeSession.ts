import type { ActiveSession, WorkoutTemplate } from "@/lib/types";
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
