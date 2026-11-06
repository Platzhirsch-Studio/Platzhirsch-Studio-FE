// Anzeige-Helfer des Bereichs Service (Datum kurz, Uhrzeit, Euro aus Cent, Initialen-Name). Reines Modul.

const TAGE = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function teile(wert) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(String(wert || ""));
  return m ? { j: +m[1], mo: +m[2], t: +m[3], h: m[4], mi: m[5] } : null;
}

/** "2026-11-06" → "06.11." */
export function tagMonat(wert) {
  const p = teile(wert);
  return p ? `${String(p.t).padStart(2, "0")}.${String(p.mo).padStart(2, "0")}.` : "–";
}

/** "2026-11-06" → "06.11.2026" */
export function datumLang(wert) {
  const p = teile(wert);
  return p ? `${String(p.t).padStart(2, "0")}.${String(p.mo).padStart(2, "0")}.${p.j}` : "–";
}

/** "2026-11-06" → "Do 06.11." */
export function tagKurz(wert) {
  const p = teile(wert);
  if (!p) return "–";
  const wt = new Date(Date.UTC(p.j, p.mo - 1, p.t)).getUTCDay();
  return `${TAGE[wt]} ${tagMonat(wert)}`;
}

/** "08:00:00" → "08:00" */
export function uhr(wert) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(wert || ""));
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : "";
}

/** Zeitspanne "08:00–10:00" */
export function spanne(von, bis) {
  const a = uhr(von);
  const b = uhr(bis);
  return a && b ? `${a}–${b}` : a || "";
}

/** "2026-11-04 09:12:00" → "04.11. 09:12" */
export function zeitpunkt(wert) {
  const p = teile(wert);
  if (!p) return "–";
  return p.h ? `${tagMonat(wert)} ${p.h}:${p.mi}` : tagMonat(wert);
}

/** Cent → "1.234,50 €" (de-AT, wie format.cent). */
export function euro(c) {
  const n = Number(c) || 0;
  return `${(n / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Relativ in Tagen zu heute: "heute", "gestern", "vor 3 Tagen", "in 2 Tagen". */
export function relativTage(wert, heute = new Date()) {
  const p = teile(wert);
  if (!p) return "–";
  const h = new Date(Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate()));
  const d = new Date(Date.UTC(p.j, p.mo - 1, p.t));
  const n = Math.round((d - h) / 86_400_000);
  if (n === 0) return "heute";
  if (n === -1) return "gestern";
  if (n === 1) return "morgen";
  return n < 0 ? `vor ${-n} Tagen` : `in ${n} Tagen`;
}

/** Fälligkeit als Text: "überfällig seit 03.11.", "bis 06.11.", "heute". */
export function faelligText(faellig, heute = new Date()) {
  if (!faellig) return "";
  const r = relativTage(faellig, heute);
  if (r === "heute") return "fällig heute";
  if (r.startsWith("vor") || r === "gestern") return `überfällig seit ${tagMonat(faellig)}`;
  return `bis ${tagMonat(faellig)}`;
}

/** Name aus E-Mail/Benutzer: Personenkarte (Klammerzusätze wie „(Service)“ entfallen). */
export function personName(email, personen = {}) {
  const n = personen[email] || email || "";
  return String(n).replace(/\s*\([^)]*\)\s*$/, "");
}

/** Minuten → "2 h 15 min" */
export function dauerText(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}
