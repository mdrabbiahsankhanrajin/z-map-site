import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Feature = { properties: { id: string; [key: string]: unknown }; geometry: unknown };
type Collection = { features: Feature[] };
const read = (name: string): Collection => JSON.parse(readFileSync(`public/data/${name}`, "utf8"));

describe("World display boundaries", () => {
  it("uses the district-union Bangladesh outline and matching regional seams without changing map IDs", () => {
    const source = read("world.geojson");
    const display = read("world-display.geojson");
    const context = read("bd-context-display.geojson");
    const outline = read("bd-outline.geojson");
    const byId = (features: Feature[]) => new Map(features.map((feature) => [feature.properties.id, feature]));
    const sourceById = byId(source.features);
    const displayById = byId(display.features);
    const contextById = byId(context.features);
    const alignedIds = new Set(["BGD", "IND", "MMR"]);

    expect(display.features).toHaveLength(source.features.length);
    expect(displayById.size).toBe(sourceById.size);
    expect([...displayById.keys()]).toEqual([...sourceById.keys()]);
    for (const [id, feature] of displayById) {
      expect(feature.properties).toEqual(sourceById.get(id)?.properties);
      expect(feature.geometry).toEqual((alignedIds.has(id) ? contextById.get(id) : sourceById.get(id))?.geometry);
    }
    expect(displayById.get("BGD")?.geometry).toEqual(outline.features[0].geometry);
  });
});
