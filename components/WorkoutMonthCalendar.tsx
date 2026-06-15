"use client";

import { useMemo } from "react";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { cn } from "@/lib/cn";
import {
  WEEKDAY_LABELS,
  buildMonthCalendar,
  formatMonthYear,
  toLocalDateKey,
} from "@/lib/workoutCalendar";
import { getCompletionDatesForMonth } from "@/lib/workouts";

interface WorkoutMonthCalendarProps {
  completionDates?: string[];
}

export function WorkoutMonthCalendar({
  completionDates,
}: WorkoutMonthCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayKey = toLocalDateKey(today);

  const cells = useMemo(
    () => buildMonthCalendar(year, month),
    [year, month],
  );

  const completedDays = useMemo(
    () => getCompletionDatesForMonth(completionDates, year, month),
    [completionDates, year, month],
  );

  const monthLabel = formatMonthYear(today);
  const punishedCount = completedDays.size;

  return (
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

            const punished = completedDays.has(cell.dateKey);
            const isToday = cell.dateKey === todayKey;

            return (
              <div
                key={cell.dateKey}
                role="gridcell"
                aria-label={`${cell.day}${punished ? ", workout completed" : ", no workout"}`}
                className={cn(
                  "workout-calendar__cell",
                  punished
                    ? "workout-calendar__cell--punished"
                    : "workout-calendar__cell--rest",
                  isToday && "workout-calendar__cell--today",
                )}
              >
                <span className="workout-calendar__day">{cell.day}</span>
              </div>
            );
          })}
        </div>

        <p className="workout-calendar__summary">
          <span className="text-green">{punishedCount}</span>
          <span className="text-dim">
            {" "}
            {punishedCount === 1 ? "day" : "days"} punished this month
          </span>
        </p>
      </div>
    </TerminalWindow>
  );
}
