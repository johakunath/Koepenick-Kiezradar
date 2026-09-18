"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Map, List, ArrowRight, Compass } from "lucide-react";
import type { Entry, DistrictRecord, IngestHealth } from "@/lib/types";
import { DEFAULT_FILTERS, filterDiscovery, parseFilters, groupOccurrences, healthMessage, insideBounds, PERIODS, type DiscoveryFilters, type Point, type Bounds } from "@/lib/shared/discovery";
import { discoveryListPath, discoveryUrl, type DiscoveryListPath } from "@/lib/shared/discovery-navigation";
import { getMappableEntries } from "@/lib/shared/map-coordinates";
import DiscoveryFiltersBar from "./discovery-filters";
import DiscoveryCard from "./discovery-card";

const KiezMap = dynamic(() => import("@/components/KiezMap"), { ssr: false, loading: () => <div role="status" className="flex h-full min-h-80 items-center justify-center bg-bg-deep text-ink-soft">Karte wird geladen…</div> });

export default function Explorer({ entries, districts, health, initialFilters, initialMap, initialListPath, initialSelected, initialNow }: {
  entries: Entry[]; districts: DistrictRecord[]; health: IngestHealth; initialFilters: DiscoveryFilters;
  initialMap: boolean; initialListPath: DiscoveryListPath; initialSelected: string; initialNow: string;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [mapView, setMapView] = useState(initialMap);
  const [listPath, setListPath] = useState(initialListPath);
  const [selected, setSelected] = useState(initialSelected);
  const [now, setNow] = useState(new Date(initialNow));
  const [visible, setVisible] = useState(12);
  const [point, setPoint] = useState<Point>();
  const [radius, setRadius] = useState(5);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [bounds, setBounds] = useState<Bounds>();
  const [area, setArea] = useState<Bounds>();
  const [fitKey, setFitKey] = useState(0);
  const locationRequest = useRef(0);
  const mapPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      setFilters(parseFilters(params)); setMapView(window.location.pathname === "/karte");
      setListPath(discoveryListPath(window.location.pathname, params));
      setSelected(params.get("selected") ?? ""); setArea(undefined); setVisible(12);
    };
    window.addEventListener("popstate", restore);
    return () => { window.clearInterval(timer); window.removeEventListener("popstate", restore); locationRequest.current++; };
  }, []);

  const base = useMemo(() => filterDiscovery(entries, filters, now, point ? { point, radius } : undefined), [entries, filters, now, point, radius]);
  const filtered = useMemo(() => area ? base.filter(e => insideBounds(e, area)) : base, [base, area]);
  const groups = useMemo(() => groupOccurrences(filtered), [filtered]);
  const mapped = useMemo(() => getMappableEntries(groups.map(g => g.entry)), [groups]);
  const activeSelected = groups.some(g => g.entry.id === selected) ? selected : "";
  const visibleCount = Math.max(visible, groups.findIndex(g => g.entry.id === activeSelected) + 1);
  const returnTo = discoveryUrl(filters, mapView, listPath, activeSelected);
  const missing = groups.length - mapped.length;

  function writeUrl(next: DiscoveryFilters, map = mapView, selectedId = "", push = false) {
    const url = discoveryUrl(next, map, listPath, selectedId);
    if (push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }
  function update(patch: Partial<DiscoveryFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next); setSelected(""); setArea(undefined); setVisible(12); setFitKey(key => key + 1);
    writeUrl(next, mapView, "", !("query" in patch));
  }
  function clearNearby() { locationRequest.current++; setPoint(undefined); setLocating(false); setLocationMessage(""); setArea(undefined); }
  function reset() { clearNearby(); update({ ...DEFAULT_FILTERS, mode: filters.mode }); }
  function locate() {
    if (!navigator.geolocation) { setLocationMessage("Standort wird hier nicht unterstützt. Wähle einen Ortsteil unter „Ort & Kategorie“."); return; }
    const request = ++locationRequest.current;
    setLocating(true); setLocationMessage("Dein Standort wird nur hier zur Entfernungssuche verwendet.");
    navigator.geolocation.getCurrentPosition(position => {
      if (request !== locationRequest.current) return;
      setPoint({ lat: position.coords.latitude, lng: position.coords.longitude });
      setLocating(false); setArea(undefined); setVisible(12); setFitKey(key => key + 1);
      setLocationMessage("Entfernungen sind Luftlinie zu automatisch ermittelten Orten. Standort wird nicht gespeichert.");
    }, error => {
      if (request !== locationRequest.current) return;
      setLocating(false);
      setLocationMessage(error.code === 1 ? "Standortfreigabe abgelehnt. Wähle stattdessen einen Ortsteil unter „Ort & Kategorie“." : "Standort gerade nicht verfügbar. Versuche es erneut oder wähle einen Ortsteil.");
    }, { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false });
  }
  function selectEntry(id: string, fromMap = false) {
    setSelected(id); setMapView(true); writeUrl(filters, true, id);
    if (fromMap) {
      const index = groups.findIndex(g => g.entry.id === id);
      setVisible(count => Math.max(count, index + 1));
      window.requestAnimationFrame(() => document.getElementById(`result-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    } else window.requestAnimationFrame(() => mapPanel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  return <main id="main-content" className="discovery-shell relative z-10 mx-auto max-w-[1280px] px-5 pb-12 md:px-12">
    <section className="discovery-intro pt-7 pb-2">
      <div className="discovery-intro-copy">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-reed">Köpenick & nebenan</p>
        <h1 className="font-display text-3xl leading-tight text-ink md:text-4xl">{filters.mode === "news" ? "Was bewegt deinen Kiez?" : "Was hast du heute vor?"}</h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">Veranstaltungen, kleine Entdeckungen und Neues aus der Nachbarschaft. Finde deinen nächsten Anlass, rauszugehen.</p>
      </div>
    </section>
    <DiscoveryFiltersBar filters={filters} update={update} districts={districts} locate={locate} locating={locating}
      nearby={!!point} clearNearby={clearNearby} radius={radius} setRadius={value => { setRadius(value); setVisible(12); }} reset={reset} />
    {locationMessage && <p role="status" className="mb-3 text-sm text-ink-soft">{locationMessage}</p>}
    <div className="discovery-status mb-4 flex flex-wrap items-center justify-between gap-2 border-y border-border py-3 text-xs text-ink-soft">
      <p>{healthMessage(health, now)} <Link className="underline underline-offset-4" href="/quellen">Quellenstatus</Link></p>
      <span>KI-Texte · Originale sind maßgeblich</span>
    </div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div aria-live="polite" aria-atomic="true">
        <h2 className="font-display text-xl">{groups.length} {filters.mode === "news" ? "Kiezmeldungen" : "Entdeckungen"}{filters.mode === "discover" ? ` · ${PERIODS[filters.period]}` : ""}</h2>
        <p className="mt-1 text-xs text-ink-soft">{point ? "Nach Entfernung · Luftlinie" : filters.mode === "news" ? "Neueste Meldungen zuerst" : "Nächster Termin zuerst · undatierte Hinweise danach"}{area ? " · Im gewählten Kartengebiet" : ""}</p>
      </div>
      <div className="flex rounded-lg border border-border bg-card p-1" aria-label="Ansicht">
        {([{ value: false, label: "Liste", Icon: List }, { value: true, label: "Karte & Liste", Icon: Map }]).map(({ value, label, Icon }) =>
          <button type="button" key={label} aria-pressed={mapView === value} onClick={() => { setMapView(value); if (!value) setArea(undefined); writeUrl(filters, value, activeSelected, true); }}
            className={`flex min-h-10 items-center gap-2 rounded px-3 text-sm ${mapView === value ? "bg-water text-bg" : "text-ink-soft"}`}><Icon size={15} />{label}</button>)}
      </div>
    </div>
    <div className={mapView ? "discovery-results grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "discovery-results"}>
      {mapView && <div ref={mapPanel} className="discovery-map-panel order-first min-w-0 lg:sticky lg:top-5 lg:order-last">
        <div className="relative isolate h-[44svh] min-h-72 overflow-hidden rounded-xl border border-border lg:h-[68vh]" aria-label="Karte der gefilterten Einträge">
          <KiezMap entries={mapped} selectedId={activeSelected} onSelect={id => selectEntry(id, true)} onBoundsChange={setBounds} fitKey={fitKey} returnTo={returnTo} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-ink-soft">{mapped.length} kartiert · {missing} ohne Kartenpunkt</span>
          <div className="flex gap-2">
            <button type="button" disabled={!bounds} onClick={() => { setArea(bounds); setVisible(12); }} className="min-h-10 rounded border border-border bg-card px-3 text-xs">Dieses Gebiet suchen</button>
            <button type="button" onClick={() => { setArea(undefined); setFitKey(key => key + 1); }} className="min-h-10 px-2 text-xs underline">Alle Orte zeigen</button>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">Kartenpunkte sind automatisch ermittelt und können ungenau sein. Ein Punkt mit Zahl fasst mehrere Einträge am selben Ort zusammen.</p>
      </div>}
      <section aria-label="Ergebnisse" className="min-w-0">
        {groups.length === 0 ? <div className="discovery-empty rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <Compass size={32} className="mx-auto mb-4 text-reed" aria-hidden="true" />
          <h2 className="font-display text-2xl">Hier ist gerade nichts im Radar.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">Für diese Auswahl haben wir keine passenden Einträge. Das heißt nicht, dass nichts stattfindet — unser Kalender ist noch unvollständig.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="min-h-11 rounded-lg bg-water px-4 py-2 text-sm text-bg">Alle Entdeckungen ansehen</button>
            <a className="inline-flex min-h-11 items-center gap-1 text-sm underline" href="https://www.berlin.de/land/kalender/index.php?c=13&suchmaske=" target="_blank" rel="noopener noreferrer">Berlin.de-Kalender <ArrowRight size={14} /></a>
          </div>
        </div> : <>
          <div className={mapView ? "space-y-4" : "grid gap-4 md:grid-cols-2"}>
            {groups.slice(0, visibleCount).map(({ entry, occurrences }) => <DiscoveryCard key={entry.id} entry={entry}
              occurrences={occurrences.length} selected={activeSelected === entry.id} onSelect={() => selectEntry(entry.id)} point={point} returnTo={returnTo} />)}
          </div>
          {groups.length > visibleCount && <button type="button" onClick={() => setVisible(visibleCount + 12)} className="mt-6 min-h-12 w-full rounded-lg border border-border bg-card text-sm font-semibold">Weitere {Math.min(12, groups.length - visibleCount)} anzeigen</button>}
        </>}
      </section>
    </div>
    <footer className="discovery-footer mt-10 border-t border-border pt-6 text-sm text-ink-soft">
      <p>Köpenick Kiezradar · Ein privates Projekt aus der Nachbarschaft.</p>
      <div className="mt-3 flex flex-wrap gap-5"><Link href="/orte" className="underline">Orte erkunden</Link><Link href="/woche" className="underline">Wochenblick</Link><Link href="/quellen" className="underline">Unsere Quellen</Link><Link href="/about" className="underline">Über das Projekt</Link></div>
    </footer>
  </main>;
}
