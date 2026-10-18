import { PlacePhoto } from "@/components/PlacePhoto";
import Link from "next/link";
import type { Attraction } from "@/data/attractions";
import { districtDisplayName } from "@/data/districtNames";

export function AttractionCard({ attraction, saved, onToggleSaved, eager = false }: { attraction: Attraction; saved: boolean; onToggleSaved: (id: string) => void; eager?: boolean }) {
  const { image } = attraction;
  return <article className="attraction-card">
    <div className="attraction-photo"><PlacePhoto src={image.src} alt={image.alt} eager={eager} sizes="(max-width: 580px) calc(100vw - 40px), (max-width: 800px) 540px, (max-width: 1160px) calc((100vw - 376px) / 2), 392px" /><button className={`save-place${saved ? " is-saved" : ""}`} type="button" aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${attraction.title} ${saved ? "from" : "to"} saved places`} onClick={() => onToggleSaved(attraction.id)}>{saved ? "✓ Saved" : "+ Save"}</button></div>
    <div className="attraction-body">
      <p className="attraction-location">{districtDisplayName(attraction.district)}{attraction.category === "Place" ? "" : ` · ${attraction.category}`}</p>
      <h2>{attraction.title}</h2>
      {attraction.summary && <p>{attraction.summary}</p>}
      <div className="attraction-actions">
        <Link href={`/planner?add=${attraction.id}`}>Add to trip <span aria-hidden="true">→</span></Link>
        <a href={attraction.sourceUrl} target="_blank" rel="noreferrer">Place source ↗</a>
      </div>
      <p className="photo-credit">Photo: <a href={image.sourceUrl} target="_blank" rel="noreferrer">{image.author}</a> · <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>{image.note && <> · {image.note}</>}</p>
    </div>
  </article>;
}
