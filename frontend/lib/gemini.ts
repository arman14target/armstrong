import { ApiError, GoogleGenAI } from "@google/genai";
import { t } from "@/lib/i18n/t";

/** Flash models — latest first. Deprecated IDs are skipped automatically on 404. */
export const FREE_TIER_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

export type FreeTierModel = (typeof FREE_TIER_MODELS)[number];

/** Shut down or removed from the v1beta generateContent API. */
const DEPRECATED_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash-001",
]);

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 1200;

function getConfiguredModel(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_GEMINI_MODEL?.trim();
  if (!configured || DEPRECATED_MODELS.has(configured)) {
    return undefined;
  }

  return configured;
}

export function getCoachModels(): string[] {
  const preferred = getConfiguredModel();
  if (!preferred) {
    return [...FREE_TIER_MODELS];
  }

  return [
    preferred,
    ...FREE_TIER_MODELS.filter((model) => model !== preferred),
  ];
}

export const COACH_SYSTEM_PROMPT = `You are a young competitive bodybuilder and strength coach — sharp, chill, like a gym bro who actually knows training. Talk straight.

Your job:
- Adjust their workout plan — swaps, adds, removes, or full gym splits
- Build and adjust their daily diet and meal plan
- Answer bodybuilding questions: training, form, nutrition, macros, recovery, prep

Style:
- Move fast — deliver plans and concrete changes in the first reply when you can
- Be clear and practical, not wordy
- Never diagnose injuries — doctor or physio. Prefer natural training unless they ask about enhanced athletics.`;

export type CoachChatRole = "user" | "coach";

export interface CoachChatMessage {
  id: string;
  role: CoachChatRole;
  content: string;
  createdAt: string;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim() || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey());
}

function createClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

function toGeminiContents(messages: CoachChatMessage[], userMessage: string) {
  const history = messages.map((message) => ({
    role: message.role === "coach" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  return [
    ...history,
    {
      role: "user" as const,
      parts: [{ text: userMessage }],
    },
  ];
}

function isQuotaError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 429) {
    return true;
  }

  const message = getErrorMessage(error);
  return message.includes("429") || message.toLowerCase().includes("quota");
}

function isZeroQuotaError(error: unknown): boolean {
  return getErrorMessage(error).includes("limit: 0");
}

function isOverloadedError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 503) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("503") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("temporarily unavailable")
  );
}

function isModelNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 404) {
    return true;
  }

  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("is not supported for generatecontent")
  );
}

function isRetriableError(error: unknown): boolean {
  return isQuotaError(error) || isOverloadedError(error);
}

function isSkippableModelError(error: unknown): boolean {
  return isModelNotFoundError(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatCoachError(error: unknown): string {
  const raw = getErrorMessage(error);

  if (isOverloadedError(error)) {
    return t("coach.errors.overloaded");
  }

  if (isZeroQuotaError(error)) {
    return t("coach.errors.zeroQuota");
  }

  if (isQuotaError(error)) {
    const retryMatch = raw.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      const seconds = Math.ceil(Number.parseFloat(retryMatch[1]));
      return t("coach.errors.rateLimitSeconds", { seconds });
    }

    return t("coach.errors.rateLimit");
  }

  if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
    return t("coach.errors.invalidKey");
  }

  if (isModelNotFoundError(error)) {
    return t("coach.errors.modelNotFound");
  }

  return raw;
}

async function sendWithModel(
  apiKey: string,
  modelName: string,
  history: CoachChatMessage[],
  userMessage: string,
  systemPrompt: string = COACH_SYSTEM_PROMPT,
): Promise<string> {
  const ai = createClient(apiKey);

  const response = await ai.models.generateContent({
    model: modelName,
    contents: toGeminiContents(history, userMessage),
    config: {
      systemInstruction: systemPrompt,
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("Coach returned an empty response. Try again.");
  }

  return text;
}

async function sendWithModelRetries(
  apiKey: string,
  modelName: string,
  history: CoachChatMessage[],
  userMessage: string,
  systemPrompt: string = COACH_SYSTEM_PROMPT,
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await sendWithModel(
        apiKey,
        modelName,
        history,
        userMessage,
        systemPrompt,
      );
    } catch (error) {
      lastError = error;

      if (!isRetriableError(error) || attempt === RETRY_ATTEMPTS - 1) {
        throw error;
      }

      await sleep(RETRY_BASE_MS * (attempt + 1));
    }
  }

  throw lastError ?? new Error(`Model ${modelName} failed after retries.`);
}

export async function sendCoachMessage(
  history: CoachChatMessage[],
  userMessage: string,
  systemPrompt: string = COACH_SYSTEM_PROMPT,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const models = getCoachModels();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      return await sendWithModelRetries(
        apiKey,
        modelName,
        history,
        userMessage,
        systemPrompt,
      );
    } catch (error) {
      lastError = error;

      if (isSkippableModelError(error)) {
        continue;
      }

      if (!isRetriableError(error)) {
        throw error;
      }
    }
  }

  throw (
    lastError ??
    new Error(
      "All Gemini models failed. Set NEXT_PUBLIC_GEMINI_MODEL=gemini-3.5-flash in .env.local and restart.",
    )
  );
}
