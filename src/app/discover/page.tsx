import { TravelHeader } from "@/components/TravelHeader";
import { DiscoverExplorer } from "@/features/discovery/DiscoverExplorer";

export default function DiscoverPage() {
  return <main className="atlas-content-page discovery-page">
    <TravelHeader active="places" />
    <section className="content-intro"><h1>Places of Bangladesh</h1><p>Browse photographed places by district or season. Save the ones you want to see, then bring your shortlist into a trip.</p></section>
    <DiscoverExplorer />
    <p className="content-footnote">Photographs are credited on each place. Check current travel conditions before going.</p>
  </main>;
}
