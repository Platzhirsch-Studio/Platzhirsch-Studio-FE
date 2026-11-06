// Live-Prüfung der Kundentexte (Konzept §3.7, K11): gleiche Regeln wie der Server (ph_kundenkarte_stufe.py
// GELD_RE, SUPERLATIV_RE) plus „Gutschrift|Gutschein|gratis|kostenlos“ (Backend-Anfrage P13).
// Reines Modul – läuft im Browser (beim Tippen) und in der Server Action (vor dem Speichern).

export const GELD_RE = /(\d\s?%|\d\s?€|\bEUR\b|Euro|Prozent|Rabatt|Bonus|Guthaben|Punkte)/i;
export const ZUSATZ_RE = /(Gutschrift|Gutschein|gratis|kostenlos)/i;
export const SUPERLATIV_RE = /(?<![\p{L}])(beste[rsn]?|exklusivste|größte|einzigartig|unschlagbar|billigste|günstigste)(?![\p{L}])/iu;

/**
 * @param {string} text
 * @returns {{ok:true} | {ok:false, art:"geld"|"zusatz"|"superlativ", treffer:string, text:string}}
 */
export function pruefeKundentext(text) {
  const t = String(text ?? "");
  if (!t.trim()) return { ok: true };
  let m = GELD_RE.exec(t);
  if (m) return { ok: false, art: "geld", treffer: m[0], text: `Kundentexte versprechen keine Beträge, Prozente oder Rabatte („${m[0]}“).` };
  m = ZUSATZ_RE.exec(t);
  if (m) return { ok: false, art: "zusatz", treffer: m[0], text: `Kundentexte nennen keine Gutscheine, Gutschriften oder „gratis“ („${m[0]}“).` };
  m = SUPERLATIV_RE.exec(t);
  if (m) return { ok: false, art: "superlativ", treffer: m[0], text: `Bitte ohne Superlative formulieren („${m[0]}“).` };
  return { ok: true };
}

/** Mehrere Texte → erster Befund oder ok. */
export function pruefeKundentexte(...texte) {
  for (const t of texte) {
    const r = pruefeKundentext(t);
    if (!r.ok) return r;
  }
  return { ok: true };
}
