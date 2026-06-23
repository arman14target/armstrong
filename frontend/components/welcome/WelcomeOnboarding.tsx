"use client";

import { useMemo, useState } from "react";
import { ExperienceBar } from "@/components/planner/ExperienceBar";
import { GoalWeightSlider } from "@/components/nutrition/GoalWeightSlider";
import { NutritionBodyStatsSliders } from "@/components/nutrition/NutritionBodyStatsSliders";
import { WeightUnitPicker } from "@/components/nutrition/WeightUnitPicker";
import { CyberButton } from "@/components/ui/CyberButton";
import { EXPERIENCE_DESCRIPTIONS } from "@/lib/planner/experience";
import { estimateGoalTimeline } from "@/lib/planner/goalTimeline";
import {
  DEFAULT_WELCOME_INPUTS,
  type WelcomePlanInputs,
} from "@/lib/planner/welcomePlan";
import {
  GYM_FOCUS_LABELS,
  GYM_FOCUS_OPTIONS,
  type DaysPerWeek,
  type GymEquipment,
} from "@/lib/planner/gymPlan";
import type { WeightUnit } from "@/lib/types";
import { GoalTimelineChart } from "@/components/welcome/GoalTimelineChart";
import { WelcomeBackButton } from "@/components/welcome/WelcomeBackButton";
import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";
import { WelcomeStepProgress } from "@/components/welcome/WelcomeStepProgress";

type OnboardingStep = "stats" | "goal" | "program" | "timeline";

const STEPS: OnboardingStep[] = ["stats", "goal", "program", "timeline"];

interface WelcomeOnboardingProps {
  onBack: () => void;
  onComplete: (inputs: WelcomePlanInputs) => void;
}

export function WelcomeOnboarding({ onBack, onComplete }: WelcomeOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("stats");
  const [inputs, setInputs] = useState<WelcomePlanInputs>(DEFAULT_WELCOME_INPUTS);

  const stepIndex = STEPS.indexOf(step);
  const estimate = useMemo(
    () =>
      estimateGoalTimeline({
        weightKg: inputs.weightKg,
        targetWeightKg: inputs.targetWeightKg,
        experience: inputs.experience,
      }),
    [inputs.weightKg, inputs.targetWeightKg, inputs.experience],
  );

  return (
    <div className="welcome-onboarding">
      <div className="welcome-onboarding__top">
        <div className="welcome-onboarding__toolbar">
          <WelcomeBackButton onClick={onBack} />
          <WelcomeBrand compact />
        </div>

        <WelcomeStepProgress stepIndex={stepIndex} totalSteps={STEPS.length} />
      </div>

      <div className="welcome-panel welcome-onboarding__panel">
        {step === "stats" ? (
          <div className="planner-form stack-md">
            <h2 className="welcome-panel__title">Tell us about you</h2>
            <p className="welcome-panel__copy">
              Weight, height, age, and sex shape your calorie targets and training volume.
            </p>

            <NutritionBodyStatsSliders
              values={inputs}
              weightUnit={inputs.weightUnit}
              onChange={(bodyStats) => setInputs((prev) => ({ ...prev, ...bodyStats }))}
              idPrefix="welcome"
            />

            <WeightUnitPicker
              value={inputs.weightUnit}
              onChange={(weightUnit: WeightUnit) =>
                setInputs((prev) => ({ ...prev, weightUnit }))
              }
            />

            <CyberButton variant="cyan" onClick={() => setStep("goal")}>
              Next: Your goal →
            </CyberButton>
          </div>
        ) : null}

        {step === "goal" ? (
          <div className="planner-form stack-md">
            <h2 className="welcome-panel__title">What are you working toward?</h2>
            <p className="welcome-panel__copy">
              Set your goal weight — we&apos;ll figure out cut or bulk from there and
              match your training to your level.
            </p>

            <GoalWeightSlider
              currentWeightKg={inputs.weightKg}
              targetWeightKg={inputs.targetWeightKg}
              unit={inputs.weightUnit}
              idPrefix="welcome-goal"
              onChange={(targetWeightKg) =>
                setInputs((prev) => ({ ...prev, targetWeightKg }))
              }
            />

            <ExperienceBar
              value={inputs.experience}
              onChange={(experience) => setInputs((prev) => ({ ...prev, experience }))}
            />
            <p className="planner-hint">{EXPERIENCE_DESCRIPTIONS[inputs.experience]}</p>

            <div className="planner-form__actions">
              <CyberButton variant="magenta" onClick={() => setStep("stats")}>
                ← Back
              </CyberButton>
              <CyberButton variant="cyan" onClick={() => setStep("program")}>
                Next: Training →
              </CyberButton>
            </div>
          </div>
        ) : null}

        {step === "program" ? (
          <div className="planner-form stack-md">
            <h2 className="welcome-panel__title">Build your split</h2>
            <p className="welcome-panel__copy">
              Choose how often you train, what you are optimizing for, and what equipment you have.
            </p>

            <fieldset className="planner-segment">
              <legend>Days per week</legend>
              <div className="planner-segment__options planner-segment__options--wrap">
                {([3, 4, 5, 6] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    className={inputs.daysPerWeek === days ? "is-active" : undefined}
                    onClick={() =>
                      setInputs((prev) => ({ ...prev, daysPerWeek: days as DaysPerWeek }))
                    }
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="planner-segment">
              <legend>Focus</legend>
              <div className="planner-segment__options">
                {GYM_FOCUS_OPTIONS.map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    className={inputs.focus === focus ? "is-active" : undefined}
                    onClick={() => setInputs((prev) => ({ ...prev, focus }))}
                  >
                    {GYM_FOCUS_LABELS[focus]}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="planner-segment">
              <legend>Equipment</legend>
              <div className="planner-segment__options">
                {(
                  [
                    ["full_gym", "Full gym"],
                    ["home", "Home"],
                  ] as const
                ).map(([equipment, label]) => (
                  <button
                    key={equipment}
                    type="button"
                    className={inputs.equipment === equipment ? "is-active" : undefined}
                    onClick={() =>
                      setInputs((prev) => ({ ...prev, equipment: equipment as GymEquipment }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="planner-form__actions">
              <CyberButton variant="magenta" onClick={() => setStep("goal")}>
                ← Back
              </CyberButton>
              <CyberButton variant="cyan" onClick={() => setStep("timeline")}>
                See your timeline →
              </CyberButton>
            </div>
          </div>
        ) : null}

        {step === "timeline" ? (
          <div className="stack-md">
            <h2 className="welcome-panel__title">You are on track</h2>
            <p className="welcome-panel__copy">
              At about {estimate.weeklyRateKg} kg per week of {estimate.goalLabel}, you could
              reach roughly {estimate.targetChangeKg} kg of change in about{" "}
              <strong className="text-cyan">{estimate.weeks} weeks</strong> with consistent
              training and nutrition.
            </p>

            <GoalTimelineChart estimate={estimate} />

            <p className="planner-hint">
              This is an estimate based on your stats and experience — real results vary with
              sleep, adherence, and recovery.
            </p>

            <div className="planner-form__actions">
              <CyberButton variant="magenta" onClick={() => setStep("program")}>
                ← Back
              </CyberButton>
              <CyberButton variant="cyan" onClick={() => onComplete(inputs)}>
                Start training →
              </CyberButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
