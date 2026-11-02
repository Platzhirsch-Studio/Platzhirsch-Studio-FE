// src/lib/shop/shopSuche.js
// Produktsuche des Accessoires-Shops (/<locale>/accessoires/suche?q=…):
// serverseitig über den statischen Katalog (src/lib/katalog), ohne Paket,
// ohne Client-JavaScript, ohne Backoffice.
//
// Abgleich je Suchwort gegen einen Wortschatz aus Produktname, Marke, Serie,
// Designer, Kategorie-Label der Sprache und Synonymen (SYNONYME, vier Sprachen):
//   4  Wort exakt                      „vase“  → vase
//   3  Wortanfang (Präfix)             „rie“   → riedel
//   2.5 Präfix ohne Pluralendung       „kerzen“ → kerze…, „glaeser“ → glaeser
//   2  Teilwort ab 4 Zeichen           „wein“  → rotweinglas
//   1  Tippfehler (nur wenn das Wort sonst NIRGENDS passt): Präfix-Editier-
//      abstand ≤ 1 (ab 4 Zeichen) bzw. ≤ 2 (ab 7 Zeichen), Damerau (Dreher)
// Alle Suchwörter müssen passen (UND); Füllwörter (von, and, de …) fallen weg,
// solange andere Wörter bleiben. Gewichte je Feld: Name 3, Marke/Serie 2,
// Kategorie 1,5, Synonym/Designer 1. Ergebnis sortiert nach Punkten, dann
// Katalogreihenfolge. Treffer auf Marken und Kategorien kommen extra zurück.
// Rein, ohne "@/"-Importe (node --test). Index je Sprache einmal gebaut.
import { KATALOG_MARKEN, produkteByWelt } from "../katalog/index.js";

export const SUCHE_MIN_ZEICHEN = 2;
export const SUCHE_MAX_ZEICHEN = 80;
export const SUCHE_SEITE_GROESSE = 48;

/** Kleinbuchstaben, ohne Akzente, ß→ss, æ→ae, ø→o, œ→oe, ä→a; Nicht-Alphanumerik → Leerzeichen. */
export function normalisiere(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe")
    .replace(/ø/g, "o")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const woerter = (text) => normalisiere(text).split(" ").filter(Boolean);

/** Suchanfrage aus searchParams.q: getrimmt, gekürzt; "" wenn kürzer als SUCHE_MIN_ZEICHEN. */
export function suchAnfrage(raw) {
  const q = String(Array.isArray(raw) ? raw[0] ?? "" : raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, SUCHE_MAX_ZEICHEN)
    .trim();
  return q.length >= SUCHE_MIN_ZEICHEN ? q : "";
}

/** Seitenzahl aus searchParams.seite (≥ 1, sonst 1). */
export function suchSeite(raw) {
  const n = Number.parseInt(Array.isArray(raw) ? raw[0] : raw, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 1000) : 1;
}

const FUELLWOERTER = new Set(["von", "und", "der", "die", "das", "mit", "fur", "fuer", "the", "and", "of", "for", "with", "by", "de", "la", "le", "les", "et", "du", "des", "pour", "di", "il", "e", "per", "con", "da", "a"]);

/**
 * Synonyme je Kategorie (vier Sprachen, Singular/Plural). Werden normalisiert.
 * Nur Gattungswörter – keine Eigenschaften, die nicht jedes Produkt hat.
 */
export const SYNONYME = Object.freeze({
  duftkerze: "kerze kerzen duftkerze duftkerzen duft candle candles scented bougie bougies parfumee candela candele profumata",
  raumduft: "raumduft raumdufte duft raumspray spray homespray fragrance home parfum interieur profumo ambiente ambienti",
  diffuser: "diffuser duftstabchen stabchen raumduft reed diffuseur diffusore bastoncini",
  wohnaccessoire: "deko dekoration accessoire wohnaccessoire decor decoration accessory deco accessorio",
  geschenkset: "geschenk geschenke geschenkset geschenkbox set gift gifts giftset box cadeau cadeaux coffret regalo regali",
  glas: "glas glaser weinglas weinglaser trinkglas wein glass glasses wine wineglass verre verres vin bicchiere bicchieri calice calici vino",
  karaffe: "karaffe karaffen dekanter decanter decanters carafe carafes caraffa caraffe decantatore",
  "bar-zubehoer": "bar barzubehor cocktail zubehor accessories accessoires accessori",
  bildband: "buch bucher bildband bildbande book books coffee table livre livres beau beaux libro libri illustrato",
  vase: "vase vasen gefass gefasse vases vessel vaso vasi",
  geschirr: "geschirr teller schale schalen schussel tasse tassen becher tableware plate plates bowl bowls cup mug vaisselle assiette assiettes bol tasse stoviglie piatto piatti ciotola tazza",
  "tragbare-leuchte": "lampe lampen leuchte leuchten akku akkuleuchte tragbar tischleuchte lamp lamps light portable battery cordless lampe baladeuse lampada lampade portatile",
  parfum: "parfum parfums eau duft perfume perfumes fragrance profumo profumi",
});

/** Damerau-Levenshtein (optimal string alignment) mit Abbruch über max. */
export function abstand(a, b, max = 2) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  let prev2 = null;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

/** Erlaubte Tippfehler je Wortlänge. */
export const toleranz = (len) => (len >= 7 ? 2 : len >= 4 ? 1 : 0);

/** Präfix-Editierabstand: passt q (mit Tippfehlern) auf den Anfang von token? */
export function praefixAbstand(q, token, max = toleranz(q.length)) {
  let best = max + 1;
  for (let L = Math.max(1, q.length - max); L <= Math.min(token.length, q.length + max); L++) {
    best = Math.min(best, abstand(q, token.slice(0, L), max));
    if (best === 0) break;
  }
  return best;
}

/** Wortformen ohne Pluralendung (glaeser → glaes, kerzen → kerze …), mind. 3 Zeichen. */
function stammformen(q) {
  const out = new Set();
  for (const end of ["en", "n", "s", "e"]) if (q.length - end.length >= 3 && q.endsWith(end)) out.add(q.slice(0, -end.length));
  out.delete(q);
  return [...out];
}

/** Punkte eines Suchworts auf ein Index-Wort ohne Tippfehler (0 = passt nicht). */
export function wortPunkte(q, token) {
  if (token === q) return 4;
  if (token.startsWith(q)) return 3;
  if (stammformen(q).some((s) => token.startsWith(s))) return 2.5;
  if (q.length >= 4 && token.includes(q)) return 2;
  return 0;
}

const GEWICHT = { name: 3, marke: 2, serie: 2, kategorie: 1.5, designer: 1, synonym: 1 };
const cache = new Map();

/**
 * Suchindex einer Welt/Sprache: { produkte, vokabular: Map<wort, Map<idx, gewicht>> }.
 * @param {(kategorie: string) => string} katLabel  Kategorie-Label der Sprache
 */
export function suchIndex(welt, locale, katLabel = (k) => k) {
  const key = `${welt}|${locale}`;
  if (cache.has(key)) return cache.get(key);
  const produkte = produkteByWelt(welt);
  const vokabular = new Map();
  const add = (text, idx, feld) => {
    for (const w of woerter(text)) {
      if (!vokabular.has(w)) vokabular.set(w, new Map());
      const m = vokabular.get(w);
      m.set(idx, Math.max(m.get(idx) || 0, GEWICHT[feld]));
    }
  };
  const markenName = new Map(KATALOG_MARKEN.map((m) => [m.slug, m.name]));
  produkte.forEach((p, i) => {
    add(p.name, i, "name");
    add(markenName.get(p.marke) || p.marke, i, "marke");
    if (typeof p.serie === "string") add(p.serie, i, "serie");
    if (typeof p.designer === "string") add(p.designer, i, "designer");
    add(katLabel(p.kategorie), i, "kategorie");
    add(SYNONYME[p.kategorie] || "", i, "synonym");
  });
  const index = { produkte, vokabular };
  cache.set(key, index);
  return index;
}

/** Nur für Tests: Index-Cache leeren. */
export const _leereSuchCache = () => cache.clear();

function suchWoerter(q) {
  const alle = [...new Set(woerter(q))];
  const ohneFuell = alle.filter((w) => !FUELLWOERTER.has(w) && (w.length > 1 || /\d/.test(w)));
  return ohneFuell.length ? ohneFuell : alle;
}

/**
 * Suche.
 * @returns {{ treffer: object[], korrigiert: string|null, woerter: string[] }}
 *   korrigiert: Suchanfrage mit den per Tippfehler-Toleranz gefundenen Wörtern (sonst null)
 */
export function sucheProdukte(q, { welt = "accessoires", locale = "de", katLabel } = {}) {
  const ws = suchWoerter(q);
  if (!ws.length) return { treffer: [], korrigiert: null, woerter: [] };
  const { produkte, vokabular } = suchIndex(welt, locale, katLabel);
  let summe = null;
  let korrigiert = false;
  const ersetzt = [];
  for (const w of ws) {
    const punkte = new Map();
    const treffe = (token, wert) => {
      for (const [idx, g] of vokabular.get(token)) punkte.set(idx, Math.max(punkte.get(idx) || 0, wert * g));
    };
    for (const token of vokabular.keys()) {
      const wert = wortPunkte(w, token);
      if (wert) treffe(token, wert);
    }
    let ersatz = w;
    if (!punkte.size && toleranz(w.length) > 0) {
      // Tippfehler-Rückfall: nächstgelegene Wörter (kleinster Abstand) des Wortschatzes.
      let best = toleranz(w.length) + 1;
      const kandidaten = [];
      for (const token of vokabular.keys()) {
        const d = praefixAbstand(w, token);
        if (d < best) {
          best = d;
          kandidaten.length = 0;
        }
        if (d === best && d <= toleranz(w.length)) kandidaten.push(token);
      }
      for (const token of kandidaten) treffe(token, 1);
      if (kandidaten.length) {
        korrigiert = true;
        // Anzeige: das häufigste Kandidatenwort
        ersatz = kandidaten.sort((a, b) => vokabular.get(b).size - vokabular.get(a).size || a.localeCompare(b))[0];
      }
    }
    ersetzt.push(ersatz);
    if (summe === null) summe = punkte;
    else {
      const next = new Map();
      for (const [idx, p] of summe) if (punkte.has(idx)) next.set(idx, p + punkte.get(idx));
      summe = next;
    }
    if (!summe.size) break;
  }
  const treffer = [...(summe || new Map())]
    .sort((a, b) => b[1] - a[1] || a[0] - b[0])
    .map(([idx]) => produkte[idx]);
  return { treffer, korrigiert: korrigiert && treffer.length ? ersetzt.join(" ") : null, woerter: ws };
}

/** Marken, deren Name zu allen Suchwörtern passt (Präfix, ohne Tippfehler). */
export function sucheMarken(q, marken) {
  const ws = suchWoerter(q);
  if (!ws.length) return [];
  return marken.filter((m) => {
    const tokens = woerter(m.name).concat(woerter(m.slug));
    return ws.every((w) => tokens.some((t) => wortPunkte(w, t) >= 2.5));
  });
}

/** Kategorien (Slug + Label), deren Label oder Synonyme zu einem Suchwort passen. */
export function sucheKategorien(q, kategorien) {
  const ws = suchWoerter(q);
  if (!ws.length) return [];
  return kategorien.filter((k) => {
    const tokens = woerter(`${k.label} ${SYNONYME[k.slug] || ""}`);
    return ws.some((w) => tokens.some((t) => wortPunkte(w, t) >= 2.5));
  });
}
