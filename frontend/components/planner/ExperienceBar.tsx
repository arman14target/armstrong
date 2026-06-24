"use client";

import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  EXPERIENCE_LEVELS,
  type ExperienceLevel,
  experienceBarPercent,
  experienceToIndex,
  indexToExperience,
} from "@/lib/planner/experience";
import { cn } from "@/lib/cn";

interface ExperienceBarProps {
  value: ExperienceLevel;
  onChange: (level: ExperienceLevel) => void;
  className?: string;
}

function indexFromClientX(track: HTMLElement, clientX: number): number {
  const rect = track.getBoundingClientRect();
  if (rect.width <= 0) {
    return 0;
  }

  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return Math.round(ratio * (EXPERIENCE_LEVELS.length - 1));
}

export function ExperienceBar({ value, onChange, className }: ExperienceBarProps) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const index = experienceToIndex(value);
  const fill = experienceBarPercent(value);
  const label = t(`experience.labels.${value}`);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }

      onChange(indexToExperience(indexFromClientX(track, clientX)));
    },
    [onChange],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button > 0) {
      return;
    }

    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromClientX(event.clientX);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }

    event.preventDefault();
    updateFromClientX(event.clientX);
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={cn("planner-xp", className)}>
      <div className="planner-xp__header">
        <span className="planner-xp__label">{t("experience.label")}</span>
        <span className="planner-xp__value">{label}</span>
      </div>

      <div
        ref={trackRef}
        className="planner-xp__track-wrap"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="planner-xp__track" aria-hidden>
          <div className="planner-xp__fill" style={{ width: `${fill}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={index}
          onChange={(event) => onChange(indexToExperience(Number(event.target.value)))}
          onInput={(event) => onChange(indexToExperience(Number(event.currentTarget.value)))}
          className="planner-xp__slider"
          aria-label={t("experience.ariaLabel")}
          aria-valuemin={0}
          aria-valuemax={3}
          aria-valuenow={index}
          aria-valuetext={label}
        />
      </div>

      <div className="planner-xp__ticks" role="group" aria-label={t("experience.presetsAria")}>
        {EXPERIENCE_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            className={cn("planner-xp__tick", value === level && "planner-xp__tick--active")}
            onClick={() => onChange(level)}
            aria-pressed={value === level}
          >
            {t(`experience.labels.${level}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
