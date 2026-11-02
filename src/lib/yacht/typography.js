// Französische Typografie für die FR-Fassung von /yacht-interior (01.11.2026).
// Dieselben Regeln wie src/lib/hotel/content-intl.js (frenchSpacing): schmales
// geschütztes Leerzeichen vor ; ! ?, geschütztes Leerzeichen vor : und in « ».
// Eigene kleine Kopie, damit die Client-Bausteine der Yacht-Seite (ui.js) nicht
// die ganze Hotel-Textdatei mitladen. Reines Modul (node --test).

const NNBSP = " "; // schmales geschütztes Leerzeichen (vor ; ! ?)
const NBSP = " "; // geschütztes Leerzeichen (vor : und in « »)

/** Französische Leerzeichen-Regeln auf einen String. */
export function frenchSpacing(text) {
  return String(text)
    .replace(/ ([;!?])/g, `${NNBSP}$1`)
    .replace(/ :(?=\s|$)/g, `${NBSP}:`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`);
}

/** frenchSpacing() auf alle Strings eines Objekts (Kopie; Funktionen bleiben). */
export function frenchTypography(value) {
  if (typeof value === "string") return frenchSpacing(value);
  if (Array.isArray(value)) return value.map(frenchTypography);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, frenchTypography(v)]));
  return value;
}

// QM r4 (Overlines in Versalien, 200 % Text): der Trenner „·“ hängt mit geschütztem
// Leerzeichen am Wort davor – keine Zeile beginnt mit „· “ („· BOOTSHÄUSER“).
const NBSP_SEP = "\u00A0· ";

/** "Boote · Yachten · Bootshäuser" → Trenner mit geschütztem Leerzeichen davor. */
export function bindSeparators(text) {
  if (text == null) return "";
  return String(text).replace(/[ \u00A0]·[ \u00A0]/g, NBSP_SEP);
}

/**
 * Länge mit Einheit für Overlines: "8–10 m" → { num: "8–10", unit: "m" }, damit die
 * Einheit mit geschütztem Leerzeichen an der Zahl hängt und in Versalien-Zeilen klein
 * bleibt (m = Meter, nicht „M“). Ohne erkennbare Einheit: null.
 */
export function lengthParts(text) {
  const m = /^(.*\d)[  ](m|ft)$/.exec(String(text ?? "").trim());
  return m ? { num: m[1], unit: m[2] } : null;
}
