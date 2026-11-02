// QM planer-tools r2: Zahl und Einheit, „Pos. 2“, „Wand A“ und Maßketten nicht
// trennen; der Trennpunkt „·“ bleibt am Ende der Zeile statt sie zu beginnen.
const NB = " ";
const UNITS = "(?:cm|mm|m²|m|kg|l|%|°|€|EUR|Min\\.|min|kW|W|V|A\\b)";
const UNIT_RE = new RegExp(`(\\d) (${UNITS})(?=$|[\\s.,;:!?)\\]/–-])`, "g");

export function keepTogether(text) {
  if (typeof text !== "string" || !text) return text;
  return text
    .replace(/ · /g, `${NB}· `)
    .replace(/(\d) × (?=\d)/g, `$1${NB}×${NB}`)
    .replace(/(\d) – (?=\d)/g, `$1${NB}–${NB}`)
    // QM r4: „+ Platte“ nicht trennen („Korpus 78 + / Platte“ bei 1920 px)
    .replace(/ \+ (?=\p{L})/gu, ` +${NB}`)
    .replace(UNIT_RE, `$1${NB}$2`)
    .replace(/\b(Pos\.|Nr\.|Wand|Schritt|Seite) (?=[0-9A-Z]\b|\d)/g, `$1${NB}`)
    // QM r3 (Druckansicht): Bezeichnung und Maß zusammen („Spülenschrank / 60,“, „Korpus / 78“)
    .replace(/([\p{L})]) (?=\d)/gu, `$1${NB}`);
}
