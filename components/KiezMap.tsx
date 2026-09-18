"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Entry } from "@/lib/types";
import { getMappableEntries } from "@/lib/shared/map-coordinates";
import { formatEntryDate, type Bounds } from "@/lib/shared/discovery";
import "leaflet/dist/leaflet.css";

function MapController({ entries, selectedId, onBoundsChange, fitKey }: {
  entries: Entry[]; selectedId?: string; onBoundsChange?: (bounds: Bounds) => void; fitKey: number;
}) {
  const map = useMap();
  const points = useMemo(() => getMappableEntries(entries), [entries]);
  const latestPoints = useRef(points);
  latestPoints.current = points;
  const report = () => {
    const b = map.getBounds();
    onBoundsChange?.({ north: b.getNorth(), south: b.getSouth(), west: b.getWest(), east: b.getEast() });
  };
  useMapEvents({ moveend: report, resize: report });
  useEffect(() => {
    const points = latestPoints.current;
    if (points.length) map.fitBounds(points.map(e => [e.lat, e.lng] as [number, number]), { padding: [35, 35], maxZoom: 15, animate: false });
    report();
    // Bounds only change on an explicit reset/filter change, never on area filtering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);
  useEffect(() => {
    const selected = points.find(e => e.id === selectedId);
    if (selected && !map.getBounds().pad(-0.15).contains([selected.lat, selected.lng])) map.panTo([selected.lat, selected.lng], { animate: false });
  }, [map, selectedId, points]);
  return null;
}

function PlaceMarker({ entries, selectedId, onSelect, returnTo }: { entries: Array<Entry & { lat: number; lng: number }>; selectedId?: string; onSelect?: (id: string) => void; returnTo: string }) {
  const marker = useRef<L.Marker>(null);
  const selected = entries.some(e => e.id === selectedId);
  const icon = useMemo(() => L.divIcon({
    className: `radar-marker ${selected ? "radar-marker-selected" : ""}`,
    html: `<span>${entries.length > 1 ? entries.length : "•"}</span>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
  }), [entries.length, selected]);
  useEffect(() => { if (selected) marker.current?.openPopup(); }, [selected]);
  return <Marker ref={marker} position={[entries[0].lat, entries[0].lng]} icon={icon}
    title={`${entries.length} Einträge: ${entries[0].venue || entries[0].location}`}
    eventHandlers={{ click: () => onSelect?.(entries[0].id) }}>
    <Popup maxWidth={310} maxHeight={260} autoPan={false}>
      <div className="space-y-4 font-body">{entries.map(entry => <div key={entry.id}>
        <p className="text-xs font-semibold">{formatEntryDate(entry)}</p>
        <button type="button" onClick={() => onSelect?.(entry.id)} className="my-1 text-left text-sm font-semibold underline">{entry.title}</button>
        <p className="text-xs">{entry.venue || entry.location}</p>
        <a className="text-xs underline" href={`/eintrag/${entry.slug}?from=${encodeURIComponent(returnTo)}`}>Details & Originalquelle →</a>
      </div>)}</div>
    </Popup>
  </Marker>;
}

export default function KiezMap({ entries, selectedId, onSelect, onBoundsChange, fitKey = 0, returnTo = "/karte" }: {
  entries: Entry[]; selectedId?: string; onSelect?: (id: string) => void; onBoundsChange?: (bounds: Bounds) => void; fitKey?: number; returnTo?: string;
}) {
  const [tileError, setTileError] = useState(false);
  const groups = useMemo(() => {
    const grouped = new Map<string, Array<Entry & { lat: number; lng: number }>>();
    for (const entry of getMappableEntries(entries)) {
      const key = `${entry.lat.toFixed(4)},${entry.lng.toFixed(4)}`;
      grouped.set(key, [...(grouped.get(key) ?? []), entry]);
    }
    return [...grouped.values()];
  }, [entries]);
  return <div className="relative h-full">
    {tileError && <p role="status" className="absolute inset-x-12 top-3 z-[1000] rounded bg-card p-3 text-xs text-ink shadow">Kartenhintergrund nicht erreichbar. Die Liste und Ortsangaben bleiben verfügbar.</p>}
    <MapContainer center={[52.455, 13.578]} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" eventHandlers={{ tileerror: () => setTileError(true) }} />
      <MapController entries={entries} selectedId={selectedId} onBoundsChange={onBoundsChange} fitKey={fitKey} />
      {groups.map(group => <PlaceMarker key={`${group[0].lat},${group[0].lng}`} entries={group} selectedId={selectedId} onSelect={onSelect} returnTo={returnTo} />)}
    </MapContainer>
  </div>;
}
