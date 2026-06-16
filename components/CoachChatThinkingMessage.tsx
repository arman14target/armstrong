"use client";

import { useEffect, useState } from "react";

const COACH_CHAT_THINKING = [
  "Reading our chat history...",
  "Checking what you just asked...",
  "Pulling context from earlier messages...",
  "Looking at your training split...",
  "Reviewing your push day...",
  "Reviewing your pull day...",
  "Reviewing your leg day...",
  "Scanning your custom workout days...",
  "Checking exercises on your plan...",
  "Reading your saved sets and rest times...",
  "Pulling up your workout log...",
  "Checking which days you trained recently...",
  "Looking at your recent sessions...",
  "Cross-referencing your question with your plan...",
  "Seeing if this affects a specific training day...",
  "Checking which exercise to swap...",
  "Reading your food log...",
  "Checking what you logged today...",
  "Comparing your meals to your macro targets...",
  "Looking at your daily calorie target...",
  "Checking your protein goal...",
  "Reviewing your carbs and fats...",
  "Reading your nutrition profile...",
  "Checking your weight and body stats...",
  "Looking at your bulk or cut goal...",
  "Matching your stats to your question...",
  "Checking your height, age, and activity level...",
  "Connecting training and nutrition context...",
  "Making sure this fits your current split...",
  "Double-checking your plan before I reply...",
  "Almost ready...",
] as const;

function pickRandomMessage(current: string | null): string {
  if (COACH_CHAT_THINKING.length === 1) {
    return COACH_CHAT_THINKING[0];
  }

  let next = COACH_CHAT_THINKING[Math.floor(Math.random() * COACH_CHAT_THINKING.length)];
  while (next === current) {
    next = COACH_CHAT_THINKING[Math.floor(Math.random() * COACH_CHAT_THINKING.length)];
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
  const [message, setMessage] = useState(() => pickRandomMessage(null));

  useEffect(() => {
    if (!active) {
      setMessage(pickRandomMessage(null));
      return;
    }

    setMessage(pickRandomMessage(null));

    const id = window.setInterval(() => {
      setMessage((current) => pickRandomMessage(current));
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [active, intervalMs]);

  if (!active) {
    return null;
  }

  return (
    <div className="flex justify-start" aria-live="polite" aria-busy="true">
      <div className="min-w-[min(100%,16rem)] rounded-cyber border border-green/30 bg-green/5 px-3 py-2 sm:min-w-[18rem]">
        <p className="text-[10px] tracking-wide text-dim uppercase">Coach</p>
        <p
          key={message}
          className="coach-status-message mt-1 text-sm leading-relaxed text-green"
        >
          {message}
        </p>
      </div>
    </div>
  );
}
