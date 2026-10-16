import Image from "next/image";
import Link from "next/link";
import type { Attraction } from "@/data/attractions";
import { districtDisplayName } from "@/data/districtNames";
import { publicPath } from "@/lib/publicPath";

export function AttractionCard({ attraction, saved, onToggleSaved }: { attraction: Attraction; saved: boolean; onToggleSaved: (id: string) => void }) {
  const { image } = attraction;
  return <article className="attraction-card">
    <div className="attraction-photo"><Image src={publicPath(image.src)} alt={image.alt} width={800} height={600} unoptimized loading="lazy" /><button className={`save-place${saved ? " is-saved" : ""}`} type="button" aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${attraction.title} ${saved ? "from" : "to"} saved places`} onClick={() => onToggleSaved(attraction.id)}>{saved ? "✓ Saved" : "+ Save"}</button></div>
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
