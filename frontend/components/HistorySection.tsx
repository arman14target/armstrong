"use client";

import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import {
  CalendarDayDetailModal,
  type CalendarDayWorkout,
} from "@/components/CalendarDayDetailModal";
import { ActivityStatsPanel } from "@/components/history/ActivityStatsPanel";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { WorkoutMonthCalendar } from "@/components/WorkoutMonthCalendar";
import {
  buildActivityDaySummaries,
  type ActivityDaySummary,
} from "@/lib/activityHistory";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/formatRelativeTime";
import { formatDailyMacroSummary } from "@/lib/nutrition";
import type { AppData } from "@/lib/types";
import { formatDateLabel } from "@/lib/workoutCalendar";
import { getWorkoutEntriesForDate, getWorkoutLabel } from "@/lib/workouts";

type HistoryView = "activity" | "calendar";

interface HistorySectionProps {
  data: AppData;
}

function formatWorkoutSummary(day: ActivityDaySummary): string | null {
  if (day.workouts.length === 0) {
    return null;
  }

  return day.workouts
    .map((workout) => {
      const duration =
        workout.durationSeconds !== undefined
          ? ` · ${formatDuration(workout.durationSeconds)}`
          : "";
      const exercises =
        workout.exercises.length > 0
          ? ` — ${workout.exercises.join(", ")}`
          : "";
      return `${workout.label}${duration}${exercises}`;
    })
    .join(" · ");
}

function formatFoodSummary(day: ActivityDaySummary, advanced: boolean): string | null {
  if (!day.food || day.foodNames.length === 0) {
    return null;
  }

  return `${day.foodNames.join(", ")} · ${formatDailyMacroSummary(day.food, advanced)}`;
}

function ActivityDayRow({
  day,
  advancedNutrition,
  onSelectDate,
}: {
  day: ActivityDaySummary;
  advancedNutrition: boolean;
  onSelectDate: (dateKey: string) => void;
}) {
  const workoutSummary = formatWorkoutSummary(day);
  const foodSummary = formatFoodSummary(day, advancedNutrition);
  const dateLabel = formatDateLabel(day.dateKey);

  return (
    <button
      type="button"
      onClick={() => onSelectDate(day.dateKey)}
      className="activity-history__row activity-history__row--day"
    >
      <div className="activity-history__row-main">
        <p className="activity-history__row-title">{dateLabel}</p>
        {workoutSummary ? (
          <p className="activity-history__row-meta activity-history__row-meta--workout">
            {workoutSummary}
          </p>
        ) : null}
        {foodSummary ? (
          <p
            className={cn(
              "activity-history__row-meta activity-history__row-meta--food",
              workoutSummary && "mt-1",
            )}
          >
            {foodSummary}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export function HistorySection({ data }: HistorySectionProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<HistoryView>("activity");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const daySummaries = useMemo(
    () => buildActivityDaySummaries(data, data.foodLog, data.workoutDayLog),
    [data],
  );

  const selectedWorkouts = useMemo((): CalendarDayWorkout[] => {
    if (!selectedDateKey) {
      return [];
    }

    return getWorkoutEntriesForDate(data.workoutDayLog, selectedDateKey).map(
      (entry) => ({
        label: getWorkoutLabel(data, entry.workoutId),
        durationSeconds: entry.durationSeconds,
        completedAt: entry.completedAt,
      }),
    );
  }, [data, selectedDateKey]);

  const selectedFoodEntries = selectedDateKey
    ? (data.foodLog?.[selectedDateKey] ?? [])
    : [];

  return (
    <>
      <div className="stack-md">
        <fieldset className="planner-segment history-section__tabs">
          <legend className="sr-only">{t("history.viewLegend")}</legend>
          <div className="planner-segment__options history-section__tab-options">
            <button
              type="button"
              className={view === "activity" ? "is-active" : undefined}
              onClick={() => setView("activity")}
            >
              {t("history.activity")}
            </button>
            <button
              type="button"
              className={view === "calendar" ? "is-active" : undefined}
              onClick={() => setView("calendar")}
            >
              {t("history.calendar")}
            </button>
          </div>
        </fieldset>

        {view === "activity" ? (
          <div className="stack-md">
            <ActivityStatsPanel />
            <TerminalWindow title={t("history.activityLog")}>
              {daySummaries.length === 0 ? (
                <p className="activity-history__empty">
                  {t("history.emptyActivity")}
                </p>
              ) : (
                <ul className="activity-history__list">
                  {daySummaries.map((day) => (
                    <li key={day.dateKey} className="activity-history__item">
                    <ActivityDayRow
                      day={day}
                      advancedNutrition={data.advancedNutrition === true}
                      onSelectDate={setSelectedDateKey}
                    />
                    </li>
                  ))}
                </ul>
              )}
            </TerminalWindow>
          </div>
        ) : (
          <WorkoutMonthCalendar
            data={data}
            nutritionProfile={data.nutritionProfile}
            foodLog={data.foodLog}
            workoutDayLog={data.workoutDayLog}
          />
        )}
      </div>

      <CalendarDayDetailModal
        open={selectedDateKey !== null}
        dateKey={selectedDateKey}
        workouts={selectedWorkouts}
        foodEntries={selectedFoodEntries}
        nutritionProfile={data.nutritionProfile}
        advancedNutrition={data.advancedNutrition === true}
        onClose={() => setSelectedDateKey(null)}
      />
    </>
  );
}
