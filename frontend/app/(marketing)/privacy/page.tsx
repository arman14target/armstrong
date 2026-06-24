import type { Metadata } from "next";
import { PrivacyPageClient } from "@/components/legal/PrivacyPageClient";
import { absoluteUrl } from "@/lib/siteUrl";
import enUS from "@/lib/i18n/locales/en-US.json";

export const metadata: Metadata = {
  title: `${enUS.legal.privacy.title} — Armstrong`,
  description: enUS.legal.privacy.metaDescription,
  alternates: { canonical: absoluteUrl("/privacy") },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
