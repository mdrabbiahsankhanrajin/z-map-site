import { describe, expect, it } from "vitest";
import { addStop, customStopId, customStopName, moveStop, parseTrip, parseTripDetails, removeStop, serializeTrip } from "./state";

const known = ["lalbagh-fort", "coxs-bazar-beach", "ratargul-swamp"];

describe("local itinerary", () => {
  it("adds once, preserves manual order, moves and removes stops", () => {
    const added = addStop(addStop([], known[0]), known[1]);
    expect(addStop(added, known[0])).toEqual(added);
    expect(moveStop(added, known[1], -1)).toEqual([known[1], known[0]]);
    expect(moveStop(added, known[0], -1)).toEqual(added);
    expect(removeStop(added, known[0])).toEqual([known[1]]);
  });

  it("round trips a versioned trip and discards invalid or unknown saved IDs", () => {
    const trip = [known[1], known[0]];
    expect(parseTrip(serializeTrip(trip), known)).toEqual(trip);
    expect(parseTrip(JSON.stringify({ version: 1, stops: [known[0], "fake", known[0], null] }), known)).toEqual([known[0]]);
    expect(parseTrip('{bad', known)).toEqual([]);
    expect(parseTrip(JSON.stringify({ version: 2, stops: trip }), known)).toEqual([]);
  });

  it("keeps user-entered trip details but rejects nonsensical saved values", () => {
    expect(parseTripDetails(serializeTrip([], { origin: "Dhaka", days: 5, budgetBdt: 12000 })))
      .toEqual({ origin: "Dhaka", days: 5, budgetBdt: 12000 });
    expect(parseTripDetails(JSON.stringify({ version: 1, stops: [], origin: "x".repeat(200), days: -3, budgetBdt: -1 })))
      .toEqual({ origin: "", days: null, budgetBdt: null });
  });

  it("supports safe custom destinations without accepting malformed saved data", () => {
    const id = customStopId("  Rangamati town  ");
    expect(customStopName(id)).toBe("Rangamati town");
    expect(parseTrip(serializeTrip([id, known[0]]), known)).toEqual([id, known[0]]);
    expect(parseTrip(JSON.stringify({ version: 1, stops: ["custom:", "custom:" + "x".repeat(81)] }), known)).toEqual([]);
  });
});
