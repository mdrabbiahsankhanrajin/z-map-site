import { describe, expect, it } from "vitest";
import districts from "./districts.json";
import { highlights } from "./highlights";

describe("sourced Bangladesh highlights", () => {
  it("uses unique district names from the checked-in boundary set", () => {
    const known = new Set(districts.map((district) => district.name));
    expect(highlights).toHaveLength(14);
    expect(new Set(highlights.map((highlight) => highlight.district)).size).toBe(highlights.length);
    expect(highlights.every((highlight) => known.has(highlight.district))).toBe(true);
  });

  it("links every note to the Bangladesh Tourism Board", () => {
    expect(highlights.every((highlight) =>
      highlight.title && highlight.summary &&
      new URL(highlight.sourceUrl).hostname.replace(/^www\./, "") === "beautifulbangladesh.gov.bd",
    )).toBe(true);
  });
});
