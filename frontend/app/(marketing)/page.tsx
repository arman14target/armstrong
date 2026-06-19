import type { Metadata } from "next";
import { LandingFAQSchema } from "@/components/landing/LandingFAQSchema";
import { LandingPage } from "@/components/landing/LandingPage";
import { landingSeo } from "@/lib/landingContent";
import { buildOgImage } from "@/lib/seo";
import { absoluteUrl } from "@/lib/siteUrl";

const ogImage = buildOgImage("Armstrong — free AI fitness coach and gym tracker");

export const metadata: Metadata = {
  title: landingSeo.title,
  description: landingSeo.description,
  keywords: [...landingSeo.keywords],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: landingSeo.title,
    description: landingSeo.description,
    type: "website",
    url: absoluteUrl("/"),
    siteName: "Armstrong",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: landingSeo.title,
    description: landingSeo.description,
    images: [ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <>
      <LandingFAQSchema />
      <LandingPage />
    </>
  );
}
