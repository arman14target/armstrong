"use client";

import { cn } from "@/lib/cn";

type Variant = "primary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-accent hover:brightness-110 disabled:opacity-50",
  danger:
    "border border-error/50 text-error hover:bg-error/10 disabled:opacity-50",
  ghost:
    "border border-line text-dim hover:text-heading hover:border-primary/40 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-cyber)] px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
