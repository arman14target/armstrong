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
        "group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-panel border border-dim/25 bg-panel/50 p-3 text-center transition-all duration-250 hover:border-dim hover:bg-panel/70 hover:-translate-y-1",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 px-1">
        <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-bg/40 text-dim transition-transform duration-250 group-hover:scale-110 group-hover:text-heading">
          <PlusIcon className="size-6" />
        </div>
        <p className="text-sm font-semibold leading-tight tracking-wide text-dim group-hover:text-heading">
          Add Day
        </p>
        <p className="text-[10px] leading-tight text-dim/80">
          New workout split
        </p>
      </div>
    </button>
  );
}
