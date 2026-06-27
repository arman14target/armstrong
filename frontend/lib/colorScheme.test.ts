import { describe, expect, it } from "vitest";
import { blogThemeColor, resolveColorScheme } from "./colorScheme";

describe("resolveColorScheme", () => {
  it("maps OS light preference to light", () => {
    expect(resolveColorScheme(true)).toBe("light");
  });

  it("maps OS dark preference to dark", () => {
    expect(resolveColorScheme(false)).toBe("dark");
  });
});

describe("blogThemeColor", () => {
  it("returns distinct chrome colors per scheme", () => {
    expect(blogThemeColor("light")).not.toBe(blogThemeColor("dark"));
  });
});
