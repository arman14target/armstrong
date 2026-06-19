#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, ".env.local");
const OUTPUT = path.join(ROOT, "public", "og-image.jpg");

const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
const WIDTH = 1200;
const HEIGHT = 630;

const PROMPT = [
  "Editorial fitness photograph for a strength training app landing page.",
  "Dark moody gym with barbell, dumbbells, and chalk on rubber floor.",
  "Warm golden amber and cyan accent lighting, cinematic depth, cyber-terminal atmosphere.",
  "Photorealistic, professional magazine quality, wide 1.91:1 composition.",
  "Pure photograph only. Absolutely no text, letters, numbers, words, typography, labels, signs, banners, logos, watermarks, captions, or readable writing anywhere in the image.",
].join(" ");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile(ENV_FILE);

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();

  if (!accountId || !apiToken) {
    console.error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env.local");
    process.exit(1);
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;
  const form = new FormData();
  form.append("prompt", PROMPT);
  form.append("width", String(WIDTH));
  form.append("height", String(HEIGHT));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiToken}` },
    body: form,
  });

  const body = await response.json();

  if (!response.ok || !body.success) {
    const apiError =
      body.errors?.map((item) => item.message).join("; ") ||
      JSON.stringify(body);
    throw new Error(`Cloudflare Workers AI error (${response.status}): ${apiError}`);
  }

  const imageBase64 = body.result?.image;
  if (!imageBase64 || typeof imageBase64 !== "string") {
    throw new Error("Cloudflare Workers AI returned no image data");
  }

  fs.writeFileSync(OUTPUT, Buffer.from(imageBase64, "base64"));
  console.log(`saved ${OUTPUT} (${WIDTH}x${HEIGHT})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
