import type { Place } from "@/features/explorer/state";

export type Region = Place & { type?: string };

export function disambiguateRegions(regions: Region[]): Region[] {
  const byName = new Map<string, Region[]>();
  for (const region of regions) {
    const key = region.name.trim().toLocaleLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), region]);
  }
  return regions.map((region) => {
    const peers = byName.get(region.name.trim().toLocaleLowerCase()) ?? [];
    if (peers.length < 2) return region;
    const typeIsUnique = region.type && peers.filter((peer) => peer.type === region.type).length === 1;
    return { ...region, displayName: `${region.name} · ${typeIsUnique ? region.type : region.id}`, nameBn: undefined };
  });
}
