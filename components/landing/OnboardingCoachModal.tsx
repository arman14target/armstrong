"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
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

function SetupPanel() {
  return (
    <div className="stack-md rounded-cyber border border-line bg-bg/50 p-[var(--space-panel)]">
      <p className="text-sm text-heading">Coach unavailable</p>
      <p className="text-xs leading-relaxed text-dim">
        The onboarding coach needs a Gemini API key. Add{" "}
        <code className="text-heading">NEXT_PUBLIC_GEMINI_API_KEY</code> to{" "}
        <code className="text-heading">.env.local</code> and restart the dev
        server.
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
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-cyber border px-4 py-3 sm:max-w-[80%]",
          isUser
            ? "border-cyan/35 bg-cyan/10"
            : "border-green/30 bg-green/5",
        )}
      >
        <p className="text-[10px] tracking-wide text-dim uppercase">
          {isUser ? "You" : "Coach"} · {formatTime(message.createdAt)}
        </p>
        <p className="mt-1.5 whitespace-pre-wrap text-base leading-relaxed text-heading sm:text-lg">
          {displayContent}
        </p>
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
      window.location.assign("/");
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

      <div
        className={cn(
          "relative z-10 flex h-[min(96dvh,56rem)] w-[min(96vw,64rem)] max-w-none flex-col overflow-hidden rounded-panel border border-green/35 bg-panel shadow-[var(--shadow-modal)]",
        )}
      >
        <div className="panel-header shrink-0 justify-between">
          <div className="inline-flex min-w-0 items-center">
            <PanelDot variant="green" />
            <span
              id="onboarding-coach-title"
              className="ml-[var(--space-inline)] tracking-wide text-green"
            >
              Armstrong Coach
            </span>
          </div>
          <div className="flex items-center gap-2">
            {visibleMessages.length > 1 ? (
              <button
                type="button"
                onClick={handleRestart}
                disabled={loading || importing}
                className="text-xs tracking-wide text-dim uppercase transition-colors hover:text-magenta disabled:opacity-50"
              >
                Restart
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
        </div>

        {!configured ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 p-[var(--space-panel)] pb-0">
              <SetupPanel />
            </div>
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto p-[var(--space-panel)] sm:p-6"
            >
              {visibleMessages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
            <div className="shrink-0 border-t border-line p-[var(--space-panel)]">
              <p className="text-xs text-dim">
                Add your API key above to chat with the coach.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto p-[var(--space-panel)] sm:p-6"
            >
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
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  {error ? (
                    <p className="mb-0 w-full text-center text-sm text-magenta sm:mb-0 sm:basis-full">
                      {error}
                    </p>
                  ) : null}
                  <CyberButton
                    variant="green"
                    className="min-h-[3rem] flex-1 px-5 text-base disabled:opacity-50"
                    disabled={importing}
                    onClick={() => void handleContinueWithApp()}
                  >
                    {importing ? "Setting up..." : "Continue in app"}
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

            {!showContinueActions ? (
              <div className="shrink-0 border-t border-line p-[var(--space-panel)] sm:p-6">
                {error ? (
                  <p className="mb-2 text-xs text-magenta">{error}</p>
                ) : null}
                <form
                  className="flex flex-col gap-2 sm:flex-row"
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
                    rows={3}
                    placeholder="Tell the coach your goal, age, weight..."
                    disabled={loading || importing}
                    className="cyber-input min-h-[4rem] flex-1 resize-none py-3 text-base sm:min-h-[4.5rem]"
                    aria-label="Message to coach"
                  />
                  <CyberButton
                    type="submit"
                    variant="green"
                    disabled={loading || !input.trim()}
                    className="min-h-[4rem] px-5 text-base disabled:opacity-50 sm:min-h-[4.5rem]"
                  >
                    Send
                  </CyberButton>
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
