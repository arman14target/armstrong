"use client";

import { useEffect } from "react";
import { CyberButton } from "@/components/ui/CyberButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import { WORKOUT_LABELS, WorkoutType } from "@/lib/types";

interface LeaveWorkoutModalProps {
  open: boolean;
  workoutType: WorkoutType;
  completedSetCount: number;
  onSave: () => void;
  onCancelSession: () => void;
  onStay: () => void;
}

export function LeaveWorkoutModal({
  open,
  workoutType,
  completedSetCount,
  onSave,
  onCancelSession,
  onStay,
}: LeaveWorkoutModalProps) {
  const label = WORKOUT_LABELS[workoutType];

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
            Leave workout
          </span>
        </div>

        <div className="modal-body">
          <h2
            id="leave-workout-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            Save or cancel {label}?
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            {completedSetCount > 0 ? (
              <>
                You&apos;ve completed{" "}
                <span className="text-green">{completedSetCount}</span>{" "}
                {completedSetCount === 1 ? "set" : "sets"} this session.
              </>
            ) : (
              <>Your session is in progress.</>
            )}{" "}
            Save your progress to pick up where you left off, or cancel to
            discard everything from this session.
          </p>

          <div className="mt-[var(--space-section)] stack-sm">
            <CyberButton variant="green" className="w-full" onClick={onSave}>
              Save workout &amp; go home
            </CyberButton>
            <CyberButton
              variant="magenta"
              className="w-full"
              onClick={onCancelSession}
            >
              Cancel this session
            </CyberButton>
            <CyberButton variant="cyan" className="w-full" onClick={onStay}>
              Keep training
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
