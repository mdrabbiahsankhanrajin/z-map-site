"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolveWorldPlaceId, worldPlaces } from "@/data/worldPlaces";
import districts from "@/data/districts.json";
import { parseSavedSelection } from "@/features/explorer/state";
import { ProfileCard } from "./ProfileCard";
import { createPublicProfile, encodePublicProfile } from "./profile";
import { publicPath } from "@/lib/publicPath";

const known = { world: worldPlaces.map((place) => place.id), districts: districts.map((place) => place.id) };

export function ProfileComposer({ scope, selected, onClose }: {
  scope: "world" | "districts";
  selected: string[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [otherSelected, setOtherSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [includeName, setIncludeName] = useState(false);
  const [includeWorld, setIncludeWorld] = useState(false);
  const [includeDistricts, setIncludeDistricts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const frame = requestAnimationFrame(() => {
      try {
        const other = scope === "world" ? districts : worldPlaces;
        const otherScope = scope === "world" ? "districts" : "world";
        setOtherSelected(parseSavedSelection(localStorage.getItem(`atlas:selection:${otherScope}:v1`), other, otherScope === "world" ? resolveWorldPlaceId : undefined));
      } catch { setOtherSelected([]); }
      setReady(true);
    });
    return () => { cancelAnimationFrame(frame); };
  }, [scope]);

  const world = scope === "world" ? selected : otherSelected;
  const districtIds = scope === "districts" ? selected : otherSelected;
  const profile = useMemo(() => createPublicProfile({
    name, includeName, includeWorld, includeDistricts, world, districts: districtIds,
  }, known), [name, includeName, includeWorld, includeDistricts, world, districtIds]);
  const shareUrl = profile && typeof window !== "undefined"
    ? `${window.location.origin}${publicPath("/share/")}#p=${encodePublicProfile(profile)}` : "";

  async function exportImage(format: "png" | "jpeg") {
    if (!profile) return;
    setBusy(true);
    setStatus("");
    try {
      const { renderProfileImage } = await import("./renderImage");
      const blob = await renderProfileImage(profile, format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `atlas-profile.${format === "jpeg" ? "jpg" : "png"}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(`${format === "jpeg" ? "JPG" : "PNG"} export ready.`);
    } catch {
      setStatus("The image could not be created. Try again in this browser.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); setStatus("Share link copied."); }
    catch { setStatus("Copy was unavailable. Select the link below to copy it manually."); }
  }

  return <dialog ref={dialogRef} className="profile-dialog" onClose={onClose} aria-labelledby="profile-title">
    <div className="profile-dialog-head"><div><p className="eyebrow">Private until you choose</p><h2 id="profile-title">Share your atlas</h2></div><button autoFocus type="button" className="profile-close" onClick={() => dialogRef.current?.close()} aria-label="Close profile preview">×</button></div>
    <p className="profile-help">Choose exactly what appears. Your local visit record stays on this device; a copied link contains only the fields in the preview. Anyone with that link can view it, and clearing your local visits will not revoke a copied link.</p>
    {!ready ? <p>Reading saved places…</p> : <div className="profile-composer-layout">
      <div className="profile-settings">
        <fieldset><legend>Place lists</legend>
          <label><input type="checkbox" checked={includeWorld} onChange={(event) => setIncludeWorld(event.target.checked)} /><span>World places <small>{world.length} saved</small></span></label>
          <label><input type="checkbox" checked={includeDistricts} onChange={(event) => setIncludeDistricts(event.target.checked)} /><span>Bangladesh districts <small>{districtIds.length} saved</small></span></label>
        </fieldset>
        <fieldset><legend>Optional name</legend>
          <label><input type="checkbox" checked={includeName} onChange={(event) => setIncludeName(event.target.checked)} /><span>Include a display name</span></label>
          <input className="profile-name-input" type="text" maxLength={60} value={name} onChange={(event) => setName(event.target.value)} placeholder="Name for this export" aria-label="Display name for profile" />
        </fieldset>
        <p className="profile-privacy">No visit dates, account details, precise locations, or analytics are included.</p>
        <div className="profile-actions"><button type="button" disabled={!profile || busy} onClick={() => void exportImage("png")}>Download PNG</button><button type="button" disabled={!profile || busy} onClick={() => void exportImage("jpeg")}>Download JPG</button><button type="button" disabled={!profile} onClick={() => window.print()}>Print / Save PDF</button></div>
        <div className="profile-share"><button type="button" disabled={!profile} onClick={() => void copyLink()}>Copy share link</button><input readOnly value={shareUrl} aria-label="Share link" placeholder="Choose a place list to make a link" onFocus={(event) => event.currentTarget.select()} /></div>
        <p className="profile-status" role="status">{status}</p>
      </div>
      <div className="profile-preview-wrap">{profile ? <ProfileCard profile={profile} /> : <div className="profile-empty"><strong>Nothing selected for sharing</strong><p>Choose a place list to preview an export. Names are optional.</p></div>}</div>
    </div>}
  </dialog>;
}
