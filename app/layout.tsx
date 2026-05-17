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
        {/* ── Background illustrations: zIndex 5 = above content (1), below header (20) ── */}
        {/* Panorama — top right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/heron-schloss-panorama.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", top: 0, right: 0, width: 820, opacity: 0.28, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Heron — right, mid viewport */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-heron.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", right: -50, top: "38vh", width: 320, opacity: 0.22, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — left, lower mid */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", left: -20, top: "55vh", width: 280, opacity: 0.20, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Carp — right, lower */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", right: -30, top: "72vh", width: 280, opacity: 0.22, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Schloss Köpenick — bottom left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-schloss-koepenick.png" alt="" aria-hidden="true"
          className="illus-baked hidden md:block"
          style={{ position: "fixed", left: 0, bottom: 0, width: 520, opacity: 0.32, pointerEvents: "none", zIndex: 5 }}
        />
        {/* ── Mobile illustrations ── */}
        {/* Hero — below header */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-mobile-hero.png" alt="" aria-hidden="true"
          className="illus-baked md:hidden"
          style={{ position: "fixed", top: 100, left: 0, width: "100%", opacity: 0.30, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — bottom left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 0, left: -50, width: 160, opacity: 0.14, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — bottom right (mirrored) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 0, right: -50, width: 160, opacity: 0.14, pointerEvents: "none", zIndex: 5, transform: "scaleX(-1)" }}
        />
        {/* Carp — bottom center-right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 20, right: "18%", width: 140, opacity: 0.13, pointerEvents: "none", zIndex: 5 }}
        />
        {children}
      </body>
    </html>
  );
}
