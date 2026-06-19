import Link from "next/link";
import { cn } from "@/lib/cn";

const footerLinks = [
  { href: "/blog/", label: "Blog" },
  { href: "/diet-planner/", label: "Diet Planner" },
  { href: "/gym-planner/", label: "Gym Planner" },
  { href: "/app/", label: "App" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/terms/", label: "Terms" },
] as const;

type LandingFooterProps = React.ComponentPropsWithoutRef<"footer">;

export function LandingFooter({ className, ...props }: LandingFooterProps) {
  return (
    <footer className={cn("landing-footer", className)} {...props}>
      <nav aria-label="Footer navigation" className="landing-footer__nav">
        {footerLinks.map((link) => (
          <Link key={link.href} href={link.href} className="landing-footer__link">
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="landing-footer__copy">
        © {new Date().getFullYear()} Armstrong. Free AI fitness coach for
        bodybuilders who train with intent.
      </p>
    </footer>
  );
}
