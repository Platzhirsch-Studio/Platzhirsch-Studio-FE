// src/lib/karriere/bewerbung.js – Bewerbungsformular der Stellenseiten
// (/<locale>/ueber-uns/karriere/<slug>, Abschnitt #bewerbung). Gruppe "bewerbung".
//
//   ph  1. POST ph_personal.api.create_bewerbung (Token, idempotent):
//          vorname, nachname, email, telefon, verfuegbar_ab, anschreiben, stelle (Slug),
//          sprache, einwilligung_datenschutz=1, einwilligung_text_version, lead_ref
//          → { referenz, status }. Stelle unbekannt (404 not_found, z. B. eine statische
//          Website-Stelle ohne PH Stelle) → einmal ohne `stelle`, Titel im Anschreiben.
//       2. je Datei POST ph_personal.api.attach_unterlage(referenz, dateiname,
//          inhalt_base64, art = Lebenslauf | Anschreiben) – Backend: ≤ 10 MB, privat.
//       Die Gehaltsvorstellung steht im Anschreiben (PH Bewerbung hat kein eigenes Feld).
//   alt kein Formular: die Seite zeigt weiter den bisherigen Weg (E-Mail).
//
// Dateien: nur PDF (Dateikopf "%PDF-"), je Datei höchstens UPLOAD_CONFIG.chunkSize
// (4 MB, die Grenze je Anfrage der Upload-Bibliothek unter dem 10-MB-Puffer des
// Proxys), höchstens zwei Dateien (Lebenslauf Pflicht, Anschreiben optional).
// Löschfrist: sechs Monate nach einer Absage (Frist für Ansprüche nach § 15 GlBG).
//
// Rein (relative Importe; fetch wird übergeben). Browser und Server.
import { UPLOAD_CONFIG } from "../upload/config.js";

export const PH_BEWERBUNG_METHOD = "ph_personal.api.create_bewerbung";
export const PH_UNTERLAGE_METHOD = "ph_personal.api.attach_unterlage";
export const BEWERBUNG_TEXT_VERSION = "bewerbung-2026-11-v1";
export const LOESCHFRIST_MONATE = 6;

export const BEWERBUNG_LIMITS = Object.freeze({
  maxFileBytes: UPLOAD_CONFIG.chunkSize,
  maxFiles: 2,
  vorname: 100,
  nachname: 100,
  email: 254,
  telefon: 40,
  gehalt: 100,
  nachricht: 4000,
  idem: 80,
});

export const DATEI_FELDER = Object.freeze({ lebenslauf: "Lebenslauf", anschreiben: "Anschreiben" });
export const FIELD_ORDER = Object.freeze(["vorname", "nachname", "email", "telefon", "starttermin", "gehalt", "nachricht", "lebenslauf", "anschreiben", "einwilligung"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v) => (typeof v === "string" ? v.trim() : "");

/** Prüft eine Datei-Beschreibung { name, size, type? }. → null | "required" | "type" | "size" */
export function checkPdf(file, { required = false } = {}) {
  if (!file || !file.size) return required ? "required" : null;
  const name = String(file.name || "").toLowerCase();
  if (!name.endsWith(".pdf") || (file.type && file.type !== "application/pdf")) return "type";
  if (file.size > BEWERBUNG_LIMITS.maxFileBytes) return "size";
  return null;
}

/** true, wenn die Bytes mit dem PDF-Kopf beginnen. */
export function isPdfBytes(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  return b.length > 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d;
}

/**
 * @param {object} input Textfelder
 * @param {{ lebenslauf?: {name,size,type}, anschreiben?: {name,size,type} }} files
 * @returns {{ ok: true, data: object } | { ok: false, errors: Record<string,string> }}
 */
export function validateBewerbung(input = {}, files = {}, { today = new Date() } = {}) {
  const v = {
    vorname: str(input.vorname),
    nachname: str(input.nachname),
    email: str(input.email).toLowerCase(),
    telefon: str(input.telefon),
    starttermin: str(input.starttermin),
    gehalt: str(input.gehalt),
    nachricht: str(input.nachricht),
    einwilligung: input.einwilligung === true || input.einwilligung === "1" || input.einwilligung === "on",
    sprache: ["de", "en", "fr", "it"].includes(input.sprache) ? input.sprache : "de",
    stelle: str(input.stelle).slice(0, 140),
    titel: str(input.titel).slice(0, 200),
    idem: str(input.idem).slice(0, BEWERBUNG_LIMITS.idem),
  };
  const e = {};
  for (const k of ["vorname", "nachname"]) {
    if (!v[k]) e[k] = "required";
    else if (v[k].length > BEWERBUNG_LIMITS[k]) e[k] = "long";
  }
  if (!v.email) e.email = "required";
  else if (v.email.length > BEWERBUNG_LIMITS.email || !EMAIL_RE.test(v.email)) e.email = "email";
  if (v.telefon && (v.telefon.length > BEWERBUNG_LIMITS.telefon || !PHONE_RE.test(v.telefon))) e.telefon = "phone";
  if (v.starttermin) {
    const d = DATE_RE.test(v.starttermin) ? new Date(`${v.starttermin}T00:00:00Z`) : null;
    const heute = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    if (!d || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v.starttermin) e.starttermin = "date";
    else if (d < heute) e.starttermin = "past";
  }
  if (v.gehalt.length > BEWERBUNG_LIMITS.gehalt) e.gehalt = "long";
  if (v.nachricht.length > BEWERBUNG_LIMITS.nachricht) e.nachricht = "long";
  const cv = checkPdf(files.lebenslauf, { required: true });
  if (cv) e.lebenslauf = cv;
  const brief = checkPdf(files.anschreiben);
  if (brief) e.anschreiben = brief;
  if (!v.einwilligung) e.einwilligung = "required";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, data: v };
}

/** Anschreiben-Text: Nachricht, Gehaltsvorstellung, ggf. Stellentitel. */
export function anschreibenText(d, { mitTitel = false } = {}) {
  return [mitTitel && d.titel ? `Stelle: ${d.titel}` : null, d.nachricht || null, d.gehalt ? `Gehaltsvorstellung: ${d.gehalt}` : null].filter(Boolean).join("\n\n");
}

/** Parameter für create_bewerbung (nur dokumentierte Felder). */
export function phBewerbungPayload(d, { leadRef, mitStelle = true } = {}) {
  return {
    stelle: mitStelle && d.stelle ? d.stelle : undefined,
    vorname: d.vorname,
    nachname: d.nachname,
    email: d.email,
    telefon: d.telefon || undefined,
    verfuegbar_ab: d.starttermin || undefined,
    anschreiben: anschreibenText(d, { mitTitel: !mitStelle }) || undefined,
    sprache: d.sprache,
    einwilligung_datenschutz: 1,
    einwilligung_text_version: BEWERBUNG_TEXT_VERSION,
    lead_ref: leadRef || undefined,
    idempotency_key: (mitStelle ? d.idem : d.idem && `${d.idem}-o`) || undefined,
  };
}

/** Dateiname, wie ihn das Backend annimmt ([A-Za-z0-9._-], ≤ 120, Endung .pdf). */
export function safePdfName(name, fallback) {
  const base = String(name || "").replace(/\.pdf$/i, "").normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._]+|[._]+$/g, "").slice(0, 100);
  return `${base || fallback}.pdf`;
}

const toBase64 = (bytes) => Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString("base64");

/**
 * @param {object} data geprüfte Daten (validateBewerbung)
 * @param {{ lebenslauf?: {name, bytes}, anschreiben?: {name, bytes} }} dateien Inhalte (Server)
 * @param {{ cfg: {url,key,secret}, fetchImpl?: Function, phCall: Function, leadRef?: string }} o
 * @returns {Promise<{ ok: true, referenz, unterlagen: number, fehlend: number } | { ok: false, code }>}
 */
export async function sendBewerbungPh(data, dateien, { cfg, phCall, fetchImpl = globalThis.fetch, leadRef = null }) {
  if (!cfg) return { ok: false, code: "not_configured" };
  let r = await phCall(cfg, PH_BEWERBUNG_METHOD, { params: phBewerbungPayload(data, { leadRef }), fetchImpl });
  if (!r.ok && r.code === "not_found" && data.stelle) {
    r = await phCall(cfg, PH_BEWERBUNG_METHOD, { params: phBewerbungPayload(data, { leadRef, mitStelle: false }), fetchImpl });
  }
  if (!r.ok) return { ok: false, code: r.code === "invalid" ? "invalid" : r.code === "rate_limited" ? "rate_limited" : "unavailable" };
  const referenz = r.message?.referenz;
  if (!referenz) return { ok: false, code: "unavailable" };
  let unterlagen = 0;
  let fehlend = 0;
  for (const [feld, art] of Object.entries(DATEI_FELDER)) {
    const datei = dateien?.[feld];
    if (!datei?.bytes) continue;
    const a = await phCall(cfg, PH_UNTERLAGE_METHOD, {
      params: { referenz, dateiname: safePdfName(datei.name, art.toLowerCase()), inhalt_base64: toBase64(datei.bytes), art },
      fetchImpl,
      timeoutMs: 60_000,
    });
    if (a.ok) unterlagen += 1;
    else fehlend += 1;
  }
  return { ok: true, referenz, unterlagen, fehlend };
}
