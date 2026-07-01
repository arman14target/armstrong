"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { WorkoutScreen } from "@/components/WorkoutScreen";
import { useInteractiveBottomSheet } from "@/hooks/useInteractiveBottomSheet";

export type WorkoutSheetMode = "session" | "layout";

interface WorkoutBottomSheetProps {
  open: boolean;
  minimized: boolean;
  workoutId: string;
  mode: WorkoutSheetMode;
  onMinimize: () => void;
  onClose: () => void;
}

export function WorkoutBottomSheet({
  open,
  minimized,
  workoutId,
  mode,
  onMinimize,
  onClose,
}: WorkoutBottomSheetProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isActive = open && !minimized;

  const {
    present,
    panelRef,
    handleProps,
    scrollTouchHandlers,
    panelStyle,
    backdropStyle,
  } = useInteractiveBottomSheet({
    isActive,
    onDismiss: onMinimize,
    notifyDismissOnStart: true,
    scrollRef,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
      aria-label={t("workout.sheetAria")}
    >
      <div
        className="workout-bottom-sheet__backdrop"
        style={backdropStyle}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="workout-bottom-sheet__panel"
        style={panelStyle}
      >
        <div className="workout-bottom-sheet__handle-zone" {...handleProps}>
          <div className="workout-bottom-sheet__handle" aria-hidden="true" />
          <span className="sr-only">{t("workout.sheetHandleAria")}</span>
        </div>

        <div
          ref={scrollRef}
          className="workout-bottom-sheet__scroll"
          {...scrollTouchHandlers}
        >
          <WorkoutScreen
            workoutId={workoutId}
            mode={mode}
            embedded
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
