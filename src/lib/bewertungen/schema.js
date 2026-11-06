// src/lib/bewertungen/schema.js – Felder und Prüfung des Bewertungsformulars
// auf /de/bewerten (Browser UND Server). Regeln wie ph_marketing
// (Backend-Import/ph_marketing/ph_marketing/ph_marketing/bewertung.py anlegen,
// utils/bewertung.py): Sterne 1–5 oder Text Pflicht, Text ≤ 4000, Name ≤ 140,
// E-Mail optional; mit Einwilligung zur Veröffentlichung immer die Textversion.
// Kein Gating: jede Sternezahl wird gleich behandelt und gleich gesendet.
// Fehlercodes je Feld: required | email | long | choice.
// Rein, ohne Node- und "@/"-Importe (node --test, Client-Bundle).

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Anlass → ph_marketing utils/bewertung.py ANLAESSE (Schlüssel der Website). */
export const ANLAESSE = Object.freeze(["lieferung", "montage", "abholung", "beratung", "service", "sonstiges"]);

/** Herkunft (ph_marketing QUELLEN ohne "google": Google-Bewertungen importiert das Backoffice). */
export const QUELLEN = Object.freeze(["direkt", "qr", "mail"]);

export const LIMITS = Object.freeze({ text: 4000, name: 140, email: 254, idem: 80 });

/**
 * Version des Einwilligungstexts zur Veröffentlichung. Bei jeder Textänderung
 * in copy.js (consentPublish) hochzählen – ph_marketing speichert sie je Bewertung.
 */
export const EINWILLIGUNG_TEXTVERSION = "bewertung-veroeffentlichung-2026-11-04";

/** Reihenfolge der Felder (Fehlerliste, Fokus). */
export const FIELD_ORDER = Object.freeze(["sterne", "text", "anlass", "name", "email", "einwilligung"]);

const str = (v) => (typeof v === "string" ? v.trim() : "");
const yes = (v) => v === true || v === "1" || v === "on" || v === 1;

/**
 * @param {object} input Rohwerte aus dem Formular / JSON-Body
 * @returns {{ ok: true, data: object } | { ok: false, errors: Record<string,string> }}
 */
export function validateBewertung(input = {}) {
  const rawStars = input.sterne;
  const sterne = rawStars === "" || rawStars == null || rawStars === 0 || rawStars === "0" ? null : Number(rawStars);
  const v = {
    sterne,
    text: str(input.text),
    anlass: str(input.anlass),
    name: str(input.name),
    email: str(input.email).toLowerCase(),
    einwilligung: yes(input.einwilligung),
    quelle: QUELLEN.includes(input.quelle) ? input.quelle : "direkt",
    sprache: ["de", "en", "fr", "it"].includes(input.sprache) ? input.sprache : "de",
    idem: str(input.idem).slice(0, LIMITS.idem),
  };
  const e = {};
  if (v.sterne !== null && !(Number.isInteger(v.sterne) && v.sterne >= 1 && v.sterne <= 5)) e.sterne = "choice";
  if (v.sterne === null && !v.text) e.sterne = "required";
  if (v.text.length > LIMITS.text) e.text = "long";
  if (v.anlass && !ANLAESSE.includes(v.anlass)) e.anlass = "choice";
  if (v.name.length > LIMITS.name) e.name = "long";
  if (v.email && (v.email.length > LIMITS.email || !EMAIL_RE.test(v.email))) e.email = "email";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, data: v };
}

/** validateBewertung als { safeParse } für guardForm (src/lib/forms/guard.js). */
export const bewertungSchema = Object.freeze({
  safeParse(input) {
    const r = validateBewertung(input);
    if (r.ok) return { success: true, data: r.data };
    const field = FIELD_ORDER.find((k) => r.errors[k]);
    return { success: false, error: { issues: [{ path: [field], message: `invalid ${field}` }] } };
  },
});
