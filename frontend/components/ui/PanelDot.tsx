import { cn } from "@/lib/cn";

type PanelDotVariant = "default" | "green";

interface PanelDotProps {
  variant?: PanelDotVariant;
}

const variantStyles: Record<PanelDotVariant, string> = {
  default: "bg-white",
  green: "bg-green",
};

export function PanelDot({ variant = "default" }: PanelDotProps) {
  return (
    <span
      aria-hidden
      className={cn("size-[11px] shrink-0 rounded-full", variantStyles[variant])}
    />
  );
}
