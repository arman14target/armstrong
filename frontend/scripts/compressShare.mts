// Compress public/share/*.png in place with palette quantization.
//   npx tsx scripts/compressShare.mts
import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const dir = fileURLToPath(new URL("../public/share/", import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith(".png"));

let before = 0;
let after = 0;

for (const file of files) {
  const path = join(dir, file);
  const orig = statSync(path).size;
  const out = await sharp(path)
    .png({ palette: true, quality: 80, effort: 10, compressionLevel: 9 })
    .toBuffer();
  // Only keep the compressed version if it's actually smaller.
  if (out.length < orig) {
    writeFileSync(path, out);
  }
  const now = statSync(path).size;
  before += orig;
  after += now;
  console.log(
    `${file.padEnd(22)} ${(orig / 1024).toFixed(0)}KB -> ${(now / 1024).toFixed(0)}KB`,
  );
}

console.log(
  `\ntotal ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB ` +
    `(${(100 - (after / before) * 100).toFixed(0)}% smaller)`,
);
