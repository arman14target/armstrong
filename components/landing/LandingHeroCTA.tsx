"use client";

import { useState } from "react";
import { DownloadButtons } from "@/components/landing/DownloadButtons";
import { OnboardingCoachModal } from "@/components/landing/OnboardingCoachModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { cn } from "@/lib/cn";
import { landingHero } from "@/lib/landingContent";

interface LandingHeroCTAProps {
  className?: string;
}

export function LandingHeroCTA({ className }: LandingHeroCTAProps) {
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <>
      <div className={cn("stack-md max-w-xl", className)}>
        <CyberButton
          variant="cyan"
          className="min-h-[3.25rem] px-6 text-base tracking-wide glow-primary-hover"
          onClick={() => setCoachOpen(true)}
        >
          {landingHero.cta}
        </CyberButton>
        <p className="text-xs text-dim">{landingHero.ctaHint}</p>
        <DownloadButtons />
      </div>

      <OnboardingCoachModal
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
      />
    </>
  );
}
