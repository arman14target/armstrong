"use client";

import { cn } from "@/lib/cn";
import { useTheme } from "@/components/ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-cyber border border-line bg-panel/80 p-1 backdrop-blur-[10px]",
        className,
      )}
      role="group"
      aria-label="Color theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        className={cn(
          "min-h-9 rounded-[2px] px-[var(--space-inline)] text-[11px] tracking-[1.5px] uppercase transition-colors",
          !isDark ? "bg-cyan/15 text-cyan" : "text-dim hover:text-text",
        )}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        className={cn(
          "min-h-9 rounded-[2px] px-[var(--space-inline)] text-[11px] tracking-[1.5px] uppercase transition-colors",
          isDark ? "bg-magenta/15 text-magenta" : "text-dim hover:text-text",
        )}
      >
        Dark
      </button>
    </div>
  );
}
