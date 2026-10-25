"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import districts from "@/data/districts.json";
import { districtDisplayName } from "@/data/districtNames";
import { resolveWorldPlaceId, worldPlaces } from "@/data/worldPlaces";
import { TravelHeader } from "@/components/TravelHeader";
import { parseSavedSelection } from "@/features/explorer/state";
import { createPassport, paginatePassport, renderManifestPage, renderPassportCover, type PassportStyle } from "./passport";

const styleOptions: { id: PassportStyle; label: string; detail: string }[] = [
  { id: "archive", label: "Archive", detail: "Cartographic print" },
  { id: "expedition", label: "Expedition", detail: "Dark field book" },
  { id: "travelogue", label: "Travelogue", detail: "Editorial journal" },
];

export function PassportStudio() {
  const [worldIds, setWorldIds] = useState<string[]>([]);
  const [districtIds, setDistrictIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [style, setStyle] = useState<PassportStyle>("archive");
  const [includeWorld, setIncludeWorld] = useState(true);
  const [includeDistricts, setIncludeDistricts] = useState(true);
  const [featuredDistrictId, setFeaturedDistrictId] = useState("atlas-cover");
  const [loadedPhoto, setLoadedPhoto] = useState<{ src: string; dataUrl?: string; failed?: boolean }>();
  const [ornament, setOrnament] = useState<{ done: boolean; dataUrl?: string; lilyDataUrl?: string }>({ done: false });
  const [paper, setPaper] = useState<{ done: boolean; dataUrl?: string }>({ done: false });
  const [coverAssets, setCoverAssets] = useState<{ readyStyles: PassportStyle[]; fontDataUrl?: string; tigerDataUrl?: string; lilyEngravingDataUrl?: string }>({ readyStyles: [] });
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setWorldIds(parseSavedSelection(localStorage.getItem("atlas:selection:world:v1"), worldPlaces, resolveWorldPlaceId));
        setDistrictIds(parseSavedSelection(localStorage.getItem("atlas:selection:districts:v1"), districts));
      } catch { /* A private empty passport remains available. */ }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const markedDistricts = districts.filter((district) => districtIds.includes(district.id)).sort((a, b) => districtDisplayName(a.name).localeCompare(districtDisplayName(b.name), "en"));
  const data = useMemo(() => createPassport(includeWorld ? worldIds : [], includeDistricts ? districtIds : [], name, featuredDistrictId), [worldIds, districtIds, includeWorld, includeDistricts, name, featuredDistrictId]);
  const hasVisits = data.world.length + data.districts.length > 0;
  const placeCount = data.world.length + data.districts.length;
  const photoSrc = data.photo?.src;
  const photoDataUrl = loadedPhoto?.src === photoSrc ? loadedPhoto?.dataUrl : undefined;
  const photoLoading = Boolean(photoSrc && loadedPhoto?.src !== photoSrc);
  const photoFailed = Boolean(photoSrc && loadedPhoto?.src === photoSrc && loadedPhoto?.failed);
  const styleReady = style === "archive" || coverAssets.readyStyles.includes(style);
  const manifestPages = useMemo(() => paginatePassport(data), [data]);
  const manifestPreviewUrl = useMemo(() => {
    const firstPage = manifestPages[0];
    return firstPage ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderManifestPage(firstPage, 2, style))}` : "";
  }, [manifestPages, style]);

  useEffect(() => {
    if (!photoSrc) return;
    let cancelled = false;
      void import("./exportPassport").then(({ loadPassportAsset }) => loadPassportAsset(photoSrc)).then((url) => {
        if (!cancelled) setLoadedPhoto({ src: photoSrc, dataUrl: url });
      }).catch(() => {
        if (!cancelled) setLoadedPhoto({ src: photoSrc, failed: true });
      });
    return () => { cancelled = true; };
  }, [photoSrc]);

  useEffect(() => {
    let cancelled = false;
    void import("./exportPassport").then(({ loadPassportAsset }) => Promise.all([
      loadPassportAsset("/illustrations/passport-delta-botanical.webp").catch(() => undefined),
      loadPassportAsset("/illustrations/bd-water-lily.webp").catch(() => undefined),
    ])).then(([dataUrl, lilyDataUrl]) => {
      if (!cancelled) setOrnament({ done: true, dataUrl, lilyDataUrl });
    }).catch(() => { if (!cancelled) setOrnament({ done: true }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void import("./exportPassport").then(({ loadPassportAsset }) => loadPassportAsset("/textures/atlas-paper.webp")).then((dataUrl) => {
      if (!cancelled) setPaper({ done: true, dataUrl });
    }).catch(() => { if (!cancelled) setPaper({ done: true }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (style === "archive" || styleReady) return;
    let cancelled = false;
    void import("./exportPassport").then(({ loadPassportAsset }) => Promise.all([
      coverAssets.fontDataUrl ? Promise.resolve(coverAssets.fontDataUrl) : loadPassportAsset("/fonts/LibreBodoni.ttf").catch(() => undefined),
      loadPassportAsset(style === "expedition" ? "/illustrations/passport-tiger-engraving.webp" : "/illustrations/passport-lily-engraving.webp").catch(() => undefined),
    ])).then(([fontDataUrl, engravingDataUrl]) => {
      if (!cancelled) setCoverAssets((previous) => ({ ...previous, fontDataUrl, ...(style === "expedition" ? { tigerDataUrl: engravingDataUrl } : { lilyEngravingDataUrl: engravingDataUrl }), readyStyles: [...previous.readyStyles, style] }));
    }).catch(() => { if (!cancelled) setCoverAssets((previous) => ({ ...previous, readyStyles: [...previous.readyStyles, style] })); });
    return () => { cancelled = true; };
  }, [style, styleReady, coverAssets.fontDataUrl]);

  const cover = useMemo(() => renderPassportCover(data, photoDataUrl, ornament.dataUrl, paper.dataUrl, ornament.lilyDataUrl, style, coverAssets), [data, photoDataUrl, ornament.dataUrl, ornament.lilyDataUrl, paper.dataUrl, style, coverAssets]);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([cover], { type: "image/svg+xml;charset=utf-8" }));
    const frame = requestAnimationFrame(() => setPreviewUrl(url));
    return () => { cancelAnimationFrame(frame); URL.revokeObjectURL(url); };
  }, [cover]);

  async function exportFile(format: "png" | "pdf") {
    if (!hasVisits || busy || photoLoading || !ornament.done || !paper.done || !styleReady) return;
    setBusy(format);
    setStatus("");
    try {
      const { createPassportPng, createPassportPdf, downloadPassport } = await import("./exportPassport");
      const blob = format === "png" ? await createPassportPng(data, photoDataUrl, ornament.dataUrl, paper.dataUrl, ornament.lilyDataUrl, style, coverAssets) : await createPassportPdf(data, photoDataUrl, ornament.dataUrl, paper.dataUrl, ornament.lilyDataUrl, style, coverAssets);
      downloadPassport(blob, `atlas-passport-${style}.${format}`);
      setStatus(format === "png" ? "PNG cover downloaded." : `PDF passport downloaded with ${paginatePassport(data).length + 1} pages.`);
    } catch {
      setStatus("The download could not be created in this browser. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const exportDisabled = !hasVisits || Boolean(busy) || photoLoading || !ornament.done || !paper.done || !styleReady;
  const pageCount = manifestPages.length + 1;

  return <main className="atlas-content-page passport-page">
    <TravelHeader active="passport" />
    <section className="passport-intro">
      <div><p className="passport-kicker">Atlas / Passport studio</p><h1>Your places,<br />bound together.</h1><p className="passport-lede">Turn the places you marked into a considered travel keepsake—made privately, right in this browser.</p></div>
      <dl className="passport-summary" aria-label="Passport summary"><div><dt>Places</dt><dd>{placeCount}</dd></div><div><dt>PDF pages</dt><dd>{pageCount}</dd></div><div><dt>Data</dt><dd>Private</dd></div></dl>
    </section>
    <div className="passport-studio">
      <section className={`passport-preview passport-object-stage is-${style}`} aria-label="Passport live preview">
        <div className="passport-preview-heading"><span>Live edition preview</span><span>{placeCount} {placeCount === 1 ? "place" : "places"} · {pageCount} {pageCount === 1 ? "page" : "pages"}</span></div>
        <div className="passport-book">
          {manifestPreviewUrl ? <Image className="passport-inside-page" src={manifestPreviewUrl} alt="Preview of the passport places page" width={900} height={1260} unoptimized /> : <div className="passport-empty-page" aria-hidden="true"><span>ATLAS</span><strong>Your marked places will appear here.</strong></div>}
          {previewUrl && <Image className="passport-cover-image" src={previewUrl} alt={`${styleOptions.find((option) => option.id === style)?.label} Atlas passport cover with ${data.world.length} world places and ${data.districts.length} Bangladesh districts`} width={900} height={1260} unoptimized />}
        </div>
        <p className="passport-object-caption"><span>Edition {String(Math.max(placeCount, 1)).padStart(3, "0")}</span> A printable cover and a complete place manifest, composed from your Atlas selections.</p>
        {data.photo && photoDataUrl && <details><summary>Cover photo credit</summary><p>{data.photo.title} by {data.photo.author} · <a href={data.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original image</a> · <a href={data.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{data.photo.license}</a></p></details>}
      </section>

      <section className="passport-controls passport-workflow" aria-label="Build your passport">
        <header className="passport-control-head"><p>Four simple steps</p><h2>Build your edition</h2></header>
        {!ready ? <p role="status">Reading your marked places…</p> : <>
          <section className="passport-step" aria-labelledby="passport-step-one"><span className="passport-step-number">01</span><div><h3 id="passport-step-one">Include places</h3><p className="passport-step-copy">Choose which parts of your travel record make the cut.</p>
            <label className="passport-check"><input type="checkbox" checked={includeWorld} onChange={(event) => setIncludeWorld(event.target.checked)} /><span>World places <small>{worldIds.length} marked visited</small></span><b aria-hidden="true">{includeWorld ? "✓" : ""}</b></label>
            <label className="passport-check"><input type="checkbox" checked={includeDistricts} onChange={(event) => setIncludeDistricts(event.target.checked)} /><span>Bangladesh districts <small>{districtIds.length} marked visited</small></span><b aria-hidden="true">{includeDistricts ? "✓" : ""}</b></label>
          </div></section>

          <section className="passport-step" aria-labelledby="passport-step-two"><span className="passport-step-number">02</span><div><h3 id="passport-step-two">Personalize</h3><p className="passport-step-copy">Add an optional title and choose the photograph on the cover.</p>
            <label className="passport-field" htmlFor="passport-name">Name on the cover <small>optional · never saved</small></label><input id="passport-name" type="text" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Your name or a title" />
            {includeDistricts && markedDistricts.length > 0 && <><label className="passport-field" htmlFor="passport-photo">Cover photograph <small>does not claim a visit</small></label><select id="passport-photo" value={featuredDistrictId} onChange={(event) => setFeaturedDistrictId(event.target.value)}><option value="atlas-cover">Sundarbans · editorial cover</option><option value="">First visited district</option>{markedDistricts.map((district) => <option key={district.id} value={district.id}>{districtDisplayName(district.name)}</option>)}</select></>}
          </div></section>

          <section className="passport-step" aria-labelledby="passport-step-three"><span className="passport-step-number">03</span><div><h3 id="passport-step-three">Choose a cover</h3><p className="passport-step-copy">Three print-inspired treatments. The contents stay the same.</p><div className="passport-style-switch" role="group" aria-label="Passport cover style">{styleOptions.map((option) => <button key={option.id} type="button" className={`passport-style-choice passport-style-${option.id}`} aria-pressed={style === option.id} onClick={() => setStyle(option.id)}><span className="passport-style-swatch" aria-hidden="true"/><span><strong>{option.label}</strong><small>{option.detail}</small></span></button>)}</div></div></section>

          <section className="passport-step passport-export-step" aria-labelledby="passport-step-four"><span className="passport-step-number">04</span><div><h3 id="passport-step-four">Export your keepsake</h3><p className="passport-step-copy">The PDF includes every chosen place. The PNG is a shareable cover.</p>
            {!hasVisits && <p className="passport-no-visits">Your passport is waiting for its first stamp. <Link href="/bd">Mark a place on the map →</Link></p>}
            <div className="passport-downloads"><button className="passport-download-primary" type="button" disabled={exportDisabled} onClick={() => void exportFile("pdf")}><span>{busy === "pdf" ? "Creating full PDF…" : "Download full PDF"}<small>{pageCount} {pageCount === 1 ? "page" : "pages"}</small></span><b aria-hidden="true">↓</b></button><button type="button" disabled={exportDisabled} onClick={() => void exportFile("png")}><span>{busy === "png" ? "Creating PNG cover…" : "Download PNG cover"}<small>High-resolution image</small></span><b aria-hidden="true">↓</b></button>{photoFailed && <p>The cover photo could not load. Exports will use the illustrated cover.</p>}<p className="passport-status" role="status">{status}</p></div>
            <p className="passport-private"><span aria-hidden="true">◇</span><strong>Private by design.</strong> Only marked countries and districts appear. Trip stops, dates and location traces stay out.</p>
          </div></section>
        </>}
      </section>
    </div>
    <p className="passport-back"><Link href="/insights">← Back to your atlas in numbers</Link></p>
  </main>;
}
