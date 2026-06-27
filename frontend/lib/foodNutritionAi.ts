import {
  formatCoachError,
  isGeminiConfigured,
  sendCoachMessage,
} from "@/lib/gemini";

export interface EstimatedFoodNutrition {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const FOOD_NUTRITION_SYSTEM_PROMPT = `You estimate macronutrients from natural-language meal descriptions.

Respond with ONLY valid JSON — no markdown, no commentary:
{"name":"short meal label","calories":0,"proteinG":0,"carbsG":0,"fatG":0}

Rules:
- Parse weights and portions from the user's text (g, oz, cups, pieces, etc.)
- Round every number to a whole integer
- name: concise summary (e.g. "Chicken breast & rice")
- Use standard nutrition knowledge for common foods
- If an amount is unclear, assume a typical single serving for that food`;

function roundMacro(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  const codeMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) {
    try {
      return JSON.parse(codeMatch[1].trim());
    } catch {
      // fall through
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  return null;
}

function normalizeEstimatedFoodNutrition(
  value: unknown,
): EstimatedFoodNutrition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";

  if (name.length < 2) {
    return null;
  }

  const proteinG = roundMacro(record.proteinG);
  if (proteinG <= 0) {
    return null;
  }

  return {
    name,
    calories: roundMacro(record.calories),
    proteinG,
    carbsG: roundMacro(record.carbsG),
    fatG: roundMacro(record.fatG),
  };
}

export function canEstimateFoodNutrition(): boolean {
  return isGeminiConfigured();
}

export async function estimateFoodNutrition(
  description: string,
): Promise<EstimatedFoodNutrition> {
  const trimmed = description.trim();
  if (trimmed.length < 4) {
    throw new Error("Describe your meal with a bit more detail.");
  }

  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key is not configured.");
  }

  const response = await sendCoachMessage([], trimmed, FOOD_NUTRITION_SYSTEM_PROMPT);
  const parsed = normalizeEstimatedFoodNutrition(parseJsonObject(response));

  if (!parsed) {
    throw new Error("Could not read nutrition from the AI response. Try again.");
  }

  return parsed;
}

export function formatFoodNutritionError(error: unknown): string {
  return formatCoachError(error);
}
