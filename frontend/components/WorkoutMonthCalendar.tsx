"use client";

import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import {
  CalendarDayDetailModal,
  type CalendarDayWorkout,
} from "@/components/CalendarDayDetailModal";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { cn } from "@/lib/cn";
import { FoodEntry, NutritionProfile, getFoodDatesForMonth } from "@/lib/nutrition";
import type { AppData, WorkoutDayEntry } from "@/lib/types";
import {
  WEEKDAY_LABELS,
  buildMonthCalendar,
  formatMonthYear,
  toLocalDateKey,
} from "@/lib/workoutCalendar";
import {
  getWorkoutDatesForMonth,
  getWorkoutEntriesForDate,
  getWorkoutLabel,
} from "@/lib/workouts";

interface WorkoutMonthCalendarProps {
  data: AppData;
  nutritionProfile?: NutritionProfile;
  foodLog?: Record<string, FoodEntry[]>;
  workoutDayLog?: Record<string, WorkoutDayEntry[]>;
}

export function WorkoutMonthCalendar({
  data,
  nutritionProfile,
  foodLog,
  workoutDayLog,
}: WorkoutMonthCalendarProps) {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayKey = toLocalDateKey(today);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const cells = useMemo(
    () => buildMonthCalendar(year, month),
    [year, month],
  );

  const workoutDays = useMemo(
    () => getWorkoutDatesForMonth(workoutDayLog, year, month),
    [workoutDayLog, year, month],
  );

  const foodDays = useMemo(
    () => getFoodDatesForMonth(foodLog, year, month),
    [foodLog, year, month],
  );

  const monthLabel = formatMonthYear(today);
  const workoutCount = workoutDays.size;
  const foodCount = foodDays.size;

  const selectedWorkouts = useMemo((): CalendarDayWorkout[] => {
    if (!selectedDateKey) {
      return [];
    }

    return getWorkoutEntriesForDate(workoutDayLog, selectedDateKey).map(
      (entry) => ({
        label: getWorkoutLabel(data, entry.workoutId),
        durationSeconds: entry.durationSeconds,
        completedAt: entry.completedAt,
      }),
    );
  }, [data, selectedDateKey, workoutDayLog]);

  const selectedFoodEntries = selectedDateKey
    ? (foodLog?.[selectedDateKey] ?? [])
    : [];

  return (
    <>
      <TerminalWindow title={monthLabel}>
        <div className="workout-calendar">
          <div className="workout-calendar__weekdays" aria-hidden>
            {WEEKDAY_LABELS.map((label, index) => (
              <span key={`${label}-${index}`} className="workout-calendar__weekday">
                {label}
              </span>
            ))}
          </div>

          <div className="workout-calendar__grid" role="grid" aria-label={monthLabel}>
            {cells.map((cell, index) => {
              if (cell.day === null || cell.dateKey === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="workout-calendar__cell workout-calendar__cell--empty"
                    aria-hidden
                  />
                );
              }

              const hasWorkout = workoutDays.has(cell.dateKey);
              const hasFood = foodDays.has(cell.dateKey);
              const isToday = cell.dateKey === todayKey;
              const ariaParts = [`${cell.day}`];
              if (hasWorkout) {
                ariaParts.push(t("history.ariaWorkoutLogged"));
              }
              if (hasFood) {
                ariaParts.push(t("history.ariaMealLogged"));
              }
              if (!hasWorkout && !hasFood) {
                ariaParts.push(t("history.ariaNoActivity"));
              }

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  role="gridcell"
                  aria-label={ariaParts.join(", ")}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  className={cn(
                    "workout-calendar__cell workout-calendar__cell--clickable",
                    hasWorkout && hasFood && "workout-calendar__cell--both",
                    hasWorkout && !hasFood && "workout-calendar__cell--workout",
                    !hasWorkout && hasFood && "workout-calendar__cell--food",
                    !hasWorkout && !hasFood && "workout-calendar__cell--rest",
                    isToday && "workout-calendar__cell--today",
                  )}
                >
                  <span className="workout-calendar__day">{cell.day}</span>
                  {hasWorkout || hasFood ? (
                    <span className="workout-calendar__indicators" aria-hidden>
                      {hasWorkout ? (
                        <span className="workout-calendar__indicator workout-calendar__indicator--workout" />
                      ) : null}
                      {hasFood ? (
                        <span className="workout-calendar__indicator workout-calendar__indicator--food" />
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="workout-calendar__summary">
            <span className="text-green">{workoutCount}</span>
            <span className="text-dim">
              {" "}
              {t("history.workoutDay", { count: workoutCount })}
            </span>
            <span className="text-dim"> · </span>
            <span className="text-amber">{foodCount}</span>
            <span className="text-dim">
              {" "}
              {t("history.mealLogDay", { count: foodCount })}
            </span>
          </p>

          <div className="workout-calendar__legend" aria-hidden>
            <span className="workout-calendar__legend-item">
              <span className="workout-calendar__indicator workout-calendar__indicator--workout" />
              {t("history.legendWorkout")}
            </span>
            <span className="workout-calendar__legend-item">
              <span className="workout-calendar__indicator workout-calendar__indicator--food" />
              {t("history.legendFood")}
            </span>
          </div>
        </div>
      </TerminalWindow>

      <CalendarDayDetailModal
        open={selectedDateKey !== null}
        dateKey={selectedDateKey}
        workouts={selectedWorkouts}
        foodEntries={selectedFoodEntries}
        nutritionProfile={nutritionProfile}
        onClose={() => setSelectedDateKey(null)}
      />
    </>
  );
}
