// src/lib/upload/token.js — server only.
// Upload tokens: base64url(payload) + 22-char HMAC-SHA256 tag (128 bit).
// payload = "1|<kindCode>|<ref>|<expiry, unix seconds base36>|<id>"
// <id> is 128 random bits and names the storage folder, so a token can be
// neither guessed nor altered (ref, kind and expiry are covered by the tag).
// No separator between payload and tag: tokens contain no "." (the proxy
// matcher skips paths with dots) and stay short enough for a calm QR code.
import "server-only";
import crypto from "node:crypto";
import { KINDS, UPLOAD_CONFIG } from "./config";

const TAG_LENGTH = 22;
const ID_RE = /^[A-Za-z0-9_-]{22}$/;
const REF_RE = /^[A-Z0-9-]{4,40}$/;
const DEV_FALLBACK = "platzhirsch-upload-dev-secret-NICHT-PRODUKTIV";

let warned = false;

/** Thrown by sign*() when no usable secret exists (production without UPLOAD_TOKEN_SECRET). */
export class TokenSecretMissing extends Error {
  constructor() {
    super("UPLOAD_TOKEN_SECRET (>= 32 Zeichen) fehlt – Upload-Links sind deaktiviert.");
    this.code = "secret_missing";
  }
}

/**
 * The HMAC secret, or null. r1-technik P0-1: a missing secret in production
 * must never turn a page into a 500. verify*() then answer "unavailable",
 * sign*() throw TokenSecretMissing (callers fall back to phone/e-mail).
 */
function secret() {
  const value = process.env.UPLOAD_TOKEN_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    if (!warned) {
      warned = true;
      console.error("[upload] UPLOAD_TOKEN_SECRET (>= 32 Zeichen) fehlt – Upload-Links sind deaktiviert.");
    }
    return null;
  }
  if (!warned) {
    warned = true;
    console.warn("[upload] UPLOAD_TOKEN_SECRET nicht gesetzt – verwende Entwicklungs-Fallback. Niemals produktiv nutzen!");
  }
  return DEV_FALLBACK;
}

/** true when links can be signed and checked (secret present, or development). */
export function tokensAvailable() {
  return secret() !== null;
}

// Domain-separated HMAC: an upload token can never pass as a ticket and vice versa.
function hmac(domain, value) {
  const key = secret();
  if (!key) throw new TokenSecretMissing();
  return crypto.createHmac("sha256", key).update(`${domain}:${value}`).digest("base64url").slice(0, TAG_LENGTH);
}
const tag = (payloadB64) => hmac("upload", payloadB64);

const codeToKind = Object.fromEntries(Object.entries(KINDS).map(([k, v]) => [v.code, k]));

export function newId() {
  return crypto.randomBytes(16).toString("base64url");
}

export function newRef(kind, date = new Date()) {
  const ymd = date.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PH-${KINDS[kind].code}${ymd}-${rand}`;
}

export function signToken({ kind, ref, id, expiresAt }) {
  if (!KINDS[kind]) throw new Error("unknown kind");
  if (!REF_RE.test(ref) || !ID_RE.test(id)) throw new Error("bad ref/id");
  const exp = Math.floor(expiresAt.getTime() / 1000).toString(36);
  const payload = Buffer.from(`1|${KINDS[kind].code}|${ref}|${exp}|${id}`).toString("base64url");
  return payload + tag(payload);
}

/** Returns { ok:true, kind, ref, id, expiresAt } or { ok:false, reason }. */
export function verifyToken(token) {
  if (!tokensAvailable()) return { ok: false, reason: "unavailable" };
  if (typeof token !== "string" || token.length < 40 || token.length > 200 || !/^[A-Za-z0-9_-]+$/.test(token)) {
    return { ok: false, reason: "invalid" };
  }
  const payload = token.slice(0, -TAG_LENGTH);
  const given = Buffer.from(token.slice(-TAG_LENGTH));
  const expected = Buffer.from(tag(payload));
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return { ok: false, reason: "invalid" };
  }
  const parts = Buffer.from(payload, "base64url").toString("utf8").split("|");
  if (parts.length !== 5 || parts[0] !== "1") return { ok: false, reason: "invalid" };
  const [, code, ref, exp, id] = parts;
  const kind = codeToKind[code];
  if (!kind || !REF_RE.test(ref) || !ID_RE.test(id)) return { ok: false, reason: "invalid" };
  const expiresAt = new Date(parseInt(exp, 36) * 1000);
  if (!(expiresAt.getTime() > Date.now())) return { ok: false, reason: "expired", ref, kind, expiresAt };
  return { ok: true, kind, ref, id, expiresAt };
}

export function expiryFromNow(days = UPLOAD_CONFIG.tokenTtlDays) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Fresh demo link for ONE view of /de/upload: random id, short TTL.
 * Nothing is stored until the visitor uploads (sessions are created lazily),
 * so crawlers and reloads leave no folders behind; a reload starts over.
 */
export function demoParts(now = Date.now()) {
  const ymd = new Date(now).toISOString().slice(2, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return {
    kind: "demo",
    ref: `PH-DEMO-${ymd}-${rand}`,
    id: newId(),
    expiresAt: new Date(now + UPLOAD_CONFIG.demo.ttlMinutes * 60 * 1000),
  };
}

// ---- Anfrage-Ticket --------------------------------------------------------
// Issued by POST /api/upload/inquiry/<kind> only AFTER the backoffice accepted
// the inquiry; POST /api/upload/session mints a link only against it.
// Format: base64url(JSON {v,k,n,e,l?,m?}) "." 22-char HMAC tag.
// The session id is derived from the nonce, so replaying a ticket always
// returns the SAME upload link and never creates a second folder.

export function signTicket({ kind, leadRef, email }, now = Date.now()) {
  if (!KINDS[kind] || kind === "demo") throw new Error("unknown kind");
  const body = {
    v: 1,
    k: KINDS[kind].code,
    n: crypto.randomBytes(16).toString("base64url"),
    e: Math.floor(now / 1000) + UPLOAD_CONFIG.ticketTtlMinutes * 60,
    ...(leadRef ? { l: String(leadRef).slice(0, 140) } : {}),
    ...(email ? { m: String(email).slice(0, 200) } : {}),
  };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${hmac("ticket", payload)}`;
}

/** Returns { ok:true, kind, id, leadRef, email } or { ok:false, reason }. */
export function verifyTicket(ticket, now = Date.now()) {
  if (!tokensAvailable()) return { ok: false, reason: "unavailable" };
  if (typeof ticket !== "string" || ticket.length > 1200 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$/.test(ticket)) {
    return { ok: false, reason: "bad_ticket" };
  }
  const [payload, given] = ticket.split(".");
  if (!crypto.timingSafeEqual(Buffer.from(given), Buffer.from(hmac("ticket", payload)))) {
    return { ok: false, reason: "bad_ticket" };
  }
  let body;
  try {
    body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "bad_ticket" };
  }
  const kind = codeToKind[body?.k];
  if (body?.v !== 1 || !kind || kind === "demo" || typeof body.n !== "string" || !Number.isInteger(body.e)) {
    return { ok: false, reason: "bad_ticket" };
  }
  if (body.e * 1000 < now) return { ok: false, reason: "ticket_expired" };
  const id = hmac("ticket-id", body.n);
  return { ok: true, kind, id, leadRef: body.l || null, email: body.m || null };
}
