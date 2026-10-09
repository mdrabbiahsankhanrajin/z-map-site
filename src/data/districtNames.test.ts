import { describe, expect, it } from "vitest";
import districts from "./districts.json";
import { districtDisplayName, withDistrictDisplayNames } from "./districtNames";

describe("reviewed district display names", () => {
  it("shows reviewed names without changing source names or stable IDs", () => {
    const presented = withDistrictDisplayNames(districts);
    expect(presented).toHaveLength(64);
    expect(new Set(presented.map((place) => place.id))).toEqual(new Set(districts.map((place) => place.id)));
    expect(presented.find((place) => place.name === "Bogra")?.id).toBe(districts.find((place) => place.name === "Bogra")?.id);
    expect(presented.find((place) => place.name === "Bogra")?.displayName).toBe("Bogura");
    expect(presented.find((place) => place.name === "Nawabganj")?.displayName).toBe("Chapai Nawabganj");
    expect(districtDisplayName("Dhaka")).toBe("Dhaka");
  });

  it("orders the district list by its visible labels", () => {
    const names = withDistrictDisplayNames(districts).map((place) => place.displayName);
    expect(names.indexOf("Chapai Nawabganj")).toBeLessThan(names.indexOf("Chattogram"));
    expect(names.indexOf("Chapai Nawabganj")).toBeGreaterThan(names.indexOf("Chandpur"));
  });
});
