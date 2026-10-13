import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import districts from "./districts.json";
import { attractions } from "./attractions";

describe("curated attractions", () => {
  it("has unique stable IDs, valid districts, and independently credited local photographs", () => {
    const names = new Set(districts.map((district) => district.name));
    expect(new Set(attractions.map((item) => item.id)).size).toBe(attractions.length);
    expect(new Set(attractions.map((item) => item.district))).toEqual(names);
    for (const item of attractions) {
      expect(names.has(item.district)).toBe(true);
      expect(item.sourceUrl).toMatch(/^https:\/\//);
      expect(item.image.src).toMatch(/^\/images\/attractions\/[a-z-]+\.jpg$/);
      expect(item.image.author.length).toBeGreaterThan(0);
      expect(item.image.licenseUrl).toMatch(/^https:\/\//);
      expect(item.image.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(existsSync(path.join(process.cwd(), "public", item.image.src.slice(1)))).toBe(true);
    }
  });
});
