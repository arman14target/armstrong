"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto w-full max-w-3xl px-[var(--space-page-x)] py-[var(--space-page-top)] pb-[var(--space-page-bottom)]">
      <Link
        href="/"
        className="text-xs uppercase tracking-wide text-dim hover:text-heading"
      >
        {t("legal.backLink")}
      </Link>

      <h1 className="mt-4 font-heading text-3xl tracking-wide text-heading sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-dim">{t("legal.lastUpdated", { date: updated })}</p>

      <div className="legal-prose mt-8 space-y-6 text-sm leading-relaxed text-text">
        {children}
      </div>
    </main>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg tracking-wide text-heading">
        {heading}
      </h2>
      {children}
    </section>
  );
}
