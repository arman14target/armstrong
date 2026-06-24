"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

const footerLinkKeys = [
  { href: "/blog/", key: "navigation.blog" },
  { href: "/diet-planner/", key: "navigation.dietPlanner" },
  { href: "/gym-planner/", key: "navigation.gymPlanner" },
  { href: "/app/", key: "navigation.app" },
  { href: "/privacy/", key: "navigation.privacy" },
  { href: "/terms/", key: "navigation.terms" },
] as const;

type LandingFooterProps = React.ComponentPropsWithoutRef<"footer">;

export function LandingFooter({ className, ...props }: LandingFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className={cn("landing-footer", className)} {...props}>
      <nav aria-label={t("navigation.footerNav")} className="landing-footer__nav">
        {footerLinkKeys.map((link) => (
          <Link key={link.href} href={link.href} className="landing-footer__link">
            {t(link.key)}
          </Link>
        ))}
      </nav>
      <p className="landing-footer__copy">
        {t("navigation.footerCopy", { year: new Date().getFullYear() })}
      </p>
    </footer>
  );
}
