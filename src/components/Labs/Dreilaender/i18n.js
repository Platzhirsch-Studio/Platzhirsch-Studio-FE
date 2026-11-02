// Sprachfassung der Dreiländer-Insel (01.11.2026, Gruppe schweiz-service).
// DE-Texte stehen hier und in calc.js/rules.js/rate.js (Mastertext); EN/FR/IT
// kommen als `copy` (serialisierbar) vom Server: src/lib/dreilaender/copy-intl.js.
// Rein (kein React): Server und Client.
import { PLACES } from "./geo";
import { COUNTRIES } from "./rules";

export const UI_DE = Object.freeze({
  mapStep: "1 · Karte",
  mapTitle: "Lochau liegt mittendrin",
  mapLead: "Tippen Sie auf einen Ort: Fahrzeit, Lieferung, Montage und Steuer für das jeweilige Land auf einen Blick.",
  live: "{place}, {country}, {time} ab Lochau",
  figcaption: "Karte schematisch. Fahrzeiten mit dem Auto ab Lochau: Richtwerte ohne Verkehr und Wartezeit an der Grenze.",
  details: "Details",
  chips: "Ort wählen (Pfeiltasten wechseln den Ort)",
  fromLochau: "ab Lochau",
  estimate: "(Richtwert)",
  steuer: "Steuer",
  lieferung: "Lieferung",
  montage: "Montage",
  cta: "Preis {forName} berechnen",
  calcStep: "2 · Preisrechner",
  calcTitle: "Was kostet mich das Möbel bei mir?",
  calcLead:
    "Geben Sie den österreichischen Bruttopreis ein. Wir zeigen, was in der Schweiz, in Liechtenstein oder in Deutschland daraus wird – je nach Weg über die Grenze.",
});

export const CALC_UI_DE = Object.freeze({
  estimateBadge: "Richtwert – Beispielwert",
  savings: "≈ {min}–{max} % unter dem AT-Bruttopreis",
  notCheaper: "nicht günstiger als der AT-Bruttopreis",
  condition: "Bedingung",
  yourPrice: "Ihr Preis",
  atGross: "AT-Brutto",
  showCalc: "Rechenweg anzeigen",
  hideCalc: "Rechenweg ausblenden",
  sum: "Summe",
  conversion: "Umrechnung mit 1 € = {rate} CHF; der Zoll rechnet mit eigenem Tageskurs. Mittelwert ≈ {mid}.",
  errEmpty: "Bitte einen Bruttopreis in Euro eingeben.",
  errNan: "Bitte nur Zahlen eingeben, z. B. 25.000 oder 1890,50.",
  errZero: "Bitte einen Betrag über 0 € eingeben.",
  errMax: "Bitte maximal 2.000.000 € eingeben.",
  errCalc: "Diese Eingabe können wir nicht berechnen.",
  legend: "Wohin geht das Möbel?",
  amountLabel: "Österreichischer Bruttopreis (inkl. 20 % USt)",
  amountHelp: "Zum Beispiel der Preis auf dem Preisschild im Showroom.",
  priceIn: "Ihr Preis {inName}",
  shortAbholung: "Abholung",
  shortLieferung: "Lieferung",
  detailsLink: "Details und Rechenweg",
  includeDelivery: "Lieferkosten einrechnen",
  includeDeliveryNote: "(Richtwert, verbindlich erst im Angebot)",
  net: "netto",
  noRate: "Ohne gültigen Kurs zeigen wir keine Franken-Beträge. Den Preis klären wir gerne persönlich.",
  empty: "Geben Sie links einen Betrag ein.",
  disclaimerTitle: "Richtwert, keine Steuerberatung.",
  disclaimerText:
    "Die Rechnung zeigt typische Wege nach heutigem Stand. Gebühren von Spediteuren und Lieferkosten sind Beispielwerte, der Zoll rechnet mit eigenem Tageskurs. Ihr verbindliches Angebot erhalten Sie persönlich.",
  termin: "Termin anfragen",
  kontakt: "Kontakt",
});

export const MAP_DE = Object.freeze({
  title: "Karte des Dreiländerecks mit Lochau im Zentrum",
  desc: "Schematische Karte von Bodensee und Rheintal. Orte in Österreich, Deutschland, der Schweiz und Liechtenstein sind auswählbar und zeigen Fahrzeit sowie Hinweise zu Lieferung, Montage und Steuer. Mit den Pfeiltasten wechseln Sie den Ort.",
  lake: "Bodensee",
  inset: "Ausschnitt 5-fach",
  countries: null,
});

/** "{a} und {b}" → Werte einsetzen. */
export const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars?.[k] ?? "");

/** Länder-Infos in der Sprache der Seite (Rechenwerte bleiben aus rules.js). */
export function localCountries(copy) {
  const tr = copy?.countries;
  if (!tr) return COUNTRIES;
  return Object.fromEntries(Object.entries(COUNTRIES).map(([code, c]) => [code, { ...c, ...tr[code] }]));
}

/** Orte mit Namen und Fahrzeit-Text der Sprache; labelLong für Screenreader. */
export function localPlaces(copy) {
  const tr = copy?.places || {};
  return PLACES.map((p) => ({ labelLong: p.label.replace("Min.", "Minuten"), ...p, ...tr[p.id] }));
}
