"use client";

import { PlacePhoto } from "@/components/PlacePhoto";
import Link from "next/link";
import { featuredRegionForCountry, regionNotes } from "@/data/regionNotes";

export function WorldPlaceCard({ regionId, countryId }: { regionId?: string; countryId?: string }) {
  const resolvedId = regionId ?? (countryId ? featuredRegionForCountry(countryId) : undefined);
  const note = resolvedId ? regionNotes[resolvedId] : undefined;
  if (!note) return null;
  const image = note.image;
  return <section className="world-place-card" aria-label={`Photographed place: ${note.title}`}>
    <div className="world-place-photo"><PlacePhoto src={image.src} alt={image.alt} sizes="(max-width: 1060px) calc(100vw - 44px), 310px" /></div>
    <div className="world-place-copy">
      <p className="eyebrow">From the atlas · photographed place</p>
      <h3>{note.title}</h3><p>{note.summary}</p>
      <div className="world-place-links">
        {countryId && resolvedId && <Link href={`/regions/${countryId}?region=${encodeURIComponent(resolvedId)}`}>Find its region →</Link>}
        <a href={note.sourceUrl} target="_blank" rel="noreferrer">Place source: {note.sourceLabel} ↗</a>
      </div>
      <small>Photo: <a href={image.sourceUrl} target="_blank" rel="noreferrer">{image.author}</a> · <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a> · resized for Atlas</small>
    </div>
  </section>;
}
