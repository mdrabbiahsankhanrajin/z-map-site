import { divisions, divisionForDistrict } from "../../data/divisions";
import type { Place } from "../explorer/state";

export type ProgressRow = { name: string; total: number; visited: number };

export function progressByContinent(places: Place[], selectedIds: string[]): ProgressRow[] {
  const selected = new Set(selectedIds);
  const rows = new Map<string, ProgressRow>();
  for (const place of places) {
    const name = !place.continent || place.continent === "Seven seas (open ocean)" ? "Other areas" : place.continent;
    const row = rows.get(name) ?? { name, total: 0, visited: 0 };
    row.total += 1;
    if (selected.has(place.id)) row.visited += 1;
    rows.set(name, row);
  }
  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function progressByDivision(places: Place[], selectedIds: string[]): ProgressRow[] {
  const selected = new Set(selectedIds);
  const rows = divisions.map((division) => ({ name: division.name, total: 0, visited: 0 }));
  const byName = new Map(rows.map((row) => [row.name, row]));
  for (const place of places) {
    const division = divisionForDistrict(place.name);
    if (!division) continue;
    const row = byName.get(division);
    if (!row) continue;
    row.total += 1;
    if (selected.has(place.id)) row.visited += 1;
  }
  return rows;
}
