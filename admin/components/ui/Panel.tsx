import { cn } from "@/lib/cn";

export function Panel({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("panel", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          {title && (
            <h2 className="font-heading text-sm uppercase tracking-wider text-heading">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
