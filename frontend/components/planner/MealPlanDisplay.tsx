"use client";

import { useTranslation } from "react-i18next";
import type { PlannedMeal } from "@/lib/planner/dietPlan";
import type { NutritionTargets } from "@/lib/nutrition";
import { MacroBars } from "@/components/planner/MacroBars";
import { ImportPlanButton } from "@/components/planner/ImportPlanButton";
import { formatMealSlotLabel } from "@/lib/nutrition";

interface MealPlanDisplayProps {
  targets: NutritionTargets;
  meals: PlannedMeal[];
  goalLabel: string;
  hydrationLiters: number;
  mealPrepNote: string;
  onImportToApp?: () => void;
}

export function MealPlanDisplay({
  targets,
  meals,
  goalLabel,
  hydrationLiters,
  mealPrepNote,
  onImportToApp,
}: MealPlanDisplayProps) {
  const { t } = useTranslation();
  const maxMacro = Math.max(targets.proteinG, targets.carbsG, targets.fatG);

  return (
    <div className="planner-result">
      <div className="planner-result__summary">
        <p className="planner-result__kicker">{t("planner.diet.display.targets", { goal: goalLabel })}</p>
        <p className="planner-result__calories">
          {targets.dailyCalories}
          <span className="planner-result__calories-unit">{t("planner.diet.display.kcalPerDay")}</span>
        </p>
        <MacroBars
          items={[
            { label: t("planner.diet.display.protein"), value: targets.proteinG, max: maxMacro, unit: "g", accent: "cyan" },
            { label: t("planner.diet.display.carbs"), value: targets.carbsG, max: maxMacro, unit: "g", accent: "green" },
            { label: t("planner.diet.display.fat"), value: targets.fatG, max: maxMacro, unit: "g", accent: "magenta" },
          ]}
        />
        <p className="planner-result__meta">
          {t("planner.diet.display.hydration")}{" "}
          <strong>{t("planner.diet.display.liters", { count: hydrationLiters })}</strong>
          {" · "}
          {mealPrepNote}
        </p>
        {onImportToApp ? (
          <ImportPlanButton
            onImport={onImportToApp}
            label={t("planner.import.meal")}
            className="w-full"
          />
        ) : null}
      </div>

      <ol className="planner-meals">
        {meals.map((meal) => (
          <li key={meal.slot} className="planner-meal">
            <div className="planner-meal__head">
              <span className="planner-meal__slot">{formatMealSlotLabel(meal.slot)}</span>
              <span className="planner-meal__cals">{t("planner.diet.display.mealKcal", { count: meal.calories })}</span>
            </div>
            <h3 className="planner-meal__title">{meal.name}</h3>
            <ul className="planner-meal__foods">
              {meal.foods.map((food) => (
                <li key={food}>{food}</li>
              ))}
            </ul>
            <div className="planner-meal__macros" aria-label={t("planner.diet.display.mealMacros")}>
              <span>P {meal.proteinG}g</span>
              <span>C {meal.carbsG}g</span>
              <span>F {meal.fatG}g</span>
            </div>
            {meal.tip ? <p className="planner-meal__tip">{meal.tip}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
