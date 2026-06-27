"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  AiFoodEntryForm,
  type AiFoodEntryValues,
} from "@/components/AiFoodEntryForm";
import { MealFormModalShell } from "@/components/MealFormModalShell";
import { cn } from "@/lib/cn";
import {
  type FoodEntry,
  type MealSlot,
  type PlannedMealInput,
  formatMealSlotLabel,
} from "@/lib/nutrition";

interface PlannedFoodModalProps {
  open: boolean;
  initialEntry?: FoodEntry;
  advancedNutrition?: boolean;
  onSave: (entry: PlannedMealInput) => void;
  onClose: () => void;
}

const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function FieldLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
      {children}
      {required ? <span className="text-magenta"> *</span> : null}
    </span>
  );
}

export function PlannedFoodModal({
  open,
  initialEntry,
  advancedNutrition = false,
  onSave,
  onClose,
}: PlannedFoodModalProps) {
  const { t } = useTranslation();
  const isEditing = initialEntry !== undefined;
  const [mealSlot, setMealSlot] = useState<MealSlot | null>(null);
  const [mealSlotError, setMealSlotError] = useState(false);

  useEffect(() => {
    if (!open) {
      setMealSlot(null);
      setMealSlotError(false);
      return;
    }

    setMealSlot(initialEntry?.mealSlot ?? null);
    setMealSlotError(false);
  }, [initialEntry, open]);

  const initialValues = initialEntry
    ? {
        name: initialEntry.name,
        calories: initialEntry.calories,
        proteinG: initialEntry.proteinG,
        carbsG: initialEntry.carbsG,
        fatG: initialEntry.fatG,
      }
    : undefined;

  const handleSubmit = (values: AiFoodEntryValues) => {
    if (!mealSlot) {
      setMealSlotError(true);
      return;
    }

    onSave({
      ...values,
      mealSlot,
    });
    onClose();
  };

  const mealSlotPicker = (
    <div>
      <FieldLabel required>{t("nutrition.meal")}</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        {MEAL_SLOTS.map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => {
              setMealSlot(slot);
              setMealSlotError(false);
            }}
            className={cn(
              "rounded-cyber border py-2 text-xs tracking-wide uppercase transition-colors",
              mealSlot === slot
                ? "border-cyan/50 bg-cyan/10 text-heading"
                : "border-line bg-bg/40 text-dim hover:border-cyan/30",
            )}
          >
            {formatMealSlotLabel(slot)}
          </button>
        ))}
      </div>
      {mealSlotError ? (
        <p className="mt-1 text-xs text-magenta" role="alert">
          {t("nutrition.pickMealSlot")}
        </p>
      ) : null}
    </div>
  );

  return (
    <MealFormModalShell
      open={open}
      titleId="planned-food-title"
      headerLabel={
        isEditing ? t("nutrition.editPlannedMeal") : t("nutrition.addPlannedMeal")
      }
      closeLabel={t("nutrition.closePlannedMeal")}
      onClose={onClose}
    >
      <h2
        id="planned-food-title"
        className="font-display text-lg tracking-wide text-heading"
      >
        {isEditing ? t("nutrition.updateMeal") : t("nutrition.planMeal")}
      </h2>
      <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
        {t("nutrition.plannedMealHint")}
      </p>

      <div className="mt-[var(--space-gap-md)]">
        {mealSlotPicker}

        <div className="mt-[var(--space-gap-md)]">
          <AiFoodEntryForm
            key={initialEntry?.id ?? "new"}
            advancedNutrition={advancedNutrition}
            initialValues={initialValues}
            submitLabel={
              isEditing ? t("nutrition.saveChanges") : t("nutrition.addToPlan")
            }
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </MealFormModalShell>
  );
}
