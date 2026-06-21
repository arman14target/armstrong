/**
 * Procedural wireframe "skeleton" figure drawn straight onto the share-card
 * canvas — no stored images, no Cloudinary, no CORS. The hero exercise is
 * classified into a pose archetype and rendered as a faint gold stick figure
 * with joint nodes behind the card content.
 */

export type PoseKind =
  | "squat"
  | "press"
  | "overhead"
  | "pull"
  | "curl"
  | "hinge"
  | "core"
  | "standing";

type Pt = [number, number];

interface Pose {
  joints: Record<string, Pt>;
  /** Bone segments as joint-name pairs. */
  bones: [string, string][];
}

// Skeleton topology shared by every pose; poses only move the joints.
const BONES: [string, string][] = [
  ["head", "neck"],
  ["neck", "hip"],
  ["neck", "shoulderL"],
  ["neck", "shoulderR"],
  ["shoulderL", "elbowL"],
  ["elbowL", "wristL"],
  ["shoulderR", "elbowR"],
  ["elbowR", "wristR"],
  ["hip", "kneeL"],
  ["kneeL", "ankleL"],
  ["hip", "kneeR"],
  ["kneeR", "ankleR"],
];

// All coords are normalized 0..1 within the figure's box (x right, y down).
const POSES: Record<PoseKind, Pose> = {
  standing: pose({
    head: [0.5, 0.08],
    neck: [0.5, 0.2],
    hip: [0.5, 0.55],
    shoulderL: [0.4, 0.23],
    shoulderR: [0.6, 0.23],
    elbowL: [0.36, 0.4],
    elbowR: [0.64, 0.4],
    wristL: [0.34, 0.56],
    wristR: [0.66, 0.56],
    kneeL: [0.44, 0.76],
    kneeR: [0.56, 0.76],
    ankleL: [0.44, 0.96],
    ankleR: [0.56, 0.96],
  }),
  // Knees bent, hips down, arms reaching forward.
  squat: pose({
    head: [0.5, 0.16],
    neck: [0.5, 0.28],
    hip: [0.5, 0.6],
    shoulderL: [0.42, 0.31],
    shoulderR: [0.58, 0.31],
    elbowL: [0.32, 0.3],
    elbowR: [0.68, 0.3],
    wristL: [0.22, 0.28],
    wristR: [0.78, 0.28],
    kneeL: [0.34, 0.72],
    kneeR: [0.66, 0.72],
    ankleL: [0.4, 0.96],
    ankleR: [0.6, 0.96],
  }),
  // Arms pressing out in front (bench / push-up / chest press).
  press: pose({
    head: [0.5, 0.1],
    neck: [0.5, 0.22],
    hip: [0.5, 0.56],
    shoulderL: [0.4, 0.25],
    shoulderR: [0.6, 0.25],
    elbowL: [0.3, 0.3],
    elbowR: [0.7, 0.3],
    wristL: [0.18, 0.34],
    wristR: [0.82, 0.34],
    kneeL: [0.44, 0.77],
    kneeR: [0.56, 0.77],
    ankleL: [0.44, 0.97],
    ankleR: [0.56, 0.97],
  }),
  // Arms extended overhead (shoulder / overhead press).
  overhead: pose({
    head: [0.5, 0.18],
    neck: [0.5, 0.3],
    hip: [0.5, 0.6],
    shoulderL: [0.42, 0.33],
    shoulderR: [0.58, 0.33],
    elbowL: [0.4, 0.18],
    elbowR: [0.6, 0.18],
    wristL: [0.42, 0.04],
    wristR: [0.58, 0.04],
    kneeL: [0.45, 0.78],
    kneeR: [0.55, 0.78],
    ankleL: [0.45, 0.97],
    ankleR: [0.55, 0.97],
  }),
  // Arms reaching up and out (pull-up / lat pulldown / row).
  pull: pose({
    head: [0.5, 0.2],
    neck: [0.5, 0.31],
    hip: [0.5, 0.62],
    shoulderL: [0.42, 0.34],
    shoulderR: [0.58, 0.34],
    elbowL: [0.34, 0.2],
    elbowR: [0.66, 0.2],
    wristL: [0.3, 0.05],
    wristR: [0.7, 0.05],
    kneeL: [0.46, 0.79],
    kneeR: [0.54, 0.79],
    ankleL: [0.46, 0.97],
    ankleR: [0.54, 0.97],
  }),
  // Forearms curled up toward the shoulders (biceps curl).
  curl: pose({
    head: [0.5, 0.08],
    neck: [0.5, 0.2],
    hip: [0.5, 0.55],
    shoulderL: [0.4, 0.23],
    shoulderR: [0.6, 0.23],
    elbowL: [0.37, 0.42],
    elbowR: [0.63, 0.42],
    wristL: [0.44, 0.27],
    wristR: [0.56, 0.27],
    kneeL: [0.44, 0.76],
    kneeR: [0.56, 0.76],
    ankleL: [0.44, 0.96],
    ankleR: [0.56, 0.96],
  }),
  // Hip hinge: torso pitched forward, arms hanging (deadlift / RDL).
  hinge: pose({
    head: [0.32, 0.26],
    neck: [0.4, 0.32],
    hip: [0.6, 0.5],
    shoulderL: [0.36, 0.34],
    shoulderR: [0.44, 0.36],
    elbowL: [0.34, 0.5],
    elbowR: [0.42, 0.52],
    wristL: [0.33, 0.66],
    wristR: [0.41, 0.68],
    kneeL: [0.6, 0.72],
    kneeR: [0.66, 0.72],
    ankleL: [0.62, 0.96],
    ankleR: [0.68, 0.96],
  }),
  // Lying / braced core (plank / crunch / leg raise).
  core: pose({
    head: [0.12, 0.5],
    neck: [0.24, 0.52],
    hip: [0.6, 0.56],
    shoulderL: [0.26, 0.46],
    shoulderR: [0.26, 0.58],
    elbowL: [0.22, 0.7],
    elbowR: [0.22, 0.7],
    wristL: [0.24, 0.86],
    wristR: [0.24, 0.86],
    kneeL: [0.8, 0.56],
    kneeR: [0.8, 0.62],
    ankleL: [0.96, 0.56],
    ankleR: [0.96, 0.62],
  }),
};

interface Rule {
  pose: PoseKind;
  keywords: string[];
}

// First match wins — order matters (specific before generic).
const RULES: Rule[] = [
  { pose: "curl", keywords: ["curl"] },
  {
    pose: "overhead",
    keywords: ["overhead", "shoulder press", "military", "ohp", "push press"],
  },
  {
    pose: "pull",
    keywords: ["pull-up", "pull up", "pullup", "chin", "pulldown", "lat", "row"],
  },
  {
    pose: "hinge",
    keywords: ["deadlift", "rdl", "romanian", "hinge", "good morning", "swing"],
  },
  {
    pose: "squat",
    keywords: ["squat", "lunge", "leg press", "split", "step up", "step-up"],
  },
  {
    pose: "press",
    keywords: ["bench", "push-up", "push up", "pushup", "chest", "press", "fly", "dip"],
  },
  {
    pose: "core",
    keywords: ["plank", "crunch", "sit-up", "sit up", "ab ", "abs", "leg raise", "russian"],
  },
];

/**
 * Per-exercise illustrations, matched by name keyword. First match wins, so
 * order is specific → generic. Drawn behind the card; anything unmatched falls
 * back to the procedural wireframe. Paths are under /public; run through
 * withBasePath at use.
 */
const EXERCISE_ILLUSTRATIONS: { keywords: string[]; file: string }[] = [
  { keywords: ["push-up", "push up", "pushup"], file: "/share/push-up.png" },
  { keywords: ["bench", "chest press", "chest fly", "fly", "dip"], file: "/share/bench-press.png" },
  { keywords: ["overhead", "shoulder press", "military", "ohp", "push press"], file: "/share/overhead-press.png" },
  { keywords: ["pull-up", "pull up", "pullup", "chin", "pulldown", "lat "], file: "/share/pull-up.png" },
  { keywords: ["row"], file: "/share/row.png" },
  { keywords: ["curl"], file: "/share/curl.png" },
  { keywords: ["plank", "crunch", "sit-up", "sit up", "leg raise", "russian", "ab "], file: "/share/plank.png" },
  { keywords: ["lunge", "split squat", "step up", "step-up"], file: "/share/lunge.png" },
  { keywords: ["squat", "leg press"], file: "/share/squat.png" },
  { keywords: ["swing", "kettlebell"], file: "/share/kettlebell-swing.png" },
  { keywords: ["deadlift", "rdl", "romanian", "good morning", "hinge"], file: "/share/deadlift.png" },
  { keywords: ["press"], file: "/share/bench-press.png" },
];

/** Pick the illustration for an exercise name, or null if none matches. */
export function pickIllustration(name: string | undefined): string | null {
  const n = (name ?? "").toLowerCase();
  for (const entry of EXERCISE_ILLUSTRATIONS) {
    if (entry.keywords.some((k) => n.includes(k))) {
      return entry.file;
    }
  }
  return null;
}

/** Map an exercise name to a pose archetype. */
export function classifyPose(name: string | undefined): PoseKind {
  const n = (name ?? "").toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => n.includes(k))) {
      return rule.pose;
    }
  }
  return "standing";
}

interface DrawOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alpha: number;
}

/** Draw the skeleton for a pose into a box on the canvas. */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  poseKind: PoseKind,
  { x, y, w, h, color, alpha }: DrawOptions,
): void {
  const pose = POSES[poseKind];
  const px = (jx: number) => x + jx * w;
  const py = (jy: number) => y + jy * h;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(4, w * 0.012);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Bones.
  ctx.beginPath();
  for (const [a, b] of pose.bones) {
    const pa = pose.joints[a];
    const pb = pose.joints[b];
    ctx.moveTo(px(pa[0]), py(pa[1]));
    ctx.lineTo(px(pb[0]), py(pb[1]));
  }
  ctx.stroke();

  // Head ring.
  const head = pose.joints.head;
  const headR = w * 0.06;
  ctx.beginPath();
  ctx.arc(px(head[0]), py(head[1]) - headR * 0.4, headR, 0, Math.PI * 2);
  ctx.stroke();

  // Joint nodes (slightly brighter).
  ctx.globalAlpha = Math.min(1, alpha * 1.6);
  const nodeR = w * 0.016;
  for (const [name, p] of Object.entries(pose.joints)) {
    if (name === "head") {
      continue;
    }
    ctx.beginPath();
    ctx.arc(px(p[0]), py(p[1]), nodeR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function pose(joints: Record<string, Pt>): Pose {
  return { joints, bones: BONES };
}
