"use client";

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import type { Entry } from "@/lib/types";
import { TAG_COLORS } from "@/components/FilterBar";
import "leaflet/dist/leaflet.css";

interface MiniMapProps {
  entries: Entry[];
}

export default function MiniMap({ entries }: MiniMapProps) {
  const mapped = entries.filter((e) => e.lat != null && e.lng != null);

  return (
    <MapContainer
      center={[52.455, 13.578]}
      zoom={11}
      style={{ height: "100%", width: "100%", borderRadius: 8 }}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {mapped.map((entry) => {
        const color = entry.tags[0] ? TAG_COLORS[entry.tags[0]]?.color : "var(--water-2)";
        return (
          <CircleMarker
            key={entry.id}
            center={[entry.lat!, entry.lng!]}
            radius={5}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.75, weight: 1.5 }}
          />
        );
      })}
    </MapContainer>
  );
}
