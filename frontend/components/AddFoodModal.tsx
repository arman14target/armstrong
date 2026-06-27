"use client";

import { useTranslation } from "react-i18next";
import {
  AiFoodEntryForm,
  type AiFoodEntryValues,
} from "@/components/AiFoodEntryForm";
import { MealFormModalShell } from "@/components/MealFormModalShell";
import type { FoodEntry } from "@/lib/nutrition";

export type FoodEntryInput = Pick<
  FoodEntry,
  "name" | "calories" | "proteinG" | "carbsG" | "fatG"
>;

interface AddFoodModalProps {
  open: boolean;
  advancedNutrition?: boolean;
  onAdd: (entry: FoodEntryInput) => void;
  onClose: () => void;
}

export function AddFoodModal({
  open,
  advancedNutrition = false,
  onAdd,
  onClose,
}: AddFoodModalProps) {
  const { t } = useTranslation();

  const handleSubmit = (values: AiFoodEntryValues) => {
    onAdd(values);
    onClose();
  };

  return (
    <MealFormModalShell
      open={open}
      titleId="add-food-title"
      headerLabel={t("nutrition.logMeal")}
      closeLabel={t("nutrition.closeAddMeal")}
      onClose={onClose}
    >
      <h2
        id="add-food-title"
        className="font-display text-lg tracking-wide text-heading"
      >
        {t("nutrition.whatDidYouEat")}
      </h2>
      <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
        {t("nutrition.addFoodHint")}
      </p>

      <div className="mt-[var(--space-gap-md)]">
        <AiFoodEntryForm
          advancedNutrition={advancedNutrition}
          submitLabel={t("nutrition.addToLog")}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </MealFormModalShell>
  );
}
