import Link from "next/link";
import { CalendarDays, Database, Home, Map, MapPin, Rss, Tags } from "lucide-react";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/karte", label: "Karte", icon: Map },
  { href: "/woche", label: "Woche", icon: CalendarDays },
  { href: "/themen", label: "Themen", icon: Tags },
  { href: "/orte", label: "Orte", icon: MapPin },
  { href: "/termine", label: "Termine", icon: CalendarDays },
  { href: "/quellen", label: "Quellen", icon: Database },
  { href: "/feed.xml", label: "RSS", icon: Rss },
];

export default function RadarNav() {
  return (
    <nav aria-label="Radar-Navigation" className="mb-5 mt-5">
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--water-deep)",
              background: "rgba(250, 246, 236, 0.72)",
            }}
          >
            <Icon size={13} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
