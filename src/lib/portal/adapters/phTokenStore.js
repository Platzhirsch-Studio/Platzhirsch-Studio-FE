// src/lib/portal/adapters/phTokenStore.js – serverseitiger Speicher der
// ph-Kunden-Token (ph.js). Verschlüsselt (AES-256-GCM, Schlüssel aus dem
// Portal-Sitzungsgeheimnis abgeleitet) in einer JSON-Ablage; der Klartext-Token
// verlässt den Server nie. Eintrag je PH Kontakt, Ablauf nach maxAgeMs
// (Standard 30 Tage = Sitzung und portal_token_tage im Backend).
// Rein: Ablage (read/update) und Geheimnis werden übergeben (Tests ohne Dateien).
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function keyOf(secret) {
  return createHash("sha256").update(`ph-kunde-token:${secret}`).digest();
}

export function sealToken(token, secret) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", keyOf(secret), iv);
  const enc = Buffer.concat([c.update(String(token), "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function openToken(sealed, secret) {
  try {
    const [iv, tag, enc] = String(sealed).split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", keyOf(secret), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * @param {{ read: () => Promise<object>, update: (fn: (all) => object) => Promise<void>, secret: () => string, now?: () => number, maxAgeMs?: number }} o
 */
export function createTokenStore({ read, update, secret, now = () => Date.now(), maxAgeMs = TOKEN_MAX_AGE_MS }) {
  return {
    async get(kontakt) {
      const all = (await read()) || {};
      const e = all[kontakt];
      if (!e || now() - Number(e.at || 0) > maxAgeMs) return null;
      return openToken(e.t, secret());
    },
    async set(kontakt, token) {
      const t = sealToken(token, secret());
      const at = now();
      await update((all) => {
        const next = {};
        // Abgelaufene Einträge fallen beim Schreiben weg.
        for (const [k, v] of Object.entries(all || {})) if (at - Number(v?.at || 0) <= maxAgeMs) next[k] = v;
        next[kontakt] = { t, at };
        return next;
      });
    },
  };
}
