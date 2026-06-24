"use client";

import { useTranslation } from "react-i18next";
import { DownloadButtons } from "@/components/landing/DownloadButtons";
import { CyberButton } from "@/components/ui/CyberButton";
import { cn } from "@/lib/cn";
import { getLandingHero } from "@/lib/landingContent";
import { APP_ROUTE } from "@/lib/routes";

interface LandingHeroCTAProps {
  className?: string;
}

export function LandingHeroCTA({ className }: LandingHeroCTAProps) {
  const { t } = useTranslation();
  const landingHero = getLandingHero(t);

  return (
    <div className={cn("stack-md max-w-xl", className)}>
      <CyberButton
        href={`${APP_ROUTE}/`}
        variant="magenta"
        className="min-h-[3.25rem] px-6 text-base"
      >
        {landingHero.cta}
      </CyberButton>
      <p className="text-xs text-dim">{landingHero.ctaHint}</p>
      <DownloadButtons />
    </div>
  );
}
