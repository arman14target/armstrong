import type { Metadata } from "next";
import { GymPlannerPage } from "@/components/planner/GymPlannerPage";
import { PlannerFAQSchema } from "@/components/planner/PlannerFAQSchema";
import { gymPlannerFaq, gymPlannerSeo } from "@/lib/planner/gymContent";
import { absoluteUrl } from "@/lib/siteUrl";

export const metadata: Metadata = {
  title: gymPlannerSeo.title,
  description: gymPlannerSeo.description,
  keywords: [...gymPlannerSeo.keywords],
  alternates: {
    canonical: absoluteUrl("/gym-planner"),
  },
  openGraph: {
    title: gymPlannerSeo.title,
    description: gymPlannerSeo.description,
    type: "website",
    url: absoluteUrl("/gym-planner"),
    siteName: "Armstrong",
  },
  twitter: {
    card: "summary_large_image",
    title: gymPlannerSeo.title,
    description: gymPlannerSeo.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GymPlannerRoute() {
  return (
    <>
      <PlannerFAQSchema faq={gymPlannerFaq} />
      <GymPlannerPage />
    </>
  );
}
