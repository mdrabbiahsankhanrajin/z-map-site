"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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

function shortPageLabel(section: string) {
  if (section === "World places") return "World";
  if (section === "Bangladesh districts") return "Bangladesh";
  return section;
}

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
  const [previewPage, setPreviewPage] = useState(0);
  const [previewMode, setPreviewMode] = useState<"fit" | "actual">("fit");
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [status, setStatus] = useState("");
  const viewerRef = useRef<HTMLDivElement>(null);

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
  const manifestPreviewUrls = useMemo(() => {
    return manifestPages.map((page, index) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderManifestPage(page, index + 2, style))}`);
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
  const currentPreviewPage = Math.min(previewPage, pageCount - 1);
  const activePreviewUrl = currentPreviewPage === 0 ? previewUrl : manifestPreviewUrls[currentPreviewPage - 1] ?? previewUrl;
  const activePageLabel = currentPreviewPage === 0 ? "Cover" : manifestPages[currentPreviewPage - 1]?.section ?? "Places";
  const pageNavigation = [{ label: "Cover", fullLabel: "Cover" }, ...manifestPages.map((page) => ({ label: shortPageLabel(page.section), fullLabel: page.section }))];

  async function toggleFullscreen() {
    if (!viewerRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await viewerRef.current.requestFullscreen();
  }

  return <main className="atlas-content-page passport-page">
    <TravelHeader active="passport" />
    <section className="passport-intro">
      <div><p className="passport-kicker">Atlas / Passport studio</p><h1>Your places,<br />bound together.</h1><p className="passport-lede">Turn your marked places into a beautifully crafted Atlas Passport—a personal record composed privately in this browser.</p></div>
      <dl className="passport-summary" aria-label="Passport summary"><div><dt>Places explored</dt><dd>{placeCount}</dd></div><div><dt>Pages included</dt><dd>{pageCount}</dd></div><div><dt>Private passport</dt><dd>1</dd></div></dl>
    </section>
    <div className="passport-studio">
      <section className={`passport-preview passport-object-stage is-${style}`} aria-label="Passport live preview">
        <div className="passport-preview-heading"><span>Live edition preview</span><span>{placeCount} {placeCount === 1 ? "place" : "places"} · {pageCount} {pageCount === 1 ? "page" : "pages"}</span></div>
        <div className="passport-viewer" ref={viewerRef}>
          <div className="passport-viewer-toolbar" aria-label="Preview size">
            <span>{activePageLabel}</span>
            <div role="group" aria-label="Preview zoom">
              <button type="button" aria-pressed={previewMode === "fit"} onClick={() => setPreviewMode("fit")}>Fit</button>
              <button type="button" aria-pressed={previewMode === "actual"} onClick={() => setPreviewMode("actual")}>100%</button>
              <button type="button" onClick={() => void toggleFullscreen()}>Full screen</button>
            </div>
          </div>
          <div className={`passport-book is-${previewMode}`}>
            {currentPreviewPage === 0 && previewMode === "fit" ? <>
              {manifestPreviewUrls[0] ? <Image className="passport-inside-page" src={manifestPreviewUrls[0]} alt="Preview of the first passport places page" width={900} height={1260} unoptimized /> : <div className="passport-empty-page" aria-hidden="true"><span>ATLAS</span><strong>Your marked places will appear here.</strong></div>}
              {previewUrl && <Image className="passport-cover-image" src={previewUrl} alt={`${styleOptions.find((option) => option.id === style)?.label} Atlas passport cover with ${data.world.length} world places and ${data.districts.length} Bangladesh districts`} width={900} height={1260} priority unoptimized />}
            </> : activePreviewUrl && <Image className="passport-active-page" src={activePreviewUrl} alt={`${activePageLabel}, page ${currentPreviewPage + 1} of ${pageCount}`} width={900} height={1260} unoptimized />}
          </div>
          <nav className="passport-pager" aria-label="Passport pages">
            <p className="passport-page-status" aria-live="polite"><strong>{activePageLabel}</strong><small>Page {currentPreviewPage + 1} of {pageCount}</small></p>
            <div>{pageNavigation.map((page, index) => <button key={`${page.fullLabel}-${index}`} type="button" aria-current={currentPreviewPage === index ? "page" : undefined} aria-label={`Show ${page.fullLabel} page`} onClick={() => setPreviewPage(index)}><small>{String(index + 1).padStart(2, "0")}</small><span>{page.label}</span></button>)}</div>
          </nav>
        </div>
        <p className="passport-object-caption"><span>Edition {String(Math.max(placeCount, 1)).padStart(3, "0")}</span> A printable cover and a complete place manifest, composed from your Atlas selections.</p>
        {data.photo && photoDataUrl && <details><summary>Cover photo credit</summary><p>{data.photo.title} by {data.photo.author} · <a href={data.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original image</a> · <a href={data.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{data.photo.license}</a></p></details>}
      </section>

      <section className="passport-controls passport-workflow" aria-label="Build your passport">
        <header className="passport-control-head"><p>Customize your Atlas passport</p><h2>Build your edition</h2></header>
        {!ready ? <p role="status">Reading your marked places…</p> : <>
          <section className="passport-step" aria-labelledby="passport-step-one"><span className="passport-step-number">1</span><div><h3 id="passport-step-one">Choose your visits</h3><p className="passport-step-copy">Select the places to include in your passport.</p>
            <label className="passport-check"><input type="checkbox" checked={includeWorld} onChange={(event) => setIncludeWorld(event.target.checked)} /><span>World places <small>{worldIds.length} marked visited</small></span><b aria-hidden="true">{includeWorld ? "✓" : ""}</b></label>
            <label className="passport-check"><input type="checkbox" checked={includeDistricts} onChange={(event) => setIncludeDistricts(event.target.checked)} /><span>Bangladesh districts <small>{districtIds.length} marked visited</small></span><b aria-hidden="true">{includeDistricts ? "✓" : ""}</b></label>
          </div></section>

          <section className="passport-step" aria-labelledby="passport-step-two"><span className="passport-step-number">2</span><div><h3 id="passport-step-two">Add your edition details</h3><p className="passport-step-copy">Give your passport a name and choose its cover photograph.</p>
            <div className="passport-detail-grid"><div><label className="passport-field" htmlFor="passport-name">Passport name <small>optional · never saved</small></label><input id="passport-name" type="text" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Your name or a title" /></div>
            {includeDistricts && markedDistricts.length > 0 && <div><label className="passport-field" htmlFor="passport-photo">Cover photograph <small>does not claim a visit</small></label><select id="passport-photo" value={featuredDistrictId} onChange={(event) => setFeaturedDistrictId(event.target.value)}><option value="atlas-cover">Sundarbans · editorial cover</option><option value="">First visited district</option>{markedDistricts.map((district) => <option key={district.id} value={district.id}>{districtDisplayName(district.name)}</option>)}</select></div>}</div>
          </div></section>

          <section className="passport-step" aria-labelledby="passport-step-three"><span className="passport-step-number">3</span><div><h3 id="passport-step-three">Choose a cover style</h3><p className="passport-step-copy">Select a visual treatment for your passport.</p><div className="passport-style-switch" role="group" aria-label="Passport cover style">{styleOptions.map((option) => <button key={option.id} type="button" className={`passport-style-choice passport-style-${option.id}`} aria-pressed={style === option.id} onClick={() => setStyle(option.id)}><span className="passport-style-swatch" aria-hidden="true"/><span><strong>{option.label}</strong><small>{option.detail}</small></span></button>)}</div></div></section>

          <section className="passport-step passport-export-step" aria-labelledby="passport-step-four"><span className="passport-step-number">4</span><div><h3 id="passport-step-four">Export your passport</h3><p className="passport-step-copy">Create a print-ready book or a high-resolution cover.</p>
            {!hasVisits && <p className="passport-no-visits">Your passport is waiting for its first stamp. <Link href="/bd">Mark a place on the map →</Link></p>}
            <div className="passport-downloads"><button className="passport-download-primary" type="button" disabled={exportDisabled} onClick={() => void exportFile("pdf")}><span>{busy === "pdf" ? "Creating full PDF…" : "Download full PDF"}<small>{pageCount} {pageCount === 1 ? "page" : "pages"}</small></span></button><button type="button" disabled={exportDisabled} onClick={() => void exportFile("png")}><span>{busy === "png" ? "Creating PNG cover…" : "Download PNG cover"}<small>High-resolution image</small></span></button>{photoFailed && <p>The cover photo could not load. Exports will use the illustrated cover.</p>}<p className="passport-status" role="status">{status}</p></div>
            <p className="passport-private"><span aria-hidden="true">◇</span><strong>Private by design.</strong> Only marked countries and districts appear. Trip stops, dates and location traces stay out.</p>
          </div></section>
        </>}
      </section>
    </div>
    <p className="passport-back"><Link href="/insights">← Back to your atlas in numbers</Link></p>
  </main>;
}
