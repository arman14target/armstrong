#!/usr/bin/env node
/** Sync locale file structure from en-US, preserving existing translations. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = path.join(__dirname, "../lib/i18n/locales");

function deepMergeStrings(template, existing) {
  if (
    template &&
    typeof template === "object" &&
    !Array.isArray(template) &&
    existing &&
    typeof existing === "object" &&
    !Array.isArray(existing)
  ) {
    const out = {};
    for (const key of Object.keys(template)) {
      out[key] = deepMergeStrings(template[key], existing[key]);
    }
    return out;
  }
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }
  return template;
}

const en = JSON.parse(
  fs.readFileSync(path.join(LOCALE_DIR, "en-US.json"), "utf8"),
);

const locales = ["en-GB", "de", "de-AT", "de-CH", "es", "fr", "fr-CH", "it"];

for (const locale of locales) {
  const file = path.join(LOCALE_DIR, `${locale}.json`);
  let existing = {};
  if (fs.existsSync(file)) {
    existing = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  const merged = deepMergeStrings(en, existing);
  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`Synced ${locale}.json`);
}

// Regional copies after base langs filled
for (const [from, to] of [
  ["de", "de-AT"],
  ["de", "de-CH"],
  ["fr", "fr-CH"],
]) {
  const src = fs.readFileSync(path.join(LOCALE_DIR, `${from}.json`), "utf8");
  fs.writeFileSync(path.join(LOCALE_DIR, `${to}.json`), src);
  console.log(`Copied ${from} -> ${to}`);
}

console.log("Done.");
