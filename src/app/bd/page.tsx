import districts from "@/data/districts.json";
import { withDistrictDisplayNames } from "@/data/districtNames";
import { ExplorerShell } from "@/features/explorer/ExplorerShell";

export default function BangladeshPage() {
  return <ExplorerShell scope="districts" places={withDistrictDisplayNames(districts)} />;
}
