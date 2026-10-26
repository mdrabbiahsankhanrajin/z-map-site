import { publicPath } from "@/lib/publicPath";
import { PASSPORT_HEIGHT, PASSPORT_WIDTH, paginatePassport, renderManifestPage, renderPassportCover, type ManifestPage, type PassportData, type PassportMemoryLine, type PassportStyle } from "./passport";

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

export async function createPassportPdf(data: PassportData, photoDataUrl?: string, botanicalDataUrl?: string, paperDataUrl?: string, lilyDataUrl?: string, style: PassportStyle = "archive", assets?: { fontDataUrl?: string; tigerDataUrl?: string; lilyEngravingDataUrl?: string }, orderedPages?: ManifestPage[], memories: Record<string, PassportMemoryLine> = {}): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const manifestPages = orderedPages ?? paginatePassport(data);
  const pages = [renderPassportCover(data, photoDataUrl, botanicalDataUrl, paperDataUrl, lilyDataUrl, style, assets), ...manifestPages.map((page, index) => renderManifestPage(page, index + 2, style, memories))];
  for (const svg of pages) {
    const jpeg = await rasterize(svg, 1.5, "image/jpeg");
    const image = await pdf.embedJpg(await jpeg.arrayBuffer());
    const page = pdf.addPage([600, 840]);
    page.drawImage(image, { x: 0, y: 0, width: 600, height: 840 });
  }
  const bytes = await pdf.save();
  return new Blob([Uint8Array.from(bytes)], { type: "application/pdf" });
}
