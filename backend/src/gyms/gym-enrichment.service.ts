import { GoogleGenAI } from "@google/genai";
import { Injectable, Logger } from "@nestjs/common";

export interface ExtractedPricePlan {
  name: string;
  priceText: string;
  period: string | null;
}

export interface GymEnrichment {
  pricePlans: ExtractedPricePlan[];
  amenities: string[];
  /** Short human phrase for least-crowded times, or null when unknown. */
  quietTimes: string | null;
}

const EMPTY: GymEnrichment = {
  pricePlans: [],
  amenities: [],
  quietTimes: null,
};

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_PLANS = 8;
const MAX_AMENITIES = 15;

function buildPrompt(name: string, address: string | null): string {
  return `Using Google Search (and Google's popular-times data when available), find CURRENT, FACTUAL info for this specific gym:
Name: ${name}${address ? `\nAddress: ${address}` : ""}

Return ONLY JSON of this exact shape (no prose, no markdown):
{"pricePlans":[{"name":string,"priceText":string,"period":string|null}],"amenities":[string],"quietTimes":string|null}

Rules:
- Only include facts you actually find in search results for THIS gym at THIS location.
- pricePlans: name = plan name (e.g. "Basic","Monthly"). priceText = price as written (e.g. "$29.99"). period = "month"|"year"|"week"|"day" if stated, else null.
- If you cannot find published prices, return "pricePlans": []. NEVER guess, estimate, or invent prices.
- amenities: facilities clearly mentioned (e.g. "Swimming Pool","Sauna","Steam Room","Group Classes","Personal Training","24/7 Access","Parking","Pool","Spa"). Title Case. Max 15.
- quietTimes: ONE short phrase for when it is typically LEAST crowded (e.g. "Weekday mornings before 9am and after 8pm"). Use popular-times/reviews. If unknown, null. Never guess.
- Omit anything you are not confident about.`;
}

/**
 * Pure, defensive parser for the model's JSON. Tolerates code fences and junk;
 * returns empty enrichment on any problem rather than throwing.
 */
export function parseEnrichmentJson(raw: string): GymEnrichment {
  if (!raw) {
    return EMPTY;
  }
  // Strip ```json fences and grab the outermost object.
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    return EMPTY;
  }

  let data: unknown;
  try {
    data = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return EMPTY;
  }
  if (!data || typeof data !== "object") {
    return EMPTY;
  }

  const obj = data as {
    pricePlans?: unknown;
    amenities?: unknown;
    quietTimes?: unknown;
  };

  const pricePlans: ExtractedPricePlan[] = Array.isArray(obj.pricePlans)
    ? obj.pricePlans
        .map((p) => {
          const plan = p as Record<string, unknown>;
          const name = typeof plan.name === "string" ? plan.name.trim() : "";
          const priceText =
            typeof plan.priceText === "string" ? plan.priceText.trim() : "";
          if (!priceText) {
            return null;
          }
          return {
            name: (name || "Membership").slice(0, 60),
            priceText: priceText.slice(0, 60),
            period:
              typeof plan.period === "string" && plan.period.trim()
                ? plan.period.trim().toLowerCase().slice(0, 12)
                : null,
          } satisfies ExtractedPricePlan;
        })
        .filter((p): p is ExtractedPricePlan => p !== null)
        .slice(0, MAX_PLANS)
    : [];

  const seen = new Set<string>();
  const amenities: string[] = Array.isArray(obj.amenities)
    ? obj.amenities
        .map((a) => (typeof a === "string" ? a.trim().slice(0, 40) : ""))
        .filter((a) => {
          const key = a.toLowerCase();
          if (!a || seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        })
        .slice(0, MAX_AMENITIES)
    : [];

  let quietTimes: string | null = null;
  if (typeof obj.quietTimes === "string") {
    const q = obj.quietTimes.trim();
    // The model is told to use null when unknown; guard the common stand-ins.
    if (q && !/^(unknown|n\/?a|none|null)$/i.test(q)) {
      quietTimes = q.slice(0, 120);
    }
  }

  return { pricePlans, amenities, quietTimes };
}

@Injectable()
export class GymEnrichmentService {
  private readonly logger = new Logger(GymEnrichmentService.name);

  isEnabled(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  /**
   * Ask Gemini — grounded with live Google Search — for a gym's current price
   * plans and amenities. Grounding keeps answers tied to real search results
   * (not the model's memory), so it won't fabricate prices. Returns empty
   * enrichment (never throws) when disabled or nothing is found.
   */
  async enrich(name: string, address: string | null): Promise<GymEnrichment> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return EMPTY;
    }
    const ai = new GoogleGenAI({ apiKey });
    // Grounded model calls occasionally 503/429 under load — retry briefly.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: buildPrompt(name, address),
          // Grounding can't combine with responseMimeType=json, so we ask for
          // JSON in the prompt and parse it defensively from the text reply.
          config: { tools: [{ googleSearch: {} }], temperature: 0 },
        });
        return parseEnrichmentJson(res.text ?? "");
      } catch (error) {
        const msg = String(error);
        // Only retry transient overload (503). A 429 RESOURCE_EXHAUSTED is a
        // quota/rate cap whose retry delay is far longer than a request can
        // wait — retrying just burns more quota, so bail immediately.
        const retryable = /\b(503|UNAVAILABLE)\b/.test(msg);
        if (!retryable || attempt === 2) {
          this.logger.warn(`Gemini grounded enrich failed for ${name}: ${msg}`);
          return EMPTY;
        }
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
    return EMPTY;
  }
}
