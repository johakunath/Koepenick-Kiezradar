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
  title: "Köpenick Kiezradar – Was passiert in Berlin-Köpenick",
  description: "Öffentliche Meldungen aus Berlin-Köpenick, täglich automatisch gesammelt und zusammengefasst.",
  openGraph: {
    title: "Köpenick Kiezradar – Was passiert in Berlin-Köpenick",
    description: "Öffentliche Meldungen aus Berlin-Köpenick, täglich automatisch gesammelt und zusammengefasst.",
    siteName: "Köpenick Kiezradar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${fraunces.variable} ${interTight.variable} h-full`} suppressHydrationWarning>
      {/* Prevent FOUC: apply saved theme before first paint */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('kiezradar-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
