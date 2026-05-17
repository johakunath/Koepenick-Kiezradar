import type { Metadata } from "next";
import { Fraunces, Inter_Tight } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Köpenick Kiezradar",
  description: "Hyperlokales Monitoring-Tool für Berlin-Köpenick",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${fraunces.variable} ${interTight.variable} h-full`}>
      {/* Prevent FOUC: apply saved theme before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('kiezradar-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        {/* ── Desktop background illustrations (all position:fixed, content scrolls over) ── */}
        {/* Panorama — top right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/heron-schloss-panorama.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", top: 0, right: 0, width: 820, opacity: 0.38, pointerEvents: "none", zIndex: 0 }}
        />
        {/* Heron — right, mid viewport */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-heron.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", right: -50, top: "38vh", width: 320, opacity: 0.26, pointerEvents: "none", zIndex: 0 }}
        />
        {/* Reeds — left, lower mid */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", left: -20, top: "55vh", width: 280, opacity: 0.24, pointerEvents: "none", zIndex: 0 }}
        />
        {/* Carp — right, lower */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", right: -30, top: "72vh", width: 280, opacity: 0.26, pointerEvents: "none", zIndex: 0 }}
        />
        {/* Schloss Köpenick — bottom left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-schloss-koepenick.png" alt="" aria-hidden="true"
          className="illus-baked hidden md:block"
          style={{ position: "fixed", left: 0, bottom: 0, width: 520, opacity: 0.50, pointerEvents: "none", zIndex: 0 }}
        />
        {/* ── Mobile: hero image fixed below sticky header (60px + 40px nav rows) ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-mobile-hero.png" alt="" aria-hidden="true"
          className="illus-baked md:hidden"
          style={{ position: "fixed", top: 100, left: 0, width: "100%", opacity: 0.55, pointerEvents: "none", zIndex: 0 }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
