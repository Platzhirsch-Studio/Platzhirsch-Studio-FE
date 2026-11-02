// src/lib/shop/cartState.js
// Reine Zustandsfunktionen des Browser-Warenkorbs (slug, variante, menge –
// nie Preise). cartStore.js (localStorage + useSyncExternalStore) ruft sie
// auf; hier ohne window/React, damit node --test sie prüfen kann.
// Regeln wie der Server (cart.js normalizeCart): gültiger Slug, Menge 1–10,
// höchstens 20 Zeilen. Jede Funktion gibt eine NEUE Liste zurück und meldet,
// was wirklich passiert ist – die Oberfläche sagt dann die Wahrheit
// („Höchstmenge erreicht“ statt stillem Kappen).
// Rein, ohne "@/"-Importe.
import { CART_MAX_LINES, CART_MAX_QTY } from "./cartLimits.js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const okSlug = (s, max) => typeof s === "string" && s.length <= max && SLUG_RE.test(s);
const same = (x, slug, variante) => x.slug === slug && x.variante === variante;

/** Gespeicherte Liste (beliebiger Inhalt aus localStorage) → gültige, zusammengeführte Zeilen. */
export function sanitizeLines(raw) {
  const out = [];
  for (const x of Array.isArray(raw) ? raw.slice(0, 50) : []) {
    if (!x || !okSlug(x.slug, 120)) continue;
    const variante = x.variante == null || x.variante === "" ? "standard" : x.variante;
    if (!okSlug(variante, 64)) continue;
    const menge = Math.trunc(Number(x.menge));
    if (!(menge >= 1)) continue;
    const i = out.findIndex((y) => same(y, x.slug, variante));
    if (i >= 0) out[i] = { ...out[i], menge: Math.min(CART_MAX_QTY, out[i].menge + menge) };
    else if (out.length < CART_MAX_LINES) out.push({ slug: x.slug, variante, menge: Math.min(CART_MAX_QTY, menge) });
  }
  return out;
}

/**
 * Artikel hinzufügen.
 * → { list, result: { ok, reason: null|"voll"|"max_menge", added, menge } }
 *   added = tatsächlich hinzugefügte Stück, menge = Menge der Zeile danach.
 */
export function addLine(list, slug, variante = "standard", menge = 1) {
  const n = Math.max(1, Math.trunc(Number(menge)) || 1);
  const i = list.findIndex((x) => same(x, slug, variante));
  if (i >= 0) {
    const vorher = list[i].menge;
    const neu = Math.min(CART_MAX_QTY, vorher + n);
    const next = list.map((x, j) => (j === i ? { ...x, menge: neu } : x));
    return { list: next, result: { ok: neu > vorher, reason: neu - vorher < n ? "max_menge" : null, added: neu - vorher, menge: neu } };
  }
  if (list.length >= CART_MAX_LINES) return { list, result: { ok: false, reason: "voll", added: 0, menge: 0 } };
  const neu = Math.min(CART_MAX_QTY, n);
  return { list: [...list, { slug, variante, menge: neu }], result: { ok: true, reason: neu < n ? "max_menge" : null, added: neu, menge: neu } };
}

/** Menge setzen (0 = entfernen), gekappt auf 0–10; NaN ändert nichts. */
export function setLineQty(list, slug, variante, menge) {
  const m = Math.trunc(Number(menge));
  if (!Number.isFinite(m)) return list;
  const v = Math.max(0, Math.min(CART_MAX_QTY, m));
  return list.map((x) => (same(x, slug, variante) ? { ...x, menge: v } : x)).filter((x) => x.menge > 0);
}

/** Zeile entfernen. → { list, removed: { entry, index } | null } (für „Rückgängig“) */
export function removeLine(list, slug, variante) {
  const index = list.findIndex((x) => same(x, slug, variante));
  if (index < 0) return { list, removed: null };
  return { list: list.filter((_, j) => j !== index), removed: { entry: list[index], index } };
}

/** „Rückgängig“: entfernte Zeile an ihrer alten Stelle wieder einsetzen (Grenzen gelten weiter). */
export function restoreLine(list, removed) {
  const e = removed?.entry;
  if (!e || !okSlug(e.slug, 120)) return list;
  const i = list.findIndex((x) => same(x, e.slug, e.variante));
  if (i >= 0) return list.map((x, j) => (j === i ? { ...x, menge: Math.min(CART_MAX_QTY, x.menge + e.menge) } : x));
  if (list.length >= CART_MAX_LINES) return list;
  const at = Math.max(0, Math.min(list.length, Number(removed.index) || 0));
  return [...list.slice(0, at), { slug: e.slug, variante: e.variante, menge: Math.min(CART_MAX_QTY, e.menge) }, ...list.slice(at)];
}

/** Variante wechseln; gibt es die Zielvariante schon, werden die Mengen zusammengeführt. */
export function changeVariant(list, slug, from, to) {
  const i = list.findIndex((x) => same(x, slug, from));
  if (i < 0 || from === to) return list;
  const j = list.findIndex((x) => same(x, slug, to));
  if (j < 0) return list.map((x, k) => (k === i ? { ...x, variante: to } : x));
  return list.map((x, k) => (k === j ? { ...x, menge: Math.min(CART_MAX_QTY, x.menge + list[i].menge) } : x)).filter((_, k) => k !== i);
}

/** Stückzahl (Badge im Header). */
export const countOf = (list) => (Array.isArray(list) ? list.reduce((s, x) => s + (Number(x?.menge) > 0 ? Number(x.menge) : 0), 0) : 0);
