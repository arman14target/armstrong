import { cn } from "@/lib/cn";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** Mini month grid — completed workout days highlighted. */
const calendarDays: Array<{ day: number | null; done?: boolean; today?: boolean }> = [
  { day: null },
  { day: null },
  { day: 1 },
  { day: 2 },
  { day: 3, done: true },
  { day: 4 },
  { day: 5, done: true },
  { day: 6 },
  { day: 7, done: true },
  { day: 8 },
  { day: 9 },
  { day: 10, done: true },
  { day: 11 },
  { day: 12, done: true },
  { day: 13 },
  { day: 14, done: true },
  { day: 15 },
  { day: 16, done: true, today: true },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
];

export function LandingCalloutCalendar() {
  return (
    <div className="landing-callout-calendar">
      <div className="landing-callout-calendar__head">
        <span className="landing-callout-calendar__month">Jun</span>
        <span className="landing-callout-calendar__streak">
          <span className="landing-callout-calendar__streak-dot" aria-hidden />
          7
        </span>
      </div>

      <div className="landing-callout-calendar__weekdays" aria-hidden>
        {weekdays.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>

      <div className="landing-callout-calendar__grid">
        {calendarDays.map((cell, index) =>
          cell.day === null ? (
            <span
              key={`empty-${index}`}
              className="landing-callout-calendar__cell landing-callout-calendar__cell--empty"
              aria-hidden
            />
          ) : (
            <span
              key={cell.day}
              className={cn(
                "landing-callout-calendar__cell",
                cell.done && "landing-callout-calendar__cell--done",
                cell.today && "landing-callout-calendar__cell--today",
              )}
            >
              {cell.day}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
