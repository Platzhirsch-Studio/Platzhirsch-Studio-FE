// Nummernmuster aus Frappe-naming_series (eigenes Modul, damit suche/<bereich>.js und codes.js es ohne
// Zyklus über suche/index.js nutzen können). Reines Modul.
//
// Frappe-Serie "PH-ANF-.YYYY.-.#####" → Name "PH-ANF-2026-00001": Punkte trennen nur, YYYY/YY/MM/DD
// sind Ziffern, "#"-Folgen sind die laufende Nummer (mit Nullen aufgefüllt, darf länger werden).

const PLATZHALTER = { YYYY: "\\d{4}", YY: "\\d{2}", MM: "\\d{2}", DD: "\\d{2}" };

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/**
 * @param {string} serie z. B. "PH-S-.YY.MM.DD.-.#####"
 * @returns {RegExp} anker- und fallunabhängiger Ausdruck, z. B. /^PH-S-\d{2}\d{2}\d{2}-\d{5,}$/i
 */
export function ausSerie(serie) {
  const teile = String(serie || "").split(".").filter((t) => t !== "");
  if (!teile.length) throw new Error("Leere Serie");
  const quelle = teile
    .map((t) => {
      if (PLATZHALTER[t]) return PLATZHALTER[t];
      if (/^#+$/.test(t)) return `\\d{${t.length},}`;
      return escape(t);
    })
    .join("");
  return new RegExp(`^${quelle}$`, "i");
}

/** Beispielname einer Serie (Tests, Demo): Jahr 2026, Datum 04.11., laufende Nummer 1. */
export function beispielAusSerie(serie, nummer = 1) {
  return String(serie || "")
    .split(".")
    .filter((t) => t !== "")
    .map((t) => ({ YYYY: "2026", YY: "26", MM: "11", DD: "04" })[t] ?? (/^#+$/.test(t) ? String(nummer).padStart(t.length, "0") : t))
    .join("");
}

/** {serie|regex, doctype} → {regex, doctype, serie?} */
export function normalisiereMuster(m) {
  if (m.regex instanceof RegExp) return { ...m, regex: m.regex };
  if (m.serie) return { ...m, regex: ausSerie(m.serie) };
  throw new Error(`Nummernmuster ohne regex/serie für ${m.doctype}`);
}
