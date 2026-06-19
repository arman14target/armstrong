"use client";

import { useMemo, useState } from "react";
import { AddFoodModal } from "@/components/AddFoodModal";
import { PencilIcon, TrashIcon } from "@/components/icons/ActionIcons";
import {
  NutritionBodyStatsSliders,
  type NutritionBodyStatsValues,
} from "@/components/nutrition/NutritionBodyStatsSliders";
import { MacroBars } from "@/components/planner/MacroBars";
import { PlannedFoodModal } from "@/components/PlannedFoodModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { cn } from "@/lib/cn";
import {
  FoodEntry,
  NutritionGoal,
  NutritionInputs,
  NutritionProfile,
  NutritionSex,
  calculateNutritionTargets,
  createNutritionProfile,
  formatGoalLabel,
  formatMealSlotLabel,
  sumDailyNutrition,
  type MealSlot,
  type PlannedMealInput,
} from "@/lib/nutrition";
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

function GoalChoice({
  selected,
  onSelect,
}: {
  selected: NutritionGoal | null;
  onSelect: (goal: NutritionGoal) => void;
}) {
  const options: Array<{ id: NutritionGoal; title: string; description: string }> =
    [
      {
        id: "bulk",
        title: "Bulk",
        description: "Build muscle with a ~400 kcal daily surplus.",
      },
      {
        id: "cut",
        title: "Cut",
        description: "Lose fat with a ~500 kcal daily deficit.",
      },
    ];

  return (
    <div className="stack-md">
      {options.map((option) => {
        const isSelected = selected === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              "w-full rounded-cyber border p-[var(--space-panel)] text-left transition-colors",
              isSelected
                ? "border-cyan/50 bg-cyan/10"
                : "border-line bg-bg/40 hover:border-cyan/30",
            )}
          >
            <p className="font-display text-sm tracking-wide text-heading uppercase">
              {option.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-dim">
              {option.description}
            </p>
          </button>
        );
      })}
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
          {sex}
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
  const useSliderSetup = !initialProfile;
  const [step, setStep] = useState<SetupStep>("body");
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
  const [goal, setGoal] = useState<NutritionGoal | null>(
    initialProfile?.goal ?? null,
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const weightKg = useSliderSetup ? bodyStats.weightKg : parseNumber(weight);
  const heightCm = useSliderSetup ? bodyStats.heightCm : parseNumber(height);
  const ageYears = useSliderSetup ? bodyStats.age : parseNumber(age);
  const selectedSex = useSliderSetup ? bodyStats.sex : sex;

  const draftInputs: NutritionInputs | null =
    weightKg && heightCm && ageYears && selectedSex && goal
      ? {
          weightKg,
          heightCm,
          age: ageYears,
          sex: selectedSex,
          goal,
        }
      : null;

  const previewTargets = draftInputs
    ? calculateNutritionTargets(draftInputs)
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
      setStep("goal");
    }
  };

  const handleGoalNext = () => {
    if (!goal) {
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
            Set your daily nutrition targets first. Once saved, you can start
            logging meals and tracking intake against your goal.
          </p>
        ) : null}

        <div>
          <h3 className="font-display text-sm tracking-wide text-heading">
            Your stats
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            We use the Mifflin–St Jeor formula with your weight, height, age,
            and sex to estimate daily calories.
          </p>
        </div>

        {useSliderSetup ? (
          <NutritionBodyStatsSliders
            values={bodyStats}
            onChange={setBodyStats}
            idPrefix="food-tracker"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-[var(--space-gap)]">
              <label className="block">
                <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                  Weight (kg)
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
                  Height (cm)
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
                Age
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
                Sex
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
                  Select male or female for an accurate estimate.
                </p>
              ) : null}
            </div>
          </>
        )}

        <CyberButton variant="green" className="w-full" onClick={handleBodyNext}>
          Next: pick your goal
        </CyberButton>
        {onCancel ? (
          <CyberButton variant="cyan" className="w-full" onClick={onCancel}>
            Cancel
          </CyberButton>
        ) : null}
      </div>
    );
  }

  if (step === "goal") {
    return (
      <div className="stack-md">
        <div>
          <h3 className="font-display text-sm tracking-wide text-heading">
            Bulk or cut?
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            Choose whether you want to gain muscle or lose fat. We&apos;ll adjust
            your daily calories from there.
          </p>
        </div>

        {useSliderSetup ? (
          <fieldset className="planner-segment">
            <legend>Goal</legend>
            <div className="planner-segment__options">
              {(["bulk", "cut"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={goal === option ? "is-active" : undefined}
                  onClick={() => {
                    setGoal(option);
                    if (errors.goal) {
                      setErrors((prev) => ({ ...prev, goal: false }));
                    }
                  }}
                >
                  {option === "bulk" ? "Lean bulk" : "Cut"}
                </button>
              ))}
            </div>
          </fieldset>
        ) : (
          <GoalChoice
            selected={goal}
            onSelect={(value) => {
              setGoal(value);
              if (errors.goal) {
                setErrors((prev) => ({ ...prev, goal: false }));
              }
            }}
          />
        )}

        {useSliderSetup && previewTargets ? (
          <div className="rounded-cyber border border-line bg-bg/30 p-[var(--space-panel)]">
            <p className="mb-3 text-[10px] tracking-wide text-dim uppercase">
              Live macro preview
            </p>
            <p className="font-display text-2xl tracking-wide text-heading">
              {previewTargets.dailyCalories}
              <span className="ml-1 text-sm text-dim">kcal / day</span>
            </p>
            <MacroBars
              className="mt-3"
              items={[
                {
                  label: "Protein",
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
                  label: "Carbs",
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
                  label: "Fat",
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
            Pick bulk or cut to continue.
          </p>
        ) : null}

        <div className="stack-sm">
          <CyberButton variant="green" className="w-full" onClick={handleGoalNext}>
            See my targets
          </CyberButton>
          <CyberButton variant="cyan" className="w-full" onClick={() => setStep("body")}>
            Back
          </CyberButton>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-md">
      <div>
        <h3 className="font-display text-sm tracking-wide text-heading">
          Your daily targets
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-dim">
          Based on {weightKg} kg, {heightCm} cm, age {ageYears},{" "}
          {formatGoalLabel(goal!)} mode.
        </p>
      </div>

      {previewTargets ? (
        useSliderSetup ? (
          <div className="rounded-cyber border border-line bg-bg/30 p-[var(--space-panel)]">
            <MacroBars
              items={[
                {
                  label: "Calories",
                  value: previewTargets.dailyCalories,
                  max: previewTargets.dailyCalories,
                  unit: "kcal",
                  accent: "cyan",
                },
                {
                  label: "Protein",
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
                  label: "Carbs",
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
                  label: "Fat",
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
              label="Calories"
              value={previewTargets.dailyCalories}
              unit="kcal"
              accent="amber"
            />
            <MacroStat
              label="Protein"
              value={previewTargets.proteinG}
              unit="g"
              accent="cyan"
            />
            <MacroStat
              label="Carbs"
              value={previewTargets.carbsG}
              unit="g"
              accent="green"
            />
            <MacroStat
              label="Fat"
              value={previewTargets.fatG}
              unit="g"
              accent="magenta"
            />
          </div>
        )
      ) : null}

      <p className="text-xs leading-relaxed text-dim">
        Protein is set high for muscle ({goal === "cut" ? "2.2" : "2.0"} g/kg).
        Fat fills ~25% of calories; carbs cover the rest.
      </p>

      <div className="stack-sm">
        <CyberButton variant="green" className="w-full" onClick={handleSave}>
          Save targets
        </CyberButton>
        <CyberButton variant="cyan" className="w-full" onClick={() => setStep("goal")}>
          Back
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

function DailyTargetReminder({
  profile,
  onRecalibrate,
}: {
  profile: NutritionProfile;
  onRecalibrate: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-cyber border border-line/60 bg-bg/30 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] tracking-wide text-dim uppercase">
          Daily goal · {formatGoalLabel(profile.goal)}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-dim">
          <span className="text-amber">{profile.dailyCalories} kcal</span>
          <span className="mx-1 text-line">·</span>
          <span className="text-cyan">{profile.proteinG}g protein</span>
          <span className="mx-1 text-line">·</span>
          <span className="text-green">{profile.carbsG}g carbs</span>
          <span className="mx-1 text-line">·</span>
          <span className="text-magenta">{profile.fatG}g fat</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onRecalibrate}
        className="shrink-0 text-[10px] tracking-wide text-cyan uppercase transition-colors hover:text-heading"
      >
        Edit
      </button>
    </div>
  );
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
  onEdit,
  onRemove,
  onTogglePlannedMeal,
}: {
  entries: FoodEntry[];
  onEdit: (entry: FoodEntry) => void;
  onRemove: (entryId: string) => void;
  onTogglePlannedMeal: (entryId: string, completed: boolean) => void;
}) {
  const sortedEntries = sortFoodEntries(entries);

  if (sortedEntries.length === 0) {
    return (
      <p className="rounded-cyber border border-dashed border-line bg-bg/30 px-[var(--space-panel)] py-6 text-center text-xs leading-relaxed text-dim">
        No planned meals yet. Add your own below, or ask your coach for a meal
        plan.
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
            <label className="mt-0.5 flex shrink-0 items-start gap-2">
              <input
                type="checkbox"
                checked={entry.completed === true}
                onChange={(event) =>
                  onTogglePlannedMeal(entry.id, event.target.checked)
                }
                className="mt-0.5 size-4 shrink-0 accent-green"
                aria-label={`Mark ${entry.name} as eaten`}
              />
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
                {entry.calories} kcal · P {entry.proteinG}g · C {entry.carbsG}g ·
                F {entry.fatG}g
                {!entry.completed ? (
                  <span className="text-dim/70"> · check when eaten</span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <IconButton
                label={`Edit ${entry.name}`}
                variant="ghost"
                className="size-8 text-dim hover:text-cyan"
                onClick={() => onEdit(entry)}
              >
                <PencilIcon />
              </IconButton>
              <IconButton
                label={`Remove ${entry.name}`}
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
  onRemove,
}: {
  entries: FoodEntry[];
  onRemove: (entryId: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-cyber border border-dashed border-line bg-bg/30 px-[var(--space-panel)] py-6 text-center text-xs leading-relaxed text-dim">
        Nothing logged yet. Tap &ldquo;Add food&rdquo; to log what you eat.
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
              {entry.calories} kcal · P {entry.proteinG}g · C {entry.carbsG}g · F{" "}
              {entry.fatG}g
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
      <DailyTargetReminder profile={profile} onRecalibrate={onRecalibrate} />

      <div className="flex items-center justify-between gap-2 rounded-cyber border border-line bg-bg/30 px-3 py-2">
        <button
          type="button"
          onClick={() => onDateChange(shiftDateKey(dateKey, -1))}
          className="rounded-cyber px-2 py-1 text-sm text-dim transition-colors hover:border-cyan/30 hover:text-heading"
          aria-label="Previous day"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-xs tracking-wide text-dim uppercase">
            {isToday ? "Today" : "Daily log"}
          </p>
          <p className="text-sm font-medium text-heading">
            {formatDateLabel(dateKey)}
          </p>
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
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <div>
        <p className="mb-[var(--space-gap)] text-[10px] tracking-wide text-dim uppercase">
          Today&apos;s intake
        </p>
        <div className="grid grid-cols-2 gap-[var(--space-gap)] sm:grid-cols-4">
          <MacroStat
            label="Calories"
            value={profile.dailyCalories}
            unit="kcal"
            accent="amber"
            consumed={totals.calories}
            target={profile.dailyCalories}
          />
          <MacroStat
            label="Protein"
            value={profile.proteinG}
            unit="g"
            accent="cyan"
            consumed={totals.proteinG}
            target={profile.proteinG}
          />
          <MacroStat
            label="Carbs"
            value={profile.carbsG}
            unit="g"
            accent="green"
            consumed={totals.carbsG}
            target={profile.carbsG}
          />
          <MacroStat
            label="Fat"
            value={profile.fatG}
            unit="g"
            accent="magenta"
            consumed={totals.fatG}
            target={profile.fatG}
          />
        </div>
      </div>

      <div className="stack-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm tracking-wide text-heading">
            Planned foods
          </h3>
          <CyberButton
            variant="cyan"
            className="px-3 py-1.5 text-xs"
            onClick={onAddPlannedFood}
          >
            Add planned food
          </CyberButton>
        </div>
        <PlannedFoodList
          entries={plannedEntries}
          onEdit={onEditPlannedFood}
          onRemove={onRemoveFood}
          onTogglePlannedMeal={onTogglePlannedMeal}
        />
      </div>

      <div className="stack-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-sm tracking-wide text-heading">
            Food log
          </h3>
          <CyberButton
            variant="green"
            className="px-3 py-1.5 text-xs"
            onClick={onAddFood}
          >
            Add food
          </CyberButton>
        </div>
        <ManualFoodLogList entries={manualEntries} onRemove={onRemoveFood} />
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
  const [recalibrating, setRecalibrating] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showPlannedFoodModal, setShowPlannedFoodModal] = useState(false);
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

  if (!profile || recalibrating) {
    return (
      <TerminalWindow title="nutrition">
        <NutritionSetup
          initialProfile={recalibrating ? profile : undefined}
          requiredFirst={!profile}
          onSave={handleSave}
          onCancel={
            profile && recalibrating ? () => setRecalibrating(false) : undefined
          }
        />
      </TerminalWindow>
    );
  }

  return (
    <>
      <TerminalWindow title="nutrition">
        <NutritionDashboard
          profile={profile}
          dateKey={selectedDateKey}
          entries={dayEntries}
          onRecalibrate={() => setRecalibrating(true)}
          onDateChange={setSelectedDateKey}
          onAddFood={() => setShowAddFoodModal(true)}
          onRemoveFood={(entryId) => onRemoveFood(selectedDateKey, entryId)}
          onAddPlannedFood={() => {
            setEditingPlannedEntry(undefined);
            setShowPlannedFoodModal(true);
          }}
          onEditPlannedFood={handleEditPlannedFood}
          onTogglePlannedMeal={(entryId, completed) =>
            onTogglePlannedMeal(selectedDateKey, entryId, completed)
          }
        />
      </TerminalWindow>

      <AddFoodModal
        open={showAddFoodModal}
        onAdd={handleAddFood}
        onClose={() => setShowAddFoodModal(false)}
      />

      <PlannedFoodModal
        open={showPlannedFoodModal}
        initialEntry={editingPlannedEntry}
        onSave={handleSavePlannedFood}
        onClose={handleClosePlannedFoodModal}
      />
    </>
  );
}
