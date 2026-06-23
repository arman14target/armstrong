"use client";

import { useState } from "react";
import { Sparkline } from "@/components/profile/Sparkline";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import { formatGoalLabel, type NutritionGoal } from "@/lib/nutrition";
import {
  currentStreak,
  lifetimeStats,
  personalRecords,
} from "@/lib/profileStats";
import type { WeightUnit } from "@/lib/types";
import {
  displayToKg,
  formatWeight,
  kgToDisplay,
  weightProgress,
} from "@/lib/weight";

type Accent = "primary" | "green" | "magenta";

const accentText: Record<Accent, string> = {
  primary: "text-primary",
  green: "text-green",
  magenta: "text-magenta",
};

function shortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.round(value));
}

function StatTile({
  label,
  value,
  accent = "primary",
  glow,
}: {
  label: string;
  value: string;
  accent?: Accent;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-cyber border bg-bg/50 px-3 py-2.5 text-center",
        glow ? "border-primary/35 bg-primary/[0.06]" : "border-line",
      )}
    >
      <p
        className={cn(
          "font-display text-2xl leading-none tracking-wide",
          accentText[accent],
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[10px] uppercase tracking-wide text-dim">
        {label}
      </p>
    </div>
  );
}

function SegToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-grid auto-cols-fr grid-flow-col gap-1 rounded-cyber border border-line p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[5px] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            value === opt.value
              ? "bg-primary/15 text-primary"
              : "text-dim hover:text-heading",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ProfileDashboard() {
  const {
    data,
    logBodyWeight,
    setTargetWeight,
    setNutritionGoal,
    setWeightUnit,
  } = useGymStore();

  const unit: WeightUnit = data.weightUnit ?? "kg";
  const goal = data.nutritionProfile?.goal;
  const log = data.weightLog ?? [];

  const streak = currentStreak(data.workoutCompletionDates);
  const stats = lifetimeStats(data.workoutDayLog, data.workoutCompletionDates);
  const prs = personalRecords(data.workoutDayLog);
  const progress = weightProgress(log, goal ?? "cut", data.targetWeightKg);

  const [weightInput, setWeightInput] = useState("");
  const [targetInput, setTargetInput] = useState(
    data.targetWeightKg !== undefined
      ? String(Math.round(kgToDisplay(data.targetWeightKg, unit) * 10) / 10)
      : "",
  );
  const [editingTarget, setEditingTarget] = useState(false);

  const handleLogWeight = () => {
    const value = parseFloat(weightInput.trim());
    if (!Number.isFinite(value) || value <= 0) return;
    logBodyWeight(displayToKg(value, unit));
    setWeightInput("");
  };

  const handleSaveTarget = () => {
    const value = parseFloat(targetInput.trim());
    setTargetWeight(
      Number.isFinite(value) && value > 0 ? displayToKg(value, unit) : null,
    );
    setEditingTarget(false);
  };

  const pct = progress?.percentToTarget;

  return (
    <div className="stack-md">
      {/* Activity */}
      <TerminalWindow title="Activity" dotVariant="green">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile
            label="Day streak"
            value={streak > 0 ? `${streak}🔥` : "0"}
            accent="magenta"
            glow={streak > 0}
          />
          <StatTile
            label="This week"
            value={String(stats.workoutsThisWeek)}
            accent="green"
          />
          <StatTile label="Workouts" value={String(stats.totalWorkouts)} />
          <StatTile
            label={`Volume (${unit})`}
            value={
              stats.totalVolumeKg > 0
                ? compactNumber(kgToDisplay(stats.totalVolumeKg, unit))
                : "—"
            }
          />
        </div>
      </TerminalWindow>

      {/* Body weight */}
      <TerminalWindow
        title="Body weight"
        headerAction={
          <SegToggle
            ariaLabel="Weight unit"
            options={[
              { value: "kg", label: "kg" },
              { value: "lb", label: "lb" },
            ]}
            value={unit}
            onChange={(u) => setWeightUnit(u)}
          />
        }
      >
        <div className="stack-md">
          {progress ? (
            <>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-display text-[2rem] leading-none text-heading">
                    {formatWeight(progress.currentKg, unit)}
                  </p>
                  <p
                    className={cn(
                      "mt-1.5 text-xs",
                      progress.deltaKg === 0 || !goal
                        ? "text-dim"
                        : progress.towardGoal
                          ? "text-green"
                          : "text-magenta",
                    )}
                  >
                    {progress.deltaKg === 0
                      ? "No change yet"
                      : `${progress.deltaKg > 0 ? "▲" : "▼"} ${formatWeight(
                          Math.abs(progress.deltaKg),
                          unit,
                        )} since start`}
                    {goal ? ` · ${formatGoalLabel(goal)}` : ""}
                  </p>
                </div>
                {pct !== undefined && (
                  <div className="text-right">
                    <p className="font-display text-2xl leading-none text-primary">
                      {pct}%
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-dim">
                      to goal
                    </p>
                  </div>
                )}
              </div>

              {/* Progress-to-goal bar */}
              {pct !== undefined && (
                <div className="relative h-1.5 overflow-hidden rounded-full bg-bg/80">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/40 via-primary/65 to-primary transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}

              {/* Chart */}
              <div>
                <Sparkline
                  values={log.map((e) => kgToDisplay(e.weightKg, unit))}
                  target={
                    data.targetWeightKg !== undefined
                      ? kgToDisplay(data.targetWeightKg, unit)
                      : undefined
                  }
                  className="h-24 w-full"
                />
                {log.length > 1 && (
                  <div className="mt-1 flex justify-between text-[10px] text-dim">
                    <span>{shortDate(log[0].date)}</span>
                    {data.targetWeightKg !== undefined && (
                      <span className="text-magenta">
                        target {formatWeight(data.targetWeightKg, unit)}
                      </span>
                    )}
                    <span>{shortDate(log[log.length - 1].date)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-cyber border border-dashed border-line bg-bg/40 px-4 py-6 text-center">
              <p className="text-sm leading-relaxed text-dim">
                Log your weight to track progress toward your goal over time.
              </p>
            </div>
          )}

          {/* Log a new weight */}
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={`Today's weight (${unit})`}
              className="min-w-0 flex-1 rounded-cyber border border-line bg-bg/40 px-3 py-2 text-sm text-heading placeholder:text-dim/70 focus:border-primary/50 focus:outline-none"
            />
            <CyberButton
              variant="green"
              onClick={handleLogWeight}
              disabled={weightInput.trim() === ""}
            >
              Log
            </CyberButton>
          </div>

          {/* Goal + target controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            {goal ? (
              <SegToggle<NutritionGoal>
                ariaLabel="Nutrition goal"
                options={[
                  { value: "cut", label: "Cut" },
                  { value: "bulk", label: "Bulk" },
                ]}
                value={goal}
                onChange={(g) => setNutritionGoal(g)}
              />
            ) : (
              <span className="text-[11px] text-dim">
                Set up nutrition to pick cut / bulk
              </span>
            )}

            {editingTarget ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder={`Goal (${unit})`}
                  className="w-24 rounded-cyber border border-line bg-bg/40 px-2 py-1 text-sm text-heading focus:border-primary/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveTarget}
                  className="text-xs font-semibold text-green hover:text-heading"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingTarget(true)}
                className="rounded-cyber border border-line px-2.5 py-1 text-xs text-primary transition-colors hover:border-primary/40"
              >
                {data.targetWeightKg !== undefined
                  ? `🎯 ${formatWeight(data.targetWeightKg, unit)}`
                  : "+ Set goal weight"}
              </button>
            )}
          </div>
        </div>
      </TerminalWindow>

      {/* Personal records */}
      {prs.length > 0 && (
        <TerminalWindow title="Personal records">
          <ul className="stack-sm">
            {prs.slice(0, 8).map((pr, i) => (
              <li
                key={pr.exercise}
                className="flex items-center gap-3 rounded-cyber border border-line bg-bg/40 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    i === 0
                      ? "bg-primary/20 text-primary"
                      : i === 1
                        ? "bg-text/15 text-heading"
                        : i === 2
                          ? "bg-magenta/15 text-magenta"
                          : "bg-bg text-dim",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-heading">
                  {pr.exercise}
                </span>
                <span className="shrink-0 text-right leading-tight">
                  <span className="block text-sm text-primary">
                    {formatWeight(pr.bestWeightKg, unit)}
                    <span className="text-xs text-dim"> × {pr.repsAtBest}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-dim">
                    1RM {formatWeight(pr.estimated1RmKg, unit)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </TerminalWindow>
      )}
    </div>
  );
}
