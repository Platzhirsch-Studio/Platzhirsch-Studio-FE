// src/lib/stilfinder/config.js
// Settings of the Stil-Finder PDF (Moodboard-Präsentation). Plain module
// without "@/..." imports and without "server-only", so node --test can load
// it (tests/unit/stilfinder-pdf.test.mjs). Read only on the server.
//
// Environment (all optional; documented in
// Marktresearch/digital/features/stilfinder.md, "PDF-Versand"):
//   STILFINDER_MAIL_PROVIDER  resend | postmark | webhook   (unset = dev outbox)
//   STILFINDER_MAIL_ENABLED   "1" switches real delivery on. Without it even a
//                             configured provider only writes the dev outbox.
//   STILFINDER_MAIL_FROM      "Platzhirsch Home Living <studio@platzhirsch.studio>"
//   STILFINDER_MAIL_API_KEY   resend / postmark key
//   STILFINDER_MAIL_WEBHOOK_URL, STILFINDER_MAIL_WEBHOOK_SECRET (HMAC-SHA256)
//   STILFINDER_MAIL_BCC       IGNORED since pdf-lead fix-03 (no hidden copy; a
//                             studio copy needs the customer's opt-in)
//   STILFINDER_PDF_PUBLIC     "1" removes the Labs image-rights hint once the
//                             manufacturers have approved the image use.
import path from "node:path";
import { planTerminHref } from "../kuechenplaner/planTermin.js";

export const SITE_ORIGIN = "https://platzhirsch.studio";

// pdf-lead fix-01: one hand-off for PDF (link + QR), mail and form – the same
// T2 contract as the result page (planTerminHref): ?planer=stil-finder,
// ?produkt="Stil-Finder: <Profil>" and ?plan=<result link>. /beratung and
// /termin read these; the old ?stil= alone was read by neither, so the
// profile got lost on the way to the studio.
export const RESULT_PATH = "/de/stil-finder/ergebnis";

/** Absolute link to the web result (also the accessible version of the PDF). */
export function resultUrl(profile, code = null) {
  const q = code && /^[0-4x]{1,16}$/.test(code) ? `?a=${encodeURIComponent(code)}` : "";
  return `${SITE_ORIGIN}${RESULT_PATH}/${profile.slug}${q}`;
}

/** Termin link with the profile and the result link (calendar → /termin, else /beratung). */
export function terminUrl(profile, { code = null, calendar = false } = {}) {
  return `${SITE_ORIGIN}${planTerminHref({ locale: "de", calendar, planer: "stil-finder", stil: profile.slug, produkt: `Stil-Finder: ${profile.name}`, plan: resultUrl(profile, code) })}`;
}

/** Labs mode: image-rights hint on every page with images. */
export function isLabsMode(env = process.env) {
  return env.STILFINDER_PDF_PUBLIC !== "1";
}

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Limits (see the feature doc, "Rate-Limit").
export const LIMITS = {
  // per IP: PDFs actually generated and sent
  send: { max: 3, windowMs: 10 * 60 * 1000 },
  // per IP: every request, also rejected ones
  attempt: { max: 15, windowMs: 10 * 60 * 1000 },
  // per e-mail address (hashed key), across IPs
  perEmail: { max: 3, windowMs: 24 * 60 * 60 * 1000 },
  // pdf-lead fix-04 (proposal values): the 10-minute window above allows
  // 432 sends per IP and day – to as many third-party addresses. Daily caps
  // per IP and for the whole site protect the sender reputation of
  // platzhirsch.studio and the provider quota (mail bombing with a 2–3 MB PDF).
  ipDaily: { max: 10, windowMs: 24 * 60 * 60 * 1000 },
  globalDaily: { max: 300, windowMs: 24 * 60 * 60 * 1000 },
  // concurrent PDF builds in this process (CPU/memory guard)
  concurrent: 2,
  maxBodyBytes: 4 * 1024,
};

// Performance budget (Aufgabe: < 10 s, < 15 MB).
export const BUDGET = {
  totalMs: 9_000,
  imagesMs: 5_500, // all product images together (first wave + replacements)
  imageTimeoutMs: 4_000, // one image
  catalogMs: 4_000,
  maxPdfBytes: 15 * 1024 * 1024,
  imageMaxPx: 1200, // long edge after resizing
  jpegQuality: 78,
};

// Bild-Tor (QA Runde 1, P1.1): the PDF only goes out with at least this many
// product images (of 20). Missing ones are replaced by other catalogue pieces
// first; below the gate the request ends with 503 "busy" (retry), never with
// a placeholder PDF.
export const IMAGE_GATE = { min: 16, of: 20 };

// Disk cache of the prepared product JPEGs (+ analysis), shared by the main
// process and the PDF worker: .data/stilfinder/img-cache/<hash>.{jpg,json}.
export const IMG_CACHE_DIR = path.join(process.cwd(), ".data", "stilfinder", "img-cache");
export const IMG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const IMG_CACHE_MAX_FILES = 3000;

// Brands whose pictures are shown strictly unaltered: no crop, no tone change
// (Minotti image rules). Their photos are contained on a tone plate.
export const PROTECTED_BRANDS = ["Minotti"];

// Dev outbox: .data/stilfinder/outbox/<id>/{moodboard.pdf, mail.html, mail.txt, meta.json}
export const OUTBOX_DIR = path.join(process.cwd(), ".data", "stilfinder", "outbox");
export const OUTBOX_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const OUTBOX_MAX_ENTRIES = 30;

export const FONT_DIR = path.join(process.cwd(), "src", "lib", "stilfinder", "fonts");
export const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Real delivery only when explicitly switched on and complete. */
export function mailMode(env = process.env) {
  const provider = String(env.STILFINDER_MAIL_PROVIDER || "").toLowerCase();
  if (env.STILFINDER_MAIL_ENABLED !== "1" || !provider) return { mode: "outbox", provider: null, problems: [] };
  const problems = [];
  if (!["resend", "postmark", "webhook"].includes(provider)) problems.push("STILFINDER_MAIL_PROVIDER (resend | postmark | webhook)");
  if (!env.STILFINDER_MAIL_FROM && provider !== "webhook") problems.push("STILFINDER_MAIL_FROM");
  if ((provider === "resend" || provider === "postmark") && !env.STILFINDER_MAIL_API_KEY) problems.push("STILFINDER_MAIL_API_KEY");
  if (provider === "webhook") {
    if (!env.STILFINDER_MAIL_WEBHOOK_URL) problems.push("STILFINDER_MAIL_WEBHOOK_URL");
    if (!env.STILFINDER_MAIL_WEBHOOK_SECRET) problems.push("STILFINDER_MAIL_WEBHOOK_SECRET");
  }
  return { mode: problems.length ? "misconfigured" : "live", provider, problems };
}
