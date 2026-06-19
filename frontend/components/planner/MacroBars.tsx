"use client";

import { cn } from "@/lib/cn";

interface MacroBarItem {
  label: string;
  value: number;
  max: number;
  unit: string;
  accent: "cyan" | "green" | "magenta";
}

interface MacroBarsProps {
  items: MacroBarItem[];
  className?: string;
  animate?: boolean;
}

const accentClass: Record<MacroBarItem["accent"], string> = {
  cyan: "planner-macro__fill--cyan",
  green: "planner-macro__fill--green",
  magenta: "planner-macro__fill--magenta",
};

export function MacroBars({ items, className, animate = false }: MacroBarsProps) {
  return (
    <div className={cn("planner-macro-grid", className)}>
      {items.map((item) => {
        const pct = Math.min(100, (item.value / item.max) * 100);
        return (
          <div key={item.label} className="planner-macro">
            <div className="planner-macro__head">
              <span className="planner-macro__label">{item.label}</span>
              <span className="planner-macro__value">
                {item.value}
                <span className="planner-macro__unit">{item.unit}</span>
              </span>
            </div>
            <div className="planner-macro__track" aria-hidden>
              <div
                className={cn(
                  "planner-macro__fill",
                  accentClass[item.accent],
                  animate && "planner-macro__fill--animate",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
