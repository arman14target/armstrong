"use client";

import { cn } from "@/lib/cn";
import type { WeightUnit } from "@/lib/types";
import { formatBodyWeight, snapWeightKg, WEIGHT_STEP_KG } from "@/lib/weight";

interface WeightStepperProps {
  valueKg: number;
  onChange: (weightKg: number) => void;
  unit?: WeightUnit;
  minKg?: number;
  maxKg?: number;
  label?: string;
  className?: string;
}

export function WeightStepper({
  valueKg,
  onChange,
  unit = "kg",
  minKg = 40,
  maxKg = 200,
  label = "Current weight",
  className,
}: WeightStepperProps) {
  const adjust = (delta: number) => {
    const next = snapWeightKg(valueKg + delta);
    onChange(Math.min(maxKg, Math.max(minKg, next)));
  };

  return (
    <div className={cn("stack-sm", className)}>
      <p className="text-[10px] tracking-wide text-dim uppercase">{label}</p>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={`Decrease weight by ${WEIGHT_STEP_KG * 1000} grams`}
          onClick={() => adjust(-WEIGHT_STEP_KG)}
          disabled={valueKg <= minKg + WEIGHT_STEP_KG / 2}
          className="flex size-11 shrink-0 items-center justify-center rounded-cyber border border-line bg-bg/50 text-xl font-semibold text-heading transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <p className="min-w-[7.5rem] text-center font-display text-2xl tracking-wide text-heading">
          {formatBodyWeight(valueKg, unit)}
        </p>
        <button
          type="button"
          aria-label={`Increase weight by ${WEIGHT_STEP_KG * 1000} grams`}
          onClick={() => adjust(WEIGHT_STEP_KG)}
          disabled={valueKg >= maxKg - WEIGHT_STEP_KG / 2}
          className="flex size-11 shrink-0 items-center justify-center rounded-cyber border border-line bg-bg/50 text-xl font-semibold text-heading transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
      <p className="text-center text-[10px] text-dim">±50 g per tap</p>
    </div>
  );
}
