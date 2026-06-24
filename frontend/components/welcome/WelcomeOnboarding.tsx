"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ExperienceBar } from "@/components/planner/ExperienceBar";
import { GoalWeightSlider } from "@/components/nutrition/GoalWeightSlider";
import { NutritionBodyStatsSliders } from "@/components/nutrition/NutritionBodyStatsSliders";
import { WeightUnitPicker } from "@/components/nutrition/WeightUnitPicker";
import { CyberButton } from "@/components/ui/CyberButton";
import { estimateGoalTimeline } from "@/lib/planner/goalTimeline";
import {
  DEFAULT_WELCOME_INPUTS,
  type WelcomePlanInputs,
} from "@/lib/planner/welcomePlan";
import {
  GYM_FOCUS_OPTIONS,
  type DaysPerWeek,
  type GymEquipment,
  type GymFocus,
} from "@/lib/planner/gymPlan";
import type { ExperienceLevel } from "@/lib/planner/experience";
import type { WeightUnit } from "@/lib/types";
import { GoalTimelineChart } from "@/components/welcome/GoalTimelineChart";
import { WelcomeBackButton } from "@/components/welcome/WelcomeBackButton";
import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";
import { WelcomeStepProgress } from "@/components/welcome/WelcomeStepProgress";
import { touchNavHandlers } from "@/lib/touchNav";

type OnboardingStep = "stats" | "goal" | "program" | "timeline";

const STEPS: OnboardingStep[] = ["stats", "goal", "program", "timeline"];

const EXPERIENCE_KEYS: Record<ExperienceLevel, string> = {
  amateur: "welcome.experienceAmateur",
  intermediate: "welcome.experienceIntermediate",
  advanced: "welcome.experienceAdvanced",
  pro: "welcome.experiencePro",
};

const FOCUS_KEYS: Record<GymFocus, string> = {
  strength: "welcome.focusStrength",
  hypertrophy: "welcome.focusHypertrophy",
  balanced: "welcome.focusBalanced",
};

interface WelcomeOnboardingProps {
  onBack: () => void;
  onComplete: (inputs: WelcomePlanInputs) => void;
}

export function WelcomeOnboarding({ onBack, onComplete }: WelcomeOnboardingProps) {
  const { t } = useTranslation();
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
            <h2 className="welcome-panel__title">{t("welcome.statsTitle")}</h2>
            <p className="welcome-panel__copy">{t("welcome.statsCopy")}</p>

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

            <CyberButton variant="cyan" {...touchNavHandlers(() => setStep("goal"))}>
              {t("welcome.nextGoal")}
            </CyberButton>
          </div>
        ) : null}

        {step === "goal" ? (
          <div className="planner-form stack-md">
            <h2 className="welcome-panel__title">{t("welcome.goalTitle")}</h2>
            <p className="welcome-panel__copy">{t("welcome.goalCopy")}</p>

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
            <p className="planner-hint">{t(EXPERIENCE_KEYS[inputs.experience])}</p>

            <div className="planner-form__actions">
              <CyberButton variant="magenta" {...touchNavHandlers(() => setStep("stats"))}>
                {t("welcome.back")}
              </CyberButton>
              <CyberButton variant="cyan" {...touchNavHandlers(() => setStep("program"))}>
                {t("welcome.nextTraining")}
              </CyberButton>
            </div>
          </div>
        ) : null}

        {step === "program" ? (
          <div className="planner-form stack-md">
            <h2 className="welcome-panel__title">{t("welcome.programTitle")}</h2>
            <p className="welcome-panel__copy">{t("welcome.programCopy")}</p>

            <fieldset className="planner-segment">
              <legend>{t("welcome.daysPerWeek")}</legend>
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
                    {t("common.days", { count: days })}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="planner-segment">
              <legend>{t("welcome.focus")}</legend>
              <div className="planner-segment__options">
                {GYM_FOCUS_OPTIONS.map((focus) => (
                  <button
                    key={focus}
                    type="button"
                    className={inputs.focus === focus ? "is-active" : undefined}
                    onClick={() => setInputs((prev) => ({ ...prev, focus }))}
                  >
                    {t(FOCUS_KEYS[focus])}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="planner-segment">
              <legend>{t("welcome.equipment")}</legend>
              <div className="planner-segment__options">
                {(
                  [
                    ["full_gym", "welcome.equipmentFullGym"],
                    ["home", "welcome.equipmentHome"],
                  ] as const
                ).map(([equipment, labelKey]) => (
                  <button
                    key={equipment}
                    type="button"
                    className={inputs.equipment === equipment ? "is-active" : undefined}
                    onClick={() =>
                      setInputs((prev) => ({ ...prev, equipment: equipment as GymEquipment }))
                    }
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="planner-form__actions">
              <CyberButton variant="magenta" {...touchNavHandlers(() => setStep("goal"))}>
                {t("welcome.back")}
              </CyberButton>
              <CyberButton variant="cyan" {...touchNavHandlers(() => setStep("timeline"))}>
                {t("welcome.seeTimeline")}
              </CyberButton>
            </div>
          </div>
        ) : null}

        {step === "timeline" ? (
          <div className="stack-md">
            <h2 className="welcome-panel__title">{t("welcome.timelineTitle")}</h2>
            <p className="welcome-panel__copy">
              {t("welcome.timelineCopy", {
                weeklyRate: estimate.weeklyRateKg,
                goalLabel: estimate.goalLabel,
                targetChange: estimate.targetChangeKg,
                weeks: estimate.weeks,
              })}
            </p>

            <GoalTimelineChart estimate={estimate} />

            <p className="planner-hint">{t("welcome.timelineHint")}</p>

            <div className="planner-form__actions">
              <CyberButton variant="magenta" {...touchNavHandlers(() => setStep("program"))}>
                {t("welcome.back")}
              </CyberButton>
              <CyberButton variant="cyan" {...touchNavHandlers(() => onComplete(inputs))}>
                {t("welcome.startTraining")}
              </CyberButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
