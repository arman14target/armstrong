"use client";

import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";
import { cn } from "@/lib/cn";

interface WorkoutActionButtonProps {
  onFinish?: () => void;
  onCancel: () => void;
  hasCompletedSets: boolean;
  className?: string;
}

export function FinishWorkoutButton({
  onFinish,
  hasCompletedSets,
  className,
  compact = false,
}: Omit<WorkoutActionButtonProps, "onCancel"> & {
  onFinish: () => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();

  const handleFinish = () => {
    if (!hasCompletedSets) {
      const confirmed = window.confirm(t("workout.finishNoSetsConfirm"));
      if (!confirmed) {
        return;
      }
    }
    onFinish();
  };

  return (
    <CyberButton
      variant="green"
      className={cn(
        "shrink-0 border-green bg-green/15 px-3 text-xs",
        compact ? "min-h-8" : "min-h-9",
        className,
      )}
      onClick={handleFinish}
    >
      {compact ? t("workout.finish") : t("workout.finishFull")}
    </CyberButton>
  );
}

export function CancelWorkoutButton({
  onCancel,
  hasCompletedSets,
  className,
}: Omit<WorkoutActionButtonProps, "onFinish">) {
  const { t } = useTranslation();

  const handleCancel = () => {
    const confirmed = window.confirm(
      hasCompletedSets
        ? t("workout.cancelWithProgressConfirm")
        : t("workout.cancelConfirm"),
    );
    if (!confirmed) {
      return;
    }
    onCancel();
  };

  return (
    <CyberButton
      variant="red"
      className={cn(
        "w-full min-h-12 border-red-500/40 bg-red-500/10",
        className,
      )}
      onClick={handleCancel}
    >
      {t("workout.cancelWorkout")}
    </CyberButton>
  );
}
