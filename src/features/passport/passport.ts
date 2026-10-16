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
  const firstPhoto = photoDistrict && attractions.find((item) => item.district === photoDistrict.name);
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

function frame(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${PASSPORT_WIDTH}" height="${PASSPORT_HEIGHT}" viewBox="0 0 ${PASSPORT_WIDTH} ${PASSPORT_HEIGHT}" role="img" aria-label="Atlas passport page">
  <defs><pattern id="grain" width="37" height="37" patternUnits="userSpaceOnUse"><circle cx="4" cy="7" r=".7" fill="#b1a488" opacity=".32"/><circle cx="25" cy="28" r=".5" fill="#8e8b75" opacity=".27"/></pattern><pattern id="paperFibres" width="19" height="41" patternUnits="userSpaceOnUse"><path d="M2 8l5 -1M13 24l3 1M7 37l4 -1" stroke="#a89778" stroke-width=".5" opacity=".22"/></pattern><linearGradient id="photoTone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e1bd87" stop-opacity=".12"/><stop offset="1" stop-color="#092c27" stop-opacity=".15"/></linearGradient><clipPath id="photoCut"><path d="M60 380 H526 L548 402 V970 L526 992 H60 Z"/></clipPath></defs>
  <rect width="900" height="1260" fill="#f5f0e3"/><rect width="900" height="1260" fill="url(#grain)"/><rect width="900" height="1260" fill="url(#paperFibres)"/>
  <rect x="28" y="28" width="844" height="1204" fill="none" stroke="#9c6744" stroke-width="1.5"/><rect x="36" y="36" width="828" height="1188" fill="none" stroke="#b7ad91" stroke-width=".7"/>
  ${inner}</svg>`;
}

function compass(x: number, y: number, size: number): string {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="#1c4434"><circle r="${size}" stroke="#a66a43" stroke-width="1.5"/><circle r="${size * .82}" stroke-width="1"/><path d="M0 ${-size * 1.2} V${size * 1.2} M${-size * 1.2} 0 H${size * 1.2}" stroke-width="1"/><path d="M0 ${-size} L${size * .16} ${-size * .16} L${size} 0 L${size * .16} ${size * .16} L0 ${size} L${-size * .16} ${size * .16} L${-size} 0 L${-size * .16} ${-size * .16} Z" fill="#1c4434" stroke-width="1"/><path d="M0 ${-size} L${size * .16} ${-size * .16} L0 0 Z M${size} 0 L${size * .16} ${size * .16} L0 0 Z" fill="#f5f0e3"/><circle r="3" fill="#a66a43"/></g>`;
}

function coverPhoto(data: PassportData, photoDataUrl?: string): string {
  const cut = "M60 380 H526 L548 402 V970 L526 992 H60 Z";
  const fallback = data.districts.length
    ? `<g transform="translate(158 515) scale(2.1)"><path d="${bangladeshSilhouette}" fill="#2e604c" stroke="#173e33" stroke-width=".7"/></g>`
    : `<g fill="none" stroke="#35634d"><circle cx="304" cy="667" r="145" stroke-width="2"/><ellipse cx="304" cy="667" rx="73" ry="145" stroke-width="1.5"/><path d="M159 667h290M185 595h238M185 739h238" stroke-width="1.5"/></g>`;
  return `<path d="${cut}" fill="#b9cbbb"/>${photoDataUrl ? `<image x="60" y="380" width="488" height="612" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoCut)" href="${photoDataUrl}"/><path d="${cut}" fill="url(#photoTone)"/>` : `<path d="M60 760 Q190 700 310 748 T548 720 M60 830 Q185 778 312 820 T548 800" fill="none" stroke="#7eaa96" stroke-width="2"/>${fallback}<text x="304" y="906" text-anchor="middle" fill="#1a4233" font-family="Georgia,serif" font-size="25">A record made by you</text>`}
    <path d="${cut}" fill="none" stroke="#ead6ad" stroke-width="9"/><path d="${cut}" fill="none" stroke="#9f6240" stroke-width="3"/><path d="${cut}" fill="none" stroke="#183e30" stroke-width="1" transform="translate(0 0)"/>`;
}

function coverMap(hasDistricts: boolean): string {
  return hasDistricts
    ? `<g transform="translate(756 554) scale(.67)"><path d="${bangladeshSilhouette}" fill="#28513d" stroke="#174030" stroke-width="1"/></g>`
    : `<g transform="translate(799 612)" fill="none" stroke="#27523f"><circle r="45" stroke-width="2"/><ellipse rx="23" ry="45"/><path d="M-45 0h90M-39 -22h78M-39 22h78"/></g>`;
}

export function renderPassportCover(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string): string {
  const hasDistricts = data.districts.length > 0;
  const featuredNames = hasDistricts ? data.districts : data.world;
  const names = featuredNames.slice(0, 7);
  const remaining = featuredNames.length - names.length;
  const destination = hasDistricts ? "BANGLADESH" : data.world.length === 1 ? data.world[0].toUpperCase() : "WORLD";
  const nameLines = names.map((name, index) => `<text x="608" y="${816 + index * 34}" fill="#1a3b2f" font-family="Georgia,serif" font-size="17" ${name.length > 20 ? 'textLength="215" lengthAdjust="spacingAndGlyphs"' : ""}>${String(index + 1).padStart(2, "0")}  ${xml(name)}</text><line x1="603" y1="${825 + index * 34}" x2="833" y2="${825 + index * 34}" stroke="#c4bda6" stroke-width=".7"/>`).join("");
  const photoCredit = data.photo && photoDataUrl ? `<text x="59" y="1067" fill="#284638" font-family="Georgia,serif" font-size="16">${xml(data.photo.place)} · ${xml(data.photo.title)}</text>
    <text x="59" y="1124" fill="#536c5a" font-family="Arial,sans-serif" font-size="11" ${data.photo.author.length > 95 ? 'textLength="760" lengthAdjust="spacingAndGlyphs"' : ""}>Photo: ${xml(data.photo.author)} · ${xml(data.photo.license)}</text>
    <text x="59" y="1142" fill="#536c5a" font-family="Arial,sans-serif" font-size="9" textLength="${Math.min(760, Math.max(300, data.photo.sourceUrl.length * 5))}" lengthAdjust="spacingAndGlyphs">${xml(data.photo.sourceUrl)}</text>
    <text x="59" y="1159" fill="#536c5a" font-family="Arial,sans-serif" font-size="10">${xml(data.photo.licenseUrl)}</text>` : `<text x="59" y="1067" fill="#284638" font-family="Georgia,serif" font-size="17">An atlas drawn from your own marks</text>`;
  const botanical = botanicalDataUrl ? `<image x="0" y="840" width="170" height="192" opacity=".76" href="${botanicalDataUrl}"/>` : "";
  return frame(`<text x="55" y="70" fill="#1d4937" font-family="Georgia,serif" font-size="13" letter-spacing="3.5">${hasDistricts ? "SOUTH ASIA" : "YOUR WORLD"}</text><line x1="171" y1="65" x2="604" y2="65" stroke="#a66a43" stroke-width="1.3"/><text x="622" y="70" fill="#1d4937" font-family="Georgia,serif" font-size="12" letter-spacing="3">PEOPLE · PLACES</text>
    <text x="44" y="217" fill="#15392c" font-family="Georgia,serif" font-size="137" font-weight="700" letter-spacing="-5">ATLAS</text><text x="53" y="307" fill="#15392c" font-family="Georgia,serif" font-size="83" font-weight="700" letter-spacing="-2">PASSPORT</text>${compass(756,192,70)}
    <line x1="56" y1="334" x2="844" y2="334" stroke="#a66a43" stroke-width="2"/><text x="56" y="358" fill="#315541" font-family="Georgia,serif" font-size="13" letter-spacing="2.2">A PERSONAL CARTOGRAPHIC RECORD</text>
    ${coverPhoto(data, photoDataUrl)}${botanical}
    <text x="600" y="396" fill="#9e633b" font-family="Arial,sans-serif" font-size="11" letter-spacing="3">DESTINATION</text><line x1="765" y1="391" x2="836" y2="391" stroke="#9e633b" stroke-width="1.2"/>
    <text x="597" y="461" fill="#15392c" font-family="Georgia,serif" font-weight="700" font-size="${destination.length > 12 ? 35 : 43}" ${destination.length > 8 ? 'textLength="239" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(destination)}</text>
    <text x="601" y="496" fill="#315541" font-family="Georgia,serif" font-size="13" letter-spacing="2">${hasDistricts ? "RIVERS · PEOPLE · PLACES" : "A WORLD IN YOUR MARKS"}</text>
    <g transform="rotate(-3 672 625)"><rect x="595" y="534" width="150" height="182" rx="3" fill="none" stroke="#a66a43" stroke-width="3"/><rect x="602" y="541" width="136" height="168" fill="none" stroke="#a66a43" stroke-width="1" stroke-dasharray="5 3"/><text x="670" y="568" text-anchor="middle" fill="#a66a43" font-family="Georgia,serif" font-size="15" letter-spacing="1">${hasDistricts ? "DISTRICTS" : "COUNTRIES"}</text><text x="670" y="662" text-anchor="middle" fill="#173d2f" font-family="Georgia,serif" font-size="93" font-weight="700">${hasDistricts ? data.districts.length : data.world.length}</text><path d="M621 683q10 -10 20 0t20 0t20 0t20 0" fill="none" stroke="#a66a43" stroke-width="2"/></g>
    ${coverMap(hasDistricts)}<text x="797" y="729" text-anchor="middle" fill="#315541" font-family="Georgia,serif" font-size="10" letter-spacing="1.8">${hasDistricts ? "ONE DELTA" : "ONE ATLAS"}</text>
    <text x="603" y="777" fill="#9e633b" font-family="Arial,sans-serif" font-size="11" letter-spacing="2.6">${hasDistricts ? "DISTRICTS VISITED" : "PLACES VISITED"}</text><line x1="603" y1="788" x2="836" y2="788" stroke="#a66a43" stroke-width="1.5"/>${nameLines}${remaining > 0 ? `<text x="607" y="${827 + names.length * 34}" fill="#5f735e" font-family="Georgia,serif" font-size="12">+ ${remaining} more in the full record</text>` : ""}
    ${photoCredit}
    <line x1="56" y1="1182" x2="844" y2="1182" stroke="#a66a43" stroke-width="1.8"/><text x="57" y="1209" fill="#1d4433" font-family="Georgia,serif" font-size="17" font-style="italic">Every journey begins with a mark.</text><text x="844" y="1209" text-anchor="end" fill="#9b6949" font-family="Arial,sans-serif" font-size="11">ATLAS / 01</text><text x="56" y="1222" fill="#607060" font-family="Arial,sans-serif" font-size="8">${data.name ? `Prepared for ${xml(data.name)} · ` : ""}Only marked visits in this browser. No dates, routes or trip stops are inferred.</text>`);
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
