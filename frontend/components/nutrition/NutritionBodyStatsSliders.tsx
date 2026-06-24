"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { NutritionSex } from "@/lib/nutrition";
import {
  formatHeight,
  formatWeight,
  kgToLb,
  lbToKg,
  type HeightUnit,
} from "@/lib/planner/units";
import type { WeightUnit } from "@/lib/types";

export interface NutritionBodyStatsValues {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: NutritionSex;
}

interface NutritionBodyStatsSlidersProps {
  values: NutritionBodyStatsValues;
  onChange: (values: NutritionBodyStatsValues) => void;
  weightUnit: WeightUnit;
  idPrefix?: string;
}

export function NutritionBodyStatsSliders({
  values,
  onChange,
  weightUnit,
  idPrefix = "nutrition",
}: NutritionBodyStatsSlidersProps) {
  const { t } = useTranslation();
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  const weightDisplay =
    weightUnit === "kg"
      ? Math.round(values.weightKg)
      : Math.round(kgToLb(values.weightKg));

  const updateWeight = (displayValue: number) => {
    const nextWeightKg =
      weightUnit === "kg" ? displayValue : lbToKg(displayValue);
    onChange({ ...values, weightKg: nextWeightKg });
  };

  return (
    <div className="stack-md">
      <div className="planner-field">
        <div className="planner-field__head">
          <label htmlFor={`${idPrefix}-weight`}>{t("nutrition.weight")}</label>
        </div>
        <p className="planner-field__value">
          {formatWeight(values.weightKg, weightUnit)}
        </p>
        <input
          id={`${idPrefix}-weight`}
          type="range"
          min={weightUnit === "kg" ? 45 : 100}
          max={weightUnit === "kg" ? 140 : 310}
          value={weightDisplay}
          onChange={(event) => updateWeight(Number(event.target.value))}
          className="planner-range"
        />
      </div>

      <div className="planner-field">
        <div className="planner-field__head">
          <label htmlFor={`${idPrefix}-height`}>{t("nutrition.height")}</label>
          <div className="planner-unit-toggle">
            {(["cm", "ft"] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                className={heightUnit === unit ? "is-active" : undefined}
                onClick={() => setHeightUnit(unit)}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
        <p className="planner-field__value">
          {formatHeight(values.heightCm, heightUnit)}
        </p>
        <input
          id={`${idPrefix}-height`}
          type="range"
          min={150}
          max={210}
          value={values.heightCm}
          onChange={(event) =>
            onChange({ ...values, heightCm: Number(event.target.value) })
          }
          className="planner-range"
        />
      </div>

      <div className="planner-field">
        <div className="planner-field__head">
          <label htmlFor={`${idPrefix}-age`}>{t("nutrition.age")}</label>
          <span className="planner-field__value-inline">{values.age}</span>
        </div>
        <input
          id={`${idPrefix}-age`}
          type="range"
          min={16}
          max={65}
          value={values.age}
          onChange={(event) =>
            onChange({ ...values, age: Number(event.target.value) })
          }
          className="planner-range"
        />
      </div>

      <fieldset className="planner-segment">
        <legend>{t("nutrition.sex")}</legend>
        <div className="planner-segment__options">
          {(["male", "female"] as const).map((sex) => (
            <button
              key={sex}
              type="button"
              className={values.sex === sex ? "is-active" : undefined}
              onClick={() => onChange({ ...values, sex })}
            >
              {t(`nutrition.${sex}`)}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
