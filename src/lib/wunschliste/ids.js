// src/lib/wunschliste/ids.js — geheime Kennungen der Wunschliste.
// Keine "@/..."-Importe: direkt mit `node --test` geprüft
// (tests/unit/wunschliste.test.mjs).
//
// Drei Schlüssel, alle 24 Byte Zufall (192 Bit) als base64url:
//   listId      interne Kennung, Dateiname der Liste; steht nur im
//               Verwaltungslink, nie im Teilen-Link
//   shareId     der Teilen-Link /<locale>/wunschliste/<shareId>; gespeichert
//               wird nur sein SHA-256 (ein Blick in den Speicher verrät den
//               Link nicht). „Neuen Link erzeugen“ tauscht ihn aus, der alte
//               antwortet dann mit 404.
//   adminSecret Teil des Verwaltungsschlüssels "<listId>.<adminSecret>";
//               gespeichert wird nur sein SHA-256. Der Schlüssel steht im
//               #Fragment des Verwaltungslinks und geht so nie in Server-Logs
//               oder Referrer.
// Storno-Schlüssel einer Reservierung (cancelSecret): ebenso, nur der Hash
// liegt bei der Reservierung.
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ADMIN_TOKEN_RE, TOKEN_BYTES, TOKEN_RE } from "./config.js";

export const randomToken = () => randomBytes(TOKEN_BYTES).toString("base64url");

export const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");

export const isToken = (value) => typeof value === "string" && TOKEN_RE.test(value);

/** Vergleicht einen Klartext-Schlüssel mit einem gespeicherten Hash in konstanter Zeit. */
export function matchesHash(secret, hash) {
  if (!isToken(secret) || typeof hash !== "string" || hash.length !== 64) return false;
  const a = Buffer.from(sha256(secret), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** "<listId>.<secret>" → { listId, secret } oder null. */
export function parseAdminToken(token) {
  if (typeof token !== "string" || !ADMIN_TOKEN_RE.test(token)) return null;
  const [listId, secret] = token.split(".");
  return { listId, secret };
}

// Kurzzeichen für Telefon und E-Mail („Wunschliste WL-7K3Q-9PX2“): ohne
// leicht verwechselbare Zeichen (0/O, 1/I/L). Kein Geheimnis, öffnet nichts.
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export function shortRef(bytes = randomBytes(8)) {
  let out = "";
  for (let i = 0; i < 8; i++) out += REF_ALPHABET[bytes[i] % REF_ALPHABET.length];
  return `WL-${out.slice(0, 4)}-${out.slice(4)}`;
}

/** Stabile, kurze Kennung eines Merkliste-Eintrags (wie CartContext: id-name-kategorie). */
export function itemKeyOf(item) {
  const raw = `${item?.id ?? ""}-${item?.name ?? ""}-${item?.category || "default"}`;
  return sha256(raw).slice(0, 16);
}

// Der Teilen-Link liegt zusätzlich VERSIEGELT beim Datensatz (AES-256-GCM,
// Schlüssel aus dem adminSecret abgeleitet): nur wer den Verwaltungslink hat,
// kann ihn wieder anzeigen – auch auf einem anderen Gerät. Der Speicher
// allein kennt ihn nicht.
const sealKey = (adminSecret) => createHash("sha256").update(`wunschliste-share:${adminSecret}`).digest();

export function sealShare(shareId, adminSecret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sealKey(adminSecret), iv);
  const data = Buffer.concat([cipher.update(shareId, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function unsealShare(sealed, adminSecret) {
  try {
    const [iv, tag, data] = String(sealed).split(".").map((p) => Buffer.from(p, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", sealKey(adminSecret), iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return isToken(out) ? out : null;
  } catch {
    return null;
  }
}

export function newIds() {
  return { listId: randomToken(), shareId: randomToken(), adminSecret: randomToken() };
}
