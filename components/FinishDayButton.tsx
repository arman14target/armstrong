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
      className="relative w-full min-h-12 overflow-hidden rounded-[3px] border border-magenta text-sm tracking-wide text-magenta transition-all before:absolute before:inset-0 before:z-0 before:-translate-x-full before:bg-magenta before:transition-transform before:duration-300 hover:text-heading hover:before:translate-x-0"
      onClick={handleClick}
    >
      <span className="relative z-10">Finish workout</span>
    </button>
  );
}
