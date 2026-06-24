"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CoachIcon } from "@/components/icons/ActionIcons";

const PHASE_COUNTS = {
  "thinking-early": 10,
  "thinking-plan": 12,
  "thinking-diet": 10,
  importing: 11,
} as const;

interface CoachStatusMessageProps {
  active: boolean;
  phase: "thinking-early" | "thinking-plan" | "thinking-diet" | "importing";
  intervalMs?: number;
}

function usePhaseMessages(phase: CoachStatusMessageProps["phase"]): string[] {
  const { t } = useTranslation();

  return useMemo(() => {
    const count = PHASE_COUNTS[phase];
    const prefixByPhase = {
      "thinking-early": "coach.thinking.early",
      "thinking-plan": "coach.thinking.plan",
      "thinking-diet": "coach.thinking.diet",
      importing: "coach.thinking.importing",
    } as const;

    return Array.from({ length: count }, (_, index) =>
      t(`${prefixByPhase[phase]}.${index}`),
    );
  }, [phase, t]);
}

export function CoachStatusMessage({
  active,
  phase,
  intervalMs = 3200,
}: CoachStatusMessageProps) {
  const { t } = useTranslation();
  const messages = usePhaseMessages(phase);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [phase]);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, intervalMs, messages.length]);

  if (!active) {
    return null;
  }

  const message = messages[index];

  return (
    <div
      className="onboarding-coach-status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="onboarding-coach-message__avatar" aria-hidden>
        <CoachIcon />
      </span>
      <div className="onboarding-coach-status__bubble">
        <p className="onboarding-coach-status__label">{t("coach.thinkingLabel")}</p>
        <p
          key={`${phase}-${index}`}
          className="onboarding-coach-status__text coach-status-message"
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export function getCoachThinkingPhase(
  messageCount: number,
): "thinking-early" | "thinking-plan" | "thinking-diet" {
  if (messageCount <= 3) {
    return "thinking-early";
  }

  if (messageCount <= 7) {
    return "thinking-plan";
  }

  return "thinking-diet";
}
