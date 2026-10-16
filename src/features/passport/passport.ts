import { attractions } from "../../data/attractions";
import { districtDisplayName } from "../../data/districtNames";
import districts from "../../data/districts.json";
import { worldPlaces } from "../../data/worldPlaces";

export const PASSPORT_WIDTH = 900;
export const PASSPORT_HEIGHT = 1260;

export type PassportPhoto = { src: `/${string}`; district: string; title: string; author: string; license: string; licenseUrl: string; sourceUrl: string };
export type PassportData = { name: string; world: string[]; districts: string[]; photo?: PassportPhoto };
export type ManifestPage = { section: "World places" | "Bangladesh districts"; names: string[]; index: number; total: number };

export function createPassport(worldIds: readonly string[], districtIds: readonly string[], name: string, photoDistrictId?: string): PassportData {
  const world = new Set(worldIds);
  const visitedDistricts = new Set(districtIds);
  const districtEntries = districts.filter((place) => visitedDistricts.has(place.id));
  const photoDistrict = districtEntries.find((place) => place.id === photoDistrictId) ?? districtEntries[0];
  const firstPhoto = photoDistrict && attractions.find((item) => item.district === photoDistrict.name);
  return {
    name: [...name.trim().replace(/[\u0000-\u001f\u007f]/g, "")].slice(0, 40).join(""),
    world: worldPlaces.filter((place) => world.has(place.id)).map((place) => place.name).sort((a, b) => a.localeCompare(b, "en")),
    districts: districtEntries.map((place) => districtDisplayName(place.name)).sort((a, b) => a.localeCompare(b, "en")),
    photo: firstPhoto ? { src: firstPhoto.image.src, district: districtDisplayName(firstPhoto.district), title: firstPhoto.title, author: firstPhoto.image.author, license: firstPhoto.image.license, licenseUrl: firstPhoto.image.licenseUrl, sourceUrl: firstPhoto.image.sourceUrl } : undefined,
  };
}

export function paginatePassport(data: PassportData): ManifestPage[] {
  const pages: ManifestPage[] = [];
  for (const [section, names] of [["World places", data.world], ["Bangladesh districts", data.districts]] as const) {
    const total = Math.ceil(names.length / 32);
    for (let index = 0; index < total; index++) pages.push({ section, names: names.slice(index * 32, (index + 1) * 32), index: index + 1, total });
  }
  return pages;
}

function xml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function frame(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PASSPORT_WIDTH}" height="${PASSPORT_HEIGHT}" viewBox="0 0 ${PASSPORT_WIDTH} ${PASSPORT_HEIGHT}" role="img" aria-label="Atlas passport page">
  <defs><pattern id="grain" width="37" height="37" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r=".7" fill="#b1a488" opacity=".32"/><circle cx="25" cy="28" r=".5" fill="#8e8b75" opacity=".27"/></pattern><pattern id="lines" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)"><line x1="0" y1="0" x2="0" y2="24" stroke="#d6d7c6" stroke-width="1"/></pattern><clipPath id="photoCut"><path d="M56 350 H529 L548 369 V897 L529 916 H56 Z"/></clipPath></defs>
  <rect width="900" height="1260" fill="#f5f0e3"/><rect width="900" height="1260" fill="url(#grain)"/>
  <rect x="29" y="29" width="842" height="1202" fill="none" stroke="#8f6748" stroke-width="2"/><rect x="36" y="36" width="828" height="1188" fill="none" stroke="#aab8a3" stroke-width="1"/>
  ${inner}</svg>`;
}

function compass(x: number, y: number, size: number): string {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="#1c4434"><circle r="${size}" stroke="#a66a43" stroke-width="1.5"/><circle r="${size * .82}" stroke-width="1"/><path d="M0 ${-size * 1.2} V${size * 1.2} M${-size * 1.2} 0 H${size * 1.2}" stroke-width="1"/><path d="M0 ${-size} L${size * .16} ${-size * .16} L${size} 0 L${size * .16} ${size * .16} L0 ${size} L${-size * .16} ${size * .16} L${-size} 0 L${-size * .16} ${-size * .16} Z" fill="#1c4434" stroke-width="1"/><path d="M0 ${-size} L${size * .16} ${-size * .16} L0 0 Z M${size} 0 L${size * .16} ${size * .16} L0 0 Z" fill="#f5f0e3"/><circle r="3" fill="#a66a43"/></g>`;
}

function coverPhoto(data: PassportData, photoDataUrl?: string): string {
  if (!data.photo || !photoDataUrl) return `<path d="M56 350 H529 L548 369 V897 L529 916 H56 Z" fill="#d7e2d0" stroke="#a66a43" stroke-width="3"/><path d="M56 560 Q170 480 270 565 T548 580 M56 690 Q180 610 280 690 T548 710 M56 830 Q200 730 320 820 T548 810" fill="none" stroke="#467763" stroke-width="4" opacity=".65"/>${compass(302,625,80)}<text x="302" y="754" text-anchor="middle" fill="#1c4434" font-family="Georgia,serif" font-size="26">A record made by you</text>`;
  return `<image x="56" y="350" width="492" height="566" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoCut)" href="${photoDataUrl}"/><path d="M56 350 H529 L548 369 V897 L529 916 H56 Z" fill="none" stroke="#a66a43" stroke-width="4"/>`;
}

export function renderPassportCover(data: PassportData, photoDataUrl?: string): string {
  const names = (data.districts.length ? data.districts : data.world).slice(0, 7);
  const remaining = (data.districts.length ? data.districts : data.world).length - names.length;
  const nameLines = names.map((name, index) => `<text x="601" y="${754 + index * 43}" fill="#1a3b2f" font-family="Georgia,serif" font-size="18" ${name.length > 23 ? 'textLength="240" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(name)}</text><line x1="593" y1="${766 + index * 43}" x2="835" y2="${766 + index * 43}" stroke="#c2c8b8"/>`).join("");
  const photoCredit = data.photo && photoDataUrl ? `<text x="56" y="960" fill="#284638" font-family="Arial,sans-serif" font-size="13">A view from ${xml(data.photo.district)} · ${xml(data.photo.title)}</text>
    <text x="56" y="1002" fill="#536c5a" font-family="Arial,sans-serif" font-size="11">Photo: ${xml(data.photo.author)} · ${xml(data.photo.license)}</text>
    <text x="56" y="1020" fill="#536c5a" font-family="Arial,sans-serif" font-size="9" textLength="${Math.min(750, Math.max(340, data.photo.sourceUrl.length * 5))}" lengthAdjust="spacingAndGlyphs">${xml(data.photo.sourceUrl)}</text>
    <text x="56" y="1037" fill="#536c5a" font-family="Arial,sans-serif" font-size="10">${xml(data.photo.licenseUrl)}</text>` : `<text x="56" y="960" fill="#284638" font-family="Arial,sans-serif" font-size="13">An atlas drawn from your own marks</text>`;
  return frame(`<text x="56" y="81" fill="#1d4937" font-family="Arial,sans-serif" font-size="14" letter-spacing="5">A T L A S  /  P E R S O N A L   R E C O R D</text><line x1="56" y1="103" x2="844" y2="103" stroke="#a66a43" stroke-width="2"/>
    <text x="49" y="215" fill="#15392c" font-family="Georgia,serif" font-size="112" letter-spacing="-4">ATLAS</text><text x="53" y="300" fill="#15392c" font-family="Georgia,serif" font-size="73" letter-spacing="-2">PASSPORT</text>${compass(762,203,61)}
    ${coverPhoto(data, photoDataUrl)}
    <text x="592" y="383" fill="#a16640" font-family="Arial,sans-serif" font-size="12" letter-spacing="3">PLACES YOU MARKED</text><text x="590" y="445" fill="#193f30" font-family="Georgia,serif" font-size="53">${data.world.length}</text><text x="667" y="444" fill="#274938" font-family="Georgia,serif" font-size="22">world places</text><line x1="592" y1="463" x2="832" y2="463" stroke="#b7c3af"/>
    <text x="590" y="532" fill="#193f30" font-family="Georgia,serif" font-size="53">${data.districts.length}</text><text x="667" y="530" fill="#274938" font-family="Georgia,serif" font-size="22">districts</text><text x="667" y="554" fill="#657666" font-family="Arial,sans-serif" font-size="12">in Bangladesh</text><line x1="592" y1="573" x2="832" y2="573" stroke="#b7c3af"/>
    <text x="593" y="679" fill="#9c6440" font-family="Arial,sans-serif" font-size="12" letter-spacing="3">${data.districts.length ? "DISTRICT NOTES" : "WORLD NOTES"}</text><line x1="593" y1="693" x2="835" y2="693" stroke="#a66a43"/>${nameLines}${remaining > 0 ? `<text x="601" y="${760 + names.length * 43}" fill="#6a7967" font-family="Arial,sans-serif" font-size="12">+ ${remaining} more in the full record</text>` : ""}
    ${photoCredit}
    <line x1="56" y1="1081" x2="844" y2="1081" stroke="#a66a43" stroke-width="2"/><text x="56" y="1128" fill="#1d4433" font-family="Georgia,serif" font-size="23" font-style="italic">Every journey begins with a mark.</text>
    <text x="56" y="1172" fill="#607060" font-family="Arial,sans-serif" font-size="11">${data.name ? `Prepared for ${xml(data.name)} · ` : ""}Only places marked visited in this browser.</text><text x="56" y="1191" fill="#607060" font-family="Arial,sans-serif" font-size="11">No visit dates, precise locations or trip stops are included.</text><text x="844" y="1191" text-anchor="end" fill="#9b6949" font-family="Arial,sans-serif" font-size="11">ATLAS / 01</text>`);
}

export function renderManifestPage(page: ManifestPage, documentPage: number): string {
  const entries = page.names.map((name, index) => {
    const column = Math.floor(index / 16);
    const row = index % 16;
    const x = column ? 470 : 72;
    const y = 286 + row * 52;
    const fontSize = name.length > 43 ? 14 : name.length > 34 ? 16 : 20;
    return `<text x="${x}" y="${y}" fill="#a16640" font-family="Arial,sans-serif" font-size="12">${String((page.index - 1) * 32 + index + 1).padStart(2, "0")}</text><text x="${x + 37}" y="${y}" fill="#1b4031" font-family="Georgia,serif" font-size="${fontSize}" ${name.length > 48 ? 'textLength="325" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(name)}</text><line x1="${x}" y1="${y + 13}" x2="${x + 355}" y2="${y + 13}" stroke="#c3cbb9"/>`;
  }).join("");
  return frame(`<text x="56" y="81" fill="#1d4937" font-family="Arial,sans-serif" font-size="14" letter-spacing="5">A T L A S  /  V I S I T E D   P L A C E S</text><line x1="56" y1="103" x2="844" y2="103" stroke="#a66a43" stroke-width="2"/>
    <text x="56" y="185" fill="#173d30" font-family="Georgia,serif" font-size="53">${xml(page.section)}</text><text x="57" y="220" fill="#687868" font-family="Arial,sans-serif" font-size="13">Page ${page.index} of ${page.total} · Places you marked visited</text>${compass(779,180,30)}
    ${entries}<line x1="56" y1="1148" x2="844" y2="1148" stroke="#a66a43" stroke-width="2"/><text x="56" y="1180" fill="#5b6d5e" font-family="Arial,sans-serif" font-size="12">A private record from this browser. No dates or routes inferred.</text><text x="844" y="1180" text-anchor="end" fill="#9b6949" font-family="Arial,sans-serif" font-size="11">ATLAS / ${String(documentPage).padStart(2, "0")}</text>`);
}
