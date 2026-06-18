#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, "posts");
const IMAGES_DIR = path.join(ROOT, "public", "images", "blog");
const ENV_FILE = path.join(ROOT, ".env.local");

const DEFAULT_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const IMAGE_WIDTH = 1280;
const IMAGE_HEIGHT = 720;

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

function buildPrompt(title, description) {
  return [
    "Editorial fitness photograph for a strength training blog article.",
    `Topic: ${title}.`,
    description,
    "Dark moody gym atmosphere with warm golden amber accent lighting, cinematic depth, professional magazine quality.",
    "Photorealistic, no text, no logos, no watermarks, no faces in close-up.",
  ].join(" ");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function getCloudflareConfig() {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken =
    process.env.CLOUDFLARE_API_TOKEN?.trim() ||
    process.env.CLOUDFLARE_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDFLARE_API_KEY?.trim();
  const model = process.env.CLOUDFLARE_IMAGE_MODEL?.trim() || DEFAULT_MODEL;

  if (!accountId || !apiToken) {
    console.error(
      "Missing Cloudflare credentials. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to .env.local.",
    );
    console.error(
      "Create a Workers AI token: https://dash.cloudflare.com/?to=/:account/ai/workers-ai",
    );
    console.error(
      "REST API guide: https://developers.cloudflare.com/workers-ai/get-started/rest-api/",
    );
    process.exit(1);
  }

  return { accountId, apiToken, model };
}

function usesMultipart(model) {
  return model.includes("flux-2");
}

async function generateImage({ accountId, apiToken, model }, prompt) {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  let response;

  if (usesMultipart(model)) {
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("width", String(IMAGE_WIDTH));
    form.append("height", String(IMAGE_HEIGHT));

    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: form,
    });
  } else {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        steps: 4,
      }),
    });
  }

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

  return {
    buffer: Buffer.from(imageBase64, "base64"),
    extension: ".jpg",
  };
}

function updateFrontmatterImage(filePath, imagePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const parsed = matter(source);

  if (parsed.data.image === imagePath) {
    return false;
  }

  parsed.data.image = imagePath;
  const next = matter.stringify(parsed.content, parsed.data);
  fs.writeFileSync(filePath, next);
  return true;
}

function parseArgs(argv) {
  const force = argv.includes("--force");
  const slugFlag = argv.findIndex((arg) => arg === "--slug");
  const slug = slugFlag !== -1 ? argv[slugFlag + 1] : undefined;
  return { force, slug };
}

async function main() {
  loadEnvFile(ENV_FILE);

  const cloudflare = getCloudflareConfig();
  const { force, slug } = parseArgs(process.argv.slice(2));

  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const postFiles = fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !slug || file === `${slug}.md`);

  if (slug && postFiles.length === 0) {
    console.error(`No post found for slug: ${slug}`);
    process.exit(1);
  }

  let generated = 0;
  let skipped = 0;

  console.log(`model: ${cloudflare.model}`);

  for (const file of postFiles) {
    const slugId = file.replace(/\.md$/, "");
    const postPath = path.join(POSTS_DIR, file);

    const { data } = matter(fs.readFileSync(postPath, "utf8"));
    const title = typeof data.title === "string" ? data.title : slugId;
    const description =
      typeof data.description === "string" ? data.description : "";

    const existingImage =
      typeof data.image === "string" ? data.image : undefined;
    const existingAbsPath = existingImage
      ? path.join(ROOT, "public", existingImage.replace(/^\//, ""))
      : path.join(IMAGES_DIR, `${slugId}.jpg`);

    if (!force && existingImage && fs.existsSync(existingAbsPath)) {
      console.log(`skip ${slugId} (image exists)`);
      skipped += 1;
      continue;
    }

    const prompt = buildPrompt(title, description);
    console.log(`generate ${slugId}...`);

    try {
      const { buffer, extension } = await generateImage(cloudflare, prompt);
      const imageRelPath = `/images/blog/${slugId}${extension}`;
      const imageAbsPath = path.join(IMAGES_DIR, `${slugId}${extension}`);

      if (existingImage && existingImage !== imageRelPath) {
        const oldAbsPath = path.join(
          ROOT,
          "public",
          existingImage.replace(/^\//, ""),
        );
        if (fs.existsSync(oldAbsPath) && oldAbsPath !== imageAbsPath) {
          fs.unlinkSync(oldAbsPath);
        }
      }

      fs.writeFileSync(imageAbsPath, buffer);
      updateFrontmatterImage(postPath, imageRelPath);
      console.log(`saved ${imageRelPath}`);
      generated += 1;

      if (generated < postFiles.length) {
        await sleep(1500);
      }
    } catch (error) {
      console.error(`failed ${slugId}:`, getErrorMessage(error));
      process.exitCode = 1;
    }
  }

  console.log(`done: ${generated} generated, ${skipped} skipped`);
}

main();
