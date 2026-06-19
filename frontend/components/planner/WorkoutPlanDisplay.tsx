"use client";

import { useState } from "react";
import type { GymPlanResult } from "@/lib/planner/gymPlan";
import { EXPERIENCE_LABELS } from "@/lib/planner/experience";
import { ImportPlanButton } from "@/components/planner/ImportPlanButton";

interface WorkoutPlanDisplayProps {
  plan: GymPlanResult;
  onImportToApp?: () => void;
}

export function WorkoutPlanDisplay({ plan, onImportToApp }: WorkoutPlanDisplayProps) {
  const [openDay, setOpenDay] = useState(plan.days[0]?.dayLabel ?? "");

  return (
    <div className="planner-result">
      <div className="planner-result__summary">
        <p className="planner-result__kicker">{plan.splitName}</p>
        <p className="planner-result__calories">
          {plan.weeklySets}
          <span className="planner-result__calories-unit">sets / week</span>
        </p>

        <div className="planner-volume">
          <div className="planner-volume__head">
            <span>Weekly volume</span>
            <span>{EXPERIENCE_LABELS[plan.experience]} tier</span>
          </div>
          <div className="planner-volume__track" aria-hidden>
            <div
              className="planner-volume__fill planner-macro__fill--cyan"
              style={{ width: `${plan.weeklyVolumeBar}%` }}
            />
          </div>
        </div>

        <p className="planner-result__meta">
          <strong>Progression:</strong> {plan.progressionNote}
        </p>
        <p className="planner-result__meta">
          <strong>Recovery:</strong> {plan.recoveryNote}
        </p>
        {onImportToApp ? (
          <ImportPlanButton
            onImport={onImportToApp}
            label="Add workout split to app"
            className="w-full"
          />
        ) : null}
      </div>

      <div className="planner-workouts">
        {plan.days.map((day) => {
          const isOpen = openDay === day.dayLabel;
          return (
            <article key={day.dayLabel} className="planner-workout">
              <button
                type="button"
                className="planner-workout__toggle"
                aria-expanded={isOpen}
                onClick={() => setOpenDay(isOpen ? "" : day.dayLabel)}
              >
                <span className="planner-workout__day">{day.dayLabel}</span>
                <span className="planner-workout__name">{day.name}</span>
                <span className="planner-workout__meta">
                  {day.exercises.length} exercises · ~{day.estimatedMinutes} min
                </span>
              </button>

              {isOpen ? (
                <div className="planner-workout__body">
                  <p className="planner-workout__focus">{day.focus}</p>
                  <table className="planner-workout__table">
                    <thead>
                      <tr>
                        <th scope="col">Exercise</th>
                        <th scope="col">Sets</th>
                        <th scope="col">Reps</th>
                        <th scope="col">Rest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.exercises.map((ex) => (
                        <tr key={ex.name}>
                          <td>
                            {ex.name}
                            {ex.notes ? (
                              <span className="planner-workout__note">{ex.notes}</span>
                            ) : null}
                          </td>
                          <td>{ex.sets}</td>
                          <td>{ex.reps}</td>
                          <td>{ex.restSeconds}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
