// src/lib/kundenkarte/token.js – Bestätigungstoken (Double-Opt-in).
// Link: /{locale}/kundenkarte/bestaetigen?token=<antrag>.<zufall 32 Byte base64url>.
// Gespeichert wird nur der SHA-256 des Zufallsteils (confirmHashOf); im
// Frappe-Betrieb geht ebenfalls nur der Hash ans Backoffice. Die Seite schickt
// das Token erst nach einem Klick per POST – Mail-Scanner, die Links vorab
// öffnen, bestätigen so nichts. Referrer "no-referrer" auf der Seite.
// Keine "@/..."-Importe.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const REF_RE = /^KK-[0-9A-Z]{6}$/;
const TOKEN_RE = /^(KK-[0-9A-Z]{6})\.([A-Za-z0-9_-]{43})$/;

/** Kurze Antragsnummer, z. B. „KK-7K3QX9“ (ohne 0/O/1/I). */
export function newReference(bytes = randomBytes(6)) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return `KK-${out}`;
}

export const isReference = (v) => typeof v === "string" && REF_RE.test(v);

export function newConfirmSecret(bytes = randomBytes(32)) {
  return Buffer.from(bytes).toString("base64url");
}

export const confirmHashOf = (secret) => createHash("sha256").update(`kundenkarte-confirm|${secret}`).digest("hex");

export const confirmTokenOf = (ref, secret) => `${ref}.${secret}`;

/** "<ref>.<secret>" → { ref, secret } | null */
export function parseConfirmToken(value) {
  const m = typeof value === "string" && value.length <= 60 ? TOKEN_RE.exec(value) : null;
  return m ? { ref: m[1], secret: m[2] } : null;
}

/** Hash-Vergleich in konstanter Zeit. */
export function confirmMatches(secret, hash) {
  if (typeof hash !== "string" || hash.length !== 64) return false;
  return timingSafeEqual(Buffer.from(confirmHashOf(secret)), Buffer.from(hash));
}

/** Kartennummer des Mocks, z. B. „PH-2026-000123“ (Produktion: Nummernkreis in Frappe). */
export function mockCardNumber(index, year = new Date().getFullYear()) {
  return `PH-${year}-${String(index).padStart(6, "0")}`;
}
