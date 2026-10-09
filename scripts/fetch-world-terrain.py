"""Cache CC0 Natural Earth physical tiles for the offline world atlas.

Run: python scripts/fetch-world-terrain.py
Source: https://maps.black/styles/raster/naturalearth/NE1_HR_LC_SR_W_DR-WEBP/style.json
License: https://maps.black/styles/raster/naturalearth/NE1_HR_LC_SR_W_DR-WEBP/LICENSE.txt
"""

import concurrent.futures
import sys
import urllib.request
from pathlib import Path


OUT = Path("public/data/world-terrain")
BASE = "https://v1.maps.black/naturalearth-NE1_HR_LC_SR_W_DR-WEBP"
TILES = [(z, x, y) for z in range(5) for x in range(1 << z) for y in range(1 << z)]


def fetch(tile):
    z, x, y = tile
    path = OUT / str(z) / str(x) / f"{y}.webp"
    if path.exists() and path.stat().st_size > 100:
        return path.stat().st_size
    url = f"{BASE}/{z}/{x}/{y}.webp"
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=30) as response:
                data = response.read()
            if not data.startswith(b"RIFF") or data[8:12] != b"WEBP":
                raise ValueError(f"Unexpected tile format: {url}")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            return len(data)
        except Exception:
            if attempt == 2:
                raise


if "--check" in sys.argv:
    missing = [tile for tile in TILES if not (OUT / str(tile[0]) / str(tile[1]) / f"{tile[2]}.webp").exists()]
    if missing:
        raise SystemExit(f"Missing {len(missing)} world terrain tiles")
    print(f"World terrain cache: {len(TILES)} tiles present")
    raise SystemExit(0)

with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    sizes = list(pool.map(fetch, TILES))
print(f"Cached {len(TILES)} Natural Earth tiles ({sum(sizes) / 1024 / 1024:.1f} MiB)")
