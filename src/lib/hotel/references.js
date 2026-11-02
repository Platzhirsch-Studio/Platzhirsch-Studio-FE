// src/lib/hotel/references.js – Referenz-Slot der Seite /hotel-objekt.
//
// LEER bis der Inhaber ein Hotel- oder Gastroprojekt mit schriftlicher
// Freigabe des Gastgebers liefert (hotel-contract.md 2.6, Design-Bibel §10.2
// „Projekt“, Wettbewerb P1). Ohne gültigen Eintrag rendert die Seite den
// Abschnitt NICHT – kein Leerzustand, keine Platzhalter, keine Herstellerprojekte
// (Ezarri- oder Binni-Projekte sind keine Platzhirsch-Referenzen).
//
// Ein Eintrag gilt nur, wenn ALLE Pflichtfelder gefüllt sind:
//   id          stabiler Schlüssel ("hotel-xyz-2027")
//   name        Name des Hauses, wie freigegeben
//   ort         Ort
//   jahr        Jahr der Fertigstellung (Zahl)
//   leistungen  { de: [..], en: [..] } – was Platzhirsch gemacht hat
//   freigabe    { datum: "JJJJ-MM-TT", durch: "Rolle, nicht Privatname", ablage: "Ort des Dokuments" }
// optional: kategorie ("4★"), text { de, en }, bild { src, alt { de, en }, credit }, url
// Bilder nur eigene Aufnahmen mit dokumentierten Rechten (Marktresearch/recht/bildrechte.csv).
//
// Reines Modul, node --test lädt es.

/** @type {ReadonlyArray<object>} */
export const HOTEL_REFERENCES = Object.freeze([]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const filled = (v) => typeof v === "string" && v.trim().length > 0;

/** true, wenn ein Eintrag alle Pflichtfelder für die Veröffentlichung hat. */
export function isPublishableReference(ref, locale = "de") {
  if (!ref || typeof ref !== "object") return false;
  const f = ref.freigabe;
  const list = ref.leistungen?.[locale];
  return (
    filled(ref.id) &&
    filled(ref.name) &&
    filled(ref.ort) &&
    Number.isInteger(ref.jahr) &&
    ref.jahr >= 2000 &&
    Array.isArray(list) &&
    list.some(filled) &&
    Boolean(f) &&
    DATE_RE.test(String(f.datum || "")) &&
    filled(f.durch) &&
    filled(f.ablage) &&
    (!ref.bild || (filled(ref.bild.src) && filled(ref.bild.alt?.[locale]) && filled(ref.bild.credit)))
  );
}

/** Die Einträge, die in `locale` gezeigt werden dürfen (sonst []). */
export function visibleReferences(locale = "de", list = HOTEL_REFERENCES) {
  return (Array.isArray(list) ? list : []).filter((ref) => isPublishableReference(ref, locale));
}
