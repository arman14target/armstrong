import Link from "next/link";
import { DownloadButtons } from "@/components/landing/DownloadButtons";
import { LandingHeroCTA } from "@/components/landing/LandingHeroCTA";
import { LandingHeroVisual } from "@/components/landing/LandingHeroVisual";
import {
  landingFeatures,
  landingFaq,
  landingFooterCta,
  landingHero,
  landingRiskReversal,
  landingSteps,
} from "@/lib/landingContent";
import { revealDelayStyle } from "@/lib/revealAnimation";
import { SectionHead } from "@/components/ui/SectionHead";

const accentBorder: Record<
  (typeof landingFeatures)[number]["accent"],
  string
> = {
  cyan: "border-cyan/30 hover:border-cyan/60",
  magenta: "border-magenta/30 hover:border-magenta/60",
  green: "border-green/30 hover:border-green/60",
};

const accentText: Record<(typeof landingFeatures)[number]["accent"], string> = {
  cyan: "text-cyan",
  magenta: "text-magenta",
  green: "text-green",
};

export function LandingPage() {
  return (
    <div className="landing-shell">
      <header
        className="landing-nav reveal-hidden"
        data-reveal="scroll"
      >
        <Link
          href="/"
          className="font-display text-sm tracking-[3px] text-heading uppercase transition-colors hover:text-cyan"
        >
          Armstrong
        </Link>
      </header>

      <section className="landing-hero" aria-labelledby="landing-headline">
        <div className="landing-hero__grid">
          <div className="landing-hero__copy">
            <p className="landing-kicker">
              <span className="landing-kicker__badge">{landingHero.badge}</span>
              {landingHero.kicker}
            </p>
            <h1
              id="landing-headline"
              className="max-w-3xl font-display text-[clamp(2rem,8vw,4.5rem)] font-black leading-[1.05] tracking-[1px] text-heading sm:tracking-[3px]"
            >
              {landingHero.headline}
            </h1>
            <p className="landing-subhead max-w-2xl">{landingHero.subhead}</p>
            <LandingHeroCTA className="mt-2" />
          </div>
          <LandingHeroVisual className="landing-hero__visual" />
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-section" aria-labelledby="how-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index="01" title="How It Works" />
        </div>
        <h2 id="how-heading" className="sr-only">
          Three-step AI workout generator process
        </h2>
        <ol className="landing-steps">
          {landingSteps.map((item, index) => (
            <li
              key={item.step}
              className="landing-step reveal-hidden"
              data-reveal="scroll"
              style={revealDelayStyle(index * 90)}
            >
              <span className="landing-step__index" aria-hidden="true">
                {item.step}
              </span>
              <div className="stack-sm">
                <h3 className="font-display text-lg tracking-wide text-heading uppercase sm:text-xl">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-dim sm:text-base">
                  {item.copy}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Core Features */}
      <section className="landing-section" aria-labelledby="features-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index="02" title="Built for Serious Lifters" />
          <h2
            id="features-heading"
            className="mb-[var(--space-section)] max-w-2xl font-display text-2xl tracking-wide text-heading uppercase sm:mb-[var(--space-section-lg)] sm:text-3xl"
          >
            Your Free AI Fitness Coach, Meal Plan & Macro Tracker
          </h2>
        </div>
        <div className="landing-benefits">
          {landingFeatures.map((feature, index) => (
            <article
              key={feature.title}
              className={`landing-benefit reveal-hidden ${accentBorder[feature.accent]}`}
              data-reveal="scroll"
              style={revealDelayStyle(index * 100)}
            >
              <p
                className={`text-xs font-semibold tracking-[0.14em] uppercase ${accentText[feature.accent]}`}
              >
                {feature.tag}
              </p>
              <h3 className="font-display text-xl tracking-wide text-heading uppercase">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-dim sm:text-base">
                {feature.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Risk Reversal */}
      <section className="landing-section" aria-labelledby="risk-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index="03" title="No Risk. All Reward." />
        </div>
        <div
          className="landing-risk-reversal reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(80)}
        >
          <h2
            id="risk-heading"
            className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-3xl"
          >
            {landingRiskReversal.headline}
          </h2>
          <p className="text-base leading-relaxed text-text sm:text-lg">
            {landingRiskReversal.copy}
          </p>
          <ul className="landing-risk-reversal__list">
            {landingRiskReversal.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" aria-labelledby="faq-heading">
        <div
          className="reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <SectionHead index="04" title="FAQ" />
          <h2 id="faq-heading" className="sr-only">
            Frequently asked questions about Armstrong AI fitness coach
          </h2>
        </div>
        <div className="landing-faq">
          {landingFaq.map((item, index) => (
            <details
              key={item.question}
              className="landing-faq__item reveal-hidden"
              data-reveal="scroll"
              style={revealDelayStyle(index * 70)}
            >
              <summary className="landing-faq__question">
                {item.question}
              </summary>
              <p className="landing-faq__answer">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="landing-footer-cta" aria-labelledby="footer-cta">
        <div
          className="landing-footer-cta__inner reveal-hidden"
          data-reveal="scroll"
          style={revealDelayStyle(0)}
        >
          <h2
            id="footer-cta"
            className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-4xl"
          >
            {landingFooterCta.headline}
          </h2>
          <p className="max-w-lg text-base text-dim sm:text-lg">
            {landingFooterCta.copy}
          </p>
          <DownloadButtons layout="grid" />
        </div>
      </section>

      <footer
        className="landing-footer reveal-hidden"
        data-reveal="scroll"
        style={revealDelayStyle(60)}
      >
        <p className="text-xs text-dim">
          © {new Date().getFullYear()} Armstrong. Free AI fitness coach for
          bodybuilders who train with intent.
        </p>
        <p className="mt-2 text-xs">
          <Link
            href="/blog/"
            className="text-dim underline decoration-cyan/40 underline-offset-2 transition-colors hover:text-cyan"
          >
            Training guides &amp; workout tips
          </Link>
        </p>
      </footer>
    </div>
  );
}
