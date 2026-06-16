import { ApiError, GoogleGenAI } from "@google/genai";

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

export const COACH_SYSTEM_PROMPT = `You are a young competitive bodybuilder and strength coach — sharp, chill, a little funny, like a gym bro in his 20s who actually knows training. Talk straight, no corporate fluff.

Style:
- Keep answers short: 1–3 sentences unless the user clearly wants a full breakdown
- Lead with the answer, then one useful tip if needed — don't lecture
- Don't ask a bunch of questions; only ask one if you genuinely can't help without it
- Cool gym energy is fine — light humor, slang — but never cheesy or cringe
- Be supportive, never preachy

You cover workout programming, exercise form, nutrition, supplements (evidence-based only), recovery, and prep — with real gym language.
When unsure, say so. Never diagnose injuries — send them to a doctor or physio. Prefer natural training unless they ask about enhanced athletics.`;

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
    return "Gemini is busy right now (high demand). Wait 10–20 seconds and send again — the app will auto-retry and switch to a backup model.";
  }

  if (isZeroQuotaError(error)) {
    return "Free-tier quota is not active on your Google project. In Google AI Studio, open your project → Set up billing (free tier still costs $0). Then retry, or wait if you hit daily limits.";
  }

  if (isQuotaError(error)) {
    const retryMatch = raw.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      const seconds = Math.ceil(Number.parseFloat(retryMatch[1]));
      return `Rate limit hit. Wait about ${seconds}s and try again. Free tier has daily/minute caps.`;
    }

    return "Rate limit hit on the free tier. Wait a minute and try again.";
  }

  if (raw.includes("API key not valid") || raw.includes("API_KEY_INVALID")) {
    return "Invalid API key. Check NEXT_PUBLIC_GEMINI_API_KEY in .env.local.";
  }

  if (isModelNotFoundError(error)) {
    return "That Gemini model is no longer available. Remove NEXT_PUBLIC_GEMINI_MODEL from .env.local or set it to gemini-3.5-flash, then restart the dev server.";
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
