import { describe, expect, it } from "vitest";
import { disambiguateRegions, type Region } from "./disambiguateRegions";

const region = (id: string, name: string, type: string): Region => ({ id, name, type, center: [0, 0] });

describe("region labels", () => {
  it("uses the source type when repeated names have different types", () => {
    expect(disambiguateRegions([region("a", "Cork", "City"), region("b", "Cork", "County")]).map((item) => item.displayName)).toEqual(["Cork · City", "Cork · County"]);
  });

  it("uses stable source IDs when repeated names share a type", () => {
    expect(disambiguateRegions([region("a", "Parwan", "Province"), region("b", "Parwan", "Province")]).map((item) => item.displayName)).toEqual(["Parwan · a", "Parwan · b"]);
  });

  it("does not repeat an ambiguous translated name", () => {
    const items = disambiguateRegions([{ ...region("a", "Cork", "City"), nameBn: "কাউন্টি কর্ক" }, region("b", "Cork", "County")]);
    expect(items[0].nameBn).toBeUndefined();
  });
});
