import { attractions } from "../../data/attractions";
import { districtDisplayName } from "../../data/districtNames";
import districts from "../../data/districts.json";
import { featuredRegionForCountry, regionNotes } from "../../data/regionNotes";
import { worldPlaces } from "../../data/worldPlaces";
import { bangladeshSilhouette, bangladeshSoutheastIslet, bangladeshWesternIslands } from "./bangladeshSilhouette";

export const PASSPORT_WIDTH = 900;
export const PASSPORT_HEIGHT = 1260;
export const PASSPORT_STYLES = ["archive", "expedition", "travelogue"] as const;
export type PassportStyle = typeof PASSPORT_STYLES[number];

export type PassportPhoto = { src: `/${string}`; place: string; title: string; author: string; license: string; licenseUrl: string; sourceUrl: string };
export type PassportData = { name: string; world: string[]; districts: string[]; photo?: PassportPhoto };
export type ManifestPage = { section: "World places" | "Bangladesh districts"; names: string[]; index: number; total: number };
export type PassportMemoryLine = { date?: string; note?: string };
export type ManifestAssets = { photoDataByName?: Record<string, string>; botanicalDataUrl?: string; lilyDataUrl?: string };

const bangladeshOrnament = `${bangladeshSilhouette} ${bangladeshWesternIslands} ${bangladeshSoutheastIslet}`;

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
    const total = Math.ceil(names.length / 8);
    for (let index = 0; index < total; index++) pages.push({ section, names: names.slice(index * 8, (index + 1) * 8), index: index + 1, total });
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
    ? `<g transform="translate(165 570) scale(2.35)"><path d="${bangladeshOrnament}" fill="#2e604c" stroke="#173e33" stroke-width=".7"/></g>`
    : `<g fill="none" stroke="#35634d"><circle cx="304" cy="707" r="160" stroke-width="2"/><ellipse cx="304" cy="707" rx="80" ry="160" stroke-width="1.5"/><path d="M144 707h320M169 627h270M169 787h270" stroke-width="1.5"/></g>`;
  return `<path d="${cut}" fill="#bed0b7"/>${photoDataUrl ? `<image x="36" y="345" width="516" height="774" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoCut)" href="${photoDataUrl}"/><path d="${cut}" fill="url(#photoTone)"/>` : `<path d="M36 865 Q190 805 310 853 T552 825 M36 935 Q185 883 312 925 T552 905" fill="none" stroke="#7eaa96" stroke-width="2"/>${fallback}<text x="304" y="1020" text-anchor="middle" fill="#1a4233" font-family="Georgia,serif" font-size="26">A record made by you</text>`}
    <path d="${cut}" fill="none" stroke="#fff5da" stroke-width="11"/><path d="${cut}" fill="none" stroke="#a75832" stroke-width="4"/><path d="${cut}" fill="none" stroke="#223e2e" stroke-width="1"/>`;
}

function coverMap(hasDistricts: boolean): string {
  return hasDistricts
    ? `<g transform="translate(756 554) scale(.67)" shape-rendering="geometricPrecision"><path d="${bangladeshOrnament}" fill="#28513d" stroke="#28513d" stroke-width="3.5" stroke-linejoin="round"/><path d="${bangladeshOrnament}" fill="none" stroke="#174030" stroke-width="1.2" stroke-linejoin="round"/></g>`
    : `<g transform="translate(799 612)" fill="none" stroke="#27523f"><circle r="45" stroke-width="2"/><ellipse rx="23" ry="45"/><path d="M-45 0h90M-39 -22h78M-39 22h78"/></g>`;
}

function renderArchiveCover(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, paperDataUrl?: string, lilyDataUrl?: string): string {
  const hasDistricts = data.districts.length > 0;
  const featuredNames = hasDistricts ? data.districts : data.world;
  const names = featuredNames.slice(0, 10);
  const remaining = featuredNames.length - names.length;
  const destination = hasDistricts ? "BANGLADESH" : data.world.length === 1 ? data.world[0].toUpperCase() : "WORLD";
  const destinationSize = destination.length > 14 ? 29 : destination.length > 9 ? 36 : destination.length > 7 ? 42 : 52;
  const nameLines = names.map((name, index) => `<text x="602" y="${812 + index * 27}" fill="#a45d35" font-family="Georgia,serif" font-size="14">${String(index + 1).padStart(2, "0")}</text><text x="634" y="${812 + index * 27}" fill="#193b2e" font-family="Georgia,serif" font-size="16" ${name.length > 19 ? 'textLength="202" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(name)}</text><line x1="602" y1="${820 + index * 27}" x2="842" y2="${820 + index * 27}" stroke="#c1b49b" stroke-width=".6" stroke-dasharray="2 2"/>`).join("");
  const photoCaption = data.photo && photoDataUrl ? `<text x="42" y="1148" fill="#173b2d" font-family="Georgia,serif" font-size="17">${xml(data.photo.place)} · ${xml(data.photo.title)}</text>` : `<text x="42" y="1148" fill="#173b2d" font-family="Georgia,serif" font-size="17">A record drawn from your own marks</text>`;
  const botanical = botanicalDataUrl ? `<image x="0" y="875" width="570" height="250" opacity=".95" href="${botanicalDataUrl}"/>` : "";
  const waterLily = lilyDataUrl && names.length <= 5 ? `<image x="${names.length <= 2 ? 638 : 690}" y="${names.length <= 2 ? 836 : 954}" width="${names.length <= 2 ? 205 : 140}" height="${names.length <= 2 ? 271 : 170}" opacity=".7" href="${lilyDataUrl}"/>` : "";
  return frame(`<text x="43" y="61" fill="#1d4937" font-family="Georgia,serif" font-size="12" letter-spacing="4">${hasDistricts ? "SOUTH ASIA" : "YOUR WORLD"}</text><line x1="178" y1="56" x2="601" y2="56" stroke="#a75832" stroke-width="1.4"/><text x="617" y="61" fill="#1d4937" font-family="Georgia,serif" font-size="12" letter-spacing="2.8">RIVERS · PEOPLE · PLACES</text>
    <text x="36" y="195" fill="#123a2a" font-family="Georgia,serif" font-size="142" font-weight="700" letter-spacing="-5">ATLAS</text><text x="43" y="281" fill="#123a2a" font-family="Georgia,serif" font-size="81" font-weight="700" letter-spacing="-2">PASSPORT</text><line x1="570" y1="96" x2="570" y2="277" stroke="#a75832" stroke-width="1.5"/><g fill="#214536" font-family="Georgia,serif" font-size="12" letter-spacing="2"><text x="586" y="117">A JOURNEY</text><text x="586" y="140">THROUGH</text><text x="586" y="163">PLACES</text><text x="586" y="186">AND PEOPLE</text></g>${compass(784,187,57)}
    <line x1="42" y1="304" x2="858" y2="304" stroke="#a75832" stroke-width="2"/><text x="43" y="328" fill="#315541" font-family="Georgia,serif" font-size="12" letter-spacing="2.8">INDEPENDENT CARTOGRAPHIC ATLAS  /  A PERSONAL JOURNEY</text>
    ${coverPhoto(data, photoDataUrl)}${botanical}
    <text x="592" y="374" fill="#a45d35" font-family="Georgia,serif" font-size="12" letter-spacing="3">DESTINATION</text><line x1="734" y1="369" x2="844" y2="369" stroke="#a75832" stroke-width="1.4"/>
    <text x="587" y="442" fill="#123a2a" font-family="Georgia,serif" font-weight="700" font-size="${destinationSize}">${xml(destination)}</text>
    <text x="592" y="471" fill="#315541" font-family="Georgia,serif" font-size="12" letter-spacing="1.7">${hasDistricts ? "RIVER · DELTA · PEOPLE" : "PLACES · PEOPLE · MEMORY"}</text>
    <g transform="rotate(-3 667 590)"><path d="M591 510l146 -3 4 169 -148 3z" fill="none" stroke="#a75832" stroke-width="3"/><path d="M598 517l132 -2 3 154 -133 3z" fill="none" stroke="#a75832" stroke-width="1.3" stroke-dasharray="5 2"/><text x="666" y="542" text-anchor="middle" fill="#a75832" font-family="Georgia,serif" font-size="14" letter-spacing=".4">${hasDistricts ? "DISTRICTS VISITED" : "COUNTRIES VISITED"}</text><line x1="608" y1="551" x2="723" y2="551" stroke="#a75832"/><text x="666" y="638" text-anchor="middle" fill="#123a2a" font-family="Georgia,serif" font-size="89" font-weight="700">${hasDistricts ? data.districts.length : data.world.length}</text><path d="M611 656q12 -8 24 0t24 0t24 0t24 0" fill="none" stroke="#a75832" stroke-width="1.6"/></g>
    <g transform="translate(4 -27)">${coverMap(hasDistricts)}</g><text x="795" y="706" text-anchor="middle" fill="#315541" font-family="Georgia,serif" font-size="10" letter-spacing="1.3">${hasDistricts ? "ONE DELTA" : "ONE ATLAS"}</text>
    <text x="602" y="765" fill="#315541" font-family="Georgia,serif" font-size="15" letter-spacing="2.1">${hasDistricts ? "DISTRICTS VISITED" : "PLACES VISITED"}</text><line x1="602" y1="778" x2="842" y2="778" stroke="#a75832" stroke-width="1.5"/>${nameLines}${remaining > 0 ? `<text x="602" y="${823 + names.length * 27}" fill="#48614c" font-family="Georgia,serif" font-size="12" font-style="italic">+ ${remaining} more in the full record</text>` : ""}${waterLily}
    <line x1="42" y1="1129" x2="858" y2="1129" stroke="#a75832" stroke-width="1.6"/>${photoCaption}<text x="844" y="1150" text-anchor="end" fill="#315541" font-family="Georgia,serif" font-size="13" font-style="italic">Every journey begins with a mark.</text><text x="844" y="1221" text-anchor="end" fill="#9b6949" font-family="Arial,sans-serif" font-size="10">ATLAS / 01</text><text x="42" y="1231" fill="#607060" font-family="Arial,sans-serif" font-size="7">${data.name ? `Prepared for ${xml(data.name)} · ` : ""}Only marked visits in this browser. No dates, routes or trip stops are inferred.</text>`, paperDataUrl);
}

function coverDestination(data: PassportData): string {
  return data.districts.length ? "BANGLADESH" : data.world.length === 1 ? data.world[0].toUpperCase() : "WORLD";
}

function coverNames(data: PassportData): string[] {
  return data.districts.length ? data.districts : data.world;
}

function coverCaption(data: PassportData, photoDataUrl: string | undefined, color: string, y: number): string {
  if (!data.photo || !photoDataUrl) return "";
  return `<text x="57" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="10">${xml(data.photo.place)} · ${xml(data.photo.title)}</text>`;
}

type CoverAssets = { fontDataUrl?: string; tigerDataUrl?: string; lilyEngravingDataUrl?: string };

function displayFont(fontDataUrl?: string): string {
  return fontDataUrl ? `<style>@font-face{font-family:PassportDisplay;src:url('${fontDataUrl}') format('truetype');font-weight:400 900}</style>` : "";
}

function renderExpeditionCover(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, assets?: CoverAssets): string {
  const names = coverNames(data);
  const destination = coverDestination(data);
  const selected = names.slice(0, 6);
  const list = selected.map((name, index) => {
    const x = index < 3 ? 570 : 713;
    const y = 1016 + (index % 3) * 34;
    const maxWidth = index < 3 ? 132 : 119;
    return `<text x="${x}" y="${y}" fill="#e9d4a9" font-family="Georgia,serif" font-size="15" ${name.length > 11 ? `textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"` : ""}>${xml(name)}</text>`;
  }).join("");
  const fallback = data.districts.length ? `<g transform="translate(390 430) scale(2.1)"><path d="${bangladeshOrnament}" fill="#a7895b"/></g>` : `<circle cx="450" cy="560" r="130" fill="none" stroke="#b49a6a" stroke-width="3"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1260" viewBox="0 0 900 1260" role="img" aria-label="Expedition Atlas passport cover"><defs>
    ${displayFont(assets?.fontDataUrl)}
    <pattern id="cloth" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 1H8M1 0V8" stroke="#c7ac76" stroke-opacity=".12" stroke-width=".6"/></pattern>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8d6236"/><stop offset=".25" stop-color="#f0d29a"/><stop offset=".52" stop-color="#ba8d52"/><stop offset=".77" stop-color="#f2dbac"/><stop offset="1" stop-color="#966b3a"/></linearGradient>
    <linearGradient id="expShade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#08261d" stop-opacity=".30"/><stop offset=".4" stop-color="#08261d" stop-opacity=".03"/><stop offset="1" stop-color="#061d16" stop-opacity=".43"/></linearGradient>
    <clipPath id="expPhoto"><rect x="55" y="265" width="790" height="645"/></clipPath>
    <path id="sealTop" d="M115 1047a115 115 0 0 1 230 0" fill="none"/><path id="sealBottom" d="M115 1047a115 115 0 0 0 230 0" fill="none"/>
    <filter id="goldFoliage"><feColorMatrix type="matrix" values=".53 .48 .15 0 0 .38 .33 .12 0 0 .19 .17 .08 0 0 0 0 0 .62 0"/></filter>
    </defs>
    <rect width="900" height="1260" fill="#082d24"/><rect width="900" height="1260" fill="url(#cloth)"/>
    <rect x="29" y="22" width="842" height="1216" fill="none" stroke="url(#gold)" stroke-width="2"/><rect x="36" y="29" width="828" height="1202" fill="none" stroke="#967342" stroke-width=".8"/>
    <path d="M29 76q43 0 43-54M29 52q22 0 22-30M871 76q-43 0-43-54M871 52q-22 0-22-30M29 1184q43 0 43 54M29 1208q22 0 22 30M871 1184q-43 0-43 54M871 1208q-22 0-22 30" fill="none" stroke="#d0a765" stroke-width="2"/>
    <text x="450" y="172" text-anchor="middle" fill="#3a2918" stroke="#3a2918" stroke-width="2" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-weight="700" font-size="150" textLength="677" lengthAdjust="spacingAndGlyphs">ATLAS</text>
    <text x="450" y="168" text-anchor="middle" fill="url(#gold)" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-weight="700" font-size="150" textLength="677" lengthAdjust="spacingAndGlyphs">ATLAS</text>
    <line x1="200" y1="196" x2="409" y2="196" stroke="#c19a5d"/><circle cx="450" cy="196" r="13" fill="none" stroke="#c19a5d"/><path d="M450 178l5 18-5 18-5-18z" fill="#d7ae70"/><line x1="491" y1="196" x2="700" y2="196" stroke="#c19a5d"/>
    <text x="450" y="252" text-anchor="middle" fill="url(#gold)" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-size="43" letter-spacing="16" textLength="490" lengthAdjust="spacingAndGlyphs">PASSPORT</text>
    <rect x="53" y="263" width="794" height="650" fill="#355d42"/>${photoDataUrl ? `<image x="55" y="265" width="790" height="645" preserveAspectRatio="xMidYMid slice" clip-path="url(#expPhoto)" href="${photoDataUrl}"/>` : fallback}<rect x="55" y="265" width="790" height="645" fill="url(#expShade)"/><rect x="54" y="264" width="792" height="647" fill="none" stroke="#c99b5d" stroke-width="2"/>
    <rect x="54" y="902" width="792" height="272" fill="#06291f" opacity=".97"/><path d="M54 902H846M54 1174H846" stroke="#bb8e52" stroke-width="2"/>
    <circle cx="230" cy="1047" r="117" fill="#073026" stroke="#ba854a" stroke-width="4"/><circle cx="230" cy="1047" r="106" fill="none" stroke="#d2a361" stroke-width="1.5"/><circle cx="230" cy="1047" r="80" fill="none" stroke="#906338" stroke-width="1.2"/>
    ${assets?.tigerDataUrl ? `<image x="155" y="985" width="150" height="135" preserveAspectRatio="xMidYMid meet" href="${assets.tigerDataUrl}"/>` : `<text x="230" y="1072" text-anchor="middle" fill="#d3a668" font-family="PassportDisplay,Georgia,serif" font-size="96">${data.districts.length || data.world.length}</text>`}
    <text fill="#d8ae70" font-family="Georgia,serif" font-size="21" letter-spacing="5"><textPath href="#sealTop" startOffset="50%" text-anchor="middle">VISITED</textPath></text>
    <text fill="#d8ae70" font-family="Georgia,serif" font-size="18" letter-spacing="3"><textPath href="#sealBottom" startOffset="50%" text-anchor="middle">${xml(destination)}</textPath></text>
    <path d="M365 937V1138M558 937V1138" stroke="#b28b52" stroke-width="1.5"/>
    <g transform="translate(401 937) scale(.95)"><path d="${bangladeshOrnament}" fill="url(#gold)"/></g>
    <text x="580" y="968" fill="#d6b578" font-family="PassportDisplay,Georgia,serif" font-size="30" letter-spacing="6" textLength="235" lengthAdjust="spacingAndGlyphs">${xml(destination)}</text>
    <line x1="575" y1="980" x2="818" y2="980" stroke="#b78b53"/>${list}
    ${names.length > selected.length ? `<text x="570" y="1138" fill="#d8bb86" font-family="Georgia,serif" font-size="13">+ ${names.length - selected.length} more inside</text>` : ""}
    ${botanicalDataUrl ? `<image x="62" y="1150" width="776" height="71" opacity=".48" filter="url(#goldFoliage)" href="${botanicalDataUrl}"/>` : ""}
    <circle cx="450" cy="1189" r="25" fill="#082d24" stroke="#d0a765"/><path d="M450 1160l7 29-7 29-7-29zM421 1189l29-7 29 7-29 7z" fill="#c69a5d"/>
    ${data.name ? `<text x="58" y="1200" fill="#e0c38e" font-family="Georgia,serif" font-size="15">Prepared for ${xml(data.name)}</text>` : ""}
    ${coverCaption(data, photoDataUrl, "#dac69d", 1212)}
  </svg>`;
}

function renderTravelogueCover(data: PassportData, photoDataUrl?: string, lilyDataUrl?: string, paperDataUrl?: string, assets?: CoverAssets): string {
  const names = coverNames(data);
  const selected = names.slice(0, 6);
  const destination = coverDestination(data);
  const list = selected.map((name, index) => {
    const y = 1070 + index * 23;
    return `<text x="285" y="${y}" fill="#b45d37" font-family="Georgia,serif" font-size="16" font-weight="700">${String(index + 1).padStart(2, "0")}</text><text x="330" y="${y}" fill="#143a2c" font-family="Georgia,serif" font-size="18" ${name.length > 18 ? 'textLength="220" lengthAdjust="spacingAndGlyphs"' : ""}>${xml(name)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1260" viewBox="0 0 900 1260" role="img" aria-label="Travelogue Atlas passport cover"><defs>
    ${displayFont(assets?.fontDataUrl)}
    <clipPath id="journalPhoto"><rect x="0" y="340" width="900" height="590"/></clipPath>
    <linearGradient id="journalTone" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f7e6bb" stop-opacity=".05"/><stop offset="1" stop-color="#0b3b35" stop-opacity=".18"/></linearGradient>
    <filter id="lilyInk"><feColorMatrix type="matrix" values=".20 .32 .09 0 0 .28 .38 .16 0 0 .20 .28 .10 0 0 0 0 0 .76 0"/></filter>
    </defs>
    <rect width="900" height="1260" fill="#f6efdf"/>${paperDataUrl ? `<image x="0" y="0" width="900" height="1260" preserveAspectRatio="xMidYMid slice" opacity=".32" href="${paperDataUrl}"/>` : ""}
    ${compass(128,124,69)}
    <text x="235" y="180" fill="#0c3328" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-weight="700" font-size="205" textLength="396" lengthAdjust="spacingAndGlyphs">ATLAS</text>
    <text x="232" y="323" fill="#0c3328" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-weight="700" font-size="177" textLength="474" lengthAdjust="spacingAndGlyphs">PASSPORT</text>
    <text x="53" y="248" fill="#143a2d" font-family="Georgia,serif" font-size="15" letter-spacing="4"><tspan x="53">A</tspan><tspan x="53" dy="25">PERSONAL</tspan><tspan x="53" dy="25">TRAVEL</tspan><tspan x="53" dy="25">KEEPSAKE</tspan></text><line x1="53" y1="325" x2="200" y2="325" stroke="#b55c38" stroke-width="2"/>
    <text x="738" y="130" fill="#ad5736" font-family="Georgia,serif" font-size="18" font-weight="700" letter-spacing="4" textLength="127" lengthAdjust="spacingAndGlyphs">TRAVELOGUE</text><line x1="738" y1="152" x2="865" y2="152" stroke="#b55c38" stroke-width="2"/>
    <text x="739" y="201" fill="#133b2f" font-family="Georgia,serif" font-size="16" letter-spacing="4"><tspan x="739">PLACES</tspan><tspan x="739" dy="31">PEOPLE</tspan><tspan x="739" dy="31">CULTURE</tspan><tspan x="739" dy="31">NATURE</tspan></text><line x1="738" y1="326" x2="865" y2="326" stroke="#b55c38" stroke-width="2"/>
    ${data.name ? `<text x="701" y="337" text-anchor="end" fill="#a65b3c" font-family="Georgia,serif" font-size="15" textLength="${Math.min(235, Math.max(55, data.name.length * 10))}" lengthAdjust="spacingAndGlyphs">For ${xml(data.name)}</text>` : ""}
    <rect x="0" y="340" width="900" height="590" fill="#698d73"/>${photoDataUrl ? `<image x="0" y="340" width="900" height="590" preserveAspectRatio="xMidYMid slice" clip-path="url(#journalPhoto)" href="${photoDataUrl}"/>` : `<g transform="translate(390 440) scale(2.4)">${data.districts.length ? `<path d="${bangladeshOrnament}" fill="#1f6049"/>` : `<circle cx="40" cy="45" r="65" fill="none" stroke="#1f6049" stroke-width="3"/>`}</g>`}<rect x="0" y="340" width="900" height="590" fill="url(#journalTone)"/>
    <path d="M0 830L900 678V950L0 1102Z" fill="#f6efdf"/><path d="M0 830L900 678M0 1102L900 950" fill="none" stroke="#b96b43" stroke-width="2"/>
    <g transform="rotate(-10 450 900)"><text x="88" y="937" fill="#0e362a" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-weight="700" font-size="177" textLength="765" lengthAdjust="spacingAndGlyphs">${xml(destination)}</text></g>
    <path d="M32 915q45 25 12 50t5 48m-33-92q50 38 21 84M825 801q-25 19-8 46t-10 42m45-91q-39 32-23 77" fill="none" stroke="#be7352" stroke-width="1.5" opacity=".6"/>
    <text x="77" y="1184" fill="#b95b35" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-size="214" font-style="italic" textLength="170" lengthAdjust="spacingAndGlyphs">${data.districts.length || data.world.length}</text>
    <line x1="255" y1="1031" x2="255" y2="1194" stroke="#b86140" stroke-width="2"/>
    <text x="285" y="1043" fill="#173b2e" font-family="Georgia,serif" font-size="19" font-weight="700" letter-spacing="3">${data.districts.length ? "DISTRICTS" : "PLACES"} VISITED</text>${list}
    ${names.length > selected.length ? `<text x="330" y="1200" fill="#48614e" font-family="Georgia,serif" font-size="13">+ ${names.length - selected.length} more inside</text>` : ""}
    <line x1="577" y1="1031" x2="577" y2="1194" stroke="#b86140" stroke-width="2"/>
    ${assets?.lilyEngravingDataUrl ? `<image x="585" y="1022" width="315" height="182" preserveAspectRatio="xMidYMid meet" href="${assets.lilyEngravingDataUrl}"/>` : lilyDataUrl ? `<image x="591" y="1015" width="309" height="205" preserveAspectRatio="xMidYMid meet" filter="url(#lilyInk)" href="${lilyDataUrl}"/>` : ""}
    <line x1="45" y1="1208" x2="855" y2="1208" stroke="#ad6a4e"/>${coverCaption(data, photoDataUrl, "#53634e", 1218)}
  </svg>`;
}

export function renderPassportCover(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, paperDataUrl?: string, lilyDataUrl?: string, style: PassportStyle = "archive", assets?: CoverAssets): string {
  if (style === "expedition") return renderExpeditionCover(data, photoDataUrl, botanicalDataUrl, assets);
  if (style === "travelogue") return renderTravelogueCover(data, photoDataUrl, lilyDataUrl, paperDataUrl, assets);
  return renderArchiveCover(data, photoDataUrl, botanicalDataUrl, paperDataUrl, lilyDataUrl);
}

export function renderManifestPage(page: ManifestPage, documentPage: number, style: PassportStyle = "archive", memories: Record<string, PassportMemoryLine> = {}, assets: ManifestAssets = {}): string {
  const expedition = style === "expedition";
  const travelogue = style === "travelogue";
  const palette = expedition
    ? { paper: "#102f27", ink: "#f2e3bf", muted: "#d0bd94", accent: "#d4a25d", rule: "#826e4a", ghost: "#d7bd83" }
    : { paper: travelogue ? "#f4ecdc" : "#f6f0e3", ink: "#0c3328", muted: "#536257", accent: "#c85838", rule: "#b9aa8e", ghost: "#667a67" };
  const firstItem = (page.index - 1) * 8 + 1;
  const lastItem = firstItem + page.names.length - 1;
  const photos = page.names.map((name) => ({ name, dataUrl: assets.photoDataByName?.[name] })).filter((photo): photo is { name: string; dataUrl: string } => Boolean(photo.dataUrl)).slice(0, 3);
  const sparsePhoto = page.section === "World places" && page.names.length <= 2 ? photos[0] : undefined;
  const paper = `<rect width="900" height="1260" fill="${palette.paper}"/><rect width="900" height="1260" fill="url(#manifestGrain)"/>`;
  const folio = `<line x1="33" y1="1225" x2="867" y2="1225" stroke="${palette.rule}"/><text x="34" y="1245" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">ATLAS PASSPORT</text><text x="450" y="1245" text-anchor="middle" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">${xml(page.section.toUpperCase())}</text><text x="866" y="1245" text-anchor="end" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8">${String(documentPage).padStart(2, "0")}</text>`;
  const stamp = (x: number, y: number, label: string) => `<g transform="translate(${x} ${y}) rotate(-10)" opacity=".9"><circle r="55" fill="${palette.paper}" fill-opacity=".6" stroke="${palette.ink}" stroke-width="2.4"/><circle r="47" fill="none" stroke="${palette.ink}" stroke-width="1" stroke-dasharray="3 3"/><path d="M-75 22q46 20 92 0t92 0M-75 31q46 20 92 0t92 0M-75 40q46 20 92 0t92 0" fill="none" stroke="${palette.ink}" stroke-width="1.3"/><text y="-17" text-anchor="middle" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="9" letter-spacing="2">ATLAS</text><text y="5" text-anchor="middle" fill="${palette.ink}" font-family="Georgia,serif" font-size="11">${xml(label.toUpperCase())}</text></g>`;
  const lines = (value: string, width = 39) => {
    const words = value.trim().split(/\s+/).filter(Boolean);
    const output: string[] = [];
    for (const word of words) {
      const current = output[output.length - 1];
      if (!current || `${current} ${word}`.length > width) output.push(word);
      else output[output.length - 1] = `${current} ${word}`;
    }
    return output.slice(0, 2);
  };

  if (sparsePhoto) {
    const memory = memories[sparsePhoto.name];
    const memoryLabel = memory?.note ? [...memory.note].slice(0, 62).join("") : "A MEMORY FOR A LIFETIME";
    const date = memory?.date ? xml(memory.date) : "MEMORY EDITION";
    const postageCountry = sparsePhoto.name === "Germany" ? "DEUTSCHLAND" : sparsePhoto.name.toUpperCase();
    const perforationX = Array.from({ length: 13 }, (_, index) => 686 + index * 14).map((x) => `<circle cx="${x}" cy="81" r="3.5"/><circle cx="${x}" cy="325" r="3.5"/>`).join("");
    const perforationY = Array.from({ length: 17 }, (_, index) => 87 + index * 14.5).map((y) => `<circle cx="681" cy="${y}" r="3.5"/><circle cx="856" cy="${y}" r="3.5"/>`).join("");
    const postageMask = `<mask id="postageEdge"><rect x="677" y="77" width="183" height="252" fill="white"/><g fill="black">${perforationX}${perforationY}</g></mask>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1260" viewBox="0 0 900 1260" role="img" aria-label="${xml(style)} passport ${xml(page.section)} page"><defs><pattern id="manifestGrain" width="37" height="41" patternUnits="userSpaceOnUse"><circle cx="7" cy="8" r=".55" fill="${palette.ghost}" opacity=".15"/><circle cx="29" cy="31" r=".45" fill="${palette.accent}" opacity=".11"/></pattern><clipPath id="sparseHero"><rect x="0" y="540" width="900" height="720"/></clipPath><linearGradient id="sparseShade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${palette.paper}" stop-opacity="0"/><stop offset="1" stop-color="#071f18" stop-opacity=".27"/></linearGradient>${postageMask}<filter id="postageInk"><feColorMatrix type="matrix" values=".20 .28 .12 0 0 .24 .31 .14 0 0 .18 .23 .10 0 0 0 0 0 .88 0"/></filter></defs>${paper}<line x1="235" y1="51" x2="863" y2="51" stroke="${palette.rule}"/><g transform="translate(42 43)">${compass(0,0,24)}</g><text x="97" y="44" fill="${palette.accent}" font-family="Georgia,serif" font-size="21" letter-spacing="8">ATLAS</text><text x="99" y="66" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="10" letter-spacing="6">PASSPORT</text><text x="862" y="37" text-anchor="end" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">PLACES · PEOPLE · PERSPECTIVE</text><text x="37" y="224" fill="${palette.ink}" font-family="Georgia,serif" font-size="143" font-weight="700" letter-spacing="-7">World</text><text x="37" y="363" fill="${palette.accent}" font-family="Georgia,serif" font-size="143" font-style="italic" letter-spacing="-7">places</text><line x1="125" y1="387" x2="254" y2="387" stroke="${palette.accent}" stroke-width="1.5"/><g transform="translate(575 244)" fill="none" stroke="${palette.ghost}" opacity=".22"><circle r="186"/><ellipse rx="88" ry="186"/><ellipse rx="148" ry="186"/><path d="M-186 0h372M-166 -84h332M-166 84h332"/><path d="M-171 -44q47 28 92 0t90 4t110 -4M-158 47q44 -23 87 0t87 -3t113 6"/></g><g transform="translate(760 482)">${compass(0,0,50)}</g><g aria-label="Vintage ${xml(sparsePhoto.name)} postage stamp" transform="rotate(1 768 203)"><g mask="url(#postageEdge)"><rect x="677" y="77" width="183" height="252" fill="${palette.paper}"/><rect x="679" y="79" width="179" height="248" fill="none" stroke="${palette.accent}" stroke-width="1.2"/></g><rect x="692" y="92" width="153" height="222" fill="none" stroke="${palette.rule}"/><text x="703" y="113" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="7.2" font-weight="700" letter-spacing="1.35">${xml(postageCountry)}</text><text x="835" y="118" text-anchor="end" fill="${palette.ink}" font-family="Georgia,serif" font-size="27">100</text><line x1="702" y1="123" x2="835" y2="123" stroke="${palette.rule}"/><image x="702" y="132" width="133" height="139" preserveAspectRatio="xMidYMid slice" filter="url(#postageInk)" href="${xml(sparsePhoto.dataUrl)}"/><rect x="702" y="132" width="133" height="139" fill="none" stroke="${palette.ink}" stroke-width="1"/><path d="M702 279h133M714 286h109" stroke="${palette.rule}"/><text x="768" y="299" text-anchor="middle" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="6.4" letter-spacing="1.15">REISEN VERBINDET DIE WELT</text><text x="768" y="309" text-anchor="middle" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="5.5" letter-spacing="2">ATLAS · 2026</text></g><g opacity=".66">${stamp(827,298,"Europa")}</g><text x="42" y="472" fill="${palette.accent}" font-family="Georgia,serif" font-size="64">${String(firstItem).padStart(2,"0")}</text><line x1="124" y1="417" x2="124" y2="501" stroke="${palette.accent}"/><text x="153" y="456" fill="${palette.ink}" font-family="Georgia,serif" font-size="54" font-weight="700">${xml(sparsePhoto.name)}</text><text x="154" y="495" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="11" letter-spacing="5">${xml(memoryLabel.toUpperCase())}</text><text x="154" y="522" fill="${palette.muted}" font-family="Georgia,serif" font-size="15" font-style="italic">${date}</text>${assets.botanicalDataUrl ? `<image x="715" y="352" width="185" height="210" preserveAspectRatio="xMidYMid meet" opacity=".78" href="${xml(assets.botanicalDataUrl)}"/>` : ""}<image x="0" y="540" width="900" height="720" preserveAspectRatio="xMidYMid slice" clip-path="url(#sparseHero)" href="${xml(sparsePhoto.dataUrl)}"/><rect x="0" y="540" width="900" height="720" fill="url(#sparseShade)"/><text x="38" y="1216" fill="#fff4dd" font-family="Arial,sans-serif" font-size="9" letter-spacing="3">${xml(sparsePhoto.name.toUpperCase())} · A PLACE YOU MARKED</text><text x="862" y="1216" text-anchor="end" fill="#fff4dd" font-family="Arial,sans-serif" font-size="9">${String(documentPage).padStart(2,"0")} / ATLAS</text></svg>`;
  }

  const defaultNotes: Record<string, string> = {
    Bagerhat: "Old mosques, river roads and quiet courtyards.", Barisal: "Rivers everywhere, floating markets and open water.", Chattogram: "Hills, a busy port and the meeting of land and sea.", "Cox's Bazar": "Endless shoreline, fishing boats and a wide horizon.", Dhaka: "A city of movement — rickshaws, rivers and rhythm.", Rajshahi: "Mango orchards, the wide Padma and a gentler pace.", Sylhet: "Tea gardens, rolling hills and misty mornings.", Sundarban: "Tangled rivers, vast mangroves and wild silence."
  };
  const entryRows = page.names.map((name, index) => {
    const y = 354 + index * 94;
    const memory = memories[name];
    const note = memory?.note || defaultNotes[name] || "A marked place in your personal atlas.";
    const noteLines = lines(note);
    const globalIndex = String(firstItem + index).padStart(2, "0");
    const fontSize = name.length > 24 ? 15 : 18;
    return `<g data-place-name="${xml(name)}"><line x1="51" y1="${y - 8}" x2="51" y2="${y + 67}" stroke="${palette.rule}"/><circle cx="51" cy="${y - 8}" r="15" fill="${palette.accent}"/><text x="51" y="${y - 3}" text-anchor="middle" fill="#fff6e8" font-family="Georgia,serif" font-size="12">${globalIndex}</text><text x="86" y="${y}" fill="${palette.ink}" font-family="Georgia,serif" font-size="${fontSize}" font-weight="700" letter-spacing="1">${xml(name.toUpperCase())}</text><text x="88" y="${y + 21}" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="4">${memory?.date ? xml(memory.date) : "MARKED VISITED"}</text><text x="88" y="${y + 43}" fill="${palette.muted}" font-family="Georgia,serif" font-size="12" font-style="italic"><tspan x="88">${xml(noteLines[0] || "")}</tspan>${noteLines[1] ? `<tspan x="88" dy="15">${xml(noteLines[1])}</tspan>` : ""}</text></g>`;
  }).join("");
  const photo0 = photos[0];
  const photo1 = photos[1] || photos[0];
  const photo2 = photos[2] || photos[0];
  const photoLayout = photo0 ? `<image x="421" y="54" width="446" height="372" preserveAspectRatio="xMidYMid slice" clip-path="url(#manifestHero)" href="${xml(photo0.dataUrl)}"/><text x="422" y="443" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">${xml(photo0.name.toUpperCase())} · BANGLADESH</text><text x="422" y="462" fill="${palette.muted}" font-family="Georgia,serif" font-size="11" font-style="italic">A place held in landscape, light and memory.</text>${photo1 ? `<image x="371" y="495" width="238" height="401" preserveAspectRatio="xMidYMid slice" clip-path="url(#manifestPortraitA)" href="${xml(photo1.dataUrl)}"/><text x="372" y="912" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">${xml(photo1.name.toUpperCase())}</text>` : ""}${photo2 ? `<image x="621" y="495" width="246" height="401" preserveAspectRatio="xMidYMid slice" clip-path="url(#manifestPortraitB)" href="${xml(photo2.dataUrl)}"/><text x="622" y="912" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">${xml(photo2.name.toUpperCase())}</text>` : ""}${stamp(748,527,"Bangladesh")}` : "";
  const map = `<text x="619" y="943" text-anchor="middle" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">DISTRICT RECORD · RIVER COUNTRY</text><g transform="translate(500 914) scale(1.38)" opacity=".68"><path d="${bangladeshOrnament}" fill="none" stroke="${palette.ghost}" stroke-width="1.25"/><path d="${bangladeshOrnament}" fill="${palette.ghost}" opacity=".08"/></g><path d="M519 1038q42 -45 76 -15t74 -21M514 1059q48 -32 89 -7t77 -27" fill="none" stroke="${palette.accent}" stroke-width="1.25"/><text x="623" y="1048" text-anchor="middle" fill="${palette.ink}" font-family="Georgia,serif" font-size="16" letter-spacing="4">BANGLADESH</text><text x="490" y="973" text-anchor="end" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="7" letter-spacing="2">INDIA</text><text x="711" y="984" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="7" letter-spacing="2">MEGHALAYA</text><text x="725" y="1119" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="7" letter-spacing="2">BAY OF BENGAL</text><g transform="translate(425 1047)">${compass(0,0,31)}</g><g transform="translate(739 1065)"><line x1="0" y1="0" x2="34" y2="0" stroke="${palette.accent}" stroke-width="1.2"/><text x="42" y="3" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="6.5" letter-spacing="1.4">RIVER ROUTE</text><line x1="0" y1="18" x2="34" y2="18" stroke="${palette.ghost}" stroke-width="1.2" stroke-dasharray="2 2"/><text x="42" y="21" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="6.5" letter-spacing="1.4">DISTRICT EDGE</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1260" viewBox="0 0 900 1260" role="img" aria-label="${xml(style)} passport ${xml(page.section)} page"><defs><pattern id="manifestGrain" width="37" height="41" patternUnits="userSpaceOnUse"><circle cx="7" cy="8" r=".55" fill="${palette.ghost}" opacity=".15"/><circle cx="29" cy="31" r=".45" fill="${palette.accent}" opacity=".11"/></pattern><clipPath id="manifestMasthead"><rect x="26" y="50" width="376" height="252"/></clipPath><clipPath id="manifestHero"><rect x="421" y="54" width="446" height="372"/></clipPath><clipPath id="manifestPortraitA"><rect x="371" y="495" width="238" height="401"/></clipPath><clipPath id="manifestPortraitB"><rect x="621" y="495" width="246" height="401"/></clipPath></defs>${paper}<text x="34" y="31" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="8" letter-spacing="4">ATLAS PASSPORT</text><text x="450" y="31" text-anchor="middle" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="7" letter-spacing="3">PEOPLE · PLACES · CULTURE · JOURNEYS</text><text x="866" y="31" text-anchor="end" fill="${palette.ink}" font-family="Arial,sans-serif" font-size="8" letter-spacing="3">SOUTH ASIA · PERSONAL TRAVEL RECORD</text><line x1="33" y1="41" x2="867" y2="41" stroke="${palette.rule}"/><g clip-path="url(#manifestMasthead)"><text x="31" y="146" fill="${palette.ink}" font-family="PassportDisplay,'Bodoni MT',Georgia,serif" font-size="86" font-weight="700" letter-spacing="-3" textLength="356" lengthAdjust="spacingAndGlyphs">Bangladesh</text><text x="52" y="203" fill="${palette.accent}" font-family="Georgia,serif" font-size="38" letter-spacing="10" textLength="328" lengthAdjust="spacingAndGlyphs">DISTRICTS</text><text x="54" y="232" fill="${palette.muted}" font-family="Georgia,serif" font-size="12" font-style="italic" letter-spacing="4" textLength="320" lengthAdjust="spacingAndGlyphs">RIVER LANDS, LIVING CULTURE</text><text x="43" y="261" fill="${palette.muted}" font-family="Georgia,serif" font-size="13" font-style="italic"><tspan x="43">From deltaic islands to ancient cities,</tspan><tspan x="43" dy="18">a personal mosaic of landscapes and lives.</tspan></text></g><line x1="405" y1="54" x2="405" y2="286" stroke="${palette.rule}" opacity=".7"/><path d="M164 310h38l5 -5l5 5h38" fill="none" stroke="${palette.rule}"/>${entryRows}${photoLayout}${assets.lilyDataUrl ? `<image x="28" y="1028" width="335" height="165" preserveAspectRatio="xMidYMid meet" opacity="${expedition ? ".42" : ".8"}" href="${xml(assets.lilyDataUrl)}"/>` : ""}${map}<text x="620" y="1155" text-anchor="middle" fill="${palette.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">Entries ${String(firstItem).padStart(2,"0")} - ${String(lastItem).padStart(2,"0")}</text>${folio}</svg>`;
}
