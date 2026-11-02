// src/components/MarkenItems/copy.js
// Texts of the redesigned brand pages live in src/messages/*.json
// (namespaces `marken` and `markenIndex`), single source since R4-i18n.
// The former fallback table COPY (a copy of those messages in all four
// languages) is removed; tests/unit/r4-i18n.test.mjs checks that every
// `tr("…")` key of the brand pages exists in all four locales.
//
// Voice (Bibel §1): Sie-Form (IT: tu), facts, no "Luxus/exklusiv/führend",
// brands are "gezeigt" or "geplant", never "geführt" or "offiziell vertreten".

/**
 * Translator for the brand pages: `tr(key, values)` and `tr.raw(key)`.
 * Works with the `t` of getTranslations (server) and useTranslations.
 * `locale` and `namespace` are kept for the existing call signature; the
 * namespace is already bound in `t`.
 */
export function makeTr(t, locale, namespace) {
  const tr = (key, values) => t(key, values);
  tr.raw = (key) => t.raw(key);
  return tr;
}

/**
 * QM wohnen-marken (01.11.2026): on /marken/minotti the studio sentence of the
 * Claim-Guard stood twice – in the guide ("Das Minotti Studio by …") and again
 * as first paragraph of "Minotti am Bodensee". Paragraphs whose full text the
 * guide already shows are dropped from the later block; the data stays intact.
 */
export function withoutRepeatedParagraphs(paragraphs, shownParagraphs) {
  const shown = (shownParagraphs || []).join("\n");
  return (paragraphs || []).filter((p) => !(p && shown.includes(p)));
}

/**
 * QM wm-fix4: the studio sentence still stood twice – in the guide section
 * "Das Minotti Studio by …" and in "Im Showroom", where it carries the
 * evidence link (Inhaber-Entscheidung Nr. 22). Removes that exact sentence
 * from the guide paragraphs (whitespace tidied, empty paragraphs dropped);
 * the Claim-Guard text itself stays unchanged.
 * @param {string[]} paragraphs
 * @param {string} sentence  exact sentence shown elsewhere on the page
 */
export function withoutSentence(paragraphs, sentence) {
  const s = String(sentence || "").trim();
  if (!s) return paragraphs || [];
  return (paragraphs || [])
    .map((p) => (p && p.includes(s) ? p.replace(s, "").replace(/\s{2,}/g, " ").trim() : p))
    .filter(Boolean);
}

/** "/de/sofaplaner?lang=fr#x" → "/sofaplaner": the target of a link, locale and query aside. */
export function linkKey(href) {
  const path = String(href || "")
    .replace(/[?#].*$/, "")
    .replace(/^\/(de|en|fr|it)(?=\/|$)/, "")
    .replace(/\/+$/, "");
  return path || "/";
}

/**
 * QM wm-r4 (/marken/minotti): "Ratgeber: Was kostet ein Minotti-Sofa?" stood
 * twice, the Sofaplaner three times in the link lists. Keeps the first link
 * per target and drops targets already shown elsewhere (`taken` hrefs).
 * @param {{href: string}[]} links
 * @param {string[]} [taken]
 */
export function uniqueLinks(links, taken = []) {
  const seen = new Set((taken || []).map(linkKey));
  return (links || []).filter((l) => {
    if (!l?.href) return false;
    const key = linkKey(l.href);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
