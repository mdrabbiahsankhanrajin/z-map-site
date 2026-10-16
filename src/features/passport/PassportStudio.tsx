"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import districts from "@/data/districts.json";
import { districtDisplayName } from "@/data/districtNames";
import { resolveWorldPlaceId, worldPlaces } from "@/data/worldPlaces";
import { TravelHeader } from "@/components/TravelHeader";
import { parseSavedSelection } from "@/features/explorer/state";
import { createPassport, paginatePassport, renderPassportCover } from "./passport";

export function PassportStudio() {
  const [worldIds, setWorldIds] = useState<string[]>([]);
  const [districtIds, setDistrictIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [includeWorld, setIncludeWorld] = useState(true);
  const [includeDistricts, setIncludeDistricts] = useState(true);
  const [featuredDistrictId, setFeaturedDistrictId] = useState("");
  const [loadedPhoto, setLoadedPhoto] = useState<{ src: string; dataUrl?: string; failed?: boolean }>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setWorldIds(parseSavedSelection(localStorage.getItem("atlas:selection:world:v1"), worldPlaces, resolveWorldPlaceId));
        setDistrictIds(parseSavedSelection(localStorage.getItem("atlas:selection:districts:v1"), districts));
      } catch { /* A private empty passport remains available. */ }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const markedDistricts = districts.filter((district) => districtIds.includes(district.id)).sort((a, b) => districtDisplayName(a.name).localeCompare(districtDisplayName(b.name), "en"));
  const data = useMemo(() => createPassport(includeWorld ? worldIds : [], includeDistricts ? districtIds : [], name, featuredDistrictId), [worldIds, districtIds, includeWorld, includeDistricts, name, featuredDistrictId]);
  const hasVisits = data.world.length + data.districts.length > 0;
  const placeCount = data.world.length + data.districts.length;
  const photoSrc = data.photo?.src;
  const photoDataUrl = loadedPhoto?.src === photoSrc ? loadedPhoto?.dataUrl : undefined;
  const photoLoading = Boolean(photoSrc && loadedPhoto?.src !== photoSrc);
  const photoFailed = Boolean(photoSrc && loadedPhoto?.src === photoSrc && loadedPhoto?.failed);

  useEffect(() => {
    if (!photoSrc) return;
    let cancelled = false;
      void import("./exportPassport").then(({ loadPassportPhoto }) => loadPassportPhoto(photoSrc)).then((url) => {
        if (!cancelled) setLoadedPhoto({ src: photoSrc, dataUrl: url });
      }).catch(() => {
        if (!cancelled) setLoadedPhoto({ src: photoSrc, failed: true });
      });
    return () => { cancelled = true; };
  }, [photoSrc]);

  const cover = useMemo(() => renderPassportCover(data, photoDataUrl), [data, photoDataUrl]);
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([cover], { type: "image/svg+xml;charset=utf-8" }));
    const frame = requestAnimationFrame(() => setPreviewUrl(url));
    return () => { cancelAnimationFrame(frame); URL.revokeObjectURL(url); };
  }, [cover]);

  async function exportFile(format: "png" | "pdf") {
    if (!hasVisits || busy || photoLoading) return;
    setBusy(format);
    setStatus("");
    try {
      const { createPassportPng, createPassportPdf, downloadPassport } = await import("./exportPassport");
      const blob = format === "png" ? await createPassportPng(data, photoDataUrl) : await createPassportPdf(data, photoDataUrl);
      downloadPassport(blob, `atlas-passport.${format}`);
      setStatus(format === "png" ? "PNG cover downloaded." : `PDF passport downloaded with ${paginatePassport(data).length + 1} pages.`);
    } catch {
      setStatus("The download could not be created in this browser. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return <main className="atlas-content-page passport-page">
    <TravelHeader active="insights" />
    <section className="passport-intro"><p className="content-locale">Your visited places · your own record</p><h1>Make a passport<br />of your atlas.</h1><p>Turn the places you marked visited into a keepsake. The design and downloads are made on this device.</p></section>
    <div className="passport-studio">
      <section className="passport-controls" aria-label="Passport options">
        <div className="passport-control-head"><span>01 / Compose</span><h2>What goes inside</h2></div>
        {!ready ? <p role="status">Reading your marked places…</p> : <>
          <label className="passport-check"><input type="checkbox" checked={includeWorld} onChange={(event) => setIncludeWorld(event.target.checked)} /><span>World places <small>{worldIds.length} marked visited</small></span></label>
          <label className="passport-check"><input type="checkbox" checked={includeDistricts} onChange={(event) => setIncludeDistricts(event.target.checked)} /><span>Bangladesh districts <small>{districtIds.length} marked visited</small></span></label>
          <label className="passport-field" htmlFor="passport-name">Name on the cover <small>optional · not saved</small></label><input id="passport-name" type="text" value={name} maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Your name or a title" />
          {includeDistricts && markedDistricts.length > 0 && <><label className="passport-field" htmlFor="passport-photo">Cover photograph <small>from a visited district</small></label><select id="passport-photo" value={featuredDistrictId} onChange={(event) => setFeaturedDistrictId(event.target.value)}><option value="">First visited district</option>{markedDistricts.map((district) => <option key={district.id} value={district.id}>{districtDisplayName(district.name)}</option>)}</select></>}
          <p className="passport-private">Only marked countries and districts appear. Trip stops, visit dates and location traces stay out.</p>
          {!hasVisits && <p className="passport-no-visits">No visited places selected yet. <Link href="/bd">Mark a district on the map →</Link></p>}
          <div className="passport-downloads"><span>02 / Take it with you</span><button type="button" disabled={!hasVisits || Boolean(busy) || photoLoading} onClick={() => void exportFile("png")}>{busy === "png" ? "Creating PNG…" : "Download PNG cover"}<span aria-hidden="true">↓</span></button><button type="button" disabled={!hasVisits || Boolean(busy) || photoLoading} onClick={() => void exportFile("pdf")}>{busy === "pdf" ? "Creating PDF…" : "Download full PDF"}<span aria-hidden="true">↓</span></button><p>The PNG is a shareable cover. The PDF includes every visited place across as many pages as needed.</p>{photoFailed && <p>The cover photo could not load. Exports will use the illustrated cover.</p>}<p className="passport-status" role="status">{status}</p></div>
        </>}
      </section>
      <section className="passport-preview" aria-label="Passport cover preview"><div className="passport-preview-heading"><span>Live preview</span><span>{placeCount} {placeCount === 1 ? "place" : "places"} · {paginatePassport(data).length + 1} PDF {paginatePassport(data).length === 0 ? "page" : "pages"}</span></div>{previewUrl && <Image src={previewUrl} alt={`Atlas passport cover with ${data.world.length} visited world ${data.world.length === 1 ? "place" : "places"} and ${data.districts.length} visited Bangladesh ${data.districts.length === 1 ? "district" : "districts"}`} width={900} height={1260} unoptimized />}<p>Photo credits are printed on the cover when a district photo is used.</p></section>
    </div>
    <p className="passport-back"><Link href="/insights">← Back to your atlas in numbers</Link></p>
  </main>;
}
