// src/lib/commerce/priceRules.js
// Preisangaben im Atelierverkauf (Masterplan AP9 Nr. 2, Rechtspaket 4.2, W8,
// Design-Bibel "Ehrliche Preise").
//
// Regeln, die hier erzwungen werden:
//   - Gesamtpreis in Euro inklusive Umsatzsteuer (PAngV/PrAG), runde Beträge
//     ohne ",99"-Optik werden nicht verändert, aber auch nicht erzeugt.
//   - Pflichtzusätze an jedem Preis: "inkl. USt", "zzgl. Lieferung nach
//     Aufwand", "Standort: Showroom Lochau".
//   - KEINE Streichpreise, kein "statt", keine Prozentangabe, kein "bis zu".
//     Diese Funktionen kennen gar kein Feld für einen früheren Preis.
//   - UVP des Herstellers für Neuware nur mit Beleg (Betrag + Stand + Quelle),
//     sonst wird sie nicht angezeigt (W8 b) [anwaltlich prüfen: UVP-Vergleich
//     bei Ausstellungsware].
//   - Der "niedrigste Preis der letzten 30 Tage" (W8 a) wird nicht erzeugt:
//     Es gibt noch keine Preis-Historie. Ohne Historie darf es keinen
//     Vergleichspreis geben, die UVP-Zeile ist dann die einzige Ergänzung.
// Keine "@/..."-Importe: direkt mit `node --test` getestet.

export const VAT_NOTE = "inkl. USt";
export const DELIVERY_NOTE = "zzgl. Lieferung nach Aufwand";
export const LOCATION_NOTE = "Standort: Showroom Lochau";
export const PRICE_NOTES = Object.freeze([VAT_NOTE, DELIVERY_NOTE, LOCATION_NOTE]);

// Wörter, die in Titel, Zustands- oder Preistexten aus dem Sheet nicht
// vorkommen dürfen (Rechtspaket 03 R-P1–P5, 06 4.3, W8; Bibel §11).
// Eine Zeile mit einem dieser Wörter wird übersprungen (atelierSource.js).
const FORBIDDEN = [
  { id: "statt", re: /(?<![\p{L}])statt(?![\p{L}])/iu },
  { id: "prozent", re: /%|(?<![\p{L}])prozent(?![\p{L}])/iu },
  { id: "rabatt", re: /rabatt|reduziert|preisnachlass|sonderpreis|schnäppchen|sparen/iu },
  { id: "bis-zu", re: /(?<![\p{L}])bis\s+zu(?![\p{L}])/iu },
  { id: "streichpreis", re: /streichpreis|durchgestrichen/iu },
  { id: "wie-neu", re: /wie\s+neu|neuwertig/iu },
  { id: "abgesichert", re: /abgesichert/iu },
  { id: "knappheit", re: /nur\s+noch|letzte\s+chance|solange\s+der\s+vorrat/iu },
];

/** Ids der verbotenen Formulierungen in `text` ([] = in Ordnung). */
export function priceTextIssues(text) {
  const s = String(text ?? "");
  if (!s) return [];
  return FORBIDDEN.filter((f) => f.re.test(s)).map((f) => f.id);
}

/**
 * Euro-Betrag in österreichischer Schreibweise: 1290 → "1.290 €",
 * 89.5 → "89,50 €". Ungültige Werte → "".
 */
export function formatEuro(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n < 0) return "";
  const cents = Math.round(n * 100);
  const euros = Math.trunc(cents / 100);
  const rest = cents % 100;
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return rest ? `${grouped},${String(rest).padStart(2, "0")} €` : `${grouped} €`;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-11-02" → "02.11.2026", sonst "". */
export function formatDate(iso) {
  const m = ISO_DATE.exec(String(iso ?? "").trim());
  if (!m) return "";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (d.getUTCMonth() !== Number(m[2]) - 1) return "";
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/**
 * UVP-Zeile oder null. Nur wenn Betrag, Stand (Datum) und Quelle belegt sind.
 * Bewusst ohne Differenz, ohne Prozent und ohne "statt".
 */
export function uvpNote({ uvp, uvpStand, uvpQuelle } = {}) {
  const amount = Number(uvp);
  const date = formatDate(uvpStand);
  const source = String(uvpQuelle ?? "").trim();
  if (!Number.isFinite(amount) || amount <= 0 || !date || !source) return null;
  return `Unverbindliche Preisempfehlung des Herstellers für Neuware: ${formatEuro(amount)} (Stand ${date}, Quelle: ${source})`;
}

/**
 * Alles, was neben einem Atelier-Stück zum Preis steht.
 * @param {{ preis: number, uvp?: number, uvpStand?: string, uvpQuelle?: string }} item
 * @returns {{ price: string, notes: string[], uvp: string|null } | null}
 *          null, wenn kein gültiger Preis vorliegt (dann zeigt die Seite das Stück nicht).
 */
export function priceDisplay(item) {
  const price = formatEuro(item?.preis);
  if (!price || !(Number(item?.preis) > 0)) return null;
  return { price, notes: [...PRICE_NOTES], uvp: uvpNote(item) };
}

/** Preis als schema.org-Wert ("1290.00"), oder null. */
export function schemaPrice(amount) {
  const n = Number(amount);
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : null;
}
