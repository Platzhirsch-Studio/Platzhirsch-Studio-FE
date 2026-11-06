// Frappe-Anmeldeadapter: POST /api/method/login (usr/pwd) → sid-Cookie aus der
// Antwort, danach Benutzer und Rollen über /api/resource/User/<name> (roles[]).
// 2FA: antwortet Frappe mit `verification` (tmp_id), fragt die Oberfläche den
// OTP ab und ruft login erneut mit tmp_id + otp. Logout: /api/method/logout.
// Reines Modul (fetchImpl injizierbar, testbar).

import { backofficeFetch } from "./http.js";
import { BackofficeError, alsBackofficeError, fehlerAusFrappe, serverMessages } from "./errors.js";
import { frappeUrl } from "../config.js";

function sidAusHeadern(response) {
  const roh = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [response.headers.get("set-cookie")].filter(Boolean);
  for (const c of roh) {
    const m = /(?:^|;\s*)sid=([^;]+)/.exec(c);
    if (m && m[1] && m[1] !== "Guest") return m[1];
  }
  return null;
}

async function json(response) {
  const t = await response.text();
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return { message: t.slice(0, 300) };
  }
}

/**
 * @returns {Promise<{ok:true, sid:string, user:string, name:string, roles:string[], standort:string, kurzname:string} | {ok:false, verification:true, tmpId:string, methode?:string, hinweis?:string}>}
 * Wirft BackofficeError("auth") bei falschen Zugangsdaten.
 */
export async function frappeLogin({ email, passwort, otp, tmpId, baseUrl = frappeUrl(), fetchImpl } = {}) {
  if (!baseUrl) throw new BackofficeError("unavailable", "BACKOFFICE_FRAPPE_URL ist nicht gesetzt.");
  const body = tmpId ? { tmp_id: tmpId, otp, cmd: "login" } : { usr: email, pwd: passwort };
  let response;
  try {
    response = await backofficeFetch(`${baseUrl}/api/method/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      timeoutMs: 8000,
      retries: 0,
      dedupe: false,
      fetchImpl,
    });
  } catch (err) {
    throw alsBackofficeError(err, "Anmeldedienst nicht erreichbar.");
  }
  const daten = await json(response);
  if (response.status === 401 || response.status === 417) {
    const texte = serverMessages(daten?._server_messages);
    throw new BackofficeError("auth", texte[0] || "E-Mail oder Passwort stimmen nicht.", { status: 401 });
  }
  if (!response.ok) throw fehlerAusFrappe(response.status, daten, "Anmeldung fehlgeschlagen.");
  if (daten?.verification) {
    return { ok: false, verification: true, tmpId: daten.tmp_id, methode: daten.verification.method, hinweis: daten.verification.prompt || "Bitte den Code aus der Authenticator-App eingeben." };
  }
  const sid = sidAusHeadern(response);
  if (!sid) throw new BackofficeError("auth", "Frappe hat keine Sitzung ausgestellt.", { status: 401 });
  const benutzer = await frappeBenutzer({ sid, baseUrl, fetchImpl });
  return { ok: true, sid, ...benutzer };
}

/** Angemeldeter Benutzer + Rollen über die Benutzer-Sitzung. */
export async function frappeBenutzer({ sid, baseUrl = frappeUrl(), fetchImpl } = {}) {
  const headers = { Accept: "application/json", Cookie: `sid=${sid}` };
  let response;
  try {
    response = await backofficeFetch(`${baseUrl}/api/method/frappe.auth.get_logged_user`, { headers, cache: "no-store", timeoutMs: 6000, dedupe: false, fetchImpl });
  } catch (err) {
    throw alsBackofficeError(err);
  }
  const d = await json(response);
  if (!response.ok || !d?.message || d.message === "Guest") throw new BackofficeError("auth", "Sitzung ungültig.", { status: 401 });
  const user = d.message;
  let userDoc;
  try {
    const r = await backofficeFetch(`${baseUrl}/api/resource/User/${encodeURIComponent(user)}`, { headers, cache: "no-store", timeoutMs: 6000, dedupe: false, fetchImpl });
    userDoc = (await json(r))?.data;
  } catch {
    userDoc = null;
  }
  const roles = (userDoc?.roles || []).map((x) => x.role).filter(Boolean);
  if (!roles.length) {
    // Rückfall: frappe.core.doctype.user.user.get_roles (gleiche Sitzung)
    try {
      const r = await backofficeFetch(`${baseUrl}/api/method/frappe.core.doctype.user.user.get_roles?uid=${encodeURIComponent(user)}`, { headers, cache: "no-store", timeoutMs: 6000, dedupe: false, fetchImpl });
      const rr = await json(r);
      if (Array.isArray(rr?.message)) roles.push(...rr.message);
    } catch {
      // ohne Rollen → sieht nur die Zentrale lesend
    }
  }
  if (userDoc && userDoc.enabled === 0) throw new BackofficeError("forbidden", "Benutzer ist deaktiviert.");
  // Standort/Kurzname aus den ph_core-Feldern am User (fixtures/custom_field.json), nicht aus User.location.
  const name = userDoc?.full_name || user;
  return { user, name, roles, standort: userDoc?.ph_core_standort || "", kurzname: userDoc?.ph_core_kurzname || String(name).split(" ")[0] };
}

export async function frappeLogout({ sid, baseUrl = frappeUrl(), fetchImpl } = {}) {
  if (!sid || !baseUrl) return;
  try {
    await backofficeFetch(`${baseUrl}/api/method/logout`, { method: "POST", headers: { Cookie: `sid=${sid}` }, cache: "no-store", timeoutMs: 4000, retries: 0, dedupe: false, fetchImpl });
  } catch {
    // Abmelden darf nie scheitern: lokale Sitzung wird ohnehin gelöscht.
  }
}
