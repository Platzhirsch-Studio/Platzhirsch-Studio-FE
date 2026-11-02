// src/lib/content/ortsMarken.js
// Block „Bei uns als Händler“ auf fünf Stadtseiten (/de/designermoebel-<ort>,
// lokal-seo REPORT 31.10.2026): je Ort ein eigener Schwerpunkt aus den belegten
// Marken, ohne neue URL (kein Marke × Ort, kein Doorway).
//
// Regeln:
// - Händler-Wortlaut NUR aus src/lib/legal/claims.js (dealerStatementList,
//   dealerTitleWord); Marken laufen durch isVerifiedDealerBrand(), nicht belegte
//   fallen still heraus. Der eigene Ortstext (`text`) enthält kein Händlerwort.
// - Nur Fakten, die auf den Seiten bzw. in src/lib/** schon stehen (Fahrzeiten,
//   Zoll/MWST, Gerätebeschreibungen aus geraeteCopy.js, Ezarri-Glasmosaik und
//   Muster aus src/lib/ezarri/copy.js). Keine Preise, keine Superlative.
// - St. Gallen: Schweizer Schreibung (kein „ß“), keine Service-Aussage zu V-ZUG
//   in der Schweiz; /einkaufen-aus-der-schweiz ist ein Entwurf (noindex) und
//   wird deshalb (noch) nicht verlinkt – statt dessen der freigegebene Ratgeber.
// - Höchstens drei Themenlinks je Seite, Ankertexte je Ort verschieden.
//
// Pure module (relative imports only), so node --test can load it.
import { dealerStatementList, dealerTitleWord, isVerifiedDealerBrand } from "../legal/claims.js";

export const ORTS_MARKEN_MAX_LINKS = 3;

/**
 * @typedef {{ href: string, label: string }} OrtsMarkenLink
 * @typedef {{ eyebrow: string, brands: string[], text: string, links: OrtsMarkenLink[] }} OrtsMarkenEintrag
 */

/** @type {Readonly<Record<string, OrtsMarkenEintrag>>} */
export const ORTS_MARKEN = Object.freeze({
  "/designermoebel-bregenz": {
    eyebrow: "Minotti Studio, Outdoor und Pool",
    brands: ["minotti", "ezarri"],
    text:
      "Für Bregenz liegt das Minotti Studio rund 5 Minuten entfernt: Sofas, Sessel und Tische von Minotti sehen Sie dort im Original, zu den Outdoor-Kollektionen für Terrasse und Garten beraten wir Sie. Für Pool, Bad und Außenbereich planen wir das Glasmosaik von Ezarri mit. Muster bestellen wir für Ihren Termin.",
    links: [
      { href: "/ueber-uns/marken/minotti", label: "Das Minotti Studio in Lochau kennenlernen" },
      { href: "/ezarri", label: "Ezarri-Glasmosaik für Pool und Terrasse" },
    ],
  },
  "/designermoebel-lindau": {
    eyebrow: "Am See: drinnen und draußen",
    brands: ["minotti", "ezarri"],
    text:
      "Von Lindau sind Sie direkt hinter der Grenze im Minotti Studio. Neben Sofas und Sesseln für den Wohnraum beraten wir Sie dort zu den Outdoor-Kollektionen von Minotti für Terrasse und Garten am See. Für Pool und Dusche planen wir das Glasmosaik von Ezarri ein. Zoll fällt keiner an, Österreich und Deutschland liegen im EU-Binnenmarkt.",
    links: [
      { href: "/ueber-uns/marken/minotti", label: "Minotti für Wohnraum und Terrasse" },
      { href: "/ezarri", label: "Mosaik von Ezarri für Pool und Dusche" },
    ],
  },
  "/designermoebel-dornbirn": {
    eyebrow: "Küchengeräte für Dornbirn",
    brands: ["gaggenau", "bora", "quooker"],
    text:
      "Wer in Dornbirn eine Küche plant, plant die Geräte von Anfang an mit: Backöfen und Dampfgarer von Gaggenau, Kochfelder mit integriertem Abzug von BORA und die Quooker-Armatur, die auch kochendes Wasser liefert. Bei einem Neubau stimmen wir Nischen, Anschlüsse und Lüftung am besten schon zum Rohbau ab.",
    links: [
      { href: "/kuechengeraete", label: "Einbaugeräte von Gaggenau bis Quooker" },
      { href: "/kuechen-vorarlberg", label: "Küche mit Geräten aus einer Hand planen" },
    ],
  },
  "/designermoebel-st-gallen": {
    eyebrow: "Einkaufen aus der Schweiz",
    brands: ["minotti", "classicon"],
    text:
      "Von St. Gallen sind es 30 bis 40 Minuten über St. Margrethen nach Lochau. Wie Ihre Möbel über die Grenze kommen, besprechen wir vor dem Kauf mit Ihnen: Ausfuhr aus Österreich, Einfuhr in die Schweiz mit 8,1 % MWST nach den Regeln des BAZG.",
    links: [
      { href: "/ratgeber/moebel-aus-oesterreich-in-die-schweiz", label: "Ratgeber: Möbel aus Österreich in die Schweiz einführen" },
      { href: "/ueber-uns/marken/minotti", label: "Minotti Studio – 30 bis 40 Minuten ab St. Gallen" },
    ],
  },
  "/designermoebel-friedrichshafen": {
    eyebrow: "Küche für Friedrichshafen",
    brands: ["gaggenau", "miele", "liebherr"],
    text:
      "Für eine neue Küche in Friedrichshafen planen wir Möbel und Geräte zusammen: Gaggenau und Miele für Backen, Dampfgaren und Spülen, Liebherr für Kühlen und Wein. Wir klären mit Ihnen, ob Geräte hinter Möbelfronten verschwinden oder sichtbar bleiben. Zoll fällt beim Kauf in Österreich keiner an.",
    links: [
      { href: "/kuechen-vorarlberg", label: "Unser Küchenstudio in Lochau" },
      { href: "/kuechengeraete", label: "Küchengeräte, die wir einplanen" },
      { href: "/ratgeber/was-kostet-eine-designerkueche", label: "Was kostet eine Designerküche?" },
    ],
  },
});

/** Belegte Marken (Slugs) eines Eintrags, in der Reihenfolge des Eintrags. */
export function verifiedBrands(brands) {
  return [...new Set((brands || []).filter(isVerifiedDealerBrand))];
}

/**
 * Daten für den Block einer Stadtseite, sonst null:
 * { eyebrow, heading, statement, text, links }. `heading` und `statement`
 * kommen aus dem Claim-Register; ohne belegte Marke gibt es keinen Block.
 */
export function ortsMarkenBlock(path) {
  const entry = ORTS_MARKEN[path];
  if (!entry) return null;
  const brands = verifiedBrands(entry.brands);
  const statement = dealerStatementList(brands, "de");
  if (!brands.length || !statement) return null;
  // Überschrift „Bei uns als …“ mit dem Wort der ersten Marke, die eines hat
  // (Studio-Marken haben keines, ihr Wortlaut steht im Satz).
  const word = brands.map((b) => dealerTitleWord(b, "de")).find(Boolean);
  const heading = word ? `Bei uns als ${word}` : "Bei uns in Lochau";
  return {
    eyebrow: entry.eyebrow,
    heading,
    statement,
    text: entry.text,
    links: entry.links.slice(0, ORTS_MARKEN_MAX_LINKS),
  };
}
