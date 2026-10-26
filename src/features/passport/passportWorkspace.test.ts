import { describe, expect, it } from "vitest";
import { moveItem, parsePassportWorkspace, passportAchievements, serializePassportWorkspace } from "./passportWorkspace";

describe("passport workspace", () => {
  it("parses only known visits and sanitizes private memory fields", () => {
    const parsed = parsePassportWorkspace(JSON.stringify({
      version: 1,
      excludedVisitKeys: ["world:BGD", "world:UNKNOWN"],
      memories: {
        "world:BGD": { date: "2025-01-12", note: "River\u0000 memory", favorite: true },
        "world:UNKNOWN": { date: "2025-99-99", note: "ignore", favorite: true },
      },
      pageOrder: ["World places:1", "World places:1", 4],
    }), ["world:BGD"]);

    expect(parsed.excludedVisitKeys).toEqual(["world:BGD"]);
    expect(parsed.memories["world:BGD"]).toEqual({ date: "2025-01-12", note: "River  memory", favorite: true });
    expect(parsed.pageOrder).toEqual(["World places:1"]);
    expect(JSON.parse(serializePassportWorkspace(parsed)).version).toBe(1);
  });

  it("moves pages without mutating the source order", () => {
    const pages = ["cover", "world", "district"];
    expect(moveItem(pages, 2, 1)).toEqual(["cover", "district", "world"]);
    expect(pages).toEqual(["cover", "world", "district"]);
    expect(moveItem(pages, -1, 1)).toEqual(pages);
  });

  it("derives earned stamps only from explicit local progress", () => {
    const stamps = passportAchievements(3, 8, {
      one: { date: "2024-01-01", note: "One", favorite: false },
      two: { date: "2024-02-01", note: "Two", favorite: false },
      three: { date: "2024-03-01", note: "Three", favorite: true },
      four: { date: "2024-04-01", note: "", favorite: false },
      five: { date: "2024-05-01", note: "", favorite: false },
    });
    expect(stamps.every((stamp) => stamp.earned)).toBe(true);
  });
});

