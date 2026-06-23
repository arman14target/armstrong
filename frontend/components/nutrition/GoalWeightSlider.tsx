"use client";

import { cn } from "@/lib/cn";
import type { WeightUnit } from "@/lib/types";
import {
  formatWeight,
  kgToLb,
  lbToKg,
  snapWeightKg,
} from "@/lib/weight";

interface GoalWeightSliderProps {
  currentWeightKg: number;
  targetWeightKg: number;
  unit: WeightUnit;
  onChange: (targetWeightKg: number) => void;
  idPrefix?: string;
  className?: string;
}

export function GoalWeightSlider({
  currentWeightKg,
  targetWeightKg,
  unit,
  onChange,
  idPrefix = "goal-weight",
  className,
}: GoalWeightSliderProps) {
  const minKg = snapWeightKg(Math.max(40, currentWeightKg - 30));
  const maxKg = snapWeightKg(Math.min(200, currentWeightKg + 30));

  const weightDisplay =
    unit === "kg"
      ? Math.round(targetWeightKg * 10) / 10
      : Math.round(kgToLb(targetWeightKg) * 10) / 10;

  const sliderMin = unit === "kg" ? minKg : Math.round(kgToLb(minKg));
  const sliderMax = unit === "kg" ? maxKg : Math.round(kgToLb(maxKg));

  const updateTarget = (displayValue: number) => {
    const nextKg = unit === "kg" ? displayValue : lbToKg(displayValue);
    onChange(snapWeightKg(Math.min(maxKg, Math.max(minKg, nextKg))));
  };

  return (
    <div className={cn("stack-md", className)}>
      <div className="planner-field">
        <div className="planner-field__head">
          <label htmlFor={`${idPrefix}-target`}>Goal weight</label>
        </div>
        <p className="planner-field__value">{formatWeight(targetWeightKg, unit)}</p>
        <input
          id={`${idPrefix}-target`}
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={unit === "kg" ? 0.1 : 0.5}
          value={weightDisplay}
          onChange={(event) => updateTarget(Number(event.target.value))}
          className="planner-range"
        />
      </div>
    </div>
  );
}
