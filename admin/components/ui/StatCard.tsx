import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="panel p-4">
      <p className="text-[11px] uppercase tracking-wider text-dim">{label}</p>
      <p
        className={cn(
          "mt-1 font-heading text-3xl",
          accent ? "text-primary" : "text-heading",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-dim">{sub}</p>}
    </div>
  );
}
