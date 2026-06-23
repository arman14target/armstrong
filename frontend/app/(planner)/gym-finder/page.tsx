import type { Metadata } from "next";
import { GymFinderPage } from "@/components/GymFinderPage";
import { buildOgImage } from "@/lib/seo";
import { absoluteUrl } from "@/lib/siteUrl";

const title = "Free Gym Finder — Find Gyms Near You | Armstrong";
const description =
  "Find gyms near you by location or zip code. Compare distance and get directions, then track your workouts free in Armstrong.";
const ogImage = buildOgImage("Find gyms near you with the Armstrong gym finder");

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "gym finder",
    "gyms near me",
    "find a gym",
    "gym locator",
    "fitness centers near me",
  ],
  alternates: { canonical: absoluteUrl("/gym-finder") },
  openGraph: {
    title,
    description,
    type: "website",
    url: absoluteUrl("/gym-finder"),
    siteName: "Armstrong",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage.url],
  },
  robots: { index: true, follow: true },
};

export default function GymFinderRoute() {
  return <GymFinderPage />;
}
