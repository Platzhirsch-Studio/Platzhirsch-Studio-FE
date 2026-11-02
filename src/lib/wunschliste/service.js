// src/lib/wunschliste/service.js — Ablauf der Wunschliste (Server).
// Speicher: ./localStore.js (Entwicklung, .data/wunschliste) bzw. der
// Frappe-Adapter, sobald freigeschaltet (./frappeAdapter.js). Nichts von hier
// schreibt heute ins produktive Backoffice.
import "server-only";
import path from "node:path";
import { createLocalStore } from "./localStore";
import { frappeAdapter } from "./frappeAdapter";
import { storageKind, wunschlisteAvailable } from "./mode";
import { parseAdminToken } from "./ids";
import {
  WishlistError,
  addContribution,
  createRecord,
  isExpired,
  ownerView,
  ownsRecord,
  publicView,
  releaseItem,
  reserveItem,
  rotateShare,
  setStatus,
  shareIdFor,
  syncItems,
  updateDetails,
} from "./model";
import { groupSummary } from "./groupVoucher";

const ROOT = process.env.WUNSCHLISTE_LOCAL_DIR
  ? path.resolve(process.env.WUNSCHLISTE_LOCAL_DIR)
  : path.join(process.cwd(), ".data", "wunschliste");

const STORE_KEY = Symbol.for("platzhirsch.wunschliste.store");
function store() {
  if (!wunschlisteAvailable()) throw new WishlistError("unavailable", 503);
  if (storageKind() === "frappe") return frappeAdapter;
  return globalThis[STORE_KEY] || (globalThis[STORE_KEY] = createLocalStore(ROOT));
}

export { WishlistError };

// ---- Rate-Limits (Speicher dieser Server-Instanz, wie beim Handy-Upload) ----
const LIMIT_KEY = Symbol.for("platzhirsch.wunschliste.limits");
const hits = globalThis[LIMIT_KEY] || (globalThis[LIMIT_KEY] = new Map());
export const RATE = Object.freeze({
  create: { limit: 20, windowMs: 60 * 60_000 }, // Listen je Stunde (alle Besucher zusammen je Schlüssel)
  read: { limit: 120, windowMs: 60_000 },
  write: { limit: 30, windowMs: 10 * 60_000 },
  manage: { limit: 60, windowMs: 10 * 60_000 },
});
export function limited(key, { limit, windowMs }, now = Date.now()) {
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return list.length > limit;
}

/** Datensatz zum Teilen-Link; abgelaufene werden dabei gelöscht. null = 404. */
async function loadShared(shareId) {
  const s = store();
  const record = await s.getByShare(shareId);
  if (!record) return null;
  if (isExpired(record)) {
    await s.remove(record.listId);
    return null;
  }
  return record;
}

export async function createList(input) {
  const { record, shareId, adminToken } = createRecord(input);
  await store().create(record);
  return { shareId, adminToken, ref: record.ref, expiresAt: record.expiresAt };
}

/** Öffentliche Ansicht; null bei unbekanntem, widerrufenem oder abgelaufenem Link. */
export async function getPublic(shareId) {
  const record = await loadShared(shareId);
  if (!record || record.status !== "aktiv") return null;
  return publicView(record);
}

async function mutateShared(shareId, fn) {
  const record = await loadShared(shareId);
  if (!record || record.status !== "aktiv") throw new WishlistError("not_found", 404);
  const { record: saved, result } = await store().update(record.listId, (r) => {
    if (r.status !== "aktiv") throw new WishlistError("not_found", 404);
    return fn(r);
  });
  if (!saved) throw new WishlistError("not_found", 404);
  return { view: publicView(saved), result };
}

export const reserve = (shareId, { item, name, note }) => mutateShared(shareId, (r) => reserveItem(r, item, { name, note }));

export const release = (shareId, { item, cancel }) => mutateShared(shareId, (r) => releaseItem(r, item, { cancel }));

export const contribute = (shareId, data, channel) =>
  mutateShared(shareId, (r) => {
    const entry = addContribution(r, data, { channel });
    return { id: entry.id, ref: r.ref };
  });

/** Verwaltung durch den Ersteller (Schlüssel aus dem #Fragment des Verwaltungslinks). */
export async function manage(token, action, payload = {}) {
  const parsed = parseAdminToken(token);
  if (!parsed) throw new WishlistError("not_found", 404);
  const s = store();
  const current = await s.get(parsed.listId);
  if (!current || !ownsRecord(current, parsed.secret)) throw new WishlistError("not_found", 404);
  if (isExpired(current)) {
    await s.remove(current.listId);
    throw new WishlistError("not_found", 404);
  }
  if (action === "delete") {
    await s.remove(current.listId);
    return { deleted: true };
  }
  let extra = {};
  const { record } = await s.update(parsed.listId, (r) => {
    if (action === "rotate") rotateShare(r, parsed.secret);
    else if (action === "revoke") setStatus(r, "widerrufen");
    else if (action === "restore") {
      setStatus(r, "aktiv");
      rotateShare(r, parsed.secret); // nach einem Widerruf immer ein neuer Link
    } else if (action === "sync") extra = syncItems(r, payload.items);
    else if (action === "release") releaseItem(r, payload.item, { owner: true });
    else if (action === "update") updateDetails(r, payload);
  });
  const shareId = record.status === "aktiv" ? shareIdFor(record, parsed.secret) : null;
  return { list: ownerView(record), summary: groupSummary(record), ...extra, shareId };
}
