"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Entry } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { getMappableEntries } from "@/lib/shared/map-coordinates";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon paths broken by bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function FitBounds({ entries }: { entries: Entry[] }) {
  const map = useMap();
  useEffect(() => {
    const points = getMappableEntries(entries).map(
      (e) => [e.lat, e.lng] as [number, number],
    );
    if (points.length > 0) map.fitBounds(points, { padding: [40, 40] });
  }, [map, entries]);
  return null;
}

interface KiezMapProps {
  entries: Entry[];
}

export default function KiezMap({ entries }: KiezMapProps) {
  const mapped = getMappableEntries(entries);

  return (
    <MapContainer
      center={[52.455, 13.578]}
      zoom={12}
      style={{ height: "100%", width: "100%", borderRadius: 12 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds entries={mapped} />
      {mapped.map((entry) => (
        <Marker key={entry.id} position={[entry.lat, entry.lng]}>
          <Popup maxWidth={280}>
            <div
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#2d6080",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {entry.tags.map((t) => TAG_LABELS[t]).join(" · ")}
              </div>
              <strong
                style={{
                  fontSize: 14,
                  lineHeight: 1.3,
                  display: "block",
                  marginBottom: 5,
                  color: "#143d56",
                }}
              >
                {entry.title}
              </strong>
              <p
                style={{
                  color: "#445562",
                  margin: "0 0 8px",
                  lineHeight: 1.45,
                  fontSize: 12,
                }}
              >
                {entry.ai_summary}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  borderTop: "1px solid #ddd0b8",
                  paddingTop: 6,
                  marginTop: 4,
                }}
              >
                <a
                  href={`/eintrag/${entry.slug ?? slugify(entry.title)}`}
                  style={{ color: "#143d56", fontSize: 11, fontWeight: 600 }}
                >
                  Im Feed öffnen →
                </a>
                <a
                  href={entry.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#2d6080", fontSize: 11 }}
                >
                  {entry.source} ↗
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
