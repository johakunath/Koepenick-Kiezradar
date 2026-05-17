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
        {/* Heron — far right edge, mid viewport */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-heron.png" alt="" aria-hidden="true"
          className="illus-baked hidden md:block"
          style={{ position: "fixed", right: -120, top: "32vh", width: 280, opacity: 0.18, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — far left edge, lower mid */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-baked hidden md:block"
          style={{ position: "fixed", left: -100, top: "58vh", width: 240, opacity: 0.16, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Carp — far right edge, lower */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
          className="illus-baked hidden md:block"
          style={{ position: "fixed", right: -100, top: "72vh", width: 240, opacity: 0.16, pointerEvents: "none", zIndex: 5 }}
        />
        {/* ── Mobile illustrations ── */}
        {/* Hero — below header */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-mobile-hero.png" alt="" aria-hidden="true"
          className="illus-baked md:hidden"
          style={{ position: "fixed", top: 100, left: 0, width: "100%", opacity: 0.22, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — bottom left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-baked md:hidden"
          style={{ position: "fixed", bottom: 0, left: -60, width: 160, opacity: 0.12, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — bottom right (mirrored) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-baked md:hidden"
          style={{ position: "fixed", bottom: 0, right: -60, width: 160, opacity: 0.12, pointerEvents: "none", zIndex: 5, transform: "scaleX(-1)" }}
        />
        {/* Carp — bottom center-right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
          className="illus-baked md:hidden"
          style={{ position: "fixed", bottom: 20, right: "18%", width: 130, opacity: 0.11, pointerEvents: "none", zIndex: 5 }}
        />
        {children}
      </body>
    </html>
  );
}
