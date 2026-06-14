import { cn } from "@/lib/cn";
import { PanelDot } from "@/components/ui/PanelDot";

interface TerminalWindowEditableTitle {
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
}

interface TerminalWindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerAction?: React.ReactNode;
  editableTitle?: TerminalWindowEditableTitle;
  collapsed?: boolean;
  dotVariant?: "default" | "green";
}

export function TerminalWindow({
  title,
  children,
  className,
  bodyClassName,
  headerAction,
  editableTitle,
  collapsed = false,
  dotVariant = "default",
}: TerminalWindowProps) {
  const showHeaderActions = Boolean(headerAction);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-panel border border-line bg-panel backdrop-blur-[10px] shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      <div
        className={cn(
          "panel-header transition-[border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          showHeaderActions && "justify-between gap-2",
          collapsed ? "border-b-transparent" : undefined,
        )}
      >
        <div className="inline-flex min-w-0 flex-1 items-center">
          <PanelDot variant={dotVariant} />
          {editableTitle?.editing ? (
            <input
              autoFocus
              className="cyber-input ml-[var(--space-inline)] min-h-8 min-w-0 flex-1 py-1 text-xs tracking-wide sm:text-sm"
              value={editableTitle.value}
              onChange={(event) => editableTitle.onChange(event.target.value)}
              onBlur={editableTitle.onEndEdit}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              aria-label="Exercise name"
            />
          ) : editableTitle ? (
            <button
              type="button"
              onClick={editableTitle.onStartEdit}
              className="ml-[var(--space-inline)] min-w-0 truncate text-left tracking-wide transition-colors hover:text-cyan"
            >
              {title}
            </button>
          ) : (
            <span className="ml-[var(--space-inline)] tracking-wide">{title}</span>
          )}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
      >
        <div
          className={cn(
            "min-h-0 overflow-hidden transition-opacity duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            collapsed ? "opacity-0" : "opacity-100",
          )}
        >
          <div className={cn("panel-body", bodyClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}
