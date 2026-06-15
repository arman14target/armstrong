"use client";

import { useSearchParams } from "next/navigation";
import { WorkoutScreen } from "@/components/WorkoutScreen";

export function WorkoutPageClient() {
  const searchParams = useSearchParams();
  const workoutId = searchParams.get("type");

  if (!workoutId) {
    return (
      <main className="page-shell--center">
        <p className="text-sm text-dim">No workout selected.</p>
      </main>
    );
  }

  return <WorkoutScreen workoutId={workoutId} />;
}
