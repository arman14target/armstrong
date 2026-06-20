"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "@/components/icons/ActionIcons";
import { NumericKeyboardInput } from "@/components/NumericKeyboardInput";
import { IconButton } from "@/components/ui/IconButton";
import { formatPreviousSet } from "@/lib/formatSetDisplay";
import { tryVibrate } from "@/lib/vibration";
import { cn } from "@/lib/cn";

const WEIGHT_STEP = 2.5;
const TIME_STEP = 15;
const REPS_STEP = 1;

interface SetRowProps {
  index: number;
  isTimeBased?: boolean;
  lastWeight?: number;
  lastReps?: number;
  sessionWeight?: number;
  sessionReps?: number;
  fallbackWeight?: number;
  fallbackReps?: number;
  isCompleted: boolean;
  onComplete: (weight: number, reps: number) => void;
  onUncomplete?: () => void;
}

function isIncrementKey(key: string): boolean {
  return key === "ArrowUp" || key === "+" || key === "=" || key === "NumpadAdd";
}

function isDecrementKey(key: string): boolean {
  return key === "ArrowDown" || key === "-" || key === "NumpadSubtract";
}

function selectInputValue(event: React.FocusEvent<HTMLInputElement>) {
  event.target.select();
}

export function SetRow({
  index,
  isTimeBased = false,
  lastWeight,
  lastReps,
  sessionWeight,
  sessionReps,
  fallbackWeight,
  fallbackReps,
  isCompleted,
  onComplete,
  onUncomplete,
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
  const lastClickTimeRef = useRef(0);

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

  const adjustWeight = (delta: number) => {
    const current = isValidWeight(weight) ? parseFloat(weight.trim()) : 0;
    const next = Math.max(0, Math.round((current + delta) * 2) / 2);
    setWeight(String(next));
    setWeightError(false);
  };

  const adjustReps = (delta: number) => {
    const step = isTimeBased ? TIME_STEP : REPS_STEP;
    const current = isValidReps(reps) ? parseInt(reps.trim(), 10) : step;
    const next = Math.max(step, current + delta * step);
    setReps(String(next));
    setRepsError(false);
  };

  const handleWeightKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isIncrementKey(event.key)) {
      event.preventDefault();
      adjustWeight(WEIGHT_STEP);
    } else if (isDecrementKey(event.key)) {
      event.preventDefault();
      adjustWeight(-WEIGHT_STEP);
    }
  };

  const handleRepsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (isIncrementKey(event.key)) {
      event.preventDefault();
      adjustReps(1);
    } else if (isDecrementKey(event.key)) {
      event.preventDefault();
      adjustReps(-1);
    }
  };

  const handleComplete = () => {
    const weightValue = isTimeBased ? 0 : parseFloat(weight.trim());
    const repsValid = isValidReps(reps);
    const weightValid = isTimeBased || isValidWeight(weight);

    setWeightError(!isTimeBased && !isValidWeight(weight));
    setRepsError(!repsValid);

    if (!weightValid || !repsValid) {
      return;
    }

    tryVibrate();
    onComplete(weightValue, parseInt(reps.trim(), 10));
  };

  const handleCompleteClick = () => {
    const now = Date.now();
    const isDoubleClick = now - lastClickTimeRef.current < 350;

    if (isCompleted && isDoubleClick && onUncomplete) {
      onUncomplete();
      lastClickTimeRef.current = 0;
      return;
    }

    lastClickTimeRef.current = now;

    if (!isCompleted) {
      handleComplete();
    }
  };

  const previous = formatPreviousSet(lastWeight, lastReps, isTimeBased);
  const inputErrorClass = "border-red-500/60 focus:border-red-400";

  return (
    <div
      className={cn(
        "set-table-row",
        isTimeBased && "set-table-row--time-based",
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

      {isTimeBased ? (
        <div className="set-table-row__field set-table-row__field--empty" aria-hidden>
          <span className="text-dim/40">—</span>
        </div>
      ) : (
        <label className="set-table-row__field">
          <span className="sr-only">Weight in kg for set {index + 1}</span>
          <NumericKeyboardInput
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={weight}
            onValueChange={handleWeightChange}
            onIncrement={() => adjustWeight(WEIGHT_STEP)}
            onDecrement={() => adjustWeight(-WEIGHT_STEP)}
            allowDecimal
            onFocus={selectInputValue}
            onKeyDown={handleWeightKeyDown}
            placeholder="0"
            className={cn(
              "set-table-row__input",
              weightError && inputErrorClass,
            )}
            aria-invalid={weightError}
          />
        </label>
      )}

      <label className="set-table-row__field">
        <span className="sr-only">
          {isTimeBased ? `Hold time in seconds for set ${index + 1}` : `Reps for set ${index + 1}`}
        </span>
        <NumericKeyboardInput
          type="number"
          inputMode="numeric"
          min="1"
          step={isTimeBased ? TIME_STEP : 1}
          value={reps}
          onValueChange={handleRepsChange}
          onIncrement={() => adjustReps(1)}
          onDecrement={() => adjustReps(-1)}
          onFocus={selectInputValue}
          onKeyDown={handleRepsKeyDown}
          placeholder={isTimeBased ? "45" : "0"}
          className={cn(
            "set-table-row__input",
            repsError && inputErrorClass,
          )}
          aria-invalid={repsError}
        />
      </label>

      <div className="set-table-row__action">
        <IconButton
          label={
            isCompleted
              ? `Set ${index + 1} completed — double-click to undo`
              : `Complete set ${index + 1}`
          }
          variant={isCompleted ? "green" : "cyan"}
          className="size-9 sm:size-10"
          onClick={handleCompleteClick}
        >
          <CheckIcon />
        </IconButton>
      </div>
    </div>
  );
}
