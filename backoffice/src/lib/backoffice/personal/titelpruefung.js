// GlBG § 9 Abs 1 – geschlechtsneutrale Ausschreibung (Konzept § 5.4, A14). Warnung, keine Sperre.
// Erkennt :in, *in, /in, -in, _in, Binnen-I, (m/w/d) in jeder Reihenfolge, (w/m/x) und Paarformen
// („Verkäuferin oder Verkäufer“, „Monteurin / Monteur“). Für titel_en/fr/it nur Hinweis. Reines Modul.

const KLAMMER = /\(\s*[mwdx]\s*\/\s*[mwdx]\s*\/\s*[mwdx]\s*\)/i;
const ZEICHEN = /[a-zäöüß](?::|\*|\/|_|-)in(nen)?\b/i;
const BINNEN_I = /[a-zäöüß]In(nen)?\b/;
const PAAR = /\b([A-Za-zÄÖÜäöüß]+)in\s*(?:\/|oder|und|bzw\.?)\s*([A-Za-zÄÖÜäöüß]+)\b/i;

/**
 * @param {string} titel
 * @returns {{neutral:boolean, form:string|null, hinweis:string|null}}
 */
export function pruefeTitel(titel) {
  const t = String(titel || "").trim();
  if (!t) return { neutral: false, form: null, hinweis: "Titel fehlt" };
  if (KLAMMER.test(t)) return { neutral: true, form: "klammer", hinweis: null };
  if (ZEICHEN.test(t)) return { neutral: true, form: "zeichen", hinweis: null };
  if (BINNEN_I.test(t)) return { neutral: true, form: "binnen-i", hinweis: null };
  const p = PAAR.exec(t);
  if (p && p[2].toLowerCase().startsWith(p[1].toLowerCase().slice(0, Math.max(3, p[1].length - 2)))) return { neutral: true, form: "paar", hinweis: null };
  return { neutral: false, form: null, hinweis: "Titel nicht erkennbar geschlechtsneutral – z. B. „Monteur:in“ oder „(m/w/d)“ ergänzen" };
}

/** Adresse auf der Website – identisch zu ph_personal.logik.slug bzw. src/lib/slugify.js generateSlug. */
export function slugAusTitel(titel) {
  if (!titel) return "";
  let s = String(titel).toLowerCase();
  for (const [a, b] of [["ä", "ae"], ["ö", "oe"], ["ü", "ue"], ["ß", "ss"]]) s = s.split(a).join(b);
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[\s–—]+/g, "-").replace(/\//g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
  return s.replace(/^-+|-+$/g, "");
}
