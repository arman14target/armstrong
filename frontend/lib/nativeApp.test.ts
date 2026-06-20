import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

describe("nativeApp", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats /app and /workout as native routes", async () => {
    const { isNativeAllowedRoute } = await import("@/lib/nativeApp");

    expect(isNativeAllowedRoute("/app/")).toBe(true);
    expect(isNativeAllowedRoute("/workout/")).toBe(true);
    expect(isNativeAllowedRoute("/")).toBe(true);
    expect(isNativeAllowedRoute("/blog/")).toBe(false);
    expect(isNativeAllowedRoute("/diet-planner/")).toBe(false);
    expect(isNativeAllowedRoute("/index.html")).toBe(true);
    expect(isNativeAllowedRoute("/app/index.html")).toBe(true);
  });

  it("builds native entry path with trailing slash", async () => {
    const { getNativeAppEntryPath } = await import("@/lib/nativeApp");
    expect(getNativeAppEntryPath()).toBe("/app/");
  });

  it("detects native platform via Capacitor", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    vi.stubGlobal("window", {});

    const { isNativeApp } = await import("@/lib/nativeApp");
    expect(isNativeApp()).toBe(true);
  });
});
