"use client";

import { useEffect, useState } from "react";
import { CoachIcon } from "@/components/icons/ActionIcons";

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

const COACH_THINKING_DIET = [
  "Calculating your protein target...",
  "Planning breakfast around your goal...",
  "Building a simple lunch...",
  "Adding dinner and snacks...",
  "Spreading protein across the day...",
  "Keeping meals easy to prep...",
  "Checking total daily macros...",
  "Adjusting for allergies if needed...",
  "Balancing calories with your goal...",
  "Finalizing your meal plan...",
] as const;

const COACH_IMPORTING = [
  "Reading your coach conversation...",
  "Extracting your training days...",
  "Loading exercises into your split...",
  "Assigning stickers and day colors...",
  "Calculating your daily macros...",
  "Importing your meal plan...",
  "Setting up your food tracker...",
  "Mapping workouts to your calendar...",
  "Saving your profile...",
  "Preparing your dashboard...",
  "Finalizing your Armstrong plan...",
] as const;

interface CoachStatusMessageProps {
  active: boolean;
  phase: "thinking-early" | "thinking-plan" | "thinking-diet" | "importing";
  intervalMs?: number;
}

function getMessages(phase: CoachStatusMessageProps["phase"]): readonly string[] {
  switch (phase) {
    case "thinking-early":
      return COACH_THINKING_EARLY;
    case "thinking-plan":
      return COACH_THINKING_PLAN;
    case "thinking-diet":
      return COACH_THINKING_DIET;
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
    <div
      className="onboarding-coach-status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="onboarding-coach-message__avatar" aria-hidden>
        <CoachIcon />
      </span>
      <div className="onboarding-coach-status__bubble">
        <p className="onboarding-coach-status__label">Coach is thinking</p>
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
