import Link from "next/link";
import { DownloadButtons } from "@/components/landing/DownloadButtons";
import { LandingHeroCTA } from "@/components/landing/LandingHeroCTA";
import { LandingHeroVisual } from "@/components/landing/LandingHeroVisual";
import { SectionHead } from "@/components/ui/SectionHead";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

const benefits = [
  {
    title: "Exercise Saver",
    tag: "Effortless logging",
    copy: "Log sets in seconds while you rest. Armstrong captures every rep automatically — no notebook, no typing between sets.",
    accent: "cyan" as const,
  },
  {
    title: "AI Personal Coach",
    tag: "Real-time optimization",
    copy: "Get smart suggestions on weight, volume, and rest based on your actual performance — not generic templates.",
    accent: "magenta" as const,
  },
  {
    title: "Workout History",
    tag: "Unbroken progress",
    copy: "Every session saved. Every PR tracked. See your gains stack up with streaks that never break.",
    accent: "green" as const,
  },
];

const steps = [
  {
    step: "01",
    title: "Open Armstrong",
    copy: "Pick your day, load your exercises, and step onto the floor ready to work.",
  },
  {
    step: "02",
    title: "Do Your Workout",
    copy: "Lift. Armstrong saves every set, weight, and rest timer in the background.",
  },
  {
    step: "03",
    title: "View Your AI Insights",
    copy: "Review your history, spot trends, and get AI-driven recommendations for your next session.",
  },
];

const accentBorder: Record<(typeof benefits)[number]["accent"], string> = {
  cyan: "border-cyan/30 hover:border-cyan/60",
  magenta: "border-magenta/30 hover:border-magenta/60",
  green: "border-green/30 hover:border-green/60",
};

const accentText: Record<(typeof benefits)[number]["accent"], string> = {
  cyan: "text-cyan",
  magenta: "text-magenta",
  green: "text-green",
};

export function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-nav">
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
              <span className="landing-kicker__badge">Free</span>
              AI-Powered Fitness
            </p>
            <h1
              id="landing-headline"
              className="max-w-3xl font-display text-[clamp(2rem,8vw,4.5rem)] font-black tracking-[2px] text-heading sm:tracking-[4px]"
            >
              Start Growing.
            </h1>
            <p className="landing-subhead max-w-2xl">
              Describe your goal in one sentence and get a free full workout
              plan with a calendar to track every session — plus your last PRs,
              streaks, and AI coaching built in.
            </p>
            <LandingHeroCTA className="mt-2" />
          </div>
          <LandingHeroVisual className="landing-hero__visual" />
        </div>
      </section>

      <section className="landing-section" aria-labelledby="problem-heading">
          <SectionHead index="01" title="The Problem" />
          <div className="landing-split">
            <TerminalWindow title="manual_log.txt" dotVariant="green">
              <div className="stack-sm font-mono text-sm leading-relaxed text-dim">
                <p>
                  <span className="text-magenta">&gt;</span> Bench 135×8... or
                  was it 145?
                </p>
                <p>
                  <span className="text-magenta">&gt;</span> Notes app buried
                  under grocery lists
                </p>
                <p>
                  <span className="text-magenta">&gt;</span> Notebook pages
                  ripped, smudged, lost
                </p>
                <p>
                  <span className="text-magenta">&gt;</span> Can&apos;t tell if
                  you&apos;re actually progressing
                </p>
                <p className="text-amber">
                  <span className="text-magenta">&gt;</span> ERROR: progress
                  data corrupted
                </p>
              </div>
            </TerminalWindow>
            <div className="stack-md">
              <h3
                id="problem-heading"
                className="font-display text-2xl tracking-wide text-heading uppercase sm:text-3xl"
              >
                Manual tracking kills momentum.
              </h3>
              <p className="text-base leading-relaxed text-text sm:text-lg">
                You didn&apos;t come to the gym to be a data entry clerk.
                Scattered notes, forgotten weights, and broken streaks mean
                you&apos;re flying blind — guessing instead of growing.
              </p>
              <p className="text-base leading-relaxed text-dim">
                Every missed log is a lost PR. Every forgotten set is progress
                you can&apos;t measure. That ends now.
              </p>
            </div>
          </div>
        </section>

      <section className="landing-section" aria-labelledby="solution-heading">
          <SectionHead index="02" title="The Big 3" />
          <h3 id="solution-heading" className="sr-only">
            Core benefits
          </h3>
          <div className="landing-benefits">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className={`landing-benefit ${accentBorder[benefit.accent]}`}
              >
                <p
                  className={`text-xs font-semibold tracking-[0.14em] uppercase ${accentText[benefit.accent]}`}
                >
                  {benefit.tag}
                </p>
                <h4 className="font-display text-xl tracking-wide text-heading uppercase">
                  {benefit.title}
                </h4>
                <p className="text-sm leading-relaxed text-dim sm:text-base">
                  {benefit.copy}
                </p>
              </article>
            ))}
          </div>
        </section>

      <section className="landing-section" aria-labelledby="how-heading">
          <SectionHead index="03" title="How It Works" />
          <h3 id="how-heading" className="sr-only">
            Three-step walkthrough
          </h3>
          <ol className="landing-steps">
            {steps.map((item) => (
              <li key={item.step} className="landing-step">
                <span className="landing-step__index">{item.step}</span>
                <div className="stack-sm">
                  <h4 className="font-display text-lg tracking-wide text-heading uppercase sm:text-xl">
                    {item.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-dim sm:text-base">
                    {item.copy}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

      <section className="landing-footer-cta" aria-labelledby="footer-cta">
          <div className="landing-footer-cta__inner">
            <h2
              id="footer-cta"
              className="font-display text-2xl tracking-[2px] text-heading uppercase sm:text-4xl"
            >
              Ready to train smarter?
            </h2>
            <p className="max-w-lg text-base text-dim sm:text-lg">
              Download Armstrong and let your AI coach handle the rest.
            </p>
            <DownloadButtons layout="grid" />
          </div>
        </section>

      <footer className="landing-footer">
        <p className="text-xs text-dim">
          © {new Date().getFullYear()} Armstrong. Built for lifters who hate
          spreadsheets.
        </p>
      </footer>
    </div>
  );
}
