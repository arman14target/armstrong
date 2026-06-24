import type {
  ActiveSession,
  AppData,
  LoggedExercise,
  Move,
  WorkoutDayEntry,
  WorkoutSessionSnapshot,
} from "@/lib/types";
import { getWorkoutLabel, getWorkoutTemplate } from "@/lib/workouts";
import { t } from "@/lib/i18n/t";

/** One completed exercise, distilled for the share card. */
export interface ShareExercise {
  name: string;
  /** Heaviest completed set (ties broken by reps). Omitted if no completed set. */
  topSet?: { weight: number; reps: number };
  /** Number of completed sets for this move. */
  setCount: number;
}

/** A single headline stat — the card shows exactly one. */
export interface ShareHeroStat {
  kind: "pr" | "streak" | "volume";
  label: string;
  value: string;
}

/** Everything the share card needs. Pure client, derived at workout finish. */
export interface WorkoutShareSummary {
  workoutName: string;
  /** Completion timestamp (ISO). */
  dateISO: string;
  durationSeconds?: number;
  exercises: ShareExercise[];
  totalSets: number;
  /** Total weight moved across completed sets (weight × reps), kg. */
  totalVolume: number;
  heroStat: ShareHeroStat;
}

export interface BuildShareSummaryParams {
  workoutName: string;
  /** Live template moves at finish — provides structure + names + set ids. */
  moves: Move[];
  /** The session being finished (weights, reps, completed ids, baseline). */
  session: ActiveSession;
  /** Completion timestamp (ISO). */
  completedAt: string;
  /**
   * Local YYYY-MM-DD dates of prior workouts, used for the streak stat.
   * Pass `workoutCompletionDates` (need not yet include `completedAt`).
   */
  completionDates?: string[];
}

const KG = (n: number) => `${Math.round(n).toLocaleString()} kg`;

/** Build a share summary from a finishing session. */
export function buildWorkoutShareSummary({
  workoutName,
  moves,
  session,
  completedAt,
  completionDates,
}: BuildShareSummaryParams): WorkoutShareSummary {
  const completed = new Set(session.completedSetIds);
  const baselineWeights = collectBaselineWeights(session);

  const exercises: ShareExercise[] = [];
  let totalSets = 0;
  let totalVolume = 0;
  let bestPr: { name: string; weight: number; delta: number } | undefined;

  for (const move of moves) {
    const completedSets = move.sets.filter((set) => completed.has(set.id));
    if (completedSets.length === 0) {
      continue;
    }

    let topSet: { weight: number; reps: number } | undefined;
    for (const set of completedSets) {
      const weight = session.setWeights[set.id] ?? set.lastWeight ?? 0;
      const reps = session.setReps[set.id] ?? set.lastReps ?? 0;
      totalSets += 1;
      totalVolume += weight * reps;

      if (!topSet || weight > topSet.weight || (weight === topSet.weight && reps > topSet.reps)) {
        topSet = { weight, reps };
      }

      // PR: heavier than the pre-session best for this set.
      const prior = baselineWeights.get(set.id);
      if (prior !== undefined && weight > prior) {
        const delta = weight - prior;
        if (!bestPr || delta > bestPr.delta) {
          bestPr = { name: move.name, weight, delta };
        }
      }
    }

    exercises.push({ name: move.name, topSet, setCount: completedSets.length });
  }

  return {
    workoutName,
    dateISO: completedAt,
    durationSeconds: durationFromSession(session, completedAt),
    exercises,
    totalSets,
    totalVolume,
    heroStat: pickHeroStat({ bestPr, completionDates, completedAt, totalVolume }),
  };
}

/**
 * Capture the real completed-set data of a finishing session, stored on the
 * day-log entry so history reflects what actually happened. Completed sets
 * only; weights/reps are the values the user logged this session.
 */
export function buildSessionSnapshot(
  moves: Move[],
  session: ActiveSession,
): WorkoutSessionSnapshot {
  const completed = new Set(session.completedSetIds);
  const exercises: LoggedExercise[] = [];

  for (const move of moves) {
    const sets = move.sets
      .filter((set) => completed.has(set.id))
      .map((set) => ({
        weight: session.setWeights[set.id] ?? set.lastWeight ?? 0,
        reps: session.setReps[set.id] ?? set.lastReps ?? 0,
      }));
    if (sets.length > 0) {
      exercises.push({ name: move.name, sets });
    }
  }

  return { exercises };
}

/**
 * Build a share summary for a past workout from the activity log. Uses the
 * real session snapshot stored at finish. Returns null when there's no
 * snapshot (entry logged before snapshots existed) — we don't fabricate data.
 * Hero stat is total volume (PR/streak context isn't retained per entry).
 */
export function buildHistoryShareSummary(
  data: AppData,
  entry: WorkoutDayEntry,
): WorkoutShareSummary | null {
  if (!entry.snapshot) {
    return null;
  }

  const exercises: ShareExercise[] = [];
  let totalSets = 0;
  let totalVolume = 0;

  for (const ex of entry.snapshot.exercises) {
    if (ex.sets.length === 0) {
      continue;
    }
    let topSet: { weight: number; reps: number } | undefined;
    for (const set of ex.sets) {
      totalSets += 1;
      totalVolume += set.weight * set.reps;
      if (!topSet || set.weight > topSet.weight) {
        topSet = { weight: set.weight, reps: set.reps };
      }
    }
    exercises.push({ name: ex.name, topSet, setCount: ex.sets.length });
  }

  return {
    workoutName: getWorkoutLabel(data, entry.workoutId),
    dateISO: entry.completedAt,
    durationSeconds: entry.durationSeconds,
    exercises,
    totalSets,
    totalVolume,
    heroStat: {
      kind: "volume",
      label: t("share.totalVolume"),
      value: KG(totalVolume),
    },
  };
}

/** Map of setId → pre-session weight, from the baseline snapshot. */
function collectBaselineWeights(session: ActiveSession): Map<string, number> {
  const map = new Map<string, number>();
  for (const move of session.baselineWorkout.moves) {
    for (const set of move.sets) {
      if (set.lastWeight !== undefined) {
        map.set(set.id, set.lastWeight);
      }
    }
  }
  return map;
}

function durationFromSession(
  session: ActiveSession,
  completedAt: string,
): number | undefined {
  if (!session.startedAt) {
    return undefined;
  }
  const seconds = Math.floor(
    (new Date(completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
  );
  return seconds > 0 ? seconds : undefined;
}

/** Pick the single headline stat: PR > streak (≥2) > volume. */
function pickHeroStat({
  bestPr,
  completionDates,
  completedAt,
  totalVolume,
}: {
  bestPr?: { name: string; weight: number };
  completionDates?: string[];
  completedAt: string;
  totalVolume: number;
}): ShareHeroStat {
  if (bestPr) {
    return {
      kind: "pr",
      label: t("share.newPr"),
      value: t("share.prValue", { name: bestPr.name, weight: bestPr.weight }),
    };
  }

  const streak = computeStreak(completionDates, completedAt);
  if (streak >= 2) {
    return {
      kind: "streak",
      label: t("share.streak"),
      value: t("share.dayStreak", { count: streak }),
    };
  }

  return { kind: "volume", label: t("share.totalVolume"), value: KG(totalVolume) };
}

/** Local YYYY-MM-DD for a date. */
function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Consecutive-day streak ending on `completedAt`'s local day, counting back
 * through `completionDates`. The finishing day counts even if not yet logged.
 */
export function computeStreak(
  completionDates: string[] | undefined,
  completedAt: string,
): number {
  const days = new Set(completionDates ?? []);
  const cursor = new Date(completedAt);
  days.add(dayKey(cursor)); // finishing day always counts

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
