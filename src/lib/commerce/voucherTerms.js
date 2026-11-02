// src/lib/commerce/voucherTerms.js
// ENTWURF der Gutscheinbedingungen für /gutscheinbedingungen und die
// Vorschau. Grundlage: Rechtspaket 06 Abschn. 1.2 mit den Auflösungen aus
// 00-rechtspaket-uebersicht.md:
//   W3  gekaufte Gutscheine unbefristet
//   W4  kein Link zur OS-Plattform (abgeschaltet seit 20.07.2025)
//   W5  Anfrage + Rechnung ist Fernabsatz: 14 Tage Rücktrittsrecht
//   W14 Aussteller bis zur Eintragung der Handels-GmbH offen (Kanzlei)
//   W15 Café: zum Start getrennt bzw. ausgenommen (Entscheidung offen)
// Jede offene Stelle trägt [anwaltlich prüfen], [Steuerberater] oder
// [vom Unternehmen auszufüllen]. Die Seite ist noindex, solange STATUS
// "entwurf" ist. Kein Wort von "abgesichert" (06 1.4).
// Keine "@/..."-Importe.

// Kanzlei-Freigabe der Rechtstexte liegt vor (Inhaber-Entscheidung Nr. 11,
// 29.10.2026). TERMS_STATUS bleibt trotzdem "entwurf", solange eines der 7
// Felder in TERMS_OWNER_FIELDS (voucherTermsFields.js) leer ist: sonst stünden Platzhalter in
// Bedingungen, die Kundinnen und Kunden binden. Erst wenn alle 7 Werte
// wörtlich eingetragen und die Absätze unten entsprechend gefasst sind (ohne
// eckige Klammern), wird TERMS_STATUS = "freigegeben" gesetzt
// (Test: tests/unit/recht-freigabe.test.mjs). Liste für den Inhaber:
// Marktresearch/digital/teamleiter/freigaben-recht.md.
export const TERMS_STATUS = "entwurf";

// Die 7 offenen Felder stehen in voucherTermsFields.js (eigene kleine Datei,
// nur Daten, damit der Inhaber dort wörtlich einträgt).
export { TERMS_OWNER_FIELDS, termsFieldsOpen } from "./voucherTermsFields.js";
export const TERMS_TITLE = "Gutscheinbedingungen";
export const TERMS_STAND = "Entwurf vom 26.10.2026";

export const MARKERS = Object.freeze(["[anwaltlich prüfen]", "[Steuerberater]", "[vom Unternehmen auszufüllen]"]);

export const TERMS_SECTIONS = Object.freeze([
  {
    id: "aussteller",
    title: "1. Aussteller",
    paragraphs: [
      "Aussteller der Gutscheine ist [Firmenwortlaut der ausgebenden Gesellschaft, Firmenbuchnummer, Firmenbuchgericht, UID], Landstraße 11, 6911 Lochau, Österreich („Platzhirsch“). [anwaltlich prüfen: welche Gesellschaft bis zur Eintragung der Handels-GmbH ausgibt, Rechtspaket W14]",
    ],
  },
  {
    id: "arten",
    title: "2. Wertgutscheine",
    paragraphs: [
      "Gutscheine lauten auf einen Geldbetrag in Euro, ab 25 €. Der Betrag ist ein Bruttobetrag einschließlich der bei Einlösung geltenden Umsatzsteuer. [Steuerberater: Einzweck- oder Mehrzweckgutschein]",
      "Für unentgeltlich ausgegebene Aktionsgutscheine gelten die auf dem jeweiligen Gutschein genannten Bedingungen (Punkt 9).",
    ],
  },
  {
    id: "gueltigkeit",
    title: "3. Gültigkeit",
    paragraphs: [
      "Gekaufte Gutscheine sind unbefristet gültig. Sie können innerhalb der gesetzlichen Verjährungsfrist eingelöst werden. Auf jedem Gutschein steht „Gültig ohne Ablaufdatum“. [anwaltlich prüfen: „unbefristet“ und „Verjährungsfrist“ widersprechen sich, eine Formulierung wählen]",
    ],
  },
  {
    id: "einloesung",
    title: "4. Einlösung",
    paragraphs: [
      "Gutscheine können im Showroom in Lochau für Waren und Leistungen von Platzhirsch eingelöst werden, auch für Ausstellungsstücke aus dem Atelierverkauf. [vom Unternehmen auszufüllen: Einlösung auch online ja/nein]",
      "Café: [vom Unternehmen auszufüllen: Variante A, der Gutschein gilt nicht im Café, das von einer anderen Gesellschaft betrieben wird; Variante B, eigener Café-Gutschein] [Steuerberater, Rechtspaket W15]",
      "Mehrere Gutscheine können zusammen eingelöst werden. Übersteigt der Kaufpreis den Gutscheinwert, wird der Rest mit den angebotenen Zahlungsarten bezahlt.",
      "Gutscheine können nicht für den Kauf weiterer Gutscheine eingelöst werden. [anwaltlich prüfen]",
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
      "Eine Auszahlung des Gutscheinwerts in bar oder per Überweisung ist ausgeschlossen, solange der Gutschein bei Platzhirsch eingelöst werden kann. Ausgenommen sind der Rücktritt nach Punkt 8, der Fall, dass Platzhirsch keine Waren oder Leistungen mehr anbietet, und alle Fälle, in denen das Gesetz eine Rückzahlung vorsieht. Dann wird der offene Wert erstattet. [anwaltlich prüfen]",
    ],
  },
  {
    id: "verlust",
    title: "7. Übertragbarkeit und Verlust",
    paragraphs: [
      "Gutscheine sind übertragbar. Platzhirsch darf an jede Person leisten, die den Gutschein oder den Gutscheincode vorlegt, es sei denn, Platzhirsch weiß oder muss wissen, dass sie nicht berechtigt ist.",
      "Bei Verlust sperrt Platzhirsch einen registrierten Gutschein auf Meldung und stellt über das noch nicht eingelöste Guthaben einen Ersatzgutschein aus, wenn der Erwerb nachgewiesen wird, zum Beispiel mit der Rechnung. [anwaltlich prüfen: Haftung vor der Sperrmeldung]",
    ],
  },
  {
    id: "ruecktritt",
    title: "8. Rücktrittsrecht beim Kauf auf Distanz",
    paragraphs: [
      "Wer als Verbraucherin oder Verbraucher einen Gutschein per E-Mail, Telefon oder über das Anfrageformular kauft, kann innerhalb von 14 Tagen ab Erhalt des Gutscheins ohne Angabe von Gründen vom Vertrag zurücktreten, solange der Gutschein noch nicht, auch nicht teilweise, eingelöst wurde. Die Widerrufsbelehrung und das Muster-Widerrufsformular erhalten Sie mit dem Angebot und der Rechnung. [anwaltlich prüfen: Widerrufsbelehrung, Formular und Seite „Vertrag widerrufen“, Rechtspaket W5]",
    ],
  },
  {
    id: "aktion",
    title: "9. Aktions- und Gratisgutscheine",
    paragraphs: [
      "Unentgeltlich ausgegebene Gutscheine gelten bis zu dem aufgedruckten Datum, sind nicht übertragbar und nicht in bar ablösbar. [vom Unternehmen auszufüllen: Kombinierbarkeit]",
    ],
  },
  {
    id: "schluss",
    title: "10. Schlussbestimmungen",
    paragraphs: [
      "Es gilt österreichisches Recht unter Ausschluss der Verweisungsnormen und des UN-Kaufrechts. Für Verbraucherinnen und Verbraucher mit gewöhnlichem Aufenthalt in einem anderen Staat bleibt der Schutz der zwingenden Bestimmungen dieses Staates unberührt. Für Klagen gegen Verbraucher mit Wohnsitz in Österreich gilt § 14 KSchG. [anwaltlich prüfen: Schlichtungsstelle nach § 19 AStG]",
    ],
  },
]);

/** Anzahl der offenen Stellen je Markierung. */
export function termsOpenCounts(sections = TERMS_SECTIONS) {
  const text = sections.flatMap((s) => s.paragraphs).join("\n");
  // "[anwaltlich prüfen: …]" zählt wie "[anwaltlich prüfen]".
  return Object.fromEntries(MARKERS.map((m) => [m, text.split(m.slice(0, -1)).length - 1]));
}

/**
 * Teilt einen Absatz in Text und Markierungen [ … ] auf, damit die Seite
 * offene Stellen sichtbar hervorheben kann.
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

// ---------- Offene Inhaberfragen 2 und 3 (QA Stripe P2-3) ----------
// Steuerliche Art und Gültigkeit stehen NICHT fest im Code: Formular,
// Erfolgsseite, PDF und Gutschein-Seite lesen ihre Texte von hier. Beide
// Werte werden MIT der Freigabe gesetzt (Freigabe-Checkliste in
// Marktresearch/digital/features/stripe-zahlung.md). Solange einer offen
// (null) ist, wirkt VOUCHER_MODE=stripe nicht (Rückfall "anfrage", mode.js),
// und die Texte bleiben neutral (kein "inkl. USt", kein "unbefristet").
//   VOUCHER_TAX       "einzweck" | "mehrzweck" | null   (Frage 2, Steuerberater)
//   VOUCHER_VALIDITY  "unbefristet" | "30_jahre" | null (Frage 3, Kanzlei)
export const VOUCHER_TAX = null;
export const VOUCHER_VALIDITY = null;

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
