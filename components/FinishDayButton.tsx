"use client";

import { useRouter } from "next/navigation";

interface FinishDayButtonProps {
  onFinish: () => void;
  hasCompletedSets: boolean;
}

export function FinishDayButton({
  onFinish,
  hasCompletedSets,
}: FinishDayButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!hasCompletedSets) {
      const confirmed = window.confirm(
        "No sets completed yet. Finish the day anyway?",
      );
      if (!confirmed) {
        return;
      }
    }
    onFinish();
    router.push("/");
  };

  return (
    <button
      type="button"
      className="cyber-btn cyber-btn--green w-full min-h-12 rounded-cyber text-sm tracking-wide"
      onClick={handleClick}
    >
      Finish workout
    </button>
  );
}
