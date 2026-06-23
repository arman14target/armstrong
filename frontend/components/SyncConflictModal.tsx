"use client";

import { useState } from "react";
import { CyberButton } from "@/components/ui/CyberButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { useGymStore } from "@/hooks/useGymStore";
import type { SyncConflictStrategy } from "@/lib/userPlanSync";

export function SyncConflictModal() {
  const { syncConflict, resolveDataConflict } = useGymStore();
  const [pending, setPending] = useState<SyncConflictStrategy | null>(null);

  if (!syncConflict) {
    return null;
  }

  const choose = async (strategy: SyncConflictStrategy) => {
    if (pending) {
      return;
    }
    setPending(strategy);
    try {
      await resolveDataConflict(strategy);
    } finally {
      setPending(null);
    }
  };

  const busy = pending !== null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-conflict-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-panel border border-cyan/35 bg-panel shadow-[var(--shadow-modal)]">
        <div className="panel-header justify-between">
          <div className="inline-flex min-w-0 items-center">
            <PanelDot />
            <span className="ml-[var(--space-inline)] tracking-wide text-cyan">
              Sync
            </span>
          </div>
        </div>

        <div className="modal-body">
          <h2
            id="sync-conflict-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            Keep your data from this device?
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            This device has workouts not yet in your account. What should we
            keep?
          </p>

          <div className="mt-[var(--space-gap-md)] stack-sm">
            <CyberButton
              variant="green"
              className="w-full"
              disabled={busy}
              onClick={() => choose("merge")}
            >
              {pending === "merge" ? "Combining…" : "Combine both (recommended)"}
            </CyberButton>
            <CyberButton
              variant="cyan"
              className="w-full"
              disabled={busy}
              onClick={() => choose("use-remote")}
            >
              {pending === "use-remote" ? "Updating…" : "Keep my account only"}
            </CyberButton>
            <CyberButton
              variant="red"
              className="w-full"
              disabled={busy}
              onClick={() => choose("use-local")}
            >
              {pending === "use-local" ? "Saving…" : "Keep this device only"}
            </CyberButton>
          </div>

          <p className="mt-[var(--space-gap)] text-[11px] leading-snug text-dim">
            Combine merges both. Keeping one side deletes the other.
          </p>
        </div>
      </div>
    </div>
  );
}
