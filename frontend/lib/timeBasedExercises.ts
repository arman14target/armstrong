/** Exercise name fragments that indicate duration-based sets (seconds), not weight + reps. */
export const TIME_BASED_EXERCISE_KEYWORDS = [
  "plank",
  "wall sit",
  "dead hang",
  "hollow hold",
  "l-sit",
  "l sit",
  "side plank",
  "farmer walk",
  "battle rope",
  "jump rope",
  "mountain climber",
  "hold",
  "static",
  "isometric",
] as const;

export function isTimeBasedExercise(name: string): boolean {
  const lower = name.trim().toLowerCase();
  if (!lower) {
    return false;
  }

  return TIME_BASED_EXERCISE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export function formatDurationSeconds(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return remainder > 0 ? `${minutes}:${String(remainder).padStart(2, "0")}` : `${minutes}m`;
  }

  return `${seconds}s`;
}
