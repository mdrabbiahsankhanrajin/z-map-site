import Image from "next/image";
import Link from "next/link";
import type { Attraction } from "@/data/attractions";
import { publicPath } from "@/lib/publicPath";

export function AttractionCard({ attraction, showPlanLink = true }: { attraction: Attraction; showPlanLink?: boolean }) {
  const { image } = attraction;
  return <article className="attraction-card">
    <div className="attraction-photo"><Image src={publicPath(image.src)} alt={image.alt} width={800} height={600} unoptimized loading="lazy" /></div>
    <div className="attraction-body">
      <p className="attraction-location">{attraction.district} · {attraction.category}</p>
      <h2>{attraction.title}</h2>
      <p>{attraction.summary}</p>
      <div className="attraction-actions">
        {showPlanLink && <Link href={`/planner?add=${attraction.id}`}>Add to trip <span aria-hidden="true">→</span></Link>}
        <a href={attraction.sourceUrl} target="_blank" rel="noreferrer">Place source ↗</a>
      </div>
      <p className="photo-credit">Photo: <a href={image.sourceUrl} target="_blank" rel="noreferrer">{image.author}</a> · <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a></p>
    </div>
  </article>;
}
