// src/lib/forms/attributionFields.js – Kampagnenfelder für das ph-Backend.
//
// ph_crm (PH Anfrage) hat eigene Felder utm_source, utm_medium, utm_campaign,
// utm_term, utm_content und klick_id; ph_marketing liest dieselben Namen
// (utils/attribution.utm_bereinigen). Die Einwilligungsgrenze bleibt die der
// Website (src/lib/attribution.js, leadPayload.js):
//   - ohne Google-Ads-Einwilligung: KEINE utm_*-Werte und keine Klick-IDs –
//     nur der abgeleitete Kanal steht im Herkunftsblock (wie bisher);
//   - mit Einwilligung: utm_* des letzten Kontakts und die Klick-IDs
//     (gclid/gbraid/wbraid/fbclid/msclkid) als klick_id "gclid=…".
//
// Zwei Wege, beide nur mit Einwilligung gefüllt:
//   fieldsFromHerkunft(text)   Server: liest die Felder aus dem Herkunftsblock,
//                              den die Anfrageformulare schon heute anhängen
//                              (der Block enthält utm-Werte nur mit Einwilligung).
//   attributionFields(attr)    Browser: für Formulare ohne Freitext-Block
//                              (Kundenkarte, Newsletter, Termin), aus getAttribution().
// Gesendet werden die Felder nur an das ph-Backend (src/lib/backend/*);
// das alte System bekommt dieselben Payloads wie bisher.
// Keine "@/..."-Importe (node --test).
import { CLICK_ID_KEYS, UTM_KEYS, clean } from "../attribution.js";
import { HERKUNFT_TITLE } from "./leadPayload.js";

export const ATTRIBUTION_KEYS = Object.freeze([...UTM_KEYS, "klick_id"]);
const MAX = 140;

/** Nur nicht-leere, bereinigte Werte der bekannten Schlüssel (max. 140 Zeichen). */
export function pickAttribution(source) {
  const out = {};
  if (!source || typeof source !== "object") return out;
  for (const k of ATTRIBUTION_KEYS) {
    const v = clean(typeof source[k] === "string" ? source[k] : "").slice(0, MAX);
    if (v) out[k] = v;
  }
  return out;
}

/** Klick-IDs → "gclid=abc · fbclid=xyz" (Reihenfolge wie CLICK_ID_KEYS). */
export function klickIdOf(click) {
  if (!click || typeof click !== "object") return "";
  return CLICK_ID_KEYS.filter((k) => click[k]).map((k) => `${k}=${click[k]}`).join(" · ").slice(0, MAX);
}

/**
 * Browser: getAttribution() → Felder. Ohne Ads-Einwilligung {}.
 * @param {{ current?: object, last?: object, consentAds?: boolean }} attribution
 */
export function attributionFields(attribution) {
  if (!attribution || attribution.consentAds !== true) return {};
  const touch = attribution.last || attribution.current;
  if (!touch) return {};
  return pickAttribution({ ...Object.fromEntries(UTM_KEYS.map((k) => [k, touch[k] || ""])), klick_id: klickIdOf(touch.click) });
}

const LABELS = { Kampagne: "utm_campaign", Suchbegriff: "utm_term", Anzeige: "utm_content" };

/**
 * Server: Felder aus dem Herkunftsblock eines Freitexts (leadPayload.herkunftBlock).
 * Liest nur den Hauptkontakt (nicht „Erster Kontakt“). Ohne Block oder ohne
 * Einwilligung (dann steht nur „Kanal: …“ im Block) → {}.
 */
export function fieldsFromHerkunft(text) {
  const s = typeof text === "string" ? text : "";
  const i = s.indexOf(HERKUNFT_TITLE);
  if (i < 0) return {};
  const out = {};
  for (const raw of s.slice(i + HERKUNFT_TITLE.length).split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("Erster Kontakt:")) continue;
    if (line.startsWith("Klick-ID:")) {
      out.klick_id ||= line.slice("Klick-ID:".length).trim();
      continue;
    }
    for (const part of line.split(" · ")) {
      const at = part.indexOf(": ");
      if (at < 0) continue;
      const label = part.slice(0, at).trim();
      const value = part.slice(at + 2).trim();
      if (label === "Quelle") {
        const [src, ...med] = value.split(" / ");
        out.utm_source ||= src || "";
        out.utm_medium ||= med.join(" / ");
      } else if (LABELS[label]) out[LABELS[label]] ||= value;
    }
  }
  return pickAttribution(out);
}

/** zod-Felder (optional, max. 150) für die Schemas der Formulare ohne Herkunftsblock. */
export function attributionShape(z) {
  return Object.fromEntries(ATTRIBUTION_KEYS.map((k) => [k, z.string().max(150).optional()]));
}
