import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatPriceTier,
  mapsLink,
  type Gym,
} from "@/lib/gymFinder";

function gym(partial: Partial<Gym>): Gym {
  return {
    id: "1",
    name: "Test Gym",
    address: null,
    latitude: null,
    longitude: null,
    distanceMeters: null,
    category: null,
    rating: null,
    priceTier: null,
    tel: null,
    website: null,
    photoUrl: null,
    ...partial,
  };
}

describe("formatDistance", () => {
  it("formats metres under 1km", () => {
    expect(formatDistance(540, "km")).toBe("540 m");
  });

  it("formats km with one decimal under 10km", () => {
    expect(formatDistance(1234, "km")).toBe("1.2 km");
    expect(formatDistance(15000, "km")).toBe("15 km");
  });

  it("formats miles for imperial users", () => {
    expect(formatDistance(1609.344, "mi")).toBe("1.0 mi");
    expect(formatDistance(32186.88, "mi")).toBe("20 mi");
  });

  it("returns null when distance is unknown", () => {
    expect(formatDistance(null, "km")).toBeNull();
  });
});

describe("formatPriceTier", () => {
  it("maps 1–4 to dollar signs", () => {
    expect(formatPriceTier(1)).toBe("$");
    expect(formatPriceTier(3)).toBe("$$$");
    expect(formatPriceTier(4)).toBe("$$$$");
  });

  it("returns null for missing/invalid tiers", () => {
    expect(formatPriceTier(null)).toBeNull();
    expect(formatPriceTier(0)).toBeNull();
  });
});

describe("mapsLink", () => {
  it("uses coordinates when available", () => {
    expect(mapsLink(gym({ latitude: 30.27, longitude: -97.74 }))).toBe(
      "https://www.google.com/maps/search/?api=1&query=30.27,-97.74",
    );
  });

  it("falls back to name + address query", () => {
    const link = mapsLink(gym({ name: "Iron Temple", address: "1 Main St" }));
    expect(link).toContain("Iron%20Temple%201%20Main%20St");
  });
});
