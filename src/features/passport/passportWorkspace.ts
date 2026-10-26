export const PASSPORT_WORKSPACE_KEY = "atlas:passport-workspace:v1";

export type PassportMemory = {
  date: string;
  note: string;
  favorite: boolean;
};

export type PassportWorkspaceState = {
  excludedVisitKeys: string[];
  memories: Record<string, PassportMemory>;
  pageOrder: string[];
};

export type PassportAchievement = {
  id: string;
  label: string;
  detail: string;
  earned: boolean;
  progress: string;
};

export const emptyPassportWorkspace: PassportWorkspaceState = {
  excludedVisitKeys: [],
  memories: {},
  pageOrder: [],
};

const cleanDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
const cleanNote = (value: unknown) => typeof value === "string" ? [...value.replace(/[\u0000-\u001f\u007f]/g, " ")].slice(0, 240).join("").trim() : "";

export function parsePassportWorkspace(raw: string | null, knownVisitKeys: readonly string[]): PassportWorkspaceState {
  if (!raw) return emptyPassportWorkspace;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1) return emptyPassportWorkspace;
    const record = value as { excludedVisitKeys?: unknown; memories?: unknown; pageOrder?: unknown };
    const known = new Set(knownVisitKeys);
    const excludedVisitKeys = Array.isArray(record.excludedVisitKeys)
      ? [...new Set(record.excludedVisitKeys.filter((key): key is string => typeof key === "string" && known.has(key)))]
      : [];
    const memories: Record<string, PassportMemory> = {};
    if (record.memories && typeof record.memories === "object") {
      for (const [key, memory] of Object.entries(record.memories)) {
        if (!known.has(key) || !memory || typeof memory !== "object") continue;
        const item = memory as { date?: unknown; note?: unknown; favorite?: unknown };
        memories[key] = { date: cleanDate(item.date), note: cleanNote(item.note), favorite: item.favorite === true };
      }
    }
    const pageOrder = Array.isArray(record.pageOrder)
      ? [...new Set(record.pageOrder.filter((key): key is string => typeof key === "string"))].slice(0, 40)
      : [];
    return { excludedVisitKeys, memories, pageOrder };
  } catch {
    return emptyPassportWorkspace;
  }
}

export function serializePassportWorkspace(state: PassportWorkspaceState): string {
  return JSON.stringify({ version: 1, ...state });
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= items.length || to < 0 || to >= items.length || from === to) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function passportAchievements(worldCount: number, districtCount: number, memories: Record<string, PassportMemory>): PassportAchievement[] {
  const total = worldCount + districtCount;
  const storyCount = Object.values(memories).filter((memory) => memory.note).length;
  const datedCount = Object.values(memories).filter((memory) => memory.date).length;
  return [
    { id: "first-stamp", label: "First stamp", detail: "Begin your private Atlas record.", earned: total >= 1, progress: `${Math.min(total, 1)} / 1 place` },
    { id: "field-notes", label: "Field notes", detail: "Add a memory to three marked places.", earned: storyCount >= 3, progress: `${Math.min(storyCount, 3)} / 3 memories` },
    { id: "dated-pages", label: "Dated pages", detail: "Record five visit dates.", earned: datedCount >= 5, progress: `${Math.min(datedCount, 5)} / 5 dates` },
    { id: "district-trail", label: "District trail", detail: "Mark eight Bangladesh districts.", earned: districtCount >= 8, progress: `${Math.min(districtCount, 8)} / 8 districts` },
    { id: "world-curious", label: "World curious", detail: "Mark three world places.", earned: worldCount >= 3, progress: `${Math.min(worldCount, 3)} / 3 places` },
    { id: "two-atlases", label: "Two atlases", detail: "Record both a world place and a Bangladesh district.", earned: worldCount > 0 && districtCount > 0, progress: `${worldCount > 0 ? 1 : 0} + ${districtCount > 0 ? 1 : 0}` },
  ];
}

