import { describe, expect, it } from "vitest";
import {
  displayToKg,
  formatWeight,
  kgToLb,
  lbToKg,
  logWeight,
  weightProgress,
} from "@/lib/weight";
import type { WeightEntry } from "@/lib/types";

describe("unit conversion", () => {
  it("round-trips kg ↔ lb", () => {
    expect(lbToKg(kgToLb(80))).toBeCloseTo(80, 6);
  });

  it("displayToKg reverses the display unit", () => {
    expect(displayToKg(176.37, "lb")).toBeCloseTo(80, 1);
    expect(displayToKg(80, "kg")).toBe(80);
  });

  it("formats with the unit and trims trailing .0", () => {
    expect(formatWeight(72, "kg")).toBe("72 kg");
    expect(formatWeight(72.45, "kg")).toBe("72.5 kg");
    expect(formatWeight(80, "lb")).toBe("176.4 lb");
  });
});

describe("logWeight", () => {
  it("appends and keeps the log sorted oldest → newest", () => {
    let log = logWeight(undefined, 80, "2026-06-20");
    log = logWeight(log, 79, "2026-06-22");
    log = logWeight(log, 79.5, "2026-06-21");
    expect(log.map((e) => e.date)).toEqual([
      "2026-06-20",
      "2026-06-21",
      "2026-06-22",
    ]);
  });

  it("overwrites a same-day entry rather than duplicating", () => {
    let log = logWeight(undefined, 80, "2026-06-20");
    log = logWeight(log, 79.2, "2026-06-20");
    expect(log).toHaveLength(1);
    expect(log[0].weightKg).toBe(79.2);
  });
});

describe("weightProgress", () => {
  const log: WeightEntry[] = [
    { date: "2026-06-01", weightKg: 85 },
    { date: "2026-06-15", weightKg: 82 },
    { date: "2026-06-22", weightKg: 80 },
  ];

  it("returns null with no entries", () => {
    expect(weightProgress([], "cut")).toBeNull();
  });

  it("reports loss as on-track for a cut", () => {
    const p = weightProgress(log, "cut")!;
    expect(p.startKg).toBe(85);
    expect(p.currentKg).toBe(80);
    expect(p.deltaKg).toBe(-5);
    expect(p.towardGoal).toBe(true);
  });

  it("reports loss as off-track for a bulk", () => {
    expect(weightProgress(log, "bulk")!.towardGoal).toBe(false);
  });

  it("computes percent toward a target", () => {
    // start 85 → target 75 is a 10kg drop; at 80 that's 5kg = 50%.
    const p = weightProgress(log, "cut", 75)!;
    expect(p.percentToTarget).toBe(50);
    expect(p.targetKg).toBe(75);
  });

  it("clamps percent within 0–100 when overshooting", () => {
    const overshoot: WeightEntry[] = [
      { date: "2026-06-01", weightKg: 85 },
      { date: "2026-06-22", weightKg: 70 },
    ];
    expect(weightProgress(overshoot, "cut", 75)!.percentToTarget).toBe(100);
  });
});
