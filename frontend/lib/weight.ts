import type { NutritionGoal } from "@/lib/nutrition";
import type { WeightEntry, WeightUnit } from "@/lib/types";

export const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Convert a stored kg value into the user's display unit. */
export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === "lb" ? kgToLb(kg) : kg;
}

/** Convert a user-entered display value back to kg for storage. */
export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === "lb" ? lbToKg(value) : value;
}

/** e.g. `72.5 kg` or `159.8 lb`, one decimal, trailing `.0` trimmed. */
export function formatWeight(kg: number, unit: WeightUnit): string {
  const value = kgToDisplay(kg, unit);
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ${unit}`;
}

/**
 * Append a body-weight measurement, keeping the log sorted oldest → newest with
 * at most one entry per day (a same-day re-log overwrites). Pure — returns a new
 * array.
 */
export function logWeight(
  log: WeightEntry[] | undefined,
  weightKg: number,
  date: string,
): WeightEntry[] {
  const withoutDay = (log ?? []).filter((entry) => entry.date !== date);
  return [...withoutDay, { date, weightKg }].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

export interface WeightProgress {
  startKg: number;
  currentKg: number;
  /** current − start. Negative = lost weight. */
  deltaKg: number;
  /** True when the delta moves the right way for the goal (cut → down, bulk → up). */
  towardGoal: boolean;
  /** 0–100 progress to target when a target is set and reachable; else undefined. */
  percentToTarget?: number;
  targetKg?: number;
}

/**
 * Summarize movement from the first logged weight to the latest, judged against
 * the user's goal. Returns null when there isn't at least one entry.
 */
export function weightProgress(
  log: WeightEntry[] | undefined,
  goal: NutritionGoal,
  targetWeightKg?: number,
): WeightProgress | null {
  if (!log || log.length === 0) {
    return null;
  }

  const startKg = log[0].weightKg;
  const currentKg = log[log.length - 1].weightKg;
  const deltaKg = currentKg - startKg;

  // Cut = lose weight (delta ≤ 0 is progress); bulk = gain (delta ≥ 0).
  const towardGoal = goal === "cut" ? deltaKg <= 0 : deltaKg >= 0;

  let percentToTarget: number | undefined;
  if (targetWeightKg !== undefined && targetWeightKg !== startKg) {
    const fullDistance = targetWeightKg - startKg;
    const covered = currentKg - startKg;
    const ratio = covered / fullDistance;
    percentToTarget = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }

  return {
    startKg,
    currentKg,
    deltaKg,
    towardGoal,
    percentToTarget,
    targetKg: targetWeightKg,
  };
}
