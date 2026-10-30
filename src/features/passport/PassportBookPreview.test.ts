import { describe, expect, it } from "vitest";
import { spreadAnchor, spreadAnchors, spreadPages } from "./PassportBookPreview";

describe("passport physical spreads", () => {
  it("pairs interior pages without pairing the back cover", () => {
    expect(spreadAnchors(6)).toEqual([0, 1, 2, 4, 5]);
    expect(spreadAnchor(2, 6)).toBe(2);
    expect(spreadAnchor(3, 6)).toBe(2);
    expect(spreadAnchor(4, 6)).toBe(4);
    expect(spreadAnchor(5, 6)).toBe(5);
    expect(spreadPages(4, 6)).toEqual({ left: 4, right: null });
  });

  it("keeps odd-page editions on valid spread anchors", () => {
    expect(spreadAnchors(5)).toEqual([0, 1, 2, 4]);
    expect(spreadAnchor(3, 5)).toBe(2);
    expect(spreadPages(3, 5)).toEqual({ left: 2, right: 3 });
  });
});
