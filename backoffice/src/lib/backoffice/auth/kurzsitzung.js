// Personen- und Freigabe-Sitzung (G-25, Kassa E4/§ 3.11 „Freigabe am Ende“, Q-J2).
// Eine Person bestätigt am laufenden Arbeitsplatz mit PIN (bzw. Passwort) GENAU EINE Aktion; danach ist
// der Store-Eintrag weg. Die Sitzung des Arbeitsplatzes (Cookie) bleibt unverändert.
//
//   // Server Action des Bereichs (Sitzung + Recht wie immer zuerst prüfen):
//   const session = await requireRecht("kassa", "write");
//   const r = await freigeben(
//     { zweck: "kassa.freigabe", benutzer: formData.get("leitung"), pin: formData.get("pin"), sitzung: session },
//     async (person) => backoffice(personAlsSitzung(person)).call("ph_kassa…", {...})
//   );
//   // r = { ok:true, ergebnis, freigabe:{ zweck, user, name, art, zeit } } – freigabe ins Protokoll/Toast
//
// Zweistufig (Dialog prüft die PIN, die Aktion folgt im nächsten Request):
//   const k = await sitzungMitPin({ benutzer, pin, zweck, sitzung });         // → { token, ablauf, person… }
//   await mitKurzsitzung(k.token, { zweck, sitzung }, async (person) => …);   // löst genau einmal ein
//
// Prüfwege:
//   Mock            PIN wie geplant (Demo-PIN bzw. PIN-Prüfung des Mock-ph_core am registrierten Gerät)
//   Frappe          PIN über ph_core.api.bediener.verify_pin – liefert KEINE Frappe-Sitzung. Für Zwecke, die
//                   in der Sitzung der freigebenden Person laufen müssen (`eigeneSitzung`), gilt bis zur
//                   Anfrage P9 (ph_core sitzung_mit_pin) Passwort statt PIN (Kassa E4): Frappe-Login →
//                   kurzlebige sid, nach der Aktion sofort abgemeldet. freigabeArt() sagt der Oberfläche,
//                   welches Feld sie zeigt.
// Sicherheit: Token 32 Byte zufällig, im Store nur sein SHA-256 (k:<hash>), Frist Standard 60 s (max. 300 s),
// gebunden an die Arbeitsplatz-Sitzung und den Zweck, Einlösen atomar (wertNehmen). Fehlversuche je Person
// und Arbeitsplatz begrenzt (zusätzlich zur PIN-Sperre in ph_core). Nie PIN, Passwort oder sid loggen.
// Reines Modul (keine "@/"-Importe).

import { createHash, randomBytes } from "node:crypto";
import { IS_PRODUCTION, LOGIN_RATE_LIMIT, backofficeMode } from "../config.js";
import { BackofficeError, istBackofficeError } from "../frappe/errors.js";
import { abmelden, anmelden, anmeldenMitPin } from "./login.js";
import { ipHash, rateLimit, rateLimitStatus } from "./rateLimit.js";
import { darf } from "./rechte.js";
import { sessionStore } from "./store.js";
import { AUTH_TEXTE, ZWECK_TITEL } from "./texte.js";

export const KURZSITZUNG_TTL_STANDARD = 60;
export const KURZSITZUNG_TTL_MAX = 300;
const PIN_RE = /^\d{4,6}$/;

/**
 * Vorgesehene Zwecke. recht = was die FREIGEBENDE Person dürfen muss; eigeneSitzung = die Aktion läuft in ihrer
 * Frappe-Sitzung (Frappe-Modus ohne P9 → Passwort); fremd = die freigebende Person muss eine andere sein als
 * die angemeldete (Vier-Augen); selbst = die bestätigende Person ist die Person, für die gebucht wird.
 * Neue Zwecke nur über P0-8 (Glossar § 3, Protokolltext).
 */
export const KURZSITZUNG_ZWECKE = Object.freeze({
  "kassa.freigabe": { titel: ZWECK_TITEL["kassa.freigabe"], recht: { bereich: "kassa", aktion: "cancel" }, eigeneSitzung: true, fremd: true },
  "personal.stempeln-fuer": { titel: ZWECK_TITEL["personal.stempeln-fuer"], recht: null, eigeneSitzung: false, fremd: false, selbst: true },
  "logistik.leitungsfreigabe": { titel: ZWECK_TITEL["logistik.leitungsfreigabe"], recht: { bereich: "logistik", aktion: "cancel" }, eigeneSitzung: true, fremd: true },
  "projekte.leitungsfreigabe": { titel: ZWECK_TITEL["projekte.leitungsfreigabe"], recht: { bereich: "projekte", aktion: "cancel" }, eigeneSitzung: true, fremd: true },
});

/** Fehlversuche je Person + Arbeitsplatz (PIN und Passwort) – wie beim Login 5 je 10 min in Produktion. */
export const FREIGABE_RATE_LIMIT = LOGIN_RATE_LIMIT;

export function zweckDaten(zweck) {
  const z = KURZSITZUNG_ZWECKE[zweck];
  if (!z) throw new BackofficeError("invalid", AUTH_TEXTE.zweckUnbekannt, { detail: { field: "zweck" } });
  return z;
}

export function tokenHash(token) {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token) ? createHash("sha256").update(token).digest("hex") : null;
}

function speicherSchluessel(hash) {
  return `k:${hash}`;
}

function ttlBegrenzt(ttl) {
  const n = Math.floor(Number(ttl) || KURZSITZUNG_TTL_STANDARD);
  return Math.min(KURZSITZUNG_TTL_MAX, Math.max(5, n));
}

/**
 * Welches Eingabefeld der Freigabe-Schritt zeigt.
 * @returns {"pin"|"passwort"}
 */
export function freigabeArt(zweck, { modus = backofficeMode(), pinSitzung = false } = {}) {
  const z = zweckDaten(zweck);
  if (modus !== "frappe") return "pin";
  return z.eigeneSitzung && !pinSitzung ? "passwort" : "pin";
}

function grenzSchluessel(benutzer, sitzung) {
  return `freigabe:${ipHash(String(benutzer || "").toLowerCase())}:${ipHash(sitzung?.sid || "ohne")}`;
}

function grenzePruefen(schluessel) {
  const s = rateLimitStatus(schluessel, FREIGABE_RATE_LIMIT);
  if (!s.ok) throw new BackofficeError("rate_limited", AUTH_TEXTE.zuVieleVersuche(Math.max(1, Math.ceil(s.retryAfterSec / 60))), { detail: { sekunden: s.retryAfterSec } });
}

/** Prüft Recht und Vier-Augen-Regel an der bestätigten Person. */
export function pruefePerson(zweck, person, sitzung) {
  const z = zweckDaten(zweck);
  if (z.fremd && sitzung?.user && person.user === sitzung.user) throw new BackofficeError("forbidden", AUTH_TEXTE.selbstFreigabe);
  if (z.recht && !darf(person.roles, z.recht.bereich, z.recht.aktion)) throw new BackofficeError("forbidden", AUTH_TEXTE.keinRecht(z.titel), { detail: { zweck } });
  return true;
}

async function anlegen({ zweck, person, art, ttl, sitzung, frappeSid = null }) {
  const token = randomBytes(32).toString("base64url");
  const sek = ttlBegrenzt(ttl);
  const jetzt = Date.now();
  const eintrag = {
    zweck,
    art,
    user: person.user,
    name: person.name,
    kurzname: person.kurzname || String(person.name || person.user).split(" ")[0],
    roles: person.roles || [],
    standort: person.standort || "",
    geraet: person.geraet || null,
    frappeSid,
    fuerSid: sitzung?.sid || null,
    fuerUser: sitzung?.user || null,
    ausgestellt: jetzt,
    ablauf: jetzt + sek * 1000,
  };
  await sessionStore().wertSetzen(speicherSchluessel(tokenHash(token)), eintrag, { ttlSekunden: sek });
  return { token, zweck, art, user: eintrag.user, name: eintrag.name, kurzname: eintrag.kurzname, ablauf: eintrag.ablauf };
}

/**
 * G-25: Person per PIN bestätigen und eine Kurzsitzung für genau eine Aktion anlegen.
 * @param {{benutzer:string, pin:string, geraetToken?:string|null, zweck:string, ttl?:number, sitzung?:object, modus?:string, ctx?:object}} p
 *   geraetToken: ohne Angabe aus dem Cookie (login.js); sitzung: die Arbeitsplatz-Sitzung (getSession/requireSession)
 * @returns {Promise<{token:string, zweck:string, art:"pin", user:string, name:string, kurzname:string, ablauf:number}>}
 */
export async function sitzungMitPin({ benutzer, pin, geraetToken, zweck, ttl = KURZSITZUNG_TTL_STANDARD, sitzung, modus = backofficeMode(), ctx } = {}) {
  zweckDaten(zweck);
  if (freigabeArt(zweck, { modus }) !== "pin") throw new BackofficeError("forbidden", AUTH_TEXTE.passwortNoetig, { detail: { art: "passwort" } });
  const email = String(benutzer || "").trim().toLowerCase();
  if (!email) throw new BackofficeError("invalid", AUTH_TEXTE.personFehlt, { detail: { field: "benutzer" } });
  const p = String(pin ?? "").trim();
  if (!p) throw new BackofficeError("invalid", AUTH_TEXTE.pinFehlt, { detail: { field: "pin" } });
  if (!PIN_RE.test(p)) throw new BackofficeError("invalid", AUTH_TEXTE.pinFormat, { detail: { field: "pin" } });
  const grenze = grenzSchluessel(email, sitzung);
  grenzePruefen(grenze);
  let person;
  try {
    person = await anmeldenMitPin({ email, pin: p, geraetToken, modus, ctx });
  } catch (err) {
    rateLimit(grenze, FREIGABE_RATE_LIMIT);
    throw err;
  }
  pruefePerson(zweck, person, sitzung);
  return anlegen({ zweck, person, art: "pin", ttl, sitzung });
}

/**
 * Rückfall ohne P9 (Kassa E4): Passwort statt PIN. Im Frappe-Modus entsteht eine echte, kurzlebige
 * Frappe-Sitzung der Person, die mitKurzsitzung() nach der Aktion abmeldet. Folgt dem Login-Arten-Schalter
 * (BACKOFFICE_LOGIN_ARTEN): ist das Passwort abgeschaltet, gilt das auch hier.
 */
export async function sitzungMitPasswort({ benutzer, passwort, zweck, ttl = KURZSITZUNG_TTL_STANDARD, sitzung, modus = backofficeMode(), fetchImpl, env = process.env, production = IS_PRODUCTION } = {}) {
  zweckDaten(zweck);
  const email = String(benutzer || "").trim().toLowerCase();
  if (!email) throw new BackofficeError("invalid", AUTH_TEXTE.personFehlt, { detail: { field: "benutzer" } });
  if (!passwort) throw new BackofficeError("invalid", AUTH_TEXTE.passwortFehlt, { detail: { field: "passwort" } });
  const grenze = grenzSchluessel(email, sitzung);
  grenzePruefen(grenze);
  let r;
  try {
    r = await anmelden({ email, passwort: String(passwort), modus, fetchImpl, env, production });
  } catch (err) {
    if (istBackofficeError(err) && err.code === "forbidden") throw new BackofficeError("forbidden", AUTH_TEXTE.passwortAus);
    rateLimit(grenze, FREIGABE_RATE_LIMIT);
    throw err;
  }
  if (!r.ok) {
    // Zwei-Faktor-Rückfrage passt nicht in den Freigabe-Schritt: als Fehlversuch werten, Sitzung gibt es keine.
    rateLimit(grenze, FREIGABE_RATE_LIMIT);
    throw new BackofficeError("auth", AUTH_TEXTE.passwortAus, { detail: { verification: !!r.verification } });
  }
  try {
    pruefePerson(zweck, r, sitzung);
  } catch (err) {
    await abmelden({ frappeSid: r.frappeSid, modus, fetchImpl }).catch(() => {});
    throw err;
  }
  return anlegen({ zweck, person: r, art: "passwort", ttl, sitzung, frappeSid: r.frappeSid || null });
}

/**
 * Löst die Kurzsitzung genau einmal ein (atomar). Wer einlöst, ist für das Abmelden einer Frappe-sid
 * zuständig – mitKurzsitzung() erledigt das.
 * @returns {Promise<object>} Person (user, name, kurzname, roles, standort, frappeSid, art, zweck, ausgestellt)
 */
export async function kurzsitzungEinloesen(token, { zweck, sitzung } = {}) {
  const h = tokenHash(token);
  if (!h) throw new BackofficeError("auth", AUTH_TEXTE.abgelaufen);
  const e = await sessionStore().wertNehmen(speicherSchluessel(h));
  if (!e || e.ablauf < Date.now()) {
    if (e?.frappeSid) await abmelden({ frappeSid: e.frappeSid }).catch(() => {});
    throw new BackofficeError("auth", AUTH_TEXTE.abgelaufen);
  }
  const fehler = e.zweck !== zweck ? AUTH_TEXTE.falscherZweck : e.fuerSid && e.fuerSid !== (sitzung?.sid || null) ? AUTH_TEXTE.fremdeSitzung : null;
  if (fehler) {
    if (e.frappeSid) await abmelden({ frappeSid: e.frappeSid }).catch(() => {});
    throw new BackofficeError("forbidden", fehler);
  }
  return e;
}

/** Kurzsitzung verwerfen (Dialog abgebrochen). Meldet eine Frappe-sid ab. */
export async function kurzsitzungVerwerfen(token) {
  const h = tokenHash(token);
  if (!h) return;
  const e = await sessionStore().wertNehmen(speicherSchluessel(h));
  if (e?.frappeSid) await abmelden({ frappeSid: e.frappeSid }).catch(() => {});
}

/**
 * Sitzungsartiges Objekt der freigebenden Person für Adapter (backoffice({session})).
 * Ohne frappeSid (PIN-Weg) laufen Frappe-Aufrufe NICHT in ihrer Sitzung – deshalb verlangt freigabeArt()
 * für `eigeneSitzung`-Zwecke im Frappe-Modus das Passwort.
 */
export function personAlsSitzung(person) {
  return {
    user: person.user,
    name: person.name,
    roles: person.roles || [],
    sid: null,
    frappeSid: person.frappeSid || null,
    standort: person.standort || "",
    arbeitsplatz: null,
    kurzsitzung: { zweck: person.zweck, art: person.art },
  };
}

/** Protokoll-Angaben einer Freigabe (ohne Geheimnisse). */
export function freigabeProtokoll(person) {
  return { zweck: person.zweck, user: person.user, name: person.name, art: person.art, zeit: new Date(person.ausgestellt || Date.now()).toISOString(), text: AUTH_TEXTE.freigegebenVon(person.kurzname || person.name) };
}

/**
 * Kurzsitzung einlösen, Aktion ausführen, danach beenden (Frappe-sid abmelden – auch bei Fehler).
 * @template T
 * @param {string} token
 * @param {{zweck:string, sitzung?:object, modus?:string}} opts
 * @param {(person:object)=>Promise<T>} aktion
 * @returns {Promise<{ergebnis:T, freigabe:ReturnType<typeof freigabeProtokoll>}>}
 */
export async function mitKurzsitzung(token, { zweck, sitzung, modus = backofficeMode() } = {}, aktion) {
  const person = await kurzsitzungEinloesen(token, { zweck, sitzung });
  try {
    const ergebnis = await aktion(person);
    return { ergebnis, freigabe: freigabeProtokoll(person) };
  } finally {
    if (person.frappeSid) await abmelden({ frappeSid: person.frappeSid, modus }).catch(() => {});
  }
}

/**
 * Ein Schritt: PIN bzw. Passwort prüfen und die Aktion sofort mit der Kurzsitzung ausführen.
 * Wählt den Prüfweg über freigabeArt(); Felder: pin ODER passwort.
 * @returns {Promise<{ok:true, ergebnis:any, freigabe:object}>}
 */
export async function freigeben({ zweck, benutzer, pin, passwort, geraetToken, sitzung, ttl, modus = backofficeMode(), ctx, fetchImpl, env, production } = {}, aktion) {
  const art = freigabeArt(zweck, { modus });
  const k = art === "pin" ? await sitzungMitPin({ benutzer, pin, geraetToken, zweck, ttl, sitzung, modus, ctx }) : await sitzungMitPasswort({ benutzer, passwort, zweck, ttl, sitzung, modus, fetchImpl, env, production });
  const r = await mitKurzsitzung(k.token, { zweck, sitzung, modus }, aktion);
  return { ok: true, ...r };
}
