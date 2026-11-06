// src/lib/service/reklamation/send.js – Reklamation an das Backend (Gruppe "service").
//
//   ph  POST ph_service.api.create_service_case (Token, idempotent) mit
//       nachname, vorname, email, telefon, bestellnummer, produkt_name, art,
//       beschreibung, sprache, lead_ref, idempotency_key
//       → { referenz: "PH Servicefall"-Name, status }
//       (Backend-Import/ph_service/ph_service/api/__init__.py; findet/erzeugt PH Kontakt per E-Mail).
//   alt platzhirsch_studio hat keinen Servicefall. Die Reklamation geht über den
//       bestehenden Anfrageweg: forwardInquiry("kontakt") = create_contact (alt) bzw.
//       ph_crm.api.create_contact, wenn die Gruppe "formulare" schon auf ph steht.
//       Die Art steht als erste Zeile „Art: Reklamation“ und als Kontext-Zeile im
//       Nachrichtentext (das alte create_contact nimmt keine Zusatzfelder an).
// Fotos/Videos: nach dem Absenden über den Handy-Upload (src/lib/upload, Ticket
// der Art "kontakt" mit der Referenz). Ob er Dateien annimmt, entscheidet
// uploadsAccepting() (Löschfrist-Freigabe). Die Übertragung der Dateien an den
// PH Servicefall fehlt noch (Bericht 60, Abschnitt „Website-Seiten“).
//
// Rein (relative Importe; fetch wird übergeben).
import { phCall, resolveBackend } from "../../backend/config.js";
import { forwardInquiry } from "../../backend/forms.js";

export const PH_SERVICE_METHOD = "ph_service.api.create_service_case";
// Gleiche Adresse wie src/app/api/kontakt/route.js (bestehender Anfrageweg).
export const ALT_KONTAKT_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.kontakt_form.api.create_contact";

const ART_LABEL = { mangel: "Mangel", transportschaden: "Transportschaden", montagefehler: "Montagefehler", garantie: "Garantie", pflegefrage: "Pflegefrage" };

/** Parameter für create_service_case (nur dokumentierte Felder). */
export function phServicePayload(d, { leadRef } = {}) {
  return {
    nachname: d.nachname,
    vorname: d.vorname || undefined,
    email: d.email,
    telefon: d.telefon || undefined,
    bestellnummer: d.bestellnummer || undefined,
    produkt_name: d.produkt,
    art: d.art,
    beschreibung: d.beschreibung,
    sprache: d.sprache,
    lead_ref: leadRef || undefined,
    idempotency_key: d.idem || leadRef || undefined,
  };
}

/** Payload des Kontaktformulars (kontaktSchema) mit der Reklamation im Text. */
export function altKontaktPayload(d, { leadRef } = {}) {
  const zeilen = [
    "Art: Reklamation",
    d.bestellnummer ? `Bestell-/Projektnummer: ${d.bestellnummer}` : null,
    `Produkt: ${d.produkt}`,
    `Fall: ${ART_LABEL[d.art] || "Mangel"}`,
    "",
    d.beschreibung,
    "",
    `Kontext: Reklamation (Website /${d.sprache}/service/reklamation)`,
  ].filter((z) => z !== null);
  return {
    name: `${d.vorname} ${d.nachname}`.trim(),
    company: null,
    email_address: d.email,
    telefon: d.telefon || null,
    ihre_nachricht: zeilen.join("\n"),
    ...(leadRef ? { lead_ref: leadRef } : {}),
  };
}

/**
 * @param {object} data geprüfte Daten (validateReklamation)
 * @returns {Promise<{ ok: true, referenz: string|null, generation } | { ok: false, code: string, generation }>}
 *   code: not_configured | invalid | rate_limited | unavailable
 */
export async function sendReklamation(data, { env = process.env, fetchImpl = globalThis.fetch, leadRef = null, altUrl = ALT_KONTAKT_URL } = {}) {
  const target = resolveBackend("service", env);
  if (target.generation === "ph") {
    if (!target.ph) return { ok: false, code: "not_configured", generation: "ph" };
    const r = await phCall(target.ph, PH_SERVICE_METHOD, { params: phServicePayload(data, { leadRef }), fetchImpl });
    if (r.ok) return { ok: true, referenz: r.message?.referenz || null, generation: "ph" };
    return { ok: false, code: r.code === "invalid" ? "invalid" : r.code === "rate_limited" ? "rate_limited" : "unavailable", generation: "ph" };
  }
  const result = await forwardInquiry("kontakt", altKontaktPayload(data, { leadRef }), { altUrl, fetchImpl, env, idempotencyKey: data.idem || leadRef });
  if (result.kind === "ok") return { ok: true, referenz: result.data?.message?.name || null, generation: "alt" };
  if (result.kind === "not_configured") return { ok: false, code: "not_configured", generation: "alt" };
  if (result.kind === "http" && result.status === 429) return { ok: false, code: "rate_limited", generation: "alt" };
  return { ok: false, code: "unavailable", generation: "alt" };
}
