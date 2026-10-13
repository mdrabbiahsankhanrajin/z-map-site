"use client";

import { useEffect, useMemo, useState } from "react";
import { attractions } from "@/data/attractions";
import { districtDisplayName } from "@/data/districtNames";
import { divisions } from "@/data/divisions";
import districts from "@/data/districts.json";
import { AttractionCard } from "./AttractionCard";

const districtNames = districts.map((district) => district.name).sort((a, b) => districtDisplayName(a).localeCompare(districtDisplayName(b), "en"));
const countByDistrict = new Map(districtNames.map((name) => [name, attractions.filter((item) => item.district === name).length]));

export function DiscoverExplorer() {
  const [division, setDivision] = useState("All divisions");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("Dhaka");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const requested = new URLSearchParams(window.location.search).get("district");
      const match = districtNames.find((name) => name.toLowerCase() === requested?.toLowerCase());
      if (match) setSelected(match);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    return districtNames.filter((name) => {
      if (division !== "All divisions" && !divisions.find((item) => item.name === division)?.districts.some((district) => district === name)) return false;
      return !term || districtDisplayName(name).toLowerCase().includes(term) || attractions.some((item) => item.district === name && item.title.toLowerCase().includes(term));
    });
  }, [division, search]);

  const shown = matches.includes(selected) ? selected : matches[0];
  const places = attractions.filter((item) => item.district === shown);

  function selectDistrict(name: string) {
    setSelected(name);
    const url = new URL(window.location.href);
    url.searchParams.set("district", name);
    window.history.replaceState(null, "", url.pathname + url.search);
  }

  return <div className="discovery-layout">
    <aside className="district-finder" aria-label="Browse Bangladesh districts">
      <div className="district-finder-heading"><h2>Browse districts</h2><span>64 districts</span></div>
      <label htmlFor="district-search">Find a district or place</label>
      <input id="district-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Bagerhat or Sixty Dome" />
      <label htmlFor="division-filter">Division</label>
      <select id="division-filter" value={division} onChange={(event) => setDivision(event.target.value)}><option>All divisions</option>{divisions.map((item) => <option key={item.name}>{item.name}</option>)}</select>
      <p className="finder-count" aria-live="polite">{matches.length} {matches.length === 1 ? "district" : "districts"} found</p>
      <div className="district-list">{matches.map((name) => <button key={name} type="button" className={name === shown ? "selected" : ""} aria-current={name === shown ? "true" : undefined} onClick={() => selectDistrict(name)}><span>{districtDisplayName(name)}</span><small>{countByDistrict.get(name)} {countByDistrict.get(name) === 1 ? "place" : "places"}</small></button>)}</div>
    </aside>
    <section className="district-places" aria-live="polite">
      {shown ? <><header className="district-places-heading"><div><p>{divisions.find((item) => item.districts.some((district) => district === shown))?.name} division</p><h2>{districtDisplayName(shown)}</h2></div><span>{places.length} photographed {places.length === 1 ? "place" : "places"}</span></header><div className="attraction-grid">{places.map((attraction) => <AttractionCard key={attraction.id} attraction={attraction} />)}</div></> : <div className="district-empty">No district matches. Try another name or choose all divisions.</div>}
    </section>
  </div>;
}
