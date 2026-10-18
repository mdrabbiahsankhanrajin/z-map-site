"use client";

import Image from "next/image";
import { useState } from "react";
import variants from "@/data/photoVariants.json";
import { publicPath } from "@/lib/publicPath";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  eager?: boolean;
};
const photos: Record<string, { src: string; width: number; height: number }[]> = variants;

export function PlacePhoto(props: Props) {
  // A newly selected place gets its own image state, including after a failure.
  return <Photo key={props.src} {...props} />;
}

function Photo({ src, alt, sizes, eager = false }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="place-photo-unavailable" role="img" aria-label={`Photo unavailable: ${alt}`}>
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="2"/><circle cx="12" cy="12" r="2"/><path d="m5 24 8-8 5 5 4-4 5 5"/></svg>
    <strong>Photo unavailable</strong><span>The place details and photo source are still available below.</span>
  </span>;
  const available = photos[src];
  const largest = available?.[available.length - 1];
  return <picture className="place-photo-picture">
    {available && <source type="image/webp" srcSet={available.filter((image, index) => index === 0 || image.width !== available[index - 1].width).map((image) => `${publicPath(image.src as `/${string}`)} ${image.width}w`).join(", ")} sizes={sizes} />}
    <Image src={publicPath(src as `/${string}`)} alt={alt} width={largest?.width ?? 800} height={largest?.height ?? 600}
      unoptimized loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />
  </picture>;
}
