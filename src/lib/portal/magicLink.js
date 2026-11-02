import "server-only";
import { MAGIC_LINK_TTL_SECONDS, PORTAL_LOGIN_PATH } from "./config";
import { randomToken, tokenDigest } from "./crypto";
import { updateJson } from "./store";

// One-time login links. The raw token only travels in the e-mail; at rest we
// keep its HMAC digest, the customer id, expiry and a used flag. Redeeming is
// atomic (store lock), so a token works exactly once.
//
// Store: /.data/portal/magic-links.json (dev). Production: same shape in a
// Frappe doctype `PH Portal Login Token` or Redis – see feature doc.

const STORE = "magic-links";

export async function issueMagicLink({ customerId, origin, next }) {
  const token = randomToken(32);
  const now = Date.now();
  await updateJson(STORE, [], (list) => {
    const fresh = list.filter((t) => t.expiresAt > now && !t.usedAt);
    fresh.push({
      digest: tokenDigest(token),
      customerId,
      next: next || null,
      createdAt: now,
      expiresAt: now + MAGIC_LINK_TTL_SECONDS * 1000,
      usedAt: null,
    });
    return { value: fresh.slice(-500), result: null };
  });
  const url = new URL(`${PORTAL_LOGIN_PATH}/bestaetigen`, origin);
  url.searchParams.set("token", token);
  return { url: url.toString(), expiresInMinutes: Math.round(MAGIC_LINK_TTL_SECONDS / 60) };
}

/** @returns {{customerId:string, next:string|null}|{error:"ungueltig"|"abgelaufen"}} */
export async function redeemMagicLink(token) {
  const digest = tokenDigest(token);
  const now = Date.now();
  return updateJson(STORE, [], (list) => {
    const entry = list.find((t) => t.digest === digest);
    if (!entry || entry.usedAt) return { value: list, result: { error: "ungueltig" } };
    if (entry.expiresAt < now) return { value: list, result: { error: "abgelaufen" } };
    entry.usedAt = now;
    return { value: list, result: { customerId: entry.customerId, next: entry.next } };
  });
}
