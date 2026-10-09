import { describe, expect, it } from "vitest";
import countries from "./countries.json";
import districts from "./districts.json";

describe("checked-in geography", () => {
  it("has unique, named country or territory IDs and includes Bangladesh", () => {
    expect(countries.length).toBeGreaterThan(200);
    expect(new Set(countries.map((place) => place.id)).size).toBe(countries.length);
    expect(countries.find((place) => place.id === "BGD")?.name).toBe("Bangladesh");
  });

  it("contains exactly 64 unique Bangladesh district boundaries", () => {
    expect(districts).toHaveLength(64);
    expect(new Set(districts.map((place) => place.id)).size).toBe(64);
    expect(districts.every((place) => place.name && place.id.startsWith("BGD-ADM2-"))).toBe(true);
  });
});
