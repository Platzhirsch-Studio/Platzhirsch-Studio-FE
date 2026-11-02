// src/lib/payments/codes.js
// Gutscheincodes, Bestellnummern und Hashes. Kryptografisch zufällig
// (node:crypto randomBytes), keine Zeit- oder Zählerbestandteile.
//
// Code: 16 Zeichen aus 32 Zeichen ohne Verwechsler (kein 0/O/1/I) = 80 bit,
// angezeigt als PH-XXXX-XXXX-XXXX-XXXX. Testmodus-Codes beginnen mit TEST-
// und lassen sich im Register nicht einlösen.
// Im Register steht nur der SHA-256-Hash und die letzten 4 Zeichen.
// Keine "@/..."-Importe.
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 32 Zeichen
export const CODE_LENGTH = 16;
export const CODE_PREFIX = "PH";
export const TEST_PREFIX = "TEST";

/** n zufällige Zeichen aus ALPHABET (256 / 32 = 8: ohne Verzerrung). */
export function randomChars(n, rng = randomBytes) {
  const bytes = rng(n);
  let out = "";
  for (let i = 0; i < n; i++) out += ALPHABET[bytes[i] & 31];
  return out;
}

/** Neuer Code in Anzeigeform. */
export function newVoucherCode({ test = false, rng } = {}) {
  const raw = randomChars(CODE_LENGTH, rng);
  const groups = raw.match(/.{4}/g).join("-");
  return `${test ? `${TEST_PREFIX}-` : ""}${CODE_PREFIX}-${groups}`;
}

/**
 * Eingabe → Normalform ("TEST-" + 16 Zeichen oder 16 Zeichen) oder null.
 * Toleriert Kleinbuchstaben, Leerzeichen, Bindestriche.
 */
export function normalizeCode(input) {
  let s = String(input ?? "").toUpperCase().replace(/[\s-]/g, "");
  let test = false;
  if (s.startsWith(TEST_PREFIX)) {
    test = true;
    s = s.slice(TEST_PREFIX.length);
  }
  if (s.startsWith(CODE_PREFIX)) s = s.slice(CODE_PREFIX.length);
  if (s.length !== CODE_LENGTH) return null;
  for (const c of s) if (!ALPHABET.includes(c)) return null;
  return `${test ? TEST_PREFIX : ""}${s}`;
}

/** Hash für das Register (Normalform). */
export const codeHash = (normalized) => createHash("sha256").update(`ph-voucher:${normalized}`).digest("hex");

/** Bestellnummer, z. B. G-7KQ2-M9XA (Gutschein) oder AZ-… (Anzahlung). */
export function newOrderId(prefix = "G", rng) {
  const raw = randomChars(8, rng);
  return `${prefix}-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Ereignis-/Session-ähnliche Id für den Mock. */
export const newMockId = (prefix) => `${prefix}_mock_${randomBytes(12).toString("hex")}`;

/** Kurzer, nicht umkehrbarer Bezug für Logs (z. B. E-Mail, Session). */
export const logRef = (value) => (value ? createHash("sha256").update(String(value)).digest("hex").slice(0, 10) : "-");

// ---------- Anzahlungs-Links ----------
// Token = <Anzahlungs-Id>.<HMAC-SHA256(PAYMENTS_LINK_SECRET, Id), base64url, 32 Zeichen>.
// Nichts davon wird gespeichert; der Link lässt sich aus der Id jederzeit neu
// bilden (Portal). Wechsel des Schlüssels macht alle Links ungültig.

export function linkToken(depositId, secret) {
  const mac = createHmac("sha256", secret).update(`ph-deposit:${depositId}`).digest("base64url").slice(0, 32);
  return `${depositId}.${mac}`;
}

/** Token prüfen → Anzahlungs-Id oder null (zeitkonstanter Vergleich). */
export function verifyLinkToken(token, secret) {
  const m = /^(AZ-[A-Z0-9]{4}-[A-Z0-9]{4})\.([A-Za-z0-9_-]{32})$/.exec(String(token ?? ""));
  if (!m || !secret) return null;
  const expected = Buffer.from(linkToken(m[1], secret));
  const given = Buffer.from(String(token));
  return expected.length === given.length && timingSafeEqual(expected, given) ? m[1] : null;
}

/** Zeitkonstanter Vergleich zweier Geheimnisse. */
export function safeEqual(a, b) {
  const x = createHash("sha256").update(String(a ?? "")).digest();
  const y = createHash("sha256").update(String(b ?? "")).digest();
  return timingSafeEqual(x, y) && String(a ?? "").length === String(b ?? "").length;
}
