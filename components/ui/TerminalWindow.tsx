import { cn } from "@/lib/cn";
import { PanelDot } from "@/components/ui/PanelDot";

interface TerminalWindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function TerminalWindow({
  title,
  children,
  className,
  bodyClassName,
}: TerminalWindowProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-panel border border-line bg-panel backdrop-blur-[10px] shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      <div className="panel-header">
        <PanelDot />
        <span className="ml-[var(--space-inline)] tracking-wide">{title}</span>
      </div>
      <div className={cn("panel-body", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}
