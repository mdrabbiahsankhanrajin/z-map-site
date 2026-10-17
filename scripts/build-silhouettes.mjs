import fs from "node:fs";
import { geoSilhouette } from "../src/lib/geoSilhouette.ts";

const check = process.argv.includes("--check");
let mismatches = 0;
for (const [scope, input] of [["world", "public/data/world-display.geojson"], ["districts", "public/data/bd-districts.geojson"]]) {
  const data = JSON.parse(fs.readFileSync(input, "utf8"));
  const grouped = new Map();
  for (const feature of data.features) {
    const id = scope === "world" && feature.properties.id === "ISR" ? "PSX" : feature.properties.id;
    grouped.set(id, [...(grouped.get(id) ?? []), feature.geometry]);
  }
  const output = `public/data/silhouettes/${scope}`;
  if (!check) fs.mkdirSync(output, { recursive: true });
  let bytes = 0;
  for (const [id, geometries] of grouped) {
    const path = geoSilhouette(geometries);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 190"><path d="${path}" fill="#c48650" stroke="#815437" stroke-width="1.25" fill-rule="evenodd" vector-effect="non-scaling-stroke"/></svg>`;
    const filename = `${output}/${id}.svg`;
    if (check) {
      if (!fs.existsSync(filename) || fs.readFileSync(filename, "utf8") !== svg) mismatches++;
    } else fs.writeFileSync(filename, svg);
    bytes += Buffer.byteLength(svg);
  }
  if (check && (!fs.existsSync(output) || fs.readdirSync(output).filter((name) => name.endsWith(".svg")).length !== grouped.size)) mismatches++;
  console.log(`${scope}: ${grouped.size} outlines, ${bytes} bytes total`);
}
if (check && mismatches) {
  console.error(`${mismatches} silhouette assets differ; run node scripts/build-silhouettes.mjs`);
  process.exitCode = 1;
}
