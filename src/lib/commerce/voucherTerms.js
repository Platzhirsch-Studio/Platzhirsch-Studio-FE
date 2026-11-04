// src/lib/commerce/voucherTerms.js
// Gutscheinbedingungen für /gutscheinbedingungen, Gutschein-PDF, Mail und
// Vorschau. Grundlage: Rechtspaket 06 Abschn. 1.2 mit den Auflösungen aus
// 00-rechtspaket-uebersicht.md (W3 unbefristet, W4 kein OS-Link, W5 Fernabsatz
// 14 Tage, W14 Aussteller, W15 Café getrennt). Kein Wort von "abgesichert".
//
// FREIGEGEBEN (Stand 03.11.2026): Wortlaut von der Kanzlei freigegeben
// (Inhaber-Entscheidung Nr. 11, 29.10.2026); die 7 Unternehmensangaben sind
// seit 03.11.2026 eingetragen (voucherTermsFields.js, Belege je Feld;
// Inhaber-Entscheidungen Nr. 17, 38, 40/45, 46). Der Text enthält keine eckigen
// Klammern mehr; TERMS_STATUS = "freigegeben" schaltet VOUCHER_MODE frei
// (mode.js). Test: tests/unit/recht-freigabe.test.mjs.
// Keine "@/..."-Importe.
import { ADDRESS, EMAIL, LEGAL_NAME, PHONE_DISPLAY, SITE_NAME } from "../site.js";

export const TERMS_STATUS = "freigegeben";

// Die 7 Unternehmensangaben stehen in voucherTermsFields.js (nur Daten).
export { TERMS_OWNER_FIELDS, termsFieldsOpen } from "./voucherTermsFields.js";
export const TERMS_TITLE = "Gutscheinbedingungen";
/** Stand der Bedingungen (JJJJ-MM-TT). Lesbar: termsStandDe(). */
export const TERMS_STAND = "2026-11-03";
export const termsStandDe = (iso = TERMS_STAND) => `Stand ${iso.split("-").reverse().join(".")}`;

/** Prüfmarker des Entwurfs – im freigegebenen Text kommen sie nicht mehr vor (termsOpenCounts() = 0). */
export const MARKERS = Object.freeze(["[anwaltlich prüfen]", "[Steuerberater]", "[vom Unternehmen auszufüllen]"]);

const AUSSTELLER = `${LEGAL_NAME}, FN 443753 d, Landesgericht Feldkirch, UID ATU70035339`;
const ANSCHRIFT = `${ADDRESS.street}, ${ADDRESS.postalCode} ${ADDRESS.city}, ${ADDRESS.country}`;

export const TERMS_SECTIONS = Object.freeze([
  {
    id: "aussteller",
    title: "1. Aussteller",
    paragraphs: [
      `Aussteller der Gutscheine ist die ${AUSSTELLER}, ${ANSCHRIFT} („Platzhirsch“, Marke „${SITE_NAME}“), Telefon ${PHONE_DISPLAY}, E-Mail ${EMAIL}.`,
    ],
  },
  {
    id: "arten",
    title: "2. Wertgutscheine",
    paragraphs: [
      "Gutscheine lauten auf einen Geldbetrag in Euro, ab 25 €. Der Betrag ist ein Bruttobetrag. Weil ein Gutschein für Waren mit unterschiedlichen Umsatzsteuersätzen eingelöst werden kann (zum Beispiel Möbel und Accessoires mit 20 %, Bildbände mit 10 %), ist er ein Mehrzweckgutschein im Sinne des Umsatzsteuergesetzes: Die Umsatzsteuer entsteht erst bei der Einlösung und wird auf der Rechnung über die eingelöste Ware ausgewiesen.",
      "Für unentgeltlich ausgegebene Aktionsgutscheine gelten die auf dem jeweiligen Gutschein genannten Bedingungen (Punkt 9).",
    ],
  },
  {
    id: "gueltigkeit",
    title: "3. Gültigkeit",
    paragraphs: [
      "Gekaufte Gutscheine sind unbefristet gültig: Wir setzen kein Ablaufdatum. Der Anspruch aus dem Gutschein verjährt erst nach der gesetzlichen Frist von 30 Jahren (§ 1478 ABGB). Auf jedem Gutschein steht „Gültig ohne Ablaufdatum“.",
    ],
  },
  {
    id: "einloesung",
    title: "4. Einlösung",
    paragraphs: [
      "Gutscheine können im Showroom in Lochau für Waren und Leistungen von Platzhirsch eingelöst werden, auch für Ausstellungsstücke aus dem Atelierverkauf, sowie für Bestellungen in unserem Onlineshop. Für den Onlineshop nennen Sie uns den Gutscheincode vor der Bestellung per E-Mail oder Telefon; wir verrechnen den Gutscheinwert mit Ihrer Bestellung und bestätigen Ihnen den Restbetrag, bevor Sie bezahlen.",
      "Gutscheine gelten für Einrichtung und Accessoires. Im Platzhirsch Café, Restaurant & Bar können sie nicht eingelöst werden.",
      "Mehrere Gutscheine können zusammen eingelöst werden. Übersteigt der Kaufpreis den Gutscheinwert, wird der Rest mit den angebotenen Zahlungsarten bezahlt.",
      "Gutscheine können nicht für den Kauf weiterer Gutscheine eingelöst werden.",
    ],
  },
  {
    id: "teileinloesung",
    title: "5. Teileinlösung und Restguthaben",
    paragraphs: [
      "Ein Gutschein kann in mehreren Teilbeträgen eingelöst werden. Das Restguthaben bleibt erhalten, wird im Gutscheinregister vermerkt und auf Wunsch schriftlich bestätigt. Es fallen keine Gebühren an.",
    ],
  },
  {
    id: "barabloese",
    title: "6. Keine Barablöse",
    paragraphs: [
      "Eine Auszahlung des Gutscheinwerts in bar oder per Überweisung ist ausgeschlossen, solange der Gutschein bei Platzhirsch eingelöst werden kann. Ausgenommen sind der Rücktritt nach Punkt 8, der Fall, dass Platzhirsch keine Waren oder Leistungen mehr anbietet, und alle Fälle, in denen das Gesetz eine Rückzahlung vorsieht. Dann wird der offene Wert erstattet.",
    ],
  },
  {
    id: "verlust",
    title: "7. Übertragbarkeit und Verlust",
    paragraphs: [
      "Gutscheine sind übertragbar. Platzhirsch darf an jede Person leisten, die den Gutschein oder den Gutscheincode vorlegt, es sei denn, Platzhirsch weiß oder muss wissen, dass sie nicht berechtigt ist.",
      "Bei Verlust sperrt Platzhirsch einen registrierten Gutschein auf Meldung an info@platzhirsch.studio und stellt über das noch nicht eingelöste Guthaben einen Ersatzgutschein aus, wenn der Erwerb nachgewiesen wird, zum Beispiel mit der Rechnung oder der Bestellnummer. Für Einlösungen, die vor dem Eingang der Verlustmeldung erfolgt sind, besteht kein Ersatzanspruch.",
    ],
  },
  {
    id: "ruecktritt",
    title: "8. Rücktrittsrecht beim Kauf auf Distanz",
    paragraphs: [
      "Wer als Verbraucherin oder Verbraucher einen Gutschein online, per E-Mail, Telefon oder über das Anfrageformular kauft, kann innerhalb von 14 Tagen ab Erhalt des Gutscheins ohne Angabe von Gründen vom Vertrag zurücktreten, solange der Gutschein noch nicht, auch nicht teilweise, eingelöst wurde. Die Widerrufsbelehrung mit dem Muster-Widerrufsformular steht auf der Gutschein-Seite und wird Ihnen mit der Bestellbestätigung bzw. mit Angebot und Rechnung zugesandt. Den Rücktritt können Sie auch über die Schaltfläche „Vertrag widerrufen“ auf unserer Website erklären; den Eingang bestätigen wir unverzüglich per E-Mail.",
    ],
  },
  {
    id: "aktion",
    title: "9. Aktions- und Gratisgutscheine",
    paragraphs: [
      "Unentgeltlich ausgegebene Gutscheine gelten bis zu dem aufgedruckten Datum, sind nicht übertragbar und nicht in bar ablösbar. Je Kauf kann ein Aktionsgutschein eingelöst werden; mit gekauften Wertgutscheinen ist er kombinierbar, soweit auf dem Aktionsgutschein nichts anderes steht.",
    ],
  },
  {
    id: "schluss",
    title: "10. Schlussbestimmungen",
    paragraphs: [
      "Es gilt österreichisches Recht unter Ausschluss der Verweisungsnormen und des UN-Kaufrechts. Für Verbraucherinnen und Verbraucher mit gewöhnlichem Aufenthalt in einem anderen Staat bleibt der Schutz der zwingenden Bestimmungen dieses Staates unberührt. Für Klagen gegen Verbraucher mit Wohnsitz in Österreich gilt § 14 KSchG; gegenüber Unternehmern ist das sachlich zuständige Gericht in Wien ausschließlich zuständig.",
      "An Verfahren vor einer Verbraucherschlichtungsstelle nehmen wir nicht teil und sind dazu auch nicht verpflichtet (§ 19 AStG). Bei Fragen oder Beschwerden wenden Sie sich bitte an info@platzhirsch.studio oder +43 5574 46255.",
    ],
  },
]);

/** Anzahl der Prüfmarker je Markierung (im freigegebenen Text überall 0). */
export function termsOpenCounts(sections = TERMS_SECTIONS) {
  const text = sections.flatMap((s) => s.paragraphs).join("\n");
  // "[anwaltlich prüfen: …]" zählt wie "[anwaltlich prüfen]".
  return Object.fromEntries(MARKERS.map((m) => [m, text.split(m.slice(0, -1)).length - 1]));
}

/**
 * Teilt einen Absatz in Text und Markierungen [ … ] auf, damit die Seite
 * offene Stellen sichtbar hervorheben kann (im freigegebenen Text nur Text).
 * @returns {Array<{ type: "text" | "mark", value: string }>}
 */
export function splitMarks(paragraph) {
  const parts = [];
  const re = /\[[^\]]+\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(paragraph))) {
    if (m.index > last) parts.push({ type: "text", value: paragraph.slice(last, m.index) });
    parts.push({ type: "mark", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < paragraph.length) parts.push({ type: "text", value: paragraph.slice(last) });
  return parts;
}

// ---------- Inhaberfragen 2 und 3 (QA Stripe P2-3), entschieden 03.11.2026 ----------
// Formular, Erfolgsseite, PDF und Gutschein-Seite lesen ihre Texte von hier.
//   VOUCHER_TAX       "mehrzweck"   Mehrzweckgutschein (Feld steuerart; Steuerberater bestätigt noch)
//   VOUCHER_VALIDITY  "unbefristet" kein Ablaufdatum (Feld gueltigkeit)
// Beide gesetzt → VOUCHER_MODE=stripe darf wirken (mode.js).
export const VOUCHER_TAX = "mehrzweck";
export const VOUCHER_VALIDITY = "unbefristet";

export const VOUCHER_TAX_VALUES = Object.freeze(["einzweck", "mehrzweck"]);
export const VOUCHER_VALIDITY_VALUES = Object.freeze(["unbefristet", "30_jahre"]);

/** Aktueller Stand der beiden Entscheidungen. */
export const voucherDecisions = () => ({ tax: VOUCHER_TAX, validity: VOUCHER_VALIDITY });

/** Offene Entscheidungen (Namen) – leer, wenn beide gesetzt sind. */
export function voucherDecisionsOpen({ tax, validity } = voucherDecisions()) {
  const open = [];
  if (!VOUCHER_TAX_VALUES.includes(tax)) open.push("VOUCHER_TAX (Einzweck/Mehrzweck)");
  if (!VOUCHER_VALIDITY_VALUES.includes(validity)) open.push("VOUCHER_VALIDITY (Gültigkeit)");
  return open;
}

/**
 * Beschriftung des Gesamtpreises beim Gutscheinkauf.
 *   einzweck   USt steht beim Verkauf fest → "Gesamtpreis inkl. USt"
 *   mehrzweck  USt fällt erst bei Einlösung an → kein "inkl. USt", Hinweis
 *   offen      neutral "Gesamtpreis"
 * @returns {{ total: string, note: string }}
 */
export function voucherPriceLabel(tax = VOUCHER_TAX) {
  if (tax === "einzweck") return { total: "Gesamtpreis inkl. USt", note: "" };
  if (tax === "mehrzweck") return { total: "Gesamtpreis", note: "Die Umsatzsteuer wird bei der Einlösung berechnet." };
  return { total: "Gesamtpreis", note: "" };
}

/**
 * Gültigkeitstexte für PDF, Mail und Gutschein-Seite.
 * @returns {{ print: string, factTitle: string, factText: string }}
 */
export function voucherValidityText(validity = VOUCHER_VALIDITY) {
  if (validity === "unbefristet") return { print: "Gültig ohne Ablaufdatum", factTitle: "Ohne Ablaufdatum", factText: "Gekaufte Gutscheine gelten unbefristet." };
  if (validity === "30_jahre") return { print: "Einlösbar innerhalb der gesetzlichen Frist von 30 Jahren", factTitle: "Lange einlösbar", factText: "Gekaufte Gutscheine sind innerhalb der gesetzlichen Frist von 30 Jahren einlösbar." };
  return { print: "Gültigkeit laut Gutscheinbedingungen", factTitle: "Gültigkeit", factText: "Wie lange Gutscheine gelten, steht in den Gutscheinbedingungen." };
}
