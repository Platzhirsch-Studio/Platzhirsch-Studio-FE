// Mock der ph_core-Backoffice-Schnittstellen – gleiche Funktionen, Signaturen, Antwortschlüssel
// und Fehler wie frappe/core.js (Vorbild: Backend-Import/ph_core/ph_core/api/{geraete,bediener,
// suche,aktivitaet}.py und utils/geraete.py):
//   * Geräte im Mock-Speicher (globalThis), Token 32 Byte base64url, gespeichert nur SHA-256.
//   * PIN-Hash PBKDF2-HMAC-SHA256 „pbkdf2_sha256$<iter>$<salz_hex>$<hash_hex>“ (200 000 Iterationen,
//     16 Byte Salz) – Demo-PINs aus auth/mockUsers.js werden beim ersten Gebrauch gehasht.
//   * Fehlversuchssperre: 5 falsche PINs je Benutzer+Gerät → 15 min rate_limited {sekunden}.
//   * Suche/Aktivität über die Mock-Datenbank (mock/client.js) mit Rechten aus auth/rechte.js.
// Reines Modul (node:crypto, keine "@/"-Importe).

import { createHash, pbkdf2 as pbkdf2Cb, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { phCoreFehler } from "../frappe/client.js";
import { metaIndex } from "../frappe/meta.js";
import { doctypeSlug, isoDatumZeit } from "../format.js";
import { darfDoc } from "../auth/rechte.js";
import { DEMO_BENUTZER } from "../auth/mockUsers.js";
import { mockDatenbank } from "./client.js";
import { protokollVon } from "./protokoll.js";

const pbkdf2 = promisify(pbkdf2Cb);
const G = globalThis;

// ------------------------------------------------------- Konstanten (ph_core) --

export const TOKEN_BYTES = 32;
export const PIN_ITERATIONEN = 200_000;
export const PIN_SALZ_BYTES = 16;
export const PIN_PRAEFIX = "pbkdf2_sha256";
export const FEHLVERSUCHE_MAX = 5;
export const SPERRE_SEKUNDEN = 15 * 60;
export const BERUEHREN_ABSTAND_SEKUNDEN = 60;
export const ARBEITSPLATZ_JE_TYP = { Kassa: "kassa", Packtisch: "packtisch", Mobil: "montage", Backoffice: "backoffice" };
export const ARBEITSPLAETZE = ["kassa", "packtisch", "montage", "technik", "backoffice"];
export const GERAETE_TYPEN = Object.keys(ARBEITSPLATZ_JE_TYP);
export const DRUCKER_TYPEN = ["Bon 80 mm", "A4", "Etikett"];
const ROLLEN_ADMIN = ["System Manager", "PH Backoffice-Admin"];
const BEDIENER_ROLLEN_PRAEFIX = ["PH Kassa ", "PH Logistik "];
const BEDIENER_ROLLEN = ["PH Montage", "PH Techniker"];
const ROLLEN_AUSBLENDEN = new Set(["All", "Guest", "Desk User", "Administrator"]);

/** Bereich → DocTypes wie ph_core/api/suche.py BEREICHE (personal bewusst nicht). */
export const BEREICHE = {
  zentrale: ["PH Aufgabe", "PH Geraet"],
  crm: ["PH Anfrage", "PH Kontakt", "PH Termin", "PH Beratungsgespraech"],
  sortiment: ["PH Produkt", "PH Marke", "PH Herstellerbestellung", "PH Wareneingang"],
  projekte: ["PH Projekt", "PH Montageauftrag", "PH Planung", "PH Rendering", "PH Produktpass"],
  shop: ["PH Bestellung", "PH Zahlung", "PH Gutschein", "PH Retoure", "PH Widerruf"],
  faktura: ["PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung", "PH Gutschrift", "PH Mahnung", "PH Eingangsrechnung"],
  logistik: ["PH Lieferschein", "PH Sendung", "PH Tour", "PH Lagerbestand"],
  service: ["PH Servicefall", "PH Serviceeinsatz", "PH Serviceauftrag", "PH Pflege Abo"],
  marketing: ["PH Kampagne", "PH Newsletter Ausgabe", "PH Social Beitrag"],
  kassa: ["PH Kassenbeleg", "PH Kassenabschluss", "PH Kasse"],
  kundenkarte: ["PH Kundenkarte", "PH Kundenkarte Antrag"],
};
export const SUCH_DOCTYPES = Object.values(BEREICHE).flat();
const SUCH_FELDTYPEN = new Set(["Data", "Link", "Select", "Small Text", "Text", "Long Text", "Dynamic Link", "Read Only", "Phone"]);
const JE_DOCTYPE = 5;

// ------------------------------------------------------------------ Speicher --

function speicher() {
  if (!G.__phBoMockCore) G.__phBoMockCore = { geraete: new Map(), nr: 0, pins: new Map(), fehl: new Map() };
  return G.__phBoMockCore;
}

/** Nur für Tests: Geräte, PINs und Sperren verwerfen. */
export function mockCoreReset() {
  G.__phBoMockCore = undefined;
}

function jetztMs(ctx) {
  const t = ctx?.jetzt ? ctx.jetzt() : Date.now();
  return t instanceof Date ? t.getTime() : Number(t);
}

/** Frappe-Zeit als ISO 8601 ohne Zone ("2026-11-04T10:00:00"), wie datetime.isoformat(). */
function iso(wert) {
  if (wert === null || wert === undefined || wert === "") return null;
  if (typeof wert === "number" || wert instanceof Date) return isoDatumZeit(new Date(wert)).replace(" ", "T");
  return String(wert).replace(" ", "T");
}

function text(wert, laenge) {
  return String(wert ?? "").trim().slice(0, laenge);
}

function pflicht(daten, ...felder) {
  for (const f of felder) if (!String(daten[f] ?? "").trim()) throw phCoreFehler("invalid", `Pflichtfeld fehlt: ${f}`, { field: f }, 400);
}

function sessionAus(ctx = {}) {
  return ctx.session || ctx.client?.session || null;
}

/** ph_api(intern=True): Guest → 403. */
function angemeldet(ctx) {
  const s = sessionAus(ctx);
  if (!s || !s.user || s.user === "Guest" || s.user === "Gast") throw phCoreFehler("forbidden", "Anmeldung erforderlich.", {}, 403);
  return s;
}

function hatRolle(session, rollen, { leitung = false } = {}) {
  if (session?.user === "Administrator") return true;
  const eigene = new Set(session?.roles || []);
  if (rollen.some((r) => eigene.has(r))) return true;
  return leitung && [...eigene].some((r) => r.startsWith("PH ") && r.endsWith(" Leitung"));
}

// --------------------------------------------------------- Token und PIN-Hash --

/** Wie utils/geraete.py normalisiere_token: trimmen, „Bearer “/Anführungszeichen weg; '' bei falscher Form. */
export function normalisiereToken(wert) {
  let s = String(wert ?? "").trim().replace(/^["']+|["']+$/g, "");
  if (s.toLowerCase().startsWith("bearer ")) s = s.slice(7).trim();
  if (s.length < 20 || s.length > 128 || !/^[A-Za-z0-9_-]+$/.test(s)) return "";
  return s;
}

/** SHA-256 (hex) des normalisierten Tokens; '' bei ungültigem Token. */
export function tokenHash(token) {
  const t = normalisiereToken(token);
  return t ? createHash("sha256").update(t).digest("hex") : "";
}

export function neuesToken() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** Formatprüfung wie pin_pruefen: Fehlertext oder null. */
export function pinPruefen(pin) {
  const s = String(pin ?? "").trim();
  if (!/^\d{4,6}$/.test(s)) return "PIN muss aus 4 bis 6 Ziffern bestehen.";
  if (new Set(s).size === 1) return "PIN darf nicht aus lauter gleichen Ziffern bestehen.";
  const schritte = new Set([...s].slice(1).map((c, i) => Number(c) - Number(s[i])));
  if (schritte.size === 1 && (schritte.has(1) || schritte.has(-1))) return "PIN darf keine einfache Zahlenfolge sein.";
  return null;
}

/** PBKDF2-HMAC-SHA256 → 'pbkdf2_sha256$<iter>$<salz_hex>$<hash_hex>' (identisch zu utils/geraete.py pin_hash). */
export async function pinHash(pin, salz, iterationen = PIN_ITERATIONEN) {
  const s = String(pin ?? "").trim();
  if (!/^\d{4,6}$/.test(s)) throw new Error("PIN muss aus 4 bis 6 Ziffern bestehen.");
  const salzBuf = salz === undefined || salz === null ? randomBytes(PIN_SALZ_BYTES) : typeof salz === "string" ? Buffer.from(salz, "hex") : Buffer.from(salz);
  const dk = await pbkdf2(s, salzBuf, Number(iterationen), 32, "sha256");
  return `${PIN_PRAEFIX}$${Number(iterationen)}$${salzBuf.toString("hex")}$${dk.toString("hex")}`;
}

/** Konstantzeit-Prüfung wie pin_passt. */
export async function pinPasst(pin, gespeichert) {
  const s = String(pin ?? "").trim();
  if (!/^\d{4,6}$/.test(s) || !gespeichert) return false;
  const teile = String(gespeichert).split("$");
  if (teile.length !== 4 || teile[0] !== PIN_PRAEFIX) return false;
  const iterationen = Number(teile[1]);
  if (!Number.isInteger(iterationen) || iterationen < 1000 || iterationen > 5_000_000) return false;
  if (!/^([0-9a-f]{2})+$/i.test(teile[2]) || !/^([0-9a-f]{2})+$/i.test(teile[3])) return false;
  const salz = Buffer.from(teile[2], "hex");
  const erwartet = Buffer.from(teile[3], "hex");
  const dk = await pbkdf2(s, salz, iterationen, erwartet.length, "sha256");
  return dk.length === erwartet.length && timingSafeEqual(dk, erwartet);
}

export function arbeitsplatzFuerTyp(typ, arbeitsplatz) {
  const a = String(arbeitsplatz ?? "").trim().toLowerCase();
  if (ARBEITSPLAETZE.includes(a)) return a;
  return ARBEITSPLATZ_JE_TYP[String(typ ?? "").trim()] || "backoffice";
}

// ------------------------------------------------------------------- Geräte --

function oeffentlich(g) {
  return {
    geraet: g.name,
    geraetename: g.geraetename,
    typ: g.typ,
    arbeitsplatz: g.arbeitsplatz,
    standort: g.standort ?? null,
    kasse: g.kasse ?? null,
    drucker: g.drucker ?? null,
    drucker_typ: g.drucker_typ ?? null,
    aktiv: g.aktiv ? 1 : 0,
    gesperrt_grund: g.gesperrt_grund ?? null,
    zuletzt_gesehen: iso(g.zuletzt_gesehen),
  };
}

function geraetPerToken(token) {
  const h = tokenHash(token);
  if (!h) return null;
  for (const g of speicher().geraete.values()) if (g.token_hash === h) return g;
  return null;
}

function geraetAktiv(token) {
  pflicht({ token }, "token");
  const g = geraetPerToken(token);
  if (!g) throw phCoreFehler("invalid_token", "Gerät unbekannt oder Token ungültig.", {}, 404);
  if (!g.aktiv) throw phCoreFehler("forbidden", "Gerät ist gesperrt.", { gesperrt: true, geraet: g.name }, 403);
  return g;
}

function beruehren(g, ctx) {
  const jetzt = jetztMs(ctx);
  if (g.zuletzt_gesehen && g.zuletzt_gesehen > jetzt - BERUEHREN_ABSTAND_SEKUNDEN * 1000) return g.zuletzt_gesehen;
  g.zuletzt_gesehen = jetzt;
  return jetzt;
}

/** @returns {Promise<import("../frappe/core.js").PhGeraetNeu>} */
export async function registerDevice(args = {}, ctx = {}) {
  const session = angemeldet(ctx);
  if (!hatRolle(session, ROLLEN_ADMIN, { leitung: true })) throw phCoreFehler("forbidden", "Keine Berechtigung.", {}, 403);
  pflicht(args, "geraetename", "typ");
  const typ = text(args.typ, 20);
  if (!GERAETE_TYPEN.includes(typ)) throw phCoreFehler("invalid", `Unbekannter Gerätetyp: ${typ}`, { field: "typ" }, 400);
  const druckerTyp = text(args.drucker_typ, 20) || null;
  if (druckerTyp && !DRUCKER_TYPEN.includes(druckerTyp)) throw phCoreFehler("invalid", `Unbekannter Druckertyp: ${druckerTyp}`, { field: "drucker_typ" }, 400);
  const sp = speicher();
  sp.nr += 1;
  const token = neuesToken();
  const g = {
    name: `PH-GER-${String(sp.nr).padStart(4, "0")}`,
    geraetename: text(args.geraetename, 140),
    typ,
    arbeitsplatz: arbeitsplatzFuerTyp(typ, args.arbeitsplatz),
    standort: text(args.standort, 140) || null,
    kasse: text(args.kasse, 140) || null,
    drucker: text(args.drucker, 140) || null,
    drucker_typ: druckerTyp,
    notizen: text(args.notizen, 1000) || null,
    aktiv: 1,
    gesperrt_grund: null,
    registriert_am: jetztMs(ctx),
    registriert_durch: session.user,
    token_hash: tokenHash(token),
    zuletzt_gesehen: null,
  };
  sp.geraete.set(g.name, g);
  return { ...oeffentlich(g), token };
}

/** @returns {Promise<import("../frappe/core.js").PhGeraet>} */
export async function verifyDevice({ token } = {}, ctx = {}) {
  const g = geraetAktiv(token);
  beruehren(g, ctx);
  return oeffentlich(g);
}

export async function touchDevice({ token } = {}, ctx = {}) {
  const g = geraetAktiv(token);
  const zeit = beruehren(g, ctx);
  return { ok: true, geraet: g.name, zuletzt_gesehen: iso(zeit) };
}

export async function listDevices({ nurAktive, standort, arbeitsplatz } = {}, ctx = {}) {
  const session = angemeldet(ctx);
  const meta = (ctx.client?.index || metaIndex()).doctypes.get("PH Geraet");
  if (meta ? !darfDoc(session, meta, "read") : !hatRolle(session, ROLLEN_ADMIN)) throw phCoreFehler("forbidden", "Keine Berechtigung.", {}, 403);
  const plaetze = arbeitsplatz ? (Array.isArray(arbeitsplatz) ? arbeitsplatz : String(arbeitsplatz).split(",")).map((x) => x.trim()).filter(Boolean) : null;
  return [...speicher().geraete.values()]
    .filter((g) => (!nurAktive || g.aktiv) && (!standort || g.standort === text(standort, 140)) && (!plaetze || plaetze.includes(g.arbeitsplatz)))
    .sort((a, b) => String(a.standort ?? "").localeCompare(String(b.standort ?? "")) || String(a.geraetename).localeCompare(String(b.geraetename)))
    .map((g) => ({ ...oeffentlich(g), token_vorhanden: g.token_hash ? 1 : 0, registriert_am: iso(g.registriert_am) }));
}

/** Nur Mock/Tests: Gerät sperren/entsperren (entspricht PH Geraet.sperren()/entsperren()). */
export function mockGeraetSperren(geraet, grund = "gesperrt", sperren = true) {
  const g = speicher().geraete.get(geraet);
  if (!g) return false;
  g.aktiv = sperren ? 0 : 1;
  g.gesperrt_grund = sperren ? text(grund, 140) : null;
  return true;
}

// ----------------------------------------------------------------- Bediener --

function demoUser(email) {
  const e = String(email ?? "").trim().toLowerCase().slice(0, 140);
  return DEMO_BENUTZER.find((u) => u.email === e) || null;
}

function rollenVon(u) {
  return [...(u.roles || [])].filter((r) => !ROLLEN_AUSBLENDEN.has(r)).sort();
}

function pinDaten(u) {
  const sp = speicher();
  if (!sp.pins.has(u.email)) sp.pins.set(u.email, { hash: null, demoPin: u.pin || null, gesetzt_am: null, standort: undefined, kurzname: undefined });
  return sp.pins.get(u.email);
}

/** Gespeicherter Hash; Demo-PIN wird beim ersten Gebrauch mit PBKDF2 gehasht (danach nur noch der Hash). */
async function pinHashVon(u) {
  const d = pinDaten(u);
  if (!d.hash && d.demoPin) {
    d.hash = await pinHash(d.demoPin);
    d.demoPin = null;
  }
  return d.hash;
}

function standortVon(u) {
  const d = speicher().pins.get(u.email);
  return (d && d.standort !== undefined ? d.standort : u.standort) || "";
}

function antwortBediener(u) {
  const d = speicher().pins.get(u.email);
  const kurzname = (d && d.kurzname) || u.name.split(" ")[0];
  return { user: u.email, name: u.name || u.email, kurzname, roles: rollenVon(u), standort: standortVon(u) };
}

function sperrSchluessel(user, geraet) {
  return `ph_core:pin:fehl:${user}:${geraet}`;
}

function fehlversuche(user, geraet, ctx) {
  const w = speicher().fehl.get(sperrSchluessel(user, geraet));
  return w && w.bis > jetztMs(ctx) ? w : { anzahl: 0, bis: 0 };
}

function fehlversuchMerken(user, geraet, ctx) {
  const anzahl = fehlversuche(user, geraet, ctx).anzahl + 1;
  speicher().fehl.set(sperrSchluessel(user, geraet), { anzahl, bis: jetztMs(ctx) + SPERRE_SEKUNDEN * 1000 });
  return anzahl;
}

export async function setPin({ pin, user, standort, kurzname } = {}, ctx = {}) {
  const session = angemeldet(ctx);
  const ziel = text(user, 140).toLowerCase() || session.user;
  if (ziel !== session.user && !hatRolle(session, ROLLEN_ADMIN, { leitung: true })) throw phCoreFehler("forbidden", "Keine Berechtigung.", {}, 403);
  const u = demoUser(ziel);
  if (!u) throw phCoreFehler("not_found", "Benutzer unbekannt.", {}, 404);
  const fehler = pinPruefen(pin);
  if (fehler) throw phCoreFehler("invalid", fehler, { field: "pin" }, 400);
  const d = pinDaten(u);
  d.hash = await pinHash(String(pin).trim());
  d.demoPin = null;
  d.gesetzt_am = jetztMs(ctx);
  if (standort !== undefined) d.standort = text(standort, 140) || "";
  if (kurzname !== undefined) d.kurzname = text(kurzname, 40) || undefined;
  return { ok: true, user: u.email, pin_gesetzt_am: iso(d.gesetzt_am) };
}

export async function verifyPin({ email, pin, geraetToken } = {}, ctx = {}) {
  const g = geraetAktiv(geraetToken);
  pflicht({ email }, "email");
  const u = demoUser(email);
  if (!u) throw phCoreFehler("not_found", "Benutzer unbekannt.", {}, 404);
  const sperre = fehlversuche(u.email, g.name, ctx);
  if (sperre.anzahl >= FEHLVERSUCHE_MAX) {
    throw phCoreFehler("rate_limited", "PIN vorübergehend gesperrt.", { sekunden: Math.max(0, Math.floor((sperre.bis - jetztMs(ctx)) / 1000)) }, 429);
  }
  if (u.enabled === 0) throw phCoreFehler("forbidden", "Benutzer ist deaktiviert oder kein Desk-Benutzer.", {}, 403);
  if (!/^\d{4,6}$/.test(String(pin ?? "").trim())) throw phCoreFehler("invalid", "PIN muss aus 4 bis 6 Ziffern bestehen.", { field: "pin" }, 400);
  const hash = await pinHashVon(u);
  if (!hash || !(await pinPasst(pin, hash))) {
    const anzahl = fehlversuchMerken(u.email, g.name, ctx);
    throw phCoreFehler("invalid_pin", "PIN stimmt nicht.", { verbleibend: Math.max(0, FEHLVERSUCHE_MAX - anzahl) }, 401);
  }
  speicher().fehl.delete(sperrSchluessel(u.email, g.name));
  return { ...antwortBediener(u), geraet: g.name, arbeitsplatz: g.arbeitsplatz };
}

export async function listOperators({ geraetToken, alleStandorte } = {}, ctx = {}) {
  const g = geraetAktiv(geraetToken);
  const aus = [];
  for (const u of [...DEMO_BENUTZER].sort((a, b) => a.name.localeCompare(b.name))) {
    const d = pinDaten(u);
    if (!d.hash && !d.demoPin) continue; // ohne PIN kein Bediener
    if (u.enabled === 0) continue;
    const st = standortVon(u);
    if (!alleStandorte && st && g.standort && st !== g.standort) continue;
    const rollen = rollenVon(u);
    const bediener = rollen.some((r) => BEDIENER_ROLLEN.includes(r) || BEDIENER_ROLLEN_PRAEFIX.some((p) => r.startsWith(p)));
    if (!bediener && !hatRolle({ user: u.email, roles: u.roles }, ROLLEN_ADMIN)) continue;
    aus.push(antwortBediener(u));
  }
  return aus;
}

// ------------------------------------------------------------ Suche/Aktivität --

function bereichVon(doctype) {
  for (const [b, dts] of Object.entries(BEREICHE)) if (dts.includes(doctype)) return b;
  return null;
}

function lesbareMetas(doctypes, session, index) {
  const out = new Map();
  for (const dt of doctypes) {
    const meta = index.doctypes.get(dt);
    if (meta && !meta.istable && !meta.issingle && darfDoc(session, meta, "read")) out.set(dt, meta);
  }
  return out;
}

function listeParam(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.map(String);
  const s = String(x).trim();
  if (s.startsWith("[")) {
    try {
      return JSON.parse(s).map(String);
    } catch {
      return [];
    }
  }
  return s.split(",").map((t) => t.trim()).filter(Boolean);
}

function kontext(ctx) {
  const db = ctx.client?.db || mockDatenbank();
  const index = ctx.client?.index || metaIndex();
  return { db, index };
}

function tabelle(db, doctype) {
  return db.db.get(doctype) || new Map();
}

function titelVon(meta, doc) {
  const t = meta.title_field ? doc[meta.title_field] : null;
  return String(t || doc.name).slice(0, 120);
}

/** @returns {Promise<import("../frappe/core.js").PhSuchtreffer[]>} */
export async function globalSearch({ q, limit = 20, doctypes } = {}, ctx = {}) {
  const session = angemeldet(ctx);
  if (q === undefined || q === null) throw phCoreFehler("invalid", "Pflichtfeld fehlt: q", { field: "q" }, 400);
  const such = text(q, 60).toLowerCase();
  if (such.length < 2) return [];
  const lim = Math.max(1, Math.min(Number(limit) || 20, 50));
  const gewuenscht = doctypes ? listeParam(doctypes).filter((d) => SUCH_DOCTYPES.includes(d)) : SUCH_DOCTYPES;
  const { db, index } = kontext(ctx);
  const treffer = [];
  const gesehen = new Set();
  for (const [dt, meta] of lesbareMetas(gewuenscht, session, index)) {
    const felder = ["name"];
    if (meta.title_field && meta.fields.some((f) => f.fieldname === meta.title_field)) felder.push(meta.title_field);
    for (const f of meta.search_fields || []) {
      const df = meta.fields.find((x) => x.fieldname === f);
      if (df && SUCH_FELDTYPEN.has(df.fieldtype) && !felder.includes(f)) felder.push(f);
    }
    const hatStatus = meta.fields.some((f) => f.fieldname === "status");
    const zeilen = [...tabelle(db, dt).values()]
      .filter((d) => felder.some((f) => String(d[f] ?? "").toLowerCase().includes(such)))
      .sort((a, b) => String(b.modified ?? "").localeCompare(String(a.modified ?? "")))
      .slice(0, JE_DOCTYPE);
    for (const z of zeilen) {
      const schl = `${dt}::${z.name}`;
      if (gesehen.has(schl)) continue;
      gesehen.add(schl);
      treffer.push({ doctype: dt, name: z.name, titel: titelVon(meta, z), status: hatStatus ? (z.status ?? null) : null, geaendert: iso(z.modified), href_hinweis: `/d/${doctypeSlug(dt)}/${z.name}`, bereich: bereichVon(dt) });
    }
  }
  treffer.sort((a, b) => String(b.geaendert ?? "").localeCompare(String(a.geaendert ?? "")));
  return treffer.slice(0, lim);
}

const MAX_FELDER = 4;

function zusammenfassung(meta, e) {
  switch (e.art) {
    case "Geaendert": {
      const labels = [];
      for (const f of e.felder || []) {
        const df = meta.fields.find((x) => x.fieldname === f);
        const l = df?.label || f;
        if (!labels.includes(l)) labels.push(l);
      }
      if (!labels.length) return "Geändert";
      const rest = labels.length - MAX_FELDER;
      return `Geändert: ${labels.slice(0, MAX_FELDER).join(", ")}${rest > 0 ? ` (+${rest})` : ""}`;
    }
    case "Workflow":
      return `Workflow: ${e.text || ""}`.trim();
    case "Geloescht":
      return "Gelöscht";
    case "E-Mail":
      return e.text === "Sent" ? "E-Mail gesendet" : "E-Mail empfangen";
    default:
      return e.art; // Angelegt, Kommentar, Zugewiesen, Anhang – nie Inhalte
  }
}

function benutzerName(user) {
  const u = DEMO_BENUTZER.find((x) => x.email === user);
  return u ? u.name : user || "";
}

/** @returns {Promise<import("../frappe/core.js").PhAktivitaet[]>} */
export async function recentActivity({ limit = 30, bereiche } = {}, ctx = {}) {
  const session = angemeldet(ctx);
  const lim = Math.max(1, Math.min(Number(limit) || 30, 100));
  const dts = bereiche ? listeParam(bereiche).flatMap((b) => BEREICHE[b] || []) : SUCH_DOCTYPES;
  const { db, index } = kontext(ctx);
  const metas = lesbareMetas(dts, session, index);
  if (!metas.size) return [];
  const roh = protokollVon(db)
    .filter((e) => metas.has(e.doctype))
    .sort((a, b) => String(b.zeit ?? "").localeCompare(String(a.zeit ?? "")));
  const aus = [];
  for (const e of roh) {
    const meta = metas.get(e.doctype);
    const doc = tabelle(db, e.doctype).get(e.name);
    if (!doc) continue; // gelöscht → wie ph_core nicht mehr sichtbar
    aus.push({
      zeit: iso(e.zeit),
      benutzer: e.benutzer,
      benutzer_name: benutzerName(e.benutzer),
      doctype: e.doctype,
      name: e.name,
      titel: titelVon(meta, doc),
      art: e.art,
      zusammenfassung: zusammenfassung(meta, e),
      href_hinweis: `/d/${doctypeSlug(e.doctype)}/${e.name}`,
      bereich: bereichVon(e.doctype),
    });
    if (aus.length >= lim) break;
  }
  return aus;
}
