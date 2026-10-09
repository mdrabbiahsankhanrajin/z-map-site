import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

if (process.env.GITHUB_PAGES === "true") {
  const root = path.join(process.cwd(), "out");
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "/z-map-site";

  async function filesUnder(directory) {
    const entries = await readdir(path.join(root, directory), { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
      const relative = path.posix.join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(relative) : [relative];
    }));
    return nested.flat();
  }

  const core = [
    "index.html", "index.txt", "bd/index.html", "bd/index.txt", "share/index.html", "share/index.txt",
    "data/world.geojson", "data/bd-districts.geojson", "data/bd-context.geojson",
    "data/bd-rivers.geojson", "data/palestine-outline.geojson",
    "maplibre/maplibre-gl-worker.mjs", "maplibre/maplibre-gl-shared.mjs",
    "textures/atlas-paper.webp", "illustrations/bd-water-lily.webp",
    ...await filesUnder("_next/static"),
    // Keep the overview maps available offline without downloading every deep-zoom tile
    // during installation. Tiles outside these zooms are cached when explored.
    ...await Promise.all([0, 1, 2, 3].map((zoom) => filesUnder(`data/world-terrain/${zoom}`))).then((groups) => groups.flat()),
    ...await Promise.all([3, 4, 5].map((zoom) => filesUnder(`data/bd-terrain-hi/${zoom}`))).then((groups) => groups.flat()),
  ];
  for (const file of core) {
    if (!(await stat(path.join(root, file))).isFile()) throw new Error(`Missing offline asset: ${file}`);
  }

  const digest = createHash("sha256");
  digest.update(await readFile(new URL(import.meta.url)));
  for (const file of core) digest.update(await readFile(path.join(root, file)));
  const cacheName = `atlas-core-${digest.digest("hex").slice(0, 12)}`;
  const urls = core.map((file) => `${base}/${file === "index.html" ? "" : file === "bd/index.html" ? "bd/" : file === "share/index.html" ? "share/" : file}`);

  const worker = `const CACHE = ${JSON.stringify(cacheName)};
const SCOPE = new URL('.', self.location.href).pathname;
const CORE = ${JSON.stringify(urls)};
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (let i = 0; i < CORE.length; i += 16) {
      await Promise.all(CORE.slice(i, i + 16).map(async (url) => {
        const response = await fetch(url, { cache: 'reload' });
        if (!response.ok) throw new Error('Offline asset unavailable: ' + url);
        await cache.put(url, response);
      }));
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('atlas-core-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) || (await cache.match(SCOPE)) || Response.error();
      }
    }
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch {
      const route = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
      const payload = await cache.match(url.origin + route + 'index.txt');
      if (payload) return payload;
      return Response.error();
    }
  })());
});
`;
  await writeFile(path.join(root, "sw.js"), worker);
  console.log(`Offline core: ${core.length} local assets; cache ${cacheName}`);
}
