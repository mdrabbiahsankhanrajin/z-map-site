import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import countsJson from "./admin1-counts.json";
import { worldPlaces } from "./worldPlaces";

const counts: Record<string, number> = countsJson;

describe("country region data", () => {
  it("serves named, uniquely identified regions for every advertised country", () => {
    const worldIds = new Set(worldPlaces.map((place) => place.id));
    expect(Object.keys(counts)).toHaveLength(209);
    expect(Object.values(counts).reduce((sum, count) => sum + count, 0)).toBe(4535);
    for (const [country, count] of Object.entries(counts)) {
      expect(worldIds.has(country)).toBe(true);
      expect(count).toBeGreaterThan(1);
      const collection = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "admin1", `${country}.geojson`), "utf8")) as {
        type: string;
        features: { properties: { id: string; name: string; bounds: number[]; center: number[] } }[];
      };
      expect(collection.type).toBe("FeatureCollection");
      expect(collection.features).toHaveLength(count);
      expect(new Set(collection.features.map((feature) => feature.properties.id)).size).toBe(count);
      for (const feature of collection.features) {
        expect(feature.properties.name.length).toBeGreaterThan(0);
        expect(feature.properties.bounds).toHaveLength(4);
        expect(feature.properties.center).toHaveLength(2);
      }
    }
  });

  it("keeps Bangladesh's deeper view and the Palestine editorial grouping", () => {
    expect(counts.BGD).toBeUndefined();
    expect(counts.ISR).toBeUndefined();
    expect(counts.PSX).toBe(8);
  });
});
