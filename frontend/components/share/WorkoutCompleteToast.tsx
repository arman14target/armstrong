"use client";

import { useTranslation } from "react-i18next";
import { useGymStore } from "@/hooks/useGymStore";
import { ShareWorkoutButton } from "@/components/share/ShareWorkoutButton";
import { IconButton } from "@/components/ui/IconButton";

/**
 * Non-blocking prompt shown on home after finishing a workout, offering to
 * share a summary card. Dismissible; never gates the completion flow.
 * Reads the transient `lastFinishedSummary` from the store.
 */
export function WorkoutCompleteToast() {
  const { t } = useTranslation();
  const { lastFinishedSummary, clearFinishedSummary } = useGymStore();

  if (!lastFinishedSummary) {
    return null;
  }

  const { workoutName, heroStat, totalSets } = lastFinishedSummary;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(var(--space-page-bottom-footer)+12px)] z-50 mx-auto flex max-w-md items-center gap-3 rounded-panel border border-cyan/35 bg-panel px-4 py-3 shadow-[var(--shadow-modal)] backdrop-blur"
      role="status"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-heading">
          {t("share.logged", { workoutName })}
        </p>
        <p className="truncate text-xs text-dim">
          {t("share.sets", { heroStat: heroStat.value, count: totalSets })}
        </p>
      </div>
      <ShareWorkoutButton
        summary={lastFinishedSummary}
        onShared={clearFinishedSummary}
        className="shrink-0"
      />
      <IconButton
        label={t("share.dismiss")}
        variant="ghost"
        onClick={clearFinishedSummary}
        className="shrink-0"
      >
        ✕
      </IconButton>
    </div>
  );
}
