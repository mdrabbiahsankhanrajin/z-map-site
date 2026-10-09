import { describe, expect, it } from "vitest";
import countries from "../../data/countries.json";
import districts from "../../data/districts.json";
import { createPublicProfile, decodePublicProfile, encodePublicProfile } from "./profile";

const known = { world: countries.map((place) => place.id), districts: districts.map((place) => place.id) };

describe("public atlas profile", () => {
  it("includes only fields explicitly enabled by the user", () => {
    const profile = createPublicProfile({
      name: "  My atlas  ", includeName: false,
      includeWorld: false, includeDistricts: true,
      world: ["BGD"], districts: [districts[0].id, "unknown", districts[0].id],
    }, known);
    expect(profile).toEqual({ version: 1, districts: [districts[0].id] });
    expect(Object.hasOwn(profile ?? {}, "world")).toBe(false);
    expect(JSON.stringify(profile).includes("My atlas")).toBe(false);
  });

  it("round-trips a bounded profile without timestamps or unknown IDs", () => {
    const profile = createPublicProfile({
      name: "A quiet atlas", includeName: true,
      includeWorld: true, includeDistricts: true,
      world: ["BGD", "NPL"], districts: [districts[1].id],
    }, known);
    expect(profile === null).toBe(false);
    const encoded = encodePublicProfile(profile!);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePublicProfile(encoded, known)).toEqual(profile);
    expect(/timestamp|location|email|ip/i.test(JSON.stringify(profile))).toBe(false);
  });

  it("rejects missing consent, malformed payloads, extra fields and invalid IDs", () => {
    expect(createPublicProfile({ name: "x", includeName: true, includeWorld: false, includeDistricts: false, world: [], districts: [] }, known)).toBeNull();
    expect(decodePublicProfile("bad", known)).toBeNull();
    const bad = btoa(JSON.stringify({ version: 1, world: ["BOGUS"] })).replace(/=/g, "");
    expect(decodePublicProfile(bad, known)).toBeNull();
    const extra = btoa(JSON.stringify({ version: 1, world: ["BGD"], exactLocation: "hidden" })).replace(/=/g, "");
    expect(decodePublicProfile(extra, known)).toBeNull();
  });
});
