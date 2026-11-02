// src/lib/ideenboard/ids.js — geheime Kennungen des geteilten Ideenboards.
// Gleiches Schema wie die Wunschliste (src/lib/wunschliste/ids.js), bewusst
// als eigene Datei, damit beide Teams unabhängig ändern können:
//   boardId     interne Kennung (Dateiname), nur im Verwaltungsschlüssel
//   shareId     Teilen-Link /<locale>/ideenboard/<shareId>; gespeichert wird
//               nur sein SHA-256. „Neuen Link erstellen“ tauscht ihn aus.
//   adminSecret Teil des Verwaltungsschlüssels "<boardId>.<adminSecret>",
//               liegt nur im localStorage des Erstellers; gespeichert wird
//               nur sein SHA-256.
// Keine "@/..."-Importe (node --test).
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ADMIN_TOKEN_RE, TOKEN_BYTES, TOKEN_RE } from "./config.js";

export const randomToken = () => randomBytes(TOKEN_BYTES).toString("base64url");
export const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");
export const isToken = (value) => typeof value === "string" && TOKEN_RE.test(value);

export function matchesHash(secret, hash) {
  if (!isToken(secret) || typeof hash !== "string" || hash.length !== 64) return false;
  const a = Buffer.from(sha256(secret), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseAdminToken(token) {
  if (typeof token !== "string" || !ADMIN_TOKEN_RE.test(token)) return null;
  const [boardId, secret] = token.split(".");
  return { boardId, secret };
}

export function newIds() {
  return { boardId: randomToken(), shareId: randomToken(), adminSecret: randomToken() };
}
