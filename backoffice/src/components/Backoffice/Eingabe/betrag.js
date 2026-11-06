// Komma-Modell für Beträge und Mengen (G-21 BetragFeld, G-24 Zahlentastatur) – reine Logik, testbar.
// Wert immer in Cent (ganze Zahl). Anzeige deutsch „1.234,50“. Kein Runden: zu viele Nachkommastellen
// sind ein Fehler, keine stille Korrektur (Q-D6).

const NBSP = /[\s  ']/g;
const MINUS = /^[-−]/;

export const BETRAG_FEHLER = "Betrag im Format 1.234,50";
export const BETRAG_NEGATIV_FEHLER = "Nur Beträge ab 0,00";
export const BETRAG_MAX_FEHLER = "Betrag zu groß";

/**
 * Freie Eingabe → { ok, cent, fehler }. Leer → { ok: true, cent: null }.
 * Versteht „1.234,50“, „1234,5“, „1234“, „12,–“, „12.50“ (Punkt mit 1–2 Stellen = Komma), „€ 12“, „−3,20“.
 * @param {string} text
 * @param {{negativ?: boolean, maxCent?: number}} [opt]
 */
export function parseBetrag(text, { negativ = false, maxCent = 99_999_999_99 } = {}) {
  let s = String(text ?? "").replace(NBSP, "").replace(/€|EUR/gi, "");
  if (!s) return { ok: true, cent: null, fehler: "" };
  let vorzeichen = 1;
  if (MINUS.test(s)) {
    vorzeichen = -1;
    s = s.slice(1);
  }
  s = s.replace(/,[-–—]$/, ",00");
  let ganz;
  let nachkomma = "";
  if (s.includes(",")) {
    const teile = s.split(",");
    if (teile.length !== 2) return fehler();
    [ganz, nachkomma] = teile;
    if (ganz.includes(".")) {
      if (!/^\d{1,3}(\.\d{3})+$/.test(ganz)) return fehler();
      ganz = ganz.replace(/\./g, "");
    }
  } else if (s.includes(".")) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) ganz = s.replace(/\./g, "");
    else if (/^\d*\.\d{1,2}$/.test(s)) [ganz, nachkomma] = s.split(".");
    else return fehler();
  } else ganz = s;
  if (ganz === "" && nachkomma === "") return fehler();
  if (!/^\d*$/.test(ganz) || !/^\d{0,2}$/.test(nachkomma)) return fehler();
  const cent = vorzeichen * (Number(ganz || "0") * 100 + Number(nachkomma.padEnd(2, "0") || "0"));
  if (cent < 0 && !negativ) return { ok: false, cent: null, fehler: BETRAG_NEGATIV_FEHLER };
  if (Math.abs(cent) > maxCent) return { ok: false, cent: null, fehler: BETRAG_MAX_FEHLER };
  return { ok: true, cent: Object.is(cent, -0) ? 0 : cent, fehler: "" };
}

function fehler() {
  return { ok: false, cent: null, fehler: BETRAG_FEHLER };
}

/** Cent → „1.234,50“ (mit waehrung: „1.234,50 €“; negativ mit echtem Minuszeichen). */
export function formatBetrag(cent, { waehrung = false } = {}) {
  if (cent === null || cent === undefined || cent === "" || !Number.isFinite(Number(cent))) return "";
  const n = Math.round(Number(cent));
  const abs = Math.abs(n);
  const ganz = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const text = `${n < 0 ? "−" : ""}${ganz},${String(abs % 100).padStart(2, "0")}`;
  return waehrung ? `${text} €` : text;
}

// ---- Zahlentastatur (Komma-Modell wie ein Taschenrechner) -----------------------------------

export const TASTEN_LOESCHEN = "⌫";
export const TASTE_LEEREN = "C";
export const TASTE_KOMMA = ",";
export const TASTE_VORZEICHEN = "±";

/**
 * Tastendruck auf den Anzeigetext anwenden. Ziffern hängen an, „00“ zwei Nullen, „,“ beginnt die
 * Nachkommastellen (höchstens `dezimalen`), „⌫“ löscht das letzte Zeichen, „C“ leert, „±“ wechselt das
 * Vorzeichen (nur mit `negativ`). Führende Nullen entfallen („0“ + „5“ → „5“). Zu lange Eingaben werden
 * ignoriert (keine Rundung).
 * @returns {string}
 */
export function tasteAnwenden(text, taste, { dezimalen = 2, maxStellen = 9, negativ = false } = {}) {
  const alt = String(text ?? "");
  const minus = alt.startsWith("-");
  let t = minus ? alt.slice(1) : alt;
  const mitMinus = (x) => (minus && x !== "" ? `-${x}` : x);
  if (taste === TASTE_LEEREN) return "";
  if (taste === TASTEN_LOESCHEN) return mitMinus(t.slice(0, -1));
  if (taste === TASTE_VORZEICHEN) {
    if (!negativ) return alt;
    return minus ? t : t === "" ? alt : `-${t}`;
  }
  if (taste === TASTE_KOMMA || taste === ".") {
    if (dezimalen === 0 || t.includes(",")) return alt;
    return mitMinus(`${t || "0"},`);
  }
  if (!/^\d+$/.test(taste)) return alt;
  for (const ziffer of taste) {
    const [ganz, nach] = t.split(",");
    if (nach !== undefined) {
      if (nach.length >= dezimalen) break;
      t = `${ganz},${nach}${ziffer}`;
    } else {
      if (ganz.replace(/^0+/, "").length >= maxStellen) break;
      t = ganz === "0" ? ziffer : `${ganz}${ziffer}`;
    }
  }
  return mitMinus(t);
}

/** Anzeigetext der Tastatur → Cent (bzw. ganze Zahl bei dezimalen 0); leer → null. */
export function textZuWert(text, { dezimalen = 2 } = {}) {
  const s = String(text ?? "");
  if (!s || s === "-") return null;
  const minus = s.startsWith("-");
  const [ganz, nach = ""] = (minus ? s.slice(1) : s).split(",");
  const faktor = 10 ** dezimalen;
  const wert = Number(ganz || "0") * faktor + (dezimalen ? Number(nach.padEnd(dezimalen, "0").slice(0, dezimalen) || "0") : 0);
  return minus ? -wert : wert;
}

/** Anzeige der Tastatur mit Tausenderpunkten („12345,5“ → „12.345,5“). */
export function anzeigeText(text) {
  const s = String(text ?? "");
  const minus = s.startsWith("-");
  const [ganz, nach] = (minus ? s.slice(1) : s).split(",");
  const g = (ganz || "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${minus ? "−" : ""}${g}${nach !== undefined ? `,${nach}` : ""}`;
}

/** Cent → Tastatur-Text (für Vorbelegung): 125000 → "1250", 125050 → "1250,5". */
export function wertZuText(wert, { dezimalen = 2 } = {}) {
  if (wert === null || wert === undefined || !Number.isFinite(Number(wert))) return "";
  const n = Math.round(Number(wert));
  const faktor = 10 ** dezimalen;
  const abs = Math.abs(n);
  const ganz = Math.floor(abs / faktor);
  const nach = dezimalen ? String(abs % faktor).padStart(dezimalen, "0").replace(/0+$/, "") : "";
  return `${n < 0 ? "-" : ""}${ganz}${nach ? `,${nach}` : ""}`;
}

/**
 * Mengen ganzzahlig (Q-D6): „3“ ok, „3,6“ → Fehler mit Ersatzweg-Text, nie gerundet.
 * @returns {{ok:boolean, menge:number|null, fehler:string}}
 */
export function parseMenge(text, { min = 0, max = 99999 } = {}) {
  const s = String(text ?? "").replace(NBSP, "");
  if (!s) return { ok: true, menge: null, fehler: "" };
  if (!/^-?\d+$/.test(s)) return { ok: false, menge: null, fehler: "Nur ganze Stück – Teilmengen bitte als Notiz erfassen" };
  const n = Number(s);
  if (n < min) return { ok: false, menge: null, fehler: `Mindestens ${min}` };
  if (n > max) return { ok: false, menge: null, fehler: `Höchstens ${max}` };
  return { ok: true, menge: n, fehler: "" };
}
