import type { Entry } from "@/lib/types";

const MAP_BOUNDS = {
  latMin: 52.34,
  latMax: 52.56,
  lngMin: 13.44,
  lngMax: 13.76,
};

const GENERIC_TK_COORDS = { lat: 52.4450491, lng: 13.5754153 };

function isInsideMapBounds(lat: number, lng: number): boolean {
  return (
    lat >= MAP_BOUNDS.latMin &&
    lat <= MAP_BOUNDS.latMax &&
    lng >= MAP_BOUNDS.lngMin &&
    lng <= MAP_BOUNDS.lngMax
  );
}

function isGenericDistrictPin(entry: Entry): boolean {
  if (entry.lat == null || entry.lng == null) return false;

  const location = entry.location.trim().toLocaleLowerCase("de-DE");
  return (
    (location === "treptow-köpenick" || location === "köpenick") &&
    Math.abs(entry.lat - GENERIC_TK_COORDS.lat) < 0.00001 &&
    Math.abs(entry.lng - GENERIC_TK_COORDS.lng) < 0.00001
  );
}

export function hasMappableCoordinates(entry: Entry): entry is Entry & {
  lat: number;
  lng: number;
} {
  if (entry.lat == null || entry.lng == null) return false;
  if (isGenericDistrictPin(entry)) return false;
  return isInsideMapBounds(entry.lat, entry.lng);
}

export function getMappableEntries(
  entries: Entry[],
): Array<Entry & { lat: number; lng: number }> {
  return entries.filter(hasMappableCoordinates);
}
