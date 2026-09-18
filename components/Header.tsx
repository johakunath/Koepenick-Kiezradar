"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waves } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Entdecken" },
  { href: "/karte", label: "Karte" },
  { href: "/termine", label: "Termine" },
  { href: "/orte", label: "Orte" },
  { href: "/woche", label: "Woche" },
];

export default function Header() {
  const pathname = usePathname();
  const navigation = <>{NAV_LINKS.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}
    className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-2.5 text-sm font-medium transition-colors md:px-4 ${pathname === href ? "bg-water text-bg" : "text-ink-soft hover:bg-bg-deep hover:text-ink"}`}>{label}</Link>)}</>;

  return <header className="relative z-20 border-b border-border bg-bg">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-card focus:p-3">Zum Inhalt</a>
    <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-5 px-5 md:h-[76px] md:px-10">
      <Link href="/" aria-label="Köpenick Kiezradar – Startseite" className="flex shrink-0 items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full border border-water/20 text-water"><Waves size={24} strokeWidth={1.4} aria-hidden="true" /></span>
        <span><span className="block font-display text-[25px] font-semibold leading-none tracking-tight text-water">Kiezradar<span className="text-brick">.</span></span>
          <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.23em] text-ink-soft">Köpenick & nebenan</span></span>
      </Link>
      <nav aria-label="Hauptnavigation" className="hidden items-center gap-1 md:flex">{navigation}</nav>
      <div className="flex items-center gap-3"><Link href="/about" className="hidden min-h-11 items-center text-sm text-ink-soft hover:underline lg:inline-flex">Über uns</Link><ThemeToggle /></div>
    </div>
    <nav aria-label="Mobile Hauptnavigation" className="flex justify-between gap-1 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:hidden">{navigation}</nav>
  </header>;
}
