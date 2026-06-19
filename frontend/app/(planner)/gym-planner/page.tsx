import type { Metadata } from "next";
import { GymPlannerPage } from "@/components/planner/GymPlannerPage";
import { PlannerFAQSchema } from "@/components/planner/PlannerFAQSchema";
import { gymPlannerFaq, gymPlannerSeo } from "@/lib/planner/gymContent";
import { buildOgImage } from "@/lib/seo";
import { absoluteUrl } from "@/lib/siteUrl";

const ogImage = buildOgImage("Armstrong free gym workout planner and split builder");

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
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: gymPlannerSeo.title,
    description: gymPlannerSeo.description,
    images: [ogImage.url],
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
