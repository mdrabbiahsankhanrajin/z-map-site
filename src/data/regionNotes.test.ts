import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { regionNotes, featuredRegionForCountry } from "./regionNotes";

describe("photographed world places", () => {
  it("ties each sourced photo to an existing region and local image", () => {
    const countries = new Set<string>();
    for (const [id, note] of Object.entries(regionNotes)) {
      const country = id.split("-")[0];
      const boundaryPath = path.join(process.cwd(), "public", "data", "admin1", `${country}.geojson`);
      expect(existsSync(boundaryPath), `${id} boundary file`).toBe(true);
      const features = JSON.parse(readFileSync(boundaryPath, "utf8")) as { features: { properties: { id: string } }[] };
      expect(features.features.some((item) => item.properties.id === id), id).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", note.image.src)), note.image.src).toBe(true);
      expect(note.sourceUrl.startsWith("https://")).toBe(true);
      expect(note.image.sourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:")).toBe(true);
      expect(note.image.licenseUrl.startsWith("https://")).toBe(true);
      countries.add(country);
    }
    expect(countries.size).toBe(16);
    for (const country of countries) expect(featuredRegionForCountry(country)).toBeTruthy();
  });
});
