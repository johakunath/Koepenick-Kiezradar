"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/karte", label: "Karte" },
  { href: "/woche", label: "Woche" },
  { href: "/termine", label: "Termine" },
  { href: "/themen", label: "Themen" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  const today = new Date().toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

  return (
    <header
      className="sticky top-0 z-20 w-full"
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--rule)" }}
    >
      {/* Main row */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-20 flex items-center gap-5 h-[60px]">
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-fraunces)",
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: "-0.022em",
              lineHeight: 1,
              color: "var(--water)",
            }}
          >
            Kiezradar
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-mute)",
              marginTop: 2,
            }}
          >
            Köpenick · {today}
          </div>
        </Link>

        {/* Nav links — desktop */}
        <nav
          className="hidden md:flex items-center gap-0 flex-1 min-w-0"
          style={{ overflowX: "auto", scrollbarWidth: "none" }}
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "var(--font-inter-tight)",
                  fontSize: 13,
                  padding: "4px 10px",
                  color: active ? "var(--ink)" : "var(--ink-soft)",
                  fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                  borderBottom: active ? "1.5px solid var(--water)" : "1.5px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "color 0.1s",
                  lineHeight: "52px",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "var(--ink-soft)";
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right */}
        <div className="ml-auto md:ml-0 flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <a
            href="/admin"
            className="opacity-0 hover:opacity-20 transition-opacity"
            aria-hidden="true"
            tabIndex={-1}
            style={{ fontSize: 10, color: "var(--ink-mute)" }}
          >
            ·
          </a>
        </div>
      </div>

      {/* Mobile nav — scrollable second row */}
      <div
        className="md:hidden flex items-center overflow-x-auto px-5"
        style={{
          height: 40,
          borderTop: "1px solid var(--rule)",
          scrollbarWidth: "none",
          gap: 0,
        }}
      >
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-inter-tight)",
                fontSize: 12.5,
                padding: "3px 9px",
                color: active ? "var(--ink)" : "var(--ink-soft)",
                fontWeight: active ? 600 : 400,
                textDecoration: "none",
                borderBottom: active ? "1.5px solid var(--water)" : "1.5px solid transparent",
                whiteSpace: "nowrap",
                flexShrink: 0,
                lineHeight: "34px",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
