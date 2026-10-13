import { describe, expect, it } from "vitest";
import countries from "../../data/countries.json";
import { getMapFocusBounds } from "./mapFocus";

const country = (id: string) => {
  const item = countries.find((place) => place.id === id);
  if (!item) throw new Error(`Missing ${id}`);
  return item;
};

describe("map camera bounds", () => {
  it("frames mainland France instead of its distant territories", () => {
    const [west, south, east, north] = getMapFocusBounds(country("FRA"));
    expect(west).toBeGreaterThan(-6);
    expect(south).toBeGreaterThan(40);
    expect(east).toBeLessThan(10);
    expect(north).toBeLessThan(53);
  });

  it("frames the contiguous United States without crossing the date line", () => {
    const [west, , east] = getMapFocusBounds(country("USA"));
    expect(west).toBeGreaterThan(-130);
    expect(east).toBeLessThan(-60);
  });

  it("keeps the full bounds for ordinary compact countries", () => {
    expect(getMapFocusBounds(country("BGD"))).toEqual(country("BGD").bounds);
  });
});
