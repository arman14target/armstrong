"use client";

import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import { personalRecords } from "@/lib/profileStats";
import type { WeightUnit } from "@/lib/types";
import { formatWeight } from "@/lib/weight";

export function ProfileDashboard() {
  const { data } = useGymStore();

  const unit: WeightUnit = data.weightUnit ?? "kg";
  const prs = personalRecords(data.workoutDayLog);

  return (
    <div className="stack-md">
      {prs.length > 0 && (
        <TerminalWindow title="Personal records">
          <ul className="stack-sm">
            {prs.slice(0, 8).map((pr, i) => (
              <li
                key={pr.exercise}
                className="flex items-center gap-3 rounded-cyber border border-line bg-bg/40 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    i === 0
                      ? "bg-primary/20 text-primary"
                      : i === 1
                        ? "bg-text/15 text-heading"
                        : i === 2
                          ? "bg-magenta/15 text-magenta"
                          : "bg-bg text-dim",
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-heading">
                  {pr.exercise}
                </span>
                <span className="shrink-0 text-right leading-tight">
                  <span className="block text-sm text-primary">
                    {formatWeight(pr.bestWeightKg, unit)}
                    <span className="text-xs text-dim"> × {pr.repsAtBest}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-dim">
                    1RM {formatWeight(pr.estimated1RmKg, unit)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </TerminalWindow>
      )}
    </div>
  );
}
