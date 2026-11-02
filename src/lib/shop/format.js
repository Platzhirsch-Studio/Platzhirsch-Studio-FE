// src/lib/shop/format.js – Beträge in Cent → „€ 12,50“ (Browser und Server). Rein.
const NUM = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };
export const euro = (cent, locale = "de") =>
  new Intl.NumberFormat(NUM[locale] || "de-AT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((cent || 0) / 100);

// QM wm-fix3: backoffice names carry straight quotes (Reeves "Lounge sofa").
// Shown with the typographic pair of the page language; the name itself is
// not changed. Only balanced pairs are replaced.
const QUOTES = { de: ["„", "“"], en: ["“", "”"], fr: ["« ", " »"], it: ["«", "»"] };
export const typoQuotes = (text, locale = "de") => {
  const [open, close] = QUOTES[locale] || QUOTES.de;
  return String(text ?? "").replace(/"([^"]+)"/g, `${open}$1${close}`);
};

// Shop-Anzeige (Optik-QA r2): Produktseite und Kacheln zeigen „€ 119“ (Cent nur, wenn vorhanden,
// wie formatEuro in Katalog/preis.js) – Mini-Warenkorb, Warenkorb und Bestellübersicht zeigten
// „€ 119,00“. Gleiche Regel für die Shop-Anzeige; Bestellmail/Rechnung bleiben bei euro().
export const euroKurz = (cent, locale = "de") => {
  const c = Math.round(cent || 0);
  return c % 100 === 0
    ? new Intl.NumberFormat(NUM[locale] || "de-AT", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(c / 100)
    : euro(c, locale);
};
