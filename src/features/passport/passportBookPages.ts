import type { PassportData, PassportStyle } from "./passport";

export type PassportBookDetails = {
  orderedNames?: readonly string[];
  memories?: Record<string, { date?: string; note?: string; favorite?: boolean }>;
};

const WIDTH = 900;
const HEIGHT = 1260;

type BookPalette = { paper: string; ink: string; muted: string; coral: string; rule: string; ghost: string; photoShade: string };

function palette(style: PassportStyle): BookPalette {
  if (style === "expedition") return { paper: "#102f27", ink: "#f2e3bf", muted: "#d0bd94", coral: "#d4a25d", rule: "#826e4a", ghost: "#d7bd83", photoShade: "#071f18" };
  return { paper: style === "travelogue" ? "#f4ecdc" : "#f6f0e3", ink: "#0c3328", muted: "#536257", coral: "#c85838", rule: "#b9aa8e", ghost: "#667a67", photoShade: "#071f18" };
}

function xml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

function clipped(value: string, limit: number): string {
  const characters = [...value.trim()];
  return characters.length > limit ? `${characters.slice(0, Math.max(1, limit - 1)).join("")}…` : characters.join("");
}

function bookFacts(data: PassportData, details: PassportBookDetails = {}) {
  const orderedNames = details.orderedNames?.length ? [...details.orderedNames] : [...data.world, ...data.districts];
  const entries = orderedNames.map((name) => ({ name, ...(details.memories?.[name] ?? {}) }));
  const remembered = entries.filter((entry) => entry.note || entry.date);
  const dated = entries.filter((entry) => entry.date).sort((left, right) => (left.date ?? "").localeCompare(right.date ?? ""));
  return {
    orderedNames,
    remembered,
    dated,
    favoriteCount: entries.filter((entry) => entry.favorite).length,
    firstDate: dated[0]?.date,
    lastDate: dated.at(-1)?.date,
  };
}

function dateSpan(firstDate?: string, lastDate?: string): string {
  if (!firstDate) return "NOT ADDED";
  if (!lastDate || firstDate === lastDate) return firstDate;
  return `${firstDate} — ${lastDate}`;
}

function defs(colors: BookPalette): string {
  return `<defs><pattern id="bookGrain" width="41" height="47" patternUnits="userSpaceOnUse"><circle cx="8" cy="12" r=".55" fill="${colors.ghost}" opacity=".12"/><circle cx="33" cy="37" r=".45" fill="${colors.coral}" opacity=".09"/></pattern><linearGradient id="bookPhotoShade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${colors.photoShade}" stop-opacity="0"/><stop offset="1" stop-color="${colors.photoShade}" stop-opacity=".24"/></linearGradient><clipPath id="bookPhoto"><rect x="82" y="433" width="736" height="407"/></clipPath></defs>`;
}

function surface(colors: BookPalette, paperDataUrl?: string): string {
  return `<rect width="${WIDTH}" height="${HEIGHT}" fill="${colors.paper}"/>${paperDataUrl ? `<image x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice" opacity=".3" href="${paperDataUrl}"/>` : `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bookGrain)"/>`}`;
}

function compass(x: number, y: number, size: number, colors: BookPalette): string {
  return `<g transform="translate(${x} ${y})" fill="none"><circle r="${size}" stroke="${colors.rule}"/><circle r="${size * .78}" stroke="${colors.ink}" stroke-width="1.4"/><path d="M0 ${-size * .92}L${size * .12} ${-size * .12}L${size * .92} 0L${size * .12} ${size * .12}L0 ${size * .92}L${-size * .12} ${size * .12}L${-size * .92} 0L${-size * .12} ${-size * .12}Z" fill="${colors.ink}"/><path d="M0 ${-size * .92}L${size * .12} ${-size * .12}L0 0M${size * .92} 0L${size * .12} ${size * .12}L0 0" fill="${colors.paper}"/><circle r="${size * .17}" fill="${colors.coral}" stroke="${colors.paper}"/><g fill="${colors.ink}" font-family="Georgia,serif" font-size="${Math.max(10, size * .18)}" text-anchor="middle"><text y="${-size * 1.13}">N</text><text y="${size * 1.27}">S</text><text x="${-size * 1.15}" y="4">W</text><text x="${size * 1.15}" y="4">E</text></g></g>`;
}

function globe(x: number, y: number, radius: number, colors: BookPalette, opacity = .17): string {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${colors.ghost}" opacity="${opacity}"><circle r="${radius}"/><ellipse rx="${radius * .47}" ry="${radius}"/><ellipse rx="${radius * .78}" ry="${radius}"/><path d="M${-radius} 0H${radius}M${-radius * .9} ${-radius * .45}H${radius * .9}M${-radius * .9} ${radius * .45}H${radius * .9}"/></g>`;
}

function photo(data: PassportData, photoDataUrl: string | undefined, x: number, y: number, width: number, height: number, colors: BookPalette): string {
  if (!photoDataUrl) return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${colors.ghost}" opacity=".13"/><g transform="translate(${x + width / 2} ${y + height / 2})">${compass(0, 0, Math.min(width, height) * .2, colors)}</g>`;
  return `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" href="${photoDataUrl}"/><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#bookPhotoShade)"/>${data.photo ? `<text x="${x + 14}" y="${y + height - 16}" fill="#fff5df" font-family="Arial,sans-serif" font-size="9" letter-spacing="2">${xml(data.photo.place.toUpperCase())} · PERSONAL ATLAS</text>` : ""}`;
}

function pageShell(label: string, colors: BookPalette, content: string, paperDataUrl?: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${xml(label)}">${defs(colors)}${surface(colors, paperDataUrl)}<rect x="38" y="32" width="824" height="1196" fill="none" stroke="${colors.rule}"/>${content}</svg>`;
}

export function renderBookFrontCover(data: PassportData, photoDataUrl?: string, paperDataUrl?: string, style: PassportStyle = "archive"): string {
  const colors = palette(style);
  const count = data.world.length + data.districts.length;
  const map = data.districts.length ? "BANGLADESH" : data.world.length === 1 ? data.world[0].toUpperCase() : "YOUR WORLD";
  return pageShell("Atlas passport front cover", colors, `<line x1="82" y1="105" x2="512" y2="105" stroke="${colors.rule}"/><path d="M284 89v32M268 105h32" stroke="${colors.coral}"/><text x="80" y="239" fill="${colors.ink}" font-family="Georgia,serif" font-size="128" font-weight="700" letter-spacing="-5">ATLAS</text><text x="80" y="348" fill="${colors.ink}" font-family="Georgia,serif" font-size="91" font-weight="700" letter-spacing="-3">PASSPORT</text><text x="82" y="396" fill="${colors.coral}" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="7">PERSONAL TRAVEL RECORD</text><line x1="548" y1="73" x2="548" y2="408" stroke="${colors.rule}"/>${compass(697,215,102,colors)}<rect x="76" y="427" width="748" height="419" fill="none" stroke="${colors.rule}"/>${photo(data,photoDataUrl,82,433,736,407,colors)}<line x1="76" y1="864" x2="824" y2="864" stroke="${colors.rule}"/><g transform="translate(97 902)">${globe(95,98,84,colors,.22)}</g><text x="192" y="1011" text-anchor="middle" fill="${colors.ink}" font-family="Georgia,serif" font-size="21" letter-spacing="3">${xml(map)}</text><line x1="310" y1="885" x2="310" y2="1168" stroke="${colors.rule}"/><text x="338" y="930" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="9" letter-spacing="3">PREPARED FOR</text><text x="338" y="982" fill="${colors.ink}" font-family="Georgia,serif" font-size="25" font-style="italic">${xml(clipped(data.name || "A LIFE MORE CURIOUS",22))}</text><line x1="338" y1="1011" x2="616" y2="1011" stroke="${colors.rule}"/><text x="338" y="1060" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="9" letter-spacing="3">EDITION FOCUS</text><text x="338" y="1102" fill="${colors.ink}" font-family="Georgia,serif" font-size="19">${data.world.length && data.districts.length ? "WORLD + BANGLADESH" : xml(map)}</text><line x1="655" y1="885" x2="655" y2="1168" stroke="${colors.rule}"/><text x="738" y="945" text-anchor="middle" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="10" letter-spacing="3">EDITION</text><text x="738" y="1042" text-anchor="middle" fill="${colors.ink}" font-family="Georgia,serif" font-size="72">${String(Math.max(count,1)).padStart(2,"0")}</text><line x1="692" y1="1065" x2="784" y2="1065" stroke="${colors.coral}"/><text x="738" y="1101" text-anchor="middle" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="9" letter-spacing="2">PLACES MARKED</text><text x="78" y="1204" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">ATLAS · PLACES · PEOPLE · PERSPECTIVE</text>`, paperDataUrl);
}

export function renderBookOpeningPage(data: PassportData, photoDataUrl?: string, paperDataUrl?: string, style: PassportStyle = "archive", details: PassportBookDetails = {}): string {
  const colors = palette(style);
  const name = data.name || "A LIFE MORE CURIOUS";
  const facts = bookFacts(data, details);
  return pageShell("Atlas passport opening page", colors, `${globe(665,345,250,colors,.13)}<text x="66" y="224" fill="${colors.ink}" font-family="Georgia,serif" font-size="145" font-weight="700" letter-spacing="-6">ATLAS</text><text x="66" y="360" fill="${colors.coral}" font-family="Georgia,serif" font-size="125" font-weight="700" letter-spacing="-5">PASSPORT</text><text x="72" y="424" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="17" letter-spacing="8">PLACES · PEOPLE · PERSPECTIVE</text><line x1="72" y1="450" x2="518" y2="450" stroke="${colors.rule}"/><text x="72" y="571" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="14" letter-spacing="5">THIS PASSPORT BELONGS TO</text><text x="72" y="639" fill="${colors.ink}" font-family="Georgia,serif" font-size="38" font-style="italic">${xml(clipped(name,31))}</text><line x1="72" y1="664" x2="520" y2="664" stroke="${colors.rule}"/><rect x="72" y="745" width="448" height="314" fill="none" stroke="${colors.rule}"/>${photo(data,photoDataUrl,80,753,432,298,colors)}<line x1="558" y1="735" x2="558" y2="1116" stroke="${colors.rule}"/><g font-family="Arial,sans-serif"><text x="604" y="777" fill="${colors.muted}" font-size="10" letter-spacing="4">PLACES</text><text x="604" y="819" fill="${colors.ink}" font-family="Georgia,serif" font-size="34">${data.world.length + data.districts.length}</text><line x1="604" y1="837" x2="808" y2="837" stroke="${colors.rule}"/><text x="604" y="885" fill="${colors.muted}" font-size="10" letter-spacing="4">MEMORIES</text><text x="604" y="925" fill="${colors.ink}" font-family="Georgia,serif" font-size="21">${facts.remembered.length ? `${facts.remembered.length} RECORDED` : "YOURS TO ADD"}</text><line x1="604" y1="943" x2="808" y2="943" stroke="${colors.rule}"/><text x="604" y="991" fill="${colors.muted}" font-size="10" letter-spacing="4">DATES</text><text x="604" y="1031" fill="${colors.ink}" font-family="Georgia,serif" font-size="15">${xml(dateSpan(facts.firstDate,facts.lastDate))}</text><line x1="604" y1="1049" x2="808" y2="1049" stroke="${colors.rule}"/><text x="604" y="1097" fill="${colors.muted}" font-size="10" letter-spacing="4">PRIVACY</text><text x="604" y="1137" fill="${colors.ink}" font-family="Georgia,serif" font-size="21">LOCAL</text></g><text x="72" y="1198" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">NOTHING IS INFERRED. ONLY THE PLACES AND MEMORIES YOU CHOOSE.</text>`, paperDataUrl);
}

export function renderBookClosingPage(data: PassportData, photoDataUrl?: string, paperDataUrl?: string, style: PassportStyle = "archive", details: PassportBookDetails = {}): string {
  const colors = palette(style);
  const facts = bookFacts(data, details);
  const routePoints = [[188,637],[356,575],[511,502],[650,445],[793,397]].slice(0, Math.max(1, Math.min(5,facts.orderedNames.length)));
  const routeMarks = routePoints.map(([x,y],index)=>`<g><circle cx="${x}" cy="${y}" r="11" fill="${colors.coral}" stroke="${colors.paper}" stroke-width="6"/><text x="${x}" y="${y+31}" text-anchor="middle" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="8" letter-spacing="1">${xml(clipped(facts.orderedNames[index] ?? "MARK",14).toUpperCase())}</text></g>`).join("");
  const memoryLines = facts.remembered.slice(0,3).map((entry,index)=>`<g><text x="72" y="${912+index*62}" fill="${colors.ink}" font-family="Georgia,serif" font-size="15">${xml(clipped(entry.name,20))}</text><text x="426" y="${912+index*62}" text-anchor="end" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="9" letter-spacing="1">${xml(entry.date || "MEMORY")}</text><text x="72" y="${934+index*62}" fill="${colors.muted}" font-family="Georgia,serif" font-size="11" font-style="italic">${xml(clipped(entry.note || "Date recorded",48))}</text><line x1="72" y1="${949+index*62}" x2="430" y2="${949+index*62}" stroke="${colors.rule}"/></g>`).join("");
  const emptyLines = [0,1,2].map((index)=>`<line x1="72" y1="${918+index*62}" x2="430" y2="${918+index*62}" stroke="${colors.rule}"/>`).join("");
  return pageShell("Atlas passport closing page", colors, `<text x="70" y="156" fill="${colors.ink}" font-family="Georgia,serif" font-size="88" font-weight="700" letter-spacing="-3"><tspan x="70">THE JOURNEY</tspan><tspan x="70" dy="89">CONTINUES</tspan></text><line x1="72" y1="283" x2="248" y2="283" stroke="${colors.coral}" stroke-width="2"/><text x="72" y="346" fill="${colors.ink}" font-family="Georgia,serif" font-size="31"><tspan x="72">Every marked place</tspan><tspan x="72" dy="39">adds to the story.</tspan></text>${globe(565,584,295,colors,.19)}<path d="M42 706C186 620 259 657 362 570S590 454 852 367" fill="none" stroke="${colors.coral}" stroke-width="2.5"/><path d="M42 706l-38 24M852 367l32-23" fill="none" stroke="${colors.coral}" stroke-width="2" stroke-dasharray="8 8"/>${routeMarks}<text x="72" y="866" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="12" letter-spacing="5">${facts.remembered.length ? "MEMORIES KEPT" : "NOTES"}</text>${facts.remembered.length ? memoryLines : emptyLines}<rect x="478" y="796" width="340" height="284" fill="none" stroke="${colors.rule}"/>${photo(data,photoDataUrl,486,804,324,268,colors)}<text x="648" y="1108" text-anchor="middle" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="9" letter-spacing="2">${facts.favoriteCount ? `${facts.favoriteCount} FAVORITE${facts.favoriteCount === 1 ? "" : "S"}` : "PERSONAL EDITION"}</text><line x1="72" y1="1157" x2="382" y2="1157" stroke="${colors.rule}"/><line x1="518" y1="1157" x2="828" y2="1157" stroke="${colors.rule}"/>${compass(450,1157,43,colors)}<text x="72" y="1203" fill="${colors.coral}" font-family="Georgia,serif" font-size="18">${data.world.length + data.districts.length} places · ${facts.remembered.length} memories</text><text x="828" y="1203" text-anchor="end" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="14" letter-spacing="7">ATLAS</text>`, paperDataUrl);
}

export function renderBookBackCover(data: PassportData, paperDataUrl?: string, style: PassportStyle = "archive", details: PassportBookDetails = {}): string {
  const colors = palette(style);
  const count = data.world.length + data.districts.length;
  const facts = bookFacts(data, details);
  const signature = clipped(data.name || "A LIFE MORE CURIOUS",28).toUpperCase();
  return pageShell("Atlas passport back cover", colors, `${globe(450,517,358,colors,.14)}<path d="M-40 499C160 468 288 540 379 602S625 708 940 579" fill="none" stroke="${colors.coral}" stroke-width="2.4"/><circle cx="742" cy="653" r="10" fill="${colors.coral}" stroke="${colors.paper}" stroke-width="5"/>${compass(450,562,112,colors)}<text x="450" y="978" text-anchor="middle" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="9" letter-spacing="4">${xml(signature)}</text><text x="450" y="1082" text-anchor="middle" fill="${colors.ink}" font-family="Georgia,serif" font-size="45" letter-spacing="13">ATLAS</text><line x1="390" y1="1115" x2="510" y2="1115" stroke="${colors.rule}"/><text x="450" y="1160" text-anchor="middle" fill="${colors.ink}" font-family="Arial,sans-serif" font-size="11" letter-spacing="6">YOUR PLACES. YOUR RECORD.</text><text x="450" y="1204" text-anchor="middle" fill="${colors.muted}" font-family="Arial,sans-serif" font-size="8" letter-spacing="2">EDITION ${String(Math.max(count,1)).padStart(3,"0")} · ${facts.remembered.length} MEMORIES · PRIVATE BY DESIGN</text>`, paperDataUrl);
}
