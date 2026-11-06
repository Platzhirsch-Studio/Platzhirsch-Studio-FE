// Druck – Bereich Ablage (G-17, Konzept 10-konzept-ablage §6). Schreibt: Team B-ABL.
// ph_ablage bringt kein Druckformat mit. Strg+P in der Datei-Akte öffnet die Datei selbst inline (PDF/Bild) in
// einem neuen Tab; die Freigaben-Übersicht ist ein CSV-Export (Leitung). Reines Modul.

/** Darstellungen, die der Browser selbst drucken kann (inline öffnen statt DruckPanel). */
export const INLINE_DRUCKBAR = Object.freeze(["pdf", "bild", "text"]);

/** Inline-Ansicht einer Datei (Route /ablage/laden/[datei]). */
export const inlineHref = (datei, version) => `/ablage/laden/${encodeURIComponent(datei)}?inline=1${version ? `&v=${version}` : ""}`;

const druck = { INLINE_DRUCKBAR, inlineHref };

export default druck;
