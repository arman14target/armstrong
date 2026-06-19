import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkoutPageClient } from "@/components/WorkoutPageClient";

export const metadata: Metadata = {
  title: "Workout — Armstrong",
  robots: {
    index: false,
    follow: false,
  },
};

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
