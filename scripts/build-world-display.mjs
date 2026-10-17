import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = resolve("public/data/world.geojson");
const contextPath = resolve("public/data/bd-context-display.geojson");
const outlinePath = resolve("public/data/bd-outline.geojson");
const targetPath = resolve("public/data/world-display.geojson");
const [world, context, outline] = await Promise.all([sourcePath, contextPath, outlinePath].map(async (file) => JSON.parse(await readFile(file, "utf8"))));

const contextById = new Map(context.features.map((feature) => [feature.properties?.id, feature]));
const sourceIds = new Set(world.features.map((feature) => feature.properties?.id));
if (contextById.size !== 6 || [...contextById.keys()].some((id) => !sourceIds.has(id))) throw new Error("Unexpected Bangladesh context IDs");
if (JSON.stringify(contextById.get("BGD")?.geometry) !== JSON.stringify(outline.features[0]?.geometry)) throw new Error("Bangladesh context and district outline disagree");
const alignedIds = new Set(["BGD", "IND", "MMR"]);

const display = {
  type: "FeatureCollection",
  features: world.features.map((feature) => ({
    ...feature,
    geometry: alignedIds.has(feature.properties.id) ? contextById.get(feature.properties.id).geometry : feature.geometry,
  })),
};
const output = `${JSON.stringify(display)}\n`;
if (process.argv.includes("--check")) {
  if (await readFile(targetPath, "utf8") !== output) throw new Error("World display geometry is stale; run node scripts/build-world-display.mjs");
} else {
  await writeFile(targetPath, output);
}
console.log(`World display: ${display.features.length} places, ${alignedIds.size} aligned border geometries`);
