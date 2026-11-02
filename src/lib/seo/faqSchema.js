// src/lib/seo/faqSchema.js
// FAQ helpers for the GEO FAQ blocks (SEO-Team A, GEO W5, 31.10.2026):
// the visible questions and the FAQPage JSON-LD come from the SAME items
// (Google's rule: markup only for content shown on the page).
//
// Pure module (no '@/' aliases), so node --test can load it
// (tests/unit/seo-faq.test.mjs).

/** Replaces {name} placeholders; unknown ones stay visible (test catches them). */
export function fillVars(text, vars = {}) {
  return String(text ?? "").replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

/** Raw message items [{ q, a }] → filled items, empty pairs dropped. */
export function faqItemsFrom(raw, vars = {}) {
  return (Array.isArray(raw) ? raw : [])
    .map((it) => ({ q: fillVars(it?.q, vars).trim(), a: fillVars(it?.a, vars).replace(/\s{2,}/g, " ").trim() }))
    .filter((it) => it.q && it.a);
}

/** FAQPage node for an absolute page URL. */
export function faqPageSchema(pageUrl, locale, items) {
  if (!items?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: locale === "de" ? "de-AT" : locale,
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}
