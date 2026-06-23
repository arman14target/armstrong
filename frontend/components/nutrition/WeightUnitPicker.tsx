"use client";

import { cn } from "@/lib/cn";
import type { WeightUnit } from "@/lib/types";

interface WeightUnitPickerProps {
  value: WeightUnit;
  onChange: (unit: WeightUnit) => void;
  className?: string;
}

export function WeightUnitPicker({
  value,
  onChange,
  className,
}: WeightUnitPickerProps) {
  return (
    <fieldset className={cn("planner-segment", className)}>
      <legend>Weight unit</legend>
      <p className="mb-2 text-xs leading-relaxed text-dim">
        Choose kg or lb once — change later in Profile if needed.
      </p>
      <div className="planner-segment__options">
        {(["kg", "lb"] as const).map((unit) => (
          <button
            key={unit}
            type="button"
            className={value === unit ? "is-active" : undefined}
            onClick={() => onChange(unit)}
          >
            {unit}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
