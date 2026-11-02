// src/components/Freigaben/model.js — Freigabe-Cockpit (R6-uebergabe).
// Pure view-model functions: they take the data the page imports from the
// owning modules and turn it into rows. Nothing here writes, fetches or sends.
// Relative imports only (no "@/", no "server-only"), so node --test can import
// this file: tests/unit/r6-uebergabe.test.mjs.
import { EMBARGO_RE, MARKER_RE } from "../../lib/ratgeber/review.js";
import { APPROVABLE_FIELDS, approvedFaqItems, isEntryApproved, isFieldApproved, staleApprovals } from "../../lib/productCopy/approvals.js";
import { TERMS_RELEASED, atelierMode, commercePreviewEnabled, voucherMode, voucherModeRequested } from "../../lib/commerce/mode.js";
import { TERMS_STAND, TERMS_STATUS, termsOpenCounts } from "../../lib/commerce/voucherTerms.js";
import { TERMS_OWNER_FIELDS, termsFieldsOpen } from "../../lib/commerce/voucherTermsFields.js";
import { LEGAL_APPROVAL, legalLiveRows } from "../LegalDrafts/liveStatus.js";

export const COCKPIT_PATH = "/de/preview/freigaben";

/**
 * Visible in development, or in a production build with FREIGABE_PREVIEW=1.
 * Never on a Vercel production deployment (same rule as the legal and
 * commerce previews), even if the variable was set there by mistake.
 */
export function freigabePreviewEnabled(env = process.env) {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.FREIGABE_PREVIEW === "1";
}

/** robots for the cockpit: never indexed, links not followed. */
export const COCKPIT_ROBOTS = Object.freeze({
  index: false,
  follow: false,
  nocache: true,
  googleBot: Object.freeze({ index: false, follow: false }),
});

// ---------------------------------------------------------------- helpers

const EMBARGO_GLOBAL = new RegExp(EMBARGO_RE.source, "giu");
const MARKER_GLOBAL = new RegExp(MARKER_RE.source, "giu");

/** Names under embargo (Ratgeber review.js) never appear in the cockpit. */
export function maskEmbargo(text) {
  return String(text ?? "").replace(EMBARGO_GLOBAL, "[gesperrter Name]");
}

function shorten(text, max = 110) {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** 1-based line of the first line matching `pattern`, or null. */
export function lineOf(source, pattern) {
  if (typeof source !== "string") return null;
  const lines = source.split(/\r?\n/);
  const i = lines.findIndex((l) => pattern.test(l));
  return i === -1 ? null : i + 1;
}

/** All lines matching `pattern` (1-based). */
export function linesOf(source, pattern) {
  if (typeof source !== "string") return [];
  return source.split(/\r?\n/).flatMap((l, i) => (pattern.test(l) ? [i + 1] : []));
}

/**
 * Review markers ([prüfen], [prüfen: …], [… eintragen], [Name, Funktion]) of
 * one Markdown source with their line, embargo names masked.
 * @returns {Array<{ line: number, text: string }>}
 */
export function markerLines(raw) {
  const out = [];
  String(raw ?? "")
    .split(/\r?\n/)
    .forEach((l, i) => {
      for (const m of l.matchAll(MARKER_GLOBAL)) out.push({ line: i + 1, text: shorten(maskEmbargo(m[0])) });
      if (EMBARGO_RE.test(l) && !MARKER_RE.test(l)) out.push({ line: i + 1, text: "[gesperrter Name im Text]" });
    });
  return out;
}

// ---------------------------------------------------------------- Ratgeber

/**
 * Review line for one Ratgeber row. "geprüft" only when the article is
 * released and a reviewer is entered; a date alone reads "Datum … eingetragen,
 * Prüfung offen", so owners do not take it for a finished review
 * (QM-Feedback R6-uebergabe P2.2).
 */
export function ratgeberReviewLabel(r = {}) {
  const d = r.geprueftAm ? String(r.geprueftAm).split("-").reverse().join(".") : null;
  if (r.freigegeben === true && r.reviewedBy) return `geprüft${d ? ` am ${d}` : ""}, Prüfer eingetragen`;
  return [
    d ? `Datum ${d} eingetragen` : "kein Datum eingetragen",
    r.reviewedBy ? "Prüfer eingetragen" : "kein Prüfer eingetragen",
    "Prüfung offen",
  ].join(", ");
}

/**
 * @param {Array} articles  listRatgeber() (built, filtered articles)
 * @param {Array<{ file: string, slug: string, raw: string }>} sources  raw Markdown per file
 */
export function ratgeberRows(articles = [], sources = []) {
  const bySlug = new Map(sources.map((s) => [s.slug, s]));
  return articles.map((a) => {
    const src = bySlug.get(a.slug);
    const markers = src ? markerLines(src.raw) : [];
    return {
      slug: a.slug,
      title: maskEmbargo(a.title),
      rubrik: a.rubrik,
      freigegeben: a.freigegeben === true,
      reviewedBy: a.reviewedBy ? "eingetragen" : null,
      geprueftAm: a.geprueftAm,
      file: src ? `src/content/ratgeber/${src.file}` : null,
      freigabeLine: src ? lineOf(src.raw, /^freigegeben\s*:/) : null,
      reviewedByLine: src ? lineOf(src.raw, /^reviewedBy\s*:/) : null,
      markers,
      href: `/de/ratgeber/${a.slug}`,
    };
  });
}

// ---------------------------------------------------------------- Produkttexte

export const COPY_STATUS = Object.freeze({
  freigegeben: "Ganz freigegeben",
  teilweise: "Teilweise freigegeben",
  veraltet: "Freigabe veraltet (Text geändert)",
  offen: "Nicht freigegeben",
});

/** Status of one product-copy entry (text-hash approvals, approvals.js). */
export function copyStatus(entry) {
  const stale = staleApprovals(entry);
  if (isEntryApproved(entry)) return "freigegeben";
  const fields = APPROVABLE_FIELDS.filter((f) => isFieldApproved(entry, f));
  const faq = approvedFaqItems(entry).length;
  if (fields.length || faq) return stale.length ? "veraltet" : "teilweise";
  return stale.length ? "veraltet" : "offen";
}

/**
 * @param {Array} entries  getProductCopyDraft() (all entries)
 * @param {string[]} startList  START_LIST (suggested reading order)
 */
export function productCopyRows(entries = [], startList = []) {
  const rank = new Map(startList.map((k, i) => [k, i + 1]));
  return entries
    .map((e) => {
      const faqTotal = Array.isArray(e.faq) ? e.faq.length : 0;
      return {
        key: e.key,
        brand: e.brand,
        productName: e.productName,
        status: copyStatus(e),
        fields: APPROVABLE_FIELDS.filter((f) => isFieldApproved(e, f)),
        faqApproved: approvedFaqItems(e).length,
        faqTotal,
        stale: staleApprovals(e),
        start: rank.get(e.key) || null,
        href: e.catalog?.path ? `/de${e.catalog.path}?produkttext=vorschau` : null,
      };
    })
    .sort((a, b) => (a.start || 999) - (b.start || 999) || String(a.key).localeCompare(String(b.key), "de"));
}

export function countBy(rows, key) {
  const out = {};
  for (const r of rows) out[r[key]] = (out[r[key]] || 0) + 1;
  return out;
}

// ---------------------------------------------------------------- Bildregister

/**
 * Hero photos of the landing pages from the image register (imagery.js).
 * @param {string[]} paths  page paths ("/kuechen-vorarlberg")
 * @param {(path: string) => object} overridesFor  imageOverrides
 */
export function imageRows(paths = [], overridesFor = () => ({})) {
  return [...new Set(paths)]
    .map((p) => ({ path: p, hero: overridesFor(p)?.hero }))
    .filter((r) => r.hero)
    .map((r) => ({
      path: r.path,
      released: r.hero.released !== false,
      src: r.hero.src,
      alt: r.hero.alt,
      href: `/de${r.path}`,
    }))
    .sort((a, b) => Number(a.released) - Number(b.released) || a.path.localeCompare(b.path, "de"));
}

// ---------------------------------------------------------------- Rechtsentwürfe

/**
 * @param {Record<string, object>} docs  DOCS from components/LegalDrafts
 * @param {(doc: object) => object} counts  docCounts
 */
export function legalRows(docs = {}, counts = () => ({})) {
  return Object.entries(docs).map(([slug, doc]) => {
    const c = counts(doc) || {};
    return {
      slug,
      title: doc.title,
      total: c.total || 0,
      anwalt: c.anwalt || 0,
      inhaber: c.inhaber || 0,
      pruefen: c.pruefen || 0,
      href: `/de/preview/recht/${slug}`,
    };
  });
}

/** Live-Status aller Rechtstexte (Kanzlei-Freigabe, Inhaber-Entscheidung Nr. 11). */
export function legalLiveStatus() {
  return { approval: LEGAL_APPROVAL, rows: legalLiveRows() };
}

// ---------------------------------------------------------------- Commerce

export function commerceStatus(env = process.env) {
  const open = termsOpenCounts();
  return {
    termsStatus: TERMS_STATUS,
    termsReleased: TERMS_STATUS === TERMS_RELEASED,
    termsStand: TERMS_STAND,
    termsOpen: Object.entries(open).map(([marker, n]) => ({ marker, n })),
    termsFields: TERMS_OWNER_FIELDS.map((f) => ({ id: f.id, section: f.section, label: f.label, filled: !termsFieldsOpen([f]).length })),
    termsFieldsOpen: termsFieldsOpen().length,
    voucher: voucherMode(env),
    voucherRequested: voucherModeRequested(env),
    atelier: atelierMode(env),
    previewOn: commercePreviewEnabled(env),
  };
}

// ---------------------------------------------------------------- Schweiz-Hub

/**
 * Every entry of the Schweiz-Hub content that carries `pruefen` (not rendered
 * on the page, open for Steuerberater/Zollspediteur/Inhaber).
 * @param {Record<string, unknown>} content  `import * as CH from lib/ch/content`
 * @returns {Array<{ block: string, label: string, pruefen: string }>}
 */
export function schweizOpen(content = {}) {
  const out = [];
  const walk = (value, block, depth) => {
    if (!value || typeof value !== "object" || depth > 8) return;
    if (Array.isArray(value)) {
      for (const v of value) walk(v, block, depth + 1);
      return;
    }
    if (typeof value.pruefen === "string" && value.pruefen) {
      out.push({ block, label: shorten(value.text || value.q || value.name || value.label || "–", 90), pruefen: shorten(value.pruefen, 140) });
    }
    for (const v of Object.values(value)) if (v && typeof v === "object") walk(v, block, depth + 1);
  };
  for (const [name, value] of Object.entries(content)) walk(value, name, 0);
  return out;
}

// ---------------------------------------------------------------- Schalter

/**
 * Effective state of the switches (never the values of variables).
 * @param {object} s  { voucher, voucherRequested, atelier, commercePreview,
 *   legalPreview, planerSenden, booking, portalLogin, portalMail }
 */
export function switchRows(s) {
  return [
    {
      name: "VOUCHER_MODE",
      state: s.voucher === s.voucherRequested ? s.voucher : `${s.voucherRequested}, wirksam ${s.voucher}`,
      on: s.voucher !== "off",
      note: s.voucher === "off" ? "Gutscheinseiten und API liefern 404" : "Gutschein-Anfragen aktiv, kein Geld",
    },
    {
      name: "ATELIER_MODE",
      state: s.atelier,
      on: s.atelier !== "off",
      note: s.atelier === "off" ? "Atelierverkauf und API liefern 404" : "Reservierungsanfragen aktiv, kein Geld",
    },
    // Shop Accessoire-Welt (Nr. 29): live nur mit vollständiger Freigabe (src/lib/shop/release.js).
    ...(s.shop
      ? [{ name: "SHOP_MODE", state: s.shop.mode === s.shop.requested ? s.shop.mode : `${s.shop.requested}, wirksam ${s.shop.mode}`, on: s.shop.mode !== "off", note: s.shop.mode === "live" ? "Onlineshop live" : `Freigabe offen: ${s.shop.open} Punkte (src/lib/shop/release.js)` }]
      : []),
    { name: "COMMERCE_PREVIEW", state: s.commercePreview ? "Vorschau sichtbar" : "aus", on: s.commercePreview, note: "nur Vorschau /de/preview/commerce, nie in Produktion setzen" },
    { name: "LEGAL_PREVIEW", state: s.legalPreview ? "Vorschau sichtbar" : "aus", on: s.legalPreview, note: "nur Anwalts-Vorschau /de/preview/recht, nie in Produktion setzen" },
    {
      name: "NEXT_PUBLIC_LABS_PLANER_SENDEN",
      state: s.planerSenden ? "an" : "aus",
      on: s.planerSenden,
      note: "Senden und Speichern im Küchen- und Sofaplaner (Produktions-Build), erst nach Datenschutz-Abschnitt „Online-Planer“",
    },
    { name: "BOOKING_PROVIDER", state: s.booking, on: s.booking !== "none", note: "Termin-Link auf /beratung; „none“ = nichts sichtbar" },
    {
      name: "Portal (PORTAL_SESSION_SECRET)",
      state: s.portalLogin ? "Login möglich, noch nicht freigegeben" : "Login aus",
      on: s.portalLogin,
      warn: s.portalLogin,
      note: "bleibt aus bis Next 16.4.2 (Server-Actions-DoS, release-check.md R4.6)",
    },
    { name: "Portal-Mails (PORTAL_MAIL_PROVIDER)", state: s.portalMail ? "eingerichtet, erst mit dem Portal freigeben" : "nicht eingerichtet", on: s.portalMail, warn: s.portalMail, note: "im Dev-Server gilt der Versand als Testmodus" },
  ];
}
