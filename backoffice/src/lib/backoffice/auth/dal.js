import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BACKOFFICE_LOGIN_PATH } from "../config.js";
import { SESSION_COOKIE, createSessionValue, readSessionValue, sessionCookieOptions } from "./session.js";
import { KIOSK_IDLE_SECONDS, pruefeStoreEintrag, sessionStore } from "./store.js";
import { ARBEITSPLAETZE, arbeitsplatz as apDaten, darf, darfDoc, erlaubteArbeitsplaetze, istAdmin, sichtbareBereiche } from "./rechte.js";
import { abmelden } from "./login.js";
import { GERAET_COOKIE, geraetAusCookie, geraetPruefen } from "./geraet.js";
import { vorliebenAusCookies, vorliebenLesen } from "./vorlieben.js";

// Data Access Layer der Anmeldung – DER Einstieg für jede Seite, Server Action
// und Route. Die Prüfung liegt nicht im Layout (läuft bei Client-Navigation
// nicht erneut), sondern hier.
//
//   Seite:          const session = await requireSession("/crm");
//   mit Recht:      const session = await requireRecht("crm", "read");
//   Server Action:  const session = await requireSession(); (wirft/redirect)
//   Route Handler:  const auth = await requireApiSession(request); if (auth.response) return auth.response;

export const ARBEITSPLATZ_COOKIE = "ph_bo_arbeitsplatz";

/** Sitzung aus Cookie + Store, oder null. Memoisiert je Request. */
export const getSession = cache(async () => {
  const store = await cookies();
  const cookie = readSessionValue(store.get(SESSION_COOKIE)?.value);
  if (!cookie) return null;
  const eintrag = await sessionStore().get(cookie.sid);
  const kiosk = !!(cookie.arbeitsplatz && apDaten(cookie.arbeitsplatz)?.kiosk);
  const status = pruefeStoreEintrag(eintrag, { kiosk });
  if (status !== "ok") return null;
  await sessionStore().touch(cookie.sid);
  const ap = store.get(ARBEITSPLATZ_COOKIE)?.value || cookie.arbeitsplatz || null;
  return {
    user: cookie.user,
    name: cookie.name,
    roles: cookie.roles,
    sid: cookie.sid,
    frappeSid: eintrag.frappeSid || null,
    standort: eintrag.standort || "",
    arbeitsplatz: ap && apDaten(ap) ? ap : "backoffice",
    issuedAt: cookie.issuedAt,
    expiresAt: cookie.expiresAt,
    // Komfort für Komponenten:
    bereiche: sichtbareBereiche(cookie.roles),
    arbeitsplaetze: erlaubteArbeitsplaetze(cookie.roles).map((a) => a.slug),
    admin: istAdmin(cookie.roles),
  };
});

export async function requireSession(returnTo) {
  const session = await getSession();
  if (!session) {
    const ziel = returnTo && /^\/[a-z0-9\-/?=&%._]*$/i.test(returnTo) && returnTo !== "/" ? `${BACKOFFICE_LOGIN_PATH}?next=${encodeURIComponent(returnTo)}` : BACKOFFICE_LOGIN_PATH;
    redirect(ziel);
  }
  return session;
}

/** Sitzung + Bereichsrecht; ohne Recht → 403-Seite (/kein-zugriff). */
export async function requireRecht(bereich, aktion = "read", returnTo) {
  const session = await requireSession(returnTo);
  if (!darf(session, bereich, aktion)) redirect(`/kein-zugriff?bereich=${encodeURIComponent(bereich)}&aktion=${encodeURIComponent(aktion)}`);
  return session;
}

/** Sitzung + DocType-Recht aus der Meta. */
export async function requireDocRecht(meta, aktion = "read", returnTo) {
  const session = await requireSession(returnTo);
  if (!darfDoc(session, meta, aktion)) redirect(`/kein-zugriff?doctype=${encodeURIComponent(meta?.name || "")}&aktion=${encodeURIComponent(aktion)}`);
  return session;
}

/**
 * Für Route Handler: Sitzung + Origin-Prüfung bei schreibenden Methoden (CSRF).
 * @returns {Promise<{session?:object, response?:Response}>}
 */
export async function requireApiSession(request) {
  const session = await getSession();
  if (!session) return { response: Response.json({ code: "auth", message: "Nicht angemeldet." }, { status: 401 }) };
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) {
      return { response: Response.json({ code: "forbidden", message: "Ungültige Herkunft." }, { status: 403 }) };
    }
  }
  return { session };
}

/**
 * Legt eine Sitzung an (Store + Cookie). Nur aus Server Actions / Route Handlern
 * aufrufen (dort darf Next Cookies setzen).
 */
export async function startSession({ user, name, roles, frappeSid = null, standort = "", arbeitsplatz = null, kiosk = false }) {
  const { value, sid } = createSessionValue({ user, name, roles, arbeitsplatz });
  await sessionStore().set(sid, { user, frappeSid, standort, idleSeconds: kiosk ? KIOSK_IDLE_SECONDS : undefined });
  const store = await cookies();
  store.set(SESSION_COOKIE, value, sessionCookieOptions);
  if (arbeitsplatz) store.set(ARBEITSPLATZ_COOKIE, arbeitsplatz, { ...sessionCookieOptions, maxAge: 60 * 60 * 24 * 365 });
  return sid;
}

export async function endSession() {
  const store = await cookies();
  const cookie = readSessionValue(store.get(SESSION_COOKIE)?.value);
  if (cookie) {
    const eintrag = await sessionStore().get(cookie.sid);
    await abmelden({ frappeSid: eintrag?.frappeSid });
    await sessionStore().delete(cookie.sid);
  }
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
}

export async function setzeArbeitsplatz(slug) {
  if (!ARBEITSPLAETZE.some((a) => a.slug === slug)) return;
  const store = await cookies();
  store.set(ARBEITSPLATZ_COOKIE, slug, { ...sessionCookieOptions, maxAge: 60 * 60 * 24 * 365 });
}

/** Klartext-Token des Geräte-Cookies (nur serverseitig weiterreichen, nie loggen/speichern), oder null. */
export async function getGeraetToken() {
  const store = await cookies();
  return store.get(GERAET_COOKIE)?.value || null;
}

/**
 * Registriertes, aktives Gerät (Cookie ph_bo_geraet → ph_core verify_device, 60 s gecacht unter dem
 * Token-Hash), oder null. Felder: id, name (Gerätename), typ, arbeitsplatz, standort, kasse, drucker, …
 */
export const getGeraet = cache(async () => geraetAusCookie(await getGeraetToken()));

/** Wie getGeraet, aber mit Status (ok | unbekannt | gesperrt | fehler) – für Hinweise „Gerät gesperrt“. */
export const getGeraetStatus = cache(async () => {
  const token = await getGeraetToken();
  if (!token) return { status: "unbekannt", geraet: null };
  const r = await geraetPruefen(token);
  return { status: r.status, geraet: r.geraet };
});

/** Client-IP als Hash-Grundlage (hinter dem Reverse-Proxy x-forwarded-for). */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "lokal";
}

/**
 * Vorlieben der angemeldeten Person (Theme, Dichte, Einzeltasten) – Store, sonst Cookies, sonst Standard.
 * Memoisiert je Request; ein Store-Ausfall fällt auf die Cookies zurück (Darstellung darf nie eine Seite brechen).
 */
export const getVorlieben = cache(async () => {
  const store = await cookies();
  const ausCookies = vorliebenAusCookies((n) => store.get(n)?.value);
  const session = await getSession();
  if (!session) return ausCookies;
  try {
    return (await vorliebenLesen(session.user)) || ausCookies;
  } catch {
    return ausCookies;
  }
});
