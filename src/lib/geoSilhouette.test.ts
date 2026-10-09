import { describe, expect, it } from "vitest";
import { geoSilhouette, type OutlineGeometry } from "./geoSilhouette";

describe("geo silhouette", () => {
  it("fits a polygon in the thumbnail and closes the path", () => {
    const square: OutlineGeometry = { type: "Polygon", coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] };
    const path = geoSilhouette([square]);
    expect(path).toMatch(/^M/);
    expect(path).toMatch(/Z$/);
    expect(path.includes("NaN")).toBe(false);
  });

  it("keeps separated polygons and wraps a dateline crossing", () => {
    const islands: OutlineGeometry = { type: "MultiPolygon", coordinates: [[[[179, 0], [180, 0], [180, 1], [179, 0]]], [[[-180, 0], [-179, 0], [-179, 1], [-180, 0]]]] };
    expect(geoSilhouette([islands]).match(/M/g)).toHaveLength(2);
    expect(geoSilhouette([islands]).includes("NaN")).toBe(false);
  });
});
