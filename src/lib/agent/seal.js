// src/lib/agent/seal.js – versiegelter Bestätigungs-Token für den Double-Opt-in.
//
// Zustandslos: Der Terminwunsch wird NICHT auf dem Server gespeichert,
// sondern verschlüsselt und signiert (AES-256-GCM) in den Bestätigungslink
// gepackt. Der Link steht im Fragment (#…), das der Browser nie an einen
// Server schickt – keine Personendaten in Zugriffs-Logs. Erst wenn die
// Person auf der Bestätigungsseite „Anfrage bestätigen“ drückt, geht der
// Token einmal per POST an /api/agent/confirm.
// Rein (node:crypto): node --test lädt es direkt.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = 1;
const key = (secret) => createHash("sha256").update(`platzhirsch-agent-confirm:${secret}`).digest();

/** payload (JSON) → Token (base64url). */
export function seal(payload, secret) {
  if (!secret) throw new Error("agent secret missing");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ v: VERSION, ...payload }), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** Token → payload oder null (falsch, manipuliert, anderes Geheimnis, abgelaufen). */
export function unseal(token, secret, now = Date.now()) {
  if (!secret || typeof token !== "string" || token.length < 40 || token.length > 8000 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(secret), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const payload = JSON.parse(json);
    if (payload?.v !== VERSION) return null;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}
