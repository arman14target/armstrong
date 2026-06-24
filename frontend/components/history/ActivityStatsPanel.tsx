"use client";

import { useTranslation } from "react-i18next";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import { currentStreak, lifetimeStats } from "@/lib/profileStats";
import type { WeightUnit } from "@/lib/types";
import { formatWeight, kgToDisplay } from "@/lib/weight";

type Accent = "primary" | "green" | "magenta";

const accentText: Record<Accent, string> = {
  primary: "text-primary",
  green: "text-green",
  magenta: "text-magenta",
};

function StatTile({
  label,
  value,
  accent = "primary",
  glow,
}: {
  label: string;
  value: string;
  accent?: Accent;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-cyber border bg-bg/50 px-3 py-2.5 text-center",
        glow ? "border-primary/35 bg-primary/[0.06]" : "border-line",
      )}
    >
      <p
        className={cn(
          "font-display text-2xl leading-none tracking-wide",
          accentText[accent],
        )}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[10px] uppercase tracking-wide text-dim">
        {label}
      </p>
    </div>
  );
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.round(value));
}

export function ActivityStatsPanel() {
  const { t } = useTranslation();
  const { data } = useGymStore();
  const unit: WeightUnit = data.weightUnit ?? "kg";

  const streak = currentStreak(data.workoutCompletionDates);
  const stats = lifetimeStats(data.workoutDayLog, data.workoutCompletionDates);

  return (
    <TerminalWindow title={t("history.statsTitle")} dotVariant="green">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label={t("history.dayStreak")}
          value={streak > 0 ? `${streak}🔥` : "0"}
          accent="magenta"
          glow={streak > 0}
        />
        <StatTile
          label={t("history.thisWeek")}
          value={String(stats.workoutsThisWeek)}
          accent="green"
        />
        <StatTile label={t("history.workouts")} value={String(stats.totalWorkouts)} />
        <StatTile
          label={t("history.volumeUnit", { unit })}
          value={
            stats.totalVolumeKg > 0
              ? compactNumber(kgToDisplay(stats.totalVolumeKg, unit))
              : "—"
          }
        />
      </div>
    </TerminalWindow>
  );
}
