"use client";

import { useRouter } from "next/navigation";
import { CyberButton } from "@/components/ui/CyberButton";
import { APP_ROUTE } from "@/lib/routes";

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
    router.push(APP_ROUTE);
  };

  return (
    <CyberButton
      variant="green"
      className="w-full min-h-12 border-green bg-green/15"
      onClick={handleClick}
    >
      Finish workout
    </CyberButton>
  );
}
