"use client";

import { useTranslation } from "react-i18next";

interface WelcomeStepProgressProps {
  stepIndex: number;
  totalSteps?: number;
}

export function WelcomeStepProgress({
  stepIndex,
  totalSteps = 4,
}: WelcomeStepProgressProps) {
  const { t } = useTranslation();

  return (
    <nav className="welcome-steps" aria-label={t("welcome.onboardingProgressAria")}>
      <ol className="welcome-steps__track">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isDone = index < stepIndex;
          const isCurrent = index === stepIndex;

          return (
            <li key={index} className="welcome-steps__segment">
              {index > 0 ? (
                <span
                  className={`welcome-steps__connector${
                    index <= stepIndex ? " welcome-steps__connector--done" : ""
                  }`}
                  aria-hidden
                />
              ) : null}

              <span
                className={`welcome-steps__dot${
                  isDone ? " welcome-steps__dot--done" : ""
                }${isCurrent ? " welcome-steps__dot--current" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="sr-only">
                  {t("welcome.stepSr", {
                    index: index + 1,
                    done: isDone ? t("welcome.stepDone") : "",
                    current: isCurrent ? t("welcome.stepCurrent") : "",
                  })}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
