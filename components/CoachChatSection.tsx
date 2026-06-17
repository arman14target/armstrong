"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CoachChatThinkingMessage } from "@/components/CoachChatThinkingMessage";
import { CoachIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import {
  clearCoachChatMessages,
  loadCoachChatMessages,
  saveCoachChatMessages,
} from "@/lib/coachChatStorage";
import {
  buildCoachSystemPrompt,
  canApplyWorkoutChange,
  describeWorkoutChange,
  getWorkoutChangeApplyLabel,
  parseWorkoutChange,
  stripWorkoutChangeMarker,
  type CoachWorkoutChange,
} from "@/lib/coachWorkout";
import {
  canApplyDietPlan,
  describeDietPlan,
  formatDietPlanPreview,
  getDietPlanApplyLabel,
  parseDietPlan,
  stripDietPlanMarker,
  type CoachDietPlan,
} from "@/lib/coachDiet";
import { cn } from "@/lib/cn";
import {
  type CoachChatMessage,
  formatCoachError,
  isGeminiConfigured,
  sendCoachMessage,
} from "@/lib/gemini";
import type { AppData } from "@/lib/types";

function createMessage(role: CoachChatMessage["role"], content: string): CoachChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function stripCoachMarkers(content: string): string {
  return stripDietPlanMarker(stripWorkoutChangeMarker(content));
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
      <p className="onboarding-coach-modal__setup-title">Connect your coach</p>
      <p className="onboarding-coach-modal__setup-copy">
        Armstrong Coach runs on Google Gemini Flash. Create a free API key at{" "}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-magenta underline-offset-2 hover:underline"
        >
          aistudio.google.com/apikey
        </a>
        , add <code>NEXT_PUBLIC_GEMINI_API_KEY</code> to <code>.env.local</code>,
        then restart the dev server.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: CoachChatMessage }) {
  const isUser = message.role === "user";
  const displayContent = isUser
    ? message.content
    : stripCoachMarkers(message.content);

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

interface CoachChatSectionProps {
  appData: AppData;
  onApplyWorkoutChange: (change: CoachWorkoutChange) => void;
  onApplyDietPlan: (plan: CoachDietPlan) => void;
}

export function CoachChatSection({
  appData,
  onApplyWorkoutChange,
  onApplyDietPlan,
}: CoachChatSectionProps) {
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [dismissedChangeIds, setDismissedChangeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  const lastScrolledCoachIdRef = useRef<string | null>(null);
  const skipInitialScrollRef = useRef(true);
  const configured = isGeminiConfigured();

  const setMessageRef = (id: string) => (node: HTMLDivElement | null) => {
    if (node) {
      messageRefs.current.set(id, node);
      return;
    }

    messageRefs.current.delete(id);
  };

  useEffect(() => {
    setMessages(loadCoachChatMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveCoachChatMessages(messages);
  }, [hydrated, messages]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !hydrated) {
      return;
    }

    const lastMessage = messages.at(-1);

    if (skipInitialScrollRef.current) {
      skipInitialScrollRef.current = false;
      if (lastMessage?.role === "coach") {
        lastScrolledCoachIdRef.current = lastMessage.id;
      }
      container.scrollTop = container.scrollHeight;
      return;
    }

    if (
      lastMessage?.role === "coach" &&
      lastMessage.id !== lastScrolledCoachIdRef.current
    ) {
      lastScrolledCoachIdRef.current = lastMessage.id;
      const messageNode = messageRefs.current.get(lastMessage.id);

      const scrollToCoachMessage = () => {
        messageNode?.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      scrollToCoachMessage();
      const frame = requestAnimationFrame(scrollToCoachMessage);
      return () => cancelAnimationFrame(frame);
    }

    if (lastMessage?.role === "user" || loading) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages, loading, hydrated]);

  const lastMessage = messages[messages.length - 1];
  const pendingChange =
    lastMessage?.role === "coach" ? parseWorkoutChange(lastMessage.content) : null;
  const pendingDietPlan =
    lastMessage?.role === "coach" ? parseDietPlan(lastMessage.content) : null;
  const showWorkoutChangeActions =
    pendingChange !== null && !dismissedChangeIds.has(lastMessage.id);
  const showDietPlanActions =
    pendingDietPlan !== null && !dismissedChangeIds.has(lastMessage.id);
  const showActionButtons = showWorkoutChangeActions || showDietPlanActions;

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
      const systemPrompt = buildCoachSystemPrompt(appData);
      const reply = await sendCoachMessage(messages, trimmed, systemPrompt);
      setMessages([...nextMessages, createMessage("coach", reply)]);
    } catch (sendError) {
      setError(formatCoachError(sendError));
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const handleKeepChatting = () => {
    if (!lastMessage) {
      return;
    }

    setDismissedChangeIds((prev) => new Set(prev).add(lastMessage.id));
    setError(null);
  };

  const handleApplyDietPlan = () => {
    if (!pendingDietPlan || !lastMessage) {
      return;
    }

    if (!canApplyDietPlan(appData)) {
      setError(
        "Set up your nutrition targets in the Food tracker tab first, then ask for a meal plan again.",
      );
      return;
    }

    onApplyDietPlan(pendingDietPlan);
    setDismissedChangeIds((prev) => new Set(prev).add(lastMessage.id));
    setError(null);
    setMessages((prev) => [
      ...prev,
      createMessage("coach", describeDietPlan(pendingDietPlan)),
    ]);
  };

  const handleApplyChange = () => {
    if (!pendingChange || !lastMessage) {
      return;
    }

    if (!canApplyWorkoutChange(appData, pendingChange)) {
      setError("Could not find that exercise in your plan. Ask the coach to try again.");
      return;
    }

    onApplyWorkoutChange(pendingChange);
    setDismissedChangeIds((prev) => new Set(prev).add(lastMessage.id));
    setError(null);
    setMessages((prev) => [
      ...prev,
      createMessage("coach", describeWorkoutChange(appData, pendingChange)),
    ]);
  };

  const handleClear = () => {
    setMessages([]);
    clearCoachChatMessages();
    setDismissedChangeIds(new Set());
    setError(null);
  };

  if (!hydrated) {
    return (
      <div className="coach-chat-panel">
        <header className="onboarding-coach-modal__header">
          <div className="onboarding-coach-modal__identity">
            <div className="onboarding-coach-modal__avatar" aria-hidden>
              <CoachIcon />
            </div>
            <div>
              <h2 className="onboarding-coach-modal__title">Armstrong Coach</h2>
              <p className="onboarding-coach-modal__subtitle">Loading...</p>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="coach-chat-panel">
      <header className="onboarding-coach-modal__header">
        <div className="onboarding-coach-modal__identity">
          <div className="onboarding-coach-modal__avatar" aria-hidden>
            <CoachIcon />
          </div>
          <div>
            <h2 className="onboarding-coach-modal__title">Armstrong Coach</h2>
            <p className="onboarding-coach-modal__subtitle">
              Ask about training, nutrition, or your plan
            </p>
          </div>
        </div>
        {messages.length > 0 ? (
          <div className="onboarding-coach-modal__actions">
            <button
              type="button"
              onClick={handleClear}
              className="onboarding-coach-modal__restart"
            >
              Clear chat
            </button>
          </div>
        ) : null}
      </header>

      {!configured ? (
        <div className="onboarding-coach-modal__messages">
          <SetupPanel />
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="onboarding-coach-modal__messages">
            <div className="onboarding-coach-modal__thread">
              {messages.length === 0 ? (
                <div className="coach-chat-empty">
                  <p className="coach-chat-empty__title">Ask your coach anything</p>
                  <p className="coach-chat-empty__copy">
                    Splits, macros, form, prep, recovery — swap exercises in your
                    plan or ask for a daily meal plan.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    ref={setMessageRef(message.id)}
                    className="scroll-mt-3"
                  >
                    <MessageBubble message={message} />
                  </div>
                ))
              )}

              <CoachChatThinkingMessage active={loading} />

              {showDietPlanActions && pendingDietPlan ? (
                <div className="onboarding-coach-modal__continue stack-sm">
                  <p className="w-full rounded-cyber border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs leading-relaxed whitespace-pre-line text-dim">
                    {formatDietPlanPreview(pendingDietPlan)}
                  </p>
                  <div className="flex w-full flex-wrap gap-2">
                    <CyberButton
                      variant="magenta"
                      className="min-h-[2.75rem] flex-1 px-4 disabled:opacity-50"
                      onClick={handleApplyDietPlan}
                    >
                      {getDietPlanApplyLabel()}
                    </CyberButton>
                    <CyberButton
                      variant="cyan"
                      className="min-h-[2.75rem] flex-1 px-4"
                      onClick={handleKeepChatting}
                    >
                      Keep chatting
                    </CyberButton>
                  </div>
                </div>
              ) : null}

              {showWorkoutChangeActions && pendingChange ? (
                <div className="onboarding-coach-modal__continue">
                  <CyberButton
                    variant="magenta"
                    className="min-h-[2.75rem] flex-1 px-4 disabled:opacity-50"
                    onClick={handleApplyChange}
                  >
                    {getWorkoutChangeApplyLabel(pendingChange)}
                  </CyberButton>
                  <CyberButton
                    variant="cyan"
                    className="min-h-[2.75rem] flex-1 px-4"
                    onClick={handleKeepChatting}
                  >
                    Keep chatting
                  </CyberButton>
                </div>
              ) : null}
            </div>
          </div>

          <div className="onboarding-coach-modal__composer">
            {error ? (
              <p className="mb-2 text-sm text-magenta">{error}</p>
            ) : null}
            {!showActionButtons ? (
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
                  placeholder="Ask about training, nutrition, form, prep..."
                  disabled={loading}
                  className="onboarding-coach-modal__input"
                  aria-label="Message to coach"
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
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
