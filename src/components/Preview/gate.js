// src/components/Preview/gate.js — Schalter der Design- und Vorlagen-Vorschauen
// (F5-shell-technik-release, Runde 1, P0 Preview).
//
// /<locale>/preview/{buehne,galerie,dreilaendereck} und /de/projekte/vorlage
// sind interne Prototypen bzw. Vorlagen mit Herstellerbildern ohne Freigabe
// (Minotti) und Platzhaltern. Gleiche Regel wie das Freigabe-Cockpit
// (src/components/Freigaben/model.js):
//   - Entwicklung (next dev): sichtbar
//   - Produktions-Build: nur mit DESIGN_PREVIEW=1 am laufenden Server
//   - VERCEL_ENV=production: nie, auch wenn die Variable versehentlich gesetzt ist
// Sonst notFound() (404). Die Seiten lesen den Schalter zur Anfragezeit
// (connection()), damit tools/qa/prod-check.mjs --design-preview ohne neuen
// Build prüfen kann.
//
// Rein, ohne React und ohne "@/": node --test importiert die Datei
// (tests/unit/f5-shell-technik.test.mjs).

/** Sind die Design-/Vorlagen-Vorschauen in dieser Umgebung erlaubt? */
export function designPreviewEnabled(env = process.env) {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.DESIGN_PREVIEW === "1";
}

/**
 * Metadata of a prototype page, only while the preview is on. Otherwise the
 * production 404 would still carry the prototype's title and description.
 * Usage: `export const generateMetadata = previewMetadata({ title: … })`.
 */
export function previewMetadata(meta) {
  return () => (designPreviewEnabled() ? meta : { robots: { index: false, follow: false } });
}
