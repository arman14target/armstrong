import Link from "next/link";
import { cn } from "@/lib/cn";

type CyberButtonVariant = "cyan" | "magenta" | "green";

/** cyan = primary gold, magenta = secondary orange, green = success */
const variantStyles: Record<CyberButtonVariant, string> = {
  cyan: "cyber-btn--cyan",
  magenta: "cyber-btn--magenta",
  green: "cyber-btn--green",
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
  "cyber-btn relative inline-flex items-center justify-center rounded-cyber border text-sm tracking-wide";

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
        {children}
      </Link>
    );
  }

  const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
