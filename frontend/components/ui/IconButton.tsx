import { cn } from "@/lib/cn";

type IconButtonVariant = "danger" | "cyan" | "green" | "ghost";

const variantStyles: Record<IconButtonVariant, string> = {
  danger:
    "border-red-500/40 text-red-400 hover:border-red-400 hover:bg-red-500/10 hover:text-red-300",
  cyan: "cyber-btn--cyan",
  green: "border-green bg-green/15 text-green",
  ghost:
    "border-line text-dim hover:border-green hover:text-green",
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: IconButtonVariant;
}

export function IconButton({
  label,
  variant = "ghost",
  className,
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-[3px] border transition-all",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
