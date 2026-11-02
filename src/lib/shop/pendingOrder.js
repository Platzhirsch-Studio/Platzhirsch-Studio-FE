// src/lib/shop/pendingOrder.js
// „Welche Bestellung hat DIESER Browser gerade abgeschickt?“ – damit die
// Bestätigungsseite den Warenkorb nur nach der eigenen, frischen Bestellung
// leert. Vorher leerte JEDER Aufruf einer bezahlten Bestätigungs-URL (Link
// aus einer Mail, Lesezeichen, geteilter Link) den aktuellen Warenkorb.
// Rein, ohne "@/"-Importe; localStorage-Zugriff macht die Insel (try/catch).

export const PENDING_ORDER_KEY = "ph-shop-offene-bestellung-v1";
export const ORDER_ID_RE = /^PH-S-\d{6}-[A-F0-9]{6}$/;
/** Nach dieser Zeit gilt eine Markierung als verwaist (Stripe-Session läuft max. 24 h). */
export const PENDING_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

/** Wert zum Speichern (JSON) oder null bei ungültiger Bestellnummer. */
export const pendingValue = (orderId, now) => (ORDER_ID_RE.test(String(orderId || "")) ? JSON.stringify({ id: orderId, t: now }) : null);

/** Gespeicherter Wert passt zu dieser Bestellung und ist frisch? */
export function shouldClearFor(raw, orderId, now, maxAgeMs = PENDING_MAX_AGE_MS) {
  if (!raw || !ORDER_ID_RE.test(String(orderId || ""))) return false;
  try {
    const p = JSON.parse(raw);
    return p?.id === orderId && Number.isFinite(p.t) && now - p.t >= 0 && now - p.t <= maxAgeMs;
  } catch {
    return false;
  }
}
