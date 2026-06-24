"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";

interface LeaveWorkoutModalProps {
  open: boolean;
  label: string;
  completedSetCount: number;
  onSave: () => void;
  onCancelSession: () => void;
  onStay: () => void;
}

export function LeaveWorkoutModal({
  open,
  label,
  completedSetCount,
  onSave,
  onCancelSession,
  onStay,
}: LeaveWorkoutModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onStay();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onStay]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-workout-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
        onClick={onStay}
      />

      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-panel border border-cyan/35 bg-panel shadow-[var(--shadow-modal)]",
        )}
      >
        <div className="panel-header">
          <PanelDot />
          <span className="ml-[var(--space-inline)] tracking-wide text-cyan">
            {t("workout.leavePanelTitle")}
          </span>
        </div>

        <div className="modal-body">
          <h2
            id="leave-workout-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            {t("workout.leaveSaveOrCancel", { label })}
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            {completedSetCount > 0 ? (
              <>
                {t("workout.leaveCompletedSets", {
                  count: completedSetCount,
                  setLabel: t("common.set", { count: completedSetCount }),
                })}{" "}
              </>
            ) : (
              <>{t("workout.leaveInProgress")} </>
            )}
            {t("workout.leaveDescription")}
          </p>

          <div className="mt-[var(--space-section)] stack-sm">
            <CyberButton variant="green" className="w-full" onClick={onSave}>
              {t("workout.saveAndGoHome")}
            </CyberButton>
            <CyberButton
              variant="red"
              className="w-full min-h-12 border-red-500/40 bg-red-500/10"
              onClick={onCancelSession}
            >
              {t("workout.cancelSession")}
            </CyberButton>
            <CyberButton variant="cyan" className="w-full" onClick={onStay}>
              {t("workout.keepTraining")}
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
