import countries from "./countries.json";

// Atlas editorial map unit: show both source polygons as one selectable place.
const inheritedArea = countries.find((place) => place.id === "ISR");
const palestineSource = countries.find((place) => place.id === "PSX");
if (!inheritedArea?.bounds || !palestineSource?.bounds) throw new Error("Palestine source geometry is missing");

export function resolveWorldPlaceId(id: string): string {
  return id === "ISR" ? "PSX" : id;
}

export const legacyWorldPlaceIds = ["ISR"];

export const worldPlaces = countries
  .filter((place) => place.id !== "ISR")
  .map((place) => place.id === "PSX"
    ? {
      ...place,
      nameBn: "ফিলিস্তিন",
      bounds: [
        Math.min(inheritedArea.bounds[0], place.bounds[0]),
        Math.min(inheritedArea.bounds[1], place.bounds[1]),
        Math.max(inheritedArea.bounds[2], place.bounds[2]),
        Math.max(inheritedArea.bounds[3], place.bounds[3]),
      ],
    }
    : place)
  .sort((left, right) => left.name.localeCompare(right.name, "en"));
