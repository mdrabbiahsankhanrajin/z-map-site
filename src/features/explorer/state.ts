export type Place = {
  id: string;
  name: string;
  displayName?: string;
  nameBn?: string;
  continent?: string;
  center: number[];
  bounds?: number[];
};

const STORAGE_VERSION = 1;

export function togglePlace(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
}

export function filterPlaces<T extends Place>(places: T[], query: string): T[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return places;
  return places.filter((place) =>
    [place.name, place.displayName, place.nameBn, place.continent].some((value) => value?.toLocaleLowerCase().includes(needle)),
  );
}

export function serializeSelection(selected: string[]): string {
  return JSON.stringify({ version: STORAGE_VERSION, selected });
}

export function parseSavedSelection(raw: string | null, places: Place[], resolveId: (id: string) => string = (id) => id): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("version" in parsed) || !("selected" in parsed)) return [];
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.selected)) return [];
    const known = new Set(places.map((place) => place.id));
    return [...new Set(parsed.selected.filter((id): id is string => typeof id === "string").map(resolveId).filter((id) => known.has(id)))];
  } catch {
    return [];
  }
}
