import { formatTime } from "@/hooks/useCountdown";
import { formatDurationSeconds } from "@/lib/timeBasedExercises";

export function formatPreviousSet(
  weight?: number,
  reps?: number,
  isTimeBased = false,
): string | null {
  if (weight === undefined && reps === undefined) {
    return null;
  }

  if (isTimeBased) {
    return reps !== undefined ? formatDurationSeconds(reps) : null;
  }

  const weightPart = weight !== undefined ? `${weight} kg` : null;
  const repsPart = reps !== undefined ? `${reps}` : null;

  if (weightPart && repsPart) {
    return `${weightPart} x ${repsPart}`;
  }

  return weightPart ?? repsPart;
}

export function formatRestLabel(seconds: number): string {
  return formatTime(seconds);
}
