// src/lib/forms/leadPayload.js
// Herkunft in jeder Anfrage (Masterplan AP3 Nr. 2, Bericht 11 F1 Stufe 1).
// The backoffice has no source fields yet, so the origin travels as a TEXT
// BLOCK at the end of the free-text field the form already has:
//
//   ── Herkunft (automatisch) ──
//   Kanal: Paid · Quelle: google / cpc · Kampagne: minotti-lindau
//   Einstieg: /de/designermoebel-lindau · Referrer: www.google.com
//   Sprache: de · Gerät: mobil
//   Referenz: 0b6c…-…
//
// plus `lead_ref` (crypto.randomUUID()) as its own JSON field. The routes
// accept lead_ref (schemas.js) and do NOT forward it (forward.js): the
// backoffice format stays the same, the reference is in the text.
// Consent boundary (Rechtspaket 02 Z. 130 + Checkliste C13, QM r4 P2-1):
// WITHOUT Ads consent the block names only the derived channel ("Kanal:
// Paid"), language, device and the reference – no utm_* values, campaign,
// referrer host or landing page. Source details, first touch and click ids
// appear only with Ads consent (consentAds, decided by attribution.js).
// No "@/..." imports: tested with `node --test` (tests/unit/r4-leads.test.mjs).
import { channelOf } from "../attribution.js";

export const HERKUNFT_TITLE = "── Herkunft (automatisch) ──";
// Upper bound of the block (values are clipped in attribution.js); the
// schemas allow this much on top of the visitor's own text.
export const HERKUNFT_MAX = 1500;

// Form → its existing free-text field (kontakt + adventsabend share /api/kontakt).
export const LEAD_TEXT_FIELD = {
  kontakt: "ihre_nachricht",
  beratung: "bitte_beschreiben_sie_ihr_vorhaben",
  produkt: "anfrage_beschreibung",
};

/** "kontakt" | "beratung" | "produkt" for a form URL, else null (newsletter …). */
export function leadKindOf(url) {
  const path = String(url || "").split("?")[0];
  if (/\/api\/(upload\/inquiry\/kontakt|kontakt)\/?$/.test(path)) return "kontakt";
  if (/\/api\/(upload\/inquiry\/beratung|beratung_anfrage)\/?$/.test(path)) return "beratung";
  if (/\/api\/(upload\/inquiry\/produkt|anfrage_produkt)\/?$/.test(path)) return "produkt";
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isLeadRef = (value) => typeof value === "string" && UUID_RE.test(value);

/** New lead reference (UUID v4). */
export function newLeadRef(cryptoImpl = globalThis.crypto) {
  if (cryptoImpl && typeof cryptoImpl.randomUUID === "function") return cryptoImpl.randomUUID();
  // Old browsers without randomUUID (but with getRandomValues).
  const bytes = new Uint8Array(16);
  if (cryptoImpl && typeof cryptoImpl.getRandomValues === "function") cryptoImpl.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** "mobil" | "Tablet" | "Desktop" from the viewport width (no user agent). */
export function deviceOf(width) {
  const w = Number(width);
  if (!Number.isFinite(w) || w <= 0) return "";
  if (w < 768) return "mobil";
  if (w < 1100) return "Tablet";
  return "Desktop";
}

const line = (parts) => parts.filter(Boolean).join(" · ");
const cleanContext = (v) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
const date = (ts) => {
  const d = new Date(Number(ts));
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

function touchLines(touch) {
  if (!touch) return [];
  const source = [touch.utm_source, touch.utm_medium].filter(Boolean).join(" / ");
  return [
    line([
      `Kanal: ${channelOf(touch)}`,
      source && `Quelle: ${source}`,
      touch.utm_campaign && `Kampagne: ${touch.utm_campaign}`,
      touch.utm_term && `Suchbegriff: ${touch.utm_term}`,
      touch.utm_content && `Anzeige: ${touch.utm_content}`,
    ]),
    line([touch.landing && `Einstieg: ${touch.landing}`, touch.referrer_host && `Referrer: ${touch.referrer_host}`]),
  ].filter(Boolean);
}

const sameTouch = (a, b) => Boolean(a && b && a.ts === b.ts && a.landing === b.landing);

/**
 * The text block. `attribution` = getAttribution() of attribution.js.
 * @param {{ current?: object, first?: object, last?: object, consentAds?: boolean }} attribution
 * @param {{ leadRef?: string, locale?: string, device?: string, selfReport?: string, pageContext?: string }} [meta]
 *   pageContext (Runde 5, ux P2-4): page context the visitor came with, e.g.
 *   "Stadtseite: Bregenz" (beratungContext.herkunftContext) – its own line,
 *   independent of Ads consent (it is the page the visitor clicked on, no
 *   tracking value). Control characters and markup are removed, max 160.
 */
export function herkunftBlock(attribution = {}, { leadRef, locale, device, selfReport, pageContext } = {}) {
  const { current, first, last, consentAds } = attribution || {};
  const main = (consentAds && last) || current || null;
  const lines = [HERKUNFT_TITLE];
  const ctx = cleanContext(pageContext);
  if (ctx) lines.push(`Kontext: ${ctx}`);
  if (!main) lines.push("Kanal: unbekannt");
  else if (consentAds) lines.push(...touchLines(main));
  else lines.push(`Kanal: ${channelOf(main)}`);
  if (consentAds && first && main && !sameTouch(first, main)) {
    lines.push(line([`Erster Kontakt: ${channelOf(first)}`, date(first.ts), first.landing, first.referrer_host]));
  }
  if (consentAds && main?.click) {
    const ids = Object.entries(main.click).map(([k, v]) => `${k}=${v}`);
    if (ids.length) lines.push(`Klick-ID: ${ids.join(" · ")}`);
  }
  lines.push(line([selfReport && `Selbstauskunft: ${selfReport}`, locale && `Sprache: ${locale}`, device && `Gerät: ${device}`]));
  if (leadRef) lines.push(`Referenz: ${leadRef}`);
  return lines.filter(Boolean).join("\n").slice(0, HERKUNFT_MAX);
}

/** The visitor's own text without a Herkunft block (server length checks). */
export function stripHerkunft(text) {
  if (typeof text !== "string") return text;
  const index = text.indexOf(HERKUNFT_TITLE);
  return index < 0 ? text : text.slice(0, index).replace(/\s+$/, "");
}

/** Visitor text + "\n\n" + block (an older block is replaced, never doubled). */
export function appendHerkunft(text, block) {
  const own = stripHerkunft(typeof text === "string" ? text : "");
  if (!block) return own;
  return own.trim() ? `${own}\n\n${block}` : block;
}

/**
 * Payload of a lead form → the same payload with the block appended to its
 * free-text field and `lead_ref`. Other fields stay untouched; unknown kinds
 * come back unchanged.
 */
export function withLead(payload, kind, { attribution, leadRef, locale, device, selfReport, pageContext } = {}) {
  const field = LEAD_TEXT_FIELD[kind];
  if (!field || !payload || typeof payload !== "object") return payload;
  const ref = isLeadRef(leadRef) ? leadRef : newLeadRef();
  const block = herkunftBlock(attribution, { leadRef: ref, locale, device, selfReport, pageContext });
  return { ...payload, [field]: appendHerkunft(payload[field], block), lead_ref: ref };
}
