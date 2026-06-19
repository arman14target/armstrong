import type { Metadata } from "next";
import { DietPlannerPage } from "@/components/planner/DietPlannerPage";
import { PlannerFAQSchema } from "@/components/planner/PlannerFAQSchema";
import { dietPlannerFaq, dietPlannerSeo } from "@/lib/planner/dietContent";
import { buildOgImage } from "@/lib/seo";
import { absoluteUrl } from "@/lib/siteUrl";

const ogImage = buildOgImage("Armstrong free diet planner and macro calculator");

export const metadata: Metadata = {
  title: dietPlannerSeo.title,
  description: dietPlannerSeo.description,
  keywords: [...dietPlannerSeo.keywords],
  alternates: {
    canonical: absoluteUrl("/diet-planner"),
  },
  openGraph: {
    title: dietPlannerSeo.title,
    description: dietPlannerSeo.description,
    type: "website",
    url: absoluteUrl("/diet-planner"),
    siteName: "Armstrong",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: dietPlannerSeo.title,
    description: dietPlannerSeo.description,
    images: [ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DietPlannerRoute() {
  return (
    <>
      <PlannerFAQSchema faq={dietPlannerFaq} />
      <DietPlannerPage />
    </>
  );
}
