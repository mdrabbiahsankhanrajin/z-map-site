import { TravelHeader } from "@/components/TravelHeader";
import { PlacePhoto } from "@/components/PlacePhoto";
import { attractions } from "@/data/attractions";
import { DiscoverExplorer } from "@/features/discovery/DiscoverExplorer";

export default function DiscoverPage() {
  const hero = attractions.find((item) => item.id === "ratargul-swamp") ?? attractions[0];
  return <main className="atlas-content-page discovery-page">
    <TravelHeader active="places" />
    <section className="content-intro discovery-hero"><div className="discovery-hero-copy"><p className="content-locale">A field guide to Bangladesh</p><h1>Places of Bangladesh</h1><p>Browse photographed places by district or season. Save the ones you want to see, then bring your shortlist into a trip.</p></div><figure><PlacePhoto src={hero.image.src} alt={hero.image.alt} sizes="(max-width: 800px) 100vw, 46vw" eager /><figcaption>{hero.title} · Photo: <a href={hero.image.sourceUrl} target="_blank" rel="noreferrer">{hero.image.author}</a> · <a href={hero.image.licenseUrl} target="_blank" rel="noreferrer">{hero.image.license}</a></figcaption></figure></section>
    <DiscoverExplorer />
    <p className="content-footnote">Photographs are credited on each place. Check current travel conditions before going.</p>
  </main>;
}
