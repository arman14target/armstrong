"use client";

import { useState } from "react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { cn } from "@/lib/cn";
import {
  NutritionGoal,
  NutritionInputs,
  NutritionProfile,
  NutritionSex,
  calculateNutritionTargets,
  createNutritionProfile,
  formatGoalLabel,
} from "@/lib/nutrition";

type SetupStep = "body" | "goal" | "review";

interface FoodTrackerSectionProps {
  profile: NutritionProfile | undefined;
  onSave: (profile: NutritionProfile) => void;
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
}: {
  label: string;
  value: number;
  unit: string;
  accent: "cyan" | "green" | "magenta" | "amber";
}) {
  const accentClass = {
    cyan: "text-cyan",
    green: "text-green",
    magenta: "text-magenta",
    amber: "text-amber",
  }[accent];

  return (
    <div className="rounded-cyber border border-line bg-bg/50 p-[var(--space-panel)] text-center">
      <p className="text-[10px] tracking-wide text-dim uppercase">{label}</p>
      <p className={cn("mt-1 font-display text-xl tracking-wide", accentClass)}>
        {value}
        <span className="ml-0.5 text-xs text-dim">{unit}</span>
      </p>
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
}: {
  initialProfile?: NutritionProfile;
  onSave: (profile: NutritionProfile) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<SetupStep>("body");
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

  const weightKg = parseNumber(weight);
  const heightCm = parseNumber(height);
  const ageYears = parseNumber(age);

  const draftInputs: NutritionInputs | null =
    weightKg && heightCm && ageYears && sex && goal
      ? { weightKg, heightCm, age: ageYears, sex, goal }
      : null;

  const previewTargets = draftInputs
    ? calculateNutritionTargets(draftInputs)
    : null;

  const validateBody = () => {
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
        <div>
          <h3 className="font-display text-sm tracking-wide text-heading">
            Your stats
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-dim">
            We use the Mifflin–St Jeor formula with your weight, height, age,
            and sex to estimate daily calories.
          </p>
        </div>

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

        <GoalChoice
          selected={goal}
          onSelect={(value) => {
            setGoal(value);
            if (errors.goal) {
              setErrors((prev) => ({ ...prev, goal: false }));
            }
          }}
        />

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

function NutritionDashboard({
  profile,
  onRecalibrate,
}: {
  profile: NutritionProfile;
  onRecalibrate: () => void;
}) {
  return (
    <div className="stack-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs tracking-wide text-dim uppercase">
            {formatGoalLabel(profile.goal)} plan
          </p>
          <p className="mt-0.5 text-xs text-dim">
            {profile.weightKg} kg · {profile.heightCm} cm · age {profile.age}
          </p>
        </div>
        <CyberButton
          variant="cyan"
          className="shrink-0 px-3 py-1.5 text-xs"
          onClick={onRecalibrate}
        >
          Recalibrate
        </CyberButton>
      </div>

      <div className="grid grid-cols-2 gap-[var(--space-gap)] sm:grid-cols-4">
        <MacroStat
          label="Calories"
          value={profile.dailyCalories}
          unit="kcal"
          accent="amber"
        />
        <MacroStat
          label="Protein"
          value={profile.proteinG}
          unit="g"
          accent="cyan"
        />
        <MacroStat
          label="Carbs"
          value={profile.carbsG}
          unit="g"
          accent="green"
        />
        <MacroStat
          label="Fat"
          value={profile.fatG}
          unit="g"
          accent="magenta"
        />
      </div>

      <p className="text-center text-xs leading-relaxed text-dim">
        Hit these daily to stay on track for your{" "}
        {formatGoalLabel(profile.goal).toLowerCase()}.
      </p>
    </div>
  );
}

export function FoodTrackerSection({
  profile,
  onSave,
}: FoodTrackerSectionProps) {
  const [recalibrating, setRecalibrating] = useState(false);

  const handleSave = (nextProfile: NutritionProfile) => {
    onSave(nextProfile);
    setRecalibrating(false);
  };

  return (
    <TerminalWindow title="armstrong://nutrition">
      {!profile || recalibrating ? (
        <NutritionSetup
          initialProfile={recalibrating ? profile : undefined}
          onSave={handleSave}
          onCancel={
            profile && recalibrating ? () => setRecalibrating(false) : undefined
          }
        />
      ) : (
        <NutritionDashboard
          profile={profile}
          onRecalibrate={() => setRecalibrating(true)}
        />
      )}
    </TerminalWindow>
  );
}
