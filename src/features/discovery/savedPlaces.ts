export const SAVED_PLACES_KEY = "atlas:saved-places:v1";
const VERSION = 1;

export function parseSavedPlaces(raw: string | null, knownIds: string[]): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== VERSION || !("ids" in value) || !Array.isArray(value.ids)) return [];
    const known = new Set(knownIds);
    return [...new Set(value.ids.filter((id): id is string => typeof id === "string" && known.has(id)))];
  } catch {
    return [];
  }
}

export function serializeSavedPlaces(ids: string[]): string {
  return JSON.stringify({ version: VERSION, ids });
}

export function toggleSavedPlace(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}
