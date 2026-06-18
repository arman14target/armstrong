"use client";

import { PlusIcon } from "@/components/icons/ActionIcons";
import { cn } from "@/lib/cn";

interface AddDayButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddDayButton({ onClick, className }: AddDayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative block w-full overflow-hidden rounded-panel border border-dim/25 bg-panel/50 p-[var(--space-card)] text-left transition-all duration-250 hover:border-dim hover:bg-panel/70 hover:-translate-y-1",
        className,
      )}
    >
      <div className="flex items-center gap-[var(--space-gap-md)]">
        <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-bg/40 text-dim transition-transform duration-250 group-hover:scale-110 group-hover:text-heading">
          <PlusIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-base font-semibold tracking-wide text-dim group-hover:text-heading">
            Add Day
          </p>
          <p className="text-xs text-dim/80">
            Create a new workout split
          </p>
        </div>
      </div>
    </button>
  );
}
