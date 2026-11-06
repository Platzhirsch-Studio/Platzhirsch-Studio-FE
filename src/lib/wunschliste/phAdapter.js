// src/lib/wunschliste/phAdapter.js — Wunschliste im ph-Backend (ph_shop, Gruppe
// "wunschliste" in src/lib/backend/config.js). Gleiche Schnittstelle wie
// ./localStore.js: create / get / getByShare / update(listId, fn) / remove.
//
// Methoden (Backend-Import/ph_shop/ph_shop/api/wunschliste.py), alle POST mit
// Token des Users website@platzhirsch.studio und X-PH-Client (phCall):
//   ph_shop.api.create_wishlist(record)                         → {referenz, list_id, ref, share_hash, modified[, bereits_vorhanden]}
//   ph_shop.api.get_wishlist(list_id)                           → {found, record, modified, referenz}
//   ph_shop.api.get_wishlist_by_share(share_hash)               → wie get; share_hash = sha256(shareId),
//                                                                 der Teilen-Link selbst geht nie ans Backend
//   ph_shop.api.update_wishlist(list_id, record, expected_modified) → wie get; 409 conflict bei Konkurrenz
//   ph_shop.api.remove_wishlist(list_id)                        → {deleted}
//
// Optimistische Sperre: update liest den Stand (oder nimmt die letzte Antwort
// zu dieser Liste, höchstens CACHE_MS alt), wendet fn an und schickt
// expected_modified mit. Bei 409 wird neu gelesen und fn erneut angewendet
// (höchstens MAX_ATTEMPTS); danach WishlistError("conflict", 409). So
// gelingen zwei gleichzeitige Reservierungen desselben Stücks nie beide –
// der zweite Versuch scheitert in model.js mit already_reserved.
//
// Ohne "server-only" und ohne "@/..."-Importe (node --test).
import { phCall } from "../backend/config.js";
import { isToken, sha256 } from "./ids.js";
import { WishlistError } from "./model.js";

export const PH_WISHLIST = Object.freeze({
  create: "ph_shop.api.create_wishlist",
  get: "ph_shop.api.get_wishlist",
  getByShare: "ph_shop.api.get_wishlist_by_share",
  update: "ph_shop.api.update_wishlist",
  remove: "ph_shop.api.remove_wishlist",
});

export const MAX_ATTEMPTS = 3;
export const CACHE_MS = 5_000;

const HTTP = { invalid: 400, not_found: 404, conflict: 409, rate_limited: 429 };

/** ph-Fehlercode → WishlistError (Backend nicht erreichbar/gesperrt → 503 unavailable). */
export function wishlistErrorOf(code) {
  if (HTTP[code]) return new WishlistError(code, HTTP[code]);
  return new WishlistError("unavailable", 503);
}

const clone = (v) => (v == null ? v : structuredClone(v));

// visitorIp: nur für Tests; im Betrieb liest phCall die Besucher-IP aus next/headers.
export function createPhStore(cfg, { fetchImpl = globalThis.fetch, env = process.env, now = () => Date.now(), visitorIp } = {}) {
  // listId → { record, modified, at } aus der letzten Antwort.
  const last = new Map();

  async function call(method, params) {
    const r = await phCall(cfg, method, { params, fetchImpl, env, visitorIp });
    if (!r.ok) throw wishlistErrorOf(r.code);
    return r.message || {};
  }

  function remember(m) {
    const record = m?.found && m.record && typeof m.record === "object" ? m.record : null;
    if (record && isToken(record.listId)) {
      last.set(record.listId, { record: clone(record), modified: m.modified || null, at: now() });
      if (last.size > 500) last.delete(last.keys().next().value);
    }
    return record;
  }

  async function load(listId) {
    return remember(await call(PH_WISHLIST.get, { list_id: listId }));
  }

  return {
    name: "ph",

    async create(record) {
      const m = await call(PH_WISHLIST.create, { record });
      if (m.modified) last.set(record.listId, { record: clone(record), modified: m.modified, at: now() });
      return record;
    },

    async get(listId) {
      if (!isToken(listId)) return null;
      return load(listId);
    },

    async getByShare(shareId) {
      if (!isToken(shareId)) return null;
      const hash = sha256(shareId);
      const record = remember(await call(PH_WISHLIST.getByShare, { share_hash: hash }));
      // Wie localStore: ein ausgetauschter Link zählt als unbekannt.
      return record && record.shareHash === hash ? record : null;
    },

    /** Lesen-Ändern-Schreiben mit expected_modified; `fn` ändert den Datensatz und gibt ein Ergebnis zurück. */
    async update(listId, fn) {
      if (!isToken(listId)) return { record: null, result: undefined };
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const cached = last.get(listId);
        let record;
        let modified;
        if (attempt === 1 && cached && now() - cached.at <= CACHE_MS) {
          record = clone(cached.record);
          modified = cached.modified;
        } else {
          record = await load(listId);
          if (!record) return { record: null, result: undefined };
          modified = last.get(listId)?.modified || null;
        }
        last.delete(listId);
        const result = await fn(record);
        const r = await phCall(cfg, PH_WISHLIST.update, { params: { list_id: listId, record, expected_modified: modified || undefined }, fetchImpl, env, visitorIp });
        if (r.ok) {
          const saved = remember(r.message) || record;
          return { record: saved, result };
        }
        if (r.code === "not_found") return { record: null, result: undefined };
        if (r.code !== "conflict") throw wishlistErrorOf(r.code);
      }
      throw new WishlistError("conflict", 409);
    },

    async remove(listId) {
      if (!isToken(listId)) return false;
      last.delete(listId);
      const m = await call(PH_WISHLIST.remove, { list_id: listId });
      return Boolean(m.deleted);
    },
  };
}
