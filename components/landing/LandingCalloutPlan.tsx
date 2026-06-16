import { CheckIcon } from "@/components/icons/ActionIcons";
import { PanelDot } from "@/components/ui/PanelDot";

const planDays = [
  {
    label: "Push",
    accent: "cyan" as const,
    exercises: ["Bench", "OHP", "Fly"],
  },
  {
    label: "Pull",
    accent: "magenta" as const,
    exercises: ["Rows", "Pulldown", "Curl"],
  },
  {
    label: "Legs",
    accent: "green" as const,
    exercises: ["Squat", "RDL", "Curl"],
  },
] as const;

function PlanArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="landing-callout-plan__arrow-icon"
      aria-hidden
    >
      <path d="M12 5v12M7 12l5 5 5-5" />
    </svg>
  );
}

export function LandingCalloutPlan() {
  return (
    <div className="landing-callout-plan">
      <div className="landing-callout-plan__prompt">
        <span className="landing-callout-plan__cursor" aria-hidden />
        <span className="landing-callout-plan__input">i wana gain weight</span>
      </div>

      <div className="landing-callout-plan__flow" aria-hidden>
        <span className="landing-callout-plan__flow-dot" />
        <PlanArrowIcon />
      </div>

      <div className="landing-callout-plan__app">
        <div className="landing-callout-plan__app-header">
          <PanelDot variant="green" />
          <span>Your plan</span>
        </div>

        <ul className="landing-callout-plan__days">
          {planDays.map((day) => (
            <li
              key={day.label}
              className={`landing-callout-plan__day landing-callout-plan__day--${day.accent}`}
            >
              <span className="landing-callout-plan__day-label">{day.label}</span>
              <span className="landing-callout-plan__day-exercises">
                {day.exercises.map((exercise) => (
                  <span key={exercise} className="landing-callout-plan__exercise">
                    {exercise}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="landing-callout-plan__caption">
        One sentence → full plan you follow in the app
      </p>

      <div className="landing-callout-plan__ready">
        <span className="landing-callout-plan__ready-icon" aria-hidden>
          <CheckIcon />
        </span>
        <span className="landing-callout-plan__ready-label">Follow in app</span>
      </div>
    </div>
  );
}
