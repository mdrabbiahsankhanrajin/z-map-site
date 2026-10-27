"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { attractions } from "@/data/attractions";
import districts from "@/data/districts.json";
import { districtDisplayName } from "@/data/districtNames";
import { featuredRegionForCountry, regionNotes } from "@/data/regionNotes";
import { resolveWorldPlaceId, worldPlaces } from "@/data/worldPlaces";
import { TravelHeader } from "@/components/TravelHeader";
import { publicPath } from "@/lib/publicPath";
import { parseSavedSelection } from "@/features/explorer/state";
import { parseSavedPlaces, SAVED_PLACES_KEY } from "@/features/discovery/savedPlaces";
import { createPassport, paginatePassport, renderManifestPage, renderPassportCover, type ManifestPage, type PassportData, type PassportStyle } from "./passport";
import { emptyPassportWorkspace, moveItem, PASSPORT_WORKSPACE_KEY, parsePassportWorkspace, passportAchievements, serializePassportWorkspace, type PassportMemory, type PassportWorkspaceState } from "./passportWorkspace";

const styleOptions: { id: PassportStyle; label: string; detail: string }[] = [
  { id: "archive", label: "Archive", detail: "Cartographic print" },
  { id: "expedition", label: "Expedition", detail: "Dark field book" },
  { id: "travelogue", label: "Travelogue", detail: "Editorial journal" },
];

const workspaceTabs = ["studio", "timeline", "collections", "stamps"] as const;
type WorkspaceTab = typeof workspaceTabs[number];
type BusyAction = "png" | "pdf" | "page" | "share" | null;
type VisitItem = { key: string; id: string; kind: "world" | "district"; name: string; region: string; image?: string; imageAlt?: string };

const pageKey = (page: ManifestPage) => `${page.section}:${page.index}`;
const blankMemory: PassportMemory = { date: "", note: "", favorite: false };

function MoveIcon({ direction }: { direction: "up" | "down" }) {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d={direction === "up" ? "M4 12l6-6 6 6M10 6v9" : "M4 8l6 6 6-6M10 14V5"} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function safeFileName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "atlas-passport";
}

export function PassportExperience() {
  const [worldIds, setWorldIds] = useState<string[]>([]);
  const [districtIds, setDistrictIds] = useState<string[]>([]);
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [workspace, setWorkspace] = useState<PassportWorkspaceState>(emptyPassportWorkspace);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("studio");
  const [visitQuery, setVisitQuery] = useState("");
  const [visitFilter, setVisitFilter] = useState<"all" | "world" | "district">("all");
  const [memoryVisitKey, setMemoryVisitKey] = useState("");
  const [name, setName] = useState("");
  const [style, setStyle] = useState<PassportStyle>("archive");
  const [featuredDistrictId, setFeaturedDistrictId] = useState("atlas-cover");
  const [customCover, setCustomCover] = useState<{ name: string; dataUrl: string }>();
  const [loadedPhoto, setLoadedPhoto] = useState<{ src: string; dataUrl?: string; failed?: boolean }>();
  const [ornament, setOrnament] = useState<{ done: boolean; dataUrl?: string; lilyDataUrl?: string }>({ done: false });
  const [paper, setPaper] = useState<{ done: boolean; dataUrl?: string }>({ done: false });
  const [coverAssets, setCoverAssets] = useState<{ readyStyles: PassportStyle[]; fontDataUrl?: string; tigerDataUrl?: string; lilyEngravingDataUrl?: string }>({ readyStyles: [] });
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewPage, setPreviewPage] = useState(0);
  const [previewMode, setPreviewMode] = useState<"fit" | "actual">("fit");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [status, setStatus] = useState("");
  const viewerRef = useRef<HTMLDivElement>(null);

  const allVisits = useMemo<VisitItem[]>(() => {
    const world = worldPlaces.filter((place) => worldIds.includes(place.id)).map((place) => {
      const regionId = featuredRegionForCountry(place.id);
      const note = regionId ? regionNotes[regionId] : undefined;
      return { key: `world:${place.id}`, id: place.id, kind: "world" as const, name: place.name, region: "World place", image: note ? publicPath(note.image.src as `/${string}`) : undefined, imageAlt: note?.image.alt };
    });
    const district = districts.filter((place) => districtIds.includes(place.id)).map((place) => {
      const photo = attractions.find((item) => item.district === place.name);
      return { key: `district:${place.id}`, id: place.id, kind: "district" as const, name: districtDisplayName(place.name), region: "Bangladesh district", image: photo ? publicPath(photo.image.src) : undefined, imageAlt: photo?.image.alt };
    });
    return [...world, ...district].sort((left, right) => left.name.localeCompare(right.name, "en"));
  }, [worldIds, districtIds]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const nextWorldIds = parseSavedSelection(localStorage.getItem("atlas:selection:world:v1"), worldPlaces, resolveWorldPlaceId);
        const nextDistrictIds = parseSavedSelection(localStorage.getItem("atlas:selection:districts:v1"), districts);
        const keys = [...nextWorldIds.map((id) => `world:${id}`), ...nextDistrictIds.map((id) => `district:${id}`)];
        setWorldIds(nextWorldIds);
        setDistrictIds(nextDistrictIds);
        setWorkspace(parsePassportWorkspace(localStorage.getItem(PASSPORT_WORKSPACE_KEY), keys));
        setSavedPlaceIds(parseSavedPlaces(localStorage.getItem(SAVED_PLACES_KEY), attractions.map((item) => item.id)));
      } catch { /* The private workspace still opens when browser storage is blocked. */ }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(PASSPORT_WORKSPACE_KEY, serializePassportWorkspace(workspace)); } catch { /* Saving remains optional. */ }
  }, [ready, workspace]);

  const excluded = useMemo(() => new Set(workspace.excludedVisitKeys), [workspace.excludedVisitKeys]);
  const includedVisits = useMemo(() => allVisits.filter((visit) => !excluded.has(visit.key)), [allVisits, excluded]);
  const includedWorldIds = useMemo(() => includedVisits.filter((visit) => visit.kind === "world").map((visit) => visit.id), [includedVisits]);
  const includedDistrictIds = useMemo(() => includedVisits.filter((visit) => visit.kind === "district").map((visit) => visit.id), [includedVisits]);
  const markedDistricts = districts.filter((district) => includedDistrictIds.includes(district.id)).sort((a, b) => districtDisplayName(a.name).localeCompare(districtDisplayName(b.name), "en"));
  const baseData = useMemo(() => createPassport(includedWorldIds, includedDistrictIds, name, featuredDistrictId), [includedWorldIds, includedDistrictIds, name, featuredDistrictId]);
  const data: PassportData = useMemo(() => customCover ? { ...baseData, photo: undefined } : baseData, [baseData, customCover]);
  const hasVisits = includedVisits.length > 0;
  const placeCount = includedVisits.length;
  const photoSrc = baseData.photo?.src;
  const sourcedPhotoDataUrl = loadedPhoto?.src === photoSrc ? loadedPhoto?.dataUrl : undefined;
  const photoDataUrl = customCover?.dataUrl ?? sourcedPhotoDataUrl;
  const photoLoading = Boolean(!customCover && photoSrc && loadedPhoto?.src !== photoSrc);
  const photoFailed = Boolean(!customCover && photoSrc && loadedPhoto?.src === photoSrc && loadedPhoto?.failed);
  const styleReady = style === "archive" || coverAssets.readyStyles.includes(style);
  const memoryByName = useMemo(() => Object.fromEntries(includedVisits.map((visit) => [visit.name, workspace.memories[visit.key] ?? blankMemory])), [includedVisits, workspace.memories]);
  const unorderedManifestPages = useMemo(() => paginatePassport(data), [data]);
  const manifestPages = useMemo(() => {
    const rank = new Map(workspace.pageOrder.map((key, index) => [key, index]));
    return [...unorderedManifestPages].sort((left, right) => (rank.get(pageKey(left)) ?? 999) - (rank.get(pageKey(right)) ?? 999));
  }, [unorderedManifestPages, workspace.pageOrder]);
  const manifestPreviewUrls = useMemo(() => manifestPages.map((page, index) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderManifestPage(page, index + 2, style, memoryByName))}`), [manifestPages, style, memoryByName]);
  const pageCount = manifestPages.length + 1;
  const currentPreviewPage = Math.min(previewPage, pageCount - 1);

  useEffect(() => {
    if (!photoSrc || customCover) return;
    let cancelled = false;
    void import("./exportPassport").then(({ loadPassportAsset }) => loadPassportAsset(photoSrc)).then((url) => { if (!cancelled) setLoadedPhoto({ src: photoSrc, dataUrl: url }); }).catch(() => { if (!cancelled) setLoadedPhoto({ src: photoSrc, failed: true }); });
    return () => { cancelled = true; };
  }, [photoSrc, customCover]);

  useEffect(() => {
    let cancelled = false;
    void import("./exportPassport").then(({ loadPassportAsset }) => Promise.all([
      loadPassportAsset("/illustrations/passport-delta-botanical.webp").catch(() => undefined),
      loadPassportAsset("/illustrations/bd-water-lily.webp").catch(() => undefined),
      loadPassportAsset("/textures/atlas-paper.webp").catch(() => undefined),
    ])).then(([dataUrl, lilyDataUrl, paperDataUrl]) => {
      if (!cancelled) { setOrnament({ done: true, dataUrl, lilyDataUrl }); setPaper({ done: true, dataUrl: paperDataUrl }); }
    }).catch(() => { if (!cancelled) { setOrnament({ done: true }); setPaper({ done: true }); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (style === "archive" || styleReady) return;
    let cancelled = false;
    void import("./exportPassport").then(({ loadPassportAsset }) => Promise.all([
      coverAssets.fontDataUrl ? Promise.resolve(coverAssets.fontDataUrl) : loadPassportAsset("/fonts/LibreBodoni.ttf").catch(() => undefined),
      loadPassportAsset(style === "expedition" ? "/illustrations/passport-tiger-engraving.webp" : "/illustrations/passport-lily-engraving.webp").catch(() => undefined),
    ])).then(([fontDataUrl, engravingDataUrl]) => {
      if (!cancelled) setCoverAssets((previous) => ({ ...previous, fontDataUrl, ...(style === "expedition" ? { tigerDataUrl: engravingDataUrl } : { lilyEngravingDataUrl: engravingDataUrl }), readyStyles: [...new Set([...previous.readyStyles, style])] }));
    }).catch(() => { if (!cancelled) setCoverAssets((previous) => ({ ...previous, readyStyles: [...new Set([...previous.readyStyles, style])] })); });
    return () => { cancelled = true; };
  }, [style, styleReady, coverAssets.fontDataUrl]);

  const cover = useMemo(() => renderPassportCover(data, photoDataUrl, ornament.dataUrl, paper.dataUrl, ornament.lilyDataUrl, style, coverAssets), [data, photoDataUrl, ornament.dataUrl, ornament.lilyDataUrl, paper.dataUrl, style, coverAssets]);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([cover], { type: "image/svg+xml;charset=utf-8" }));
    const frame = requestAnimationFrame(() => setPreviewUrl(url));
    return () => { cancelAnimationFrame(frame); URL.revokeObjectURL(url); };
  }, [cover]);

  const activePreviewUrl = currentPreviewPage === 0 ? previewUrl : manifestPreviewUrls[currentPreviewPage - 1] ?? previewUrl;
  const activePageLabel = currentPreviewPage === 0 ? "Cover" : manifestPages[currentPreviewPage - 1]?.section ?? "Places";
  const activeMemoryVisitKey = includedVisits.some((visit) => visit.key === memoryVisitKey) ? memoryVisitKey : includedVisits[0]?.key ?? "";
  const selectedMemoryVisit = includedVisits.find((visit) => visit.key === activeMemoryVisitKey);
  const selectedMemory = selectedMemoryVisit ? workspace.memories[selectedMemoryVisit.key] ?? blankMemory : blankMemory;
  const achievements = passportAchievements(includedWorldIds.length, includedDistrictIds.length, workspace.memories);
  const filteredVisits = allVisits.filter((visit) => (visitFilter === "all" || visit.kind === visitFilter) && visit.name.toLowerCase().includes(visitQuery.trim().toLowerCase()));
  const datedVisits = includedVisits.filter((visit) => workspace.memories[visit.key]?.date).sort((left, right) => (workspace.memories[right.key]?.date ?? "").localeCompare(workspace.memories[left.key]?.date ?? ""));
  const favoriteVisits = includedVisits.filter((visit) => workspace.memories[visit.key]?.favorite);
  const savedPlaces = savedPlaceIds.map((id) => attractions.find((item) => item.id === id)).filter((item): item is (typeof attractions)[number] => Boolean(item));
  const exportDisabled = !hasVisits || Boolean(busy) || photoLoading || !ornament.done || !paper.done || !styleReady;

  function updateWorkspace(update: (current: PassportWorkspaceState) => PassportWorkspaceState) { setWorkspace((current) => update(current)); }
  function toggleVisit(key: string) { updateWorkspace((current) => ({ ...current, excludedVisitKeys: current.excludedVisitKeys.includes(key) ? current.excludedVisitKeys.filter((item) => item !== key) : [...current.excludedVisitKeys, key] })); }
  function updateMemory(key: string, update: Partial<PassportMemory>) { updateWorkspace((current) => ({ ...current, memories: { ...current.memories, [key]: { ...(current.memories[key] ?? blankMemory), ...update } } })); }
  function movePage(index: number, direction: -1 | 1) { const keys = manifestPages.map(pageKey); updateWorkspace((current) => ({ ...current, pageOrder: moveItem(keys, index, index + direction) })); }

  async function handleCoverUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8_000_000) { setStatus("Choose an image file smaller than 8 MB."); event.target.value = ""; return; }
    const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error()); reader.onerror = () => reject(new Error()); reader.readAsDataURL(file); });
    setCustomCover({ name: file.name, dataUrl }); setStatus("Custom cover photo added for this session."); event.target.value = "";
  }

  async function exportFile(format: "png" | "pdf" | "page") {
    if (exportDisabled) return;
    setBusy(format); setStatus("");
    try {
      const { createPassportPng, createPassportPdf, createPassportPagePng, downloadPassport } = await import("./exportPassport");
      const baseName = safeFileName(name || "atlas-passport");
      if (format === "pdf") {
        const blob = await createPassportPdf(data, photoDataUrl, ornament.dataUrl, paper.dataUrl, ornament.lilyDataUrl, style, coverAssets, manifestPages, memoryByName);
        downloadPassport(blob, `${baseName}-${style}.pdf`); setStatus(`PDF downloaded with ${pageCount} pages.`);
      } else if (format === "page") {
        const page = manifestPages[currentPreviewPage - 1];
        const svg = currentPreviewPage === 0 || !page ? cover : renderManifestPage(page, currentPreviewPage + 1, style, memoryByName);
        downloadPassport(await createPassportPagePng(svg), `${baseName}-page-${currentPreviewPage + 1}.png`); setStatus(`${activePageLabel} exported as a high-resolution PNG.`);
      } else {
        downloadPassport(await createPassportPng(data, photoDataUrl, ornament.dataUrl, paper.dataUrl, ornament.lilyDataUrl, style, coverAssets), `${baseName}-cover.png`); setStatus("Cover downloaded as a high-resolution PNG.");
      }
    } catch { setStatus("The export could not be created in this browser. Try again."); }
    finally { setBusy(null); }
  }

  async function sharePassport() {
    if (exportDisabled) return;
    setBusy("share"); setStatus("");
    try {
      const summary = `${name.trim() || "My Atlas Passport"}\n${includedVisits.map((visit) => visit.name).join(", ")}\nCreated privately with Atlas.`;
      if (navigator.share) { await navigator.share({ title: name.trim() || "My Atlas Passport", text: summary }); setStatus("Passport summary shared."); }
      else { await navigator.clipboard.writeText(summary); setStatus("Private passport summary copied to your clipboard."); }
    } catch (error) { if ((error as Error).name !== "AbortError") setStatus("Sharing is unavailable here. Your passport remains private."); }
    finally { setBusy(null); }
  }

  async function toggleFullscreen() { if (!viewerRef.current) return; if (document.fullscreenElement) await document.exitFullscreen(); else await viewerRef.current.requestFullscreen(); }

  return <main className="atlas-content-page passport-page">
    <TravelHeader active="passport" />
    <section className="passport-intro"><div><h1>Passport</h1><p className="passport-lede">Your places, bound together into a private record of visits, memories, and milestones.</p></div><dl className="passport-summary" aria-label="Passport summary"><div><dt>Places explored</dt><dd>{placeCount}</dd></div><div><dt>Memories added</dt><dd>{Object.values(workspace.memories).filter((memory) => memory.note || memory.date).length}</dd></div><div><dt>Privacy</dt><dd>Local</dd></div></dl></section>
    <nav className="passport-tabs" aria-label="Passport workspace">{workspaceTabs.map((tab) => <button key={tab} type="button" className={activeTab === tab ? "is-current" : ""} aria-current={activeTab === tab ? "page" : undefined} onClick={() => setActiveTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}</nav>

    {activeTab === "studio" && <div className="passport-studio">
      <section className={`passport-preview passport-object-stage is-${style}`} aria-label="Passport live preview">
        <div className="passport-preview-heading"><span>Live edition preview</span><span>{placeCount} {placeCount === 1 ? "place" : "places"} · {pageCount} {pageCount === 1 ? "page" : "pages"}</span></div>
        <div className="passport-viewer" ref={viewerRef}><div className="passport-viewer-toolbar" aria-label="Preview size"><span>{activePageLabel}</span><div role="group" aria-label="Preview zoom"><button type="button" aria-pressed={previewMode === "fit"} onClick={() => setPreviewMode("fit")}>Fit</button><button type="button" aria-pressed={previewMode === "actual"} onClick={() => setPreviewMode("actual")}>100%</button><button type="button" onClick={() => void toggleFullscreen()}>Full screen</button></div></div><div className={`passport-book is-${previewMode}`}>{currentPreviewPage === 0 && previewMode === "fit" ? <>{manifestPreviewUrls[0] ? <Image className="passport-inside-page" src={manifestPreviewUrls[0]} alt="Preview of the first passport places page" width={900} height={1260} unoptimized /> : <div className="passport-empty-page" aria-hidden="true"><span>ATLAS</span><strong>Your marked places will appear here.</strong></div>}{previewUrl && <Image className="passport-cover-image" src={previewUrl} alt={`${styleOptions.find((option) => option.id === style)?.label} Atlas passport cover with ${includedWorldIds.length} world places and ${includedDistrictIds.length} Bangladesh districts`} width={900} height={1260} priority unoptimized />}</> : activePreviewUrl && <Image className="passport-active-page" src={activePreviewUrl} alt={`${activePageLabel}, page ${currentPreviewPage + 1} of ${pageCount}`} width={900} height={1260} unoptimized />}</div><nav className="passport-pager" aria-label="Passport pages"><button type="button" disabled={currentPreviewPage === 0} onClick={() => setPreviewPage(Math.max(0, currentPreviewPage - 1))} aria-label="Previous passport page">←</button><span><strong>{activePageLabel}</strong><small>Page {currentPreviewPage + 1} of {pageCount}</small></span><button type="button" disabled={currentPreviewPage === pageCount - 1} onClick={() => setPreviewPage(Math.min(pageCount - 1, currentPreviewPage + 1))} aria-label="Next passport page">→</button></nav></div>
        <p className="passport-object-caption"><span>Edition {String(Math.max(placeCount, 1)).padStart(3, "0")}</span> Dates and notes appear only when you add them. Nothing is inferred.</p>
        {baseData.photo && sourcedPhotoDataUrl && !customCover && <details><summary>Cover photo credit</summary><p>{baseData.photo.title} by {baseData.photo.author} · <a href={baseData.photo.sourceUrl} target="_blank" rel="noopener noreferrer">Original image</a> · <a href={baseData.photo.licenseUrl} target="_blank" rel="noopener noreferrer">{baseData.photo.license}</a></p></details>}
      </section>

      <section className="passport-controls passport-workflow" aria-label="Build your passport"><header className="passport-control-head"><h2>Build your edition</h2><p>Every change stays in this browser.</p></header>{!ready ? <p role="status">Reading your marked places…</p> : <>
        <section className="passport-step passport-visit-step" aria-labelledby="passport-visits"><div><h3 id="passport-visits">Choose your visits</h3><p className="passport-step-copy">Search and select individual marked places.</p><div className="passport-visit-tools"><label><span className="sr-only">Search marked places</span><input type="search" value={visitQuery} onChange={(event) => setVisitQuery(event.target.value)} placeholder="Search your places…" /></label><label><span className="sr-only">Filter marked places</span><select value={visitFilter} onChange={(event) => setVisitFilter(event.target.value as typeof visitFilter)}><option value="all">All places</option><option value="world">World</option><option value="district">Bangladesh</option></select></label></div><div className="passport-visit-list">{filteredVisits.length ? filteredVisits.map((visit) => { const memory = workspace.memories[visit.key]; return <label className="passport-visit-row" key={visit.key}>{visit.image ? <Image src={visit.image} alt={visit.imageAlt ?? ""} width={72} height={54} unoptimized /> : <span className="passport-visit-placeholder" aria-hidden="true">{visit.name.slice(0, 1)}</span>}<span><strong>{visit.name}</strong><small>{memory?.date ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(`${memory.date}T00:00:00`)) : visit.region}{memory?.note ? ` · ${memory.note}` : ""}</small></span><input type="checkbox" checked={!excluded.has(visit.key)} onChange={() => toggleVisit(visit.key)} aria-label={`Include ${visit.name}`} /><i aria-hidden="true">⋮</i></label>; }) : <p className="passport-inline-empty">No marked places match this search.</p>}</div></div></section>
        <section className="passport-step passport-details-step" aria-labelledby="passport-details"><div><h3 id="passport-details">Passport name</h3><p className="passport-step-copy">Optional · stays in this browser.</p><input id="passport-name" aria-label="Passport name" type="text" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="My Atlas Passport" /></div></section>
        <section className="passport-step passport-cover-step" aria-labelledby="passport-photo-heading"><div><h3 id="passport-photo-heading">Cover photo</h3><p className="passport-step-copy">Choose an Atlas photo or your own.</p><div className="passport-cover-editor">{(customCover?.dataUrl || photoSrc) ? <Image src={customCover?.dataUrl || publicPath(photoSrc as `/${string}`)} alt="Current passport cover photograph" width={104} height={72} unoptimized /> : <span className="passport-cover-placeholder" aria-hidden="true"/>}<div><label className="passport-upload-button" htmlFor="passport-cover-upload">Change photo</label><input id="passport-cover-upload" type="file" accept="image/*" onChange={(event) => void handleCoverUpload(event)} />{includedDistrictIds.length > 0 && !customCover && <select id="passport-photo" aria-label="Atlas cover photograph" value={featuredDistrictId} onChange={(event) => setFeaturedDistrictId(event.target.value)}><option value="atlas-cover">Sundarbans</option><option value="">First visited district</option>{markedDistricts.map((district) => <option key={district.id} value={district.id}>{districtDisplayName(district.name)}</option>)}</select>}{customCover && <button type="button" onClick={() => setCustomCover(undefined)}>Use Atlas photo</button>}</div></div></div></section>
        <section className="passport-step passport-style-step" aria-labelledby="passport-style"><div><h3 id="passport-style">Cover style</h3><p className="passport-step-copy">Applied to every page.</p><div className="passport-style-switch" role="group" aria-label="Passport cover style">{styleOptions.map((option) => <button key={option.id} type="button" className={`passport-style-choice passport-style-${option.id}`} aria-label={`${option.label}: ${option.detail}`} aria-pressed={style === option.id} onClick={() => setStyle(option.id)}><span className="passport-style-swatch" aria-hidden="true"/><span><strong>{option.label}</strong><small>{option.detail}</small></span></button>)}</div></div></section>
        <section className="passport-step passport-memory-step" aria-labelledby="passport-memory"><div><h3 id="passport-memory">Memory details</h3><p className="passport-step-copy">Add only what you remember. Nothing is inferred.</p>{selectedMemoryVisit ? <div className="passport-memory-editor"><div className="passport-memory-place">{selectedMemoryVisit.image ? <Image src={selectedMemoryVisit.image} alt={selectedMemoryVisit.imageAlt ?? ""} width={112} height={92} unoptimized /> : <span className="passport-visit-placeholder" aria-hidden="true">{selectedMemoryVisit.name.slice(0, 1)}</span>}<select id="passport-memory-place" aria-label="Memory place" value={activeMemoryVisitKey} onChange={(event) => setMemoryVisitKey(event.target.value)}>{includedVisits.map((visit) => <option key={visit.key} value={visit.key}>{visit.name}</option>)}</select></div><div className="passport-memory-fields"><div className="passport-memory-grid"><div><label className="passport-field" htmlFor="passport-memory-date">Visit date <small>optional</small></label><input id="passport-memory-date" type="date" value={selectedMemory.date} max={new Date().toISOString().slice(0, 10)} onInput={(event) => updateMemory(selectedMemoryVisit.key, { date: event.currentTarget.value })} /></div><label className="passport-favorite"><input type="checkbox" checked={selectedMemory.favorite} onChange={(event) => updateMemory(selectedMemoryVisit.key, { favorite: event.target.checked })} /><span>Favorite</span></label></div><label className="passport-field" htmlFor="passport-memory-note">Memory note <small>{selectedMemory.note.length} / 240</small></label><textarea id="passport-memory-note" value={selectedMemory.note} maxLength={240} onChange={(event) => updateMemory(selectedMemoryVisit.key, { note: event.target.value })} placeholder="A detail you want to remember…" /></div></div> : <p className="passport-inline-empty">Include a marked place to add a memory.</p>}</div></section>
        <section className="passport-step passport-pages-step" aria-labelledby="passport-pages"><div><h3 id="passport-pages">Arrange pages</h3><p className="passport-step-copy">Set the preview and PDF order.</p><ol className="passport-page-order"><li><span>01</span>{previewUrl && <Image src={previewUrl} alt="Passport cover thumbnail" width={36} height={50} unoptimized />}<strong>Cover</strong><small>Fixed</small></li>{manifestPages.map((page, index) => <li key={pageKey(page)}><span>{String(index + 2).padStart(2, "0")}</span>{manifestPreviewUrls[index] && <Image src={manifestPreviewUrls[index]} alt="" width={36} height={50} unoptimized />}<strong>{page.section}</strong><div><button type="button" disabled={index === 0} onClick={() => movePage(index, -1)} aria-label={`Move ${page.section} up`}><MoveIcon direction="up" /></button><button type="button" disabled={index === manifestPages.length - 1} onClick={() => movePage(index, 1)} aria-label={`Move ${page.section} down`}><MoveIcon direction="down" /></button></div></li>)}</ol></div></section>
        <section className="passport-step passport-export-step" aria-labelledby="passport-export"><div><div className="passport-export-layout"><div><h3 id="passport-export">Export your passport</h3><p className="passport-step-copy">Download the whole book or the page in view.</p></div><div><h3>Share passport</h3><p className="passport-step-copy">Place names only.</p></div><div className="passport-downloads"><button className="passport-download-primary" type="button" disabled={exportDisabled} onClick={() => void exportFile("pdf")}><span>{busy === "pdf" ? "Creating PDF…" : "Download PDF"}<small>{pageCount} {pageCount === 1 ? "page" : "pages"}</small></span><b aria-hidden="true">↓</b></button><button type="button" disabled={exportDisabled} onClick={() => void exportFile("page")}><span>{busy === "page" ? "Creating page…" : "Export current page"}<small>High-resolution PNG</small></span><b aria-hidden="true">↓</b></button><button type="button" disabled={exportDisabled} onClick={() => void sharePassport()}><span>{busy === "share" ? "Opening share…" : "Share passport"}<small>Private summary</small></span><b aria-hidden="true">↗</b></button>{photoFailed && <p>The cover photo could not load. Exports will use the illustrated cover.</p>}<p className="passport-status" role="status">{status}</p></div></div>{!hasVisits && <p className="passport-no-visits">Your passport is waiting for its first stamp. <Link href="/bd">Mark a place on the map →</Link></p>}<p className="passport-private"><span aria-hidden="true">◇</span><strong>Private by design.</strong> Notes and dates stay in this browser. Sharing includes place names only.</p></div></section>
      </>}</section>
    </div>}

    {activeTab === "timeline" && <section className="passport-feature-view"><header><h2>Your travel timeline</h2><p>Only dates you enter appear here. Undated visits remain in the studio.</p></header>{datedVisits.length ? <ol className="passport-timeline">{datedVisits.map((visit) => { const memory = workspace.memories[visit.key]; return <li key={visit.key}>{visit.image ? <Image src={visit.image} alt={visit.imageAlt ?? ""} width={160} height={110} unoptimized /> : <span className="passport-timeline-placeholder" aria-hidden="true"/>}<time dateTime={memory.date}>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${memory.date}T00:00:00`))}</time><div><h3>{visit.name}</h3><p>{memory.note || "No memory note added yet."}</p><button type="button" onClick={() => { setMemoryVisitKey(visit.key); setActiveTab("studio"); }}>Edit memory</button></div></li>; })}</ol> : <div className="passport-feature-empty"><h3>Your timeline begins with a date.</h3><p>Add a date to any included place in Studio. Atlas never guesses when you travelled.</p><button type="button" onClick={() => setActiveTab("studio")}>Add a memory</button></div>}</section>}
    {activeTab === "collections" && <section className="passport-feature-view"><header><h2>Collections</h2><p>Keep favorite visits and places saved for later in one private index.</p></header><div className="passport-collection-columns"><section><h3>Favorite visits <span>{favoriteVisits.length}</span></h3>{favoriteVisits.length ? <ul>{favoriteVisits.map((visit) => <li key={visit.key}>{visit.image && <Image src={visit.image} alt={visit.imageAlt ?? ""} width={96} height={72} unoptimized />}<div><strong>{visit.name}</strong><small>{visit.region}</small></div><button type="button" onClick={() => updateMemory(visit.key, { favorite: false })}>Remove</button></li>)}</ul> : <div className="passport-inline-empty"><p>No favorites yet.</p><button type="button" onClick={() => setActiveTab("studio")}>Choose a favorite</button></div>}</section><section><h3>Saved for later <span>{savedPlaces.length}</span></h3>{savedPlaces.length ? <ul>{savedPlaces.map((place) => <li key={place.id}><Image src={publicPath(place.image.src)} alt={place.image.alt} width={96} height={72} unoptimized /><div><strong>{place.title}</strong><small>{districtDisplayName(place.district)}</small></div><Link href={`/discover/?place=${place.id}`}>Open</Link></li>)}</ul> : <div className="passport-inline-empty"><p>Save photographed places from the Places view to build this list.</p><Link href="/discover/">Browse places</Link></div>}</section></div></section>}
    {activeTab === "stamps" && <section className="passport-feature-view"><header><h2>Passport stamps</h2><p>Milestones are calculated only from this browser’s marked places and memories.</p></header><div className="passport-stamp-grid">{achievements.map((achievement) => <article key={achievement.id} className={achievement.earned ? "is-earned" : ""}><div className="passport-stamp-mark" aria-hidden="true"><span>{achievement.earned ? "ATLAS" : "—"}</span><strong>{achievement.label.slice(0, 1)}</strong></div><h3>{achievement.label}</h3><p>{achievement.detail}</p><small>{achievement.earned ? "Earned" : achievement.progress}</small></article>)}</div></section>}

    <p className="passport-back"><Link href="/insights">← Back to your atlas in numbers</Link></p>
    {activeTab === "studio" && <div className="passport-mobile-action"><button type="button" disabled={exportDisabled} onClick={() => void exportFile("pdf")}>{busy === "pdf" ? "Creating PDF…" : "Download PDF"}</button><button type="button" onClick={() => document.querySelector<HTMLElement>(".passport-controls")?.scrollIntoView({ behavior: "smooth" })} aria-label="Open passport controls"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M7 14v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button></div>}
  </main>;
}

