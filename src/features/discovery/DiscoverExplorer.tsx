"use client";

import { useEffect, useMemo, useState } from "react";
import { attractions } from "@/data/attractions";
import { districtDisplayName } from "@/data/districtNames";
import { divisions } from "@/data/divisions";
import districts from "@/data/districts.json";
import Link from "next/link";
import { AttractionCard } from "./AttractionCard";
import { parseSavedPlaces, SAVED_PLACES_KEY, serializeSavedPlaces, toggleSavedPlace } from "./savedPlaces";
import { SeasonalDiscovery } from "./SeasonalDiscovery";
import { seasonalCollections, type SeasonId } from "./seasonalPlaces";

const districtNames = districts.map((district) => district.name).sort((a, b) => districtDisplayName(a).localeCompare(districtDisplayName(b), "en"));
const countByDistrict = new Map(districtNames.map((name) => [name, attractions.filter((item) => item.district === name).length]));
const knownIds = attractions.map((item) => item.id);

export function DiscoverExplorer() {
  const [division, setDivision] = useState("All divisions");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Dhaka");
  const [view, setView] = useState<"districts" | "seasons" | "saved">("districts");
  const [seasonId, setSeasonId] = useState<SeasonId>("rainy");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const requested = new URLSearchParams(window.location.search).get("district");
      const match = districtNames.find((name) => name.toLowerCase() === requested?.toLowerCase());
      if (match) setSelected(match);
      const query = new URLSearchParams(window.location.search);
      if (query.get("view") === "saved") setView("saved");
      if (query.get("view") === "seasons") setView("seasons");
      const season = seasonalCollections.find((item) => item.id === query.get("season"));
      if (season) setSeasonId(season.id);
      try { setSavedIds(parseSavedPlaces(localStorage.getItem(SAVED_PLACES_KEY), knownIds)); } catch { setSavedIds([]); }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(SAVED_PLACES_KEY, serializeSavedPlaces(savedIds)); } catch { /* Saving is optional when storage is disabled. */ }
  }, [savedIds, hydrated]);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return districtNames.filter((name) => {
      if (division !== "All divisions" && !divisions.find((item) => item.name === division)?.districts.some((district) => district === name)) return false;
      return !term || districtDisplayName(name).toLowerCase().includes(term) || attractions.some((item) => item.district === name && item.title.toLowerCase().includes(term));
    });
  }, [division, search]);

  const shown = matches.includes(selected) ? selected : matches[0];
  const places = attractions.filter((item) => item.district === shown);
  const savedPlaces = savedIds.map((id) => attractions.find((item) => item.id === id)).filter((item): item is (typeof attractions)[number] => Boolean(item)).filter((item) => {
    if (division !== "All divisions" && !divisions.find((entry) => entry.name === division)?.districts.some((district) => district === item.district)) return false;
    const term = search.trim().toLowerCase();
    return !term || item.title.toLowerCase().includes(term) || districtDisplayName(item.district).toLowerCase().includes(term);
  });

  function selectView(next: "districts" | "seasons" | "saved") {
    setView(next);
    const url = new URL(window.location.href);
    if (next !== "districts") url.searchParams.set("view", next);
    else url.searchParams.delete("view");
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  function selectSeason(next: SeasonId) {
    setSeasonId(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", "seasons");
    url.searchParams.set("season", next);
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  function selectDistrict(name: string) {
    setSelected(name);
    const url = new URL(window.location.href);
    url.searchParams.set("district", name);
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  return <><nav className="discovery-views" aria-label="Place collections"><button type="button" className={view === "districts" ? "current" : ""} aria-current={view === "districts" ? "page" : undefined} onClick={() => selectView("districts")}>By district <span>64</span></button><button type="button" className={view === "seasons" ? "current" : ""} aria-current={view === "seasons" ? "page" : undefined} onClick={() => selectView("seasons")}>By season <span>02</span></button><button type="button" className={view === "saved" ? "current" : ""} aria-current={view === "saved" ? "page" : undefined} onClick={() => selectView("saved")}>Saved places <span>{savedIds.length}</span></button></nav>{view === "seasons" ? <SeasonalDiscovery seasonId={seasonId} onSelect={selectSeason} savedIds={savedIds} onToggleSaved={(id) => setSavedIds((current) => toggleSavedPlace(current, id))} /> : <div className={`discovery-layout ${view === "saved" ? "saved-view" : ""}`}>
    <aside className="district-finder" aria-label={view === "saved" ? "Filter saved places" : "Browse Bangladesh districts"}>
      <div className="district-finder-heading"><h2>{view === "saved" ? "Your collection" : "Browse districts"}</h2><span>{view === "saved" ? `${savedIds.length} saved` : "64 districts"}</span></div>
      <label htmlFor="district-search">Find a district or place</label>
      <input id="district-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Bagerhat or Sixty Dome" />
      <label htmlFor="division-filter">Division</label>
      <select id="division-filter" value={division} onChange={(event) => setDivision(event.target.value)}><option>All divisions</option>{divisions.map((item) => <option key={item.name}>{item.name}</option>)}</select>
      <p className="finder-count" aria-live="polite">{view === "saved" ? `${savedPlaces.length} saved ${savedPlaces.length === 1 ? "place" : "places"} shown` : `${matches.length} ${matches.length === 1 ? "district" : "districts"} found`}</p>
      {view === "districts" ? <div className="district-list">{matches.map((name) => <button key={name} type="button" className={name === shown ? "selected" : ""} aria-current={name === shown ? "true" : undefined} onClick={() => selectDistrict(name)}><span>{districtDisplayName(name)}</span><small>{countByDistrict.get(name)} {countByDistrict.get(name) === 1 ? "place" : "places"}</small></button>)}</div> : <div className="saved-finder-note"><p>Keep a shortlist for later. It stays in this browser.</p>{savedIds.length > 0 && <Link href="/planner?add=saved">Add saved places to trip →</Link>}</div>}
    </aside>
    <section className="district-places" aria-live="polite">
      {view === "saved" ? <><header className="district-places-heading"><div><p>Private on this device</p><h2>Saved for later</h2></div><span>{savedPlaces.length} photographed {savedPlaces.length === 1 ? "place" : "places"}</span></header>{savedPlaces.length ? <div className="attraction-grid">{savedPlaces.map((attraction, index) => <AttractionCard key={attraction.id} attraction={attraction} saved eager={index === 0} onToggleSaved={(id) => setSavedIds((current) => toggleSavedPlace(current, id))} />)}</div> : <div className="district-empty">{savedIds.length ? "No saved places match these filters." : <>Your collection starts with a place you love. <button type="button" onClick={() => selectView("districts")}>Browse districts</button></>}</div>}</> : shown ? <><header className="district-places-heading"><div><p>{divisions.find((item) => item.districts.some((district) => district === shown))?.name} division</p><h2>{districtDisplayName(shown)}</h2></div><span>{places.length} photographed {places.length === 1 ? "place" : "places"}</span></header><div className="attraction-grid">{places.map((attraction, index) => <AttractionCard key={attraction.id} attraction={attraction} saved={savedIds.includes(attraction.id)} eager={index === 0} onToggleSaved={(id) => setSavedIds((current) => toggleSavedPlace(current, id))} />)}</div></> : <div className="district-empty">No district matches. Try another name or choose all divisions.</div>}
    </section>
  </div>}</>;
}
