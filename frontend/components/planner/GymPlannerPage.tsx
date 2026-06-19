"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { NavigationHeader } from "@/components/NavigationHeader";
import { ExperienceBar } from "@/components/planner/ExperienceBar";
import { ImportPlanButton } from "@/components/planner/ImportPlanButton";
import { WorkoutPlanDisplay } from "@/components/planner/WorkoutPlanDisplay";
import { CyberButton } from "@/components/ui/CyberButton";
import { SectionHead } from "@/components/ui/SectionHead";
import { useGymStore } from "@/hooks/useGymStore";
import { gymPlannerAbout, gymPlannerFaq, gymPlannerHero } from "@/lib/planner/gymContent";
import { EXPERIENCE_DESCRIPTIONS } from "@/lib/planner/experience";
import {
  DEFAULT_GYM_INPUTS,
  generateGymPlan,
  type DaysPerWeek,
  type GymEquipment,
  type GymFocus,
  type GymPlanInputs,
} from "@/lib/planner/gymPlan";
import type { NutritionSex } from "@/lib/nutrition";
import {
  formatHeight,
  formatWeight,
  kgToLb,
  lbToKg,
  type HeightUnit,
  type WeightUnit,
} from "@/lib/planner/units";

type Step = "stats" | "program" | "plan";

export function GymPlannerPage() {
  const { importGymPlanner } = useGymStore();
  const [step, setStep] = useState<Step>("stats");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [inputs, setInputs] = useState<GymPlanInputs>(DEFAULT_GYM_INPUTS);
  const [planKey, setPlanKey] = useState(0);

  const livePreview = useMemo(() => generateGymPlan(inputs), [inputs]);

  const weightDisplay =
    weightUnit === "kg"
      ? Math.round(inputs.weightKg)
      : Math.round(kgToLb(inputs.weightKg));

  const updateWeight = (value: number) => {
    const kg = weightUnit === "kg" ? value : lbToKg(value);
    setInputs((prev) => ({ ...prev, weightKg: kg }));
  };

  const generatePlan = () => {
    setPlanKey((k) => k + 1);
    setStep("plan");
  };

  const handleImportToApp = () => {
    importGymPlanner(livePreview);
  };

  return (
    <div className="landing-shell planner-page">
      <NavigationHeader className="nav-header--embedded mb-[var(--space-stack-lg)]" />

      <section className="planner-page__intro planner-page__intro--hero" aria-labelledby="gym-planner-headline">
        <p className="landing-kicker">
          <span className="landing-kicker__badge">{gymPlannerHero.badge}</span>
          {gymPlannerHero.kicker}
        </p>
        <h1
          id="gym-planner-headline"
          className="max-w-3xl font-display text-[clamp(1.75rem,5vw,3rem)] font-black leading-[1.05] tracking-[1px] text-heading sm:tracking-[3px]"
        >
          {gymPlannerHero.headline}
        </h1>
        <p className="landing-subhead max-w-2xl">{gymPlannerHero.subhead}</p>
      </section>

      <section className="landing-section planner-page__about" aria-labelledby="gym-planner-about">
        <h2
          id="gym-planner-about"
          className="max-w-2xl font-display text-xl tracking-wide text-heading uppercase sm:text-2xl"
        >
          {gymPlannerAbout.title}
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-dim sm:text-base">
          {gymPlannerAbout.copy}
        </p>
      </section>

      <section className="planner-page__tool" aria-labelledby="gym-planner-tool">
        <SectionHead index="01" title="Build Your Split" />

        <div className="planner-shell">
          <nav className="planner-steps" aria-label="Planner steps">
            {(["stats", "program", "plan"] as const).map((s, i) => (
              <span
                key={s}
                className={`planner-steps__item${step === s ? " planner-steps__item--active" : ""}${(["stats", "program", "plan"].indexOf(step) > i ? " planner-steps__item--done" : "")}`}
              >
                {i + 1}. {s === "stats" ? "Your stats" : s === "program" ? "Program" : "Your split"}
              </span>
            ))}
          </nav>

          <div className="planner-grid">
            <div className="planner-panel">
              {step === "stats" ? (
                <div className="planner-form stack-md">
                  <h2 id="gym-planner-tool" className="planner-panel__title">
                    Body stats
                  </h2>

                  <div className="planner-field">
                    <div className="planner-field__head">
                      <label htmlFor="gym-weight">Weight</label>
                      <div className="planner-unit-toggle">
                        {(["kg", "lb"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            className={weightUnit === u ? "is-active" : undefined}
                            onClick={() => setWeightUnit(u)}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="planner-field__value">{formatWeight(inputs.weightKg, weightUnit)}</p>
                    <input
                      id="gym-weight"
                      type="range"
                      min={weightUnit === "kg" ? 45 : 100}
                      max={weightUnit === "kg" ? 140 : 310}
                      value={weightDisplay}
                      onChange={(e) => updateWeight(Number(e.target.value))}
                      className="planner-range"
                    />
                  </div>

                  <div className="planner-field">
                    <div className="planner-field__head">
                      <label htmlFor="gym-height">Height</label>
                      <div className="planner-unit-toggle">
                        {(["cm", "ft"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            className={heightUnit === u ? "is-active" : undefined}
                            onClick={() => setHeightUnit(u)}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="planner-field__value">{formatHeight(inputs.heightCm, heightUnit)}</p>
                    <input
                      id="gym-height"
                      type="range"
                      min={150}
                      max={210}
                      value={inputs.heightCm}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, heightCm: Number(e.target.value) }))
                      }
                      className="planner-range"
                    />
                  </div>

                  <div className="planner-field">
                    <div className="planner-field__head">
                      <label htmlFor="gym-age">Age</label>
                      <span className="planner-field__value-inline">{inputs.age}</span>
                    </div>
                    <input
                      id="gym-age"
                      type="range"
                      min={16}
                      max={65}
                      value={inputs.age}
                      onChange={(e) =>
                        setInputs((prev) => ({ ...prev, age: Number(e.target.value) }))
                      }
                      className="planner-range"
                    />
                  </div>

                  <fieldset className="planner-segment">
                    <legend>Sex</legend>
                    <div className="planner-segment__options">
                      {(["male", "female"] as const).map((sex) => (
                        <button
                          key={sex}
                          type="button"
                          className={inputs.sex === sex ? "is-active" : undefined}
                          onClick={() => setInputs((prev) => ({ ...prev, sex: sex as NutritionSex }))}
                        >
                          {sex === "male" ? "Male" : "Female"}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <CyberButton variant="cyan" onClick={() => setStep("program")}>
                    Next: Program →
                  </CyberButton>
                </div>
              ) : null}

              {step === "program" ? (
                <div className="planner-form stack-md">
                  <h2 className="planner-panel__title">Program setup</h2>

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
                          onClick={() =>
                            setInputs((prev) => ({ ...prev, focus: focus as GymFocus }))
                          }
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
                            setInputs((prev) => ({
                              ...prev,
                              equipment: equipment as GymEquipment,
                            }))
                          }
                        >
                          {label}
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
                    <CyberButton variant="cyan" onClick={generatePlan}>
                      Generate workout split
                    </CyberButton>
                  </div>
                </div>
              ) : null}

              {step === "plan" ? (
                <div className="stack-md">
                  <ImportPlanButton
                    onImport={handleImportToApp}
                    label="Add workout split to app"
                  />
                  <CyberButton variant="magenta" onClick={() => setStep("program")}>
                    ← Adjust inputs
                  </CyberButton>
                </div>
              ) : null}
            </div>

            <div className="planner-panel planner-panel--preview" key={planKey}>
              {step === "plan" ? (
                <WorkoutPlanDisplay plan={livePreview} onImportToApp={handleImportToApp} />
              ) : (
                <div className="planner-preview">
                  <p className="planner-preview__label">Live split preview</p>
                  <p className="planner-preview__calories">{livePreview.splitName}</p>
                  <div className="planner-preview__macros">
                    <span>{livePreview.days.length} training days</span>
                    <span>{livePreview.weeklySets} sets / week</span>
                  </div>
                  <ul className="planner-preview__days">
                    {livePreview.days.map((day) => (
                      <li key={day.dayLabel}>
                        {day.dayLabel}: {day.name}
                      </li>
                    ))}
                  </ul>
                  <p className="planner-hint">
                    Generate to unlock full exercise lists with sets, reps, and rest.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="gym-faq-heading">
        <SectionHead index="02" title="FAQ" />
        <h2 id="gym-faq-heading" className="sr-only">
          Gym planner frequently asked questions
        </h2>
        <div className="landing-faq">
          {gymPlannerFaq.map((item) => (
            <details key={item.question} className="landing-faq__item">
              <summary className="landing-faq__question">{item.question}</summary>
              <p className="landing-faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-footer-cta" aria-labelledby="gym-cta">
        <div className="landing-footer-cta__inner">
          <h2 id="gym-cta" className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-3xl">
            Execute Your Split in Armstrong
          </h2>
          <p className="max-w-lg text-base text-dim sm:text-lg">
            Log sets, track PRs, and sync your plan to the cloud — free, no credit card.
            Need macros too?{" "}
            <Link href="/diet-planner/" className="text-cyan hover:text-heading">
              Try the free diet planner
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <CyberButton href="/app/" variant="cyan">
              Open App
            </CyberButton>
            <CyberButton href="/diet-planner/" variant="magenta">
              Diet Planner
            </CyberButton>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
