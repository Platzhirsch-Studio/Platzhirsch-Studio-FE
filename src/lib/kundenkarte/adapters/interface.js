// src/lib/kundenkarte/adapters/interface.js – Vertrag der Kundenkarten-Adapter
// (mock heute, Frappe-App ph_kundenkarte sobald angebunden).
//
// Frappe-Methoden (Basis FRAPPE_KUNDENKARTE_METHOD_BASE, Standard "ph_kundenkarte.api"):
//   POST create_card_application  { vorname, nachname, email, telefon, plz, ort,
//        geburtstag ("YYYY-MM-DD" | "--MM-DD" | ""), interessen[], einwilligung_auswertung,
//        einwilligung_newsletter, einwilligung_textversion, newsletter_textversion,
//        vertragsdaten_akzeptiert: 1, sprache, confirm_hash (SHA-256 des Link-Geheimnisses),
//        quelle: "website", idempotency_key }
//        → { referenz, status: "Neu", doi, doi_token: null, email_maskiert, bereits_vorhanden }
//   POST confirm_card_application  { antrag, confirm_hash }  (das Backend vergleicht nur Hashes;
//        Einstellung „Website-Anträge automatisch annehmen“ stellt die Karte sofort aus)
//        → { referenz, status: "aktiv" | "bestaetigt" | "bereits_bestaetigt", kartennummer? }
//   GET  get_card_status           { email } → { found, status }
//   GET  portal_card               { kontakt, kunde_token } → Karte (siehe PortalCard)
//   POST portal_wallet_pass        { kontakt, kunde_token, plattform: "apple" | "google" }
//        → { url } | Fehler "unavailable" (bis das Backend signiert)
//
// Fehlercodes (wie Portal-/Termin-Lib): invalid 400, conflict 409,
// rate_limited 429, unavailable 503; dazu invalid_token 400, expired 410,
// not_configured 503 (service.js PUBLIC_ERRORS).
//
/**
 * @typedef {Object} Application
 * @property {string} ref                 Antragsnummer "KK-XXXXXX"
 * @property {"unbestaetigt"|"aktiv"|"gekuendigt"} status
 * @property {string} vorname
 * @property {string} nachname
 * @property {string} email               klein geschrieben
 * @property {string} telefon
 * @property {string} plz
 * @property {string} ort
 * @property {string} geburtstag          "" | "YYYY-MM-DD" | "--MM-DD"
 * @property {string[]} interessen
 * @property {boolean} einwilligungAuswertung
 * @property {boolean} einwilligungNewsletter
 * @property {string} einwilligungTextVersion
 * @property {string} sprache             de|en|fr|it
 * @property {string} confirmHash         SHA-256 des Link-Geheimnisses (nie das Geheimnis)
 * @property {string} confirmUntil        ISO, Ablauf des Bestätigungslinks
 * @property {string|null} kartennummer   nach Bestätigung
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} PortalCard  (Antwort von portal_card)
 * @property {string} kartennummer
 * @property {{name:string, farbe:string, seit:string}} stufe
 * @property {{name:string, fehlt_cent:number}|null} naechste_stufe
 * @property {{titel:string, art:string, beschreibung:string, verfuegbar:boolean, einloesbar_pro_jahr:number|null, genutzt:number}[]} vorteile
 * @property {{datum:string, vorteil:string, notiz?:string}[]} einloesungen
 * @property {{apple:boolean, google:boolean}} wallet
 *
 * @typedef {Object} KundenkarteAdapter
 * @property {"mock"|"frappe"} kind
 * @property {boolean} test               true → Seite zeigt Testbetrieb und devConfirmUrl
 * @property {(input: object) => Promise<{ok:true, application:Application, replay?:boolean}|{ok:false, code:string}>} create
 * @property {(ref:string, secret:string) => Promise<{ok:true, application:Application, already?:boolean}|{ok:false, code:string}>} confirm
 * @property {(email:string) => Promise<{found:boolean, status:string|null}>} status
 * @property {(kontakt:string, kundeToken:string) => Promise<PortalCard|null>} portalCard
 * @property {(kontakt:string, kundeToken:string, plattform:"apple"|"google") => Promise<{ok:true, url:string}|{ok:false, code:string}>} walletPass
 */

export const ADAPTER_METHODS = Object.freeze(["create", "confirm", "status", "portalCard", "walletPass"]);

/** Wirft früh, wenn ein Adapter eine Methode des Vertrags nicht hat. */
export function assertAdapter(adapter) {
  const missing = ADAPTER_METHODS.filter((m) => typeof adapter?.[m] !== "function");
  if (missing.length) throw new Error(`Kundenkarten-Adapter "${adapter?.kind}" unvollständig: ${missing.join(", ")}`);
  return adapter;
}
