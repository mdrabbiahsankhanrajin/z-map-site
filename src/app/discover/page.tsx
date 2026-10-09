import { attractions } from "@/data/attractions";
import { AttractionCard } from "@/features/discovery/AttractionCard";
import { TravelHeader } from "@/components/TravelHeader";

export default function DiscoverPage() {
  return <main className="atlas-content-page">
    <TravelHeader active="places" />
    <section className="content-intro"><p className="content-locale">Bangladesh · curated places</p><h1>Places worth a closer look</h1><p>Real photographs and short notes from named sources. This is a small growing collection, not a complete guide to all 64 districts.</p></section>
    <div className="attraction-grid">{attractions.map((attraction) => <AttractionCard key={attraction.id} attraction={attraction} />)}</div>
    <p className="content-footnote">Travel conditions, opening hours and prices change. Check the linked source before going.</p>
  </main>;
}
