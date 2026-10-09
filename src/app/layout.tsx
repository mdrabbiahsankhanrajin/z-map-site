import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "./profile.css";
import { publicPath } from "@/lib/publicPath";
import { OfflineRegistration } from "@/components/OfflineRegistration";

export const metadata: Metadata = {
  title: "Atlas — your world, in places",
  description: "A private travel atlas for the places that matter to you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body style={{
    "--atlas-paper-image": `url('${publicPath("/textures/atlas-paper.webp")}')`,
    "--water-lily-image": `url('${publicPath("/illustrations/bd-water-lily.webp")}')`,
  } as React.CSSProperties}><OfflineRegistration />{children}</body></html>;
}
