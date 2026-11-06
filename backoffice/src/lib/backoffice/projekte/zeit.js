// Dauer-Parser und Formatierung (10-konzept-projekte.md § 5.15). Reines Modul.
//   „1:30“ → 90 · „90 min“ → 90 · „1,5 h“ → 90 · „2“ (≤ 12, ohne Einheit) → 120 · „45“ (> 12) → 45 Minuten.

/**
 * @param {string|number} eingabe
 * @returns {{ok:true, minuten:number, text:string} | {ok:false, fehler:"leer"|"unklar"|"zuviel"}}
 */
export function parseDauer(eingabe) {
  const t = String(eingabe ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return { ok: false, fehler: "leer" };
  let min = null;
  let m;
  if ((m = /^(\d{1,2}):([0-5]\d)$/.exec(t))) min = Number(m[1]) * 60 + Number(m[2]);
  else if ((m = /^(\d+(?:[.,]\d+)?) ?(h|std|stunden?)$/.exec(t))) min = Math.round(Number(m[1].replace(",", ".")) * 60);
  else if ((m = /^(\d+) ?(m|min|minuten?)$/.exec(t))) min = Number(m[1]);
  else if ((m = /^(\d+) ?h ?(\d+) ?(m|min)?$/.exec(t))) min = Number(m[1]) * 60 + Number(m[2]);
  else if ((m = /^(\d+(?:[.,]\d+)?)$/.exec(t))) {
    const n = Number(m[1].replace(",", "."));
    min = n <= 12 ? Math.round(n * 60) : Math.round(n);
  }
  if (min === null || !Number.isFinite(min) || min <= 0) return { ok: false, fehler: "unklar" };
  if (min > 24 * 60) return { ok: false, fehler: "zuviel" };
  return { ok: true, minuten: min, text: dauerText(min) };
}

/** 90 → „1 h 30 min“, 45 → „45 min“, 120 → „2 h“. */
export function dauerText(min) {
  const n = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(n / 60);
  const r = n % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** 90 → „1:30“ (tabellarisch). */
export function hmm(min) {
  const n = Math.max(0, Math.round(Number(min) || 0));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

/** Minuten → Stunden mit einer Nachkommastelle („7,5“). */
export function stunden(min) {
  return (Math.round((Number(min) || 0) / 6) / 10).toLocaleString("de-DE", { maximumFractionDigits: 1 });
}
