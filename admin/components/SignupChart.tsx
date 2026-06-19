"use client";

// Lightweight, dependency-free bar chart for the 14-day signup window.
export function SignupChart({
  data,
}: {
  data: { day: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-40 items-end gap-1.5">
      {data.map((d) => {
        const pct = (d.count / max) * 100;
        const label = new Date(d.day).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        return (
          <div
            key={d.day}
            className="group flex flex-1 flex-col items-center justify-end gap-1"
            title={`${label}: ${d.count} signup${d.count === 1 ? "" : "s"}`}
          >
            <span className="text-[10px] text-dim opacity-0 transition-opacity group-hover:opacity-100">
              {d.count}
            </span>
            <div
              className="w-full rounded-t-[3px] bg-primary/80 transition-all group-hover:bg-primary"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
            <span className="text-[9px] text-dim">{label.split(" ")[1]}</span>
          </div>
        );
      })}
    </div>
  );
}
