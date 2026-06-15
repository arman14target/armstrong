"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "@/components/icons/ActionIcons";
import { IconButton } from "@/components/ui/IconButton";
import { formatPreviousSet } from "@/lib/formatSetDisplay";
import { cn } from "@/lib/cn";

interface SetRowProps {
  index: number;
  lastWeight?: number;
  lastReps?: number;
  sessionWeight?: number;
  sessionReps?: number;
  fallbackWeight?: number;
  fallbackReps?: number;
  isCompleted: boolean;
  onComplete: (weight: number, reps: number) => void;
}

export function SetRow({
  index,
  lastWeight,
  lastReps,
  sessionWeight,
  sessionReps,
  fallbackWeight,
  fallbackReps,
  isCompleted,
  onComplete,
}: SetRowProps) {
  const defaultWeight =
    sessionWeight !== undefined ? sessionWeight : (lastWeight ?? "");
  const defaultReps =
    sessionReps !== undefined ? sessionReps : (lastReps ?? "");
  const [weight, setWeight] = useState<string>(
    defaultWeight === "" ? "" : String(defaultWeight),
  );
  const [reps, setReps] = useState<string>(
    defaultReps === "" ? "" : String(defaultReps),
  );
  const [weightError, setWeightError] = useState(false);
  const [repsError, setRepsError] = useState(false);

  useEffect(() => {
    if (sessionWeight !== undefined) {
      setWeight(String(sessionWeight));
      setWeightError(false);
    } else if (fallbackWeight !== undefined) {
      setWeight((current) => (current === "" ? String(fallbackWeight) : current));
      setWeightError(false);
    }
  }, [sessionWeight, fallbackWeight]);

  useEffect(() => {
    if (sessionReps !== undefined) {
      setReps(String(sessionReps));
      setRepsError(false);
    } else if (fallbackReps !== undefined) {
      setReps((current) => (current === "" ? String(fallbackReps) : current));
      setRepsError(false);
    }
  }, [sessionReps, fallbackReps]);

  const isValidWeight = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      return false;
    }

    const parsed = parseFloat(trimmed);
    return !Number.isNaN(parsed) && parsed >= 0;
  };

  const isValidReps = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      return false;
    }

    const parsed = parseInt(trimmed, 10);
    return !Number.isNaN(parsed) && parsed >= 1;
  };

  const handleWeightChange = (value: string) => {
    setWeight(value);
    if (isValidWeight(value)) {
      setWeightError(false);
    }
  };

  const handleRepsChange = (value: string) => {
    setReps(value);
    if (isValidReps(value)) {
      setRepsError(false);
    }
  };

  const handleComplete = () => {
    const weightValid = isValidWeight(weight);
    const repsValid = isValidReps(reps);

    setWeightError(!weightValid);
    setRepsError(!repsValid);

    if (!weightValid || !repsValid) {
      return;
    }

    onComplete(parseFloat(weight.trim()), parseInt(reps.trim(), 10));
  };

  const previous = formatPreviousSet(lastWeight, lastReps);
  const inputErrorClass = "border-red-500/60 focus:border-red-400";

  return (
    <div
      className={cn(
        "set-table-row",
        isCompleted && "set-table-row--completed",
      )}
    >
      <div className="set-table-row__set">
        <span className="set-table-row__set-badge">{index + 1}</span>
      </div>

      <div className="set-table-row__previous">
        {previous ? (
          <span className="truncate">{previous}</span>
        ) : (
          <span className="text-dim/50">—</span>
        )}
      </div>

      <label className="set-table-row__field">
        <span className="sr-only">Weight in kg for set {index + 1}</span>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={weight}
          onChange={(event) => handleWeightChange(event.target.value)}
          placeholder="0"
          className={cn(
            "set-table-row__input",
            weightError && inputErrorClass,
          )}
          aria-invalid={weightError}
        />
      </label>

      <label className="set-table-row__field">
        <span className="sr-only">Reps for set {index + 1}</span>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={reps}
          onChange={(event) => handleRepsChange(event.target.value)}
          placeholder="0"
          className={cn(
            "set-table-row__input",
            repsError && inputErrorClass,
          )}
          aria-invalid={repsError}
        />
      </label>

      <div className="set-table-row__action">
        <IconButton
          label={isCompleted ? `Set ${index + 1} completed` : `Complete set ${index + 1}`}
          variant={isCompleted ? "green" : "cyan"}
          className="size-9 sm:size-10"
          onClick={handleComplete}
        >
          <CheckIcon />
        </IconButton>
      </div>
    </div>
  );
}
