"use client";
// Browser-Hilfen der Wunschliste: API-Aufrufe und localStorage (nur Komfort:
// Verwaltungslinks und Storno-Schlüssel dieses Geräts). Jeder Zugriff auf
// den Speicher ist abgesichert – privates Fenster oder gesperrter Speicher
// dürfen nichts kaputt machen.
import { ADMIN_STORAGE_KEY, RESERVATION_STORAGE_KEY } from "@/lib/wunschliste/config";

export async function postJson(url, body, { timeout = 20000 } = {}) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(timeout),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ...data, ok: res.ok && data.ok !== false };
  } catch {
    return { ok: false, error: "network" };
  }
}

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Speicher nicht verfügbar: Links stehen weiter auf dem Bildschirm */
  }
}

/** Verwaltungslinks dieses Geräts: [{ token, title, ref, locale, at }] */
export const savedLists = () => {
  const list = read(ADMIN_STORAGE_KEY, []);
  return Array.isArray(list) ? list.filter((x) => x && typeof x.token === "string") : [];
};
export function rememberList(entry) {
  const rest = savedLists().filter((x) => x.token !== entry.token);
  write(ADMIN_STORAGE_KEY, [{ ...entry, at: new Date().toISOString() }, ...rest].slice(0, 10));
}
export function forgetList(token) {
  write(ADMIN_STORAGE_KEY, savedLists().filter((x) => x.token !== token));
}

/** Storno-Schlüssel eigener Reservierungen: { "<shareId>:<item>": cancel } */
export const reservationsOf = (shareId) => {
  const all = read(RESERVATION_STORAGE_KEY, {});
  return Object.fromEntries(
    Object.entries(all)
      .filter(([k]) => k.startsWith(`${shareId}:`))
      .map(([k, v]) => [k.slice(shareId.length + 1), v])
  );
};
export function rememberReservation(shareId, item, cancel) {
  write(RESERVATION_STORAGE_KEY, { ...read(RESERVATION_STORAGE_KEY, {}), [`${shareId}:${item}`]: cancel });
}
export function forgetReservation(shareId, item) {
  const all = read(RESERVATION_STORAGE_KEY, {});
  delete all[`${shareId}:${item}`];
  write(RESERVATION_STORAGE_KEY, all);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
