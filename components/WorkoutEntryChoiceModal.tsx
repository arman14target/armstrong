"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
interface WorkoutEntryChoiceModalProps {
  open: boolean;
  label: string;
  onBatch: () => void;
  onManual: () => void;
  onClose: () => void;
}

export function WorkoutEntryChoiceModal({
  open,
  label,
  onBatch,
  onManual,
  onClose,
}: WorkoutEntryChoiceModalProps) {

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
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-entry-choice-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-panel border border-cyan/35 bg-panel shadow-[var(--shadow-modal)]",
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
            label="Close setup options"
            variant="ghost"
            className="size-8"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-body">
          <h2
            id="workout-entry-choice-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            Set up {label}
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            How would you like to add your exercises?
          </p>

          <div className="mt-[var(--space-gap-md)] stack-sm">
            <CyberButton variant="green" className="w-full" onClick={onBatch}>
              Batch entry
            </CyberButton>
            <CyberButton variant="cyan" className="w-full" onClick={onManual}>
              Manual entry
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
