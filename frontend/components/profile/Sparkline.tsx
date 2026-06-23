"use client";

import { useId } from "react";

interface SparklineProps {
  values: number[];
  /** Optional horizontal reference line (e.g. a target weight), in value units. */
  target?: number;
  className?: string;
  height?: number;
}

/**
 * Dependency-free SVG area chart: gold line over a fading gradient fill, with a
 * dashed orange target line, a faint origin dot, and an emphasized latest dot.
 * Scales the series (and target) to fit a 100×height viewBox.
 */
export function Sparkline({
  values,
  target,
  className,
  height = 104,
}: SparklineProps) {
  const gradientId = useId();
  if (values.length === 0) {
    return null;
  }

  const width = 100;
  const padX = 3;
  const padY = 12;
  const candidates = target !== undefined ? [...values, target] : values;
  const min = Math.min(...candidates);
  const max = Math.max(...candidates);
  const span = max - min || 1;

  const x = (i: number) =>
    values.length === 1
      ? width / 2
      : padX + (i / (values.length - 1)) * (width - padX * 2);
  const y = (v: number) => padY + (1 - (v - min) / span) * (height - padY * 2);

  const pts = values.map((v, i) => [x(i), y(v)] as const);
  const linePath = pts.map(([px, py]) => `${px},${py}`).join(" ");
  const areaPath = `M ${pts[0][0]},${height} L ${linePath
    .split(" ")
    .join(" L ")} L ${pts[pts.length - 1][0]},${height} Z`;
  const [firstX, firstY] = pts[0];
  const [lastX, lastY] = pts[pts.length - 1];
  const targetY = target !== undefined ? y(target) : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-label="Body weight trend"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {targetY !== null && (
        <line
          x1="0"
          x2={width}
          y1={targetY}
          y2={targetY}
          stroke="var(--color-secondary)"
          strokeWidth="1"
          strokeDasharray="3 2.5"
          opacity="0.8"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {values.length > 1 && (
        <>
          <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
          <polyline
            points={linePath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}

      <circle cx={firstX} cy={firstY} r="2.5" fill="var(--color-dim)" />
      <circle
        cx={lastX}
        cy={lastY}
        r="3.5"
        fill="var(--color-primary)"
        stroke="var(--color-background)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
