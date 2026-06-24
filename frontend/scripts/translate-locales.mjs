#!/usr/bin/env node
/**
 * Resumes locale translation from cache. Retries on HTTP 429 with backoff.
 * Run: node scripts/translate-locales.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = path.join(__dirname, "../lib/i18n/locales");
const CACHE_PATH = path.join(LOCALE_DIR, ".translate-cache.json");
const SOURCE = "en-US";

const TARGETS = {
  de: "de|en",
  es: "es|en",
  fr: "fr|en",
  it: "it|en",
};

const BASE_DELAY_MS = 800;
const RATE_LIMIT_WAIT_MS = 60_000;
const MAX_RETRIES = 5;

function flat(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flat(value, full));
    } else {
      out[full] = value;
    }
  }
  return out;
}

function unflat(flatMap) {
  const root = {};
  for (const [dotKey, value] of Object.entries(flatMap)) {
    const parts = dotKey.split(".");
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] ??= {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }
  return root;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function protectInterpolations(text) {
  const tokens = [];
  const safe = text.replace(/\{\{[^}]+\}\}/g, (match) => {
    const id = `__I${tokens.length}__`;
    tokens.push({ id, match });
    return id;
  });
  return { safe, tokens };
}

function restoreInterpolations(text, tokens) {
  let out = text;
  for (const { id, match } of tokens) {
    out = out.replaceAll(id, match);
  }
  return out;
}

async function translateText(text, langpair) {
  const { safe, tokens } = protectInterpolations(text);
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", safe.slice(0, 480));
  url.searchParams.set("langpair", langpair);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn(`Rate limited — waiting ${RATE_LIMIT_WAIT_MS / 1000}s...`);
      await sleep(RATE_LIMIT_WAIT_MS);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.responseStatus === 429) {
      await sleep(RATE_LIMIT_WAIT_MS);
      continue;
    }
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || "translate failed");
    }
    return restoreInterpolations(data.responseData.translatedText, tokens);
  }
  throw new Error("rate limit exceeded after retries");
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function writeLocale(locale, enFlat, cacheLocale) {
  const merged = {};
  for (const key of Object.keys(enFlat)) {
    merged[key] = cacheLocale[key] ?? enFlat[key];
  }
  saveJson(path.join(LOCALE_DIR, `${locale}.json`), unflat(merged));
}

async function main() {
  const enFlat = flat(loadJson(path.join(LOCALE_DIR, `${SOURCE}.json`)));
  const cache = fs.existsSync(CACHE_PATH) ? loadJson(CACHE_PATH) : {};

  for (const [locale, langpair] of Object.entries(TARGETS)) {
    cache[locale] ??= {};
    const existingPath = path.join(LOCALE_DIR, `${locale}.json`);
    if (fs.existsSync(existingPath)) {
      Object.assign(cache[locale], flat(loadJson(existingPath)));
    }

    const keys = Object.keys(enFlat);
    let translated = 0;
    let skipped = 0;

    for (const key of keys) {
      const source = enFlat[key];
      if (typeof source !== "string") continue;

      const existing = cache[locale][key];
      if (existing && existing !== source) {
        skipped++;
        continue;
      }

      try {
        cache[locale][key] = await translateText(source, langpair);
        translated++;
        if (translated % 10 === 0) {
          saveJson(CACHE_PATH, cache);
          writeLocale(locale, enFlat, cache[locale]);
          console.log(`[${locale}] +${translated} new (${skipped} skipped)`);
        }
      } catch (err) {
        console.warn(`[${locale}] ${key}: ${err.message}`);
        cache[locale][key] = source;
      }

      await sleep(BASE_DELAY_MS);
    }

    writeLocale(locale, enFlat, cache[locale]);
    saveJson(CACHE_PATH, cache);
    console.log(`Finished ${locale}.json (${translated} new, ${skipped} skipped)`);
  }

  saveJson(path.join(LOCALE_DIR, "en-GB.json"), loadJson(path.join(LOCALE_DIR, `${SOURCE}.json`)));
  saveJson(path.join(LOCALE_DIR, "de-AT.json"), loadJson(path.join(LOCALE_DIR, "de.json")));
  saveJson(path.join(LOCALE_DIR, "de-CH.json"), loadJson(path.join(LOCALE_DIR, "de.json")));
  saveJson(path.join(LOCALE_DIR, "fr-CH.json"), loadJson(path.join(LOCALE_DIR, "fr.json")));
  console.log("Regional variants updated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
