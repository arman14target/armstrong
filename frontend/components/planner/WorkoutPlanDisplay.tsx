"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GymPlanResult } from "@/lib/planner/gymPlan";
import { ImportPlanButton } from "@/components/planner/ImportPlanButton";

interface WorkoutPlanDisplayProps {
  plan: GymPlanResult;
  onImportToApp?: () => void;
}

export function WorkoutPlanDisplay({ plan, onImportToApp }: WorkoutPlanDisplayProps) {
  const { t } = useTranslation();
  const [openDay, setOpenDay] = useState(plan.days[0]?.dayLabel ?? "");

  return (
    <div className="planner-result">
      <div className="planner-result__summary">
        <p className="planner-result__kicker">{plan.splitName}</p>
        <p className="planner-result__calories">
          {plan.weeklySets}
          <span className="planner-result__calories-unit">{t("planner.gym.display.setsPerWeek")}</span>
        </p>

        <div className="planner-volume">
          <div className="planner-volume__head">
            <span>{t("planner.gym.display.weeklyVolume")}</span>
            <span>{t("planner.gym.display.tier", { level: t(`experience.labels.${plan.experience}`) })}</span>
          </div>
          <div className="planner-volume__track" aria-hidden>
            <div
              className="planner-volume__fill planner-macro__fill--cyan"
              style={{ width: `${plan.weeklyVolumeBar}%` }}
            />
          </div>
        </div>

        <p className="planner-result__meta">
          <strong>{t("planner.gym.display.progression")}</strong> {plan.progressionNote}
        </p>
        <p className="planner-result__meta">
          <strong>{t("planner.gym.display.recovery")}</strong> {plan.recoveryNote}
        </p>
        {onImportToApp ? (
          <ImportPlanButton
            onImport={onImportToApp}
            label={t("planner.import.workout")}
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
                  {t("planner.gym.display.exercises", { count: day.exercises.length })}
                  {" · "}
                  {t("planner.gym.display.minutes", { count: day.estimatedMinutes })}
                </span>
              </button>

              {isOpen ? (
                <div className="planner-workout__body">
                  <p className="planner-workout__focus">{day.focus}</p>
                  <table className="planner-workout__table">
                    <thead>
                      <tr>
                        <th scope="col">{t("planner.gym.display.exercise")}</th>
                        <th scope="col">{t("planner.gym.display.sets")}</th>
                        <th scope="col">{t("planner.gym.display.reps")}</th>
                        <th scope="col">{t("planner.gym.display.rest")}</th>
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
                          <td>{t("planner.gym.display.restSeconds", { seconds: ex.restSeconds })}</td>
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
