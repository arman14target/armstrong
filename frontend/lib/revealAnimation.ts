import type { CSSProperties } from "react";

export const REVEAL_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
export const REVEAL_THRESHOLD = 0.1;
export const REVEAL_OFFSET = "1.25rem";
export const REVEAL_DURATION_MS = 650;

export function revealDelayStyle(delayMs: number): CSSProperties {
  return { "--reveal-delay": `${delayMs}ms` } as CSSProperties;
}
