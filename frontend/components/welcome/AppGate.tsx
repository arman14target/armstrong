"use client";

import { useMemo, useState } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { AppLoadingScreen } from "@/components/welcome/AppLoadingScreen";
import { WelcomeFlow } from "@/components/welcome/WelcomeFlow";
import { useAuth } from "@/contexts/AuthContext";
import { useGymStore } from "@/hooks/useGymStore";
import { isWelcomeCompleted, markWelcomeCompleted } from "@/lib/welcomeStorage";
import type { AppData } from "@/lib/types";

function hasExistingPlan(data: AppData): boolean {
  return Boolean(
    data.coachPlanActive ||
      data.customWorkouts.length > 0 ||
      data.nutritionProfile,
  );
}

export function AppGate() {
  const { user, loading: authLoading } = useAuth();
  const { data, hydrated } = useGymStore();
  const [welcomeComplete, setWelcomeComplete] = useState(() => isWelcomeCompleted());

  const showWelcome = useMemo(() => {
    if (!hydrated || authLoading) {
      return false;
    }

    if (user) {
      return false;
    }

    if (welcomeComplete || isWelcomeCompleted()) {
      return false;
    }

    if (hasExistingPlan(data)) {
      return false;
    }

    return true;
  }, [hydrated, authLoading, user, welcomeComplete, data]);

  if (!hydrated || authLoading) {
    return <AppLoadingScreen />;
  }

  if (showWelcome) {
    return (
      <WelcomeFlow
        onComplete={() => {
          markWelcomeCompleted();
          setWelcomeComplete(true);
        }}
      />
    );
  }

  return <HomeScreen />;
}
