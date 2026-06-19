import type { Metadata } from "next";
import { LandingFAQSchema } from "@/components/landing/LandingFAQSchema";
import { LandingPage } from "@/components/landing/LandingPage";
import { landingSeo } from "@/lib/landingContent";

export const metadata: Metadata = {
  title: landingSeo.title,
  description: landingSeo.description,
  keywords: [...landingSeo.keywords],
  openGraph: {
    title: landingSeo.title,
    description: landingSeo.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: landingSeo.title,
    description: landingSeo.description,
  },
};

export default function Landing() {
  return (
    <>
      <LandingFAQSchema />
      <LandingPage />
    </>
  );
}
