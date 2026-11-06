// Geräte-Registrierung (Entscheidung Nr. 49) über ph_core „PH Geraet“:
//   registrieren  → ph_core.api.geraete.register_device (Sitzung des Mitarbeiters; Admin/Leitung)
//   prüfen        → verify_device (Service-Token; setzt zuletzt_gesehen)
//   Lebenszeichen → touch_device  (Service-Token)
//   Liste         → list_devices  (Sitzung, Leserecht PH Geraet)
// Das Token (32 Byte base64url) steht NUR im HttpOnly-Cookie ph_bo_geraet. Serverseitig liegt
// höchstens ein kurzer Cache der Gerätedaten unter dem SHA-256 des Tokens (store.js) – nie der Klartext.
// Mock und Frappe über phCore(modus) mit identischer Antwortform (mock/core.js ↔ frappe/core.js).
// Reines Modul (Sitzung wird nur bei Bedarf per dynamischem Import aus dal.js geholt).

import { IS_PRODUCTION, backofficeMode } from "../config.js";
import { BackofficeError, istBackofficeError } from "../frappe/errors.js";
import { phCore } from "../frappe/core.js";
import { tokenHash } from "../mock/core.js";
import { sessionStore } from "./store.js";

export const GERAET_COOKIE = "ph_bo_geraet";
/** Formular-Slugs → ph_core-Gerätetyp (PH Geraet.typ). */
export const GERAET_TYPEN = [
  { slug: "kassa", titel: "Kassa", arbeitsplatz: "kassa", phTyp: "Kassa" },
  { slug: "packtisch", titel: "Packtisch", arbeitsplatz: "packtisch", phTyp: "Packtisch" },
  { slug: "mobil", titel: "Mobil (Montage/Technik)", arbeitsplatz: "montage", phTyp: "Mobil" },
];

/** Gerätedaten frisch halten: verify_device höchstens einmal je Minute je Gerät. */
export const GERAET_CACHE_MS = 60_000;
/** Ist Frappe kurz nicht erreichbar, gilt ein bereits geprüftes Gerät noch so lange weiter. */
export const GERAET_STALE_MS = 12 * 60 * 60_000;

export const geraetCookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export { tokenHash };

async function aktuelleSession() {
  try {
    const dal = await import("./dal.js");
    return await dal.getSession();
  } catch {
    return null;
  }
}

/**
 * Antwort von verify_device/register_device → Form, die Seiten seit dem Fundament nutzen
 * (name = Gerätename) plus die ph_core-Felder unverändert.
 */
export function geraetKompatibel(g, extra = {}) {
  if (!g) return null;
  return {
    id: g.geraet,
    name: g.geraetename,
    geraet: g.geraet,
    geraetename: g.geraetename,
    typ: g.typ,
    arbeitsplatz: g.arbeitsplatz,
    standort: g.standort || "",
    kasse: g.kasse || "",
    drucker: g.drucker || "",
    drucker_typ: g.drucker_typ || "",
    aktiv: g.aktiv ? 1 : 0,
    gesperrt_grund: g.gesperrt_grund || "",
    zuletzt_gesehen: g.zuletzt_gesehen || null,
    registriertVon: extra.registriertVon || "",
  };
}

/**
 * Registriert dieses Gerät in ph_core und gibt das Token für das Cookie zurück.
 * @param {{name:string, standort:string, typ:string, kasse?:string, drucker?:string, druckerTyp?:string, notizen?:string, registriertVon?:string}} geraet
 * @param {{session?:object, modus?:string, ctx?:object}} [opts]  ohne session → aktuelle Sitzung (dal.js)
 * @returns {Promise<string>} Token (einmalig, nur fürs HttpOnly-Cookie)
 */
export async function geraetSpeichern(geraet, opts = {}) {
  const typ = GERAET_TYPEN.find((t) => t.slug === geraet.typ || t.phTyp === geraet.typ);
  if (!typ) throw new BackofficeError("invalid", "Unbekannter Gerätetyp.", { detail: { field: "typ" } });
  const session = opts.session || (await aktuelleSession());
  const r = await phCore(opts.modus || backofficeMode()).registerDevice(
    { geraetename: geraet.name, typ: typ.phTyp, standort: geraet.standort, arbeitsplatz: typ.arbeitsplatz, kasse: geraet.kasse, drucker: geraet.drucker, drucker_typ: geraet.druckerTyp, notizen: geraet.notizen },
    { ...(opts.ctx || {}), session }
  );
  const { token, ...daten } = r;
  if (!token) throw new BackofficeError("unavailable", "ph_core hat kein Geräte-Token ausgestellt.");
  await sessionStore().geraetSetzen(tokenHash(token), { daten, registriertVon: geraet.registriertVon || session?.user || "", geprueft: Date.now() });
  return token;
}

/**
 * Prüft das Geräte-Token (Cookie) gegen ph_core.
 * @returns {Promise<{status:"ok"|"unbekannt"|"gesperrt"|"fehler", geraet:object|null, fehler?:BackofficeError}>}
 */
export async function geraetPruefen(token, opts = {}) {
  const h = tokenHash(token);
  if (!h) return { status: "unbekannt", geraet: null };
  const store = sessionStore();
  const alt = await store.geraetLesen(h);
  const jetzt = opts.jetzt ?? Date.now();
  if (alt && !opts.frisch && jetzt - alt.geprueft < GERAET_CACHE_MS) return { status: "ok", geraet: geraetKompatibel(alt.daten, alt) };
  try {
    const daten = await phCore(opts.modus || backofficeMode()).verifyDevice({ token }, opts.ctx || {});
    await store.geraetSetzen(h, { daten, registriertVon: alt?.registriertVon || "", geprueft: jetzt });
    return { status: "ok", geraet: geraetKompatibel(daten, alt || {}) };
  } catch (err) {
    if (istBackofficeError(err) && (err.phCode === "invalid_token" || err.phCode === "invalid")) {
      await store.geraetLoeschen(h);
      return { status: "unbekannt", geraet: null };
    }
    if (istBackofficeError(err) && err.phCode === "forbidden" && err.gesperrt) {
      await store.geraetLoeschen(h);
      return { status: "gesperrt", geraet: alt ? geraetKompatibel({ ...alt.daten, aktiv: 0 }, alt) : { id: err.geraet || "", aktiv: 0 }, fehler: err };
    }
    // Frappe nicht erreichbar o. Ä.: zuletzt bekannten Stand weiterverwenden.
    if (alt && jetzt - alt.geprueft < GERAET_STALE_MS) return { status: "ok", geraet: geraetKompatibel(alt.daten, alt) };
    return { status: "fehler", geraet: null, fehler: istBackofficeError(err) ? err : undefined };
  }
}

/** Registriertes, aktives Gerät zum Cookie oder null (gesperrt/unbekannt → null). */
export async function geraetAusCookie(token, opts = {}) {
  if (!token || typeof token !== "string" || token.length > 128) return null;
  const r = await geraetPruefen(token, opts);
  return r.status === "ok" ? r.geraet : null;
}

/** Lebenszeichen des Kiosks (touch_device). @returns {Promise<{ok:boolean, geraet?:string, zuletzt_gesehen?:string|null, code?:string}>} */
export async function geraetLebenszeichen(token, opts = {}) {
  if (!tokenHash(token)) return { ok: false, code: "invalid_token" };
  try {
    return await phCore(opts.modus || backofficeMode()).touchDevice({ token }, opts.ctx || {});
  } catch (err) {
    if (istBackofficeError(err)) return { ok: false, code: err.phCode || err.code, gesperrt: !!err.gesperrt };
    throw err;
  }
}

/**
 * Registrierung an diesem Gerät entfernen: Cache verwerfen (das Cookie löscht der Aufrufer).
 * ph_core bietet kein Abmelden per API; Sperren/Token erneuern macht die Leitung in „PH Geraet“.
 */
export async function geraetEntfernen(token) {
  const h = tokenHash(token);
  if (h) await sessionStore().geraetLoeschen(h);
}

/** Geräteliste aus ph_core (Sitzung mit Leserecht PH Geraet). */
export async function geraeteListe({ session, nurAktive, standort, arbeitsplatz, modus, ctx } = {}) {
  const s = session || (await aktuelleSession());
  return phCore(modus || backofficeMode()).listDevices({ nurAktive, standort, arbeitsplatz }, { ...(ctx || {}), session: s });
}
