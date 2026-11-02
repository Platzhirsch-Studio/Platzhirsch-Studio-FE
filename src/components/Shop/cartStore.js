// src/components/Shop/cartStore.js
// Browser-Warenkorb des Shops: NUR slug, variante, menge in localStorage
// (keine Preise – die kommen immer vom Server, /api/shop/versand).
// useShopCart() für Inseln (useSyncExternalStore, kein Provider).
// Zustandslogik: src/lib/shop/cartState.js (rein, getestet). Tab-Sync über
// das storage-Ereignis; jeder Zugriff auf localStorage in try/catch
// (privater Modus/gesperrt → Warenkorb bleibt leer, nichts stürzt ab).
import { useSyncExternalStore } from "react";
import { CART_STORAGE_KEY } from "@/lib/shop/cartLimits";
import { addLine, changeVariant, countOf, removeLine, restoreLine, sanitizeLines, setLineQty } from "@/lib/shop/cartState";

const EVENT = "ph-shop-cart";
const EMPTY = Object.freeze([]);
let cache = null;
let cacheRaw = null;

function read() {
  if (typeof window === "undefined") return EMPTY;
  let raw = null;
  try {
    raw = window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cacheRaw && cache) return cache;
  cacheRaw = raw;
  try {
    const list = sanitizeLines(JSON.parse(raw || "[]"));
    cache = list.length ? Object.freeze(list) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(list) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(list.map(({ slug, variante, menge }) => ({ slug, variante, menge }))));
  } catch {
    /* privat/gesperrt: Warenkorb bleibt leer */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb) {
  // storage: Änderungen aus anderen Tabs (nur unser Schlüssel oder clear()).
  const onStorage = (e) => {
    if (e.key === null || e.key === CART_STORAGE_KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const cartItems = read;

/** → { ok, reason: null|"voll"|"max_menge", added, menge } */
export function addItem(slug, variante = "standard", menge = 1) {
  const { list, result } = addLine([...read()], slug, variante, menge);
  if (result.added > 0) write(list);
  return result;
}

export function setQty(slug, variante, menge) {
  write(setLineQty([...read()], slug, variante, menge));
}

export function setVariant(slug, from, to) {
  write(changeVariant([...read()], slug, from, to));
}

/** → { entry, index } | null – an restoreItem() übergeben für „Rückgängig“. */
export function removeItem(slug, variante) {
  const { list, removed } = removeLine([...read()], slug, variante);
  if (removed) write(list);
  return removed;
}

export const restoreItem = (removed) => write(restoreLine([...read()], removed));
export const clearCart = () => write([]);

export function useShopCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const cartCount = countOf;
