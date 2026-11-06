// src/lib/ideenboard/phAdapter.js — geteilte Ideenboards im ph-Backend
// (ph_marketing, Gruppe "ideenboard" in src/lib/backend/config.js). Gleiche
// Schnittstelle wie ./localStore.js: create / get / getByShare /
// update(boardId, fn) / remove / sweep.
//
// Methoden (Backend-Import/ph_marketing/ph_marketing/api/__init__.py), POST mit
// Token des Users website@platzhirsch.studio und X-PH-Client (phCall):
//   ph_marketing.api.create_ideenboard(record)                          → {record}; 409 conflict, 400 invalid/empty
//   ph_marketing.api.get_ideenboard(board_id)                           → {record} | {record: null}
//   ph_marketing.api.get_ideenboard_by_share(share_hash)                → wie get; share_hash = sha256(shareId)
//   ph_marketing.api.update_ideenboard(board_id, record, expected_updated_at) → {record}; 404 not_found, 409 conflict
//   ph_marketing.api.remove_ideenboard(board_id)                        → {removed}
// Gespeichert werden im Backend nur boardId, Hashes und Karten, keine Personendaten.
// Abgelaufene Boards löscht ph_marketing täglich (sweep_ideenboards) – sweep()
// hier tut deshalb nichts.
//
// update: liest den Stand (oder die letzte Antwort, höchstens CACHE_MS alt),
// wendet fn an und schickt das gelesene updatedAt als expected_updated_at.
// Bei 409 neu lesen und erneut anwenden (höchstens MAX_ATTEMPTS), danach
// BoardError("conflict", 409).
//
// Ohne "server-only" und ohne "@/..."-Importe (node --test).
import { phCall } from "../backend/config.js";
import { isToken, sha256 } from "./ids.js";
import { BoardError } from "./model.js";

export const PH_IDEENBOARD = Object.freeze({
  create: "ph_marketing.api.create_ideenboard",
  get: "ph_marketing.api.get_ideenboard",
  getByShare: "ph_marketing.api.get_ideenboard_by_share",
  update: "ph_marketing.api.update_ideenboard",
  remove: "ph_marketing.api.remove_ideenboard",
});

export const MAX_ATTEMPTS = 3;
export const CACHE_MS = 5_000;

const HTTP = { invalid: 400, empty: 400, not_found: 404, conflict: 409, rate_limited: 429 };

/** ph-Fehlercode → BoardError (Backend nicht erreichbar/gesperrt → 503 unavailable). */
export function boardErrorOf(code) {
  if (HTTP[code]) return new BoardError(code, HTTP[code]);
  return new BoardError("unavailable", 503);
}

const clone = (v) => (v == null ? v : structuredClone(v));

// visitorIp: nur für Tests; im Betrieb liest phCall die Besucher-IP aus next/headers.
export function createPhStore(cfg, { fetchImpl = globalThis.fetch, env = process.env, now = () => Date.now(), visitorIp } = {}) {
  const last = new Map(); // boardId → { record, at }

  async function call(method, params) {
    const r = await phCall(cfg, method, { params, fetchImpl, env, visitorIp });
    if (!r.ok) throw boardErrorOf(r.code);
    return r.message || {};
  }

  function remember(m) {
    const record = m?.record && typeof m.record === "object" ? m.record : null;
    if (record && isToken(record.boardId)) {
      last.set(record.boardId, { record: clone(record), at: now() });
      if (last.size > 500) last.delete(last.keys().next().value);
    }
    return record;
  }

  const load = async (boardId) => remember(await call(PH_IDEENBOARD.get, { board_id: boardId }));

  return {
    name: "ph",

    async create(record) {
      const m = await call(PH_IDEENBOARD.create, { record });
      return remember(m) || record;
    },

    async get(boardId) {
      if (!isToken(boardId)) return null;
      return load(boardId);
    },

    async getByShare(shareId) {
      if (!isToken(shareId)) return null;
      const hash = sha256(shareId);
      const record = remember(await call(PH_IDEENBOARD.getByShare, { share_hash: hash }));
      return record && record.shareHash === hash ? record : null;
    },

    async update(boardId, fn) {
      if (!isToken(boardId)) return { record: null, result: undefined };
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const cached = last.get(boardId);
        const record = attempt === 1 && cached && now() - cached.at <= CACHE_MS ? clone(cached.record) : await load(boardId);
        last.delete(boardId);
        if (!record) return { record: null, result: undefined };
        const expected = record.updatedAt || undefined;
        const result = await fn(record);
        const r = await phCall(cfg, PH_IDEENBOARD.update, { params: { board_id: boardId, record, expected_updated_at: expected }, fetchImpl, env, visitorIp });
        if (r.ok) return { record: remember(r.message) || record, result };
        if (r.code === "not_found") return { record: null, result: undefined };
        if (r.code !== "conflict") throw boardErrorOf(r.code);
      }
      throw new BoardError("conflict", 409);
    },

    async remove(boardId) {
      if (!isToken(boardId)) return false;
      last.delete(boardId);
      const m = await call(PH_IDEENBOARD.remove, { board_id: boardId });
      return Boolean(m.removed);
    },

    /** Löschen abgelaufener Boards macht ph_marketing selbst (Scheduler). */
    async sweep() {
      return { checked: 0, removed: 0, orphans: 0 };
    },
  };
}
