// src/lib/ideenboard/service.js — geteiltes Ideenboard (Server).
// Speicher: ./localStore.js (.data/ideenboard bzw. IDEENBOARD_LOCAL_DIR) oder
// mit IDEENBOARD_STORAGE=ph + Gruppe "ideenboard" auf ph ./phAdapter.js
// (ph_marketing). Ohne diese Schalter schreibt nichts ins Backoffice.
//
// Für das Termin-Team: getSharedBoard(shareId) liefert die öffentliche
// Ansicht (Karten + Stand) oder null – genau das, was /termin?ideenboard=…
// an die Buchung hängen kann (Übergabe-Notiz ideenboard-anbindung.md).
import "server-only";
import path from "node:path";
import { createLocalStore } from "./localStore";
import { createPhStore } from "./phAdapter";
import { ideenboardShareAvailable, phIdeenboardTarget, storageKind } from "./mode";
import { isToken, matchesHash, newIds, parseAdminToken, randomToken, sha256 } from "./ids";
import { BoardError, createRecord, isExpired, ownerView, publicView, syncRecord } from "./model";

const ROOT = process.env.IDEENBOARD_LOCAL_DIR
  ? path.resolve(process.env.IDEENBOARD_LOCAL_DIR)
  : path.join(process.cwd(), ".data", "ideenboard");

const STORE_KEY = Symbol.for("platzhirsch.ideenboard.store");
const PH_STORE_KEY = Symbol.for("platzhirsch.ideenboard.phStore");
function store() {
  if (!ideenboardShareAvailable()) throw new BoardError("unavailable", 503);
  if (storageKind() === "ph") return globalThis[PH_STORE_KEY] || (globalThis[PH_STORE_KEY] = createPhStore(phIdeenboardTarget()));
  const s = globalThis[STORE_KEY] || (globalThis[STORE_KEY] = createLocalStore(ROOT));
  maybeSweep(s);
  return s;
}

// Aktive Löschung abgelaufener Boards (QA Technik P1-3, DSGVO
// Speicherbegrenzung): beim ersten Zugriff nach dem Start und danach höchstens
// alle SWEEP_EVERY_MS, im Hintergrund (blockiert keine Anfrage). Zusätzlich
// für einen Cron ohne Zugriffe: node tools/ideenboard/sweep.mjs.
const SWEEP_KEY = Symbol.for("platzhirsch.ideenboard.sweep");
export const SWEEP_EVERY_MS = 6 * 60 * 60_000;
function maybeSweep(s, now = Date.now()) {
  const st = globalThis[SWEEP_KEY] || (globalThis[SWEEP_KEY] = { last: 0, running: false });
  if (st.running || now - st.last < SWEEP_EVERY_MS) return;
  st.running = true;
  st.last = now;
  s.sweep((r) => isExpired(r))
    .catch((e) => console.error("[ideenboard] sweep", e?.message || e))
    .finally(() => {
      st.running = false;
    });
}

/** Abgelaufene Boards sofort löschen (Cron/Tests). */
export async function sweepExpired() {
  if (!ideenboardShareAvailable()) return { checked: 0, removed: 0, orphans: 0 };
  return store().sweep((r) => isExpired(r));
}

export { BoardError };

// Rate-Limits im Speicher dieser Server-Instanz (PM2 fork, 1 Instanz).
const LIMIT_KEY = Symbol.for("platzhirsch.ideenboard.limits");
const hits = globalThis[LIMIT_KEY] || (globalThis[LIMIT_KEY] = new Map());
export const RATE = Object.freeze({
  create: { limit: 10, windowMs: 60 * 60_000 },
  read: { limit: 120, windowMs: 60_000 },
  manage: { limit: 60, windowMs: 10 * 60_000 },
});
export function limited(key, { limit, windowMs }, now = Date.now()) {
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return list.length > limit;
}

export async function createShared(board) {
  const ids = newIds();
  const record = createRecord({ board, ids, hashes: { share: sha256(ids.shareId), admin: sha256(ids.adminSecret) } });
  await store().create(record);
  return { shareId: ids.shareId, adminToken: `${ids.boardId}.${ids.adminSecret}`, board: ownerView(record) };
}

/** Öffentliche Ansicht; null bei unbekanntem, widerrufenem oder abgelaufenem Link. */
export async function getSharedBoard(shareId) {
  if (!isToken(shareId) || !ideenboardShareAvailable()) return null;
  const s = store();
  const record = await s.getByShare(shareId);
  if (!record) return null;
  if (isExpired(record)) {
    await s.remove(record.boardId);
    return null;
  }
  return record.status === "aktiv" ? publicView(record) : null;
}

/**
 * Verwaltung durch den Ersteller.
 * action: "sync" (payload.board) | "revoke" | "renew" | "delete" | "status"
 */
export async function manageShared(token, action, payload = {}) {
  const parsed = parseAdminToken(token);
  if (!parsed) throw new BoardError("not_found", 404);
  const s = store();
  const current = await s.get(parsed.boardId);
  if (!current || !matchesHash(parsed.secret, current.adminHash)) throw new BoardError("not_found", 404);
  if (isExpired(current)) {
    await s.remove(current.boardId);
    throw new BoardError("not_found", 404);
  }
  if (action === "delete") {
    await s.remove(current.boardId);
    return { deleted: true };
  }
  if (action === "status") return { board: ownerView(current) };
  const extra = {};
  const { record } = await s.update(parsed.boardId, (r) => {
    if (action === "sync") {
      syncRecord(r, payload.board);
    } else if (action === "revoke") {
      r.status = "widerrufen";
      r.updatedAt = new Date().toISOString();
    } else if (action === "renew") {
      // neuer Link, der alte antwortet sofort mit 404
      const shareId = randomToken();
      r.shareHash = sha256(shareId);
      r.status = "aktiv";
      if (payload.board) syncRecord(r, payload.board);
      extra.shareId = shareId;
    } else throw new BoardError("bad_action", 400);
  });
  if (!record) throw new BoardError("not_found", 404);
  return { board: ownerView(record), ...extra };
}
