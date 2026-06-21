// Headless preview of the share-card pose backdrops. Run:
//   npx tsx scripts/posePreview.mts
// Writes pose-preview.png at the frontend root.
import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { drawPoseSkeleton, type PoseKind } from "../lib/share/poseArt.ts";

const POSES: PoseKind[] = [
  "standing",
  "squat",
  "press",
  "overhead",
  "pull",
  "curl",
  "hinge",
  "core",
];

const CELL = 360;
const COLS = 4;
const ROWS = 2;
const canvas = createCanvas(CELL * COLS, CELL * ROWS);
const ctx = canvas.getContext("2d");

POSES.forEach((pose, i) => {
  const cx = (i % COLS) * CELL;
  const cy = Math.floor(i / COLS) * CELL;

  // Card background sample.
  const grad = ctx.createLinearGradient(0, cy, 0, cy + CELL);
  grad.addColorStop(0, "#0a0a0b");
  grad.addColorStop(1, "#121216");
  ctx.fillStyle = grad;
  ctx.fillRect(cx, cy, CELL, CELL);

  // Skeleton at the same relative box/alpha the card uses, scaled to the cell.
  drawPoseSkeleton(ctx as unknown as CanvasRenderingContext2D, pose, {
    x: cx + CELL * 0.46,
    y: cy + CELL * 0.3,
    w: CELL * 0.62,
    h: CELL * 0.78,
    color: "#f5b800",
    alpha: 0.1,
  });

  // Brighter standalone copy on the left so the shape is clearly visible.
  drawPoseSkeleton(ctx as unknown as CanvasRenderingContext2D, pose, {
    x: cx + CELL * 0.02,
    y: cy + CELL * 0.18,
    w: CELL * 0.4,
    h: CELL * 0.66,
    color: "#f5b800",
    alpha: 0.85,
  });

  ctx.fillStyle = "#8b8b94";
  ctx.font = "20px sans-serif";
  ctx.fillText(pose, cx + 14, cy + 28);
});

writeFileSync(new URL("../pose-preview.png", import.meta.url), canvas.toBuffer("image/png"));
console.log("wrote pose-preview.png");
