"use client";

import { CheckIcon, PencilIcon } from "@/components/icons/ActionIcons";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { type NutritionGoal } from "@/lib/nutrition";
import type { WeightEntry, WeightUnit } from "@/lib/types";
import {
  formatBodyWeight,
  resolveWeightBaselineKg,
  weightProgress,
  WEIGHT_STEP_KG,
} from "@/lib/weight";

interface WeightGoalChartProps {
  log: WeightEntry[];
  baselineKg?: number;
  currentWeightKg: number;
  targetWeightKg: number;
  goal: NutritionGoal;
  unit: WeightUnit;
  className?: string;
  editing?: boolean;
  draftWeightKg?: number;
  onEdit?: () => void;
  onSave?: () => void;
  onAdjust?: (delta: number) => void;
}

export function WeightGoalChart({
  log,
  baselineKg,
  currentWeightKg,
  targetWeightKg,
  goal,
  unit,
  className,
  editing = false,
  draftWeightKg = currentWeightKg,
  onEdit,
  onSave,
  onAdjust,
}: WeightGoalChartProps) {
  const resolvedBaseline =
    baselineKg ?? resolveWeightBaselineKg(log) ?? currentWeightKg;
  const effectiveCurrentKg = editing ? draftWeightKg : currentWeightKg;

  const chartLog =
    log.length > 0
      ? log
      : [{ date: new Date().toISOString().slice(0, 10), weightKg: effectiveCurrentKg }];

  const previewLog =
    editing && draftWeightKg !== currentWeightKg
      ? logWeightPreview(chartLog, draftWeightKg)
      : chartLog;

  const progress = weightProgress(previewLog, goal, targetWeightKg, resolvedBaseline);
  const pct = progress?.percentToTarget;
  const hasUnsavedDraft = editing && draftWeightKg !== currentWeightKg;

  return (
    <div className={cn("stack-md", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {editing ? (
              <button
                type="button"
                aria-label="Decrease weight by 50 grams"
                onClick={() => onAdjust?.(-WEIGHT_STEP_KG)}
                disabled={draftWeightKg <= 40 + WEIGHT_STEP_KG / 2}
                className="flex size-9 shrink-0 items-center justify-center rounded-cyber border border-line bg-bg/50 text-lg font-semibold text-heading transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
            ) : null}

            <p className="min-w-0 font-display text-[2rem] leading-none tracking-wide text-heading">
              {formatBodyWeight(effectiveCurrentKg, unit)}
            </p>

            {editing ? (
              <button
                type="button"
                aria-label="Increase weight by 50 grams"
                onClick={() => onAdjust?.(WEIGHT_STEP_KG)}
                disabled={draftWeightKg >= 200 - WEIGHT_STEP_KG / 2}
                className="flex size-9 shrink-0 items-center justify-center rounded-cyber border border-line bg-bg/50 text-lg font-semibold text-heading transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            ) : null}

            {onEdit || onSave ? (
              <IconButton
                label={editing ? "Save weight" : "Edit weight"}
                variant={editing ? "green" : "ghost"}
                className={cn(
                  "size-9",
                  editing &&
                    "shadow-[0_0_16px_color-mix(in_srgb,var(--color-green)_55%,transparent)] ring-1 ring-green/50",
                  editing && hasUnsavedDraft && "animate-pulse",
                )}
                onClick={editing ? onSave : onEdit}
              >
                {editing ? <CheckIcon /> : <PencilIcon />}
              </IconButton>
            ) : null}
          </div>

          <p
            className={cn(
              "mt-1.5 text-xs",
              !progress || progress.deltaKg === 0
                ? "text-dim"
                : progress.towardGoal
                  ? "text-green"
                  : "text-magenta",
            )}
          >
            {progress && progress.deltaKg !== 0
              ? `${progress.deltaKg > 0 ? "▲" : "▼"} ${formatBodyWeight(
                  Math.abs(progress.deltaKg),
                  unit,
                )} since start`
              : "Starting point"}
          </p>

          {editing ? (
            <p className="mt-1 text-[10px] text-dim">±50 g per tap · tap ✓ to save</p>
          ) : null}
        </div>

        {pct !== undefined ? (
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl leading-none text-primary">{pct}%</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-dim">to goal</p>
          </div>
        ) : null}
      </div>

      {pct !== undefined ? (
        <div className="relative h-1.5 overflow-hidden rounded-full bg-bg/80">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/40 via-primary/65 to-primary transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

function logWeightPreview(log: WeightEntry[], draftKg: number): WeightEntry[] {
  if (log.length === 0) {
    return [{ date: new Date().toISOString().slice(0, 10), weightKg: draftKg }];
  }

  const next = [...log];
  next[next.length - 1] = { ...next[next.length - 1], weightKg: draftKg };
  return next;
}
