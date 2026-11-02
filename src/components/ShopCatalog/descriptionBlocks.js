// Splits the (already sanitized, see sanitizeCmsHtml) manufacturer rich text
// of a product into what the "Atelier" page shows where (QA Runde 1, P1-2):
// - intro: the first paragraphs, at most INTRO_PARAGRAPHS / INTRO_WORDS,
//   always visible;
// - more: the rest of the prose, rendered inside <details> (still in the
//   server HTML for crawlers and find-in-page);
// - spec: the technical part from the first CMS heading ("Ausführungen") or
//   the first run of "<strong>Label:</strong> …" paragraphs on, as groups of
//   { title, items: [{ label, html }], extra: [html] } for the
//   "Material und Ausführung" section.
// CMS headings (h3/h4) inside the prose become h3 (H2 → H3, no jump to H4).
// Pure string work, server-safe.

const INTRO_PARAGRAPHS = 2;
const INTRO_WORDS = 90;

const BLOCK_RE = /<(p|ul|ol|h3|h4)>([\s\S]*?)<\/\1>/g;
const LABEL_RE = /^\s*<(strong|b)>\s*([^<]{1,60}?)\s*:?\s*<\/\1>\s*:?\s*/;

// Rat 9,5 A2 (T6): headings and labels are rendered as React text, so CMS
// entities ("Materialien &amp; Ausführungen") must be decoded first –
// otherwise the page shows "&amp;" (React escapes the ampersand again).
const ENTITIES = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
export function decodeEntities(text) {
  let out = String(text || "");
  // Twice: the CMS sometimes holds "&amp;amp;".
  for (let i = 0; i < 2; i++) {
    out = out.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === "#") {
        const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    });
  }
  return out;
}

const textOf = (html) => decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
const wordCount = (html) => (textOf(html).match(/\S+/g) || []).length;

// Top-level blocks of one sanitized HTML string; loose text between blocks
// becomes its own paragraph.
function toBlocks(html) {
  const out = [];
  let last = 0;
  const pushLoose = (s) => {
    const loose = s.replace(/<br>/g, " ").trim();
    if (textOf(loose)) out.push({ tag: "p", inner: loose });
  };
  for (const m of html.matchAll(BLOCK_RE)) {
    pushLoose(html.slice(last, m.index));
    if (textOf(m[2])) out.push({ tag: m[1], inner: m[2].trim() });
    last = m.index + m[0].length;
  }
  pushLoose(html.slice(last));
  return out;
}

// Rat 9,5 A2 (T6): manufacturer texts sometimes carry a paragraph in another
// language ("Tutti gli accessori …" on a German page). Function words only
// (no product vocabulary); a block counts as a language only when it is long
// enough and clearly ahead of the runner-up. Allowed are the page language
// and German (the backoffice falls back to the German text on en/fr/it).
// When the foreign blocks are nearly the whole text (> 80 % of the words),
// the text simply is in that language and stays – never an empty page.
const STOPWORDS = {
  de: "der die das und ist mit für von zu den dem ein eine einen einem einer auf sich nicht wird werden sind auch aus bei oder nach im durch über sowie als wie zum zur",
  it: "il lo gli di del della dello dei delle degli che con per sono è e una nel nella nei alla alle al ai da dal dalla si può anche come più viene vengono ad",
  en: "the and of with for is are to by from this that its which can be or on as it has have",
  fr: "les du et est une avec pour dans sur par qui au aux sont ce cette peut ou être leur",
};
const STOP = Object.fromEntries(Object.entries(STOPWORDS).map(([l, w]) => [l, new Set(w.split(" "))]));
const MIN_WORDS = 8;
const MAX_FOREIGN_SHARE = 0.8;

/** Language of one text block: "de" | "it" | "en" | "fr" | null (unsure). */
export function blockLanguage(html) {
  const words = textOf(html).toLowerCase().match(/\p{L}+/gu) || [];
  if (words.length < MIN_WORDS) return null;
  const hits = Object.entries(STOP).map(([lang, set]) => [lang, words.filter((w) => set.has(w)).length]);
  hits.sort((a, b) => b[1] - a[1]);
  const [[lang, top], [, second]] = hits;
  if (top < 3 || top < 2 * second || top / words.length < 0.12) return null;
  return lang;
}

/**
 * Paragraph list (CMS HTML) without blocks in a foreign language; unsure
 * blocks always stay, paragraphs without a foreign block stay untouched.
 * @param {string[]} paragraphs
 * @param {string} [locale] page language (default "de")
 * @returns {string[]}
 */
export function dropForeignBlocks(paragraphs, locale = "de") {
  const list = (paragraphs || []).map((p) => String(p || ""));
  const allowed = new Set([locale, "de"]);
  const parsed = list.map((p) => toBlocks(p).map((b) => {
    const lang = blockLanguage(b.inner);
    return { b, foreign: Boolean(lang) && !allowed.has(lang), words: wordCount(b.inner) };
  }));
  const all = parsed.flat();
  const total = all.reduce((n, x) => n + x.words, 0);
  const foreign = all.filter((x) => x.foreign).reduce((n, x) => n + x.words, 0);
  if (!foreign || foreign > MAX_FOREIGN_SHARE * total) return list;
  return list
    .map((p, i) => (parsed[i].some((x) => x.foreign) ? parsed[i].filter((x) => !x.foreign).map((x) => render(x.b)).join("") : p))
    .filter((p) => textOf(p));
}

const render = (b) => (b.tag === "h3" || b.tag === "h4" ? `<h3>${b.inner}</h3>` : `<${b.tag}>${b.inner}</${b.tag}>`);
const isHeading = (b) => b.tag === "h3" || b.tag === "h4";
const labelOf = (b) => (b.tag === "p" ? LABEL_RE.exec(b.inner) : null);

export function splitDescription(paragraphs) {
  const blocks = (paragraphs || []).flatMap((p) => toBlocks(String(p || "")));

  // Where the technical part starts: the first heading, else the first of at
  // least two consecutive "Label:" paragraphs.
  let specStart = blocks.findIndex(isHeading);
  if (specStart === -1) {
    specStart = blocks.findIndex((b, i) => labelOf(b) && blocks[i + 1] && labelOf(blocks[i + 1]));
  }
  const prose = specStart === -1 ? blocks : blocks.slice(0, specStart);
  const tech = specStart === -1 ? [] : blocks.slice(specStart);

  // Intro: up to two paragraphs (always at least one block) within ~90 words.
  const intro = [];
  let words = 0;
  for (const b of prose) {
    if (intro.length >= INTRO_PARAGRAPHS || b.tag !== "p") break;
    const w = wordCount(b.inner);
    if (intro.length > 0 && words + w > INTRO_WORDS) break;
    intro.push(b);
    words += w;
  }
  if (!intro.length && prose.length) intro.push(prose[0]);
  const more = prose.slice(intro.length);

  const spec = [];
  let group = null;
  let item = null;
  const ensureGroup = () => {
    if (!group) {
      group = { title: null, items: [], extra: [] };
      spec.push(group);
    }
    return group;
  };
  for (const b of tech) {
    if (isHeading(b)) {
      group = { title: textOf(b.inner), items: [], extra: [] };
      spec.push(group);
      item = null;
      continue;
    }
    const label = labelOf(b);
    if (label) {
      const rest = b.inner.slice(label[0].length).trim();
      item = { label: decodeEntities(label[2].trim()), html: textOf(rest) ? `<p>${rest}</p>` : "" };
      ensureGroup().items.push(item);
      continue;
    }
    if (item) item.html += render(b);
    else ensureGroup().extra.push(render(b));
  }

  return {
    intro: intro.map(render),
    more: more.map(render),
    spec: spec.filter((g) => g.items.length || g.extra.length),
  };
}

// QM wohnen-marken (01.11.2026): a free-text field ("Gewicht 3.3 kg") that the
// manufacturer text also lists as a spec item ("Gewicht") was shown twice in
// "Material und Ausführung" – once open, once as accordion row. The spec row
// (manufacturer data, usually more detailed) wins; the field is dropped.
export function withoutSpecDuplicates(fields, spec) {
  if (!fields?.length) return [];
  const norm = (s) => String(s || "").trim().toLowerCase();
  const labels = new Set((spec || []).flatMap((g) => (g.items || []).map((i) => norm(i.label))));
  return fields.filter((f) => !labels.has(norm(f.label)));
}
