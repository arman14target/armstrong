"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { CyberButton } from "@/components/ui/CyberButton";
import { PanelDot } from "@/components/ui/PanelDot";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirming?: boolean;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirming = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirming) {
        onCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onCancel, confirming]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-panel border border-magenta/35 bg-panel shadow-[var(--shadow-modal-danger)]",
        )}
      >
        <div className="panel-header">
          <PanelDot />
          <span className="ml-[var(--space-inline)] tracking-wide text-magenta">Warning</span>
        </div>

        <div className="modal-body">
          <h2
            id="confirm-modal-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            {title}
          </h2>
          <div className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">{message}</div>

          <div className="mt-[var(--space-section)] flex flex-col-reverse gap-[var(--space-gap)] sm:flex-row sm:justify-end">
            <CyberButton
              variant="cyan"
              className="w-full sm:w-auto"
              onClick={onCancel}
              disabled={confirming}
            >
              {cancelLabel}
            </CyberButton>
            <CyberButton
              variant="magenta"
              className="w-full sm:w-auto"
              onClick={onConfirm}
              disabled={confirming}
            >
              {confirming ? "Resetting..." : confirmLabel}
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
