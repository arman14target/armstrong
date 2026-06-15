import { Suspense } from "react";
import { WorkoutPageClient } from "@/components/WorkoutPageClient";

export default function WorkoutPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell--center">
          <p className="animate-blink text-sm text-green">Loading workout...</p>
        </main>
      }
    >
      <WorkoutPageClient />
    </Suspense>
  );
}
