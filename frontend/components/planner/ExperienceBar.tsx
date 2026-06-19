"use client";

import {
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  type ExperienceLevel,
  experienceBarPercent,
  indexToExperience,
} from "@/lib/planner/experience";
import { cn } from "@/lib/cn";

interface ExperienceBarProps {
  value: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
  className?: string;
}

export function ExperienceBar({ value, onChange, className }: ExperienceBarProps) {
  const index = EXPERIENCE_LEVELS.indexOf(value);
  const fill = experienceBarPercent(value);

  return (
    <div className={cn("planner-xp", className)}>
      <div className="planner-xp__header">
        <span className="planner-xp__label">Experience</span>
        <span className="planner-xp__value">{EXPERIENCE_LABELS[value]}</span>
      </div>

      <div className="planner-xp__track-wrap">
        <div className="planner-xp__track" aria-hidden>
          <div className="planner-xp__fill" style={{ width: `${fill}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={index}
          onChange={(e) => onChange(indexToExperience(Number(e.target.value)))}
          className="planner-xp__slider"
          aria-label="Experience level from amateur to pro"
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={index}
          aria-valuetext={EXPERIENCE_LABELS[value]}
        />
      </div>

      <div className="planner-xp__ticks" aria-hidden>
        {EXPERIENCE_LEVELS.map((level) => (
          <span
            key={level}
            className={cn("planner-xp__tick", value === level && "planner-xp__tick--active")}
          >
            {EXPERIENCE_LABELS[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
