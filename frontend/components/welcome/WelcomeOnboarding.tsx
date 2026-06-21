"use client";

import { useMemo, useState } from "react";
import { ExperienceBar } from "@/components/planner/ExperienceBar";
import { NutritionBodyStatsSliders } from "@/components/nutrition/NutritionBodyStatsSliders";
import { CyberButton } from "@/components/ui/CyberButton";
import { EXPERIENCE_DESCRIPTIONS } from "@/lib/planner/experience";
import { estimateGoalTimeline } from "@/lib/planner/goalTimeline";
import {
  DEFAULT_WELCOME_INPUTS,
  type WelcomePlanInputs,
} from "@/lib/planner/welcomePlan";
import type { DaysPerWeek, GymEquipment, GymFocus } from "@/lib/planner/gymPlan";
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
        goal: inputs.goal,
        experience: inputs.experience,
      }),
    [inputs.weightKg, inputs.goal, inputs.experience],
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
              onChange={(bodyStats) => setInputs((prev) => ({ ...prev, ...bodyStats }))}
              idPrefix="welcome"
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
              We will pair your nutrition goal with a workout split that matches your level.
            </p>

            <fieldset className="planner-segment">
              <legend>Goal</legend>
              <div className="planner-segment__options">
                {(["bulk", "cut"] as const).map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    className={inputs.goal === goal ? "is-active" : undefined}
                    onClick={() => setInputs((prev) => ({ ...prev, goal }))}
                  >
                    {goal === "bulk" ? "Lean bulk" : "Cut fat"}
                  </button>
                ))}
              </div>
            </fieldset>

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
                {(
                  [
                    ["strength", "Strength"],
                    ["hypertrophy", "Hypertrophy"],
                    ["balanced", "Balanced"],
                  ] as const
                ).map(([focus, label]) => (
                  <button
                    key={focus}
                    type="button"
                    className={inputs.focus === focus ? "is-active" : undefined}
                    onClick={() => setInputs((prev) => ({ ...prev, focus: focus as GymFocus }))}
                  >
                    {label}
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
