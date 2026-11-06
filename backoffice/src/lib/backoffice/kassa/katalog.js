// Kassa – Kategorien und Muster-Katalog (Team B-KAS). Kategorien der Verkaufsfläche (Lounge §7.4: runde
// Kategorien-Kacheln) und – nur für den Mock – ein kleiner Accessoire-Katalog mit Bildern aus
// public/entwurf/lounge (Kopien aus public/Images, unverändert). Im Frappe-Modus kommen Produkte aus
// `page.kassen_katalog` / `page.suche_produkt` (PH Produkt) und die Schnelltasten aus `PH Kassa Schnelltaste`.
// Preise sind Beispielwerte, keine Geschäftszahlen. Reines Modul.

export const KATEGORIEN = Object.freeze([
  { id: "alle", titel: "Alle", icon: "LayoutGrid" },
  { id: "licht", titel: "Leuchten", icon: "Lamp" },
  { id: "duft", titel: "Kerzen & Duft", icon: "Flame" },
  { id: "glas", titel: "Glas", icon: "Wine" },
  { id: "objekt", titel: "Objekte", icon: "Gem" },
  { id: "textil", titel: "Textil", icon: "Layers" },
  { id: "gutschein", titel: "Gutschein", icon: "Gift" },
]);

/** PH Produkt.kategorie (Sortiment) → Kassa-Kategorie; unbekannt → „objekt“. */
export function kategorieFuer(kategorie = "") {
  const k = String(kategorie).toLowerCase();
  if (/leucht|lampe|licht/.test(k)) return "licht";
  if (/kerze|duft/.test(k)) return "duft";
  if (/glas|vase/.test(k)) return "glas";
  if (/textil|kissen|decke|teppich|plaid/.test(k)) return "textil";
  if (/gutschein/.test(k)) return "gutschein";
  return "objekt";
}

const B = (n) => `/entwurf/lounge/${n}`;

/** Muster-Accessoires (Mock). EANs mit gültiger Prüfziffer, Präfix 200 (innerbetrieblich). */
export const MOCK_KATALOG = Object.freeze([
  { produkt: "acc-bell-portable", bezeichnung: "Bell Portable", marke: "Tom Dixon", kategorie: "licht", einzel_brutto_cent: 24500, steuersatz: "Normal 20", bild: B("p-bell-leuchte.webp"), ean: "2000000010014", lager: 3 },
  { produkt: "acc-bellhop", bezeichnung: "Bellhop Unplugged", marke: "Flos", kategorie: "licht", einzel_brutto_cent: 18900, steuersatz: "Normal 20", bild: B("p-flos-bellhop.webp"), ean: "2000000020020", lager: 5 },
  { produkt: "acc-stone-portable", bezeichnung: "Stone Portable", marke: "Tom Dixon", kategorie: "licht", einzel_brutto_cent: 39500, steuersatz: "Normal 20", bild: B("p-stone-leuchte.webp"), ean: "2000000030036", lager: 2 },
  { produkt: "acc-altair", bezeichnung: "Altaïr Duftkerze", marke: "Trudon", kategorie: "duft", einzel_brutto_cent: 12500, steuersatz: "Normal 20", bild: B("p-trudon-kerze.webp"), ean: "2000000040042", lager: 12 },
  { produkt: "acc-bordeaux", bezeichnung: "Bordeaux Glas", marke: "Zalto", kategorie: "glas", einzel_brutto_cent: 6900, steuersatz: "Normal 20", bild: B("p-zalto-bordeaux.webp"), ean: "2000000050058", lager: 24 },
  { produkt: "acc-astro-loewe", bezeichnung: "Astro Löwe", marke: "Kähler", kategorie: "objekt", einzel_brutto_cent: 5900, steuersatz: "Normal 20", bild: B("p-kaehler-loewe.webp"), ean: "2000000060064", lager: 4 },
  { produkt: "acc-curve", bezeichnung: "Curve Kerzenhalter", marke: "Lyngby", kategorie: "objekt", einzel_brutto_cent: 4900, steuersatz: "Normal 20", bild: B("p-lyngby-halter.webp"), ean: "2000000070070", lager: 9 },
]);

/** Gutschein-Kachel und Schnellwerte (Konzept A6: „Gutschein“ → „50 €“ übernimmt sofort). */
export const GUTSCHEIN_WERTE = Object.freeze([2500, 5000, 10000, 25000]);

export function mockProdukt(id) {
  return MOCK_KATALOG.find((p) => p.produkt === id || p.ean === id) || null;
}
