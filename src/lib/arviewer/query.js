// AR-Viewer Sortiment: Suche, Filter, Seiten. Rein und serverseitig nutzbar
// (die Liste wird auf dem Server gefiltert, an den Browser gehen nur 24 Karten).
import { STUFEN, STUFEN_REIHENFOLGE, hatRaum } from "./stage.js";

/** Meta-Filter „Im Raum ansehen“: alle Stufen 1–2b. */
export const RAUM_FILTER = "raum";

export const PAGE_SIZE = 24;

const fold = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const one = (v) => (Array.isArray(v) ? v[0] : v);

/** searchParams → saubere Filter (unbekannte Werte fallen weg). */
export function parseQuery(sp = {}, { brands = [], categories = [] } = {}) {
  const q = String(one(sp.q) || "").slice(0, 80).trim();
  const marke = String(one(sp.marke) || "");
  const kategorie = String(one(sp.kategorie) || "");
  const stufe = String(one(sp.stufe) || "");
  const seite = Math.max(1, Math.min(999, Number.parseInt(one(sp.seite), 10) || 1));
  return {
    q,
    marke: brands.some((b) => b.key === marke) ? marke : "",
    kategorie: categories.some((c) => c.key === kategorie) ? kategorie : "",
    stufe: (STUFEN[stufe] && stufe !== "ohne-bild") || stufe === RAUM_FILTER ? stufe : "",
    seite,
  };
}

// QA R1 P3: kleine Synonymtabelle (Suchwort → zusätzliche Treffer-Wörter, gefaltet).
export const SYNONYME = {
  lampe: ["leuchte", "lamp", "lampen"],
  lampen: ["leuchte", "lamp"],
  leuchte: ["lamp", "lampe"],
  couch: ["sofa", "sofas", "couches"],
  sofa: ["couch", "sofas"],
  stuhl: ["chair", "chairs", "stuehle"],
  stuehle: ["chair", "chairs", "stuhl"],
  sessel: ["armchair", "armchairs", "lounge"],
  tisch: ["table", "tables", "tische"],
  tische: ["table", "tables", "tisch"],
  bett: ["bed", "beds", "betten"],
  teppich: ["rug", "rugs"],
  hocker: ["stool", "stools", "ottoman", "pouf"],
  regal: ["shelf", "shelves", "regale"],
  schirm: ["parasol", "parasols", "sunshade"],
  sonnenschirm: ["parasol", "parasols", "sunshade"],
  liege: ["lounger", "loungers", "daybed", "chaise"],
};

/** Levenshtein-Abstand, früh abgebrochen ab max+1. */
export function editDistance(a, b, max = 1) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function wordMatches(hay, tokens, w) {
  if (hay.includes(w)) return true;
  for (const syn of SYNONYME[w] || []) if (hay.includes(syn)) return true;
  // Tippfehler-Toleranz: ab 5 Zeichen ein Fehler („conery“ → „connery“)
  if (w.length >= 5) return tokens.some((t) => t.length >= 4 && editDistance(w, t, 1) <= 1);
  return false;
}

/** Alle Suchwörter müssen in Name, Marke oder Kategorie vorkommen (mit Synonymen und Tippfehler-Toleranz). */
export function matches(item, words) {
  if (!words.length) return true;
  const hay = item._hay || (item._hay = fold(`${item.name} ${item.brand} ${item.categoryLabel} ${item.id}`));
  const tokens = item._tok || (item._tok = [...new Set(hay.split(" "))]);
  return words.every((w) => wordMatches(hay, tokens, w));
}

// Fix-Runde 1 (F2): Produkte „Noch ohne Bild“ erscheinen öffentlich nie (auch nicht in der Suche).
const stufeOk = (i, stufe) =>
  i.stufe !== "ohne-bild" && (stufe ? (stufe === RAUM_FILTER ? hatRaum(i.stufe) : i.stufe === stufe) : true);

/**
 * @param {Array} items   Sortiment (id, name, brand, brandKey, category, categoryLabel, stufe …)
 * @param {object} f      parseQuery()
 * @returns {{items, total, pages, seite, counts: {stufe:{}, marke:{}, kategorie:{}}}}
 */
export function querySortiment(items, f) {
  const words = fold(f.q).split(" ").filter(Boolean);
  const base = items.filter((i) => matches(i, words));
  const by = (key, skip) => {
    const out = {};
    for (const i of base) {
      if (skip !== "marke" && f.marke && i.brandKey !== f.marke) continue;
      if (skip !== "kategorie" && f.kategorie && i.category !== f.kategorie) continue;
      if (skip !== "stufe" && !stufeOk(i, f.stufe, f.q)) continue;
      out[i[key]] = (out[i[key]] || 0) + 1;
    }
    return out;
  };
  const filtered = base.filter(
    (i) => (!f.marke || i.brandKey === f.marke) && (!f.kategorie || i.category === f.kategorie) && stufeOk(i, f.stufe, f.q)
  );
  // Höhere Stufe zuerst, dann Marke, dann Name – so stehen die AR-fähigen Produkte oben.
  const rank = (s) => STUFEN_REIHENFOLGE.indexOf(s);
  filtered.sort((a, b) => rank(a.stufe) - rank(b.stufe) || a.brand.localeCompare(b.brand, "de") || a.name.localeCompare(b.name, "de"));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const seite = Math.min(f.seite, pages);
  return {
    items: filtered.slice((seite - 1) * PAGE_SIZE, seite * PAGE_SIZE),
    total: filtered.length,
    pages,
    seite,
    counts: (() => {
      // Stufen-Zähler: unabhängig vom Stufen-Filter, „ohne Bild“ immer mitgezählt (Chip bleibt erreichbar)
      const stufe = {};
      for (const i of base) {
        if (f.marke && i.brandKey !== f.marke) continue;
        if (f.kategorie && i.category !== f.kategorie) continue;
        stufe[i.stufe] = (stufe[i.stufe] || 0) + 1;
      }
      stufe[RAUM_FILTER] = Object.entries(stufe).reduce((a, [k, n]) => a + (hatRaum(k) ? n : 0), 0);
      return { stufe, marke: by("brandKey", "marke"), kategorie: by("category", "kategorie") };
    })(),
  };
}

/** URL der Liste mit geänderten Filtern (leere Werte fallen weg, Seite 1 außer explizit). */
export function listHref(f, patch = {}) {
  const next = { ...f, seite: 1, ...patch };
  const sp = new URLSearchParams();
  for (const k of ["q", "marke", "kategorie", "stufe"]) if (next[k]) sp.set(k, next[k]);
  if (next.seite > 1) sp.set("seite", String(next.seite));
  const s = sp.toString();
  return `/de/3d-ansicht${s ? `?${s}` : ""}#sortiment`;
}

/** Seitenzahlen mit Lücken: 1 … 4 5 6 … 20 */
export function pageList(seite, pages) {
  const set = new Set([1, pages, seite - 1, seite, seite + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/**
 * QA R2 P3: „Meinten Sie …?“ – bei 0 Treffern das nächste Wort aus Name/Marke
 * (Levenshtein ≤ 2, ab 4 Zeichen), das tatsächlich Treffer bringt. Sonst null.
 */
export function suggestQuery(items, q) {
  const words = fold(q).split(" ").filter(Boolean);
  if (!words.length || words.length > 3) return null;
  const vocab = new Map();
  for (const i of items) {
    for (const t of fold(`${i.name} ${i.brand}`).split(" ")) if (t.length >= 4) vocab.set(t, (vocab.get(t) || 0) + 1);
  }
  const fixed = words.map((w) => {
    if (w.length < 4 || vocab.has(w)) return w;
    let best = null;
    for (const [t, n] of vocab) {
      const d = editDistance(w, t, 2);
      if (d <= 2 && (!best || d < best.d || (d === best.d && n > best.n))) best = { t, d, n };
    }
    return best ? best.t : w;
  });
  const out = fixed.join(" ");
  if (out === words.join(" ")) return null;
  return items.some((i) => matches(i, fixed)) ? out : null;
}
