import { parseEnrichmentJson } from "./gym-enrichment.service";

describe("parseEnrichmentJson", () => {
  it("parses clean JSON", () => {
    const out = parseEnrichmentJson(
      JSON.stringify({
        pricePlans: [
          { name: "Basic", priceText: "$29.99", period: "month" },
          { name: "Annual", priceText: "$299", period: "year" },
        ],
        amenities: ["Swimming Pool", "Sauna"],
      }),
    );
    expect(out.pricePlans).toHaveLength(2);
    expect(out.pricePlans[0]).toEqual({
      name: "Basic",
      priceText: "$29.99",
      period: "month",
    });
    expect(out.amenities).toEqual(["Swimming Pool", "Sauna"]);
  });

  it("strips markdown code fences", () => {
    const out = parseEnrichmentJson(
      '```json\n{"pricePlans":[],"amenities":["Pool"]}\n```',
    );
    expect(out.amenities).toEqual(["Pool"]);
  });

  it("drops price plans with no price text and defaults the name", () => {
    const out = parseEnrichmentJson(
      JSON.stringify({
        pricePlans: [
          { name: "", priceText: "$10" },
          { name: "Premium", priceText: "" },
        ],
        amenities: [],
      }),
    );
    expect(out.pricePlans).toEqual([
      { name: "Membership", priceText: "$10", period: null },
    ]);
  });

  it("dedupes amenities case-insensitively", () => {
    const out = parseEnrichmentJson(
      JSON.stringify({ pricePlans: [], amenities: ["Pool", "pool", "Sauna"] }),
    );
    expect(out.amenities).toEqual(["Pool", "Sauna"]);
  });

  it("caps plans (8) and amenities (15)", () => {
    const out = parseEnrichmentJson(
      JSON.stringify({
        pricePlans: Array.from({ length: 12 }, (_, i) => ({
          name: `P${i}`,
          priceText: `$${i}`,
        })),
        amenities: Array.from({ length: 20 }, (_, i) => `A${i}`),
      }),
    );
    expect(out.pricePlans).toHaveLength(8);
    expect(out.amenities).toHaveLength(15);
  });

  it("parses a quietTimes phrase and nulls out unknown stand-ins", () => {
    expect(
      parseEnrichmentJson(
        JSON.stringify({
          pricePlans: [],
          amenities: [],
          quietTimes: "Weekday mornings before 9am",
        }),
      ).quietTimes,
    ).toBe("Weekday mornings before 9am");

    for (const q of ["UNKNOWN", "n/a", "none", ""]) {
      expect(
        parseEnrichmentJson(
          JSON.stringify({ pricePlans: [], amenities: [], quietTimes: q }),
        ).quietTimes,
      ).toBeNull();
    }
  });

  it("returns empty on garbage or non-JSON", () => {
    expect(parseEnrichmentJson("not json at all")).toEqual({
      pricePlans: [],
      amenities: [],
      quietTimes: null,
    });
    expect(parseEnrichmentJson("")).toEqual({
      pricePlans: [],
      amenities: [],
      quietTimes: null,
    });
    expect(parseEnrichmentJson("{ broken")).toEqual({
      pricePlans: [],
      amenities: [],
      quietTimes: null,
    });
  });
});
