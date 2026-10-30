import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geoArea, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";

const root = process.cwd();
const source = JSON.parse(await readFile(path.join(root, "public/data/world-display.geojson"), "utf8"));
const output = path.join(root, "public/data/insights-atlas");
const continentNames = ["Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"];

function ringsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates.slice(0, 1);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.map((polygon) => polygon[0]);
  return [];
}

function distanceToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

function simplify(points, tolerance = 0.22) {
  if (points.length <= 4) return points;
  let farthest = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = distanceToSegment(points[i], points[0], points.at(-1));
    if (distance > farthest) {
      farthest = distance;
      index = i;
    }
  }
  if (farthest <= tolerance) return [points[0], points.at(-1)];
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)];
}

function simplifyRing(ring, tolerance = 0.1) {
  const first = ring[0];
  const last = ring.at(-1);
  const isClosed = first && last && first[0] === last[0] && first[1] === last[1];
  const openRing = isClosed ? ring.slice(0, -1) : ring;
  const reduced = simplify(openRing, tolerance);
  if (reduced.length < 3) return ring;
  return [...reduced, reduced[0]];
}

function simplifyPolygon(polygon) {
  const coordinates = polygon.map((ring) => simplifyRing(ring));
  return geoArea({ type: "Polygon", coordinates }) > Math.PI * 2
    ? coordinates.map((ring) => [...ring].reverse())
    : coordinates;
}

function simplifyFeature(feature) {
  const geometry = feature.geometry?.type === "Polygon"
    ? { type: "Polygon", coordinates: simplifyPolygon(feature.geometry.coordinates) }
    : feature.geometry?.type === "MultiPolygon"
      ? { type: "MultiPolygon", coordinates: feature.geometry.coordinates.map(simplifyPolygon) }
      : feature.geometry;
  return { type: "Feature", properties: { id: feature.properties?.id }, geometry };
}

function adjustedLongitude(longitude, name) {
  if (name === "Oceania" && longitude < 80) return longitude + 360;
  if (name === "North America" && longitude > 0) return longitude - 360;
  return longitude;
}

function buildSvg(name, features) {
  const rings = features.flatMap((feature) => ringsOf(feature.geometry)).map((ring) => simplify(ring.map(([longitude, latitude]) => [adjustedLongitude(longitude, name), -latitude]))).filter((ring) => ring.length >= 3);
  const points = rings.flat();
  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));
  const width = 320;
  const height = 190;
  const padding = 8;
  const scale = Math.min((width - padding * 2) / Math.max(1, maxX - minX), (height - padding * 2) / Math.max(1, maxY - minY));
  const offsetX = (width - (maxX - minX) * scale) / 2;
  const offsetY = (height - (maxY - minY) * scale) / 2;
  const paths = rings.map((ring) => {
    const commands = ring.map(([x, y], index) => `${index ? "L" : "M"}${((x - minX) * scale + offsetX).toFixed(2)} ${((y - minY) * scale + offsetY).toFixed(2)}`).join(" ");
    return `<path d="${commands} Z"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img"><g fill="#91a18d" stroke="#f7f1e3" stroke-width="0.65" stroke-linejoin="round" vector-effect="non-scaling-stroke">${paths}</g></svg>`;
}

function buildGlobeSvg(features) {
  const size = 640;
  const projection = geoOrthographic()
    .rotate([25, -15])
    .translate([size / 2, size / 2])
    .scale(302)
    .clipAngle(90)
    .precision(0.7);
  const renderPath = geoPath(projection);
  const sphere = renderPath({ type: "Sphere" });
  const graticule = renderPath(geoGraticule10());
  const land = features
    .map((feature) => renderPath(feature))
    .filter(Boolean)
    .map((data) => `<path d="${data}"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img"><path d="${sphere}" fill="#f4f0e4"/><path d="${graticule}" fill="none" stroke="#6d8778" stroke-width="0.8" opacity="0.28"/><g fill="#91a18d" stroke="#f7f1e3" stroke-width="1.05" stroke-linejoin="round">${land}</g><path d="${sphere}" fill="none" stroke="#345b4b" stroke-width="1.4" opacity="0.72"/></svg>`;
}

await mkdir(output, { recursive: true });
const globeFeatures = source.features.map(simplifyFeature);
const targets = ["World", ...continentNames, "Other areas"];
for (const name of targets) {
  const features = name === "World"
    ? source.features
    : name === "Other areas"
      ? source.features.filter((feature) => !continentNames.includes(feature.properties?.continent))
      : source.features.filter(
          (feature) =>
            feature.properties?.continent === name &&
            !(name === "Europe" && feature.properties?.id === "RUS"),
        );
  const slug = name.toLowerCase().replaceAll(" ", "-");
  await writeFile(path.join(output, `${slug}.svg`), buildSvg(name, features));
}
await writeFile(path.join(output, "world-globe.svg"), buildGlobeSvg(globeFeatures));
await writeFile(path.join(output, "world-globe-data.geojson"), JSON.stringify({ type: "FeatureCollection", features: globeFeatures }));
