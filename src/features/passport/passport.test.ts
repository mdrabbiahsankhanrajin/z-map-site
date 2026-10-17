import { describe, expect, it } from "vitest";
import districts from "../../data/districts.json";
import { worldPlaces } from "../../data/worldPlaces";
import { createPassport, paginatePassport, renderManifestPage, renderPassportCover } from "./passport";

describe("personal passport", () => {
  it("uses only known marked visits and deduplicates them", () => {
    const data = createPassport([worldPlaces[0].id, worldPlaces[0].id, "unknown"], [districts[0].id, "unknown"], "River Reader");
    expect(data.world).toHaveLength(1);
    expect(data.districts).toHaveLength(1);
    expect(data.name).toBe("River Reader");
  });

  it("includes every marked place across manifest pages", () => {
    const data = createPassport(worldPlaces.map((place) => place.id), districts.map((place) => place.id), "");
    const pages = paginatePassport(data);
    expect(pages.flatMap((page) => page.names).length).toBe(worldPlaces.length + districts.length);
    expect(pages.every((page) => page.names.length <= 32)).toBe(true);
  });

  it("escapes optional names in the SVG cover", () => {
    const data = createPassport([], [districts[0].id], "<Atlas & me>");
    const cover = renderPassportCover(data);
    expect(cover).toContain("&lt;Atlas &amp; me&gt;");
    expect(cover).not.toContain("<Atlas & me>");
  });

  it("allows a cover photograph only from a marked district", () => {
    const marked = districts[0];
    const unmarked = districts[1];
    const data = createPassport([], [marked.id], "", unmarked.id);
    expect(data.photo?.place).toBeTruthy();
    expect(data.photo?.place).not.toBe(unmarked.name);
  });

  it("uses a credited editorial cover photo without adding that district to visits", () => {
    const data = createPassport([], [districts[0].id], "", "atlas-cover");
    expect(data.photo?.place).toBe("Satkhira");
    expect(data.photo?.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    expect(data.districts).toHaveLength(1);
  });

  it("uses a credited world photograph when a marked country has one and no district is marked", () => {
    const data = createPassport(["FRA"], [], "");
    expect(data.photo?.place).toBe("France");
    expect(data.photo?.src).toMatch(/^\/images\/world\//);
    expect(data.photo?.sourceUrl).toMatch(/^https:\/\//);
  });

  it("does not print a photo credit when the photo could not load", () => {
    const data = createPassport([], districts.map((district) => district.id), "");
    expect(data.photo).toBeTruthy();
    const cover = renderPassportCover(data);
    expect(cover).not.toContain("Photo:");
  });

  it("keeps source and license URLs off every photographed cover", () => {
    const data = createPassport([], [districts[0].id], "");
    expect(data.photo).toBeTruthy();
    for (const style of ["archive", "expedition", "travelogue"] as const) {
      const cover = renderPassportCover(data, "data:image/jpeg;base64,AA==", undefined, undefined, undefined, style);
      expect(cover).not.toContain(data.photo!.sourceUrl);
      expect(cover).not.toContain(data.photo!.licenseUrl);
      expect(cover).toContain(data.photo!.author);
    }
  });

  it("renders three distinct cover layouts from the same visited data", () => {
    const data = createPassport(["FRA"], [districts[0].id], "Maya");
    const outputs = (["archive", "expedition", "travelogue"] as const).map((style) => renderPassportCover(data, undefined, undefined, undefined, undefined, style));
    expect(new Set(outputs).size).toBe(3);
    for (const output of outputs) {
      expect(output).toContain("BANGLADESH");
      expect(output).toContain(data.districts[0]);
      expect(output).toContain("Maya");
    }
  });

  it("keeps the complete PDF place list while changing page treatment", () => {
    const data = createPassport([], districts.map((district) => district.id), "");
    const page = paginatePassport(data)[0];
    const archive = renderManifestPage(page, 2, "archive");
    const expedition = renderManifestPage(page, 2, "expedition");
    const travelogue = renderManifestPage(page, 2, "travelogue");
    expect(new Set([archive, expedition, travelogue]).size).toBe(3);
    for (const output of [archive, expedition, travelogue]) expect(output).toContain(page.names[0]);
  });
});
