import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Map credits · Atlas" };

export default function CreditsPage() {
  return <main className="atlas-content-page">
    <header className="content-topbar"><Link href="/bd">← ATLAS</Link><nav aria-label="Back to map"><Link href="/">World</Link><Link href="/bd">Bangladesh</Link></nav></header>
    <article className="credits-content">
      <p className="content-locale">Behind the map</p>
      <h1>Map credits</h1>
      <p>Atlas uses locally bundled geography and terrain. The map is for exploration, not navigation or a statement of sovereignty.</p>
      <section><h2>Bangladesh districts</h2><p>District boundaries from <a href="https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/">geoBoundaries BGD ADM2</a> (source: Bangladesh Bureau of Statistics / OCHA, 2020), licensed <a href="https://creativecommons.org/licenses/by/3.0/igo/">CC BY 3.0 IGO</a>. Atlas simplifies the geometry for display while retaining source IDs. Some displayed English names are reviewed separately against BBS publications.</p></section>
      <section><h2>World and regions</h2><p>Country, region, and river geography from <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a>, public domain. The World map aligns Bangladesh and its neighboring borders to the district boundary above. Atlas simplifies and groups some features for display.</p></section>
      <section><h2>Terrain</h2><p>Bangladesh close zoom also uses locally bundled <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/">NASA Blue Marble Next Generation</a> 2004 composite imagery. Overview terrain tiles use <a href="https://www.naturalearthdata.com/downloads/10m-natural-earth-1/">Natural Earth I</a> imagery converted to WebP by <a href="https://maps.black/styles/raster/naturalearth/NE1_HR_LC_SR_W_DR-WEBP/LICENSE.txt">maps.black</a> under CC0.</p></section>
      <section><h2>Place photographs</h2><p>District photographs come from Wikimedia Commons. Each place card links to its original photograph, creator, and license. New district thumbnails were resized and recompressed for web use. Place names link to their individual guide or source page.</p></section>
      <p className="credits-end"><Link href="/bd">Return to the map →</Link></p>
    </article>
  </main>;
}
