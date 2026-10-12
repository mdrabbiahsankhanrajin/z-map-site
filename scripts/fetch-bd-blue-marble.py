"""Bundle NASA Blue Marble Next Generation tiles for the Bangladesh explorer.

Run: python scripts/fetch-bd-blue-marble.py [--check]
Source: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/
Imagery: NASA Earth Observatory, 2004 monthly composite (static Blue Marble layer).
WMTS uses z/y/x; local MapLibre tiles use z/x/y. These are build-time downloads only.
"""

import concurrent.futures
import math
import sys
import urllib.request
from pathlib import Path


WEST, SOUTH, EAST, NORTH = 60, 0, 112, 42
OUT = Path("public/data/bd-blue-marble")
BASE = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8"


def x_at(lon, zoom):
    return math.floor((lon + 180) / 360 * (1 << zoom))


def y_at(lat, zoom):
    return math.floor((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * (1 << zoom))


def fetch(tile):
    z, x, y = tile
    path = OUT / str(z) / str(x) / f"{y}.jpeg"
    if path.exists() and path.stat().st_size > 100:
        return path.stat().st_size
    url = f"{BASE}/{z}/{y}/{x}.jpeg"
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                data = response.read()
            if not data.startswith(b"\xff\xd8\xff"):
                raise ValueError(f"Unexpected tile format: {url}")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            return len(data)
        except Exception:
            if attempt == 2:
                raise


tiles = [
    (z, x, y)
    for z in range(5, 8)
    for x in range(x_at(WEST, z), x_at(EAST, z) + 1)
    for y in range(y_at(NORTH, z), y_at(SOUTH, z) + 1)
]
if "--check" in sys.argv:
    missing = [tile for tile in tiles if not (OUT / str(tile[0]) / str(tile[1]) / f"{tile[2]}.jpeg").exists()]
    if missing:
        raise SystemExit(f"Missing {len(missing)} Blue Marble tiles")
    print(f"Blue Marble cache: {len(tiles)} tiles present")
    raise SystemExit(0)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    sizes = list(pool.map(fetch, tiles))
print(f"Cached {len(tiles)} Blue Marble tiles ({sum(sizes) / 1024 / 1024:.1f} MiB)")
