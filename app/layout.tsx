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
        {/* Panorama — top right desktop, full-width mobile */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/heron-schloss-panorama.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", top: 0, right: 0, width: 900, opacity: 0.20, pointerEvents: "none", zIndex: 5 }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/heron-schloss-panorama.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", top: 0, left: 0, width: "100%", opacity: 0.18, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Heron — right edge, mid viewport */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-heron.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", right: -20, top: "34vh", width: 300, opacity: 0.28, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — left edge, lower mid */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark hidden md:block"
          style={{ position: "fixed", left: 20, top: "58vh", width: 260, opacity: 0.25, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Carp — right edge, lower; gradient wrapper fades left edge of watercolor bg */}
        <div
          className="hidden md:block"
          style={{
            position: "fixed", right: 0, top: "72vh", width: 280, zIndex: 5, pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, white 35%, white 100%)",
            maskImage: "linear-gradient(to right, transparent 0%, white 35%, white 100%)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/illus-carp.png" alt="" aria-hidden="true"
            className="illus-mark"
            style={{ width: "100%", opacity: 0.28, pointerEvents: "none", display: "block" }}
          />
        </div>
        {/* ── Mobile illustrations — small edge accents only ── */}
        {/* Reeds — bottom left */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 0, left: -30, width: 160, opacity: 0.20, pointerEvents: "none", zIndex: 5 }}
        />
        {/* Reeds — bottom right (mirrored) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-reeds.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", bottom: 0, right: -30, width: 160, opacity: 0.20, pointerEvents: "none", zIndex: 5, transform: "scaleX(-1)" }}
        />
        {/* Heron — right, mid mobile */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/illus-heron.png" alt="" aria-hidden="true"
          className="illus-mark md:hidden"
          style={{ position: "fixed", right: -30, top: "40vh", width: 180, opacity: 0.22, pointerEvents: "none", zIndex: 5 }}
        />
        {children}
      </body>
    </html>
  );
}
