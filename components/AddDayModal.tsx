"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";

interface AddDayModalProps {
  open: boolean;
  onAdd: (name: string) => void;
  onClose: () => void;
}

export function AddDayModal({ open, onAdd, onClose }: AddDayModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setError(false);
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

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError(true);
      return;
    }

    onAdd(trimmed);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-day-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
        onClick={onClose}
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
              New day
            </span>
          </div>
          <IconButton
            label="Close add day"
            variant="ghost"
            className="size-8"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-body">
          <h2
            id="add-day-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            Name your workout day
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            Pick a label for this split. You can set up exercises after creating
            it.
          </p>

          <label className="mt-[var(--space-gap-md)] block">
            <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
              Day name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError(false);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmit();
                }
              }}
              placeholder="e.g. Upper Body"
              autoFocus
              className={cn(
                "cyber-input",
                error && "border-magenta/60",
              )}
              aria-invalid={error}
            />
            {error ? (
              <p className="mt-1 text-xs text-magenta" role="alert">
                Enter a name with at least 2 characters.
              </p>
            ) : null}
          </label>

          <div className="mt-[var(--space-section)] stack-sm">
            <CyberButton variant="green" className="w-full" onClick={handleSubmit}>
              Create day
            </CyberButton>
            <CyberButton variant="cyan" className="w-full" onClick={onClose}>
              Cancel
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
