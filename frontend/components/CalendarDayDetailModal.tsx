"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { formatDuration } from "@/lib/formatRelativeTime";
import {
  DailyNutritionTotals,
  FoodEntry,
  NutritionProfile,
  formatDailyMacroSummary,
  formatFoodEntryMacros,
  sumDailyNutrition,
} from "@/lib/nutrition";
import { formatDateLabel } from "@/lib/workoutCalendar";

export interface CalendarDayWorkout {
  label: string;
  durationSeconds?: number;
  completedAt: string;
}

interface CalendarDayDetailModalProps {
  open: boolean;
  dateKey: string | null;
  workouts: CalendarDayWorkout[];
  foodEntries: FoodEntry[];
  nutritionProfile?: NutritionProfile;
  advancedNutrition?: boolean;
  onClose: () => void;
}

function FoodTotalsSummary({
  totals,
  profile,
  advancedNutrition,
}: {
  totals: DailyNutritionTotals;
  profile?: NutritionProfile;
  advancedNutrition: boolean;
}) {
  return (
    <div className="rounded-cyber border border-line bg-bg/40 p-[var(--space-panel)]">
      <p className="text-xs tracking-wide text-dim uppercase">Daily totals</p>
      <p className="mt-1 text-sm font-medium text-heading">
        {formatDailyMacroSummary(totals, advancedNutrition)}
        {profile && advancedNutrition ? (
          <span className="text-dim"> / {profile.dailyCalories} kcal target</span>
        ) : null}
        {profile && !advancedNutrition ? (
          <span className="text-dim">
            {" "}
            / P {profile.proteinG}g · C {profile.carbsG}g target
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function CalendarDayDetailModal({
  open,
  dateKey,
  workouts,
  foodEntries,
  nutritionProfile,
  advancedNutrition = false,
  onClose,
}: CalendarDayDetailModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !dateKey) {
    return null;
  }

  const foodTotals = sumDailyNutrition(foodEntries);
  const hasWorkouts = workouts.length > 0;
  const hasFood = foodEntries.length > 0;
  const dateLabel = formatDateLabel(dateKey);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-day-detail-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-panel border border-cyan/35 bg-panel shadow-[var(--shadow-modal)]">
        <div className="panel-header justify-between">
          <div className="inline-flex min-w-0 items-center">
            <PanelDot />
            <span className="ml-[var(--space-inline)] tracking-wide text-cyan">
              Day details
            </span>
          </div>
          <IconButton
            label="Close day details"
            variant="ghost"
            className="size-8"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-body">
          <h2
            id="calendar-day-detail-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            {dateLabel}
          </h2>

          {!hasWorkouts && !hasFood ? (
            <p className="mt-[var(--space-gap-md)] rounded-cyber border border-dashed border-line bg-bg/30 px-[var(--space-panel)] py-6 text-center text-sm leading-relaxed text-dim">
              Nothing logged on this day yet.
            </p>
          ) : null}

          {hasWorkouts ? (
            <section className="mt-[var(--space-gap-md)]">
              <h3 className="text-xs font-semibold tracking-wide text-green uppercase">
                Workouts
              </h3>
              <ul className="mt-2 stack-sm">
                {workouts.map((workout) => (
                  <li
                    key={`${workout.completedAt}-${workout.label}`}
                    className="rounded-cyber border border-green/25 bg-green/5 p-[var(--space-panel)]"
                  >
                    <p className="text-sm font-medium text-heading">{workout.label}</p>
                    <p className="mt-0.5 text-xs text-dim">
                      {formatDuration(workout.durationSeconds)}
                      {workout.durationSeconds !== undefined ? " session" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasFood ? (
            <section className="mt-[var(--space-gap-md)]">
              <h3 className="text-xs font-semibold tracking-wide text-amber uppercase">
                Food
              </h3>
              <div className="mt-2 stack-sm">
                <FoodTotalsSummary
                  totals={foodTotals}
                  profile={nutritionProfile}
                  advancedNutrition={advancedNutrition}
                />
                <ul className="stack-sm">
                  {foodEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-cyber border border-line bg-bg/40 p-[var(--space-panel)]"
                    >
                      <p className="truncate text-sm font-medium text-heading">
                        {entry.name}
                      </p>
                      <p className="mt-0.5 text-xs text-dim">
                        {formatFoodEntryMacros(entry, advancedNutrition)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
