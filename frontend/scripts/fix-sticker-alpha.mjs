import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const STICKER_DIR = path.resolve("public/images/day-stickers");

function isBackgroundPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;

  if (saturation > 40) {
    return false;
  }

  if (max < 28) {
    return true;
  }

  if (min > 165 && max > 190) {
    return true;
  }

  if (max < 185 && min > 60 && max - min < 25) {
    return true;
  }

  return false;
}

async function fixStickerAlpha(fileName) {
  const inputPath = path.join(STICKER_DIR, fileName);
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  const width = info.width;
  const height = info.height;
  const visited = new Uint8Array(width * height);
  const queue = [];

  const pushIfBackground = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const index = y * width + x;
    if (visited[index]) {
      return;
    }

    const offset = index * 4;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];

    if (!isBackgroundPixel(r, g, b)) {
      return;
    }

    visited[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x++) {
    pushIfBackground(x, 0);
    pushIfBackground(x, height - 1);
  }

  for (let y = 0; y < height; y++) {
    pushIfBackground(0, y);
    pushIfBackground(width - 1, y);
  }

  while (queue.length > 0) {
    const index = queue.pop();
    const x = index % width;
    const y = Math.floor(index / width);
    const offset = index * 4;
    pixels[offset + 3] = 0;

    pushIfBackground(x - 1, y);
    pushIfBackground(x + 1, y);
    pushIfBackground(x, y - 1);
    pushIfBackground(x, y + 1);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];

      if (isBackgroundPixel(r, g, b)) {
        pixels[offset + 3] = 0;
      }
    }
  }

  const meta = await sharp(pixels, {
    raw: { width, height, channels: 4 },
  }).metadata();

  await sharp(pixels, {
    raw: { width: meta.width, height: meta.height, channels: 4 },
  })
    .png()
    .toFile(inputPath);

  const { data: out } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let transparent = 0;
  for (let i = 3; i < out.length; i += 4) {
    if (out[i] === 0) {
      transparent++;
    }
  }

  console.log(
    `${fileName}: ${transparent}/${out.length / 4} transparent pixels`,
  );
}

const targets = process.argv.slice(2);

const files =
  targets.length > 0
    ? targets
    : (await readdir(STICKER_DIR)).filter((name) => name.endsWith(".png"));

for (const file of files) {
  await fixStickerAlpha(file);
}
