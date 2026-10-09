import Image from "next/image";

export function GeoSilhouette({ name, path, src, source }: { name: string; path?: string; src?: string; source: string }) {
  if (!path && !src) return null;
  return <figure className="geo-silhouette">
    {src ? <Image src={src} alt={`Simplified outline of ${name}`} width={320} height={190} loading="eager" unoptimized /> : <svg viewBox="0 0 320 190" role="img" aria-label={`Simplified outline of ${name}`} preserveAspectRatio="xMidYMid meet"><path d={path} fillRule="evenodd" /></svg>}
    <figcaption>{source} outline</figcaption>
  </figure>;
}
