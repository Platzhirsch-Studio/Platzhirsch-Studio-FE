// One Ratgeber article: Markdown source (with front matter) → the data the
// page renders. Every text that reaches the page passes the review filter
// (review.js), so no "[prüfen]" passage and no internal section is ever shown.
// Pure module (no "@/", no "server-only"), unit-tested with node --test.
import { parseFrontmatter } from "./frontmatter.js";
import { parseBlocks, slugify, toPlain } from "./markdown.js";
import { cutInternal, extractFaq, filterBlocks, hasEmbargo, hasMarker, removeMarkedSentences, blockText } from "./review.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Only real ISO dates count; placeholders like "[Datum … eintragen]" → null.
export function isoDate(value) {
  const s = typeof value === "string" ? value.trim() : "";
  return ISO_DATE.test(s) ? s : null;
}

// "2026-10-26" → "26.10.2026"
export function formatDate(iso) {
  const d = isoDate(iso);
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return `${day}.${m}.${y}`;
}

function cleanText(value) {
  const s = typeof value === "string" ? value : "";
  return hasMarker(s) ? removeMarkedSentences(s) : s.trim();
}

function asList(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim()) : [];
}

// Unique ids for h2–h4 (and FAQ questions), in document order.
function assignIds(blocks) {
  const seen = new Map();
  const unique = (text) => {
    const base = slugify(text) || "abschnitt";
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  return blocks.map((b) => {
    if (b.type === "heading") return { ...b, id: unique(b.text) };
    if (b.type === "faq") return { ...b, items: b.items.map((it) => ({ ...it, id: unique(it.q) })) };
    return b;
  });
}

export function buildArticle(source, { fallbackSlug } = {}) {
  const { data, body } = parseFrontmatter(source);

  let blocks = parseBlocks(body);
  blocks = cutInternal(blocks);
  blocks = extractFaq(blocks);
  const publicRaw = blocks.map(blockText).join("\n"); // before the review filter
  blocks = filterBlocks(blocks);

  // H1 from the article body (shorter than the SEO title), else front matter.
  const h1Index = blocks.findIndex((b) => b.type === "heading" && b.level === 1);
  const heading = h1Index >= 0 ? blocks[h1Index].text : null;
  if (h1Index >= 0) blocks.splice(h1Index, 1);

  // Answer box: the first paragraph before the first h2 (the core statement).
  const firstH2 = blocks.findIndex((b) => b.type === "heading" && b.level === 2);
  const leadIndex = blocks.findIndex((b, i) => b.type === "paragraph" && (firstH2 === -1 || i < firstH2));
  const lead = leadIndex >= 0 ? blocks[leadIndex].text : null;
  if (leadIndex >= 0) blocks.splice(leadIndex, 1);

  blocks = assignIds(blocks);

  const toc = blocks.filter((b) => b.type === "heading" && b.level === 2).map((b) => ({ id: b.id, text: b.text }));
  const faqBlock = blocks.find((b) => b.type === "faq");
  const faq = faqBlock ? faqBlock.items.map((it) => ({ id: it.id, q: toPlain(it.q), a: it.a.map(toPlain).join(" ") })) : [];

  const title = cleanText(data.title) || cleanText(heading) || "";
  const slug = typeof data.slug === "string" && data.slug ? data.slug : fallbackSlug;

  // Sources: none with an embargo term, and none that the body links only in
  // passages the review filter removed (a source must back visible text).
  const visible = [lead ?? "", ...blocks.map(blockText)].join("\n");
  const quellen = asList(data.quellen)
    .map((q) => q.trim())
    .filter((q) => /^https?:\/\//i.test(q) && !hasEmbargo(q))
    .filter((q) => !publicRaw.includes(q) || visible.includes(q));

  return {
    slug,
    title,
    // <title> for search results (≤ 60 characters); the H1 stays longer.
    seoTitle: cleanText(data.seoTitle) || title,
    heading: cleanText(heading) || title,
    description: cleanText(data.description),
    keywords: asList(data.keywords).filter((k) => !hasMarker(k)),
    rubrik: cleanText(data.rubrik) || "Ratgeber",
    datum: isoDate(data.datum),
    geprueftAm: isoDate(data.geprueft_am),
    updatedAt: isoDate(data.updatedAt) || isoDate(data.datum),
    relatedBrands: asList(data.relatedBrands),
    quellen,
    freigegeben: data.freigegeben === true,
    reviewedBy: typeof data.reviewedBy === "string" && data.reviewedBy.trim() && !hasMarker(data.reviewedBy) ? data.reviewedBy.trim() : null,
    lead,
    blocks,
    toc,
    faq,
  };
}

// Every visible text of an article as one string (tests, plain-text checks).
export function articleText(article) {
  return [
    article.title,
    article.heading,
    article.description,
    article.rubrik,
    article.lead ?? "",
    ...article.blocks.map(blockText),
    ...article.faq.flatMap((f) => [f.q, f.a]),
  ].join("\n");
}
