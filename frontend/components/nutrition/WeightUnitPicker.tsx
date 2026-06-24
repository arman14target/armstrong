"use client";

import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <fieldset className={cn("planner-segment", className)}>
      <legend>{t("nutrition.weightUnitLegend")}</legend>
      <p className="mb-2 text-xs leading-relaxed text-dim">
        {t("nutrition.weightUnitHint")}
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
