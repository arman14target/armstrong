"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
              {t("workout.setupPanel")}
            </span>
          </div>
          <IconButton
            label={t("workout.setupCloseAria")}
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
            {t("workout.setupTitle", { name: label })}
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            {t("workout.setupHowAdd")}
          </p>

          <div className="mt-[var(--space-gap-md)] stack-sm">
            <CyberButton variant="green" className="w-full" onClick={onBatch}>
              {t("workout.setupBatch")}
            </CyberButton>
            <CyberButton variant="cyan" className="w-full" onClick={onManual}>
              {t("workout.setupManual")}
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
