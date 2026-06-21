"use client";

import { useEffect, useMemo, useState } from "react";
import type { GoalTimelineEstimate } from "@/lib/planner/goalTimeline";

interface GoalTimelineChartProps {
  estimate: GoalTimelineEstimate;
}

function buildWavyPoints(weeks: number, samples = 56): Array<[number, number]> {
  const startX = 24;
  const endX = 276;
  const baseY = 108;
  const topY = 34;
  const minY = topY + 4;
  const maxY = baseY - 2;
  const height = baseY - topY;

  return Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const x = startX + progress * (endX - startX);
    const trend = 1 - (1 - progress) ** 1.25;
    const waveFade = Math.min(1, progress / 0.14);
    const waveAmplitude = 9 * (1 - progress * 0.72) * waveFade;
    const wave =
      Math.sin(progress * Math.PI * 6.2) * waveAmplitude +
      Math.sin(progress * Math.PI * 2.4 + 0.6) * (waveAmplitude * 0.35);

    if (index === 0) {
      return [x, baseY] as [number, number];
    }

    const y = Math.min(maxY, Math.max(minY, baseY - trend * height + wave));
    return [x, y] as [number, number];
  });
}

function pointsToPath(points: Array<[number, number]>): string {
  if (points.length === 0) {
    return "";
  }

  const [firstX, firstY] = points[0];
  let path = `M ${firstX.toFixed(1)} ${firstY.toFixed(1)}`;

  for (let index = 1; index < points.length; index += 1) {
    const [x, y] = points[index];
    const [prevX, prevY] = points[index - 1];
    const midX = (prevX + x) / 2;
    const midY = (prevY + y) / 2;
    path += ` Q ${prevX.toFixed(1)} ${prevY.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }

  const [lastX, lastY] = points[points.length - 1];
  path += ` T ${lastX.toFixed(1)} ${lastY.toFixed(1)}`;
  return path;
}

export function GoalTimelineChart({ estimate }: GoalTimelineChartProps) {
  const [animate, setAnimate] = useState(false);

  const { linePath, fillPath, end } = useMemo(() => {
    const points = buildWavyPoints(estimate.weeks);
    const line = pointsToPath(points);
    const last = points[points.length - 1] ?? [276, 34];
    const fill = `${line} L ${last[0].toFixed(1)} 108 L 24 108 Z`;
    return {
      linePath: line,
      fillPath: fill,
      end: last,
    };
  }, [estimate.weeks]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, [estimate.weeks]);

  return (
    <div className="welcome-timeline">
      <svg
        className="welcome-timeline__chart"
        viewBox="0 0 300 120"
        role="img"
        aria-label={`Projected progress over ${estimate.weeks} weeks`}
      >
        <defs>
          <linearGradient id="welcome-timeline-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.15" />
            <stop offset="55%" stopColor="var(--color-cyan)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#e8a84a" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <line x1="24" y1="108" x2="276" y2="108" className="welcome-timeline__axis" />
        <line x1="24" y1="108" x2="24" y2="28" className="welcome-timeline__axis" />

        <path
          d={fillPath}
          className="welcome-timeline__fill"
          style={{ opacity: animate ? 1 : 0, transition: "opacity 1.6s ease" }}
        />

        <path
          d={linePath}
          className="welcome-timeline__line"
          style={{
            strokeDashoffset: animate ? 0 : 420,
            transition: "stroke-dashoffset 2.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        <circle
          cx={end[0]}
          cy={end[1]}
          r="5"
          className="welcome-timeline__dot"
          style={{
            opacity: animate ? 1 : 0,
            transform: animate ? "scale(1)" : "scale(0)",
            transformOrigin: `${end[0]}px ${end[1]}px`,
            transition: "opacity 0.45s ease 1.85s, transform 0.45s ease 1.85s",
          }}
        />

        <text x="24" y="118" className="welcome-timeline__label">
          Today
        </text>
        <text x="276" y="118" textAnchor="end" className="welcome-timeline__label">
          Week {estimate.weeks}
        </text>
      </svg>
    </div>
  );
}
