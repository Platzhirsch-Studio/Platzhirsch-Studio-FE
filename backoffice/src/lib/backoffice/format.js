// Anzeigeformate des Backoffice (de-AT). Reines Modul, testbar mit node --test.

// Betrag mit nachgestelltem Euro (de-AT setzt das Zeichen sonst voran).
const EUR_ZAHL = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ZAHL = new Intl.NumberFormat("de-AT");

/** Cent → "1.234,50 €" (geschütztes Leerzeichen). Ungültige Werte → "–". */
export function cent(wert) {
  if (wert === null || wert === undefined || wert === "" || Number.isNaN(Number(wert))) return "–";
  return `${EUR_ZAHL.format(Number(wert) / 100)} €`;
}

/** Cent → "1234,50" für Eingabefelder (ohne Währungszeichen, Komma als Dezimaltrennung). */
export function centAlsEingabe(wert) {
  if (wert === null || wert === undefined || wert === "") return "";
  const n = Number(wert);
  if (Number.isNaN(n)) return "";
  return (n / 100).toFixed(2).replace(".", ",");
}

/**
 * Eingabe in Euro ("1.234,50", "1234.5", "12") → Cent als ganze Zahl.
 * Leer → null; nicht lesbar → NaN (Aufrufer validiert).
 */
export function euroZuCent(eingabe) {
  if (eingabe === null || eingabe === undefined) return null;
  const s = String(eingabe).trim().replace(/\s|€/g, "");
  if (!s) return null;
  // Deutsche Schreibweise: Punkt als Tausender, Komma als Dezimal. Englische: Punkt dezimal.
  let normal;
  if (s.includes(",")) normal = s.replace(/\./g, "").replace(",", ".");
  else if ((s.match(/\./g) || []).length > 1) normal = s.replace(/\./g, "");
  else normal = s;
  if (!/^-?\d+(\.\d{1,2})?$/.test(normal)) return NaN;
  return Math.round(Number(normal) * 100);
}

export function zahl(wert) {
  if (wert === null || wert === undefined || wert === "") return "–";
  return ZAHL.format(Number(wert));
}

function alsDate(wert) {
  if (!wert) return null;
  if (wert instanceof Date) return Number.isNaN(wert.getTime()) ? null : wert;
  const s = String(wert);
  // Frappe: "2026-11-04 09:30:00" oder "2026-11-04 09:30:00.123456"
  const d = new Date(s.includes("T") || /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2026-11-04" → "04.11.2026" */
export function datum(wert) {
  const d = alsDate(wert);
  if (!d) return "–";
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "2026-11-04 09:30:00" → "04.11.2026, 09:30" */
export function datumZeit(wert) {
  const d = alsDate(wert);
  if (!d) return "–";
  return `${datum(d)}, ${d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}`;
}

/** Relative Angabe für Aktivitätsströme: "vor 5 Min.", "gestern", sonst Datum. */
export function relativ(wert, jetzt = new Date()) {
  const d = alsDate(wert);
  if (!d) return "–";
  const diff = Math.round((jetzt.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "gerade eben";
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std.`;
  if (diff < 172800) return "gestern";
  if (diff < 7 * 86400) return `vor ${Math.floor(diff / 86400)} Tagen`;
  return datum(d);
}

/** Datum als Frappe-String "YYYY-MM-DD". */
export function isoDatum(d = new Date()) {
  const x = alsDate(d) || new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}

/** Datum+Zeit als Frappe-String "YYYY-MM-DD HH:MM:SS" (lokale Zeit). */
export function isoDatumZeit(d = new Date()) {
  const x = alsDate(d) || new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${isoDatum(x)} ${p(x.getHours())}:${p(x.getMinutes())}:${p(x.getSeconds())}`;
}

/** Kürzt Freitext für Listen. */
export function kurz(text, max = 80) {
  const s = String(text ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** "PH Anfrage" → "ph-anfrage" (URL-Segment für /backoffice/d/<doctype>). */
export function doctypeSlug(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
