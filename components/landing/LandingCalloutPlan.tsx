const planDays = [
  {
    label: "Push",
    accent: "cyan" as const,
    detail: "Bench · OHP · Fly",
  },
  {
    label: "Pull",
    accent: "magenta" as const,
    detail: "Rows · Pulldown · Curl",
  },
  {
    label: "Legs",
    accent: "green" as const,
    detail: "Squat · RDL · Curl",
  },
] as const;

const dietMeals = [
  { label: "Chicken & rice", accent: "amber" as const },
  { label: "Oats & whey shake", accent: "amber" as const },
  { label: "Ground beef & sweet potato", accent: "amber" as const },
] as const;

export function LandingCalloutPlan() {
  return (
    <div className="landing-callout-plan">
      <p className="landing-callout-plan__goal">
        &ldquo;I want to gain weight&rdquo;
      </p>

      <section className="landing-callout-plan__section">
        <div className="landing-callout-plan__head">
          <span className="landing-callout-plan__label">Your plan</span>
          <span className="landing-callout-plan__badge">3 days</span>
        </div>

        <ul className="landing-callout-plan__list">
          {planDays.map((day) => (
            <li
              key={day.label}
              className={`landing-callout-plan__item landing-callout-plan__item--${day.accent}`}
            >
              <span className="landing-callout-plan__item-label">{day.label}</span>
              <span className="landing-callout-plan__item-detail">{day.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-callout-plan__section">
        <div className="landing-callout-plan__head">
          <span className="landing-callout-plan__label landing-callout-plan__label--diet">
            Your diet
          </span>
          <span className="landing-callout-plan__badge landing-callout-plan__badge--diet">
            3,200 kcal
          </span>
        </div>

        <ul className="landing-callout-plan__list">
          {dietMeals.map((meal) => (
            <li
              key={meal.label}
              className={`landing-callout-plan__item landing-callout-plan__item--${meal.accent}`}
            >
              <span className="landing-callout-plan__item-label">{meal.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
