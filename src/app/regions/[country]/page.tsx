import { notFound } from "next/navigation";
import admin1Counts from "@/data/admin1-counts.json";
import { worldPlaces } from "@/data/worldPlaces";
import { RegionExplorer } from "@/features/regions/RegionExplorer";

const counts: Record<string, number> = admin1Counts;

export function generateStaticParams() {
  return Object.keys(counts).map((country) => ({ country }));
}

export const dynamicParams = false;

export default async function RegionsPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: id } = await params;
  const country = worldPlaces.find((place) => place.id === id);
  if (!country || !counts[id]) notFound();
  return <RegionExplorer country={country} />;
}
