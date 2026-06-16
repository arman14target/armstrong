"use client";

import { useState } from "react";
import { DownloadButtons } from "@/components/landing/DownloadButtons";
import { OnboardingCoachModal } from "@/components/landing/OnboardingCoachModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { cn } from "@/lib/cn";

interface LandingHeroCTAProps {
  className?: string;
}

export function LandingHeroCTA({ className }: LandingHeroCTAProps) {
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <>
      <div className={cn("stack-md max-w-xl", className)}>
        <CyberButton
          variant="green"
          className="min-h-[3.25rem] px-6 text-base tracking-wide"
          onClick={() => setCoachOpen(true)}
        >
          Get your free workout plan
        </CyberButton>
        <p className="text-xs text-dim">
          One sentence about your goal — free full plan in minutes.
        </p>
        <DownloadButtons />
      </div>

      <OnboardingCoachModal
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
      />
    </>
  );
}
