import { cn } from "@/lib/cn";

interface WelcomeStrengthBackgroundProps {
  placement?: "footer" | "below";
}

export function WelcomeStrengthBackground({
  placement = "footer",
}: WelcomeStrengthBackgroundProps) {
  return (
    <div
      className={cn(
        "welcome-strength-bg",
        placement === "below" && "welcome-strength-bg--below",
      )}
      aria-hidden
    >
      <div className="welcome-strength-bg__anchor">
        <div className="welcome-strength-bg__glow" />
        <div className="welcome-strength-bg__rings">
          <span className="welcome-strength-bg__ring" />
          <span className="welcome-strength-bg__ring" />
          <span className="welcome-strength-bg__ring" />
        </div>
      </div>
    </div>
  );
}
