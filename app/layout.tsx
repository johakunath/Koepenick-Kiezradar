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
        {/* Heron — right edge, mid viewport */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-heron.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", right: -60, top: "30vh", width: 300, opacity: 0.28, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — left edge, lower mid */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", left: -40, top: "56vh", width: 260, opacity: 0.25, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Carp — right edge, lower */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", right: -50, top: "70vh", width: 260, opacity: 0.25, pointerEvents: "none", zIndex: 5 }}
        />
        {/* ── Mobile illustrations ── */}
        {/* Hero — below header */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-mobile-hero.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", top: 100, left: 0, width: "100%", opacity: 0.22, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — bottom left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 0, left: -50, width: 160, opacity: 0.18, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — bottom right (mirrored) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 0, right: -50, width: 160, opacity: 0.18, pointerEvents: "none", zIndex: 5, transform: "scaleX(-1)" }}
        />
        {/* Carp — bottom center-right */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 20, right: "18%", width: 140, opacity: 0.16, pointerEvents: "none", zIndex: 5 }}
        />
        {children}
      </body>
    </html>
  );
}
