"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";

interface ActiveWorkoutConflictSheetProps {
  open: boolean;
  currentLabel: string;
  nextLabel: string;
  onFinish: () => void;
  onCancelSession: () => void;
  onKeepCurrent: () => void;
}

export function ActiveWorkoutConflictSheet({
  open,
  currentLabel,
  nextLabel,
  onFinish,
  onCancelSession,
  onKeepCurrent,
}: ActiveWorkoutConflictSheetProps) {
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
        onKeepCurrent();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeepCurrent, open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[115] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-conflict-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg/55 backdrop-blur-[2px]"
        aria-label={t("workout.conflictCloseAria")}
        onClick={onKeepCurrent}
      />

      <div className="relative w-full max-w-lg rounded-t-[1.35rem] border border-line border-b-0 bg-panel px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-modal)]">
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-line/80"
          aria-hidden="true"
        />

        <h2
          id="workout-conflict-title"
          className="font-display text-base tracking-wide text-heading"
        >
          {t("workout.conflictTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          {t("workout.conflictBody", {
            current: currentLabel,
            next: nextLabel,
          })}
        </p>

        <div className="mt-5 stack-sm">
          <CyberButton variant="green" className="w-full" onClick={onFinish}>
            {t("workout.conflictFinish", { next: nextLabel })}
          </CyberButton>
          <CyberButton
            variant="red"
            className="w-full min-h-12 border-red-500/40 bg-red-500/10"
            onClick={onCancelSession}
          >
            {t("workout.conflictCancel")}
          </CyberButton>
          <CyberButton variant="cyan" className="w-full" onClick={onKeepCurrent}>
            {t("workout.conflictKeep", { current: currentLabel })}
          </CyberButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
