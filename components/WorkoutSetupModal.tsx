"use client";

import { useEffect } from "react";
import { WorkoutBatchEditor } from "@/components/WorkoutBatchEditor";
import { CyberButton } from "@/components/ui/CyberButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import { BatchExercisePreset, getDefaultWorkoutBatch } from "@/lib/workoutBatches";
import { WORKOUT_LABELS, WorkoutType } from "@/lib/types";

interface WorkoutSetupModalProps {
  open: boolean;
  workoutType: WorkoutType;
  onImport: (exercises: BatchExercisePreset[]) => void;
  onManualSetup: () => void;
  onCancel: () => void;
}

export function WorkoutSetupModal({
  open,
  workoutType,
  onImport,
  onManualSetup,
  onCancel,
}: WorkoutSetupModalProps) {
  const batch = getDefaultWorkoutBatch(workoutType);
  const label = WORKOUT_LABELS[workoutType];

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onManualSetup();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onManualSetup]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-setup-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-panel border border-cyan/35 bg-panel shadow-[var(--shadow-modal)]",
        )}
      >
        <div className="panel-header">
          <PanelDot />
          <span className="ml-[var(--space-inline)] tracking-wide text-cyan">Setup</span>
        </div>

        <div className="modal-body">
          <h2
            id="workout-setup-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            Set up {label}
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            First time here? Edit the default plan below or add exercises
            manually one by one.
          </p>

          <div className="mt-[var(--space-gap-md)] rounded-cyber border border-line bg-bg/50 p-[var(--space-panel)]">
            <WorkoutBatchEditor
              batch={batch}
              importLabel="Import all"
              onImport={onImport}
            />
          </div>

          <div className="mt-[var(--space-gap-md)] stack-sm">
            <CyberButton
              variant="cyan"
              className="w-full"
              onClick={onManualSetup}
            >
              Add exercises manually
            </CyberButton>
            <CyberButton
              variant="magenta"
              className="w-full"
              onClick={onCancel}
            >
              Cancel
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
