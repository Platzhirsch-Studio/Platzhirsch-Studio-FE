// src/lib/showroom/stations.js – which stations and pieces of the tour may be
// shown. Pure, no imports.
//
// Tempo fix1 (qa-screenshots/tempo/fix1.md): moved out of data.js unchanged.
// showroom/config.js needs visibleStations() for SHOWROOM_PUBLIC, and the
// consent register (src/lib/legal/services.js) reads SHOWROOM_PUBLIC – so the
// consent chunk on EVERY page used to pull data.js with its copy table
// (copy.js) and the full claims register (legal/claims.js, all regexes).
// data.js re-exports these functions, every caller keeps working.

/** Hat eine Station echtes Material (für „Haralds Tisch“)? */
export function hasRealMaterial(station) {
  const m = station?.material;
  return Array.isArray(m) && m.length > 0 && m.every((x) => typeof x?.src === "string" && x.src.startsWith("/") && typeof x?.quelle === "string" && x.quelle.length > 0);
}

/** Stationen, die gezeigt werden dürfen (Reihenfolge bleibt). */
export function visibleStations(data) {
  const list = Array.isArray(data?.stationen) ? data.stationen : [];
  return list.filter((s) => s && s.id && (s.typ !== "haralds-tisch" || hasRealMaterial(s)));
}

/** Darf dieses Stück einen Hotspot bekommen? */
export function hotspotAllowed(h) {
  return Boolean(h) && h.imShowroom === true && h.rechte === "ok";
}

/** Hotspots, die gezeigt werden dürfen (nur an sichtbaren Stationen). */
export function visibleHotspots(data) {
  const ids = new Set(visibleStations(data).map((s) => s.id));
  const list = Array.isArray(data?.hotspots) ? data.hotspots : [];
  return list.filter((h) => hotspotAllowed(h) && ids.has(h.station));
}
