"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckIcon } from "@/components/icons/ActionIcons";
import { PanelDot } from "@/components/ui/PanelDot";
import { formatTime, useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/cn";

const DEMO_REST_SECONDS = 8;

interface PreviewSet {
  weight: string;
  reps: string;
  previous?: string;
  completed?: boolean;
}

interface PreviewExercise {
  name: string;
  sets: PreviewSet[];
}

function LandingPreviewRestTimer({
  endsAt,
  durationSeconds,
  onComplete,
}: {
  endsAt: string;
  durationSeconds: number;
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const remaining = useCountdown(endsAt, onComplete);

  if (remaining <= 0) {
    return null;
  }

  const total = Math.max(durationSeconds, remaining, 1);
  const progress = Math.min(1, remaining / total);
  const isUrgent = remaining <= 3;

  return (
    <div
      className={cn(
        "landing-preview-rest",
        isUrgent && "landing-preview-rest--urgent",
      )}
      aria-hidden
    >
      <div
        className="landing-preview-rest__fill"
        style={{ width: `${progress * 100}%` }}
      />
      <div className="landing-preview-rest__label">
        <span>{t("landing.preview.rest")}</span>
        <span className="landing-preview-rest__time">{formatTime(remaining)}</span>
      </div>
    </div>
  );
}

function PreviewSetRow({
  index,
  set,
  completed,
}: {
  index: number;
  set: PreviewSet;
  completed: boolean;
}) {
  return (
    <div
      className={cn(
        "landing-preview-set",
        completed && "landing-preview-set--done",
      )}
    >
      <span className="landing-preview-set__badge">{index + 1}</span>
      <span className="landing-preview-set__prev">
        {set.previous ?? "—"}
      </span>
      <span className="landing-preview-set__value">{set.weight}</span>
      <span className="landing-preview-set__value">{set.reps}</span>
      <span
        className={cn(
          "landing-preview-set__check",
          completed && "landing-preview-set__check--done",
        )}
        aria-hidden
      >
        <CheckIcon />
      </span>
    </div>
  );
}

function PreviewExerciseCard({
  exercise,
  benchExerciseName,
  set3Complete,
  restEndsAt,
  onRestComplete,
}: {
  exercise: PreviewExercise;
  benchExerciseName: string;
  set3Complete: boolean;
  restEndsAt: string | null;
  onRestComplete: () => void;
}) {
  const { t } = useTranslation();
  const isBench = exercise.name === benchExerciseName;
  const sets = exercise.sets.map((set, index) =>
    isBench && index === 2 ? { ...set, completed: set3Complete } : set,
  );
  const completedCount = sets.filter((set) => set.completed).length;
  const allDone =
    completedCount === sets.length && sets.length > 0;
  const showRestAfterSet2 =
    isBench && restEndsAt !== null && !set3Complete;

  return (
    <article className="landing-preview-card">
      <header className="landing-preview-card__header">
        <PanelDot variant={allDone ? "green" : "default"} />
        <span className="landing-preview-card__title">{exercise.name}</span>
      </header>
      <div className="landing-preview-card__body">
        <div className="landing-preview-set landing-preview-set--head">
          <span>{t("landing.preview.set")}</span>
          <span>{t("landing.preview.prev")}</span>
          <span>{t("landing.preview.kg")}</span>
          <span>{t("landing.preview.reps")}</span>
          <span aria-hidden />
        </div>
        {sets.map((set, index) => (
          <div key={`${exercise.name}-${index}`}>
            <PreviewSetRow
              index={index}
              set={set}
              completed={Boolean(set.completed)}
            />
            {showRestAfterSet2 && index === 1 ? (
              <LandingPreviewRestTimer
                endsAt={restEndsAt}
                durationSeconds={DEMO_REST_SECONDS}
                onComplete={onRestComplete}
              />
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}

export function LandingWorkoutPreview() {
  const { t } = useTranslation();
  const benchExerciseName = t("landing.preview.benchPress");

  const pushDayExercises = useMemo<PreviewExercise[]>(
    () => [
      {
        name: benchExerciseName,
        sets: [
          { weight: "80", reps: "8", previous: "77.5 × 8", completed: true },
          { weight: "80", reps: "8", previous: "77.5 × 7", completed: true },
          { weight: "80", reps: "8", previous: "75 × 8" },
        ],
      },
      {
        name: t("landing.preview.inclineDbPress"),
        sets: [
          { weight: "28", reps: "10", previous: "26 × 10", completed: true },
          { weight: "28", reps: "10", previous: "26 × 9" },
          { weight: "28", reps: "10", previous: "24 × 10" },
        ],
      },
      {
        name: t("landing.preview.overheadPress"),
        sets: [
          { weight: "40", reps: "8", previous: "37.5 × 8" },
          { weight: "40", reps: "8", previous: "37.5 × 7" },
        ],
      },
    ],
    [benchExerciseName, t],
  );

  const [set3Complete, setSet3Complete] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<string | null>(null);

  useEffect(() => {
    const endsAt = new Date(
      Date.now() + DEMO_REST_SECONDS * 1000,
    ).toISOString();
    setRestEndsAt(endsAt);
  }, []);

  const handleRestComplete = () => {
    setSet3Complete(true);
    setRestEndsAt(null);
  };

  return (
    <div className="landing-preview">
      <p className="landing-preview__back">{t("landing.preview.backHome")}</p>

      <div className="landing-preview__sticky">
        <h2 className="landing-preview__day">{t("landing.preview.pushDay")}</h2>
        <div className="landing-preview__timer">
          <span className="landing-preview__timer-label">{t("landing.preview.session")}</span>
          <span className="landing-preview__timer-value">42:18</span>
        </div>
      </div>

      <div className="landing-preview__moves">
        {pushDayExercises.map((exercise) => (
          <PreviewExerciseCard
            key={exercise.name}
            exercise={exercise}
            benchExerciseName={benchExerciseName}
            set3Complete={set3Complete}
            restEndsAt={restEndsAt}
            onRestComplete={handleRestComplete}
          />
        ))}
      </div>
    </div>
  );
}
