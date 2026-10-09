"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MapAdapter } from "@/components/map/MapAdapter";
import { divisions, divisionForDistrict, divisionSource } from "@/data/divisions";
import { highlightForDistrict } from "@/data/highlights";
import { filterPlaces, parseSavedSelection, serializeSelection, togglePlace, type Place } from "./state";
import { themes, type ThemeId } from "./themes";
import { resolveWorldPlaceId } from "@/data/worldPlaces";
import admin1Counts from "@/data/admin1-counts.json";
import { useCompactLayout } from "./useCompactLayout";
import { GeoSilhouette } from "@/components/map/GeoSilhouette";
import { publicPath } from "@/lib/publicPath";
import { attractions } from "@/data/attractions";

const regionCounts: Record<string, number> = admin1Counts;

type Scope = "world" | "districts";
type SheetMode = "peek" | "half" | "expanded";
const ProfileComposer = dynamic(() => import("@/features/profile/ProfileComposer").then((module) => module.ProfileComposer), { ssr: false });

function AtlasMark() {
  return <svg className="atlas-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 2 23 17 38 20 23 23 20 38 17 23 2 20 17 17 20 2Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="20" cy="20" r="4" fill="currentColor"/></svg>;
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7" stroke="currentColor" strokeWidth="1.8"/><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function PlaceList({ places, selected, activeId, onPick, onToggle, scope }: {
  places: Place[];
  selected: string[];
  activeId: string | null;
  onPick: (id: string) => void;
  onToggle: (id: string) => void;
  scope: Scope;
}) {
  return (
    <div className="place-list" role="list" aria-label={scope === "world" ? "Countries and territories" : "Bangladesh districts"}>
      {places.length === 0 && <p className="empty-results">No matching places. Try another name.</p>}
      {places.map((place) => {
        const visited = selected.includes(place.id);
        const name = place.displayName ?? place.name;
        return <div role="listitem" key={place.id} className={`place-row ${activeId === place.id ? "is-active" : ""}`}>
          <button type="button" className={`place-visit ${visited ? "is-checked" : ""}`} aria-label={`${visited ? "Remove" : "Mark"} ${name} ${visited ? "from" : "as visited in"} your atlas`} aria-pressed={visited} onClick={() => onToggle(place.id)}>{visited ? "✓" : ""}</button>
          <button type="button" className="place-focus" aria-current={activeId === place.id ? "true" : undefined} onClick={() => onPick(place.id)}>
            <span className="place-name"><strong>{name}</strong>{place.nameBn && <small lang="bn">{place.nameBn}</small>}</span>
            {scope === "districts" && highlightForDistrict(place.name) && <span className="guide-tag">Note</span>}
            <span className="place-row-end" aria-hidden="true">↗</span>
          </button>
        </div>;
      })}
    </div>
  );
}

function ThemePicker({ theme, onChange }: { theme: ThemeId; onChange: (value: ThemeId) => void }) {
  return <details className="theme-section">
    <summary>Map style</summary>
    <div className="theme-options">
      {(Object.keys(themes) as ThemeId[]).map((id) => <button
        key={id} type="button" className={`theme-option ${theme === id ? "is-selected" : ""}`}
        aria-pressed={theme === id} onClick={() => onChange(id)}
      ><span className="theme-swatch" style={{ background: `linear-gradient(135deg, ${themes[id].ocean} 48%, ${themes[id].land} 48%)` }} /><span>{themes[id].label}</span></button>)}
    </div>
  </details>;
}

function DivisionPicker({ id, value, onChange, selected, places }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  selected: string[];
  places: Place[];
}) {
  const inDivision = value ? places.filter((place) => divisionForDistrict(place.name) === value) : places;
  const visited = inDivision.filter((place) => selected.includes(place.id)).length;
  return <section className="division-section" aria-label="Browse by division">
    <label htmlFor={id}>Division</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">All 8 divisions</option>
      {divisions.map((division) => <option key={division.name} value={division.name}>{division.name} · {division.districts.length}</option>)}
    </select>
    <p>{visited} of {inDivision.length} districts visited</p>
  </section>;
}

function Detail({ scope, place, marked, onToggle, selectedCount, totalPlaces, onBrowse, onOpenProfile, sheetMode, onSheetMode }: {
  scope: Scope;
  place: Place | undefined;
  marked: boolean;
  onToggle: () => void;
  selectedCount: number;
  totalPlaces: number;
  onBrowse: () => void;
  onOpenProfile: () => void;
  sheetMode: SheetMode;
  onSheetMode: () => void;
}) {
  const highlight = scope === "districts" && place ? highlightForDistrict(place.name) : undefined;
  const attraction = scope === "districts" && place ? attractions.find((item) => item.district === place.name) : undefined;
  const regionCount = scope === "world" && place ? regionCounts[place.id] ?? 0 : 0;
  return <>
    <button className="sheet-handle" type="button" onClick={onSheetMode} aria-label={`Expand district or country panel; current position ${sheetMode}`}><span /></button>
    <div className={`detail-inner ${scope === "districts" && !place ? "is-country-overview" : ""}`}>
      <h2>{place ? place.displayName ?? place.name : scope === "world" ? "Choose a place" : "Bangladesh"}</h2>
      {place?.nameBn && <p className="bangla-name" lang="bn">{place.nameBn}</p>}
      {scope === "districts" && !place && <p className="bangla-name" lang="bn">বাংলাদেশ</p>}
      {scope === "districts" && place && <p className="division-detail">{divisionForDistrict(place.name)} division · <a href={divisionSource} target="_blank" rel="noreferrer">Government district list</a></p>}
      <p className="detail-description">{scope === "world"
        ? !place ? "Tap the map, search, or browse the country list." : place.id === "BGD" ? "Open the district map for a closer look." : regionCount > 1 ? "Explore its first-level regions or mark the country as visited." : "No first-level regions are mapped here. You can still mark the country as visited."
        : place ? marked ? "Saved in your atlas on this device." : "Mark this district if you have visited it." : "Tap a district on the map, or browse all 64."}</p>

      {scope === "world" && place?.id === "BGD" && <Link className="primary-action" href="/bd"><span>Explore 64 districts</span><span aria-hidden="true">↗</span></Link>}
      {scope === "world" && place && regionCount > 1 && <Link className="primary-action" href={`/regions/${place.id}`}><span>Explore {regionCount} regions</span><span aria-hidden="true">↗</span></Link>}
      {place && <button className={`visit-action ${marked ? "is-marked" : ""}`} type="button" aria-pressed={marked} onClick={onToggle}>
        <span>{marked ? "✓ Marked as visited" : "Mark as visited"}</span><span aria-hidden="true">{marked ? "−" : "+"}</span>
      </button>}
      {place && <GeoSilhouette name={place.displayName ?? place.name} src={publicPath(`/data/silhouettes/${scope}/${place.id}.svg`)} />}
      <button type="button" className="browse-button" onClick={onBrowse}>Browse {scope === "world" ? "places" : "districts"} <span aria-hidden="true">→</span></button>
      <nav className="journey-links" aria-label="More ways to explore">{scope === "districts" && <><Link href="/discover">Places & photos</Link><Link href="/planner">Plan a trip</Link></>}<Link href="/insights">Your atlas in numbers</Link></nav>

      <div className="detail-rule" />
      <div className="detail-progress" aria-live="polite"><span>{scope === "world" ? "Your world atlas" : "District progress"}</span><strong>{selectedCount} <small>of {totalPlaces} {scope === "world" ? "mapped places" : "districts"}</small></strong></div>
      <div className="progress-track"><span style={{ width: `${Math.min(100, selectedCount / totalPlaces * 100)}%` }} /></div>
      <p className="privacy-copy">Saved only in this browser. No account or location tracking.</p>
      <Link className="map-credits-link" href="/credits">Map credits</Link>
      <button type="button" className="profile-open" onClick={onOpenProfile}>Share or export atlas <span aria-hidden="true">↗</span></button>
      {highlight && <section className="place-note" aria-label="Sourced place note">
        {attraction && <div className="place-photo"><Link href="/discover" aria-label={`See more places including ${attraction.title}`}><Image src={publicPath(attraction.image.src)} alt={attraction.image.alt} width={800} height={600} unoptimized loading="lazy" /></Link><small>Photo: <a href={attraction.image.sourceUrl} target="_blank" rel="noreferrer">{attraction.image.author}</a> · <a href={attraction.image.licenseUrl} target="_blank" rel="noreferrer">{attraction.image.license}</a></small></div>}
        <p className="eyebrow">Field note · {highlight.category}</p>
        <h3>{highlight.title}</h3>
        <p>{highlight.summary}</p>
        <a href={highlight.sourceUrl} target="_blank" rel="noreferrer">Read at Bangladesh Tourism Board <span aria-hidden="true">↗</span></a>
      </section>}
    </div>
  </>;
}

export function ExplorerShell({ scope, places }: { scope: Scope; places: Place[] }) {
  const compact = useCompactLayout();
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<ThemeId>("atlas");
  const [division, setDivision] = useState("");
  const [sheetMode, setSheetMode] = useState<SheetMode>("half");
  const [profileOpen, setProfileOpen] = useState(false);
  const filtered = useMemo(() => filterPlaces(places.filter((place) => !division || divisionForDistrict(place.name) === division), query), [places, query, division]);
  const shownIds = filtered.map((place) => place.id);
  const hasMarkedShown = shownIds.some((id) => selected.includes(id));
  const activePlace = places.find((place) => place.id === activeId);
  const storageKey = `atlas:selection:${scope}:v1`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setSelected(parseSavedSelection(localStorage.getItem(storageKey), places, scope === "world" ? resolveWorldPlaceId : undefined)); } catch { setSelected([]); }
      if (scope === "world") {
        const requested = new URLSearchParams(window.location.search).get("place");
        if (requested && places.some((place) => place.id === requested)) setActiveId(requested);
      }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [places, scope, storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey, serializeSelection(selected)); } catch { /* Browsing still works if storage is disabled. */ }
  }, [hydrated, selected, storageKey]);

  function pick(id: string) {
    const picked = places.find((place) => place.id === id);
    if (picked && division && divisionForDistrict(picked.name) !== division) setDivision("");
    if (picked && query && filterPlaces([picked], query).length === 0) setQuery("");
    setActiveId(id);
    if (window.innerWidth <= 1060) setSheetMode("half");
  }

  function toggleVisited(id: string) {
    setSelected((current) => togglePlace(current, id));
  }

  function cycleSheet() {
    setSheetMode((current) => current === "peek" ? "half" : current === "half" ? "expanded" : "peek");
  }

  function selectShown() {
    setSelected((current) => [...new Set([...current, ...shownIds])]);
  }

  function clearShown() {
    const shown = new Set(shownIds);
    setSelected((current) => current.filter((id) => !shown.has(id)));
  }

  return <div className="atlas-app" data-theme={theme} data-scope={scope}>
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Atlas home"><AtlasMark /><span>ATLAS</span></Link>
      <label className="global-search"><SearchIcon /><span className="sr-only">Search {scope === "world" ? "countries and territories" : "districts"}</span><input value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value && window.innerWidth <= 1060) setSheetMode("expanded"); }} placeholder={scope === "world" ? "Find a country" : "Find a district"} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search">×</button>}</label>
      <nav className="top-nav" aria-label="Atlas views"><Link className={scope === "world" ? "current" : ""} href="/">World</Link><Link className={scope === "districts" ? "current" : ""} href="/bd" aria-label="Bangladesh districts"><span className="nav-full">Bangladesh</span><span className="nav-short">BD</span></Link></nav>
    </header>

    <main className="explorer-layout">
      <aside className="left-rail" aria-label="Explorer controls">
        <div className="rail-intro">
          {scope === "districts" && <p className="eyebrow">A country in context</p>}
          <h1>{scope === "world" ? "World map" : "Bangladesh"}</h1>
          {scope === "districts" && <p className="rail-bangla" lang="bn">বাংলাদেশ</p>}
          <p>{scope === "world" ? "Countries and territories" : "Explore its 64 districts, one place at a time."}</p>
        </div>
        <div className="rail-progress"><strong>{selected.length} / {places.length} visited</strong><span>Saved in this browser</span></div>
        {scope === "world" && <Link href="/bd" className="featured-link">Bangladesh district map <span aria-hidden="true">→</span></Link>}
        {scope === "districts" && <><Link href="/discover" className="featured-link">Places & photos <span aria-hidden="true">→</span></Link><Link href="/planner" className="featured-link">Plan a trip <span aria-hidden="true">→</span></Link></>}
        <Link href="/insights" className="featured-link">Atlas insights <span aria-hidden="true">→</span></Link>
        {scope === "districts" && <DivisionPicker id="division-filter-desktop" value={division} onChange={setDivision} selected={selected} places={places} />}
        <div className="list-heading"><h3>{scope === "world" ? "Places" : "Districts"}</h3><span>{filtered.length}</span></div>
        <div className="bulk-actions"><button type="button" onClick={selectShown} disabled={shownIds.length === 0}>Mark shown visited</button><button type="button" onClick={clearShown} disabled={!hasMarkedShown}>Clear shown</button></div>
        {!compact && <PlaceList places={filtered} selected={selected} activeId={activeId} onPick={pick} onToggle={toggleVisited} scope={scope} />}
        <ThemePicker theme={theme} onChange={setTheme} />
        <Link className="map-credits-link" href="/credits">Map credits</Link>
      </aside>

      <section className="map-area" aria-label={scope === "world" ? "World explorer" : "Bangladesh explorer"}>
        <MapAdapter scope={scope} places={places} selectedIds={selected} activeId={activeId} theme={theme} onSelect={pick} />
        <div className="map-top-caption">{activePlace ? `${activePlace.displayName ?? activePlace.name} · ${scope === "world" ? "World" : "District"}` : scope === "world" ? `World · ${places.length} places` : "Bangladesh · 64 districts"}</div>
        <div className="map-legend" aria-label="Map color key"><span><span className="legend-swatch active" aria-hidden="true" />Selected</span><span><span className="legend-swatch visited" aria-hidden="true" />Visited</span><span><span className="legend-swatch" aria-hidden="true" />Not visited</span></div>
      </section>

      <aside className={`detail-panel sheet-${sheetMode}${activePlace ? "" : " is-overview"}`} aria-label="Selected place details">
        <Detail scope={scope} place={activePlace} marked={Boolean(activeId && selected.includes(activeId))} onToggle={() => { if (activeId) toggleVisited(activeId); }} selectedCount={selected.length} totalPlaces={places.length} onBrowse={() => setSheetMode("expanded")} onOpenProfile={() => setProfileOpen(true)} sheetMode={sheetMode} onSheetMode={cycleSheet} />
        <div className="mobile-browse">{scope === "districts" && <DivisionPicker id="division-filter-mobile" value={division} onChange={setDivision} selected={selected} places={places} />}<div className="list-heading"><h3>{scope === "world" ? "Places" : "Districts"}</h3><span>{filtered.length}</span></div><div className="bulk-actions"><button type="button" onClick={selectShown} disabled={shownIds.length === 0}>Mark shown visited</button><button type="button" onClick={clearShown} disabled={!hasMarkedShown}>Clear shown</button></div>{compact && <PlaceList places={filtered} selected={selected} activeId={activeId} onPick={pick} onToggle={toggleVisited} scope={scope} />}<ThemePicker theme={theme} onChange={setTheme} /></div>
      </aside>
    </main>
    {profileOpen && <ProfileComposer scope={scope} selected={selected} onClose={() => setProfileOpen(false)} />}
  </div>;
}
