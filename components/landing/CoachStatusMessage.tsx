"use client";

import { useEffect, useState } from "react";

const COACH_THINKING_EARLY = [
  "Reviewing your goal...",
  "Checking your age and weight...",
  "Understanding what you want to achieve...",
  "Matching training to your experience level...",
  "Figuring out how many days you can train...",
  "Considering recovery between sessions...",
  "Looking at what equipment you likely have...",
  "Sketching the right training split for you...",
  "Weighing strength vs. hypertrophy for your goal...",
  "Almost ready to start building your plan...",
] as const;

const COACH_THINKING_PLAN = [
  "Designing your weekly split...",
  "Picking exercises for each training day...",
  "Setting sets, reps, and rest times...",
  "Adjusting volume to your body stats...",
  "Balancing push, pull, and recovery...",
  "Ordering exercises from compound to isolation...",
  "Tuning intensity for your goal...",
  "Adding warm-up and working sets...",
  "Double-checking muscle group balance...",
  "Writing notes for each training day...",
  "Putting your full plan together...",
  "Polishing the details — almost there...",
] as const;

const COACH_IMPORTING = [
  "Reading your coach conversation...",
  "Extracting your training days...",
  "Loading exercises into your split...",
  "Assigning stickers and day colors...",
  "Calculating your daily macros...",
  "Setting up your food tracker...",
  "Mapping workouts to your calendar...",
  "Saving your profile...",
  "Preparing your dashboard...",
  "Finalizing your Armstrong plan...",
] as const;

interface CoachStatusMessageProps {
  active: boolean;
  phase: "thinking-early" | "thinking-plan" | "importing";
  intervalMs?: number;
}

function getMessages(phase: CoachStatusMessageProps["phase"]): readonly string[] {
  switch (phase) {
    case "thinking-early":
      return COACH_THINKING_EARLY;
    case "thinking-plan":
      return COACH_THINKING_PLAN;
    case "importing":
      return COACH_IMPORTING;
  }
}

export function CoachStatusMessage({
  active,
  phase,
  intervalMs = 3200,
}: CoachStatusMessageProps) {
  const messages = getMessages(phase);
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
    <div className="flex justify-start" aria-live="polite" aria-busy="true">
      <div className="min-w-[min(100%,18rem)] rounded-cyber border border-green/30 bg-green/5 px-4 py-3 sm:min-w-[20rem]">
        <p className="text-[10px] tracking-wide text-dim uppercase">Coach</p>
        <p
          key={`${phase}-${index}`}
          className="coach-status-message mt-1.5 text-sm leading-relaxed text-green sm:text-base"
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export function getCoachThinkingPhase(
  messageCount: number,
): "thinking-early" | "thinking-plan" {
  return messageCount <= 3 ? "thinking-early" : "thinking-plan";
}
