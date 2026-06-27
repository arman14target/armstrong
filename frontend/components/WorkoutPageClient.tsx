"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { APP_ROUTE } from "@/lib/routes";

export function WorkoutPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const workoutId = searchParams.get("type");

  useEffect(() => {
    if (!workoutId) {
      return;
    }

    router.replace(`${APP_ROUTE}?workout=${encodeURIComponent(workoutId)}`);
  }, [router, workoutId]);

  return (
    <main className="page-shell--center">
      <p className="animate-blink text-sm text-green">
        {workoutId ? t("workout.loading") : t("workout.noWorkoutSelected")}
      </p>
    </main>
  );
}
