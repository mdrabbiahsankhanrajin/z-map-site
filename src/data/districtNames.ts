// Display labels are separate from geoBoundaries names and stable district IDs.
// Reviewed against Bangladesh Bureau of Statistics district publications.
const reviewedNames: Record<string, string> = {
  Barisal: "Barishal",
  Bogra: "Bogura",
  Brahamanbaria: "Brahmanbaria",
  Chittagong: "Chattogram",
  Comilla: "Cumilla",
  Jessore: "Jashore",
  Jhalokati: "Jhalokathi",
  Nawabganj: "Chapai Nawabganj",
};

export function districtDisplayName(boundaryName: string): string {
  return reviewedNames[boundaryName] ?? boundaryName;
}

export function withDistrictDisplayNames<T extends { name: string }>(districts: T[]): Array<T & { displayName: string }> {
  return districts
    .map((district) => ({ ...district, displayName: districtDisplayName(district.name) }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "en"));
}
