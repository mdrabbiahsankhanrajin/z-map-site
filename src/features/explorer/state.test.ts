import { describe, expect, it } from "vitest";
import {
  filterPlaces,
  parseSavedSelection,
  serializeSelection,
  togglePlace,
  type Place,
} from "./state";

const places: Place[] = [
  { id: "BGD", name: "Bangladesh", nameBn: "বাংলাদেশ", continent: "Asia", center: [90, 24] },
  { id: "NPL", name: "Nepal", nameBn: "নেপাল", continent: "Asia", center: [84, 28] },
];

describe("explorer state", () => {
  it("toggles stable IDs without duplicates", () => {
    expect(togglePlace(["BGD"], "NPL")).toEqual(["BGD", "NPL"]);
    expect(togglePlace(["BGD"], "BGD")).toEqual([]);
  });

  it("filters English and Bangla names", () => {
    expect(filterPlaces(places, "bang").map((p) => p.id)).toEqual(["BGD"]);
    expect(filterPlaces(places, "নেপাল").map((p) => p.id)).toEqual(["NPL"]);
  });

  it("finds a reviewed display name while retaining the boundary name", () => {
    const district: Place = { id: "stable-bogra-id", name: "Bogra", displayName: "Bogura", center: [89, 25] };
    expect(filterPlaces([district], "Bogura").map((place) => place.id)).toEqual(["stable-bogra-id"]);
    expect(filterPlaces([district], "Bogra").map((place) => place.id)).toEqual(["stable-bogra-id"]);
  });

  it("accepts only known IDs from the current storage version", () => {
    const raw = JSON.stringify({ version: 1, selected: ["BGD", "BOGUS", "BGD"] });
    expect(parseSavedSelection(raw, places)).toEqual(["BGD"]);
    expect(parseSavedSelection(JSON.stringify({ version: 0, selected: ["BGD"] }), places)).toEqual([]);
    expect(parseSavedSelection("broken", places)).toEqual([]);
    expect(parseSavedSelection(null, places)).toEqual([]);
    expect(parseSavedSelection(serializeSelection(["NPL"]), places)).toEqual(["NPL"]);
  });
});
