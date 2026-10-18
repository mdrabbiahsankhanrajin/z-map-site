import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Run only when adding/replacing credited originals. No remote downloads,
// cropping, or changes to the original files or attribution records.
const manifest = {};
for (const collection of ["attractions", "world"]) {
  const directory = path.join("public/images", collection);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".jpg")).sort();
  await mkdir(path.join(directory, "responsive"), { recursive: true });
  for (const file of files) {
    const variants = [];
    const original = path.join(directory, file);
    const originalBytes = (await stat(original)).size;
    for (const width of [480, 960]) {
      const src = `/images/${collection}/responsive/${file.replace(/\.jpg$/, "")}-${width}.webp`;
      let result;
      for (const quality of [82, 76, 70]) {
        result = await sharp(original).rotate().resize({ width, withoutEnlargement: true })
          .webp({ quality, effort: 4 }).toFile(path.join("public", src));
        if (result.size < originalBytes) break;
      }
      variants.push({ src, width: result.width, height: result.height });
    }
    manifest[`/images/${collection}/${file}`] = variants;
  }
}
await writeFile("src/data/photoVariants.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`Generated responsive variants for ${Object.keys(manifest).length} original photos.`);
