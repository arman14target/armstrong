"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CoachIcon } from "@/components/icons/ActionIcons";

const THINKING_MESSAGE_COUNT = 31;

function pickRandomMessage(messages: string[], current: string | null): string {
  let next = messages[Math.floor(Math.random() * messages.length)];
  while (next === current) {
    next = messages[Math.floor(Math.random() * messages.length)];
  }

  return next;
}

interface CoachChatThinkingMessageProps {
  active: boolean;
  intervalMs?: number;
}

export function CoachChatThinkingMessage({
  active,
  intervalMs = 2800,
}: CoachChatThinkingMessageProps) {
  const { t } = useTranslation();
  const messages = useMemo(
    () =>
      Array.from({ length: THINKING_MESSAGE_COUNT }, (_, index) =>
        t(`coach.thinking.home.${index}`),
      ),
    [t],
  );
  const [message, setMessage] = useState(() => pickRandomMessage(messages, null));

  useEffect(() => {
    if (!active) {
      setMessage(pickRandomMessage(messages, null));
      return;
    }

    setMessage(pickRandomMessage(messages, null));

    const id = window.setInterval(() => {
      setMessage((current) => pickRandomMessage(messages, current));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, intervalMs, messages]);

  if (!active) {
    return null;
  }

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
        <p key={message} className="onboarding-coach-status__text coach-status-message">
          {message}
        </p>
      </div>
    </div>
  );
}
