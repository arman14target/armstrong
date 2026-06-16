"use client";

import { useEffect, useRef, useState } from "react";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import {
  clearCoachChatMessages,
  loadCoachChatMessages,
  saveCoachChatMessages,
} from "@/lib/coachChatStorage";
import { cn } from "@/lib/cn";
import {
  type CoachChatMessage,
  formatCoachError,
  isGeminiConfigured,
  sendCoachMessage,
} from "@/lib/gemini";

function createMessage(role: CoachChatMessage["role"], content: string): CoachChatMessage {
  return {
    id: crypto.randomUUID(),
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
      <p className="text-sm text-heading">Connect your coach</p>
      <p className="text-xs leading-relaxed text-dim">
        Armstrong Coach runs on Google Gemini Flash. You need a free API key from
        Google AI Studio.
      </p>
      <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-dim">
        <li>
          Go to{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-cyan underline-offset-2 hover:underline"
          >
            aistudio.google.com/apikey
          </a>{" "}
          and create an API key.
        </li>
        <li>
          Add it to <span className="text-heading">.env.local</span> in the project
          root:
          <code className="mt-1 block rounded-cyber border border-line bg-bg/70 px-2 py-1.5 text-[11px] text-green">
            NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
          </code>
        </li>
        <li>Restart the dev server, then come back to this tab.</li>
      </ol>
      <p className="text-[11px] leading-relaxed text-dim">
        Uses Google&apos;s official <code className="text-heading">@google/genai</code>{" "}
        SDK with Gemini Flash (gemini-3.5-flash). If you see quota errors, enable
        billing in Google AI Studio — free usage stays $0, but Google requires a
        billing account linked to activate free limits.
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: CoachChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[92%] rounded-cyber border px-3 py-2 sm:max-w-[80%]",
          isUser
            ? "border-cyan/35 bg-cyan/10"
            : "border-green/30 bg-green/5",
        )}
      >
        <p className="text-[10px] tracking-wide text-dim uppercase">
          {isUser ? "You" : "Coach"} · {formatTime(message.createdAt)}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-heading">
          {message.content}
        </p>
      </div>
    </div>
  );
}

export function CoachChatSection() {
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const configured = isGeminiConfigured();

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

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [messages, loading]);

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
      const reply = await sendCoachMessage(messages, trimmed);
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
    setError(null);
  };

  if (!hydrated) {
    return (
      <TerminalWindow title="Armstrong Coach">
        <p className="animate-blink text-sm text-green">Loading coach...</p>
      </TerminalWindow>
    );
  }

  return (
    <TerminalWindow
      title="Armstrong Coach"
      dotVariant="green"
      headerAction={
        messages.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] tracking-wide text-dim uppercase transition-colors hover:text-magenta"
          >
            Clear
          </button>
        ) : null
      }
      bodyClassName="!p-0"
    >
      {!configured ? (
        <div className="p-[var(--space-panel)]">
          <SetupPanel />
        </div>
      ) : (
        <div className="flex min-h-[22rem] flex-col">
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-[var(--space-panel)]"
          >
            {messages.length === 0 ? (
              <div className="rounded-cyber border border-dashed border-line bg-bg/40 p-[var(--space-panel)] text-center">
                <p className="text-sm text-heading">Ask your coach anything</p>
                <p className="mt-2 text-xs leading-relaxed text-dim">
                  Splits, macros, form, prep, recovery — short, straight answers
                  from a young bodybuilding coach.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))
            )}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-cyber border border-green/30 bg-green/5 px-3 py-2">
                  <p className="animate-blink text-xs tracking-wide text-green uppercase">
                    Coach is thinking...
                  </p>
                  <p className="mt-1 text-[10px] text-dim">
                    Retrying if Gemini is busy
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-line p-[var(--space-panel)]">
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
                rows={2}
                placeholder="Ask about training, nutrition, form, prep..."
                disabled={loading}
                className="cyber-input min-h-[3.25rem] flex-1 resize-none py-2 text-sm"
                aria-label="Message to coach"
              />
              <CyberButton
                type="submit"
                variant="green"
                disabled={loading || !input.trim()}
                className="min-h-[3.25rem] px-4 disabled:opacity-50"
              >
                Send
              </CyberButton>
            </form>
          </div>
        </div>
      )}
    </TerminalWindow>
  );
}
