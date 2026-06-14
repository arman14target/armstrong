"use client";

import { useEffect, useState } from "react";
import { CheckIcon, TrashIcon } from "@/components/icons/ActionIcons";
import { RestTimer } from "@/components/RestTimer";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";

interface SetRowProps {
  index: number;
  setId: string;
  restSeconds: number;
  lastWeight?: number;
  sessionWeight?: number;
  fallbackWeight?: number;
  isCompleted: boolean;
  showRestTimer: boolean;
  restEndsAt?: string;
  onRestSecondsChange: (seconds: number) => void;
  onComplete: (weight: number, restSeconds: number) => void;
  onRestComplete: (setId: string) => void;
  onDelete: () => void;
}

export function SetRow({
  index,
  setId,
  restSeconds,
  lastWeight,
  sessionWeight,
  fallbackWeight,
  isCompleted,
  showRestTimer,
  restEndsAt,
  onRestSecondsChange,
  onComplete,
  onRestComplete,
  onDelete,
}: SetRowProps) {
  const defaultWeight =
    sessionWeight !== undefined ? sessionWeight : (lastWeight ?? "");
  const [weight, setWeight] = useState<string>(
    defaultWeight === "" ? "" : String(defaultWeight),
  );
  const [rest, setRest] = useState(String(restSeconds));
  const [weightError, setWeightError] = useState(false);
  const [restError, setRestError] = useState(false);

  useEffect(() => {
    if (sessionWeight !== undefined) {
      setWeight(String(sessionWeight));
      setWeightError(false);
      return;
    }

    if (fallbackWeight !== undefined) {
      setWeight((current) => (current === "" ? String(fallbackWeight) : current));
      setWeightError(false);
    }
  }, [sessionWeight, fallbackWeight]);

  const isValidWeight = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      return false;
    }

    const parsed = parseFloat(trimmed);
    return !Number.isNaN(parsed) && parsed >= 0;
  };

  const isValidRest = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      return false;
    }

    const parsed = parseInt(trimmed, 10);
    return !Number.isNaN(parsed) && parsed >= 0;
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    if (isValidWeight(value)) {
      setWeightError(false);
    }
  };

  const handleRestChange = (value: string) => {
    setRest(value);
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      onRestSecondsChange(parsed);
    }
    if (isValidRest(value)) {
      setRestError(false);
    }
  };

  const handleComplete = () => {
    const weightValid = isValidWeight(weight);
    const restValid = isValidRest(rest);

    setWeightError(!weightValid);
    setRestError(!restValid);

    if (!weightValid || !restValid) {
      return;
    }

    onComplete(parseFloat(weight.trim()), parseInt(rest.trim(), 10));
  };

  const inputErrorClass = "border-red-500/60 focus:border-red-400";

  return (
    <div
      className={cn(
        "rounded-cyber border border-line bg-bg/60 p-[var(--space-panel)]",
        isCompleted && "border-green/50",
      )}
    >
      <div className="mb-[var(--space-gap)] flex items-center justify-between gap-[var(--space-gap)]">
        <span className="text-xs text-dim">Set {index + 1}</span>
        <IconButton
          label={`Remove set ${index + 1}`}
          variant="danger"
          className="size-8"
          onClick={onDelete}
        >
          <TrashIcon />
        </IconButton>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
        <label className="flex min-w-0 flex-col gap-1 text-xs text-dim">
          <span className={cn(weightError ? "text-red-400" : "text-cyan")}>
            kg
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={weight}
            onChange={(event) => handleWeightChange(event.target.value)}
            placeholder="0"
            className={cn(
              "cyber-input min-h-10 tabular-nums sm:min-h-11",
              weightError && inputErrorClass,
            )}
            aria-invalid={weightError}
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 text-xs text-dim">
          <span className={cn(restError ? "text-red-400" : "text-cyan")}>
            sec
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="5"
            value={rest}
            onChange={(event) => handleRestChange(event.target.value)}
            className={cn(
              "cyber-input min-h-10 tabular-nums sm:min-h-11",
              restError && inputErrorClass,
            )}
            aria-invalid={restError}
          />
        </label>

        <IconButton
          label={isCompleted ? `Set ${index + 1} completed` : `Complete set ${index + 1}`}
          variant={isCompleted ? "green" : "cyan"}
          className="size-10 shrink-0 sm:size-11"
          onClick={handleComplete}
        >
          <CheckIcon />
        </IconButton>
      </div>

      {showRestTimer ? (
        <RestTimer
          endsAt={restEndsAt}
          durationSeconds={restSeconds}
          onComplete={() => onRestComplete(setId)}
        />
      ) : null}
    </div>
  );
}
