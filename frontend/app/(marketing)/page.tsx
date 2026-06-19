import type { Metadata } from "next";
import { LandingFAQSchema } from "@/components/landing/LandingFAQSchema";
import { LandingPage } from "@/components/landing/LandingPage";
import { landingSeo } from "@/lib/landingContent";
import { absoluteAssetUrl, absoluteUrl } from "@/lib/siteUrl";

const ogImageUrl = absoluteAssetUrl("/og-image.jpg");

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
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Armstrong — free AI fitness coach and gym tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: landingSeo.title,
    description: landingSeo.description,
    images: [ogImageUrl],
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
