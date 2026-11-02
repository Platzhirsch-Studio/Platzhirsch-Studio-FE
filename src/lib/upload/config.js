// src/lib/upload/config.js
// Shared limits and texts for "Handy-Upload per QR" (client AND server — no
// Node imports here). Feature doc: Marktresearch/digital/features/handy-upload.md

const MB = 1024 * 1024;

export const UPLOAD_CONFIG = {
  // How long the QR link accepts uploads after the inquiry.
  tokenTtlDays: 14,
  // Löschfrist: files are deleted this many days after the upload link
  // expires, unless the inquiry turns into an order (then they move to the
  // order record in the backoffice). 180 days is the developer's proposal;
  // the owner has not confirmed it yet (r1-recht-inhalt P0-4).
  retentionDays: 180,
  // false = the period above is not confirmed by the owner. While false the
  // upload takes NOTHING: /de/upload/<token> shows a calm notice with the
  // other channels, the API routes answer 503 "upload_paused", the inquiry
  // forms show no upload card and /de/upload is a plain service page. No
  // consent text is shown, so no placeholder can ever reach a customer.
  // Set true together with the owner's written decision.
  retentionConfirmed: false,
  // 4 MB chunks: below the 10 MB request-body buffer of the Next.js proxy and
  // typical reverse-proxy limits, small enough to retry cheaply on mobile data.
  chunkSize: 4 * MB,
  maxFiles: 40,
  maxTotalBytes: 1536 * MB,
  // Abuse guard: a new link starts with a small quota (one long video fits);
  // the full maxTotalBytes unlocks once the first file arrived complete.
  initialQuotaBytes: 350 * MB,
  // Global guards for the whole server (all links together).
  maxNewSessionsPerDay: 300,
  maxStoreBytes: 20 * 1024 * MB,
  // Rate limits (lib/upload/http.js, store: lib/upload/limitStore.js).
  // mint = new upload links (POST /api/upload/session) per hour: perIp only
  // behind UPLOAD_TRUSTED_IP_HEADER, all = every visitor together.
  // link = per upload link within 10 min (a full 1.5 GB link needs ~385 chunk PUTs).
  rateLimits: {
    mint: { perIp: 10, all: 120, windowMs: 60 * 60 * 1000 },
    link: { init: 200, chunk: 1500, note: 60, remove: 200, windowMs: 10 * 60 * 1000, retryAfterSeconds: 120 },
    // QM fix2 P2-1: a shared store slower than this counts in memory instead.
    storeTimeoutMs: 300,
  },
  // The inquiry route returns a signed ticket; only with it can the success
  // screen ask for an upload link (POST /api/upload/session).
  ticketTtlMinutes: 30,
  // Demo links (kind "demo"): tiny limits, deleted after ttlMinutes. Only
  // tests and local development mint them; /de/upload no longer shows a demo
  // (r1-recht-inhalt P0-4). Refused in production unless UPLOAD_DEMO_ENABLED=1.
  demo: { ttlMinutes: 60, maxFiles: 5, maxTotalBytes: 40 * MB },
  noteMaxLength: 2000,
  // Raum-Rundgang: soft limit checked in the browser (server only knows bytes).
  videoMaxSeconds: 120,
  categories: {
    photo: { label: "Foto", labelPlural: "Fotos", maxBytes: 30 * MB, families: ["image"] },
    video: { label: "Video", labelPlural: "Videos", maxBytes: 300 * MB, families: ["video"] },
    plan: { label: "Plan", labelPlural: "Pläne", maxBytes: 50 * MB, families: ["pdf", "image"] },
  },
};

/**
 * Löschfrist for other packages (F3: menu/feature switches, Datenschutz):
 * days after the link expires, and whether the owner confirmed it.
 */
export const UPLOAD_RETENTION_DAYS = UPLOAD_CONFIG.retentionDays;
export const UPLOAD_RETENTION_CONFIRMED = UPLOAD_CONFIG.retentionConfirmed;

/**
 * Does the upload accept files? Only with a confirmed Löschfrist. For unit
 * tests and local development UPLOAD_ACCEPT_UNCONFIRMED=1 opens it outside
 * production; in production (NODE_ENV=production) the override is ignored.
 */
export function uploadsAccepting(env = typeof process !== "undefined" ? process.env : {}) {
  if (UPLOAD_CONFIG.retentionConfirmed) return true;
  return env?.NODE_ENV !== "production" && env?.UPLOAD_ACCEPT_UNCONFIRMED === "1";
}

/** Reason code of the API routes while uploadsAccepting() is false. */
export const UPLOAD_PAUSED = "upload_paused";

export const CATEGORY_KEYS = Object.keys(UPLOAD_CONFIG.categories);

// Which form the upload link belongs to. One letter goes into the token.
export const KINDS = {
  produkt: { code: "P", label: "Produktanfrage" },
  beratung: { code: "B", label: "Beratungsanfrage" },
  kontakt: { code: "K", label: "Kontaktanfrage" },
  demo: { code: "D", label: "Demo" },
};

export const KIND_KEYS = Object.keys(KINDS);

// v2 (QA round 1, P2-3): short consent sentence + expandable details.
export const CONSENT_VERSION = "2026-10-v2";

// Error codes that can never succeed on retry (file is "rejected").
export const FINAL_ERRORS = new Set(["unsupported_type", "too_large", "too_many_files", "quota_exceeded", "bad_category"]);

/** Limits of one session (demo links are much smaller). */
export function limitsFor({ demo, files = [] } = {}) {
  if (demo) return { maxFiles: UPLOAD_CONFIG.demo.maxFiles, maxTotalBytes: UPLOAD_CONFIG.demo.maxTotalBytes };
  const unlocked = files.some((f) => f.status === "complete");
  return {
    maxFiles: UPLOAD_CONFIG.maxFiles,
    maxTotalBytes: unlocked ? UPLOAD_CONFIG.maxTotalBytes : UPLOAD_CONFIG.initialQuotaBytes,
  };
}

// Dates are always shown in the showroom's time zone, so server and browser
// render the same string (no hydration mismatch).
export const DATE_FMT = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vienna" });
export const DATETIME_FMT = new Intl.DateTimeFormat("de-AT", {
  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna",
});

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * MB) return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0).replace(".", ",")} MB`;
  return `${(bytes / (1024 * MB)).toFixed(1).replace(".", ",")} GB`;
}
