import { LandingCalloutCalendar } from "@/components/landing/LandingCalloutCalendar";
import { LandingCalloutPlan } from "@/components/landing/LandingCalloutPlan";
import { LandingWorkoutPreview } from "@/components/landing/LandingWorkoutPreview";
import { cn } from "@/lib/cn";

export function LandingHeroVisual({ className }: { className?: string }) {
  return (
    <div className={cn("landing-hero-visual", className)} aria-hidden>
      <div className="landing-hero-visual__glow" />

      <div className="landing-callout-anchor landing-callout-anchor--calendar">
        <article className="landing-callout landing-callout--calendar">
          <LandingCalloutCalendar />
        </article>
      </div>

      <div className="landing-phone">
        <div className="landing-phone__bezel">
          <div className="landing-phone__notch" />
          <div className="landing-phone__screen">
            <LandingWorkoutPreview />
          </div>
          <div className="landing-phone__home-indicator" />
        </div>
      </div>

      <div className="landing-callout-anchor landing-callout-anchor--plan">
        <article className="landing-callout landing-callout--plan">
          <LandingCalloutPlan />
        </article>
      </div>
    </div>
  );
}
