import { filterParams, type DiscoveryFilters } from "./discovery";

export type DiscoveryListPath = "/" | "/termine";

export function discoveryListPath(pathname: string, params: URLSearchParams): DiscoveryListPath {
  return pathname === "/termine" || (pathname === "/karte" && params.get("list") === "termine") ? "/termine" : "/";
}

export function discoveryUrl(filters: DiscoveryFilters, map: boolean, listPath: DiscoveryListPath, selected = "") {
  const params = filterParams(filters);
  // Carry the originating list through map reloads and detail-page return links.
  if (map && listPath === "/termine") params.set("list", "termine");
  if (selected) params.set("selected", selected);
  return `${map ? "/karte" : listPath}${params.size ? `?${params}` : ""}`;
}
