// src/lib/kueche/geraete.js
// Inhaber-Entscheidung Nr. 18 (30.10.2026, Marktresearch/digital/teamleiter/
// inhaber-entscheidungen.md): Geräte von Gaggenau, Miele, V-ZUG, BORA,
// Liebherr und Quooker, kuratiert in der Küchenplanung – ohne Preise, ohne Shop.
// Inhaber-Entscheidung Nr. 24 (31.10.2026, ersetzt die Einschränkung aus
// Nr. 18): Platzhirsch ist Händler dieser sechs Marken, Herstellerbilder
// dürfen verwendet werden. Der Händlersatz kommt NUR aus dem Claim-Register
// (dealerStatement/dealerStatementList, src/lib/legal/claims.js), nie aus
// diesen Daten oder den Texten. Weiterhin: keine Preise, keine Logos, keine
// Aussage, dass die Geräte im Showroom stehen.
//
// Bilder (`image`, optional, null = kein Bild): Herstellerbild UNVERÄNDERT
// (kein Beschnitt; Anzeige object-contain, data-pin-nopin), Quelle je Datei in
// docs/bildquellen/QUELLEN-kueche.md. Alt-Text in den Texten unter alt.<key>.
// Miele, BORA: leer (Herstellerseiten mit Bot-Schutz). V-ZUG: leer (das CDN
// liefert nur feste Seitenverhältnisse, Zuschnitt nicht ausschließbar).
// Weitere Bilder ergänzt das Daten-Team hier.
// Inhaber 31.10.2026 („alle Vorschaubilder gleich groß“): Marken ohne eigenes
// Bild zeigen ein Bild aus dem Herstellerkatalog (`katalogBild`: Produkt-Slug +
// Bildindex in src/lib/katalog/marken/<marke>.js; Quelle dort bzw. in
// docs/bildquellen/QUELLEN.md). Alle Karten haben denselben Bildrahmen (4:3).
//
// Hier stehen nur belegbare Stammdaten: Name (korrekte Schreibweise), Anker,
// Herkunftsland (ISO-Code; null = auf der Seite nicht genannt) und die
// Produktgruppen als Schlüssel. Alle sichtbaren Texte (Gruppen-, Länder-
// namen, Kurztexte je Marke) kommen aus den Messages (kuechengeraete.*,
// Vorschlag Marktresearch/digital/features/geraete-messages.json) bzw. bis
// zur Übernahme aus src/components/Kuechengeraete/geraeteCopy.js.
//
// Liebherr: Herkunft bewusst null – der Auftrag nennt kein Land (Konzernsitz
// Schweiz, Hausgeräte-Werke u. a. in Deutschland und Österreich); bis der
// Inhaber eine Angabe bestätigt, nennt die Seite kein Land.
//
// Rein und ohne "@/..."-Importe (node --test, tests/unit/kuechengeraete.test.mjs).

/** Pfad der Seite ohne Locale; in allen vier Sprachen gleich (keine Pfad-Übersetzung). */
export const GERAETE_PATH = "/kuechengeraete";
export const GERAETE_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Küchenplaner (nur Deutsch, /en|fr|it/kuechenplaner → 308 auf /de). */
export const PLANER_PATH = "/kuechenplaner";

const img = (src, width, height, source) => Object.freeze({ src, width, height, source });

export const GERAETE_MARKEN = Object.freeze([
  Object.freeze({
    id: "gaggenau", name: "Gaggenau", origin: "DE", groups: Object.freeze(["backofen", "dampfgarer", "kochfeld", "weinklima"]),
    image: img("/Images/Kueche/gaggenau-backofen-marmorwand.webp", 1600, 1203, "https://www.gaggenau.com/de/de"),
  }),
  Object.freeze({ id: "miele", name: "Miele", origin: "DE", groups: Object.freeze(["einbau", "geschirrspueler", "dampfgarer"]), image: null,
    katalogBild: Object.freeze({ produkt: "miele-dgc-7865", index: 1 }) }),
  Object.freeze({ id: "v-zug", name: "V-ZUG", origin: "CH", groups: Object.freeze(["dampfgarer", "backofen", "kuehlen"]), image: null,
    katalogBild: Object.freeze({ produkt: "v-zug-combair-v2000-45", index: 0 }) }),
  Object.freeze({ id: "bora", name: "BORA", origin: "DE", groups: Object.freeze(["kochfeldAbzug"]), image: null,
    // QM R3: 3:2-Raumbild (BORA Basic) statt 16:9-Streifen im 4:3-Rahmen
    katalogBild: Object.freeze({ produkt: "bora-basic", index: 1 }) }),
  Object.freeze({
    id: "liebherr", name: "Liebherr", origin: null, groups: Object.freeze(["kuehlen", "gefrieren", "weinklima"]),
    image: img("/Images/Kueche/liebherr-einbau-kuehl-gefrierkombinationen.webp", 1600, 900, "https://www.liebherr.com/de-at/gefrier-kuehlschraenke/hausgeraete-2224569"),
  }),
  Object.freeze({
    id: "quooker", name: "Quooker", origin: "NL", groups: Object.freeze(["kochendWasser"]),
    image: img("/Images/Kueche/quooker-fusion-round-edelstahl.webp", 1600, 1200, "https://www.quooker.at/"),
  }),
]);

/** Anker-ID einer Marke auf der Seite (#geraet-v-zug). */
export function geraetAnchor(id) {
  return `geraet-${id}`;
}

/** Schlüssel der Messages ohne Bindestrich (next-intl-Pfade): "v-zug" → "vzug". */
export function geraetKey(id) {
  return String(id).replace(/-/g, "");
}

/** Link in den Küchenplaner mit Gerät als Einstieg (?geraet=<id>; der Planer wertet Marke oder Produkt-Slug aus, src/app/[locale]/kuechenplaner/page.js). */
export function planerHref(id) {
  return id ? `${PLANER_PATH}?geraet=${encodeURIComponent(id)}` : PLANER_PATH;
}

/** Kontext für den Beratungsweg (withContext, src/lib/forms/pathContext.js). */
export function beratungContext(marke) {
  return marke ? { thema: "kueche", produkt: marke.name } : { thema: "kueche" };
}
