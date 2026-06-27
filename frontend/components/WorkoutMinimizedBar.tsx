"use client";

import { useTranslation } from "react-i18next";
import { SessionTimer } from "@/components/SessionTimer";
import { cn } from "@/lib/cn";

interface WorkoutMinimizedBarProps {
  label: string;
  startedAt?: string;
  onExpand: () => void;
  className?: string;
}

export function WorkoutMinimizedBar({
  label,
  startedAt,
  onExpand,
  className,
}: WorkoutMinimizedBarProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={cn("workout-minimized-bar", className)}
      aria-label={t("workout.minimizedBarAria", { name: label })}
      onClick={onExpand}
    >
      <span className="workout-minimized-bar__label truncate">{label}</span>
      {startedAt ? <SessionTimer startedAt={startedAt} compact /> : null}
    </button>
  );
}
