"use client";

import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CoachChatMicButton } from "@/components/CoachChatMicButton";
import { CoachChatThinkingMessage } from "@/components/CoachChatThinkingMessage";
import { CoachIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { scheduleCloudSync } from "@/lib/cloudSyncScheduler";
import {
  clearCoachChatMessages,
  loadCoachChatMessages,
  saveCoachChatMessages,
} from "@/lib/coachChatStorage";
import {
  buildCoachSystemPrompt,
  canApplyGymPlan,
  canApplyWorkoutChange,
  describeGymPlan,
  describeWorkoutChange,
  formatGymPlanPreview,
  getGymPlanApplyLabel,
  getWorkoutChangeApplyLabel,
  parseGymPlan,
  parseWorkoutChange,
  stripGymPlanMarker,
  stripWorkoutChangeMarker,
  type CoachGymPlan,
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
  return stripGymPlanMarker(
    stripDietPlanMarker(stripWorkoutChangeMarker(content)),
  );
}

type CoachActionKind = "diet" | "gym" | "workout";

function actionKey(messageId: string, kind: CoachActionKind): string {
  return `${messageId}:${kind}`;
}

interface ParsedCoachActions {
  dietPlan: CoachDietPlan | null;
  gymPlan: CoachGymPlan | null;
  workoutChange: CoachWorkoutChange | null;
}

function parseCoachActions(content: string): ParsedCoachActions {
  return {
    dietPlan: parseDietPlan(content),
    gymPlan: parseGymPlan(content),
    workoutChange: parseWorkoutChange(content),
  };
}

function getPendingActionKinds(
  messageId: string,
  content: string,
  resolvedActions: Set<string>,
): CoachActionKind[] {
  const actions = parseCoachActions(content);
  const kinds: CoachActionKind[] = [];

  if (actions.dietPlan && !resolvedActions.has(actionKey(messageId, "diet"))) {
    kinds.push("diet");
  }
  if (actions.gymPlan && !resolvedActions.has(actionKey(messageId, "gym"))) {
    kinds.push("gym");
  }
  if (
    actions.workoutChange &&
    !resolvedActions.has(actionKey(messageId, "workout"))
  ) {
    kinds.push("workout");
  }

  return kinds;
}

function getCombinedApplyLabel(
  kinds: CoachActionKind[],
  t: (key: string) => string,
): string {
  const hasDiet = kinds.includes("diet");
  const hasGym = kinds.includes("gym");
  const hasWorkout = kinds.includes("workout");

  if (hasDiet && hasGym) {
    return t("coach.applyCombinedNutritionWorkoutDays");
  }
  if (hasDiet && hasWorkout) {
    return t("coach.applyCombinedNutritionWorkout");
  }
  if (hasGym && hasWorkout) {
    return t("coach.applyCombinedWorkoutDaysExercise");
  }

  return t("coach.savePlan");
}

function markActionsResolved(
  messageId: string,
  kinds: CoachActionKind[],
): (prev: Set<string>) => Set<string> {
  return (prev) => {
    const next = new Set(prev);
    for (const kind of kinds) {
      next.add(actionKey(messageId, kind));
    }
    return next;
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
  const { t } = useTranslation();

  return (
    <div className="onboarding-coach-modal__setup">
      <p className="onboarding-coach-modal__setup-title">{t("coach.connectTitle")}</p>
      <p className="onboarding-coach-modal__setup-copy">
        {t("coach.connectIntro")}{" "}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-magenta underline-offset-2 hover:underline"
        >
          aistudio.google.com/apikey
        </a>
        {t("coach.connectMiddle")}
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

interface CoachMessageActionsProps {
  message: CoachChatMessage;
  pendingKinds: CoachActionKind[];
  appData: AppData;
  onApplyDietPlan: (plan: CoachDietPlan) => void;
  onApplyGymPlan: (plan: CoachGymPlan) => void;
  onApplyWorkoutChange: (change: CoachWorkoutChange) => void;
  onResolve: (messageId: string, kinds: CoachActionKind[]) => void;
  onConfirm: (text: string) => void;
  onError: (message: string) => void;
}

function CoachMessageActions({
  message,
  pendingKinds,
  appData,
  onApplyDietPlan,
  onApplyGymPlan,
  onApplyWorkoutChange,
  onResolve,
  onConfirm,
  onError,
}: CoachMessageActionsProps) {
  const { t } = useTranslation();
  const actions = parseCoachActions(message.content);
  const useCombinedButton = pendingKinds.length > 1;

  const handleApply = () => {
    const confirmations: string[] = [];

    if (pendingKinds.includes("diet") && actions.dietPlan) {
      if (!canApplyDietPlan(actions.dietPlan)) {
        onError(t("coach.dietSaveError"));
        return;
      }
      onApplyDietPlan(actions.dietPlan);
      confirmations.push(describeDietPlan(actions.dietPlan));
    }

    if (pendingKinds.includes("gym") && actions.gymPlan) {
      if (!canApplyGymPlan(actions.gymPlan)) {
        onError(t("coach.gymSaveError"));
        return;
      }
      onApplyGymPlan(actions.gymPlan);
      confirmations.push(describeGymPlan(actions.gymPlan));
    }

    if (pendingKinds.includes("workout") && actions.workoutChange) {
      if (!canApplyWorkoutChange(appData, actions.workoutChange)) {
        const errorMessage =
          actions.workoutChange.action === "add"
            ? t("coach.workoutDayNotFound")
            : t("coach.exerciseNotFound");
        onError(errorMessage);
        return;
      }
      onApplyWorkoutChange(actions.workoutChange);
      confirmations.push(
        describeWorkoutChange(appData, actions.workoutChange),
      );
    }

    onResolve(message.id, pendingKinds);
    onConfirm(confirmations.join("\n\n"));
  };

  const handleDismiss = () => {
    onResolve(message.id, pendingKinds);
  };

  const applyLabel = useCombinedButton
    ? getCombinedApplyLabel(pendingKinds, t)
    : pendingKinds[0] === "diet"
      ? getDietPlanApplyLabel()
      : pendingKinds[0] === "gym"
        ? getGymPlanApplyLabel()
        : actions.workoutChange
          ? getWorkoutChangeApplyLabel(actions.workoutChange)
          : t("coach.apply");

  return (
    <div className="coach-message-actions stack-sm">
      {pendingKinds.includes("diet") && actions.dietPlan ? (
        <p className="rounded-cyber border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs leading-relaxed whitespace-pre-line text-dim">
          {formatDietPlanPreview(actions.dietPlan)}
        </p>
      ) : null}

      {pendingKinds.includes("gym") && actions.gymPlan ? (
        <p className="rounded-cyber border border-cyan/20 bg-cyan/5 px-3 py-2 text-xs leading-relaxed whitespace-pre-line text-dim">
          {formatGymPlanPreview(actions.gymPlan)}
        </p>
      ) : null}

      <p className="text-xs text-dim">
        {useCombinedButton
          ? t("coach.adjustCombined")
          : pendingKinds.includes("diet")
            ? t("coach.adjustDiet")
            : t("coach.adjustWorkout")}
      </p>

      <div className="flex flex-wrap gap-2">
        <CyberButton
          variant="magenta"
          className="min-h-[2.75rem] flex-1 px-4 disabled:opacity-50"
          onClick={handleApply}
        >
          {applyLabel}
        </CyberButton>
        <CyberButton
          variant="cyan"
          className="min-h-[2.75rem] flex-1 px-4"
          onClick={handleDismiss}
        >
          {t("coach.keepChatting")}
        </CyberButton>
      </div>
    </div>
  );
}

interface CoachChatSectionProps {
  appData: AppData;
  layout?: "home" | "default";
  onApplyWorkoutChange: (change: CoachWorkoutChange) => void;
  onApplyDietPlan: (plan: CoachDietPlan) => void;
  onApplyGymPlan: (plan: CoachGymPlan) => void;
}

export function CoachChatSection({
  appData,
  layout = "default",
  onApplyWorkoutChange,
  onApplyDietPlan,
  onApplyGymPlan,
}: CoachChatSectionProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [resolvedActions, setResolvedActions] = useState<Set<string>>(
    () => new Set(),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());
  const lastScrolledCoachIdRef = useRef<string | null>(null);
  const skipInitialScrollRef = useRef(true);
  const configured = isGeminiConfigured();

  const appendTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev.trimEnd()} ${text}` : text).trimStart());
  }, []);

  const handleSpeechError = useCallback((message: string | null) => {
    if (message) {
      setError(message);
    }
  }, []);

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
    scheduleCloudSync();
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

  const handleResolveActions = useCallback(
    (messageId: string, kinds: CoachActionKind[]) => {
      setResolvedActions(markActionsResolved(messageId, kinds));
      setError(null);
    },
    [],
  );

  const handleConfirmApply = useCallback((text: string) => {
    setMessages((prev) => [...prev, createMessage("coach", text)]);
  }, []);

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

  const handleClear = () => {
    setMessages([]);
    clearCoachChatMessages();
    setResolvedActions(new Set());
    setError(null);
  };

  if (!hydrated) {
    return (
      <div
        className={cn(
          "coach-chat-panel",
          layout === "home" && "coach-chat-panel--home",
        )}
      >
        <header className="onboarding-coach-modal__header">
          <div className="onboarding-coach-modal__identity">
            <div className="onboarding-coach-modal__avatar" aria-hidden>
              <CoachIcon />
            </div>
            <div>
              <h2 className="onboarding-coach-modal__title">{t("coach.armstrongCoach")}</h2>
              <p className="onboarding-coach-modal__subtitle">{t("coach.loading")}</p>
            </div>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "coach-chat-panel",
        layout === "home" && "coach-chat-panel--home",
      )}
    >
      <header className="onboarding-coach-modal__header">
        <div className="onboarding-coach-modal__identity">
          <div className="onboarding-coach-modal__avatar" aria-hidden>
            <CoachIcon />
          </div>
          <div>
            <h2 className="onboarding-coach-modal__title">{t("coach.armstrongCoach")}</h2>
            <p className="onboarding-coach-modal__subtitle">
              {t("coach.subtitle")}
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
              {t("coach.clearChat")}
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
                  <p className="coach-chat-empty__title">{t("coach.emptyTitle")}</p>
                  <p className="coach-chat-empty__copy">
                    {t("coach.emptyCopy")}
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const pendingKinds =
                    message.role === "coach"
                      ? getPendingActionKinds(
                          message.id,
                          message.content,
                          resolvedActions,
                        )
                      : [];

                  return (
                    <div
                      key={message.id}
                      ref={setMessageRef(message.id)}
                      className="scroll-mt-3 stack-sm"
                    >
                      <MessageBubble message={message} />
                      {pendingKinds.length > 0 ? (
                        <CoachMessageActions
                          message={message}
                          pendingKinds={pendingKinds}
                          appData={appData}
                          onApplyDietPlan={onApplyDietPlan}
                          onApplyGymPlan={onApplyGymPlan}
                          onApplyWorkoutChange={onApplyWorkoutChange}
                          onResolve={handleResolveActions}
                          onConfirm={handleConfirmApply}
                          onError={setError}
                        />
                      ) : null}
                    </div>
                  );
                })
              )}

              <CoachChatThinkingMessage active={loading} />
            </div>
          </div>

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
                placeholder={t("coach.placeholder")}
                disabled={loading}
                className="onboarding-coach-modal__input"
                aria-label={t("coach.messageAria")}
              />
              <CoachChatMicButton
                disabled={loading}
                onAppendTranscript={appendTranscript}
                onError={handleSpeechError}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="onboarding-coach-modal__send"
                aria-label={t("coach.sendAria")}
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
