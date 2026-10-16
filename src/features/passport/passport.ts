import { attractions } from "../../data/attractions";
import { districtDisplayName } from "../../data/districtNames";
import districts from "../../data/districts.json";
import { featuredRegionForCountry, regionNotes } from "../../data/regionNotes";
import { worldPlaces } from "../../data/worldPlaces";
import { bangladeshSilhouette } from "./bangladeshSilhouette";

export const PASSPORT_WIDTH = 900;
export const PASSPORT_HEIGHT = 1260;

export type PassportPhoto = { src: `/${string}`; place: string; title: string; author: string; license: string; licenseUrl: string; sourceUrl: string };
export type PassportData = { name: string; world: string[]; districts: string[]; photo?: PassportPhoto };
export type ManifestPage = { section: "World places" | "Bangladesh districts"; names: string[]; index: number; total: number };

export function createPassport(worldIds: readonly string[], districtIds: readonly string[], name: string, photoDistrictId?: string): PassportData {
  const world = new Set(worldIds);
  const visitedDistricts = new Set(districtIds);
  const districtEntries = districts.filter((place) => visitedDistricts.has(place.id));
  const photoDistrict = districtEntries.find((place) => place.id === photoDistrictId) ?? districtEntries[0];
  const firstPhoto = photoDistrictId === "atlas-cover" && districtEntries.length
    ? attractions.find((item) => item.id === "bd-satkhira-sundarbans")
    : photoDistrict && attractions.find((item) => item.district === photoDistrict.name);
  const worldEntries = worldPlaces.filter((place) => world.has(place.id));
  const featuredWorld = worldEntries.map((place) => {
    const regionId = featuredRegionForCountry(place.id);
    return regionId ? { place, note: regionNotes[regionId] } : undefined;
  }).find((entry) => entry?.note);
  return {
    name: [...name.trim().replace(/[\u0000-\u001f\u007f]/g, "")].slice(0, 40).join(""),
    world: worldEntries.map((place) => place.name).sort((a, b) => a.localeCompare(b, "en")),
    districts: districtEntries.map((place) => districtDisplayName(place.name)).sort((a, b) => a.localeCompare(b, "en")),
    photo: firstPhoto ? { src: firstPhoto.image.src, place: districtDisplayName(firstPhoto.district), title: firstPhoto.title, author: firstPhoto.image.author, license: firstPhoto.image.license, licenseUrl: firstPhoto.image.licenseUrl, sourceUrl: firstPhoto.image.sourceUrl }
      : featuredWorld ? { src: featuredWorld.note.image.src as `/${string}`, place: featuredWorld.place.name, title: featuredWorld.note.title, author: featuredWorld.note.image.author, license: featuredWorld.note.image.license, licenseUrl: featuredWorld.note.image.licenseUrl, sourceUrl: featuredWorld.note.image.sourceUrl } : undefined,
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

function frame(inner: string, paperDataUrl?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PASSPORT_WIDTH}" height="${PASSPORT_HEIGHT}" viewBox="0 0 ${PASSPORT_WIDTH} ${PASSPORT_HEIGHT}" role="img" aria-label="Atlas passport page">
  <defs><pattern id="grain" width="47" height="53" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r=".5" fill="#9b8b6c" opacity=".22"/><circle cx="31" cy="41" r=".4" fill="#655a48" opacity=".15"/></pattern><linearGradient id="photoTone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#bf8e54" stop-opacity=".10"/><stop offset=".68" stop-color="#e4bb75" stop-opacity=".02"/><stop offset="1" stop-color="#072d22" stop-opacity=".30"/></linearGradient><clipPath id="photoCut"><path d="M53 345 H524 L552 373 V1091 L524 1119 H53 L36 1102 V362 Z"/></clipPath></defs>
  <rect width="900" height="1260" fill="#f5f0e3"/>${paperDataUrl ? `<image x="0" y="0" width="900" height="1260" preserveAspectRatio="xMidYMid slice" opacity=".48" href="${paperDataUrl}"/>` : `<rect width="900" height="1260" fill="url(#grain)"/>`}
  <rect x="27" y="25" width="846" height="1210" fill="none" stroke="#b1815c" stroke-width="1.2"/>
  ${inner}</svg>`;
}

function compass(x: number, y: number, size: number): string {
  const ticks = Array.from({ length: 32 }, (_, index) => `<line y1="${-size * .91}" y2="${-size * (index % 4 === 0 ? 1.08 : .99)}" transform="rotate(${index * 11.25})" stroke="#a86b43" stroke-width="${index % 4 === 0 ? 1.5 : .8}"/>`).join("");
  return `<g transform="translate(${x} ${y})" fill="none"><circle r="${size * 1.12}" stroke="#a86b43" stroke-width="1.4"/><circle r="${size * .88}" stroke="#a86b43" stroke-width=".9"/>${ticks}<circle r="${size * .73}" stroke="#315b44" stroke-width=".8"/><path d="M0 ${-size * 1.14}V${size * 1.14}M${-size * 1.14} 0H${size * 1.14}" stroke="#234e39" stroke-width=".7"/><path d="M0 ${-size}L${size * .13} ${-size * .13}L${size} 0L${size * .13} ${size * .13}L0 ${size}L${-size * .13} ${size * .13}L${-size} 0L${-size * .13} ${-size * .13}Z" fill="#153e2d" stroke="#153e2d"/><path d="M0 ${-size}L${size * .13} ${-size * .13}L0 0ZM${size} 0L${size * .13} ${size * .13}L0 0Z" fill="#f6eee0"/><path d="M0 ${-size * .49}L${size * .35} ${-size * .35}L${size * .49} 0L${size * .35} ${size * .35}L0 ${size * .49}L${-size * .35} ${size * .35}L${-size * .49} 0L${-size * .35} ${-size * .35}Z" fill="none" stroke="#a86b43" stroke-width="1"/><circle r="3" fill="#a86b43"/><g fill="#173e2e" font-family="Georgia,serif" font-size="15" text-anchor="middle"><text x="0" y="${-size * 1.23}">N</text><text x="0" y="${size * 1.37}">S</text><text x="${-size * 1.28}" y="5">W</text><text x="${size * 1.28}" y="5">E</text></g></g>`;
}

function coverPhoto(data: PassportData, photoDataUrl?: string): string {
  const cut = "M53 345 H524 L552 373 V1091 L524 1119 H53 L36 1102 V362 Z";
  const fallback = data.districts.length
    ? `<g transform="translate(165 570) scale(2.35)"><path d="${bangladeshSilhouette}" fill="#2e604c" stroke="#173e33" stroke-width=".7"/></g>`
    : `<g fill="none" stroke="#35634d"><circle cx="304" cy="707" r="160" stroke-width="2"/><ellipse cx="304" cy="707" rx="80" ry="160" stroke-width="1.5"/><path d="M144 707h320M169 627h270M169 787h270" stroke-width="1.5"/></g>`;
  return `<path d="${cut}" fill="#bed0b7"/>${photoDataUrl ? `<image x="36" y="345" width="516" height="774" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoCut)" href="${photoDataUrl}"/><path d="${cut}" fill="url(#photoTone)"/>` : `<path d="M36 865 Q190 805 310 853 T552 825 M36 935 Q185 883 312 925 T552 905" fill="none" stroke="#7eaa96" stroke-width="2"/>${fallback}<text x="304" y="1020" text-anchor="middle" fill="#1a4233" font-family="Georgia,serif" font-size="26">A record made by you</text>`}
    <path d="${cut}" fill="none" stroke="#fff5da" stroke-width="11"/><path d="${cut}" fill="none" stroke="#a75832" stroke-width="4"/><path d="${cut}" fill="none" stroke="#223e2e" stroke-width="1"/>`;
}

function coverMap(hasDistricts: boolean): string {
  return hasDistricts
    ? `<g transform="translate(756 554) scale(.67)"><path d="${bangladeshSilhouette}" fill="#28513d" stroke="#174030" stroke-width="1"/></g>`
    : `<g transform="translate(799 612)" fill="none" stroke="#27523f"><circle r="45" stroke-width="2"/><ellipse rx="23" ry="45"/><path d="M-45 0h90M-39 -22h78M-39 22h78"/></g>`;
}

export function renderPassportCover(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, paperDataUrl?: string, lilyDataUrl?: string): string {
  const hasDistricts = data.districts.length > 0;
  const featuredNames = hasDistricts ? data.districts : data.world;
  const names = featuredNames.slice(0, 10);
  const remaining = featuredNames.length - names.length;
  const destination = hasDistricts ? "BANGLADESH" : data.world.length === 1 ? data.world[0].toUpperCase() : "WORLD";
  const nameLines = names.map((name, index) => `<text x="602" y="${812 + index * 27}" fill="#a45d35" font-family="Georgia,serif" font-size="14">${String(index + 1).padStart(2, "0")}</text><text x="634" y="${812 + index * 27}" fill="#193b2e" font-family="Georgia,serif" font-size="16" ${name.length > 19 ? 'textLength="202" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(name)}</text><line x1="602" y1="${820 + index * 27}" x2="842" y2="${820 + index * 27}" stroke="#c1b49b" stroke-width=".6" stroke-dasharray="2 2"/>`).join("");
  const photoCredit = data.photo && photoDataUrl ? `<text x="42" y="1148" fill="#173b2d" font-family="Georgia,serif" font-size="17">${xml(data.photo.place)} · ${xml(data.photo.title)}</text><text x="42" y="1183" fill="#47604e" font-family="Arial,sans-serif" font-size="10">Photo: ${xml(data.photo.author)} · ${xml(data.photo.license)}</text><text x="42" y="1200" fill="#47604e" font-family="Arial,sans-serif" font-size="9" textLength="${Math.min(780, Math.max(330, data.photo.sourceUrl.length * 5))}" lengthAdjust="spacingAndGlyphs">${xml(data.photo.sourceUrl)}</text><text x="42" y="1215" fill="#47604e" font-family="Arial,sans-serif" font-size="9">${xml(data.photo.licenseUrl)}</text>` : `<text x="42" y="1148" fill="#173b2d" font-family="Georgia,serif" font-size="17">A record drawn from your own marks</text>`;
  const botanical = botanicalDataUrl ? `<image x="0" y="875" width="570" height="250" opacity=".95" href="${botanicalDataUrl}"/>` : "";
  const waterLily = lilyDataUrl && names.length <= 5 ? `<image x="${names.length <= 2 ? 638 : 690}" y="${names.length <= 2 ? 836 : 954}" width="${names.length <= 2 ? 205 : 140}" height="${names.length <= 2 ? 271 : 170}" opacity=".7" href="${lilyDataUrl}"/>` : "";
  return frame(`<text x="43" y="61" fill="#1d4937" font-family="Georgia,serif" font-size="12" letter-spacing="4">${hasDistricts ? "SOUTH ASIA" : "YOUR WORLD"}</text><line x1="178" y1="56" x2="601" y2="56" stroke="#a75832" stroke-width="1.4"/><text x="617" y="61" fill="#1d4937" font-family="Georgia,serif" font-size="12" letter-spacing="2.8">RIVERS · PEOPLE · PLACES</text>
    <text x="36" y="195" fill="#123a2a" font-family="Georgia,serif" font-size="142" font-weight="700" letter-spacing="-5">ATLAS</text><text x="43" y="281" fill="#123a2a" font-family="Georgia,serif" font-size="81" font-weight="700" letter-spacing="-2">PASSPORT</text><line x1="570" y1="96" x2="570" y2="277" stroke="#a75832" stroke-width="1.5"/><g fill="#214536" font-family="Georgia,serif" font-size="12" letter-spacing="2"><text x="586" y="117">A JOURNEY</text><text x="586" y="140">THROUGH</text><text x="586" y="163">PLACES</text><text x="586" y="186">AND PEOPLE</text></g>${compass(784,187,57)}
    <line x1="42" y1="304" x2="858" y2="304" stroke="#a75832" stroke-width="2"/><text x="43" y="328" fill="#315541" font-family="Georgia,serif" font-size="12" letter-spacing="2.8">INDEPENDENT CARTOGRAPHIC ATLAS  /  A PERSONAL JOURNEY</text>
    ${coverPhoto(data, photoDataUrl)}${botanical}
    <text x="592" y="374" fill="#a45d35" font-family="Georgia,serif" font-size="12" letter-spacing="3">DESTINATION</text><line x1="734" y1="369" x2="844" y2="369" stroke="#a75832" stroke-width="1.4"/>
    <text x="587" y="442" fill="#123a2a" font-family="Georgia,serif" font-weight="700" font-size="${destination.length > 14 ? 38 : 52}" ${destination.length > 7 ? 'textLength="258" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(destination)}</text>
    <text x="592" y="471" fill="#315541" font-family="Georgia,serif" font-size="12" letter-spacing="1.7">${hasDistricts ? "RIVER · DELTA · PEOPLE" : "PLACES · PEOPLE · MEMORY"}</text>
    <g transform="rotate(-3 667 590)"><path d="M591 510l146 -3 4 169 -148 3z" fill="none" stroke="#a75832" stroke-width="3"/><path d="M598 517l132 -2 3 154 -133 3z" fill="none" stroke="#a75832" stroke-width="1.3" stroke-dasharray="5 2"/><text x="666" y="542" text-anchor="middle" fill="#a75832" font-family="Georgia,serif" font-size="14" letter-spacing=".4">${hasDistricts ? "DISTRICTS VISITED" : "COUNTRIES VISITED"}</text><line x1="608" y1="551" x2="723" y2="551" stroke="#a75832"/><text x="666" y="638" text-anchor="middle" fill="#123a2a" font-family="Georgia,serif" font-size="89" font-weight="700">${hasDistricts ? data.districts.length : data.world.length}</text><path d="M611 656q12 -8 24 0t24 0t24 0t24 0" fill="none" stroke="#a75832" stroke-width="1.6"/></g>
    <g transform="translate(4 -27)">${coverMap(hasDistricts)}</g><text x="795" y="706" text-anchor="middle" fill="#315541" font-family="Georgia,serif" font-size="10" letter-spacing="1.3">${hasDistricts ? "ONE DELTA" : "ONE ATLAS"}</text>
    <text x="602" y="765" fill="#315541" font-family="Georgia,serif" font-size="15" letter-spacing="2.1">${hasDistricts ? "DISTRICTS VISITED" : "PLACES VISITED"}</text><line x1="602" y1="778" x2="842" y2="778" stroke="#a75832" stroke-width="1.5"/>${nameLines}${remaining > 0 ? `<text x="602" y="${823 + names.length * 27}" fill="#48614c" font-family="Georgia,serif" font-size="12" font-style="italic">+ ${remaining} more in the full record</text>` : ""}${waterLily}
    <line x1="42" y1="1129" x2="858" y2="1129" stroke="#a75832" stroke-width="1.6"/>${photoCredit}<text x="844" y="1150" text-anchor="end" fill="#315541" font-family="Georgia,serif" font-size="13" font-style="italic">Every journey begins with a mark.</text><text x="844" y="1221" text-anchor="end" fill="#9b6949" font-family="Arial,sans-serif" font-size="10">ATLAS / 01</text><text x="42" y="1231" fill="#607060" font-family="Arial,sans-serif" font-size="7">${data.name ? `Prepared for ${xml(data.name)} · ` : ""}Only marked visits in this browser. No dates, routes or trip stops are inferred.</text>`, paperDataUrl);
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
