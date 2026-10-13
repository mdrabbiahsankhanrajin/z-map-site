import type { Place } from "@/features/explorer/state";

// Camera framing only. The map still draws every source polygon, including islands and territories.
const primaryLandBounds: Record<string, [number, number, number, number]> = {
  CHL: [-75.708, -53.883, -67.009, -17.506],
  FRA: [-4.763, 42.34, 8.14, 51.097],
  NLD: [3.449, 50.75, 7.197, 53.441],
  USA: [-124.71, 25.133, -66.987, 49.37],
};

export function getMapFocusBounds(place: Pick<Place, "id" | "bounds">): [number, number, number, number] {
  const bounds = primaryLandBounds[place.id] ?? place.bounds;
  if (!bounds || bounds.length !== 4) throw new Error(`Missing map bounds for ${place.id}`);
  return [bounds[0], bounds[1], bounds[2], bounds[3]];
}
