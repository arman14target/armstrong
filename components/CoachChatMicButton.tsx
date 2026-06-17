"use client";

import { useCallback, useEffect, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import {
  formatRecordingTime,
  useSpeechToText,
} from "@/hooks/useSpeechToText";

function MicIcon({ recording }: { recording: boolean }) {
  if (recording) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <rect x="8" y="8" width="8" height="8" rx="1.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

interface CoachChatMicButtonProps {
  disabled?: boolean;
  onAppendTranscript: (text: string) => void;
  onError?: (message: string | null) => void;
}

export function CoachChatMicButton({
  disabled = false,
  onAppendTranscript,
  onError,
}: CoachChatMicButtonProps) {
  const appendTranscript = useCallback(
    (text: string) => {
      onAppendTranscript(text);
    },
    [onAppendTranscript],
  );

  const {
    supported,
    listening,
    error,
    previewText,
    elapsedMs,
    audioLevel,
    toggle,
    stop,
    clearError,
  } = useSpeechToText(appendTranscript);

  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  useEffect(() => {
    if (disabled && listening) {
      stop();
    }
  }, [disabled, listening, stop]);

  if (!supported) {
    return null;
  }

  const handleClick = () => {
    clearError();
    onError?.(null);
    toggle();
  };

  const glowSpread = 6 + audioLevel * 28;
  const glowBlur = 10 + audioLevel * 22;

  return (
    <>
      {listening ? (
        <div className="coach-chat-voice__bar" aria-live="polite">
          <div className="coach-chat-voice__status">
            <span className="coach-chat-voice__rec">
              <span className="coach-chat-voice__rec-dot" aria-hidden />
              REC
            </span>
            <span className="coach-chat-voice__timer">
              {formatRecordingTime(elapsedMs)}
            </span>
          </div>
          <p className="coach-chat-voice__preview">
            {previewText || "Listening… speak now"}
          </p>
          <p className="coach-chat-voice__hint">Tap stop when done — text goes in the box</p>
        </div>
      ) : null}

      <div
        className={cn(
          "coach-chat-voice__mic-wrap",
          listening && "coach-chat-voice__mic-wrap--recording",
        )}
        style={
          {
            "--mic-level": audioLevel.toFixed(2),
            "--mic-glow-spread": `${glowSpread}px`,
            "--mic-glow-blur": `${glowBlur}px`,
          } as CSSProperties
        }
      >
        {listening ? (
          <>
            <span className="coach-chat-voice__ring coach-chat-voice__ring--outer" aria-hidden />
            <span className="coach-chat-voice__ring coach-chat-voice__ring--inner" aria-hidden />
          </>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          className={cn(
            "onboarding-coach-modal__mic",
            listening && "onboarding-coach-modal__mic--listening",
          )}
          aria-label={listening ? "Stop recording" : "Start voice input"}
          aria-pressed={listening}
          title={listening ? "Stop recording" : "Speak your message"}
        >
          <MicIcon recording={listening} />
        </button>
      </div>
    </>
  );
}
