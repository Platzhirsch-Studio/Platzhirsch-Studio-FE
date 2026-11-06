// Typisierte Wrapper der Backoffice-Schnittstellen aus ph_core (Backend-Import/ph_core/README.md,
// Abschnitt „Backoffice-Schnittstellen“, Entscheidungen Nr. 48/49):
//
//   Gerät      registerDevice, verifyDevice, touchDevice, listDevices   (ph_core.api.geraete.*)
//   Bediener   setPin, verifyPin, listOperators                         (ph_core.api.bediener.*)
//   Zentrale   globalSearch (ph_core.api.suche), recentActivity (ph_core.api.aktivitaet)
//
// Auth: verifyDevice/touchDevice/verifyPin/listOperators laufen mit dem Service-Token
// BACKOFFICE_FRAPPE_TOKEN (das Gerät weist sich über sein Token aus, nicht über einen Benutzer).
// Alles andere läuft mit der Frappe-Sitzung (sid) des angemeldeten Mitarbeiters.
// Fehler: ph_api-Codes → BackofficeError über phCoreFehler (client.js); invalid_pin → code "auth"
// mit err.verbleibend, rate_limited mit err.sekunden, forbidden (Gerät gesperrt) mit err.gesperrt.
//
// Signatur aller Funktionen: fn(args, ctx) – ctx = { session?, client?, fetchImpl?, baseUrl?, token? }.
// phCore(modus) liefert dieselben Funktionen für Mock (../mock/core.js) oder Frappe.
// Reines Modul (keine "@/"-Importe, kein server-only).

import { backofficeMode } from "../config.js";
import { FrappeClient } from "./client.js";
import * as mockCore from "../mock/core.js";

export const CORE_METHODEN = {
  registerDevice: "ph_core.api.geraete.register_device",
  verifyDevice: "ph_core.api.geraete.verify_device",
  touchDevice: "ph_core.api.geraete.touch_device",
  listDevices: "ph_core.api.geraete.list_devices",
  setPin: "ph_core.api.bediener.set_pin",
  verifyPin: "ph_core.api.bediener.verify_pin",
  listOperators: "ph_core.api.bediener.list_operators",
  globalSearch: "ph_core.api.suche.global_search",
  recentActivity: "ph_core.api.aktivitaet.recent_activity",
};

/** Antwortschlüssel (für Paritätstests Mock ↔ Frappe und als Doku). */
export const ANTWORT_SCHLUESSEL = {
  geraet: ["geraet", "geraetename", "typ", "arbeitsplatz", "standort", "kasse", "drucker", "drucker_typ", "aktiv", "gesperrt_grund", "zuletzt_gesehen"],
  geraetListe: ["geraet", "geraetename", "typ", "arbeitsplatz", "standort", "kasse", "drucker", "drucker_typ", "aktiv", "gesperrt_grund", "zuletzt_gesehen", "token_vorhanden", "registriert_am"],
  touch: ["ok", "geraet", "zuletzt_gesehen"],
  setPin: ["ok", "user", "pin_gesetzt_am"],
  verifyPin: ["user", "name", "kurzname", "roles", "standort", "geraet", "arbeitsplatz"],
  bediener: ["user", "name", "kurzname", "roles", "standort"],
  suche: ["doctype", "name", "titel", "status", "geaendert", "href_hinweis", "bereich"],
  aktivitaet: ["zeit", "benutzer", "benutzer_name", "doctype", "name", "titel", "art", "zusammenfassung", "href_hinweis", "bereich"],
};

export const GERAETE_TYPEN = ["Kassa", "Packtisch", "Mobil", "Backoffice"];
export const DRUCKER_TYPEN = ["Bon 80 mm", "A4", "Etikett"];

const SERVICE_SESSION = { user: "backoffice@platzhirsch.studio", roles: ["System Manager"] };

/**
 * @typedef {{geraet:string, geraetename:string, typ:string, arbeitsplatz:string, standort:string|null, kasse:string|null,
 *   drucker:string|null, drucker_typ:string|null, aktiv:0|1, gesperrt_grund:string|null, zuletzt_gesehen:string|null}} PhGeraet
 * @typedef {PhGeraet & {token:string}} PhGeraetNeu
 * @typedef {PhGeraet & {token_vorhanden:0|1, registriert_am:string|null}} PhGeraetZeile
 * @typedef {{user:string, name:string, kurzname:string, roles:string[], standort:string}} PhBediener
 * @typedef {PhBediener & {geraet:string, arbeitsplatz:string}} PhPinAnmeldung
 * @typedef {{doctype:string, name:string, titel:string, status:string|null, geaendert:string|null, href_hinweis:string, bereich:string|null}} PhSuchtreffer
 * @typedef {{zeit:string|null, benutzer:string, benutzer_name:string, doctype:string, name:string, titel:string, art:string,
 *   zusammenfassung:string, href_hinweis:string, bereich:string|null}} PhAktivitaet
 */

function clientFuer(ctx = {}, service = false) {
  if (!service && ctx.client && ctx.client.modus === "frappe") return ctx.client;
  return new FrappeClient(service ? SERVICE_SESSION : ctx.session || ctx.client?.session, {
    service,
    fetchImpl: ctx.fetchImpl ?? ctx.client?.fetchImpl,
    baseUrl: ctx.baseUrl ?? ctx.client?.baseUrl,
    token: ctx.token ?? ctx.client?.token,
  });
}

/** Leere/undefinierte Parameter weglassen (Frappe-Signaturen mit Default). */
function ohneLeere(args) {
  const out = {};
  for (const [k, v] of Object.entries(args || {})) if (v !== undefined && v !== null && v !== "") out[k] = v;
  return out;
}

function liste(x) {
  return Array.isArray(x) ? x : [];
}

/** Listenparameter (doctypes/bereiche/arbeitsplatz) als kommagetrennter Text – ph_core.api.liste versteht ihn. */
function alsListe(x) {
  if (x === undefined || x === null || x === "") return undefined;
  return Array.isArray(x) ? x.join(",") : String(x);
}

// ------------------------------------------------------------------ Gerät --

/**
 * Gerät anlegen und Token ausstellen (Benutzersitzung; System Manager / PH Backoffice-Admin / PH … Leitung).
 * @param {{geraetename:string, typ:string, standort?:string, arbeitsplatz?:string, kasse?:string, drucker?:string, drucker_typ?:string, notizen?:string}} args
 * @returns {Promise<PhGeraetNeu>}  `token` erscheint nur hier – sofort ins HttpOnly-Cookie, nie speichern.
 */
export async function registerDevice(args, ctx = {}) {
  return clientFuer(ctx).method(CORE_METHODEN.registerDevice, ohneLeere(args));
}

/** Token prüfen (Service-Token). @param {{token:string}} args @returns {Promise<PhGeraet>} */
export async function verifyDevice({ token } = {}, ctx = {}) {
  return clientFuer(ctx, true).method(CORE_METHODEN.verifyDevice, { token });
}

/** Lebenszeichen (Service-Token). @returns {Promise<{ok:boolean, geraet:string, zuletzt_gesehen:string|null}>} */
export async function touchDevice({ token } = {}, ctx = {}) {
  return clientFuer(ctx, true).method(CORE_METHODEN.touchDevice, { token });
}

/**
 * Geräteliste ohne Hashes (Benutzersitzung, Leserecht PH Geraet).
 * @param {{nurAktive?:boolean, standort?:string, arbeitsplatz?:string|string[]}} [args]
 * @returns {Promise<PhGeraetZeile[]>}
 */
export async function listDevices({ nurAktive, standort, arbeitsplatz } = {}, ctx = {}) {
  const r = await clientFuer(ctx).methodGet(CORE_METHODEN.listDevices, ohneLeere({ nur_aktive: nurAktive ? 1 : undefined, standort, arbeitsplatz: alsListe(arbeitsplatz) }));
  return liste(r);
}

// --------------------------------------------------------------- Bediener --

/**
 * PIN setzen (eigener Benutzer; fremde nur Admin/Leitung). Benutzersitzung.
 * @param {{pin:string, user?:string, standort?:string, kurzname?:string}} args
 * @returns {Promise<{ok:boolean, user:string, pin_gesetzt_am:string}>}
 */
export async function setPin({ pin, user, standort, kurzname } = {}, ctx = {}) {
  const args = { pin: String(pin ?? ""), ...ohneLeere({ user }) };
  if (standort !== undefined) args.standort = standort;
  if (kurzname !== undefined) args.kurzname = kurzname;
  return clientFuer(ctx).method(CORE_METHODEN.setPin, args);
}

/**
 * PIN prüfen – nur von einem registrierten, aktiven Gerät (Service-Token).
 * Fehler: invalid_pin (code auth, err.verbleibend), rate_limited (err.sekunden), forbidden (err.gesperrt), invalid_token, not_found.
 * @param {{email:string, pin:string, geraetToken:string}} args
 * @returns {Promise<PhPinAnmeldung>}
 */
export async function verifyPin({ email, pin, geraetToken } = {}, ctx = {}) {
  return clientFuer(ctx, true).method(CORE_METHODEN.verifyPin, { email, pin: String(pin ?? ""), geraet_token: geraetToken });
}

/**
 * Bediener für den Wechsel-Bildschirm am Standort des Geräts (Service-Token).
 * @param {{geraetToken:string, alleStandorte?:boolean}} args
 * @returns {Promise<PhBediener[]>}
 */
export async function listOperators({ geraetToken, alleStandorte } = {}, ctx = {}) {
  const r = await clientFuer(ctx, true).method(CORE_METHODEN.listOperators, { geraet_token: geraetToken, ...(alleStandorte ? { alle_standorte: 1 } : {}) });
  return liste(r);
}

// --------------------------------------------------------------- Zentrale --

/**
 * Globale Suche (Benutzersitzung). q ≥ 2 Zeichen, limit ≤ 50.
 * @param {{q:string, limit?:number, doctypes?:string[]}} args
 * @returns {Promise<PhSuchtreffer[]>}
 */
export async function globalSearch({ q, limit, doctypes } = {}, ctx = {}) {
  const r = await clientFuer(ctx).methodGet(CORE_METHODEN.globalSearch, ohneLeere({ q: String(q ?? ""), limit, doctypes: alsListe(doctypes) }));
  return liste(r);
}

/**
 * Aktivitätsstrom (Benutzersitzung). limit ≤ 100; bereiche = Schlüssel aus ph_core BEREICHE.
 * @param {{limit?:number, bereiche?:string[]}} [args]
 * @returns {Promise<PhAktivitaet[]>}
 */
export async function recentActivity({ limit, bereiche } = {}, ctx = {}) {
  const r = await clientFuer(ctx).methodGet(CORE_METHODEN.recentActivity, ohneLeere({ limit, bereiche: alsListe(bereiche) }));
  return liste(r);
}

const FRAPPE_CORE = { registerDevice, verifyDevice, touchDevice, listDevices, setPin, verifyPin, listOperators, globalSearch, recentActivity };

/**
 * Die ph_core-Schnittstellen für den aktiven Modus (gleiche Signaturen, gleiche Antwortform, gleiche Fehler).
 * @param {"mock"|"frappe"} [modus]
 */
export function phCore(modus = backofficeMode()) {
  return modus === "frappe" ? FRAPPE_CORE : mockCore;
}
