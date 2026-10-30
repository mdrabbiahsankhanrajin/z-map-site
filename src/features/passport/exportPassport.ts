import { publicPath } from "../../lib/publicPath";
import { PASSPORT_HEIGHT, PASSPORT_WIDTH, paginatePassport, renderManifestPage, renderPassportCover, type ManifestAssets, type ManifestPage, type PassportData, type PassportMemoryLine, type PassportStyle } from "./passport";
import { renderBookBackCover, renderBookClosingPage, renderBookOpeningPage } from "./passportBookPages";

export async function loadPassportAsset(src: `/${string}`): Promise<string> {
  const response = await fetch(publicPath(src));
  if (!response.ok) throw new Error("The passport image could not be loaded.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The photograph could not be read."));
    reader.onerror = () => reject(new Error("The photograph could not be read."));
    reader.readAsDataURL(blob);
  });
}

async function rasterize(svg: string, scale: number, format: "image/png" | "image/jpeg"): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(PASSPORT_WIDTH * scale);
    canvas.height = Math.round(PASSPORT_HEIGHT * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image export is unavailable in this browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The passport image could not be created.")), format, .92));
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function downloadPassport(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function createPassportPng(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, paperDataUrl?: string, lilyDataUrl?: string, style: PassportStyle = "archive", assets?: { fontDataUrl?: string; tigerDataUrl?: string; lilyEngravingDataUrl?: string }): Promise<Blob> {
  return rasterize(renderPassportCover(data, photoDataUrl, botanicalDataUrl, paperDataUrl, lilyDataUrl, style, assets), 2, "image/png");
}

export async function createPassportPagePng(svg: string): Promise<Blob> {
  return rasterize(svg, 2, "image/png");
}

export async function createPassportPdf(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, paperDataUrl?: string, lilyDataUrl?: string, style: PassportStyle = "archive", assets?: { fontDataUrl?: string; tigerDataUrl?: string; lilyEngravingDataUrl?: string }, orderedPages?: ManifestPage[], memories: Record<string, PassportMemoryLine> = {}, manifestAssets: ManifestAssets = {}): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const manifestPages = orderedPages ?? paginatePassport(data);
  const pages = createPassportBookPages(data, photoDataUrl, botanicalDataUrl, paperDataUrl, lilyDataUrl, style, assets, manifestPages, memories, manifestAssets);
  for (const svg of pages) {
    const jpeg = await rasterize(svg, 1.5, "image/jpeg");
    const image = await pdf.embedJpg(await jpeg.arrayBuffer());
    const page = pdf.addPage([600, 840]);
    page.drawImage(image, { x: 0, y: 0, width: 600, height: 840 });
  }
  const bytes = await pdf.save();
  return new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
}

export function createPassportBookPages(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, paperDataUrl?: string, lilyDataUrl?: string, style: PassportStyle = "archive", assets?: { fontDataUrl?: string; tigerDataUrl?: string; lilyEngravingDataUrl?: string }, orderedPages?: ManifestPage[], memories: Record<string, PassportMemoryLine> = {}, manifestAssets: ManifestAssets = {}): string[] {
  const manifestPages = orderedPages ?? paginatePassport(data);
  return [
    renderPassportCover(data, photoDataUrl, botanicalDataUrl, paperDataUrl, lilyDataUrl, style, assets),
    renderBookOpeningPage(data, photoDataUrl, paperDataUrl, style),
    ...manifestPages.map((page, index) => renderManifestPage(page, index + 3, style, memories, manifestAssets)),
    renderBookClosingPage(data, photoDataUrl, paperDataUrl, style),
    renderBookBackCover(data, paperDataUrl, style),
  ];
}

function html(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

export function createPassportBook(pageSvgs: readonly string[], title: string): Blob {
  const pages = pageSvgs.map((svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  const safeTitle = html(title || "My Atlas Passport");
  const htmlDocument = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle}</title><style>
  :root{color-scheme:light;--paper:#f6f0e3;--ink:#0c3328;--muted:#536257;--coral:#c85838;--rule:#b9aa8e}*{box-sizing:border-box}html,body{min-height:100%;margin:0}body{display:grid;grid-template-rows:auto 1fr auto;color:var(--ink);background:#d4ccbe;font-family:Georgia,serif}header{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:12px clamp(16px,4vw,52px);border-bottom:1px solid #817761;background:var(--paper)}header strong{font-size:clamp(18px,2.2vw,28px)}header span,.status{color:var(--muted);font:700 10px/1.3 Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase}.stage{min-height:0;display:grid;place-items:center;overflow:hidden;padding:28px 76px 40px;perspective:1800px}.page{position:relative;width:min(54vh,76vw);aspect-ratio:5/7;filter:drop-shadow(0 24px 26px rgba(24,43,34,.25));transform-origin:left center}.page img{width:100%;height:100%;display:block;object-fit:contain;background:var(--paper)}.page.turn-next{animation:next .55s cubic-bezier(.16,1,.3,1)}.page.turn-previous{animation:previous .55s cubic-bezier(.16,1,.3,1)}nav{min-height:78px;display:grid;grid-template-columns:88px minmax(140px,260px) 88px;align-items:center;justify-content:center;gap:12px;padding:12px;background:var(--paper);border-top:1px solid #817761}button{min-width:80px;min-height:48px;padding:0 14px;border:1px solid var(--ink);color:var(--ink);background:transparent;font:700 11px/1 Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}button:hover:not(:disabled),button:focus-visible{color:#fff9ed;background:var(--ink)}button:focus-visible{outline:3px solid var(--coral);outline-offset:3px}button:disabled{opacity:.3;cursor:not-allowed}.status{text-align:center}@keyframes next{0%{transform:rotateY(0)}50%{transform:rotateY(-12deg) translateX(-8px);filter:drop-shadow(20px 24px 30px rgba(24,43,34,.3))}100%{transform:rotateY(0)}}@keyframes previous{0%{transform:rotateY(0)}50%{transform:rotateY(12deg) translateX(8px);filter:drop-shadow(-20px 24px 30px rgba(24,43,34,.3))}100%{transform:rotateY(0)}}@media(max-width:520px){header{min-height:56px}.stage{padding:20px 18px 28px}.page{width:min(70vh,88vw)}nav{grid-template-columns:80px minmax(100px,1fr) 80px}}@media(prefers-reduced-motion:reduce){.page.turn-next,.page.turn-previous{animation:none}}
  </style></head><body><header><strong>${safeTitle}</strong><span>Offline Atlas book</span></header><main class="stage"><div class="page" id="page"><img id="leaf" alt=""></div></main><nav aria-label="Book pages"><button id="previous" type="button">Previous</button><div class="status" id="status" aria-live="polite"></div><button id="next" type="button">Next</button></nav><script>
  const pages=${JSON.stringify(pages)};let index=0;const page=document.getElementById('page'),leaf=document.getElementById('leaf'),status=document.getElementById('status'),previous=document.getElementById('previous'),next=document.getElementById('next');function draw(direction){leaf.src=pages[index];leaf.alt='${safeTitle}, page '+(index+1)+' of '+pages.length;status.textContent='Page '+(index+1)+' of '+pages.length;previous.disabled=index===0;next.disabled=index===pages.length-1;if(direction){page.className='page turn-'+direction;setTimeout(()=>page.className='page',560)}}function move(amount){const target=Math.max(0,Math.min(pages.length-1,index+amount));if(target===index)return;index=target;draw(amount>0?'next':'previous')}previous.onclick=()=>move(-1);next.onclick=()=>move(1);addEventListener('keydown',event=>{if(event.key==='ArrowLeft')move(-1);if(event.key==='ArrowRight')move(1)});let touchX=0;page.addEventListener('touchstart',event=>touchX=event.changedTouches[0].clientX,{passive:true});page.addEventListener('touchend',event=>{const dx=event.changedTouches[0].clientX-touchX;if(Math.abs(dx)>42)move(dx<0?1:-1)},{passive:true});draw();
  </script></body></html>`;
  return new Blob([htmlDocument], { type: "text/html;charset=utf-8" });
}
