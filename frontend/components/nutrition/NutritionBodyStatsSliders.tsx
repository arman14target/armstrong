"use client";

import { useState } from "react";
import type { NutritionSex } from "@/lib/nutrition";
import {
  formatHeight,
  formatWeight,
  kgToLb,
  lbToKg,
  type HeightUnit,
  type WeightUnit,
} from "@/lib/planner/units";

export interface NutritionBodyStatsValues {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: NutritionSex;
}

interface NutritionBodyStatsSlidersProps {
  values: NutritionBodyStatsValues;
  onChange: (values: NutritionBodyStatsValues) => void;
  idPrefix?: string;
}

export function NutritionBodyStatsSliders({
  values,
  onChange,
  idPrefix = "nutrition",
}: NutritionBodyStatsSlidersProps) {
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");

  const weightDisplay =
    weightUnit === "kg"
      ? Math.round(values.weightKg)
      : Math.round(kgToLb(values.weightKg));

  const updateWeight = (displayValue: number) => {
    const weightKg = weightUnit === "kg" ? displayValue : lbToKg(displayValue);
    onChange({ ...values, weightKg });
  };

  return (
    <div className="stack-md">
      <div className="planner-field">
        <div className="planner-field__head">
          <label htmlFor={`${idPrefix}-weight`}>Weight</label>
          <div className="planner-unit-toggle">
            {(["kg", "lb"] as const).map((unit) => (
              <button
                key={unit}
                type="button"
                className={weightUnit === unit ? "is-active" : undefined}
                onClick={() => setWeightUnit(unit)}
              >
                {unit}
              </button>
            ))}
          </div>
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
          <label htmlFor={`${idPrefix}-height`}>Height</label>
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
          <label htmlFor={`${idPrefix}-age`}>Age</label>
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
        <legend>Sex</legend>
        <div className="planner-segment__options">
          {(["male", "female"] as const).map((sex) => (
            <button
              key={sex}
              type="button"
              className={values.sex === sex ? "is-active" : undefined}
              onClick={() => onChange({ ...values, sex })}
            >
              {sex === "male" ? "Male" : "Female"}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
