"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";
import { useInteractiveBottomSheet } from "@/hooks/useInteractiveBottomSheet";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    present,
    panelRef,
    handleProps,
    scrollTouchHandlers,
    panelStyle,
    backdropStyle,
  } = useInteractiveBottomSheet({
    isActive: open,
    onDismiss: onClose,
    scrollRef,
  });

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

  useEffect(() => {
    if (!present) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [present]);

  if (!mounted || !present) {
    return null;
  }

  return createPortal(
    <div
      className="workout-bottom-sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-start-choice-title"
    >
      <div
        className="workout-bottom-sheet__backdrop"
        style={backdropStyle}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="workout-bottom-sheet__panel workout-bottom-sheet__panel--compact"
        style={panelStyle}
      >
        <div className="workout-bottom-sheet__handle-zone" {...handleProps}>
          <div className="workout-bottom-sheet__handle" aria-hidden="true" />
          <span className="sr-only">{t("workout.sheetHandleAria")}</span>
        </div>

        <div
          ref={scrollRef}
          className="workout-bottom-sheet__scroll workout-bottom-sheet__scroll--compact"
          {...scrollTouchHandlers}
        >
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
      </div>
    </div>,
    document.body,
  );
}
