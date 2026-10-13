import { TravelHeader } from "@/components/TravelHeader";
import { DiscoverExplorer } from "@/features/discovery/DiscoverExplorer";

export default function DiscoverPage() {
  return <main className="atlas-content-page discovery-page">
    <TravelHeader active="places" />
    <section className="content-intro"><h1>Places of Bangladesh</h1><p>Explore photographed places across all 64 districts. Search by district or place, then add a stop to your trip.</p></section>
    <DiscoverExplorer />
    <p className="content-footnote">Photographs are credited on each place. Check current travel conditions before going.</p>
  </main>;
}
