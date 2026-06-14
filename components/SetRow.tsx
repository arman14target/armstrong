"use client";

import { useState } from "react";
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
  isCompleted: boolean;
  showRestTimer: boolean;
  restEndsAt?: string;
  onRestSecondsChange: (seconds: number) => void;
  onComplete: (weight: number, restSeconds: number) => void;
  onRestComplete: () => void;
  onDelete: () => void;
}

export function SetRow({
  index,
  restSeconds,
  lastWeight,
  sessionWeight,
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

  const handleComplete = () => {
    const parsedWeight = parseFloat(weight);
    const parsedRest = parseInt(rest, 10);
    if (Number.isNaN(parsedWeight) || parsedWeight < 0) {
      return;
    }
    onComplete(parsedWeight, Number.isNaN(parsedRest) ? 90 : parsedRest);
  };

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
          <span className="text-cyan">kg</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            className="cyber-input min-h-10 tabular-nums sm:min-h-11"
          />
        </label>

        <label className="flex min-w-0 flex-col gap-1 text-xs text-dim">
          <span className="text-cyan">sec</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="5"
            value={rest}
            onChange={(e) => {
              setRest(e.target.value);
              const parsed = parseInt(e.target.value, 10);
              if (!Number.isNaN(parsed)) {
                onRestSecondsChange(parsed);
              }
            }}
            className="cyber-input min-h-10 tabular-nums sm:min-h-11"
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
          onComplete={onRestComplete}
        />
      ) : null}
    </div>
  );
}
