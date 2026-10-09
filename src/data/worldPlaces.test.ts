import { describe, expect, it } from "vitest";
import countries from "./countries.json";
import { filterPlaces, parseSavedSelection, serializeSelection } from "../features/explorer/state";
import { resolveWorldPlaceId, worldPlaces } from "./worldPlaces";

describe("World map editorial label", () => {
  it("presents the inherited polygon as Palestine without changing stable IDs", () => {
    expect(worldPlaces).toHaveLength(countries.length - 1);
    expect(new Set(worldPlaces.map((place) => place.id))).toEqual(new Set(countries.filter((place) => place.id !== "ISR").map((place) => place.id)));
    expect(worldPlaces.find((place) => place.id === "PSX")).toMatchObject({ name: "Palestine", nameBn: "ফিলিস্তিন" });
    expect(worldPlaces.find((place) => place.id === "PSX")?.bounds).toEqual([34.198, 29.477, 35.888, 33.416]);
    expect(resolveWorldPlaceId("ISR")).toBe("PSX");
    expect(parseSavedSelection(serializeSelection(["ISR", "PSX"]), worldPlaces, resolveWorldPlaceId)).toEqual(["PSX"]);
    expect(worldPlaces.some((place) => place.name === "Israel")).toBe(false);
    expect(filterPlaces(worldPlaces, "Palestine").map((place) => place.id)).toEqual(["PSX"]);
    expect(filterPlaces(worldPlaces, "Israel")).toEqual([]);
  });
});
