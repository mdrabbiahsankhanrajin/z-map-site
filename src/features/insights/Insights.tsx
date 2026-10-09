"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import districts from "@/data/districts.json";
import { worldPlaces, resolveWorldPlaceId } from "@/data/worldPlaces";
import { attractions } from "@/data/attractions";
import { parseSavedSelection } from "@/features/explorer/state";
import { parseTrip } from "@/features/planner/state";
import { TravelHeader } from "@/components/TravelHeader";
import { progressByContinent, progressByDivision, type ProgressRow } from "./stats";

type Snapshot = { world: number; districts: number; stops: number; continents: ProgressRow[]; divisions: ProgressRow[] };

function ProgressTable({ title, rows }: { title: string; rows: ProgressRow[] }) {
  return <section className="insight-section"><h2>{title}</h2><table className="insight-table"><caption>{title} from saved visits in this browser</caption><thead><tr><th scope="col">Area</th><th scope="col">Visited</th><th scope="col">Places</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}><th scope="row">{row.name}<span className="insight-bar"><span style={{ width: `${row.total ? row.visited / row.total * 100 : 0}%` }} /></span></th><td>{row.visited}</td><td>{row.total}</td></tr>)}</tbody></table></section>;
}

export function Insights() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
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
      setSnapshot({ world: world.length, districts: district.length, stops: stops.length, continents: progressByContinent(worldPlaces, world), divisions: progressByDivision(districts, district) });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return <main className="atlas-content-page insights-page">
    <TravelHeader active="insights" />
    <section className="content-intro"><p className="content-locale">Personal atlas · on this device</p><h1>Your atlas, in numbers</h1><p>These counts come only from places you marked and stops you saved here. They are not site visitor analytics.</p></section>
    {snapshot ? <div className="insights-layout">
      <div className="insight-totals"><div><strong>{snapshot.world}</strong><span>of {worldPlaces.length} world places visited</span></div><div><strong>{snapshot.districts}</strong><span>of 64 Bangladesh districts visited</span></div><div><strong>{snapshot.stops}</strong><span>stops in your trip plan</span></div></div>
      <div className="insight-tables"><ProgressTable title="World by continent" rows={snapshot.continents} /><ProgressTable title="Bangladesh by division" rows={snapshot.divisions} /></div>
      <p className="insight-next"><Link href="/bd">Explore districts →</Link><Link href="/planner">Edit your trip →</Link></p>
    </div> : <p className="insight-loading" role="status">Reading this browser’s atlas…</p>}
  </main>;
}
