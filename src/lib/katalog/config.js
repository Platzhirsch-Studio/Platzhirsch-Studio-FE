// src/lib/katalog/config.js
// Schalter des Herstellerkatalogs.
//
// KATALOG_PREISE (Inhaber-Entscheidung Nr. 26, 31.10.2026): UVP-Anzeige bei
// Küchengeräten. Standard „an“ (Inhaber hat zugestimmt); angezeigt werden nur
// Einträge mit gültiger quelle + stand, höchstens 6 Monate alt (preisAktiv in
// schema.js). Abschalten: Umgebungsvariable KATALOG_PREISE=aus.
// Rein, ohne "@/"-Importe.

export function katalogPreiseAn(env = typeof process !== "undefined" ? process.env : {}) {
  return String(env.KATALOG_PREISE || "an").toLowerCase() !== "aus";
}

/** Heutiges Datum (YYYY-MM-DD, UTC) – für statische Seiten = Tag des Renderns/Revalidierens. */
export function heuteIso(now = new Date()) {
  return now.toISOString().slice(0, 10);
}
