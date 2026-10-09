"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { legacyWorldPlaceIds, worldPlaces } from "@/data/worldPlaces";
import districts from "@/data/districts.json";
import { ProfileCard } from "./ProfileCard";
import { decodePublicProfile, type PublicProfile } from "./profile";

const known = { world: [...worldPlaces.map((place) => place.id), ...legacyWorldPlaceIds], districts: districts.map((place) => place.id) };

export function SharedProfile() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    const readFragment = () => {
      const encoded = new URLSearchParams(window.location.hash.slice(1)).get("p");
      setProfile(encoded ? decodePublicProfile(encoded, known) : null);
      setReady(true);
    };
    const frame = requestAnimationFrame(readFragment);
    window.addEventListener("hashchange", readFragment);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", readFragment); };
  }, []);

  return <main className="shared-page">
    <header className="shared-header"><Link href="/" className="shared-brand">✧ ATLAS</Link><Link href="/">Explore your own map ↗</Link></header>
    {!ready ? <p className="shared-message">Opening profile…</p> : profile ? <>
      <div className="shared-intro"><p className="eyebrow">A chosen glimpse</p><h1>A shared atlas</h1><p>This profile shows only the places and name its creator chose to include.</p></div>
      <ProfileCard profile={profile} />
      <div className="shared-actions"><button type="button" onClick={() => window.print()}>Print / Save PDF</button><Link href="/">Create your own atlas</Link></div>
    </> : <div className="shared-message"><h1>Profile unavailable</h1><p>This link is missing or contains place data the current atlas cannot read.</p><Link href="/">Open the world map</Link></div>}
  </main>;
}
