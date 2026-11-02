// Legal draft previews (R3-recht-vorschau): rendered drafts from
// Marktresearch/recht for the law firm, at /de/preview/recht/<slug>.
// Never live: only in development or with LEGAL_PREVIEW=1, always noindex,
// not in any sitemap. The live pages /datenschutz and /impressum stay as they are.
import DATENSCHUTZ from "./docs/datenschutz";
import IMPRESSUM from "./docs/impressum";
import AGB from "./docs/agb";
import BARRIEREFREIHEIT from "./docs/barrierefreiheit";
import { openPoints } from "./inline";

export const DOCS = {
  datenschutz: DATENSCHUTZ,
  impressum: IMPRESSUM,
  agb: AGB,
  barrierefreiheit: BARRIEREFREIHEIT,
};

export const DOC_SLUGS = Object.keys(DOCS);

/**
 * Visible in development, or in a production build with LEGAL_PREVIEW=1.
 * Never on a Vercel production deployment (VERCEL_ENV=production), even if
 * LEGAL_PREVIEW was set there by mistake – preview/staging builds only.
 */
export function legalPreviewEnabled(env = process.env) {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.LEGAL_PREVIEW === "1";
}

export function getDoc(slug) {
  return Object.hasOwn(DOCS, slug) ? DOCS[slug] : null;
}

/** All strings of one block (paragraph, list, address, table, note). */
export function blockTexts(block) {
  if (typeof block === "string") return [block];
  if (!block || typeof block !== "object") return [];
  if (block.h) return [block.h];
  if (block.ul || block.ol) return block.ul || block.ol;
  if (block.address) return block.address;
  if (block.table) return [...block.table.head, ...block.table.rows.flat()];
  if (block.note) return [].concat(block.note);
  return [];
}

/** Open points of one section's own blocks (not of its sub-sections). */
export function sectionOpenPoints(section) {
  return (section.blocks || []).flatMap(blockTexts).flatMap(openPoints);
}

/** [{ id, num, title, points }] for the header and every (sub-)section. */
export function docOpenPoints(doc) {
  const head = [doc.version, ...blockTexts(doc.intro)].flatMap(openPoints);
  const out = head.length ? [{ id: "kopf", num: "", title: "Kopf und Vorbemerkung", points: head }] : [];
  for (const s of doc.sections) {
    const own = sectionOpenPoints(s);
    if (own.length) out.push({ id: s.id, num: s.num, title: s.title, points: own });
    for (const sub of s.sub || []) {
      const p = sectionOpenPoints(sub);
      if (p.length) out.push({ id: sub.id, num: sub.num, title: sub.title, points: p });
    }
  }
  return out;
}

/**
 * Counts per kind for one document: { anwalt, inhaber, pruefen, total, parts }.
 * total = outermost brackets (the counting rule); parts = brackets nested in
 * them, shown for transparency, not added to total.
 */
export function docCounts(doc) {
  const counts = { anwalt: 0, inhaber: 0, pruefen: 0, total: 0, parts: 0 };
  for (const group of docOpenPoints(doc)) {
    for (const p of group.points) {
      counts[p.kind]++;
      counts.total++;
      counts.parts += p.parts || 0;
    }
  }
  return counts;
}
