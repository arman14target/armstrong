import { cn } from "@/lib/cn";

type Tone = "neutral" | "primary" | "success" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line text-dim",
  primary: "border-primary/40 text-primary",
  success: "border-success/40 text-success",
  danger: "border-error/40 text-error",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
