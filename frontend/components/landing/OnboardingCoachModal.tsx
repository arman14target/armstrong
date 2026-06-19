"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CoachChatMicButton } from "@/components/CoachChatMicButton";
import { CloseIcon, CoachIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import {
  type CoachChatMessage,
  formatCoachError,
  isGeminiConfigured,
} from "@/lib/gemini";
import {
  CONTINUE_PROMPT_MARKER,
  ONBOARDING_WELCOME_MESSAGE,
  PLAN_READY_MARKER,
  messageHasMarker,
  sendOnboardingCoachMessage,
  stripOnboardingMarkers,
} from "@/lib/onboardingCoach";
import { importOnboardingFromChat } from "@/lib/onboardingImport";
import {
  CoachStatusMessage,
  getCoachThinkingPhase,
} from "@/components/landing/CoachStatusMessage";
import { withBasePath } from "@/lib/basePath";
import { APP_ROUTE } from "@/lib/routes";
import {
  clearOnboardingMessages,
  loadOnboardingMessages,
  saveOnboardingMessages,
} from "@/lib/onboardingStorage";

function createMessage(
  role: CoachChatMessage["role"],
  content: string,
): CoachChatMessage {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function SendIcon() {
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
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

function SetupPanel() {
  return (
    <div className="onboarding-coach-modal__setup">
      <p className="onboarding-coach-modal__setup-title">Coach unavailable</p>
      <p className="onboarding-coach-modal__setup-copy">
        Add <code>NEXT_PUBLIC_GEMINI_API_KEY</code> to{" "}
        <code>.env.local</code> and restart the dev server to chat here.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: CoachChatMessage }) {
  const isUser = message.role === "user";
  const displayContent = isUser
    ? message.content
    : stripOnboardingMarkers(message.content);

  return (
    <div
      className={cn(
        "onboarding-coach-message",
        isUser ? "onboarding-coach-message--user" : "onboarding-coach-message--coach",
      )}
    >
      {!isUser ? (
        <span className="onboarding-coach-message__avatar" aria-hidden>
          <CoachIcon />
        </span>
      ) : null}
      <div className="onboarding-coach-message__bubble">
        <p className="onboarding-coach-message__text">{displayContent}</p>
        <time
          className="onboarding-coach-message__time"
          dateTime={message.createdAt}
        >
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

function getWelcomeMessage(): CoachChatMessage {
  return createMessage("coach", ONBOARDING_WELCOME_MESSAGE);
}

function messageShowsContinueActions(content: string): boolean {
  return (
    messageHasMarker(content, CONTINUE_PROMPT_MARKER) ||
    messageHasMarker(content, PLAN_READY_MARKER)
  );
}

function readStoredMessages(): CoachChatMessage[] {
  const stored = loadOnboardingMessages();
  if (stored.length > 0) {
    return stored;
  }

  return [getWelcomeMessage()];
}

interface OnboardingCoachModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingCoachModal({
  open,
  onClose,
}: OnboardingCoachModalProps) {
  const welcomeMessageRef = useRef(getWelcomeMessage());
  const [messages, setMessages] = useState<CoachChatMessage[]>(() => [
    welcomeMessageRef.current,
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showContinueActions, setShowContinueActions] = useState(false);
  const [importing, setImporting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const configured = isGeminiConfigured();

  const appendTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev.trimEnd()} ${text}` : text).trimStart());
  }, []);

  const handleSpeechError = useCallback((message: string | null) => {
    if (message) {
      setError(message);
    }
  }, []);

  const scrollToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const stored = loadOnboardingMessages();
    const nextMessages = stored.length > 0 ? stored : [welcomeMessageRef.current];

    setMessages(nextMessages);
    setShowContinueActions(
      nextMessages.some((message) => messageShowsContinueActions(message.content)),
    );
  }, [open]);

  useEffect(() => {
    if (!open || messages.length === 0) {
      return;
    }

    saveOnboardingMessages(messages);
  }, [open, messages]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    scrollToLatest();
    const frame = requestAnimationFrame(scrollToLatest);
    return () => cancelAnimationFrame(frame);
  }, [open, messages, loading, importing, showContinueActions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading && !importing) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, loading, importing, onClose]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !configured) {
      return;
    }

    const userMessage = createMessage("user", trimmed);
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const reply = await sendOnboardingCoachMessage(messages, trimmed);
      setMessages([...nextMessages, createMessage("coach", reply)]);

      if (messageShowsContinueActions(reply)) {
        setShowContinueActions(true);
      }
    } catch (sendError) {
      setError(formatCoachError(sendError));
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    clearOnboardingMessages();
    welcomeMessageRef.current = getWelcomeMessage();
    setMessages([welcomeMessageRef.current]);
    setShowContinueActions(false);
    setImporting(false);
    setError(null);
    setInput("");
  };

  const handleKeepChatting = () => {
    setShowContinueActions(false);
    setError(null);
  };

  const handleContinueWithApp = async () => {
    if (importing) {
      return;
    }

    setImporting(true);
    setError(null);

    try {
      await importOnboardingFromChat(visibleMessages);
      window.location.assign(withBasePath(APP_ROUTE));
    } catch (importError) {
      setError(formatCoachError(importError));
      setImporting(false);
    }
  };

  const visibleMessages =
    open && messages.length === 0 ? readStoredMessages() : messages;

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="modal-overlay z-[100] !p-2 sm:!p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-coach-title"
    >
      <div
        className="absolute inset-0 z-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
        onClick={loading || importing ? undefined : onClose}
      />

      <div className="onboarding-coach-modal relative z-10">
        <header className="onboarding-coach-modal__header">
          <div className="onboarding-coach-modal__identity">
            <div className="onboarding-coach-modal__avatar" aria-hidden>
              <CoachIcon />
            </div>
            <div>
              <h2 id="onboarding-coach-title" className="onboarding-coach-modal__title">
                Armstrong Coach
              </h2>
              <p className="onboarding-coach-modal__subtitle">
                Your personal fitness coach
              </p>
            </div>
          </div>
          <div className="onboarding-coach-modal__actions">
            {visibleMessages.length > 1 ? (
              <button
                type="button"
                onClick={handleRestart}
                disabled={loading || importing}
                className="onboarding-coach-modal__restart"
              >
                Start over
              </button>
            ) : null}
            <IconButton
              label="Close coach chat"
              variant="ghost"
              className="size-8"
              onClick={onClose}
              disabled={loading || importing}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </header>

        {!configured ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 p-[var(--space-panel)] pb-0">
              <SetupPanel />
            </div>
            <div
              ref={scrollRef}
              className="onboarding-coach-modal__messages"
            >
              <div className="onboarding-coach-modal__thread">
                {visibleMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </div>
            <div className="onboarding-coach-modal__composer">
              <p className="text-sm text-dim">
                Add your API key above to chat with the coach.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="onboarding-coach-modal__messages">
              <div className="onboarding-coach-modal__thread">
                {visibleMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {loading || importing ? (
                  <CoachStatusMessage
                    active
                    phase={
                      importing
                        ? "importing"
                        : getCoachThinkingPhase(visibleMessages.length)
                    }
                    intervalMs={3400}
                  />
                ) : null}

                {showContinueActions ? (
                  <div className="onboarding-coach-modal__continue">
                    {error ? (
                      <p className="mb-0 w-full text-center text-sm text-magenta sm:basis-full">
                        {error}
                      </p>
                    ) : null}
                    <CyberButton
                      variant="magenta"
                      className="min-h-[3rem] flex-1 px-5 text-base disabled:opacity-50"
                      disabled={importing}
                      onClick={() => void handleContinueWithApp()}
                    >
                      {importing ? "Setting up your plans..." : "Continue in app"}
                    </CyberButton>
                    <CyberButton
                      variant="cyan"
                      className="min-h-[3rem] flex-1 px-5 text-base"
                      onClick={handleKeepChatting}
                      disabled={importing}
                    >
                      Keep chatting
                    </CyberButton>
                  </div>
                ) : null}

                <div ref={messagesEndRef} aria-hidden="true" />
              </div>
            </div>

            {!showContinueActions ? (
              <div className="onboarding-coach-modal__composer">
                {error ? (
                  <p className="mb-2 text-sm text-magenta">{error}</p>
                ) : null}
                <form
                  className="onboarding-coach-modal__form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSend();
                  }}
                >
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={2}
                    placeholder="Tell me your goal — e.g. I want to bulk, train 4 days, and hit my protein"
                    disabled={loading || importing}
                    className="onboarding-coach-modal__input"
                    aria-label="Message to coach"
                  />
                  <CoachChatMicButton
                    disabled={loading || importing}
                    onAppendTranscript={appendTranscript}
                    onError={handleSpeechError}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="onboarding-coach-modal__send"
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </button>
                </form>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
