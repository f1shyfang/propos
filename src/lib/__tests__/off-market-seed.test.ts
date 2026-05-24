import { describe, expect, it } from "vitest";

import { buildOffMarketRow, buildPriceGuide } from "../seed/off-market-seed";

describe("buildPriceGuide", () => {
  it("returns a band below and above the anchor", () => {
    const { priceMin, priceMax } = buildPriceGuide(1_000_000);
    expect(priceMin).toBeLessThan(1_000_000);
    expect(priceMax).toBeGreaterThan(1_000_000);
    expect(priceMin).toBeLessThan(priceMax);
  });
});

describe("buildOffMarketRow", () => {
  it("maps portal property into off-market fields with images", () => {
    const row = buildOffMarketRow(
      {
        id: "test-1",
        address: "12 Bay Street",
        suburb: "Mosman",
        state: "NSW",
        propertyType: "house",
        bedrooms: 4,
        bathrooms: 2,
        parkingSpaces: 2,
        landSize: 450,
        price: 2_400_000,
        appraisedValue: 2_500_000,
        images: ["https://example.com/photo.jpg"],
      },
      0,
      "agent-1",
    );

    expect(row.address).toBe("12 Bay Street");
    expect(row.suburb).toBe("Mosman");
    expect(row.priceMin).toBeLessThan(row.priceMax!);
    expect(row.images).toEqual(["https://example.com/photo.jpg"]);
    expect(row.agentId).toBe("agent-1");
    expect(row.expectedListingDate).toBeInstanceOf(Date);
  });
});
