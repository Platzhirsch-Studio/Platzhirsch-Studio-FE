// src/lib/booking/token.js – signierte Verwaltungslinks (Storno, Umbuchen, Gesprächslink).
// Format: "<referenz>.<version>.<ablauf base36>.<HMAC-SHA256 base64url, 32 Zeichen>".
// Der Link steht im URL-Fragment (/{locale}/termin/verwalten#<token>), erreicht
// also nie ein Server-Log; die Seite schickt ihn per POST. Umbuchen erhöht die
// Version, der alte Link gilt dann nicht mehr. Ablauf = Terminende.
// Keine "@/..."-Importe.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const REF_RE = /^PT-[0-9A-Z]{6}$/;
const TOKEN_RE = /^(PT-[0-9A-Z]{6})\.(\d{1,4})\.([0-9a-z]{1,10})\.([A-Za-z0-9_-]{32})$/;

/** Kurze Referenz für Kundin und Team, z. B. „PT-7K3QX9“ (ohne 0/O/1/I). */
export function newReference(bytes = randomBytes(6)) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `PT-${out}`;
}

export const isReference = (v) => typeof v === "string" && REF_RE.test(v);

function sign(secret, body) {
  return createHmac("sha256", secret).update(`termin|${body}`).digest("base64url").slice(0, 32);
}

/** Token für Referenz + Version, gültig bis `expiresAt` (Date oder ms). */
export function signManageToken({ ref, version = 1, expiresAt }, secret) {
  if (!secret) throw new Error("BOOKING_LINK_SECRET fehlt");
  if (!isReference(ref)) throw new Error("bad ref");
  const exp = Math.floor(new Date(expiresAt).getTime() / 1000).toString(36);
  const body = `${ref}.${Number(version)}.${exp}`;
  return `${body}.${sign(secret, body)}`;
}

/** → { ok: true, ref, version, expiresAt } | { ok: false, code: "invalid_token" | "expired" } */
export function verifyManageToken(token, secret, now = Date.now()) {
  const m = typeof token === "string" && token.length <= 80 ? TOKEN_RE.exec(token) : null;
  if (!m || !secret) return { ok: false, code: "invalid_token" };
  const [, ref, version, exp, given] = m;
  const expected = sign(secret, `${ref}.${version}.${exp}`);
  if (!timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return { ok: false, code: "invalid_token" };
  const expiresAt = parseInt(exp, 36) * 1000;
  if (expiresAt < now) return { ok: false, code: "expired", ref };
  return { ok: true, ref, version: Number(version), expiresAt };
}

// ---------------------------------------------------------------------------
// Bestätigung der E-Mail-Adresse (Double-Opt-in, Spezifikation B5).
// Link: /{locale}/termin/bestaetigen#<referenz>.<zufall 32 Byte base64url>.
// Gespeichert wird nur der SHA-256 des Zufallsteils (`verifyHash`), im
// Frappe-Betrieb geht auch nur der Hash ans Backoffice.
const VERIFY_RE = /^(PT-[0-9A-Z]{6})\.([A-Za-z0-9_-]{43})$/;

export function newVerifyToken(bytes = randomBytes(32)) {
  return Buffer.from(bytes).toString("base64url");
}

export const verifyHashOf = (token) => createHash("sha256").update(`termin-verify|${token}`).digest("hex");

export const verifyLinkOf = (ref, token) => `${ref}.${token}`;

/** "<ref>.<token>" → { ref, token } | null */
export function parseVerifyLink(value) {
  const m = typeof value === "string" && value.length <= 60 ? VERIFY_RE.exec(value) : null;
  return m ? { ref: m[1], token: m[2] } : null;
}

/** Hash-Vergleich in konstanter Zeit. */
export function verifyMatches(token, hash) {
  if (typeof hash !== "string" || hash.length !== 64) return false;
  return timingSafeEqual(Buffer.from(verifyHashOf(token)), Buffer.from(hash));
}
