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
const WEBP_QUALITY = 82;

let sharp;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

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

const NO_TEXT_SUFFIX =
  "Pure photograph only. Absolutely no text, letters, numbers, words, typography, labels, signs, banners, logos, watermarks, captions, subtitles, or readable writing anywhere in the image.";

/** Visual-only scenes — never pass post titles/descriptions (models render them as text). */
const SLUG_SCENES = {
  "best-high-protein-foods-muscle-growth":
    "overhead food photography of grilled chicken breast, hard boiled eggs, and Greek yogurt in ceramic bowls on dark wooden surface",
  "creatine-benefits-and-side-effects":
    "close-up of white supplement powder in a metal scoop beside a shaker bottle on a black gym bench",
  "how-many-calories-to-lose-weight":
    "kitchen scene with food scale, measuring cup, and portion of rice and chicken under soft window light",
  "full-body-workout-beginners":
    "wide gym shot of barbell on lifting platform with dumbbells, empty training floor",
  "best-home-workout-no-equipment":
    "yoga mat on living room floor with resistance band and water bottle, minimal home interior",
  "walking-vs-running-fat-loss":
    "running shoes on a forest trail at golden hour, shallow depth of field",
  "best-exercises-for-belly-fat":
    "athlete holding a plank on gym mat, side angle, core-focused composition",
  "how-much-protein-per-day":
    "macro meal prep containers with chicken, rice, and broccoli on dark countertop",
  "three-day-gym-workout-busy-professionals":
    "dumbbell rack and gym bench at early morning, empty gym, cinematic lighting",
  "intermittent-fasting-weight-loss":
    "empty white plate and fork on wooden table, moody morning window light",
  "push-pull-legs-routine-for-beginners":
    "barbell bench press station with weight plates, pull-up bar visible in background",
  "bodybuilding-meal-plan-macros-guide":
    "meal prep containers with chicken, sweet potato, and green vegetables, overhead shot",
  "how-to-track-gym-workouts-effectively":
    "gym notebook beside barbell clip and chalk on rubber gym floor, overhead angle",
  "progressive-overload-explained":
    "barbell loaded with weight plates on squat rack, chalk dust in air, dramatic gym lighting",
  "circadian-performance-workout-log-patterns":
    "gym interior at sunrise through large windows, empty squat rack, warm amber light",
  "grip-fatigue-hidden-pull-day-ceiling":
    "close-up of hands gripping a thick barbell during a deadlift, chalk on palms",
  "volume-creep-unconscious-gym-inflation":
    "rows of dumbbells on gym rack, selective focus, dark moody atmosphere",
  "unilateral-asymmetry-when-to-stop-chasing-balance":
    "single dumbbell on gym bench, mirror reflection blurred in background",
  "session-density-vs-total-volume":
    "stopwatch and water bottle beside barbell on gym floor, training session still life",
  "top-20-gyms-new-york-city":
    "modern high-rise gym interior with floor-to-ceiling windows overlooking dense urban skyline at dusk",
  "top-20-gyms-los-angeles":
    "bright open-air fitness terrace with palm trees and golden California sunlight, weight rack in foreground",
  "top-20-gyms-chicago":
    "industrial loft-style gym with exposed brick, squat racks, and cool blue city light through large windows",
  "top-20-gyms-houston":
    "spacious air-conditioned commercial gym with rows of cardio machines and free weights, clean modern interior",
  "top-20-gyms-london":
    "boutique gym in historic brick building with kettlebells and rowing machines, moody British overcast light",
  "top-20-gyms-toronto":
    "sleek urban fitness studio with maple wood accents and city condo skyline visible through glass walls",
  "top-20-gyms-sydney":
    "harbor-side gym balcony with cardio equipment, blue water and opera house silhouette in soft background blur",
  "top-20-gyms-melbourne":
    "laneway-style boutique gym with exposed concrete, graffiti art walls, and specialty barbells",
  "top-20-gyms-phoenix":
    "desert-modern gym with sandstone tones, natural light, and drought-tolerant landscaping visible through windows",
  "top-20-gyms-philadelphia":
    "classic American iron gym with vintage plate-loaded machines and worn leather benches, gritty atmosphere",
  "top-20-gyms-dallas":
    "large Texas-style fitness center with wide open floor plan, turf zone, and power racks under bright lights",
  "top-20-gyms-vancouver":
    "mountain-view gym with snow-capped peaks through panoramic windows, yoga mats and dumbbells in foreground",
  "top-20-gyms-brisbane":
    "subtropical riverside gym with open ventilation, tropical plants, and river cityscape in background",
  "top-20-gyms-san-diego":
    "coastal California gym with ocean breeze feel, functional training rig and kettlebells near sunny windows",
  "top-20-gyms-dublin":
    "compact European city gym with green accent walls, rowing ergs, and rainy street visible through window",
  "planet-fitness-membership-guide":
    "large bright commercial gym cardio floor with rows of treadmills and purple accent lighting, budget fitness center atmosphere",
  "la-fitness-membership-guide":
    "spacious American gym with free weight area, squat racks, and indoor lap pool visible through glass partition",
  "anytime-fitness-membership-guide":
    "compact 24-hour neighbourhood gym with keycard entry door, dumbbell rack and single squat rack under fluorescent lighting",
  "puregym-membership-guide":
    "modern UK budget gym in retail park unit with yellow accent equipment, squat racks and cardio machines, overcast daylight",
  "equinox-membership-guide":
    "luxury boutique gym interior with designer lighting, premium wood and leather finishes, high-end weight floor empty and immaculate",
};

const DEFAULT_SCENE =
  "editorial fitness photograph, gym equipment, atmospheric lighting, no people in close-up";

function visualSceneFromSlug(slug) {
  return SLUG_SCENES[slug] ?? DEFAULT_SCENE;
}

function buildPrompt(slug) {
  const scene = visualSceneFromSlug(slug);
  return [
    "Editorial fitness photograph for a strength training blog.",
    scene,
    "Dark moody gym atmosphere with warm golden amber accent lighting, cinematic depth, professional magazine quality.",
    "Photorealistic, no faces in close-up.",
    NO_TEXT_SUFFIX,
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

async function optimizeImage(jpegBuffer) {
  if (!sharp) {
    return { buffer: jpegBuffer, extension: ".jpg" };
  }

  try {
    const webpBuffer = await sharp(jpegBuffer)
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
    return { buffer: webpBuffer, extension: ".webp" };
  } catch {
    return { buffer: jpegBuffer, extension: ".jpg" };
  }
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

    const prompt = buildPrompt(slugId);
    console.log(`generate ${slugId}...`);

    try {
      const { buffer: jpegBuffer } = await generateImage(cloudflare, prompt);
      const { buffer, extension } = await optimizeImage(jpegBuffer);
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
