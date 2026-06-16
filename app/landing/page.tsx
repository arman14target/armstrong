import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Armstrong — AI Fitness Coach",
  description:
    "Stop logging. Start growing. Armstrong auto-saves your workouts and delivers AI-driven training optimization.",
  openGraph: {
    title: "Armstrong — AI Fitness Coach",
    description:
      "Your AI personal coach that auto-saves every rep and tracks your progress — zero notebooks, zero friction.",
    type: "website",
  },
};

export default function Landing() {
  return <LandingPage />;
}
