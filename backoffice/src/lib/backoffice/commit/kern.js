// Verzögerter Commit – Server-Kern (G-03, Q-C3/Q-C4, RI-03; Team P0-3). Reines Modul, ohne Next-Importe.
//
// Ablauf:
//   1. Bereichs-Action prüft Recht + Eingaben und ruft planeCommit(session, {action, args, schluessel, objekt}).
//      Die Absicht liegt mit Token und Frist im Sitzungs-Store (Werte-Methoden, Namensraum „c:“).
//   2. Der Client zeigt den Undo-Toast (8 s, Kiosk 6 s). Danach: commitAction({token}) → genau einmal ausgeführt.
//      Rückgängig: verwerfeCommit({token}). Seite verlassen: sendBeacon → POST /api/undo-commit.
//   3. Nachlauf: weder bestätigt noch verworfen → 30 s nach der Frist führt der Server selbst aus und
//      vermerkt es im Protokoll – nie still verworfen.
//
// „Genau einmal“: Ausführen und Verwerfen nehmen dieselbe Sperre c:l:<token> über wertSetzenWennFrei
// (Redis: SET NX). Wer zuerst kommt, gewinnt; alle weiteren Aufrufe bekommen das gespeicherte Ergebnis.
//
// Schlüssel (Präfix setzt der Store; Schnittstelle siehe auth/store.js):
//   c:t:<token>   Absicht + Zustand + Ergebnis (24 h)
//   c:l:<token>   Sperre „ausführen“ | „verwerfen“ (24 h)
//   c:o:<token>   offen – Index für den Nachlauf (bis zur Sperre)
//   c:s:<hash>    Benutzer + schluessel → Token (Doppelklick plant nicht zweimal)
//   c:m:<u>:<id>  Meldung für die Glocke (fehlgeschlagen; 7 Tage)
//   c:p:<zeit>    Protokoll ohne Werte (7 Tage)

import { createHash, randomBytes } from "node:crypto";
import { COMMIT_TEXTE, grundAus } from "./texte.js";
import { COMMIT_MS, COMMIT_MS_MAX, COMMIT_MS_MIN, NACHLAUF_MS, TOKENS_MAX, istToken, normObjekt } from "./konstanten.js";

export { COMMIT_MS, COMMIT_MS_KIOSK, COMMIT_MS_MAX, COMMIT_MS_MIN, NACHLAUF_MS, PAUSE_MAX_MS, TOKENS_MAX, TOKEN_MUSTER, istToken, normObjekt, objektSchluessel } from "./konstanten.js";
export const ARGS_MAX_ZEICHEN = 16_000;
export const ZUSTAENDE = ["geplant", "laeuft", "ausgefuehrt", "verworfen", "fehlgeschlagen"];

const TAG_S = 24 * 60 * 60;
const WOCHE_S = 7 * TAG_S;
const FEHLER_CODES = new Set(["invalid", "forbidden", "not_found", "conflict", "rate_limited", "unavailable", "auth"]);
const AKTION_MUSTER = /^[a-z][a-z0-9-]*\.[a-z0-9.-]{1,80}$/;

const k = {
  eintrag: (t) => `c:t:${t}`,
  sperre: (t) => `c:l:${t}`,
  offen: (t) => `c:o:${t}`,
  schluessel: (h) => `c:s:${h}`,
  meldung: (u, id) => `c:m:${u}:${id}`,
  protokoll: (id) => `c:p:${id}`,
};

const hash = (text, n = 32) => createHash("sha256").update(String(text)).digest("hex").slice(0, n);
export const neuesToken = () => `c_${randomBytes(24).toString("base64url")}`;

function klemmeMs(ms) {
  const n = Math.round(Number(ms));
  if (!Number.isFinite(n) || n <= 0) return COMMIT_MS;
  return Math.min(COMMIT_MS_MAX, Math.max(COMMIT_MS_MIN, n));
}

/** JSON-fähige Kopie oder TypeError (Args müssen in Redis passen). */
function jsonKopie(wert, wo) {
  let text;
  try {
    text = JSON.stringify(wert ?? null);
  } catch {
    throw new TypeError(`${wo} ist nicht JSON-fähig.`);
  }
  if (text.length > ARGS_MAX_ZEICHEN) throw new TypeError(`${wo} ist zu groß (${text.length} Zeichen).`);
  return JSON.parse(text);
}

/** Ergebnis einer Aktion speicherbar machen (nicht JSON-fähiges wird null, große Ergebnisse gekürzt). */
function ergebnisKopie(wert) {
  try {
    const text = JSON.stringify(wert ?? null);
    return text.length > ARGS_MAX_ZEICHEN ? { gekuerzt: true } : JSON.parse(text);
  } catch {
    return null;
  }
}

function fehlerAus(err) {
  const code = err && FEHLER_CODES.has(err.code) ? err.code : "unavailable";
  const message = err && FEHLER_CODES.has(err.code) && err.message ? String(err.message) : COMMIT_TEXTE.unerwartet;
  return { code, message };
}

/**
 * Anfrage an POST /api/undo-commit prüfen (Body als Text – sendBeacon schickt text/plain).
 * @returns {{ok:true, art:"commit"|"verwerfen"|"status"|"demo-plane", tokens:string[], daten?:object}|{ok:false, code:string, message:string}}
 */
export function pruefeAnfrage(text) {
  if (typeof text !== "string" || !text || text.length > 8192) return { ok: false, code: "invalid", message: COMMIT_TEXTE.ungueltig };
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, code: "invalid", message: COMMIT_TEXTE.ungueltig };
  }
  if (!body || typeof body !== "object") return { ok: false, code: "invalid", message: COMMIT_TEXTE.ungueltig };
  const art = body.art === undefined ? "commit" : body.art;
  if (art === "demo-plane") return { ok: true, art, tokens: [], daten: body.daten && typeof body.daten === "object" ? body.daten : {} };
  if (art !== "commit" && art !== "verwerfen" && art !== "status") return { ok: false, code: "invalid", message: COMMIT_TEXTE.ungueltig };
  const roh = Array.isArray(body.tokens) ? body.tokens : body.token ? [body.token] : [];
  const tokens = [...new Set(roh)];
  if (!tokens.length || tokens.length > TOKENS_MAX || !tokens.every(istToken)) return { ok: false, code: "invalid", message: COMMIT_TEXTE.ungueltig };
  return { ok: true, art, tokens };
}

/**
 * Commit-Dienst über einem Store mit den Werte-Methoden aus auth/store.js.
 *
 * @param {object} o
 * @param {object} o.store             SessionStore (wertSetzen, wertSetzenWennFrei, wertLesen, wertLoeschen, schluesselListe)
 * @param {(name:string)=>Function|undefined} o.aktion  Aktion nach Name: async (ctx) => ergebnis | {ok:false, code, message}
 * @param {(ctx:object)=>object} [o.kontext]           baut den Aktions-Kontext ({session, args, objekt, quelle, eintrag} → + client …)
 * @param {(eintrag:object)=>Promise<object|null>} [o.sitzungFuer] Sitzung für den Nachlauf (null = beendet)
 * @param {(eintrag:object, art:string)=>Promise<void>|void} [o.vermerke] Protokolleintrag am Datensatz (Nachlauf/Beacon)
 * @param {(ms:number)=>void} [o.wecker]  Nachlauf in ms anstoßen (setTimeout im Prozess)
 * @param {()=>number} [o.jetzt]
 * @param {(ms:number)=>Promise<void>} [o.warte]
 */
export function erzeugeCommitDienst({ store, aktion, kontext = (c) => c, sitzungFuer = async () => null, vermerke = () => {}, wecker = () => {}, jetzt = () => Date.now(), warte = (ms) => new Promise((r) => setTimeout(r, ms)) }) {
  if (!store || typeof store.wertSetzenWennFrei !== "function") throw new TypeError("Commit-Dienst braucht einen Store mit Werte-Methoden.");
  let nachlaufLaeuft = null;

  async function protokolliere(eintrag, art, extra = {}) {
    const zeit = jetzt();
    const id = `${String(zeit).padStart(14, "0")}-${randomBytes(4).toString("hex")}`;
    const p = { zeit, art, user: eintrag.user, action: eintrag.action, objekt: eintrag.objekt, token: eintrag.token.slice(0, 10), quelle: extra.quelle || null, code: extra.code || null };
    try {
      await store.wertSetzen(k.protokoll(id), p, { ttlSekunden: WOCHE_S });
    } catch {
      // Protokoll ist Begleitung, nie Blocker.
    }
  }

  async function melde(eintrag, fehler) {
    const titel = eintrag.titel || eintrag.objekt?.titel || eintrag.objekt?.name || "";
    const text = titel ? COMMIT_TEXTE.fehlgeschlagen(titel, grundAus(fehler)) : COMMIT_TEXTE.fehlgeschlagenOhneTitel(grundAus(fehler));
    const id = `${jetzt()}-${randomBytes(3).toString("hex")}`;
    const m = { id, zeit: jetzt(), text, objekt: eintrag.objekt, action: eintrag.action, code: fehler.code };
    try {
      await store.wertSetzen(k.meldung(hash(eintrag.user, 16), id), m, { ttlSekunden: WOCHE_S });
    } catch {
      // Meldung ist Begleitung; der Fehler steht ohnehin im Eintrag und im Toast.
    }
  }

  const lies = (token) => store.wertLesen(k.eintrag(token));
  const schreibe = (e) => store.wertSetzen(k.eintrag(e.token), e, { ttlSekunden: TAG_S });

  /** Ergebnis eines schon gesperrten Tokens; wartet kurz, solange es läuft. */
  async function ergebnisVon(token, { wartenMs = 10_000 } = {}) {
    // Zählt Versuche statt Uhrzeit (100 ms je Versuch) – hängt nie an einer stehenden Uhr.
    for (let versuch = 0; ; versuch++) {
      const e = await lies(token);
      if (!e) return { ok: false, code: "not_found", status: "unbekannt", message: COMMIT_TEXTE.unbekannt };
      if (e.zustand === "ausgefuehrt") return { ok: true, status: "ausgefuehrt", ergebnis: e.ergebnis ?? null, bereits: true };
      if (e.zustand === "verworfen") return { ok: false, code: "conflict", status: "verworfen", message: COMMIT_TEXTE.schonVerworfen };
      if (e.zustand === "fehlgeschlagen") return { ok: false, code: e.fehler?.code || "unavailable", status: "fehlgeschlagen", message: e.fehler?.message || COMMIT_TEXTE.unerwartet, bereits: true };
      if (versuch * 100 >= wartenMs) return { ok: true, status: e.zustand, laeuft: true };
      await warte(100);
    }
  }

  /**
   * Absicht vormerken. Programmierfehler (unbekannte Aktion, Args nicht JSON-fähig) werfen TypeError.
   * @param {object} session  Sitzung aus requireSession() (user, name, roles, sid, standort)
   * @param {{action:string, args?:object, schluessel?:string, objekt?:object|string, titel?:string, ms?:number}} opts
   * @returns {Promise<{ok:true, token:string, frist:number, ms:number, objekt:object|null, wiederverwendet?:boolean}>}
   */
  async function plane(session, { action, args = {}, schluessel, objekt, titel, ms } = {}) {
    if (!session?.user) throw new TypeError("planeCommit braucht eine Sitzung.");
    if (typeof action !== "string" || !AKTION_MUSTER.test(action)) throw new TypeError(`Ungültiger Aktionsname: ${String(action).slice(0, 60)}`);
    if (typeof aktion(action) !== "function") throw new TypeError(`Commit-Aktion „${action}“ ist nicht registriert (lib/backoffice/commit/aktionen/).`);
    const argsKopie = jsonKopie(args, "args");
    const dauer = klemmeMs(ms);
    const obj = normObjekt(objekt);
    const t0 = jetzt();
    let sKey = null;
    if (schluessel !== undefined && schluessel !== null && schluessel !== "") {
      sKey = k.schluessel(hash(`${session.user}\n${action}\n${schluessel}`));
      const alt = await store.wertLesen(sKey);
      if (istToken(alt)) {
        const e = await lies(alt);
        if (e && e.zustand === "geplant" && !(await store.wertLesen(k.sperre(alt)))) return { ok: true, token: alt, frist: e.frist, ms: e.ms, objekt: e.objekt, wiederverwendet: true };
      }
    }
    const token = neuesToken();
    const frist = t0 + dauer;
    const eintrag = {
      token,
      action,
      args: argsKopie,
      objekt: obj,
      titel: titel ? String(titel).slice(0, 160) : null,
      user: session.user,
      name: session.name || "",
      roles: Array.isArray(session.roles) ? session.roles : [],
      standort: session.standort || "",
      sid: session.sid || null,
      ms: dauer,
      erstellt: t0,
      frist,
      nachlaufAb: frist + NACHLAUF_MS,
      zustand: "geplant",
    };
    await schreibe(eintrag);
    await store.wertSetzen(k.offen(token), { nachlaufAb: eintrag.nachlaufAb }, { ttlSekunden: TAG_S });
    if (sKey) await store.wertSetzen(sKey, token, { ttlSekunden: Math.ceil((dauer + NACHLAUF_MS) / 1000) + 5 });
    wecker(dauer + NACHLAUF_MS + 250);
    return { ok: true, token, frist, ms: dauer, objekt: obj };
  }

  /**
   * Genau einmal ausführen. `session` = Sitzung der Anfrage (Besitz wird geprüft) oder null (Nachlauf).
   * @param {string} token
   * @param {{session?:object|null, quelle?:"client"|"beacon"|"nachlauf"}} [o]
   */
  async function fuehreAus(token, { session = null, quelle = "client" } = {}) {
    if (!istToken(token)) return { ok: false, code: "invalid", status: "unbekannt", message: COMMIT_TEXTE.ungueltig };
    const e = await lies(token);
    if (!e) return { ok: false, code: "not_found", status: "unbekannt", message: COMMIT_TEXTE.unbekannt };
    if (session && session.user !== e.user) return { ok: false, code: "forbidden", status: e.zustand, message: COMMIT_TEXTE.fremd };
    const frei = await store.wertSetzenWennFrei(k.sperre(token), { art: "ausfuehren", zeit: jetzt(), quelle }, { ttlSekunden: TAG_S });
    if (!frei) return ergebnisVon(token);
    e.zustand = "laeuft";
    e.quelle = quelle;
    await schreibe(e);
    await store.wertLoeschen(k.offen(token));

    let ausgang;
    const sitzung = session || (await sitzungFuer(e));
    if (!sitzung) {
      ausgang = { ok: false, code: "auth", message: COMMIT_TEXTE.sitzungBeendet };
    } else {
      try {
        const fn = aktion(e.action);
        if (typeof fn !== "function") throw Object.assign(new Error("unbekannt"), { code: "unavailable" });
        const r = await fn(kontext({ session: sitzung, args: e.args, objekt: e.objekt, quelle, eintrag: { token, action: e.action, frist: e.frist } }));
        ausgang = r && typeof r === "object" && r.ok === false ? { ok: false, code: FEHLER_CODES.has(r.code) ? r.code : "unavailable", message: r.message ? String(r.message) : COMMIT_TEXTE.unerwartet } : { ok: true, ergebnis: ergebnisKopie(r) };
      } catch (err) {
        ausgang = { ok: false, ...fehlerAus(err) };
      }
    }

    if (ausgang.ok) {
      e.zustand = "ausgefuehrt";
      e.ergebnis = ausgang.ergebnis;
      e.erledigt = jetzt();
      await schreibe(e);
      await protokolliere(e, quelle === "nachlauf" ? "nachlauf" : "ausgefuehrt", { quelle });
      if (quelle !== "client") {
        try {
          await vermerke(e, quelle);
        } catch {
          // Vermerk am Datensatz ist Begleitung.
        }
      }
      return { ok: true, status: "ausgefuehrt", ergebnis: e.ergebnis };
    }
    e.zustand = "fehlgeschlagen";
    e.fehler = { code: ausgang.code, message: ausgang.message };
    e.erledigt = jetzt();
    await schreibe(e);
    await protokolliere(e, "fehlgeschlagen", { quelle, code: ausgang.code });
    await melde(e, ausgang);
    return { ok: false, code: ausgang.code, status: "fehlgeschlagen", message: ausgang.message };
  }

  /** Verwerfen (Rückgängig). Schon ausgeführt → conflict; schon verworfen → ok + bereits. */
  async function verwerfe(token, { session = null } = {}) {
    if (!istToken(token)) return { ok: false, code: "invalid", status: "unbekannt", message: COMMIT_TEXTE.ungueltig };
    const e = await lies(token);
    if (!e) return { ok: false, code: "not_found", status: "unbekannt", message: COMMIT_TEXTE.unbekannt };
    if (session && session.user !== e.user) return { ok: false, code: "forbidden", status: e.zustand, message: COMMIT_TEXTE.fremd };
    const frei = await store.wertSetzenWennFrei(k.sperre(token), { art: "verwerfen", zeit: jetzt() }, { ttlSekunden: TAG_S });
    if (!frei) {
      const r = await ergebnisVon(token, { wartenMs: 0 });
      if (r.status === "verworfen") return { ok: true, status: "verworfen", bereits: true };
      return { ok: false, code: "conflict", status: r.status, message: COMMIT_TEXTE.schonAusgefuehrt };
    }
    e.zustand = "verworfen";
    e.erledigt = jetzt();
    await schreibe(e);
    await store.wertLoeschen(k.offen(token));
    await protokolliere(e, "verworfen");
    return { ok: true, status: "verworfen" };
  }

  /** Nachlauf: fällige offene Tokens selbst ausführen. Läuft nie doppelt im selben Prozess. */
  async function nachlauf({ max = 50 } = {}) {
    if (nachlaufLaeuft) return nachlaufLaeuft;
    nachlaufLaeuft = (async () => {
      const aus = [];
      const schluessel = await store.schluesselListe("c:o:", { max: 500 });
      const t = jetzt();
      for (const key of schluessel) {
        if (aus.length >= max) break;
        const token = key.slice(4);
        const o = await store.wertLesen(key);
        if (!o || !istToken(token)) {
          await store.wertLoeschen(key);
          continue;
        }
        if (t < o.nachlaufAb) continue;
        const r = await fuehreAus(token, { session: null, quelle: "nachlauf" });
        aus.push({ token, ...r });
      }
      return aus;
    })();
    try {
      return await nachlaufLaeuft;
    } finally {
      nachlaufLaeuft = null;
    }
  }

  /** Zustand eines Tokens (nur für den Besitzer; Tests, Demo). */
  async function status(token, { session = null } = {}) {
    if (!istToken(token)) return null;
    const e = await lies(token);
    if (!e || (session && session.user !== e.user)) return null;
    return { token, zustand: e.zustand, action: e.action, objekt: e.objekt, frist: e.frist, quelle: e.quelle || null, fehler: e.fehler || null };
  }

  /** Offene Fehlermeldungen des Benutzers (für die Glocke, P0-7), neueste zuerst. */
  async function meldungen(session) {
    if (!session?.user) return [];
    const praefix = `c:m:${hash(session.user, 16)}:`;
    const liste = [];
    for (const key of await store.schluesselListe(praefix, { max: 200 })) {
      const m = await store.wertLesen(key);
      if (m) liste.push(m);
    }
    return liste.sort((a, b) => b.zeit - a.zeit);
  }

  async function quittiereMeldung(session, id) {
    if (!session?.user || typeof id !== "string" || !/^[\w-]{1,40}$/.test(id)) return false;
    await store.wertLoeschen(k.meldung(hash(session.user, 16), id));
    return true;
  }

  /** Protokoll (ohne Werte), neueste zuerst. Admin-Sicht – Aufrufer prüft das Recht. */
  async function protokoll({ max = 200, user } = {}) {
    const liste = [];
    for (const key of await store.schluesselListe("c:p:", { max: 2000 })) {
      const p = await store.wertLesen(key);
      if (p && (!user || p.user === user)) liste.push(p);
    }
    return liste.sort((a, b) => b.zeit - a.zeit).slice(0, max);
  }

  return { plane, fuehreAus, verwerfe, nachlauf, status, meldungen, quittiereMeldung, protokoll };
}
