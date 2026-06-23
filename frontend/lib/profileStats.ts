import type { WorkoutDayEntry } from "@/lib/types";
import { toLocalDateKey } from "@/lib/workoutCalendar";

function shiftDay(key: string, deltaDays: number): string {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return toLocalDateKey(date);
}

/**
 * Consecutive-day workout streak ending at the most recent activity. Forgiving
 * about *today*: a streak isn't broken just because today's workout isn't done
 * yet, as long as yesterday was. Returns 0 when the chain doesn't reach
 * today/yesterday.
 */
export function currentStreak(
  completionDates: string[] | undefined,
  today: string = toLocalDateKey(new Date()),
): number {
  const days = new Set(completionDates ?? []);
  if (days.size === 0) {
    return 0;
  }

  let cursor = today;
  if (!days.has(cursor)) {
    cursor = shiftDay(today, -1);
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

export interface LifetimeStats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  totalVolumeKg: number;
}

function eachEntry(
  log: Record<string, WorkoutDayEntry[]> | undefined,
): WorkoutDayEntry[] {
  return Object.values(log ?? {}).flat();
}

export function lifetimeStats(
  workoutDayLog: Record<string, WorkoutDayEntry[]> | undefined,
  completionDates: string[] | undefined,
  today: string = toLocalDateKey(new Date()),
): LifetimeStats {
  const entries = eachEntry(workoutDayLog);

  // Prefer per-session counts from the day log; fall back to finished-day dates.
  const totalWorkouts =
    entries.length > 0 ? entries.length : (completionDates?.length ?? 0);

  const weekAgo = shiftDay(today, -6); // inclusive 7-day window ending today
  const inWeek = (key: string) => key >= weekAgo && key <= today;
  const workoutsThisWeek =
    entries.length > 0
      ? Object.entries(workoutDayLog ?? {}).reduce(
          (sum, [dateKey, list]) => sum + (inWeek(dateKey) ? list.length : 0),
          0,
        )
      : (completionDates ?? []).filter(inWeek).length;

  let totalVolumeKg = 0;
  for (const entry of entries) {
    for (const exercise of entry.snapshot?.exercises ?? []) {
      for (const set of exercise.sets) {
        totalVolumeKg += set.weight * set.reps;
      }
    }
  }

  return {
    totalWorkouts,
    workoutsThisWeek,
    totalVolumeKg: Math.round(totalVolumeKg),
  };
}

export interface PersonalRecord {
  exercise: string;
  bestWeightKg: number;
  repsAtBest: number;
  /** Epley estimated one-rep max: weight × (1 + reps/30). */
  estimated1RmKg: number;
  achievedAt: string;
}

function epley1Rm(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

/**
 * Best lift per exercise across all logged sessions, ranked by estimated 1RM.
 * A set's "best" is the heaviest weight; ties break toward more reps.
 */
export function personalRecords(
  workoutDayLog: Record<string, WorkoutDayEntry[]> | undefined,
): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();

  for (const entry of eachEntry(workoutDayLog)) {
    for (const exercise of entry.snapshot?.exercises ?? []) {
      for (const set of exercise.sets) {
        if (set.weight <= 0) {
          continue;
        }
        const existing = best.get(exercise.name);
        const isBetter =
          !existing ||
          set.weight > existing.bestWeightKg ||
          (set.weight === existing.bestWeightKg &&
            set.reps > existing.repsAtBest);
        if (isBetter) {
          best.set(exercise.name, {
            exercise: exercise.name,
            bestWeightKg: set.weight,
            repsAtBest: set.reps,
            estimated1RmKg: Math.round(epley1Rm(set.weight, set.reps)),
            achievedAt: entry.completedAt,
          });
        }
      }
    }
  }

  return [...best.values()].sort(
    (a, b) => b.estimated1RmKg - a.estimated1RmKg,
  );
}
