"use client";

import { useEffect } from "react";
import { WorkoutBatchEditor } from "@/components/WorkoutBatchEditor";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import {
  BatchExercisePreset,
  WorkoutBatch,
  createEmptyWorkoutBatch,
  getDefaultWorkoutBatch,
} from "@/lib/workoutBatches";
import { isBuiltinWorkoutType } from "@/lib/workouts";

interface WorkoutSetupModalProps {
  open: boolean;
  workoutId: string;
  label: string;
  onImport: (exercises: BatchExercisePreset[]) => void;
  onCancel: () => void;
}

function getSetupBatch(workoutId: string, label: string): WorkoutBatch {
  if (isBuiltinWorkoutType(workoutId)) {
    return getDefaultWorkoutBatch(workoutId);
  }

  return createEmptyWorkoutBatch(label);
}

export function WorkoutSetupModal({
  open,
  workoutId,
  label,
  onImport,
  onCancel,
}: WorkoutSetupModalProps) {
  const batch = getSetupBatch(workoutId, label);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

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
        <div className="panel-header justify-between">
          <div className="inline-flex min-w-0 items-center">
            <PanelDot />
            <span className="ml-[var(--space-inline)] tracking-wide text-cyan">
              Setup
            </span>
          </div>
          <IconButton
            label="Cancel setup"
            variant="ghost"
            className="size-8"
            onClick={onCancel}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-body">
          <h2
            id="workout-setup-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            Set up {label}
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            {isBuiltinWorkoutType(workoutId)
              ? "Edit the default plan below, then import all when you're ready."
              : "Add your exercises below, then import all when you're ready."}
          </p>

          <div className="mt-[var(--space-gap-md)] rounded-cyber border border-line bg-bg/50 p-[var(--space-panel)]">
            <WorkoutBatchEditor
              batch={batch}
              importLabel="Import all"
              onImport={onImport}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
