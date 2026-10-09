import { describe, expect, it } from "vitest";
import { zoomFocus } from "./zoomFocus";

describe("zoomFocus", () => {
  it("uses the map center when no sheet covers it", () => {
    expect(zoomFocus(1000, 700)).toEqual([500, 350]);
  });

  it("stays above the mobile detail sheet", () => {
    expect(zoomFocus(390, 844, 394)).toEqual([195, 197]);
  });

  it("clamps a sheet edge outside the map", () => {
    expect(zoomFocus(390, 844, 1000)).toEqual([195, 422]);
  });
});
