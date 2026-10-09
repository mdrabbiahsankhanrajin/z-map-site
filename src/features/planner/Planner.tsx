"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { attractions } from "@/data/attractions";
import { TravelHeader } from "@/components/TravelHeader";
import { addStop, customStopId, customStopName, emptyTripDetails, moveStop, parseTrip, parseTripDetails, removeStop, serializeTrip, type TripDetails } from "./state";

const STORAGE_KEY = "atlas:trip:v1";
const knownIds = attractions.map((item) => item.id);

export function Planner() {
  const [stops, setStops] = useState<string[]>([]);
  const [details, setDetails] = useState<TripDetails>(emptyTripDetails);
  const [destination, setDestination] = useState("");
  const [custom, setCustom] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Planner still works without storage. */ }
      let loaded = parseTrip(saved, knownIds);
      const add = new URLSearchParams(window.location.search).get("add");
      if (add && knownIds.includes(add)) {
        loaded = addStop(loaded, add);
        window.history.replaceState(null, "", window.location.pathname);
      }
      setStops(loaded);
      setDetails(parseTripDetails(saved));
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, serializeTrip(stops, details)); } catch { /* Local storage may be disabled. */ }
  }, [stops, details, hydrated]);

  function addDestination() {
    if (destination) setStops((current) => addStop(current, destination));
    setDestination("");
  }

  function addCustom() {
    try {
      setStops((current) => addStop(current, customStopId(custom)));
      setCustom("");
      setError("");
    } catch {
      setError("Enter a destination name of 1–80 characters.");
    }
  }

  function stopName(id: string): string {
    return attractions.find((item) => item.id === id)?.title ?? customStopName(id) ?? "Unknown stop";
  }

  return <main className="atlas-content-page planner-page">
    <TravelHeader active="planner" />
    <section className="content-intro"><p className="content-locale">Your journey · private on this device</p><h1>Plan a trip, your way</h1><p>Choose photographed places or add your own stops. Use the move controls to put them in your preferred order.</p></section>
    <div className="planner-layout">
      <section className="planner-editor" aria-label="Itinerary editor">
        <h2>Stops</h2>
        <div className="planner-add"><label htmlFor="known-stop">From the collection</label><div><select id="known-stop" value={destination} onChange={(event) => setDestination(event.target.value)}><option value="">Choose a place</option>{attractions.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.district}</option>)}</select><button type="button" onClick={addDestination} disabled={!destination}>Add stop</button></div></div>
        <div className="planner-add"><label htmlFor="custom-stop">Another destination</label><div><input id="custom-stop" value={custom} maxLength={80} onChange={(event) => { setCustom(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") addCustom(); }} placeholder="District, city or place name" /><button type="button" onClick={addCustom} disabled={!custom.trim()}>Add stop</button></div>{error && <p role="alert" className="planner-error">{error}</p>}</div>
        {stops.length === 0 ? <p className="planner-empty">Start with a place above. Your itinerary stays on this device.</p> : <ol className="trip-stops">{stops.map((id, index) => <li key={id}><span className="stop-number">{String(index + 1).padStart(2, "0")}</span><span className="stop-name">{stopName(id)}{attractions.find((item) => item.id === id) && <small>{attractions.find((item) => item.id === id)?.district}</small>}</span><div className="stop-controls"><button type="button" disabled={index === 0} onClick={() => setStops((current) => moveStop(current, id, -1))} aria-label={`Move ${stopName(id)} up`}>↑</button><button type="button" disabled={index === stops.length - 1} onClick={() => setStops((current) => moveStop(current, id, 1))} aria-label={`Move ${stopName(id)} down`}>↓</button><button type="button" onClick={() => setStops((current) => removeStop(current, id))} aria-label={`Remove ${stopName(id)}`}>×</button></div></li>)}</ol>}
      </section>
      <aside className="planner-notes" aria-label="Trip details">
        <h2>Trip notes</h2>
        <label htmlFor="trip-origin">Starting from</label><input id="trip-origin" value={details.origin} maxLength={100} onChange={(event) => setDetails((current) => ({ ...current, origin: event.target.value }))} placeholder="Your starting place" />
        <label htmlFor="trip-days">Days available</label><input id="trip-days" type="number" min="1" max="365" value={details.days ?? ""} onChange={(event) => { const n = Number(event.target.value); setDetails((current) => ({ ...current, days: event.target.value && Number.isInteger(n) && n >= 1 && n <= 365 ? n : null })); }} placeholder="Optional" />
        <label htmlFor="trip-budget">Your budget · BDT</label><input id="trip-budget" type="number" min="0" max="1000000000" value={details.budgetBdt ?? ""} onChange={(event) => { const n = Number(event.target.value); setDetails((current) => ({ ...current, budgetBdt: event.target.value && Number.isFinite(n) && n >= 0 && n <= 1e9 ? n : null })); }} placeholder="Optional" />
        <p className="planner-caveat">Budget is the amount you enter, not a cost estimate. Distances, transport times and shortest-route sorting need verified routing data and are not shown yet.</p>
        <Link href="/discover">Explore places with photos →</Link>
      </aside>
    </div>
  </main>;
}
