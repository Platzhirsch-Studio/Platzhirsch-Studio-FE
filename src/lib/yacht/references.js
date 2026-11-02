// src/lib/yacht/references.js – Fallstudien-Slot der Seite /yacht-interior
// (Rat 9,5 C7, seo 11). LEER, bis der Inhaber ein Boots- oder Bootshausprojekt
// mit schriftlicher Freigabe des Eigners liefert. Ohne gültigen Eintrag rendert
// die Seite den Abschnitt NICHT – kein Leerzustand, kein Platzhalter. Die
// Navetta 42 ist ein Minotti-Referenzprojekt, KEINE Platzhirsch-Fallstudie, und
// gehört nie hierher; KI-Konzepte ebenso wenig.
//
// Pflichtfelder wie beim Hotel (src/lib/hotel/references.js, dieselbe Prüfung):
//   id, name (Boot oder Bootshaus, wie freigegeben), ort (Hafen/See), jahr,
//   leistungen { de: [..], en: [..] },
//   freigabe { datum: "JJJJ-MM-TT", durch: "Rolle", ablage: "Ort des Dokuments" }
// optional: kategorie ("Motoryacht 12 m"), text { de, en }, bild { src, alt { de, en }, credit }
// Bilder nur eigene Aufnahmen mit dokumentierten Rechten (bildrechte.csv).
// Reines Modul (node --test).
import { isPublishableReference } from "../hotel/references.js";

/** @type {ReadonlyArray<object>} */
export const YACHT_REFERENCES = Object.freeze([]);

/** Die Einträge, die in `locale` gezeigt werden dürfen (sonst []). */
export function visibleYachtReferences(locale = "de", list = YACHT_REFERENCES) {
  return (Array.isArray(list) ? list : []).filter((ref) => isPublishableReference(ref, locale));
}

export { isPublishableReference };
