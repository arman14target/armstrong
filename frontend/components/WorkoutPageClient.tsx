"use client";

import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { WorkoutScreen } from "@/components/WorkoutScreen";

export function WorkoutPageClient() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const workoutId = searchParams.get("type");

  if (!workoutId) {
    return (
      <main className="page-shell--center">
        <p className="text-sm text-dim">{t("workout.noWorkoutSelected")}</p>
      </main>
    );
  }

  return <WorkoutScreen workoutId={workoutId} />;
}
