"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { AiIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { cn } from "@/lib/cn";
import {
  canEstimateFoodNutrition,
  estimateFoodNutrition,
  formatFoodNutritionError,
} from "@/lib/foodNutritionAi";

export interface AiFoodEntryValues {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface AiFoodEntryFormProps {
  advancedNutrition: boolean;
  initialValues?: AiFoodEntryValues;
  submitLabel: string;
  onSubmit: (values: AiFoodEntryValues) => void;
  onCancel: () => void;
}

function parseMacroOrZero(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function formatMacro(value: number): string {
  return String(Math.round(value));
}

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

export function AiFoodEntryForm({
  advancedNutrition,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: AiFoodEntryFormProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialValues) {
      setDescription(initialValues.name);
      setName(initialValues.name);
      setCalories(formatMacro(initialValues.calories));
      setProteinG(formatMacro(initialValues.proteinG));
      setCarbsG(formatMacro(initialValues.carbsG));
      setFatG(formatMacro(initialValues.fatG));
      setAnalyzed(true);
      setAnalyzeError(null);
      setErrors({});
      return;
    }

    setDescription("");
    setName("");
    setCalories("");
    setProteinG("");
    setCarbsG("");
    setFatG("");
    setAnalyzed(false);
    setAnalyzeError(null);
    setErrors({});
  }, [initialValues]);

  const applyEstimate = (values: AiFoodEntryValues) => {
    setName(values.name);
    setCalories(formatMacro(values.calories));
    setProteinG(formatMacro(values.proteinG));
    setCarbsG(formatMacro(values.carbsG));
    setFatG(formatMacro(values.fatG));
    setAnalyzed(true);
    setAnalyzeError(null);
    setErrors({});
  };

  const handleAnalyze = async () => {
    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 4) {
      setErrors({ description: true });
      return;
    }

    if (!canEstimateFoodNutrition()) {
      setAnalyzeError(t("nutrition.aiNotConfigured"));
      setAnalyzed(true);
      setName(trimmedDescription);
      return;
    }

    setAnalyzing(true);
    setAnalyzeError(null);
    setErrors({});

    try {
      const estimate = await estimateFoodNutrition(trimmedDescription);
      applyEstimate(estimate);
    } catch (error) {
      setAnalyzeError(formatFoodNutritionError(error));
      setAnalyzed(true);
      setName(trimmedDescription);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const proteinValue = Number.parseFloat(proteinG);
    const nextErrors: Record<string, boolean> = {};

    if (description.trim().length < 4) {
      nextErrors.description = true;
    }
    if (!analyzed) {
      nextErrors.analyzed = true;
    }
    if (trimmedName.length < 2) {
      nextErrors.name = true;
    }
    if (!Number.isFinite(proteinValue) || proteinValue <= 0) {
      nextErrors.proteinG = true;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      name: trimmedName,
      calories: parseMacroOrZero(calories),
      proteinG: Math.round(proteinValue),
      carbsG: parseMacroOrZero(carbsG),
      fatG: parseMacroOrZero(fatG),
    });
  };

  return (
    <>
      <label className="block">
        <FieldLabel required>{t("nutrition.describeMeal")}</FieldLabel>
        <textarea
          rows={3}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: false }));
            }
          }}
          placeholder={t("nutrition.describeMealPlaceholder")}
          className={cn(
            "cyber-input min-h-24 resize-y",
            errors.description && "border-magenta/60",
          )}
          aria-invalid={errors.description}
        />
        {errors.description ? (
          <p className="mt-1 text-xs text-magenta" role="alert">
            {t("nutrition.describeMealError")}
          </p>
        ) : (
          <p className="mt-1 text-xs leading-relaxed text-dim">
            {t("nutrition.describeMealHint")}
          </p>
        )}
      </label>

      <CyberButton
        variant="cyan"
        className="mt-[var(--space-gap)] w-full gap-2"
        disabled={analyzing || description.trim().length < 4}
        onClick={() => {
          void handleAnalyze();
        }}
      >
        <span>
          {analyzing ? t("nutrition.analyzingMeal") : t("nutrition.analyzeMeal")}
        </span>
        <AiIcon className="size-4 shrink-0 opacity-90" />
      </CyberButton>

      {analyzeError ? (
        <p className="mt-[var(--space-gap)] text-xs text-magenta" role="alert">
          {analyzeError}
        </p>
      ) : null}

      {errors.analyzed ? (
        <p className="mt-[var(--space-gap)] text-xs text-magenta" role="alert">
          {t("nutrition.analyzeRequired")}
        </p>
      ) : null}

      {analyzed ? (
        <div className="mt-[var(--space-gap-md)] stack-sm">
          <div>
            <p className="text-xs tracking-wide text-cyan uppercase">
              {t("nutrition.estimatedNutrition")}
            </p>
            <p className="mt-1 text-xs text-dim">{t("nutrition.adjustIfNeeded")}</p>
          </div>

          <label className="block">
            <FieldLabel required>{t("nutrition.foodName")}</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: false }));
                }
              }}
              className={cn(
                "cyber-input",
                errors.name && "border-magenta/60",
              )}
              aria-invalid={errors.name}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-magenta" role="alert">
                {t("nutrition.foodNameError")}
              </p>
            ) : null}
          </label>

          <label className={cn("block", !advancedNutrition && "sr-only")}>
            <FieldLabel>{t("nutrition.caloriesKcal")}</FieldLabel>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              placeholder="450"
              className="cyber-input"
              tabIndex={advancedNutrition ? 0 : -1}
            />
          </label>

          <div
            className={cn(
              "grid gap-[var(--space-gap)]",
              advancedNutrition ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            <label className="block">
              <FieldLabel required>{t("nutrition.proteinG")}</FieldLabel>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={proteinG}
                onChange={(event) => {
                  setProteinG(event.target.value);
                  if (errors.proteinG) {
                    setErrors((prev) => ({ ...prev, proteinG: false }));
                  }
                }}
                placeholder="30"
                className={cn(
                  "cyber-input",
                  errors.proteinG && "border-magenta/60",
                )}
                aria-invalid={errors.proteinG}
              />
              {errors.proteinG ? (
                <p className="mt-1 text-xs text-magenta" role="alert">
                  {t("nutrition.proteinRequired")}
                </p>
              ) : null}
            </label>
            <label className="block">
              <FieldLabel>{t("nutrition.carbsG")}</FieldLabel>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={carbsG}
                onChange={(event) => setCarbsG(event.target.value)}
                placeholder="0"
                className="cyber-input"
              />
            </label>
            {advancedNutrition ? (
              <label className="block">
                <FieldLabel>{t("nutrition.fatG")}</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={fatG}
                  onChange={(event) => setFatG(event.target.value)}
                  placeholder="0"
                  className="cyber-input"
                />
              </label>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-[var(--space-section)] stack-sm">
        <CyberButton variant="green" className="w-full" onClick={handleSubmit}>
          {submitLabel}
        </CyberButton>
        <CyberButton variant="cyan" className="w-full" onClick={onCancel}>
          {t("common.cancel")}
        </CyberButton>
      </div>
    </>
  );
}
