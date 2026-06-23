import {
  classifyPose,
  drawPoseSkeleton,
  pickIllustration,
} from "@/lib/share/poseArt";
import type { WorkoutShareSummary } from "@/lib/share/workoutShareSummary";
import { withBasePath } from "@/lib/basePath";

/**
 * Renders a workout share card to a PNG Blob using Canvas2D — no external deps,
 * no DOM-to-image (Tailwind v4 oklch colors break html2canvas). Square 1:1
 * (1080×1080) — the Instagram feed / post format. Branding is typographic so
 * there's no image decode/CORS.
 */

const SIZE = 1080;
const W = SIZE;
const H = SIZE;
const PAD = 80;

const COLORS = {
  // Gold→gray themed backdrop (warm charcoal top → graphite bottom). Kept dark
  // so the light text and surface cards stay legible.
  bgTop: "#1c1813",
  bgMid: "#1a1a1e",
  bgBottom: "#0b0b0d",
  surface: "#16161a",
  line: "#2e2e36",
  gold: "#f5b800",
  orange: "#ff6b35",
  green: "#22d97a",
  text: "#f4f4f5",
  dim: "#8b8b94",
};

// Canvas font stacks. next/font registers these family names; the fallbacks
// keep the card legible if they haven't loaded.
const DISPLAY = '"Barlow Condensed", "Arial Narrow", system-ui, sans-serif';
const BODY = '"DM Sans", system-ui, sans-serif';

const MAX_EXERCISES = 3;

/** Build the PNG. Must run in the browser (uses canvas + document.fonts). */
export async function renderShareCard(
  summary: WorkoutShareSummary,
): Promise<Blob> {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }

  paintBackground(ctx);
  await paintPoseBackdrop(ctx, summary);
  let y = paintHeader(ctx);
  y = paintTitle(ctx, summary, y);
  y = paintHero(ctx, summary, y);
  paintExercises(ctx, summary, y);
  paintFooter(ctx, summary);

  return toBlob(canvas);
}

function paintBackground(ctx: CanvasRenderingContext2D): void {
  // Diagonal gold→gray gradient matching the app theme.
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(0.55, COLORS.bgMid);
  grad.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Warm gold sheen across the upper-left, echoing the app's --shadow-glow.
  const glow = ctx.createRadialGradient(W * 0.32, 0, 0, W * 0.32, 0, 720);
  glow.addColorStop(0, "rgba(245, 184, 0, 0.18)");
  glow.addColorStop(1, "rgba(245, 184, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 760);

  // Subtle orange counter-glow lower-right for depth.
  const ember = ctx.createRadialGradient(W, H, 0, W, H, 620);
  ember.addColorStop(0, "rgba(255, 107, 53, 0.10)");
  ember.addColorStop(1, "rgba(255, 107, 53, 0)");
  ctx.fillStyle = ember;
  ctx.fillRect(0, H - 620, W, 620);
}

/**
 * Backdrop of the hero exercise, behind the content. Uses a hand-drawn
 * illustration when one exists for the pose, else a procedural wireframe.
 * Kept faint so text stays legible.
 */
async function paintPoseBackdrop(
  ctx: CanvasRenderingContext2D,
  summary: WorkoutShareSummary,
): Promise<void> {
  const heroName = summary.exercises[0]?.name ?? summary.workoutName;

  const illustration = pickIllustration(heroName);
  if (illustration) {
    const img = await loadImage(withBasePath(illustration));
    if (img) {
      // Square 1:1 asset, full-bleed. Faint so the stats stay legible.
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.drawImage(img, 0, 0, W, H);
      ctx.restore();
      return;
    }
  }

  // Fallback if no illustration matched (or it fails to load).
  const pose = classifyPose(heroName);
  drawPoseSkeleton(ctx, pose, {
    x: W * 0.46,
    y: H * 0.3,
    w: W * 0.62,
    h: H * 0.78,
    color: COLORS.gold,
    alpha: 0.1,
  });
}

/** Load a same-origin image; resolves null on failure so render never blocks. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function paintHeader(ctx: CanvasRenderingContext2D): number {
  const top = 130;
  ctx.textBaseline = "alphabetic";

  // Wordmark.
  ctx.fillStyle = COLORS.gold;
  ctx.font = `700 52px ${DISPLAY}`;
  ctx.letterSpacing = "7px";
  ctx.textAlign = "left";
  ctx.fillText("ARMSTRONG", PAD, top);
  ctx.letterSpacing = "0px";

  // Gold rule under the wordmark.
  ctx.fillStyle = COLORS.line;
  ctx.fillRect(PAD, top + 28, W - PAD * 2, 2);
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(PAD, top + 28, 130, 2);

  return top + 120;
}

function paintTitle(
  ctx: CanvasRenderingContext2D,
  summary: WorkoutShareSummary,
  y: number,
): number {
  ctx.textAlign = "left";

  ctx.fillStyle = COLORS.text;
  ctx.font = `700 92px ${DISPLAY}`;
  const title = fitText(ctx, summary.workoutName.toUpperCase(), W - PAD * 2);
  ctx.fillText(title, PAD, y);

  ctx.fillStyle = COLORS.dim;
  ctx.font = `500 34px ${BODY}`;
  ctx.fillText(formatDate(summary.dateISO), PAD, y + 48);

  return y + 110;
}

function paintHero(
  ctx: CanvasRenderingContext2D,
  summary: WorkoutShareSummary,
  y: number,
): number {
  const { heroStat } = summary;
  const cardH = 200;
  const accent = heroStat.kind === "pr" ? COLORS.green : COLORS.gold;

  // Surface card.
  ctx.fillStyle = COLORS.surface;
  roundRect(ctx, PAD, y, W - PAD * 2, cardH, 18);
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 2;
  roundRect(ctx, PAD, y, W - PAD * 2, cardH, 18);
  ctx.stroke();

  // Accent bar.
  ctx.fillStyle = accent;
  roundRect(ctx, PAD, y, 10, cardH, 5);
  ctx.fill();

  const innerX = PAD + 50;
  ctx.textAlign = "left";

  ctx.fillStyle = COLORS.dim;
  ctx.font = `600 30px ${BODY}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(heroStat.label.toUpperCase(), innerX, y + 72);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = accent;
  ctx.font = `700 76px ${DISPLAY}`;
  const value = fitText(ctx, heroStat.value, W - innerX - PAD);
  ctx.fillText(value, innerX, y + 152);

  return y + cardH + 56;
}

function paintExercises(
  ctx: CanvasRenderingContext2D,
  summary: WorkoutShareSummary,
  y: number,
): number {
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.dim;
  ctx.font = `600 28px ${BODY}`;
  ctx.letterSpacing = "4px";
  ctx.fillText("EXERCISES", PAD, y);
  ctx.letterSpacing = "0px";

  let rowY = y + 62;
  const shown = summary.exercises.slice(0, MAX_EXERCISES);
  const rowGap = 78;

  for (const ex of shown) {
    ctx.fillStyle = COLORS.text;
    ctx.font = `600 42px ${BODY}`;
    ctx.textAlign = "left";
    const name = fitText(ctx, ex.name, W - PAD * 2 - 300);
    ctx.fillText(name, PAD, rowY);

    ctx.fillStyle = COLORS.gold;
    ctx.font = `600 40px ${DISPLAY}`;
    ctx.textAlign = "right";
    const detail = ex.topSet
      ? `${ex.topSet.weight} kg × ${ex.topSet.reps}`
      : `${ex.setCount} sets`;
    ctx.fillText(detail, W - PAD, rowY);

    // Divider.
    ctx.fillStyle = COLORS.line;
    ctx.fillRect(PAD, rowY + 22, W - PAD * 2, 1);
    rowY += rowGap;
  }

  const extra = summary.exercises.length - shown.length;
  if (extra > 0) {
    ctx.fillStyle = COLORS.dim;
    ctx.font = `500 34px ${BODY}`;
    ctx.textAlign = "left";
    ctx.fillText(`+${extra} more`, PAD, rowY + 4);
  }

  return rowY;
}

function paintFooter(
  ctx: CanvasRenderingContext2D,
  summary: WorkoutShareSummary,
): void {
  const y = H - 120;

  // Stat chips.
  const chips: string[] = [
    `${summary.totalSets} sets`,
    `${Math.round(summary.totalVolume).toLocaleString()} kg`,
  ];
  if (summary.durationSeconds) {
    chips.push(formatDuration(summary.durationSeconds));
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let chipX = PAD;
  const chipY = y - 36;
  for (const text of chips) {
    ctx.font = `600 30px ${BODY}`;
    const tw = ctx.measureText(text).width;
    const cw = tw + 48;
    ctx.fillStyle = COLORS.surface;
    roundRect(ctx, chipX, chipY - 28, cw, 56, 28);
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 2;
    roundRect(ctx, chipX, chipY - 28, cw, 56, 28);
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.fillText(text, chipX + 24, chipY);
    chipX += cw + 20;
  }
  ctx.textBaseline = "alphabetic";

  // Growth payload — always present.
  ctx.fillStyle = COLORS.dim;
  ctx.font = `500 30px ${BODY}`;
  ctx.textAlign = "left";
  ctx.fillText("Tracked with Armstrong · armstrong-fitness.com", PAD, y + 52);
}

// ── helpers ───────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Truncate with an ellipsis so `text` fits `maxWidth` at the current font. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  const ellipsis = "…";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return text.slice(0, lo).trimEnd() + ellipsis;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Best-effort font preload so the canvas paints with brand type. */
async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) {
    return;
  }
  try {
    await Promise.all([
      document.fonts.load(`700 92px "Barlow Condensed"`),
      document.fonts.load(`600 42px "DM Sans"`),
      document.fonts.ready,
    ]);
  } catch {
    // Fallback fonts in the stacks keep the card legible.
  }
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to encode share card"));
      }
    }, "image/png");
  });
}
