import { cn } from "@/lib/cn";

interface CustomDayIconProps {
  className?: string;
}

export function CustomDayIcon({ className }: CustomDayIconProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-12 items-center justify-center rounded-lg border border-line/70 bg-bg/40 text-2xl text-dim shadow-[2px_3px_0_var(--color-icon-shadow)]",
        className,
      )}
    >
      📋
    </span>
  );
}
