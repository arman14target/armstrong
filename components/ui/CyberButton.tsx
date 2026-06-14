import Link from "next/link";
import { cn } from "@/lib/cn";

type CyberButtonVariant = "cyan" | "magenta" | "green";

const variantStyles: Record<CyberButtonVariant, string> = {
  cyan: "border-cyan text-cyan hover:text-heading before:bg-cyan",
  magenta:
    "border-magenta text-magenta hover:text-heading before:bg-magenta",
  green:
    "border-green text-green hover:text-heading before:bg-green",
};

interface CyberButtonBaseProps {
  children: React.ReactNode;
  variant?: CyberButtonVariant;
  className?: string;
}

type CyberButtonProps = CyberButtonBaseProps &
  (
    | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "className">)
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

const baseClass =
  "cyber-btn relative inline-flex items-center justify-center overflow-hidden rounded-cyber border text-sm tracking-wide transition-all duration-250 before:absolute before:inset-0 before:z-0 before:-translate-x-full before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:before:translate-x-0";

export function CyberButton({
  children,
  variant = "cyan",
  className,
  ...props
}: CyberButtonProps) {
  const classes = cn(baseClass, variantStyles[variant], className);

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} {...linkProps}>
        <span className="relative z-10">{children}</span>
      </Link>
    );
  }

  const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes} {...buttonProps}>
      <span className="relative z-10">{children}</span>
    </button>
  );
}
