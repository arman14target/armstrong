"use client";

import { useEffect, useState } from "react";
import { ExerciseDemoAnimation } from "@/components/ExerciseDemoAnimation";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import {
  getExerciseDetail,
  type ExerciseDetail,
} from "@/lib/exerciseSearch";

interface ExerciseInfoModalProps {
  open: boolean;
  slug: string | null;
  onClose: () => void;
}

export function ExerciseInfoModal({
  open,
  slug,
  onClose,
}: ExerciseInfoModalProps) {
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slug) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    void getExerciseDetail(slug)
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (!result) {
          setError("Exercise details not found.");
          return;
        }

        setDetail(result);
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load exercise details.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, slug]);

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

  if (!open || !slug) {
    return null;
  }

  const title = detail?.name ?? "Exercise info";

  return (
    <div
      className="modal-overlay z-[110]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-info-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-panel border border-cyan/35 bg-panel shadow-[var(--shadow-modal)]",
        )}
      >
        <div className="panel-header justify-between">
          <div className="inline-flex min-w-0 items-center">
            <PanelDot />
            <span
              id="exercise-info-title"
              className="ml-[var(--space-inline)] truncate tracking-wide text-cyan"
            >
              {title}
            </span>
          </div>
          <IconButton
            label="Close exercise info"
            variant="ghost"
            className="size-8"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-body stack-md">
          {loading ? (
            <p className="text-sm text-dim">Loading exercise details...</p>
          ) : error ? (
            <p className="text-sm text-dim">{error}</p>
          ) : detail ? (
            <>
              {detail.imageUrls.length > 0 ? (
                <ExerciseDemoAnimation
                  name={detail.name}
                  imageUrls={detail.imageUrls}
                />
              ) : null}

              <div className="text-sm text-dim">
                <p>
                  <span className="text-heading">{detail.primaryMuscle}</span>
                  {detail.equipment ? ` · ${detail.equipment}` : null}
                  {detail.level ? ` · ${detail.level}` : null}
                </p>
              </div>

              {detail.instructions.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium tracking-wide text-heading">
                    How to perform
                  </h3>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-dim">
                    {detail.instructions.map((step, index) => (
                      <li key={`${index}-${step.slice(0, 24)}`}>{step}</li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-dim">
                  No instructions available for this exercise yet.
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
