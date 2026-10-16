import { describe, expect, it } from "vitest";
import { attractions } from "../../data/attractions";
import { seasonalCollections } from "./seasonalPlaces";

describe("seasonal discovery", () => {
  it("uses unique photographed places with direct source links in each collection", () => {
    const known = new Set(attractions.map((place) => place.id));
    for (const season of seasonalCollections) {
      expect(season.places.length).toBeGreaterThan(0);
      expect(new Set(season.places.map((place) => place.id)).size).toBe(season.places.length);
      for (const place of season.places) {
        expect(known.has(place.id)).toBe(true);
        expect(place.sourceUrl).toMatch(/^https:\/\/www\.beautifulbangladesh\.gov\.bd\//);
        expect(place.note.length).toBeGreaterThan(20);
      }
    }
  });
});
