// src/lib/productCopy/approvals.js
// Sign-off of the curated product copy, bound to the exact text (text hash).
// Pure functions, no dependencies: runs in Next (server), node --test,
// build.mjs and approve.mjs.
//
// Rule: an approval belongs to the exact text that was read. It is stored
// together with a hash of that text; if the text changes afterwards (new
// build.mjs run, hand edit), the hash no longer matches and the text is
// hidden again until someone re-approves it. A bare "approved": true without
// a matching hash publishes NOTHING.
//
// Two forms (both written by approve.mjs, never by build.mjs):
//   1. whole entry:  "approved": true, "approvalHash": entryHash(entry)
//   2. per field:    "approvals": {
//                      "meta" | "h1" | "paragraphs" | "facts": { "hash", "by", "at" },
//                      "faq": [{ "hash", "by", "at" }]   // one per approved Q&A
//                    }
// Per-field approval lets the owner publish e.g. the facts and two of three
// FAQ answers while a paragraph is still being checked.

/** Fields whose text is published; any change here needs a new sign-off. */
export const APPROVAL_CONTENT_FIELDS = Object.freeze([
  "brand",
  "productName",
  "catalog.path",
  "meta",
  "h1",
  "paragraphs",
  "facts",
  "faq",
  "keywords",
]);

/** Fields that can be approved one by one (FAQ: per question/answer pair). */
export const APPROVABLE_FIELDS = Object.freeze(["meta", "h1", "paragraphs", "facts"]);

function pick(entry, field) {
  return field.split(".").reduce((v, k) => (v == null ? undefined : v[k]), entry);
}

/** Stable string of the published content of one entry. */
export function approvalFingerprint(entry) {
  return JSON.stringify(APPROVAL_CONTENT_FIELDS.map((f) => [f, pick(entry, f) ?? null]));
}

// cyrb53 (public domain), two seeds -> 106 bits as hex. Detects any edit of
// the approved text; not a security boundary (de.json is in the repo).
function cyrb53(str, seed) {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

/** "t1:<hex>" hash of any JSON-serialisable value. */
export function textHash(value) {
  const s = JSON.stringify(value ?? null);
  return `t1:${cyrb53(s, 0)}${cyrb53(s, 0x9e3779b9)}`;
}

/** Hash for the whole-entry approval. */
export function entryHash(entry) {
  return textHash(approvalFingerprint(entry));
}

/** Hash for one approvable field (meta, h1, paragraphs, facts). */
export function fieldHash(entry, field) {
  return textHash([entry?.productSlug ?? null, field, entry?.[field] ?? null]);
}

/** Hash for one FAQ item (question + answer). */
export function faqItemHash(entry, item) {
  return textHash([entry?.productSlug ?? null, "faq", item?.question ?? null, item?.answer ?? null]);
}

/** true if the whole entry carries an approval whose hash matches its current text. */
export function isEntryApproved(entry) {
  return entry?.approved === true && typeof entry.approvalHash === "string" && entry.approvalHash === entryHash(entry);
}

/** true if `field` is approved for its current text (whole entry or per field). */
export function isFieldApproved(entry, field) {
  if (!entry || !APPROVABLE_FIELDS.includes(field)) return false;
  if (isEntryApproved(entry)) return true;
  const a = entry.approvals?.[field];
  return typeof a?.hash === "string" && a.hash === fieldHash(entry, field);
}

/** The FAQ items whose current question + answer were approved. */
export function approvedFaqItems(entry) {
  const faq = Array.isArray(entry?.faq) ? entry.faq.filter((f) => f?.question && f?.answer) : [];
  if (isEntryApproved(entry)) return faq;
  const hashes = new Set((Array.isArray(entry?.approvals?.faq) ? entry.approvals.faq : []).map((a) => a?.hash).filter(Boolean));
  return faq.filter((item) => hashes.has(faqItemHash(entry, item)));
}

/**
 * Signs an entry (used by approve.mjs; never by build.mjs).
 * @param {object} entry
 * @param {{ fields?: 'all' | string[], faq?: 'all' | number[], by: string, at: string }} opts
 *   fields 'all' -> whole-entry approval; otherwise per field / per FAQ index.
 * @returns {object} new entry
 */
export function signApproval(entry, { fields = "all", faq = [], by, at } = {}) {
  if (!by || !at) throw new Error("signApproval: by und at sind Pflicht");
  if (fields === "all") {
    return { ...entry, approved: true, approvalHash: entryHash(entry), approvedBy: by, approvedAt: at };
  }
  const approvals = { ...(entry.approvals || {}) };
  for (const f of fields) {
    if (!APPROVABLE_FIELDS.includes(f)) throw new Error(`signApproval: unbekanntes Feld ${f}`);
    approvals[f] = { hash: fieldHash(entry, f), by, at };
  }
  const items = Array.isArray(entry.faq) ? entry.faq : [];
  const indexes = faq === "all" ? items.map((_, i) => i) : faq;
  if (indexes.length) {
    const list = Array.isArray(approvals.faq) ? [...approvals.faq] : [];
    for (const i of indexes) {
      if (!items[i]) throw new Error(`signApproval: FAQ ${i} gibt es nicht`);
      const hash = faqItemHash(entry, items[i]);
      if (!list.some((a) => a.hash === hash)) list.push({ hash, by, at });
    }
    approvals.faq = list;
  }
  return { ...entry, approvals };
}

/** "<key>:<field>" for every per-field approval whose text changed. */
export function staleApprovals(entry) {
  const out = [];
  if (entry?.approved === true && !isEntryApproved(entry)) out.push(`${entry.key}:entry`);
  const a = entry?.approvals || {};
  for (const f of APPROVABLE_FIELDS) if (a[f] && !isFieldApproved({ ...entry, approved: false }, f)) out.push(`${entry.key}:${f}`);
  if (Array.isArray(a.faq)) {
    const current = new Set((entry.faq || []).map((item) => faqItemHash(entry, item)));
    a.faq.forEach((x, i) => {
      if (!current.has(x?.hash)) out.push(`${entry.key}:faq#${i}`);
    });
  }
  return out;
}

/**
 * Merges approvals from the previous data file into freshly generated entries.
 * The hashes decide at runtime what is shown, so carrying them over is safe:
 * an approval of changed text simply stops matching.
 * @param {Array} previousEntries entries of the existing de.json ([] if none)
 * @param {Array} nextEntries     generated entries (approved:false)
 * @returns {{ entries: Array, kept: string[], revoked: string[], orphaned: string[], stale: string[] }}
 *   kept     whole-entry approval carried over (content identical)
 *   revoked  was approved, content changed -> approved:false, re-check needed
 *   orphaned was approved, entry no longer generated
 *   stale    per-field approvals that no longer match the new text
 */
export function carryApprovals(previousEntries, nextEntries) {
  const prev = new Map();
  for (const e of Array.isArray(previousEntries) ? previousEntries : []) {
    if (e?.key && (e.approved === true || e.approvals)) prev.set(e.key, e);
  }
  const kept = [];
  const revoked = [];
  const stale = [];
  const entries = nextEntries.map((entry) => {
    const old = prev.get(entry.key);
    if (!old) return entry;
    prev.delete(entry.key);
    let out = entry;
    if (old.approvals) out = { ...out, approvals: old.approvals };
    if (old.approved === true) {
      if (approvalFingerprint(old) !== approvalFingerprint(entry)) {
        revoked.push(entry.key);
        out = { ...out, approved: false };
      } else {
        kept.push(entry.key);
        out = { ...out, approved: true };
        if (old.approvalHash) out.approvalHash = old.approvalHash;
        if (old.approvedBy) out.approvedBy = old.approvedBy;
        if (old.approvedAt) out.approvedAt = old.approvedAt;
      }
    }
    stale.push(...staleApprovals(out).filter((s) => !s.endsWith(":entry")));
    return out;
  });
  return { entries, kept, revoked, orphaned: [...prev.keys()], stale };
}
