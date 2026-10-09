import { worldPlaces } from "@/data/worldPlaces";
import { ExplorerShell } from "@/features/explorer/ExplorerShell";

export default function HomePage() {
  return <ExplorerShell scope="world" places={worldPlaces} />;
}
