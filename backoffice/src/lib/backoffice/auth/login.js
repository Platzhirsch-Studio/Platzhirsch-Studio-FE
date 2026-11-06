// Anmelde-Adapter: Mock (Demo-Benutzer) oder Frappe. Liefert ein einheitliches
// Ergebnis für das Login-Formular und den Bedienerwechsel (PIN über ph_core.api.bediener,
// in beiden Modi über phCore(modus) → frappe/core.js bzw. mock/core.js).
// Reines Modul; die Cookie-Arbeit macht dal.js.

import { backofficeMode, IS_PRODUCTION, mockPassword } from "../config.js";
import { BackofficeError, istBackofficeError } from "../frappe/errors.js";
import { frappeBenutzer, frappeLogin, frappeLogout } from "../frappe/auth.js";
import { phCore } from "../frappe/core.js";
import { DEMO_BENUTZER, benutzerAmStandort, demoBenutzer } from "./mockUsers.js";
import { notfallRollenOk, passwortZugelassen } from "./microsoft.js";

const PASSWORT_AUS = "Die Anmeldung mit Passwort ist abgeschaltet. Bitte „Mit Microsoft anmelden“ verwenden.";

/**
 * @returns {Promise<{ok:true, user:string, name:string, roles:string[], frappeSid:string|null, standort:string}
 *          | {ok:false, verification:true, tmpId:string, hinweis:string}>}
 */
export async function anmelden({ email, passwort, otp, tmpId, modus = backofficeMode(), fetchImpl, production = IS_PRODUCTION, env = process.env } = {}) {
  // BACKOFFICE_LOGIN_ARTEN ohne "passwort" (Produktions-Standard): nur Notfall-Admins aus BACKOFFICE_NOTFALL_ADMINS.
  const zulassung = passwortZugelassen(email, { env, production });
  if (!zulassung.ok) throw new BackofficeError("forbidden", PASSWORT_AUS);
  if (modus === "frappe") {
    const r = await frappeLogin({ email, passwort, otp, tmpId, fetchImpl });
    if (!r.ok) return r;
    if (zulassung.notfall && !notfallRollenOk(r.roles)) {
      await frappeLogout({ sid: r.sid, fetchImpl });
      throw new BackofficeError("forbidden", PASSWORT_AUS);
    }
    // standort aus User.ph_core_standort (frappe/auth.js frappeBenutzer)
    return { ok: true, user: r.user, name: r.name, kurzname: r.kurzname, roles: r.roles, frappeSid: r.sid, standort: r.standort || "" };
  }
  // Mock: in Produktion verweigert er jede Anmeldung ohne gesetztes Passwort.
  const pw = mockPassword(env, production);
  const u = demoBenutzer(email);
  if (!pw || !u || String(passwort) !== pw) {
    throw new BackofficeError("auth", "E-Mail oder Passwort stimmen nicht.", { status: 401 });
  }
  if (zulassung.notfall && !notfallRollenOk(u.roles)) throw new BackofficeError("forbidden", PASSWORT_AUS);
  return { ok: true, user: u.email, name: u.name, roles: u.roles, frappeSid: null, standort: u.standort };
}

async function geraetTokenAusCookie() {
  try {
    const dal = await import("./dal.js");
    return (await dal.getGeraetToken()) || null;
  } catch {
    return null; // außerhalb eines Requests (Tests) gibt es kein Cookie
  }
}

function minuten(sekunden) {
  return Math.max(1, Math.ceil((Number(sekunden) || 0) / 60));
}

/** ph_core-Fehler der PIN-Prüfung in Texte für den Wechsel-Bildschirm übersetzen (Code/Detail bleiben). */
function pinFehler(err) {
  if (!istBackofficeError(err)) return err;
  if (err.phCode === "invalid_pin") {
    const v = Number(err.verbleibend ?? 0);
    err.message = v > 0 ? `PIN stimmt nicht. Noch ${v} ${v === 1 ? "Versuch" : "Versuche"}.` : "PIN stimmt nicht. Die PIN ist jetzt für 15 Minuten gesperrt.";
  } else if (err.phCode === "rate_limited" && err.sekunden !== undefined) {
    err.message = `PIN vorübergehend gesperrt. Bitte in ${minuten(err.sekunden)} Minuten erneut versuchen.`;
  } else if (err.phCode === "forbidden" && err.gesperrt) {
    err.message = "Dieses Gerät ist gesperrt. Bitte die Leitung kontaktieren.";
  } else if (err.phCode === "invalid_token") {
    err.message = "Dieses Gerät ist nicht (mehr) registriert.";
  }
  return err;
}

/**
 * Bedienerwechsel per PIN (Kassa/Packtisch) über ph_core.api.bediener.verify_pin – nur von einem
 * registrierten Gerät. geraetToken: Cookie ph_bo_geraet (ohne Angabe aus dem Request gelesen).
 * Mock ohne Gerät: Rückfall auf die Demo-PIN (Bedienerwechsel aus laufender Sitzung, E2E).
 */
export async function anmeldenMitPin({ email, pin, geraetToken, modus = backofficeMode(), ctx } = {}) {
  const token = geraetToken === undefined ? await geraetTokenAusCookie() : geraetToken;
  if (token) {
    let r;
    try {
      r = await phCore(modus).verifyPin({ email: String(email || "").trim().toLowerCase(), pin, geraetToken: token }, ctx || {});
    } catch (err) {
      throw pinFehler(err);
    }
    return { ok: true, user: r.user, name: r.name, kurzname: r.kurzname, roles: r.roles || [], frappeSid: null, standort: r.standort || "", geraet: r.geraet, arbeitsplatz: r.arbeitsplatz };
  }
  if (modus === "frappe") {
    throw new BackofficeError("forbidden", "Der PIN-Wechsel ist nur an einem registrierten Gerät möglich.", { detail: { phCode: "invalid_token" } });
  }
  const u = demoBenutzer(email);
  if (!u || !/^\d{4,6}$/.test(String(pin || "")) || String(pin) !== u.pin) {
    throw new BackofficeError("auth", "PIN stimmt nicht.", { status: 401 });
  }
  return { ok: true, user: u.email, name: u.name, kurzname: u.name.split(" ")[0], roles: u.roles, frappeSid: null, standort: u.standort };
}

/**
 * Bediener für den Wechsel-Bildschirm: ph_core.api.bediener.list_operators am Standort des Geräts.
 * Form wie bisher {email, name, roles} plus kurzname/standort. Ohne Gerät: Mock → Demo-Benutzer des
 * Standorts, Frappe → [] (PIN-Wechsel nur am registrierten Gerät).
 * @returns {Promise<Array<{email:string, name:string, kurzname:string, roles:string[], standort:string}>>}
 */
export async function bedienerListe({ geraetToken, standort = "Lochau", alleStandorte = false, modus = backofficeMode(), ctx } = {}) {
  const token = geraetToken === undefined ? await geraetTokenAusCookie() : geraetToken;
  if (token) {
    try {
      const liste = await phCore(modus).listOperators({ geraetToken: token, alleStandorte }, ctx || {});
      return liste.map((b) => ({ email: b.user, name: b.name, kurzname: b.kurzname, roles: b.roles || [], standort: b.standort || "" }));
    } catch (err) {
      if (modus === "frappe") throw pinFehler(err);
      // Mock: unbekanntes Gerät (z. B. nach Neustart) → Demo-Rückfall
    }
  }
  if (modus === "frappe") return [];
  return benutzerAmStandort(standort).map((b) => ({ ...b, kurzname: b.name.split(" ")[0], standort }));
}

export async function abmelden({ frappeSid, modus = backofficeMode(), fetchImpl } = {}) {
  if (modus === "frappe" && frappeSid) await frappeLogout({ sid: frappeSid, fetchImpl });
}

/** Prüft im Frappe-Modus, ob die Frappe-Sitzung noch lebt (für Seitenaufrufe sparsam nutzen). */
export async function sitzungNochGueltig({ frappeSid, modus = backofficeMode(), fetchImpl } = {}) {
  if (modus !== "frappe") return true;
  try {
    await frappeBenutzer({ sid: frappeSid, fetchImpl });
    return true;
  } catch {
    return false;
  }
}

export function demoZugaenge() {
  return DEMO_BENUTZER.map(({ email, name, roles }) => ({ email, name, roles }));
}
