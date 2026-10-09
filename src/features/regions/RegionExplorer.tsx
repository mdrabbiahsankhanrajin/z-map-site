"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapAdapter } from "@/components/map/MapAdapter";
import { GeoSilhouette } from "@/components/map/GeoSilhouette";
import { geoSilhouette, type OutlineGeometry } from "@/lib/geoSilhouette";
import { filterPlaces, parseSavedSelection, serializeSelection, togglePlace, type Place } from "@/features/explorer/state";
import { themes, type ThemeId } from "@/features/explorer/themes";
import { regionNotes } from "@/data/regionNotes";
import { disambiguateRegions, type Region } from "./disambiguateRegions";
import { useCompactLayout } from "@/features/explorer/useCompactLayout";
import { publicPath } from "@/lib/publicPath";

type Feature = { properties: Region; geometry: OutlineGeometry };
type Collection = { type: string; features: Feature[] };
type SheetMode = "peek" | "half" | "expanded";

function RegionList({ regions, selected, activeId, onPick, onToggle }: {
  regions: Region[]; selected: string[]; activeId: string | null;
  onPick: (id: string) => void; onToggle: (id: string) => void;
}) {
  return <div className="place-list" role="list" aria-label="Country regions">
    {regions.length === 0 && <p className="empty-results">No matching regions. Try another name.</p>}
    {regions.map((region) => {
      const visited = selected.includes(region.id);
      return <div role="listitem" key={region.id} className={`place-row ${activeId === region.id ? "is-active" : ""}`}>
        <button type="button" className={`place-visit ${visited ? "is-checked" : ""}`} aria-label={`${visited ? "Remove" : "Mark"} ${region.displayName ?? region.name} ${visited ? "from" : "as visited in"} your atlas`} aria-pressed={visited} onClick={() => onToggle(region.id)}>{visited ? "✓" : ""}</button>
        <button type="button" className="place-focus" aria-current={activeId === region.id ? "true" : undefined} onClick={() => onPick(region.id)}><span className="place-name"><strong>{region.displayName ?? region.name}</strong>{region.nameBn && <small lang="bn">{region.nameBn}</small>}</span><span className="place-row-end" aria-hidden="true">↗</span></button>
      </div>;
    })}
  </div>;
}

function RegionThemePicker({ theme, onChange }: { theme: ThemeId; onChange: (value: ThemeId) => void }) {
  return <details className="theme-section">
    <summary>Map style</summary>
    <div className="theme-options">{(Object.keys(themes) as ThemeId[]).map((id) => <button key={id} type="button" className={`theme-option ${theme === id ? "is-selected" : ""}`} aria-pressed={theme === id} onClick={() => onChange(id)}><span className="theme-swatch" style={{ background: `linear-gradient(135deg, ${themes[id].ocean} 48%, ${themes[id].land} 48%)` }} /><span>{themes[id].label}</span></button>)}</div>
    <Link className="map-credits-link" href="/credits">Map data & credits</Link>
  </details>;
}

export function RegionExplorer({ country }: { country: Place }) {
  const compact = useCompactLayout();
  const [regions, setRegions] = useState<Region[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<ThemeId>("atlas");
  const [sheetMode, setSheetMode] = useState<SheetMode>("half");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [geometryById, setGeometryById] = useState<Map<string, OutlineGeometry>>(new Map());
  const sourceUrl = publicPath(`/data/admin1/${country.id}.geojson`);
  const storageKey = `atlas:selection:admin1:${country.id}:v1`;
  const filtered = useMemo(() => filterPlaces(regions, query), [regions, query]);
  const shownIds = filtered.map((region) => region.id);
  const active = regions.find((region) => region.id === activeId);
  const geometry = activeId ? geometryById.get(activeId) : undefined;
  const outline = useMemo(() => geometry ? geoSilhouette([geometry]) : "", [geometry]);
  const note = active ? regionNotes[active.id] : undefined;

  useEffect(() => {
    const controller = new AbortController();
    fetch(sourceUrl, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Region data unavailable"); return response.json() as Promise<Collection>; })
      .then((data) => {
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) throw new Error("Invalid region data");
        const items = data.features.map((feature) => feature.properties);
        if (!items.every((item) => typeof item.id === "string" && typeof item.name === "string" && Array.isArray(item.bounds))) throw new Error("Invalid region records");
        setGeometryById(new Map(data.features.map((feature) => [feature.properties.id, feature.geometry])));
        setRegions(disambiguateRegions(items));
        try { setSelected(parseSavedSelection(localStorage.getItem(storageKey), items)); } catch { setSelected([]); }
        setLoaded(true);
      })
      .catch((reason: unknown) => { if (!(reason instanceof Error && reason.name === "AbortError")) setError(true); });
    return () => controller.abort();
  }, [sourceUrl, storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, serializeSelection(selected)); } catch { /* Browsing still works if storage is disabled. */ }
  }, [loaded, selected, storageKey]);

  function pick(id: string) {
    const region = regions.find((item) => item.id === id);
    if (!region) return;
    if (query && filterPlaces([region], query).length === 0) setQuery("");
    setActiveId(id);
    if (window.innerWidth <= 1060) setSheetMode("half");
  }

  function toggle(id: string) { setSelected((current) => togglePlace(current, id)); }
  function cycleSheet() { setSheetMode((current) => current === "peek" ? "half" : current === "half" ? "expanded" : "peek"); }
  const listProps = { regions: filtered, selected, activeId, onPick: pick, onToggle: toggle };
  const backUrl = `/?place=${country.id}`;

  return <div className="atlas-app" data-scope="regions" data-theme={theme}>
    <header className="topbar">
      <Link href={backUrl} className="brand" aria-label="Back to World map"><svg className="atlas-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 2 23 17 38 20 23 23 20 38 17 23 2 20 17 17 20 2Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="20" cy="20" r="4" fill="currentColor"/></svg><span>ATLAS</span></Link>
      <label className="global-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search regions in {country.name}</span><input value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value && window.innerWidth <= 1060) setSheetMode("expanded"); }} placeholder="Find a region" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
      <nav className="top-nav" aria-label="Atlas views"><Link className="current" href={backUrl}>World</Link><Link href="/bd" aria-label="Bangladesh districts"><span className="nav-full">Bangladesh</span><span className="nav-short">BD</span></Link></nav>
    </header>
    <main className="explorer-layout">
      <aside className="left-rail" aria-label="Region controls">
        <div className="rail-intro"><h1>{country.displayName ?? country.name}</h1><p>First-level regions</p></div>
        <Link className="featured-link" href={backUrl}>← Back to country map</Link>
        <div className="rail-progress"><strong>{selected.length} / {regions.length} visited</strong><span>Saved in this browser</span></div>
        <div className="list-heading"><h3>Regions</h3><span>{filtered.length}</span></div>
        <div className="bulk-actions"><button type="button" disabled={shownIds.length === 0} onClick={() => setSelected((current) => [...new Set([...current, ...shownIds])])}>Mark shown visited</button><button type="button" disabled={!shownIds.some((id) => selected.includes(id))} onClick={() => setSelected((current) => current.filter((id) => !shownIds.includes(id)))}>Clear shown</button></div>
        {!compact && <RegionList {...listProps} />}
        <RegionThemePicker theme={theme} onChange={setTheme} />
      </aside>
      <section className="map-area" aria-label={`${country.name} regions map`}>
        {loaded ? <MapAdapter scope="regions" places={regions} sourceUrl={sourceUrl} overview={country} selectedIds={selected} activeId={activeId} theme={theme} onSelect={pick} /> : <div className="map-state" role="status">{error ? "Regions unavailable. Return to the World map." : <><span>Loading region boundaries</span><small>Local atlas data</small></>}</div>}
        <div className="map-top-caption">{active ? `${active.displayName ?? active.name} · ${country.name}` : `${country.name} · ${regions.length} regions`}</div>
        <div className="map-legend" aria-label="Map color key"><span><span className="legend-swatch active" aria-hidden="true" />Selected</span><span><span className="legend-swatch visited" aria-hidden="true" />Visited</span><span><span className="legend-swatch" aria-hidden="true" />Not visited</span></div>
      </section>
      <aside className={`detail-panel sheet-${sheetMode}${active ? "" : " is-overview"}`} aria-label="Selected region details">
        <button className="sheet-handle" type="button" onClick={cycleSheet} aria-label={`Expand region panel; current position ${sheetMode}`}><span /></button>
        <div className="detail-inner">
          <h2>{active?.displayName ?? active?.name ?? "Choose a region"}</h2>
          {active?.nameBn && <p className="bangla-name" lang="bn">{active.nameBn}</p>}
          {active?.type && <p className="division-detail">{active.type} · {country.name}</p>}
          <p className="detail-description">{active ? "Mark this region if you have visited it." : "Tap the map, search, or browse the region list."}</p>
          {active && <button className={`visit-action ${selected.includes(active.id) ? "is-marked" : ""}`} type="button" aria-pressed={selected.includes(active.id)} onClick={() => toggle(active.id)}><span>{selected.includes(active.id) ? "✓ Marked as visited" : "Mark as visited"}</span><span aria-hidden="true">{selected.includes(active.id) ? "−" : "+"}</span></button>}
          {active && outline && <GeoSilhouette name={active.displayName ?? active.name} path={outline} />}
          {note && <section className="region-note" aria-label="Sourced region note"><h3>{note.title}</h3><p>{note.summary}</p><a href={note.sourceUrl} target="_blank" rel="noreferrer">Read at {note.sourceLabel} <span aria-hidden="true">↗</span></a></section>}
          <button type="button" className="browse-button" onClick={() => setSheetMode("expanded")}>Browse regions <span aria-hidden="true">→</span></button>
          <div className="detail-rule" />
          <div className="detail-progress" aria-live="polite"><span>Region progress</span><strong>{selected.length} <small>of {regions.length} regions</small></strong></div>
          <div className="progress-track"><span style={{ width: `${regions.length ? selected.length / regions.length * 100 : 0}%` }} /></div>
          <p className="privacy-copy">Saved only in this browser. No account or location tracking.</p>
          <Link className="featured-link" href={backUrl}>← Back to {country.name}</Link>
        </div>
        <div className="mobile-browse"><div className="list-heading"><h3>Regions</h3><span>{filtered.length}</span></div>{compact && <RegionList {...listProps} />}<RegionThemePicker theme={theme} onChange={setTheme} /></div>
      </aside>
    </main>
  </div>;
}
