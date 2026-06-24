"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NumericKeyboardInput } from "@/components/NumericKeyboardInput";
import { RestTimer } from "@/components/RestTimer";
import { formatTime } from "@/hooks/useCountdown";
import { useTouchDevice } from "@/lib/useTouchDevice";

const REST_STEP = 15;

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
  const { t } = useTranslation();
  const isTouchDevice = useTouchDevice();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(formatTime(restSeconds));
  const inputRef = useRef<HTMLInputElement>(null);
  const formattedRest = formatTime(restSeconds);

  const startEditing = () => {
    setDraft(isTouchDevice ? String(restSeconds) : formattedRest);
    setEditing(true);
  };

  const adjustDraft = (delta: number) => {
    const current = parseDraft(draft) ?? restSeconds;
    const next = Math.max(0, Math.min(3600, current + delta));
    setDraft(isTouchDevice ? String(next) : formatTime(next));
  };

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
        <NumericKeyboardInput
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          onValueChange={setDraft}
          onIncrement={() => adjustDraft(REST_STEP)}
          onDecrement={() => adjustDraft(-REST_STEP)}
          onKeyboardDone={commitDraft}
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
          aria-label={t("sets.restTimeAria")}
        />
      ) : (
        <button
          type="button"
          className="set-rest-divider__time"
          onClick={startEditing}
          aria-label={t("sets.restEditAria", { time: formattedRest })}
        >
          {formattedRest}
        </button>
      )}
      <span className="set-rest-divider__line" aria-hidden />
    </div>
  );
}
