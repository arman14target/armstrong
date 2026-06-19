"use client";

import { useEffect, useRef, useState } from "react";
import { RestTimer } from "@/components/RestTimer";
import { formatTime } from "@/hooks/useCountdown";

interface SetRestDividerProps {
  restSeconds: number;
  isActive: boolean;
  restEndsAt?: string;
  onRestSecondsChange: (seconds: number) => void;
  onRestComplete: () => void;
}

export function SetRestDivider({
  restSeconds,
  isActive,
  restEndsAt,
  onRestSecondsChange,
  onRestComplete,
}: SetRestDividerProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatTime(restSeconds));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(formatTime(restSeconds));
    }
  }, [restSeconds, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const parseDraft = (value: string): number | null => {
    const trimmed = value.trim();
    const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
    if (colonMatch) {
      const minutes = parseInt(colonMatch[1], 10);
      const seconds = parseInt(colonMatch[2], 10);
      if (seconds >= 60) {
        return null;
      }
      return minutes * 60 + seconds;
    }

    const bareMatch = trimmed.match(/^(\d+)$/);
    if (bareMatch) {
      return parseInt(bareMatch[1], 10);
    }

    return null;
  };

  const commitDraft = () => {
    const parsed = parseDraft(draft);
    if (parsed !== null && parsed >= 0 && parsed <= 3600) {
      onRestSecondsChange(parsed);
      setDraft(formatTime(parsed));
    } else {
      setDraft(formatTime(restSeconds));
    }
    setEditing(false);
  };

  if (isActive && restEndsAt) {
    return (
      <div className="set-rest-divider set-rest-divider--active">
        <RestTimer
          endsAt={restEndsAt}
          durationSeconds={restSeconds}
          onComplete={onRestComplete}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="set-rest-divider">
      <span className="set-rest-divider__line" aria-hidden />
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraft();
            }
            if (event.key === "Escape") {
              setDraft(formatTime(restSeconds));
              setEditing(false);
            }
          }}
          className="set-rest-divider__input"
          aria-label="Rest time"
        />
      ) : (
        <button
          type="button"
          className="set-rest-divider__time"
          onClick={() => setEditing(true)}
          aria-label={`Rest ${formatTime(restSeconds)}. Click to edit.`}
        >
          {formatTime(restSeconds)}
        </button>
      )}
      <span className="set-rest-divider__line" aria-hidden />
    </div>
  );
}
