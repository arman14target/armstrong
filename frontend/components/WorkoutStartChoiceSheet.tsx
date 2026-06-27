"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";

interface WorkoutStartChoiceSheetProps {
  open: boolean;
  label: string;
  onStart: () => void;
  onEditLayout: () => void;
  onClose: () => void;
}

export function WorkoutStartChoiceSheet({
  open,
  label,
  onStart,
  onEditLayout,
  onClose,
}: WorkoutStartChoiceSheetProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-start-choice-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg/55 backdrop-blur-[2px]"
        aria-label={t("workout.startChoiceCloseAria")}
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-t-[1.35rem] border border-line border-b-0 bg-panel px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-modal)]">
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-line/80"
          aria-hidden="true"
        />

        <h2
          id="workout-start-choice-title"
          className="font-display text-base tracking-wide text-heading"
        >
          {t("workout.startChoiceTitle", { name: label })}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          {t("workout.startChoiceBody")}
        </p>

        <div className="mt-5 stack-sm">
          <CyberButton variant="green" className="w-full" onClick={onStart}>
            {t("workout.startWorkout")}
          </CyberButton>
          <CyberButton variant="cyan" className="w-full" onClick={onEditLayout}>
            {t("workout.editLayout")}
          </CyberButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
