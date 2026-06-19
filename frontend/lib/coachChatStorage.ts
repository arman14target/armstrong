import type { CoachChatMessage } from "@/lib/gemini";

const STORAGE_KEY = "armstrong-coach-chat-v1";

export function loadCoachChatMessages(): CoachChatMessage[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CoachChatMessage[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (message) =>
        typeof message.id === "string" &&
        (message.role === "user" || message.role === "coach") &&
        typeof message.content === "string" &&
        typeof message.createdAt === "string",
    );
  } catch {
    return [];
  }
}

export function saveCoachChatMessages(messages: CoachChatMessage[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

export function clearCoachChatMessages(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
