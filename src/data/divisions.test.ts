import { describe, expect, it } from "vitest";
import districts from "./districts.json";
import { divisions, divisionForDistrict } from "./divisions";

describe("Bangladesh division hierarchy", () => {
  it("maps every boundary district to exactly one official division", () => {
    const names = divisions.flatMap((division) => division.districts);
    expect(divisions).toHaveLength(8);
    expect(names).toHaveLength(64);
    expect(new Set(names).size).toBe(64);
    expect(new Set(names)).toEqual(new Set(districts.map((district) => district.name)));
    expect(districts.every((district) => divisionForDistrict(district.name))).toBe(true);
  });

  it("keeps the official division district counts", () => {
    expect(Object.fromEntries(divisions.map(({ name, districts }) => [name, districts.length]))).toEqual({
      Dhaka: 13,
      Khulna: 10,
      Chattogram: 11,
      Rajshahi: 8,
      Sylhet: 4,
      Rangpur: 8,
      Mymensingh: 4,
      Barishal: 6,
    });
  });
});
