"use client";

import { useRouter } from "next/navigation";
import { CyberButton } from "@/components/ui/CyberButton";
import { cn } from "@/lib/cn";
import { APP_ROUTE } from "@/lib/routes";

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
  const router = useRouter();

  const handleFinish = () => {
    if (!hasCompletedSets) {
      const confirmed = window.confirm(
        "No sets completed yet. Finish the day anyway?",
      );
      if (!confirmed) {
        return;
      }
    }
    onFinish();
    router.push(APP_ROUTE);
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
      {compact ? "Finish" : "Finish workout"}
    </CyberButton>
  );
}

export function CancelWorkoutButton({
  onCancel,
  hasCompletedSets,
  className,
}: Omit<WorkoutActionButtonProps, "onFinish">) {
  const router = useRouter();

  const handleCancel = () => {
    const confirmed = window.confirm(
      hasCompletedSets
        ? "Cancel this workout? All progress from this session will be lost."
        : "Cancel this workout?",
    );
    if (!confirmed) {
      return;
    }
    onCancel();
    router.push(APP_ROUTE);
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
      Cancel workout
    </CyberButton>
  );
}
