"use client";

import { attractions } from "@/data/attractions";
import { AttractionCard } from "./AttractionCard";
import { seasonalCollections, seasonPeriodSource, type SeasonId } from "./seasonalPlaces";

export function SeasonalDiscovery({ seasonId, onSelect, savedIds, onToggleSaved }: {
  seasonId: SeasonId;
  onSelect: (id: SeasonId) => void;
  savedIds: string[];
  onToggleSaved: (id: string) => void;
}) {
  const season = seasonalCollections.find((item) => item.id === seasonId) ?? seasonalCollections[0];
  return <section className="seasonal-discovery" aria-label="Explore places by season">
    <div className="seasonal-intro"><p className="seasonal-kicker">A changing landscape</p><h2>See the season, then the place.</h2><p>These photographed places have a distinct rainy or winter character described by the Bangladesh Tourism Board. They are ideas to explore, not a weather or access forecast.</p></div>
    <div className="seasonal-selector" role="group" aria-label="Choose a season">{seasonalCollections.map((item, index) => <button key={item.id} type="button" className={item.id === season.id ? "current" : ""} aria-pressed={item.id === season.id} onClick={() => onSelect(item.id)}><span className="seasonal-index">0{index + 1} / Season</span><strong>{item.title}</strong><span>{item.period}</span></button>)}</div>
    <div className="seasonal-heading"><div><p>{season.period}</p><h3>{season.title}</h3><p>{season.description}</p></div><a href={seasonPeriodSource} target="_blank" rel="noreferrer">Season dates ↗</a></div>
    <div className="seasonal-grid">{season.places.map((entry) => {
      const attraction = attractions.find((item) => item.id === entry.id);
      if (!attraction) return null;
      return <div className="seasonal-entry" key={entry.id}><AttractionCard attraction={attraction} saved={savedIds.includes(entry.id)} onToggleSaved={onToggleSaved} /><div className="seasonal-context"><p>{entry.note}</p><a href={entry.sourceUrl} target="_blank" rel="noreferrer">Why this season ↗</a></div></div>;
    })}</div>
    <p className="seasonal-caveat">Photos may show another time of year. Water levels, weather and access change; check local conditions before planning a visit.</p>
  </section>;
}
