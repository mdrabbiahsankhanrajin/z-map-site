import Link from "next/link";

type View = "places" | "planner" | "insights";

export function TravelHeader({ active }: { active: View }) {
  return <header className="content-topbar">
    <Link href="/bd" aria-label="Back to Bangladesh map"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 2 23 17 38 20 23 23 20 38 17 23 2 20 17 17 20 2Z" stroke="currentColor" strokeWidth="1.5"/><circle cx="20" cy="20" r="4" fill="currentColor"/></svg><span>ATLAS</span></Link>
    <nav aria-label="Travel views"><Link href="/bd">Map</Link><Link className={active === "places" ? "current" : undefined} href="/discover">Places</Link><Link className={active === "planner" ? "current" : undefined} href="/planner">Trip</Link><Link className={active === "insights" ? "current" : undefined} href="/insights">Insights</Link></nav>
  </header>;
}
