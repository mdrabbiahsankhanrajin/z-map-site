const VERSION = 1;

export type TripDetails = { origin: string; days: number | null; budgetBdt: number | null };
export const emptyTripDetails: TripDetails = { origin: "", days: null, budgetBdt: null };

export function customStopId(name: string): string {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean || clean.length > 80 || /[\u0000-\u001f<>]/.test(clean)) throw new Error("Destination name must be 1–80 plain characters");
  return `custom:${clean}`;
}

export function customStopName(id: string): string | null {
  if (!id.startsWith("custom:")) return null;
  const name = id.slice(7);
  return name && name.length <= 80 && name === name.trim() && !/[\u0000-\u001f<>]/.test(name) ? name : null;
}

export function addStop(stops: string[], id: string): string[] {
  return stops.includes(id) ? stops : [...stops, id];
}

export function removeStop(stops: string[], id: string): string[] {
  return stops.filter((stop) => stop !== id);
}

export function moveStop(stops: string[], id: string, direction: -1 | 1): string[] {
  const index = stops.indexOf(id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= stops.length) return stops;
  const ordered = [...stops];
  [ordered[index], ordered[next]] = [ordered[next], ordered[index]];
  return ordered;
}

export function serializeTrip(stops: string[], details: TripDetails = emptyTripDetails): string {
  return JSON.stringify({ version: VERSION, stops, ...details });
}

export function parseTripDetails(raw: string | null): TripDetails {
  if (!raw) return emptyTripDetails;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== VERSION) return emptyTripDetails;
    return {
      origin: "origin" in value && typeof value.origin === "string" && value.origin.length <= 100 ? value.origin : "",
      days: "days" in value && typeof value.days === "number" && Number.isInteger(value.days) && value.days >= 1 && value.days <= 365 ? value.days : null,
      budgetBdt: "budgetBdt" in value && typeof value.budgetBdt === "number" && Number.isFinite(value.budgetBdt) && value.budgetBdt >= 0 && value.budgetBdt <= 1e9 ? value.budgetBdt : null,
    };
  } catch {
    return emptyTripDetails;
  }
}

export function parseTrip(raw: string | null, knownIds: string[]): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("version" in value) || !("stops" in value)) return [];
    if (value.version !== VERSION || !Array.isArray(value.stops)) return [];
    const known = new Set(knownIds);
    return [...new Set(value.stops.filter((id): id is string => typeof id === "string" && (known.has(id) || customStopName(id) !== null)))];
  } catch {
    return [];
  }
}
