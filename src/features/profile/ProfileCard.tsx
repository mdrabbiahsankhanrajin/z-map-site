import { resolveWorldPlaceId, worldPlaces } from "@/data/worldPlaces";
import districts from "@/data/districts.json";
import { districtDisplayName } from "@/data/districtNames";
import type { PublicProfile } from "./profile";

export function profileSections(profile: PublicProfile) {
  const worldIds = new Set(profile.world?.map(resolveWorldPlaceId));
  return [
    ...(profile.world ? [{ title: "World places", total: worldPlaces.length, names: worldPlaces.filter((place) => worldIds.has(place.id)).map((place) => place.name).sort() }] : []),
    ...(profile.districts ? [{ title: "Bangladesh districts", total: districts.length, names: districts.filter((place) => profile.districts?.includes(place.id)).map((place) => districtDisplayName(place.name)).sort() }] : []),
  ];
}

export function ProfileCard({ profile }: { profile: PublicProfile }) {
  return <article className="profile-card profile-print-area" aria-label="Profile preview">
    <div className="profile-card-top"><span className="profile-compass" aria-hidden="true">✧</span><span>ATLAS / A PERSONAL MAP</span></div>
    <p className="profile-kicker">Places, remembered</p>
    <h2>{profile.name ? `${profile.name}'s atlas` : "A personal atlas"}</h2>
    <p className="profile-intro">A simple record of the places chosen for this profile.</p>
    {profileSections(profile).map((section) => <section key={section.title} className="profile-section">
      <div className="profile-section-heading"><h3>{section.title}</h3><strong>{section.names.length} <small>/ {section.total}</small></strong></div>
      {section.names.length ? <ul>{section.names.map((name) => <li key={name}>{name}</li>)}</ul> : <p>No visited places included.</p>}
    </section>)}
    <p className="profile-card-foot">Shared by choice · No visit dates or location traces</p>
  </article>;
}
