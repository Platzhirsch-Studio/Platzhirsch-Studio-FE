// src/components/Katalog/uebersichtRaster.js – sichtbare Kacheln je Kategorie in der
// Katalog-Übersicht (KatalogListe). Pure, ohne "@/"-Imports (node --test).
/**
 * QM R3: Übersicht je Kategorie nur volle Reihen – ab lg eine Reihe (3), darunter zwei Reihen
 * à 2 (4). Vorher bis zu 6 Kacheln mit Lücken bei 5, 2 oder 3 Treffern und rund 28 000 px
 * Seitenlänge am Desktop. „Alle … ansehen“ führt weiter zur vollständigen Kategorie.
 * @param {number} i Index in der Gruppe
 * @param {number} n Kacheln in der Gruppe
 * @returns {string} Klassen zum Ausblenden
 */
export function uebersichtSichtbar(i, n) {
  const lg = n >= 3 ? 3 : n;
  const klein = n >= 4 ? 4 : n >= 2 ? 2 : n;
  return [i >= klein ? "max-lg:hidden" : "", i >= lg ? "lg:hidden" : ""].filter(Boolean).join(" ");
}
