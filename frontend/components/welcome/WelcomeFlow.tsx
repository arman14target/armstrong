"use client";

import { useCallback, useState } from "react";
import { DietPlanScreen } from "@/components/welcome/DietPlanScreen";
import { ExercisePlanScreen } from "@/components/welcome/ExercisePlanScreen";
import { PlainTextPlanScreen } from "@/components/welcome/PlainTextPlanScreen";
import { WelcomeAuthPanel } from "@/components/welcome/WelcomeAuthPanel";
import { WelcomeChoice } from "@/components/welcome/WelcomeChoice";
import { WelcomeOnboarding } from "@/components/welcome/WelcomeOnboarding";
import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";
import { WelcomeStrengthBackground } from "@/components/welcome/WelcomeStrengthBackground";
import { useGymStore } from "@/hooks/useGymStore";
import type { CoachDietPlan } from "@/lib/coachDiet";
import type { CoachGymPlan } from "@/lib/coachWorkout";
import { cn } from "@/lib/cn";
import type { WelcomePlanInputs } from "@/lib/planner/welcomePlan";
import {
  extractDietPlanFromText,
  extractGymPlanFromText,
} from "@/lib/welcomeTextImport";

type WelcomeView =
  | "choice"
  | "login"
  | "onboarding"
  | "exercise-plan"
  | "exercise-plain-text"
  | "diet-plain-text"
  | "diet-plan";

interface WelcomeFlowProps {
  onComplete: () => void;
}

export function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const {
    importWelcomePlan,
    applyCoachGymPlan,
    applyCoachDietPlan,
    importDefaultManualExercisePlan,
  } = useGymStore();
  const [view, setView] = useState<WelcomeView>("choice");
  const [pendingGymPlan, setPendingGymPlan] = useState<CoachGymPlan | null>(null);
  const [dietPlainTextBackView, setDietPlainTextBackView] = useState<
    "exercise-plain-text" | "diet-plan"
  >("exercise-plain-text");

  const finish = () => {
    onComplete();
  };

  const finishWithTextPlans = useCallback(
    (gymPlan: CoachGymPlan | null, dietPlan: CoachDietPlan | null) => {
      if (gymPlan) {
        applyCoachGymPlan(gymPlan);
      }
      if (dietPlan) {
        applyCoachDietPlan(dietPlan);
      }
      finish();
    },
    [applyCoachDietPlan, applyCoachGymPlan],
  );

  const handleMakePlanComplete = (inputs: WelcomePlanInputs) => {
    importWelcomePlan(inputs);
    finish();
  };

  const goToDietPlainText = (backView: "exercise-plain-text" | "diet-plan") => {
    setDietPlainTextBackView(backView);
    setView("diet-plain-text");
  };

  const handleExerciseTextSubmit = async (text: string) => {
    const plan = await extractGymPlanFromText(text);
    setPendingGymPlan(plan);
    goToDietPlainText("exercise-plain-text");
  };

  const handleDietTextSubmit = async (text: string) => {
    const plan = await extractDietPlanFromText(text);
    finishWithTextPlans(pendingGymPlan, plan);
  };

  return (
    <div className={cn("welcome-flow", view === "choice" && "welcome-flow--with-brand")}>
      <WelcomeStrengthBackground />
      <div className="welcome-flow__content">
      {view === "choice" ? (
        <WelcomeChoice
          onMakePlan={() => setView("onboarding")}
          onHavePlan={() => setView("exercise-plan")}
          onLogin={() => setView("login")}
        />
      ) : null}

      {view === "login" ? (
        <WelcomeAuthPanel onBack={() => setView("choice")} onSuccess={finish} />
      ) : null}

      {view === "onboarding" ? (
        <WelcomeOnboarding
          onBack={() => setView("choice")}
          onComplete={handleMakePlanComplete}
        />
      ) : null}

      {view === "exercise-plan" ? (
        <ExercisePlanScreen
          onPlainText={() => setView("exercise-plain-text")}
          onManualAdd={() => {
            importDefaultManualExercisePlan();
            setView("diet-plan");
          }}
          onBack={() => setView("choice")}
        />
      ) : null}

      {view === "exercise-plain-text" ? (
        <PlainTextPlanScreen
          title="Exercise plan"
          prompt="Please describe or write your exercise program."
          placeholder={`Push Day
Bench press 4x8 @ 80kg, 90s rest
Incline dumbbell press 3x10

Pull Day
Barbell row 4x8
Lat pulldown 3x12`}
          onSubmit={handleExerciseTextSubmit}
          onSkip={() => goToDietPlainText("exercise-plain-text")}
          onBack={() => setView("exercise-plan")}
        />
      ) : null}

      {view === "diet-plain-text" ? (
        <PlainTextPlanScreen
          title="Diet plan"
          prompt="Please describe or write your meal plan."
          placeholder={`Breakfast: Greek yogurt, berries, granola — 450 kcal, 35g protein
Lunch: Chicken breast, rice, broccoli — 650 kcal, 50g protein
Dinner: Salmon, sweet potato, greens — 600 kcal, 45g protein
Snack: Protein shake — 200 kcal, 30g protein`}
          onSubmit={handleDietTextSubmit}
          onSkip={() => finishWithTextPlans(pendingGymPlan, null)}
          onBack={() => setView(dietPlainTextBackView)}
        />
      ) : null}

      {view === "diet-plan" ? (
        <DietPlanScreen
          onPlainText={() => goToDietPlainText("diet-plan")}
          onManualAdd={finish}
          onBack={() => setView("exercise-plan")}
        />
      ) : null}
      </div>

      {view === "choice" ? (
        <footer className="welcome-flow__brand">
          <WelcomeBrand />
        </footer>
      ) : null}
    </div>
  );
}
