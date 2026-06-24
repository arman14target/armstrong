import type { Metadata } from "next";
import { TermsPageClient } from "@/components/legal/TermsPageClient";
import { absoluteUrl } from "@/lib/siteUrl";
import enUS from "@/lib/i18n/locales/en-US.json";

export const metadata: Metadata = {
  title: `${enUS.legal.terms.title} — Armstrong`,
  description: enUS.legal.terms.metaDescription,
  alternates: { canonical: absoluteUrl("/terms") },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <TermsPageClient />;
}
