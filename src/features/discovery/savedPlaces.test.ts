import { describe, expect, it } from "vitest";
import { parseSavedPlaces, serializeSavedPlaces, toggleSavedPlace } from "./savedPlaces";

const known = ["place-a", "place-b", "place-c"];

describe("saved places", () => {
  it("round trips a versioned, ordered set of known places", () => {
    expect(parseSavedPlaces(serializeSavedPlaces(["place-b", "place-a"]), known)).toEqual(["place-b", "place-a"]);
  });

  it("discards malformed, duplicate, and unknown saved IDs", () => {
    expect(parseSavedPlaces(JSON.stringify({ version: 1, ids: ["place-a", "missing", "place-a", null, "place-c"] }), known)).toEqual(["place-a", "place-c"]);
    expect(parseSavedPlaces(JSON.stringify({ version: 2, ids: ["place-a"] }), known)).toEqual([]);
    expect(parseSavedPlaces("{bad", known)).toEqual([]);
  });

  it("toggles a place while preserving the others' order", () => {
    expect(toggleSavedPlace(["place-a"], "place-b")).toEqual(["place-a", "place-b"]);
    expect(toggleSavedPlace(["place-a", "place-b"], "place-a")).toEqual(["place-b"]);
  });
});
