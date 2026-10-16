"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import districts from "@/data/districts.json";
import { worldPlaces, resolveWorldPlaceId } from "@/data/worldPlaces";
import { attractions } from "@/data/attractions";
import { districtDisplayName } from "@/data/districtNames";
import { publicPath } from "@/lib/publicPath";
import { parseSavedSelection } from "@/features/explorer/state";
import { parseTrip } from "@/features/planner/state";
import { TravelHeader } from "@/components/TravelHeader";
import { progressByContinent, progressByDivision, type ProgressRow } from "./stats";

type Snapshot = { world: number; districts: number; stops: number; visitedDistricts: string[]; continents: ProgressRow[]; divisions: ProgressRow[] };

function ProgressTable({ title, rows }: { title: string; rows: ProgressRow[] }) {
  return <section className="insight-section"><h2>{title}</h2><table className="insight-table"><caption>{title} from saved visits in this browser</caption><thead><tr><th scope="col">Area</th><th scope="col">Visited</th><th scope="col">Places</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}><th scope="row">{row.name}<span className="insight-bar"><span style={{ width: `${row.total ? row.visited / row.total * 100 : 0}%` }} /></span></th><td>{row.visited}</td><td>{row.total}</td></tr>)}</tbody></table></section>;
}

export function Insights() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let worldRaw: string | null = null;
      let districtRaw: string | null = null;
      let tripRaw: string | null = null;
      try {
        worldRaw = localStorage.getItem("atlas:selection:world:v1");
        districtRaw = localStorage.getItem("atlas:selection:districts:v1");
        tripRaw = localStorage.getItem("atlas:trip:v1");
      } catch { /* Empty progress is still a valid view. */ }
      const world = parseSavedSelection(worldRaw, worldPlaces, resolveWorldPlaceId);
      const district = parseSavedSelection(districtRaw, districts);
      const stops = parseTrip(tripRaw, attractions.map((item) => item.id));
      setSnapshot({ world: world.length, districts: district.length, stops: stops.length, visitedDistricts: districts.filter((item) => district.includes(item.id)).map((item) => item.name).sort((a, b) => districtDisplayName(a).localeCompare(districtDisplayName(b), "en")), continents: progressByContinent(worldPlaces, world), divisions: progressByDivision(districts, district) });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return <main className="atlas-content-page insights-page">
    <TravelHeader active="insights" />
    <section className="content-intro"><p className="content-locale">Personal atlas · on this device</p><h1>Your atlas, in numbers</h1><p>These counts come only from places you marked and stops you saved here. They are not site visitor analytics.</p></section>
    {snapshot ? <div className="insights-layout">
      <div className="insight-totals"><div><strong>{snapshot.world}</strong><span>of {worldPlaces.length} world places visited</span></div><div><strong>{snapshot.districts}</strong><span>of 64 Bangladesh districts visited</span></div><div><strong>{snapshot.stops}</strong><span>stops in your trip plan</span></div></div>
      <section className="passport-section" aria-label="Your Bangladesh photo passport">
        <header><div><h2>Your Bangladesh passport</h2><p>Districts you mark visited become entries here. Saved only on this device.</p><Link className="passport-export-link" href="/passport">Design &amp; download your passport →</Link></div><span>{snapshot.districts} / 64</span></header>
        {snapshot.visitedDistricts.length ? <><div className="passport-grid">{snapshot.visitedDistricts.slice(0, showAll ? undefined : 8).map((name) => {
          const attraction = attractions.find((item) => item.district === name);
          if (!attraction) return null;
          return <article className="passport-entry" key={name}>
            <Link href={`/bd?district=${encodeURIComponent(name)}`} aria-label={`Open ${districtDisplayName(name)} on the map`}><Image src={publicPath(attraction.image.src)} alt={attraction.image.alt} width={480} height={360} unoptimized loading="lazy" /><strong>{districtDisplayName(name)}</strong><span>{attraction.title} ↗</span></Link>
            <small>Photo: <a href={attraction.image.sourceUrl} target="_blank" rel="noreferrer">{attraction.image.author}</a> · <a href={attraction.image.licenseUrl} target="_blank" rel="noreferrer">{attraction.image.license}</a>{attraction.image.note && <> · {attraction.image.note}</>}</small>
          </article>;
        })}</div>{snapshot.visitedDistricts.length > 8 && <button className="passport-more" type="button" onClick={() => setShowAll((current) => !current)}>{showAll ? "Show fewer districts" : `Show all ${snapshot.visitedDistricts.length} districts`}</button>}</> : <p className="passport-empty">Your first district entry is waiting. <Link href="/bd">Open the Bangladesh map →</Link></p>}
      </section>
      <div className="insight-tables"><ProgressTable title="World by continent" rows={snapshot.continents} /><ProgressTable title="Bangladesh by division" rows={snapshot.divisions} /></div>
      <p className="insight-next"><Link href="/bd">Explore districts →</Link><Link href="/planner">Edit your trip →</Link></p>
    </div> : <p className="insight-loading" role="status">Reading this browser’s atlas…</p>}
  </main>;
}
