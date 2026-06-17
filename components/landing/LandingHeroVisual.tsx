import { LandingCalloutCalendar } from "@/components/landing/LandingCalloutCalendar";
import { LandingCalloutPlan } from "@/components/landing/LandingCalloutPlan";
import { withBasePath } from "@/lib/basePath";
import { cn } from "@/lib/cn";
import { revealDelayStyle } from "@/lib/revealAnimation";

interface LandingHeroVisualProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  revealDelay?: number;
}

export function LandingHeroVisual({
  className,
  revealDelay = 0,
  style,
  ...props
}: LandingHeroVisualProps) {
  return (
    <div
      className={cn("landing-hero-visual", className)}
      style={{ ...revealDelayStyle(revealDelay), ...style }}
      aria-hidden
      {...props}
    >
      <div className="landing-hero-visual__glow" />

      <div className="landing-callout-anchor landing-callout-anchor--calendar">
        <article className="landing-callout landing-callout--calendar">
          <LandingCalloutCalendar />
        </article>
      </div>

      <div className="landing-hero-figure">
        <div className="landing-hero-figure__warm-glow" />
        <div className="landing-hero-figure__ground-glow" aria-hidden />
        <img
          src={withBasePath("/images/landing/theposingguy.png")}
          alt=""
          className="landing-hero-figure__image"
          width={1408}
          height={768}
          loading="eager"
          decoding="async"
        />
      </div>

      <div className="landing-callout-anchor landing-callout-anchor--plan">
        <article className="landing-callout landing-callout--plan">
          <LandingCalloutPlan />
        </article>
      </div>
    </div>
  );
}
