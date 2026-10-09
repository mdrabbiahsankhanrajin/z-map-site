import { describe, expect, it } from "vitest";
import districts from "../../data/districts.json";
import { progressByContinent, progressByDivision } from "./stats";

describe("private atlas insights", () => {
  it("counts country visits by continent without losing unmapped places", () => {
    const places = [
      { id: "a", name: "A", center: [0, 0], continent: "Asia" },
      { id: "b", name: "B", center: [0, 0], continent: "Asia" },
      { id: "c", name: "C", center: [0, 0], continent: "Seven seas (open ocean)" },
    ];
    expect(progressByContinent(places, ["a", "c", "unknown"])).toEqual([
      { name: "Asia", total: 2, visited: 1 },
      { name: "Other areas", total: 1, visited: 1 },
    ]);
  });

  it("reconciles every Bangladesh district to exactly one division", () => {
    const dhaka = districts.find((place) => place.name === "Dhaka");
    expect(dhaka).toBeDefined();
    const rows = progressByDivision(districts, [dhaka!.id]);
    expect(rows.reduce((sum, row) => sum + row.total, 0)).toBe(64);
    expect(rows.reduce((sum, row) => sum + row.visited, 0)).toBe(1);
    expect(rows.find((row) => row.name === "Dhaka")?.visited).toBe(1);
  });
});
