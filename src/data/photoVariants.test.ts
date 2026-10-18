import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { attractions } from "./attractions";
import { regionNotes } from "./regionNotes";

describe("responsive place photographs", () => {
  it("provides smaller local WebP alternatives for every credited place photo", () => {
    const manifestPath = path.join(process.cwd(), "src/data/photoVariants.json");
    expect(existsSync(manifestPath), "photo variants have been generated").toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, { src: string; width: number; height: number }[]>;
    const originals = [...attractions.map((item) => item.image.src), ...Object.values(regionNotes).map((note) => note.image.src)];
    for (const original of originals) {
      const variants = manifest[original];
      expect(variants, original).toHaveLength(2);
      expect(variants[0].width).toBeLessThanOrEqual(480);
      expect(variants[1].width).toBeLessThanOrEqual(960);
      for (const variant of variants) {
        const file = path.join(process.cwd(), "public", variant.src);
        const bytes = readFileSync(file);
        expect(bytes.toString("ascii", 8, 12), variant.src).toBe("WEBP");
        expect(variant.height).toBeGreaterThan(0);
      }
      expect(statSync(path.join(process.cwd(), "public", variants[0].src)).size, original)
        .toBeLessThan(statSync(path.join(process.cwd(), "public", original)).size);
    }
  });
});
