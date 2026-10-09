export type PublicProfile = {
  version: 1;
  name?: string;
  world?: string[];
  districts?: string[];
};

type KnownIds = { world: readonly string[]; districts: readonly string[] };
type ProfileInput = {
  name: string;
  includeName: boolean;
  includeWorld: boolean;
  includeDistricts: boolean;
  world: readonly string[];
  districts: readonly string[];
};

function normalize(ids: readonly string[], known: readonly string[]): string[] {
  const allowed = new Set(known);
  return [...new Set(ids.filter((id) => allowed.has(id)))].sort();
}

export function createPublicProfile(input: ProfileInput, known: KnownIds): PublicProfile | null {
  if (!input.includeWorld && !input.includeDistricts) return null;
  const profile: PublicProfile = { version: 1 };
  const name = [...input.name.trim().replace(/[\u0000-\u001f\u007f]/g, "")].slice(0, 60).join("");
  if (input.includeName && name) profile.name = name;
  if (input.includeWorld) profile.world = normalize(input.world, known.world);
  if (input.includeDistricts) profile.districts = normalize(input.districts, known.districts);
  return profile;
}

export function encodePublicProfile(profile: PublicProfile): string {
  const bytes = new TextEncoder().encode(JSON.stringify(profile));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodePublicProfile(encoded: string, known: KnownIds): PublicProfile | null {
  if (!encoded || encoded.length > 12000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0))));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const data = parsed as Record<string, unknown>;
    if (data.version !== 1 || Object.keys(data).some((key) => !["version", "name", "world", "districts"].includes(key))) return null;
    if (!("world" in data) && !("districts" in data)) return null;
    if (data.name !== undefined && (typeof data.name !== "string" || [...data.name].length > 60 || /[\u0000-\u001f\u007f]/.test(data.name))) return null;
    for (const scope of ["world", "districts"] as const) {
      if (!(scope in data)) continue;
      const ids = data[scope];
      const allowed = new Set(known[scope]);
      if (!Array.isArray(ids) || ids.length > allowed.size || ids.some((id) => typeof id !== "string" || !allowed.has(id)) || new Set(ids).size !== ids.length) return null;
    }
    const profile: PublicProfile = { version: 1 };
    if (data.name) profile.name = data.name as string;
    if ("world" in data) profile.world = [...(data.world as string[])].sort();
    if ("districts" in data) profile.districts = [...(data.districts as string[])].sort();
    return profile;
  } catch {
    return null;
  }
}
