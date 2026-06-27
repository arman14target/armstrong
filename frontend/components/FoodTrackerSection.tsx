"use client";

import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { AddFoodModal } from "@/components/AddFoodModal";
import { CheckIcon, PencilIcon, TrashIcon } from "@/components/icons/ActionIcons";
import { GoalWeightSlider } from "@/components/nutrition/GoalWeightSlider";
import { NutritionBodyWeightPanel } from "@/components/nutrition/NutritionBodyWeightPanel";
import {
  NutritionBodyStatsSliders,
  type NutritionBodyStatsValues,
} from "@/components/nutrition/NutritionBodyStatsSliders";
import { WeightUnitPicker } from "@/components/nutrition/WeightUnitPicker";
import { MacroBars } from "@/components/planner/MacroBars";
import { PlannedFoodModal } from "@/components/PlannedFoodModal";
import { NutritionCaloriesHintSheet } from "@/components/NutritionCaloriesHintSheet";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import {
  isFoodLogCaloriesHintSeen,
  markFoodLogCaloriesHintSeen,
} from "@/lib/foodLogHintStorage";
import {
  FoodEntry,
  NutritionInputs,
  NutritionProfile,
  NutritionSex,
  calculateNutritionTargets,
  createNutritionProfile,
  formatFoodEntryMacros,
  formatGoalLabel,
  formatMealSlotLabel,
  inferNutritionGoal,
  resolveTargetWeightKg,
  sumDailyNutrition,
  type MealSlot,
  type PlannedMealInput,
} from "@/lib/nutrition";
import type { WeightUnit } from "@/lib/types";
import { toLocalDateKey } from "@/lib/workoutCalendar";

const DEFAULT_BODY_STATS: NutritionBodyStatsValues = {
  weightKg: 80,
  heightCm: 178,
  age: 28,
  sex: "male",
};

type SetupStep = "body" | "goal" | "review";

interface FoodTrackerSectionProps {
  profile: NutritionProfile | undefined;
  foodLog: Record<string, FoodEntry[]>;
  onSave: (profile: NutritionProfile) => void;
  onAddFood: (
    dateKey: string,
    entry: Pick<FoodEntry, "name" | "calories" | "proteinG" | "carbsG" | "fatG">,
  ) => void;
  onRemoveFood: (dateKey: string, entryId: string) => void;
  onAddPlannedFood: (dateKey: string, entry: PlannedMealInput) => void;
  onUpdatePlannedFood: (
    dateKey: string,
    entryId: string,
    entry: PlannedMealInput,
  ) => void;
  onTogglePlannedMeal: (
    dateKey: string,
    entryId: string,
    completed: boolean,
  ) => void;
}

function parseNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function MacroStat({
  label,
  value,
  unit,
  accent,
  consumed,
  target,
}: {
  label: string;
  value: number;
  unit: string;
  accent: "cyan" | "green" | "magenta" | "amber";
  consumed?: number;
  target?: number;
}) {
  const accentClass = {
    cyan: "text-cyan",
    green: "text-green",
    magenta: "text-magenta",
    amber: "text-amber",
  }[accent];

  const progressBarClass = {
    cyan: "from-cyan/25 via-cyan/45 to-cyan/70",
    green: "from-green/25 via-green/45 to-green/70",
    magenta: "from-magenta/25 via-magenta/45 to-magenta/70",
    amber: "from-amber/25 via-amber/45 to-amber/70",
  }[accent];

  const progress =
    consumed !== undefined && target && target > 0
      ? Math.min(consumed / target, 1)
      : null;

  return (
    <div className="rounded-cyber border border-line bg-bg/50 p-[var(--space-panel)] text-center">
      <p className="text-[10px] tracking-wide text-dim uppercase">{label}</p>
      {consumed !== undefined && target !== undefined ? (
        <>
          <p className={cn("mt-1 font-display text-xl tracking-wide", accentClass)}>
            {consumed}
            <span className="text-sm text-dim"> / {target}</span>
            <span className="ml-0.5 text-xs text-dim">{unit}</span>
          </p>
          {progress !== null ? (
            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-bg/80">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 bg-gradient-to-r transition-[width] duration-300",
                  progressBarClass,
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          ) : null}
        </>
      ) : (
        <p className={cn("mt-1 font-display text-xl tracking-wide", accentClass)}>
          {value}
          <span className="ml-0.5 text-xs text-dim">{unit}</span>
        </p>
      )}
    </div>
  );
}

function SexChoice({
  selected,
  onSelect,
}: {
  selected: NutritionSex | null;
  onSelect: (sex: NutritionSex) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2">
      {(["male", "female"] as const).map((sex) => (
        <button
          key={sex}
          type="button"
          onClick={() => onSelect(sex)}
          className={cn(
            "rounded-cyber border py-2 text-xs tracking-wide uppercase transition-colors",
            selected === sex
              ? "border-cyan/50 bg-cyan/10 text-heading"
              : "border-line bg-bg/40 text-dim hover:border-cyan/30",
          )}
        >
          {t(`nutrition.${sex}`)}
        </button>
      ))}
    </div>
  );
}

function NutritionSetup({
  initialProfile,
  onSave,
  onCancel,
  requiredFirst,
}: {
  initialProfile?: NutritionProfile;
  onSave: (profile: NutritionProfile) => void;
  onCancel?: () => void;
  requiredFirst?: boolean;
}) {
  const { t } = useTranslation();
  const { data, setWeightUnit } = useGymStore();
  const savedWeightUnit = data.weightUnit;
  const useSliderSetup = !initialProfile;
  const [step, setStep] = useState<SetupStep>("body");
  const [setupWeightUnit, setSetupWeightUnit] = useState<WeightUnit>(
    savedWeightUnit ?? "kg",
  );
  const activeWeightUnit = savedWeightUnit ?? setupWeightUnit;
  const [bodyStats, setBodyStats] = useState<NutritionBodyStatsValues>(
    initialProfile
      ? {
          weightKg: initialProfile.weightKg,
          heightCm: initialProfile.heightCm,
          age: initialProfile.age,
          sex: initialProfile.sex,
        }
      : DEFAULT_BODY_STATS,
  );
  const [weight, setWeight] = useState(
    initialProfile ? String(initialProfile.weightKg) : "",
  );
  const [height, setHeight] = useState(
    initialProfile ? String(initialProfile.heightCm) : "",
  );
  const [age, setAge] = useState(
    initialProfile ? String(initialProfile.age) : "25",
  );
  const [sex, setSex] = useState<NutritionSex | null>(
    initialProfile?.sex ?? null,
  );
  const [targetWeightKg, setTargetWeightKg] = useState<number | null>(
    initialProfile
      ? resolveTargetWeightKg(initialProfile)
      : DEFAULT_BODY_STATS.weightKg - 5,
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const weightKg = useSliderSetup ? bodyStats.weightKg : parseNumber(weight);
  const heightCm = useSliderSetup ? bodyStats.heightCm : parseNumber(height);
  const ageYears = useSliderSetup ? bodyStats.age : parseNumber(age);
  const selectedSex = useSliderSetup ? bodyStats.sex : sex;

  const draftInputs: NutritionInputs | null =
    weightKg && heightCm && ageYears && selectedSex && targetWeightKg
      ? {
          weightKg,
          heightCm,
          age: ageYears,
          sex: selectedSex,
          targetWeightKg,
        }
      : null;

  const previewGoal = draftInputs
    ? inferNutritionGoal(draftInputs.weightKg, draftInputs.targetWeightKg)
    : null;

  const previewTargets = draftInputs
    ? calculateNutritionTargets({
        ...draftInputs,
        goal: inferNutritionGoal(draftInputs.weightKg, draftInputs.targetWeightKg),
      })
    : null;

  const validateBody = () => {
    if (useSliderSetup) {
      return true;
    }

    const nextErrors: Record<string, boolean> = {};
    if (!weightKg || weightKg < 30 || weightKg > 300) {
      nextErrors.weight = true;
    }
    if (!heightCm || heightCm < 100 || heightCm > 250) {
      nextErrors.height = true;
    }
    if (!ageYears || ageYears < 14 || ageYears > 100) {
      nextErrors.age = true;
    }
    if (!sex) {
      nextErrors.sex = true;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBodyNext = () => {
    if (validateBody()) {
      if (!savedWeightUnit) {
        setWeightUnit(setupWeightUnit);
      }
      if (weightKg) {
        setTargetWeightKg((prev) => {
          if (!prev || Math.abs(prev - weightKg) > 35) {
            return Math.max(40, weightKg - 5);
          }
          return prev;
        });
      }
      setStep("goal");
    }
  };

  const handleGoalNext = () => {
    if (!targetWeightKg || targetWeightKg <= 0) {
      setErrors({ goal: true });
      return;
    }
    setErrors({});
    setStep("review");
  };

  const handleSave = () => {
    if (!draftInputs) {
      return;
    }
    onSave(createNutritionProfile(draftInputs));
  };

  if (step === "body") {
    return (
      <div className="stack-md">
        {requiredFirst ? (
          <p className="rounded-cyber border border-cyan/25 bg-cyan/5 px-3 py-2 text-xs leading-relaxed text-dim">
            {t("nutrition.setupRequiredHint")}
          </p>
        ) : null}

        <div>
          <h3 className="font-display text-sm tracking-wide text-heading">
            {t("nutrition.yourStats")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            {t("nutrition.statsFormulaHint")}
          </p>
        </div>

        {useSliderSetup ? (
          <>
            <NutritionBodyStatsSliders
              values={bodyStats}
              weightUnit={activeWeightUnit}
              onChange={setBodyStats}
              idPrefix="food-tracker"
            />
            {!savedWeightUnit ? (
              <WeightUnitPicker
                value={setupWeightUnit}
                onChange={setSetupWeightUnit}
              />
            ) : null}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-[var(--space-gap)]">
              <label className="block">
                <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                  {t("nutrition.weightKg")}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(event) => {
                    setWeight(event.target.value);
                    if (errors.weight) {
                      setErrors((prev) => ({ ...prev, weight: false }));
                    }
                  }}
                  placeholder="75"
                  className={cn("cyber-input", errors.weight && "border-magenta/60")}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                  {t("nutrition.heightCm")}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={height}
                  onChange={(event) => {
                    setHeight(event.target.value);
                    if (errors.height) {
                      setErrors((prev) => ({ ...prev, height: false }));
                    }
                  }}
                  placeholder="175"
                  className={cn("cyber-input", errors.height && "border-magenta/60")}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                {t("nutrition.age")}
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={age}
                onChange={(event) => {
                  setAge(event.target.value);
                  if (errors.age) {
                    setErrors((prev) => ({ ...prev, age: false }));
                  }
                }}
                placeholder="25"
                className={cn("cyber-input", errors.age && "border-magenta/60")}
              />
            </label>

            <div>
              <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                {t("nutrition.sex")}
              </span>
              <SexChoice
                selected={sex}
                onSelect={(value) => {
                  setSex(value);
                  if (errors.sex) {
                    setErrors((prev) => ({ ...prev, sex: false }));
                  }
                }}
              />
              {errors.sex ? (
                <p className="mt-1 text-xs text-magenta" role="alert">
                  {t("nutrition.sexError")}
                </p>
              ) : null}
            </div>
          </>
        )}

        <CyberButton variant="green" className="w-full" onClick={handleBodyNext}>
          {t("nutrition.nextGoalWeight")}
        </CyberButton>
        {onCancel ? (
          <CyberButton variant="cyan" className="w-full" onClick={onCancel}>
            {t("common.cancel")}
          </CyberButton>
        ) : null}
      </div>
    );
  }

  if (step === "goal") {
    const currentWeightKg = weightKg ?? bodyStats.weightKg;
    const resolvedTarget = targetWeightKg ?? currentWeightKg - 5;

    return (
      <div className="stack-md">
        <div>
          <h3 className="font-display text-sm tracking-wide text-heading">
            {t("nutrition.goalWeight")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            {t("nutrition.goalWeightHint")}
          </p>
        </div>

        <GoalWeightSlider
          currentWeightKg={currentWeightKg}
          targetWeightKg={resolvedTarget}
          unit={activeWeightUnit}
          idPrefix="food-tracker-goal"
          onChange={(value) => {
            setTargetWeightKg(value);
            if (errors.goal) {
              setErrors((prev) => ({ ...prev, goal: false }));
            }
          }}
        />

        {previewTargets ? (
          <div className="rounded-cyber border border-line bg-bg/30 p-[var(--space-panel)]">
            <p className="mb-3 text-[10px] tracking-wide text-dim uppercase">
              {t("nutrition.liveMacroPreview", {
                goal: previewGoal ? formatGoalLabel(previewGoal) : "",
              })}
            </p>
            <p className="font-display text-2xl tracking-wide text-heading">
              {previewTargets.dailyCalories}
              <span className="ml-1 text-sm text-dim">{t("nutrition.macros.kcalPerDay")}</span>
            </p>
            <MacroBars
              className="mt-3"
              items={[
                {
                  label: t("nutrition.macros.protein"),
                  value: previewTargets.proteinG,
                  max: Math.max(
                    previewTargets.proteinG,
                    previewTargets.carbsG,
                    previewTargets.fatG,
                  ),
                  unit: "g",
                  accent: "cyan",
                },
                {
                  label: t("nutrition.macros.carbs"),
                  value: previewTargets.carbsG,
                  max: Math.max(
                    previewTargets.proteinG,
                    previewTargets.carbsG,
                    previewTargets.fatG,
                  ),
                  unit: "g",
                  accent: "green",
                },
                {
                  label: t("nutrition.macros.fat"),
                  value: previewTargets.fatG,
                  max: Math.max(
                    previewTargets.proteinG,
                    previewTargets.carbsG,
                    previewTargets.fatG,
                  ),
                  unit: "g",
                  accent: "magenta",
                },
              ]}
            />
          </div>
        ) : null}

        {errors.goal ? (
          <p className="text-xs text-magenta" role="alert">
            {t("nutrition.setGoalWeightError")}
          </p>
        ) : null}

        <div className="stack-sm">
          <CyberButton variant="green" className="w-full" onClick={handleGoalNext}>
            {t("nutrition.seeTargets")}
          </CyberButton>
          <CyberButton variant="cyan" className="w-full" onClick={() => setStep("body")}>
            {t("common.back")}
          </CyberButton>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-md">
      <div>
        <h3 className="font-display text-sm tracking-wide text-heading">
          {t("nutrition.yourDailyTargets")}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-dim">
          {t("nutrition.targetsSummary", {
            current: weightKg,
            target: targetWeightKg,
            goal: previewGoal ? formatGoalLabel(previewGoal) : t("nutrition.goal.plan"),
          })}
        </p>
      </div>

      {previewTargets ? (
        useSliderSetup ? (
          <div className="rounded-cyber border border-line bg-bg/30 p-[var(--space-panel)]">
            <MacroBars
              items={[
                {
                  label: t("nutrition.macros.calories"),
                  value: previewTargets.dailyCalories,
                  max: previewTargets.dailyCalories,
                  unit: "kcal",
                  accent: "cyan",
                },
                {
                  label: t("nutrition.macros.protein"),
                  value: previewTargets.proteinG,
                  max: Math.max(
                    previewTargets.proteinG,
                    previewTargets.carbsG,
                    previewTargets.fatG,
                  ),
                  unit: "g",
                  accent: "cyan",
                },
                {
                  label: t("nutrition.macros.carbs"),
                  value: previewTargets.carbsG,
                  max: Math.max(
                    previewTargets.proteinG,
                    previewTargets.carbsG,
                    previewTargets.fatG,
                  ),
                  unit: "g",
                  accent: "green",
                },
                {
                  label: t("nutrition.macros.fat"),
                  value: previewTargets.fatG,
                  max: Math.max(
                    previewTargets.proteinG,
                    previewTargets.carbsG,
                    previewTargets.fatG,
                  ),
                  unit: "g",
                  accent: "magenta",
                },
              ]}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-[var(--space-gap)] sm:grid-cols-4">
            <MacroStat
              label={t("nutrition.macros.calories")}
              value={previewTargets.dailyCalories}
              unit="kcal"
              accent="amber"
            />
            <MacroStat
              label={t("nutrition.macros.protein")}
              value={previewTargets.proteinG}
              unit="g"
              accent="cyan"
            />
            <MacroStat
              label={t("nutrition.macros.carbs")}
              value={previewTargets.carbsG}
              unit="g"
              accent="green"
            />
            <MacroStat
              label={t("nutrition.macros.fat")}
              value={previewTargets.fatG}
              unit="g"
              accent="magenta"
            />
          </div>
        )
      ) : null}

      <p className="text-xs leading-relaxed text-dim">
        {previewGoal === "cut"
          ? t("nutrition.proteinHintCut")
          : t("nutrition.proteinHintBulk")}
      </p>

      <div className="stack-sm">
        <CyberButton variant="green" className="w-full" onClick={handleSave}>
          {t("nutrition.saveTargets")}
        </CyberButton>
        <CyberButton variant="cyan" className="w-full" onClick={() => setStep("goal")}>
          {t("common.back")}
        </CyberButton>
      </div>
    </div>
  );
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  return toLocalDateKey(date);
}

const MEAL_SLOT_ORDER: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function sortFoodEntries(entries: FoodEntry[]): FoodEntry[] {
  return [...entries].sort((left, right) => {
    if (left.fromPlan !== right.fromPlan) {
      return left.fromPlan ? -1 : 1;
    }

    if (left.fromPlan && right.fromPlan) {
      const leftIndex = left.mealSlot
        ? MEAL_SLOT_ORDER.indexOf(left.mealSlot)
        : MEAL_SLOT_ORDER.length;
      const rightIndex = right.mealSlot
        ? MEAL_SLOT_ORDER.indexOf(right.mealSlot)
        : MEAL_SLOT_ORDER.length;
      return leftIndex - rightIndex;
    }

    return 0;
  });
}

function PlannedFoodList({
  entries,
  advancedNutrition,
  onEdit,
  onRemove,
  onTogglePlannedMeal,
}: {
  entries: FoodEntry[];
  advancedNutrition: boolean;
  onEdit: (entry: FoodEntry) => void;
  onRemove: (entryId: string) => void;
  onTogglePlannedMeal: (entryId: string, completed: boolean) => void;
}) {
  const { t } = useTranslation();
  const sortedEntries = sortFoodEntries(entries);

  if (sortedEntries.length === 0) {
    return (
      <p className="rounded-cyber border border-dashed border-line bg-bg/30 px-[var(--space-panel)] py-6 text-center text-xs leading-relaxed text-dim">
        {t("nutrition.noPlannedMeals")}
      </p>
    );
  }

  return (
    <ul className="stack-sm">
      {sortedEntries.map((entry) => {
        const slotLabel = entry.mealSlot
          ? formatMealSlotLabel(entry.mealSlot)
          : null;

        return (
          <li
            key={entry.id}
            className={cn(
              "flex items-start gap-2 rounded-cyber border p-[var(--space-panel)]",
              entry.completed
                ? "border-green/30 bg-green/5"
                : "border-cyan/25 bg-cyan/5",
            )}
          >
            <label className="mt-0.5 flex shrink-0 cursor-pointer items-start">
              <input
                type="checkbox"
                checked={entry.completed === true}
                onChange={(event) =>
                  onTogglePlannedMeal(entry.id, event.target.checked)
                }
                className="peer sr-only"
                aria-label={t("nutrition.markEaten", { name: entry.name })}
              />
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border border-dim/60 bg-surface transition-colors",
                  "peer-checked:border-dim peer-checked:bg-dim",
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan/50",
                  "peer-checked:[&>svg]:opacity-100",
                )}
              >
                <CheckIcon className="size-2.5 text-bg opacity-0 transition-opacity" />
              </span>
            </label>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {slotLabel ? (
                  <span className="text-[10px] tracking-wide text-cyan uppercase">
                    {slotLabel}
                  </span>
                ) : null}
                <p className="truncate text-sm font-medium text-heading">
                  {entry.name}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-dim">
                {formatFoodEntryMacros(entry, advancedNutrition)}
                {!entry.completed ? (
                  <span className="text-dim/70"> · {t("nutrition.checkWhenEaten")}</span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton
                label={t("nutrition.editEntry", { name: entry.name })}
                variant="ghost"
                className="size-8 text-dim hover:text-cyan"
                onClick={() => onEdit(entry)}
              >
                <PencilIcon />
              </IconButton>
              <IconButton
                label={t("nutrition.removeEntry", { name: entry.name })}
                variant="ghost"
                className="size-8 text-dim hover:text-magenta"
                onClick={() => onRemove(entry.id)}
              >
                <TrashIcon />
              </IconButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ManualFoodLogList({
  entries,
  advancedNutrition,
  onRemove,
}: {
  entries: FoodEntry[];
  advancedNutrition: boolean;
  onRemove: (entryId: string) => void;
}) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <p className="rounded-cyber border border-dashed border-line bg-bg/30 px-[var(--space-panel)] py-6 text-center text-xs leading-relaxed text-dim">
        {t("nutrition.noMealsLogged")}
      </p>
    );
  }

  return (
    <ul className="stack-sm">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start gap-2 rounded-cyber border border-line bg-bg/40 p-[var(--space-panel)]"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-heading">{entry.name}</p>
            <p className="mt-0.5 text-xs text-dim">
              {formatFoodEntryMacros(entry, advancedNutrition)}
            </p>
          </div>
          <IconButton
            label={`Remove ${entry.name}`}
            variant="ghost"
            className="size-8 shrink-0 text-dim hover:text-magenta"
            onClick={() => onRemove(entry.id)}
          >
            <TrashIcon />
          </IconButton>
        </li>
      ))}
    </ul>
  );
}

function NutritionDashboard({
  profile,
  dateKey,
  entries,
  onRecalibrate,
  onDateChange,
  onAddFood,
  onRemoveFood,
  onAddPlannedFood,
  onEditPlannedFood,
  onTogglePlannedMeal,
}: {
  profile: NutritionProfile;
  dateKey: string;
  entries: FoodEntry[];
  onRecalibrate: () => void;
  onDateChange: (dateKey: string) => void;
  onAddFood: () => void;
  onRemoveFood: (entryId: string) => void;
  onAddPlannedFood: () => void;
  onEditPlannedFood: (entry: FoodEntry) => void;
  onTogglePlannedMeal: (entryId: string, completed: boolean) => void;
}) {
  const { t } = useTranslation();
  const { data } = useGymStore();
  const advancedNutrition = data.advancedNutrition === true;
  const totals = useMemo(() => sumDailyNutrition(entries), [entries]);
  const todayKey = toLocalDateKey(new Date());
  const isToday = dateKey === todayKey;
  const plannedEntries = useMemo(
    () => entries.filter((entry) => entry.fromPlan),
    [entries],
  );
  const manualEntries = useMemo(
    () => entries.filter((entry) => !entry.fromPlan),
    [entries],
  );

  return (
    <div className="stack-md">
      <NutritionBodyWeightPanel profile={profile} />

      <div className="flex items-center justify-between gap-2 rounded-cyber border border-line bg-bg/30 px-3 py-2">
        <button
          type="button"
          onClick={() => onDateChange(shiftDateKey(dateKey, -1))}
          className="rounded-cyber px-2 py-1 text-sm text-dim transition-colors hover:border-cyan/30 hover:text-heading"
          aria-label={t("history.prevDay")}
        >
          ‹
        </button>
        <div className="text-center text-sm font-medium text-heading">
          {isToday ? (
            <>
              <span className="text-xs tracking-wide text-dim uppercase">{t("nutrition.today")}</span>
              <span className="mx-1.5 text-line">·</span>
              <span>{formatDateLabel(dateKey)}</span>
            </>
          ) : (
            formatDateLabel(dateKey)
          )}
        </div>
        <button
          type="button"
          onClick={() => onDateChange(shiftDateKey(dateKey, 1))}
          disabled={isToday}
          className={cn(
            "rounded-cyber px-2 py-1 text-sm transition-colors",
            isToday
              ? "cursor-not-allowed text-dim/40"
              : "text-dim hover:border-cyan/30 hover:text-heading",
          )}
          aria-label={t("history.nextDay")}
        >
          ›
        </button>
      </div>

      <div>
        <div className="mb-[var(--space-gap)] flex items-center justify-between gap-2">
          <p className="text-[10px] tracking-wide text-dim uppercase">
            {t("nutrition.todaysIntake")}
          </p>
          <button
            type="button"
            onClick={onRecalibrate}
            className="text-[10px] tracking-wide text-cyan uppercase transition-colors hover:text-heading"
          >
            {t("nutrition.editTargets")}
          </button>
        </div>
        <div
          className={cn(
            "grid gap-[var(--space-gap)]",
            advancedNutrition ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2",
          )}
        >
          {advancedNutrition ? (
            <MacroStat
              label={t("nutrition.macros.calories")}
              value={profile.dailyCalories}
              unit="kcal"
              accent="amber"
              consumed={totals.calories}
              target={profile.dailyCalories}
            />
          ) : null}
          <MacroStat
            label={t("nutrition.macros.protein")}
            value={profile.proteinG}
            unit="g"
            accent="cyan"
            consumed={totals.proteinG}
            target={profile.proteinG}
          />
          <MacroStat
            label={t("nutrition.macros.carbs")}
            value={profile.carbsG}
            unit="g"
            accent="green"
            consumed={totals.carbsG}
            target={profile.carbsG}
          />
          {advancedNutrition ? (
            <MacroStat
              label={t("nutrition.macros.fat")}
              value={profile.fatG}
              unit="g"
              accent="magenta"
              consumed={totals.fatG}
              target={profile.fatG}
            />
          ) : null}
        </div>
      </div>

      <div className="stack-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm tracking-wide text-heading">
            {t("nutrition.plannedMeals")}
          </h3>
          <CyberButton
            variant="cyan"
            className="px-3 py-1.5 text-xs"
            onClick={onAddPlannedFood}
          >
            {t("nutrition.addPlannedMeal")}
          </CyberButton>
        </div>
        <PlannedFoodList
          entries={plannedEntries}
          advancedNutrition={advancedNutrition}
          onEdit={onEditPlannedFood}
          onRemove={onRemoveFood}
          onTogglePlannedMeal={onTogglePlannedMeal}
        />
      </div>

      <div className="stack-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm tracking-wide text-heading">
            {t("nutrition.mealLog")}
          </h3>
          <CyberButton
            variant="green"
            className="px-3 py-1.5 text-xs"
            onClick={onAddFood}
          >
            {t("nutrition.addMeal")}
          </CyberButton>
        </div>
        <ManualFoodLogList
          entries={manualEntries}
          advancedNutrition={advancedNutrition}
          onRemove={onRemoveFood}
        />
      </div>
    </div>
  );
}

export function FoodTrackerSection({
  profile,
  foodLog,
  onSave,
  onAddFood,
  onRemoveFood,
  onAddPlannedFood,
  onUpdatePlannedFood,
  onTogglePlannedMeal,
}: FoodTrackerSectionProps) {
  const { data } = useGymStore();
  const advancedNutrition = data.advancedNutrition === true;
  const [recalibrating, setRecalibrating] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showPlannedFoodModal, setShowPlannedFoodModal] = useState(false);
  const [showCaloriesHint, setShowCaloriesHint] = useState(false);
  const [pendingFoodAction, setPendingFoodAction] = useState<
    "meal" | "planned" | null
  >(null);
  const [editingPlannedEntry, setEditingPlannedEntry] = useState<
    FoodEntry | undefined
  >();
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toLocalDateKey(new Date()),
  );

  const dayEntries = foodLog[selectedDateKey] ?? [];

  const handleSave = (nextProfile: NutritionProfile) => {
    onSave(nextProfile);
    setRecalibrating(false);
  };

  const handleAddFood = (
    entry: Pick<FoodEntry, "name" | "calories" | "proteinG" | "carbsG" | "fatG">,
  ) => {
    onAddFood(selectedDateKey, entry);
  };

  const handleSavePlannedFood = (entry: PlannedMealInput) => {
    if (editingPlannedEntry) {
      onUpdatePlannedFood(selectedDateKey, editingPlannedEntry.id, entry);
    } else {
      onAddPlannedFood(selectedDateKey, entry);
    }
  };

  const handleClosePlannedFoodModal = () => {
    setShowPlannedFoodModal(false);
    setEditingPlannedEntry(undefined);
  };

  const handleEditPlannedFood = (entry: FoodEntry) => {
    setEditingPlannedEntry(entry);
    setShowPlannedFoodModal(true);
  };

  const openAddFoodModal = () => {
    setShowAddFoodModal(true);
  };

  const openAddPlannedFoodModal = () => {
    setEditingPlannedEntry(undefined);
    setShowPlannedFoodModal(true);
  };

  const requestAddFood = () => {
    if (!isFoodLogCaloriesHintSeen()) {
      setPendingFoodAction("meal");
      setShowCaloriesHint(true);
      return;
    }

    openAddFoodModal();
  };

  const requestAddPlannedFood = () => {
    if (!isFoodLogCaloriesHintSeen()) {
      setPendingFoodAction("planned");
      setShowCaloriesHint(true);
      return;
    }

    openAddPlannedFoodModal();
  };

  const handleCaloriesHintDismiss = () => {
    markFoodLogCaloriesHintSeen();
    setShowCaloriesHint(false);

    if (pendingFoodAction === "meal") {
      openAddFoodModal();
    } else if (pendingFoodAction === "planned") {
      openAddPlannedFoodModal();
    }

    setPendingFoodAction(null);
  };

  if (!profile || recalibrating) {
    return (
      <NutritionSetup
        initialProfile={recalibrating ? profile : undefined}
        requiredFirst={!profile}
        onSave={handleSave}
        onCancel={
          profile && recalibrating ? () => setRecalibrating(false) : undefined
        }
      />
    );
  }

  return (
    <>
      <NutritionDashboard
          profile={profile}
          dateKey={selectedDateKey}
          entries={dayEntries}
          onRecalibrate={() => setRecalibrating(true)}
          onDateChange={setSelectedDateKey}
          onAddFood={requestAddFood}
          onRemoveFood={(entryId) => onRemoveFood(selectedDateKey, entryId)}
          onAddPlannedFood={requestAddPlannedFood}
          onEditPlannedFood={handleEditPlannedFood}
          onTogglePlannedMeal={(entryId, completed) =>
            onTogglePlannedMeal(selectedDateKey, entryId, completed)
          }
      />

      <AddFoodModal
        open={showAddFoodModal}
        advancedNutrition={advancedNutrition}
        onAdd={handleAddFood}
        onClose={() => setShowAddFoodModal(false)}
      />

      <PlannedFoodModal
        open={showPlannedFoodModal}
        initialEntry={editingPlannedEntry}
        advancedNutrition={advancedNutrition}
        onSave={handleSavePlannedFood}
        onClose={handleClosePlannedFoodModal}
      />

      <NutritionCaloriesHintSheet
        open={showCaloriesHint}
        onDismiss={handleCaloriesHintDismiss}
      />
    </>
  );
}
