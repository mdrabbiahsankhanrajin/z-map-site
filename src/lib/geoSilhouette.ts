export type OutlineGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

const width = 320;
const height = 190;
const padding = 15;

/** A simplified, non-navigational outline for a detail-panel thumbnail. */
export function geoSilhouette(geometries: OutlineGeometry[]): string {
  const rings = geometries.flatMap((geometry) => geometry.type === "Polygon"
    ? geometry.coordinates
    : geometry.coordinates.flat());
  const points = rings.flat();
  if (points.length < 3) return "";

  let west = Infinity; let east = -Infinity; let south = Infinity; let north = -Infinity;
  let wrappedWest = Infinity; let wrappedEast = -Infinity;
  for (const [longitude, latitude] of points) {
    west = Math.min(west, longitude); east = Math.max(east, longitude);
    south = Math.min(south, latitude); north = Math.max(north, latitude);
    const wrapped = longitude < 0 ? longitude + 360 : longitude;
    wrappedWest = Math.min(wrappedWest, wrapped); wrappedEast = Math.max(wrappedEast, wrapped);
  }
  const wrap = east - west > 180 && wrappedEast - wrappedWest < east - west;
  const latitudeScale = Math.max(0.3, Math.cos((south + north) / 2 * Math.PI / 180));
  const xOf = (longitude: number) => (wrap && longitude < 0 ? longitude + 360 : longitude) * latitudeScale;
  let minX = Infinity; let maxX = -Infinity;
  for (const [longitude] of points) { const x = xOf(longitude); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
  const spanX = Math.max(maxX - minX, 0.0001);
  const spanY = Math.max(north - south, 0.0001);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offsetX = (width - spanX * scale) / 2;
  const offsetY = (height - spanY * scale) / 2;
  const stride = Math.max(1, Math.ceil(points.length / 320));

  return rings.map((ring) => {
    if (ring.length < 3) return "";
    const sampled = ring.length <= 16 || stride === 1
      ? ring
      : ring.filter((_, index) => index % stride === 0 || index === ring.length - 1);
    const commands: string[] = [];
    let last = "";
    for (const [longitude, latitude] of sampled) {
      const x = (offsetX + (xOf(longitude) - minX) * scale).toFixed(1);
      const y = (offsetY + (north - latitude) * scale).toFixed(1);
      const point = `${x} ${y}`;
      if (point === last) continue;
      commands.push(`${commands.length ? "L" : "M"}${point}`);
      last = point;
    }
    return commands.length >= 3 ? `${commands.join("")}Z` : "";
  }).join("");
}
