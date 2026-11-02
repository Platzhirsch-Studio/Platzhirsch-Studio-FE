// src/lib/ideenboard/clientStore.js — das Ideenboard im Browser.
// localStorage (STORAGE_KEY), gelesen über useSyncExternalStore wie die
// Merkliste (src/context/CartContext.js): Server und Hydration sehen ein
// leeres Board, danach erscheint das gespeicherte. Geschrieben wird erst nach
// einem Klick der Besucherin (Zum Ideenboard, Notiz, Sortieren …) – keine
// Speicherung ohne Handlung (§ 165 Abs. 3 TKG 2021 / § 25 TDDDG: unbedingt
// erforderlich für den ausdrücklich gewünschten Dienst). Jeder Zugriff in
// try/catch (privates Fenster, gesperrter Speicher).
// Nur in Client-Komponenten verwenden.
import { useSyncExternalStore } from "react";
import { CHANGE_EVENT, SHARE_STORAGE_KEY, STORAGE_KEY } from "./config.js";
import { addCard, moveCard, removeCard, sanitizeBoard, setNote } from "./model.js";

const EMPTY = Object.freeze({ v: 1, cards: [] });
let cache = null;
let cacheRaw = null;

function readRaw(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function snapshot() {
  const raw = readRaw(STORAGE_KEY);
  if (raw === cacheRaw && cache) return cache;
  cacheRaw = raw;
  try {
    cache = raw ? sanitizeBoard(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function subscribe(cb) {
  const onStorage = (e) => {
    if (!e.key || e.key === STORAGE_KEY || e.key === SHARE_STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

const notify = () => window.dispatchEvent(new Event(CHANGE_EVENT));

export function getBoard() {
  return typeof window === "undefined" ? EMPTY : snapshot();
}

export function saveBoard(board) {
  const b = sanitizeBoard(board);
  writeRaw(STORAGE_KEY, b.cards.length ? JSON.stringify(b) : null);
  notify();
  return b;
}

export function useBoard() {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** @returns {{added: boolean, reason?: string, card: object|null}} */
export function addToBoard(input) {
  const r = addCard(getBoard(), input);
  if (r.added) saveBoard(r.board);
  return r;
}

export const removeFromBoard = (id) => saveBoard(removeCard(getBoard(), id));
export const moveInBoard = (from, to) => saveBoard(moveCard(getBoard(), from, to));
export const noteInBoard = (id, note) => saveBoard(setNote(getBoard(), id, note));

// ---- Teilen-Zustand (Verwaltungsschlüssel, Link, Stand) -------------------
let shareCache = null;
let shareRaw = null;
const NO_SHARE = null;

function shareSnapshot() {
  const raw = readRaw(SHARE_STORAGE_KEY);
  if (raw === shareRaw) return shareCache;
  shareRaw = raw;
  try {
    const v = raw ? JSON.parse(raw) : null;
    shareCache = v && typeof v.token === "string" && typeof v.shareId === "string" ? v : null;
  } catch {
    shareCache = null;
  }
  return shareCache;
}

export function useShare() {
  return useSyncExternalStore(subscribe, shareSnapshot, () => NO_SHARE);
}

export function saveShare(value) {
  writeRaw(SHARE_STORAGE_KEY, value ? JSON.stringify(value) : null);
  notify();
}

export const getShare = () => (typeof window === "undefined" ? null : shareSnapshot());

/** Fingerabdruck des Boards, um „seit dem Teilen geändert“ zu erkennen. */
export function boardStamp(board) {
  return JSON.stringify(sanitizeBoard(board).cards.map((c) => [c.id, c.note]));
}
