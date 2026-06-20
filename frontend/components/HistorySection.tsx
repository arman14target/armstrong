"use client";

import { useMemo, useState } from "react";
import {
  CalendarDayDetailModal,
  type CalendarDayWorkout,
} from "@/components/CalendarDayDetailModal";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { WorkoutMonthCalendar } from "@/components/WorkoutMonthCalendar";
import {
  buildActivityHistory,
  type ActivityHistoryItem,
} from "@/lib/activityHistory";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/formatRelativeTime";
import type { AppData } from "@/lib/types";
import { formatDateLabel } from "@/lib/workoutCalendar";
import { getWorkoutEntriesForDate, getWorkoutLabel } from "@/lib/workouts";

type HistoryView = "activity" | "calendar";

interface HistorySectionProps {
  data: AppData;
}

function ActivityHistoryRow({
  item,
  onSelectDate,
}: {
  item: ActivityHistoryItem;
  onSelectDate: (dateKey: string) => void;
}) {
  const isWorkout = item.kind === "workout";
  const dateLabel = formatDateLabel(item.dateKey);

  return (
    <button
      type="button"
      onClick={() => onSelectDate(item.dateKey)}
      className={cn(
        "activity-history__row",
        isWorkout
          ? "activity-history__row--workout"
          : "activity-history__row--food",
      )}
    >
      <div className="activity-history__row-main">
        <p className="activity-history__row-title">
          {isWorkout ? item.label : item.name}
        </p>
        <p className="activity-history__row-meta">
          {isWorkout ? (
            <>
              {formatDuration(item.durationSeconds)}
              {item.durationSeconds !== undefined ? " session" : ""}
            </>
          ) : (
            <>
              {item.calories} kcal · P {item.proteinG}g · C {item.carbsG}g · F{" "}
              {item.fatG}g
              {item.fromPlan && !item.completed ? " · planned" : ""}
            </>
          )}
        </p>
      </div>
      <p className="activity-history__row-date">{dateLabel}</p>
    </button>
  );
}

export function HistorySection({ data }: HistorySectionProps) {
  const [view, setView] = useState<HistoryView>("activity");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const historyItems = useMemo(
    () => buildActivityHistory(data, data.foodLog, data.workoutDayLog),
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
      <fieldset className="planner-segment history-section__tabs">
        <legend className="sr-only">History view</legend>
        <div className="planner-segment__options history-section__tab-options">
          <button
            type="button"
            className={view === "activity" ? "is-active" : undefined}
            onClick={() => setView("activity")}
          >
            Activity
          </button>
          <button
            type="button"
            className={view === "calendar" ? "is-active" : undefined}
            onClick={() => setView("calendar")}
          >
            Calendar
          </button>
        </div>
      </fieldset>

      {view === "activity" ? (
        <TerminalWindow title="activity log">
          {historyItems.length === 0 ? (
            <p className="activity-history__empty">
              No activity yet. Finish a workout or log food to see your history
              here.
            </p>
          ) : (
            <ul className="activity-history__list">
              {historyItems.map((item) => (
                <li key={item.kind === "workout" ? `w-${item.timestamp}-${item.workoutId}` : `f-${item.entryId}`}>
                  <ActivityHistoryRow
                    item={item}
                    onSelectDate={setSelectedDateKey}
                  />
                </li>
              ))}
            </ul>
          )}
        </TerminalWindow>
      ) : (
        <WorkoutMonthCalendar
          data={data}
          nutritionProfile={data.nutritionProfile}
          foodLog={data.foodLog}
          workoutDayLog={data.workoutDayLog}
        />
      )}

      <CalendarDayDetailModal
        open={selectedDateKey !== null}
        dateKey={selectedDateKey}
        workouts={selectedWorkouts}
        foodEntries={selectedFoodEntries}
        nutritionProfile={data.nutritionProfile}
        onClose={() => setSelectedDateKey(null)}
      />
    </>
  );
}
