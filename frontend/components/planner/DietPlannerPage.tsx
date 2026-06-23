"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { NavigationHeader } from "@/components/NavigationHeader";
import { ExperienceBar } from "@/components/planner/ExperienceBar";
import { ImportPlanButton } from "@/components/planner/ImportPlanButton";
import { MealPlanDisplay } from "@/components/planner/MealPlanDisplay";
import { GoalWeightSlider } from "@/components/nutrition/GoalWeightSlider";
import { NutritionBodyStatsSliders } from "@/components/nutrition/NutritionBodyStatsSliders";
import { CyberButton } from "@/components/ui/CyberButton";
import { SectionHead } from "@/components/ui/SectionHead";
import { useGymStore } from "@/hooks/useGymStore";
import {
  dietPlannerAbout,
  dietPlannerFaq,
  dietPlannerHero,
} from "@/lib/planner/dietContent";
import {
  DEFAULT_DIET_INPUTS,
  generateDietPlan,
  type DietPlanInputs,
} from "@/lib/planner/dietPlan";
import { EXPERIENCE_DESCRIPTIONS } from "@/lib/planner/experience";

type Step = "stats" | "goal" | "plan";

export function DietPlannerPage() {
  const { importDietPlanner } = useGymStore();
  const [step, setStep] = useState<Step>("stats");
  const [inputs, setInputs] = useState<DietPlanInputs>(DEFAULT_DIET_INPUTS);
  const [planKey, setPlanKey] = useState(0);

  const livePreview = useMemo(() => generateDietPlan(inputs), [inputs]);

  const generatePlan = () => {
    setPlanKey((k) => k + 1);
    setStep("plan");
  };

  const handleImportToApp = () => {
    importDietPlanner(inputs, livePreview);
  };

  return (
    <div className="landing-shell planner-page">
      <NavigationHeader className="nav-header--embedded mb-[var(--space-stack-lg)]" />

      <section className="planner-page__intro planner-page__intro--hero" aria-labelledby="diet-planner-headline">
        <p className="landing-kicker">
          <span className="landing-kicker__badge">{dietPlannerHero.badge}</span>
          {dietPlannerHero.kicker}
        </p>
        <h1
          id="diet-planner-headline"
          className="max-w-3xl font-display text-[clamp(1.75rem,5vw,3rem)] font-black leading-[1.05] tracking-[1px] text-heading sm:tracking-[3px]"
        >
          {dietPlannerHero.headline}
        </h1>
        <p className="landing-subhead max-w-2xl">{dietPlannerHero.subhead}</p>
      </section>

      <section className="landing-section planner-page__about" aria-labelledby="diet-planner-about">
        <h2
          id="diet-planner-about"
          className="max-w-2xl font-display text-xl tracking-wide text-heading uppercase sm:text-2xl"
        >
          {dietPlannerAbout.title}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-dim sm:text-base">
          {dietPlannerAbout.copy}
        </p>
      </section>

      <section className="planner-page__tool" aria-labelledby="diet-planner-tool">
        <SectionHead index="01" title="Build Your Plan" />

        <div className="planner-shell">
          <nav className="planner-steps" aria-label="Planner steps">
            {(["stats", "goal", "plan"] as const).map((s, i) => (
              <span
                key={s}
                className={`planner-steps__item${step === s ? " planner-steps__item--active" : ""}${(["stats", "goal", "plan"].indexOf(step) > i ? " planner-steps__item--done" : "")}`}
              >
                {i + 1}. {s === "stats" ? "Your stats" : s === "goal" ? "Goal & level" : "Your plan"}
              </span>
            ))}
          </nav>

          <div className="planner-grid">
            <div className="planner-panel">
              {step === "stats" ? (
                <div className="planner-form stack-md">
                  <h2 id="diet-planner-tool" className="planner-panel__title">
                    Body stats
                  </h2>

                  <NutritionBodyStatsSliders
                    values={inputs}
                    weightUnit="kg"
                    onChange={(bodyStats) =>
                      setInputs((prev) => ({ ...prev, ...bodyStats }))
                    }
                    idPrefix="diet-planner"
                  />

                  <CyberButton variant="cyan" onClick={() => setStep("goal")}>
                    Next: Goal & level →
                  </CyberButton>
                </div>
              ) : null}

              {step === "goal" ? (
                <div className="planner-form stack-md">
                  <h2 className="planner-panel__title">Goal weight & experience</h2>

                  <GoalWeightSlider
                    currentWeightKg={inputs.weightKg}
                    targetWeightKg={inputs.targetWeightKg}
                    unit="kg"
                    idPrefix="diet-planner-goal"
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
                    <CyberButton variant="cyan" onClick={generatePlan}>
                      Generate meal plan
                    </CyberButton>
                  </div>
                </div>
              ) : null}

              {step === "plan" ? (
                <div className="stack-md">
                  <ImportPlanButton
                    onImport={handleImportToApp}
                    label="Add meal plan to app"
                  />
                  <CyberButton variant="magenta" onClick={() => setStep("goal")}>
                    ← Adjust inputs
                  </CyberButton>
                </div>
              ) : null}
            </div>

            <div className="planner-panel planner-panel--preview" key={planKey}>
              {step === "plan" ? (
                <MealPlanDisplay
                  targets={livePreview.targets}
                  meals={livePreview.meals}
                  goalLabel={livePreview.goalLabel}
                  hydrationLiters={livePreview.hydrationLiters}
                  mealPrepNote={livePreview.mealPrepNote}
                  onImportToApp={handleImportToApp}
                />
              ) : (
                <div className="planner-preview">
                  <p className="planner-preview__label">Live macro preview</p>
                  <p className="planner-preview__calories">{livePreview.targets.dailyCalories} kcal</p>
                  <div className="planner-preview__macros">
                    <span>P {livePreview.targets.proteinG}g</span>
                    <span>C {livePreview.targets.carbsG}g</span>
                    <span>F {livePreview.targets.fatG}g</span>
                  </div>
                  <p className="planner-hint">
                    Finish the steps to unlock your full four-meal day with foods and tips.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="diet-faq-heading">
        <SectionHead index="02" title="FAQ" />
        <h2 id="diet-faq-heading" className="sr-only">
          Diet planner frequently asked questions
        </h2>
        <div className="landing-faq">
          {dietPlannerFaq.map((item) => (
            <details key={item.question} className="landing-faq__item">
              <summary className="landing-faq__question">{item.question}</summary>
              <p className="landing-faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-footer-cta" aria-labelledby="diet-cta">
        <div className="landing-footer-cta__inner">
          <h2 id="diet-cta" className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-3xl">
            Log Every Macro in Armstrong
          </h2>
          <p className="max-w-lg text-base text-dim sm:text-lg">
            Your plan is the start. The app tracks meals, PRs, and progress — free, no credit card.
            Need a workout split too?{" "}
            <Link href="/gym-planner/" className="text-cyan hover:text-heading">
              Try the free gym planner
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <CyberButton href="/app/" variant="cyan">
              Open App
            </CyberButton>
            <CyberButton href="/gym-planner/" variant="magenta">
              Gym Planner
            </CyberButton>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
