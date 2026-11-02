// src/lib/service/pflege/anfrage.js – Pflege-Anfrage: Prüfung und Payload.
//
// Versandweg (keine neue API-Route): das bestehende Beratungsformular-Backend
//   Browser ── POST /api/upload/inquiry/beratung ──► /api/beratung_anfrage ──► Backoffice „Anfrage“
// mit dem Lead-Vertrag aus src/lib/forms/client.js (Honeypot, Zeitfalle,
// Herkunftsblock, lead_ref) und der Kontextzeile „Kontext: Pflege-Service (pflege)“.
// Danach bietet die Erfolgskarte den Handy-Upload für Fotos an (nur DE,
// src/components/Forms/lazyHandoff.js) – die Fotos laufen durch die
// Upload-Pipeline (Magic Bytes, GPS-Entfernung bei JPEG, privat, 14 Tage Link).
//
// Feldzuordnung (beratungSchema, src/lib/forms/schemas.js):
//   bei_meiner_anfrage_geht_es_um       "Pflege-Service: Leder, Stoff · Abo"
//   das_projekt_soll_verwirklicht_werden Wunschzeitraum (Klartext DE)
//   bitte_beschreiben_sie_ihr_vorhaben   Klartextblock (unten) + Herkunft
//   vorname, nachname, email, telefon
//
// Die Backoffice-Texte sind immer deutsch (das Team liest sie), egal in
// welcher Sprache die Seite war. Keine "@/..."-Importe (node --test).

import { MATERIAL_KEYS } from "./materials.js";

export const ARTEN = Object.freeze(["einmalig", "abo"]);
export const ZEITRAEUME = Object.freeze(["bald", "1-3m", "fruehling", "sommer", "herbst", "winter", "offen"]);

/** Deutsche Klartexte für das Backoffice. */
export const DE_LABELS = Object.freeze({
  material: { leder: "Leder", stoff: "Stoff", holz: "Holz/Furnier", stein: "Marmor/Stein" },
  art: { einmalig: "einmaliger Termin", abo: "Jahres-Abo (mit Erinnerung)" },
  zeitraum: {
    bald: "in den nächsten 4 Wochen",
    "1-3m": "in 1 bis 3 Monaten",
    fruehling: "im Frühling",
    sommer: "im Sommer",
    herbst: "im Herbst",
    winter: "im Winter",
    offen: "noch offen",
  },
});

export const LIMITS = Object.freeze({ stuecke: 1500, nachricht: 3000, ort: 120, name: 100, telefon: 40, email: 254 });

// Gleiche Muster wie src/lib/forms/schemas.js (Server prüft dort noch einmal).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;

/** Reihenfolge der Felder (Fehler-Zusammenfassung, Fokus). */
export const FIELD_ORDER = Object.freeze(["material", "stuecke", "art", "zeitraum", "ort", "vorname", "nachname", "email", "telefon"]);

export function emptyValues() {
  return { material: [], stuecke: "", art: "", zeitraum: "", ort: "", nachricht: "", vorname: "", nachname: "", email: "", telefon: "", nachkauf: false };
}

const str = (v) => (typeof v === "string" ? v : "");

/** Fehler eines Feldes (Schlüssel aus copy FORM.errors) oder "". */
export function validateField(name, values) {
  const v = values || {};
  switch (name) {
    case "material":
      return Array.isArray(v.material) && v.material.some((m) => MATERIAL_KEYS.includes(m)) ? "" : "material";
    case "stuecke":
      return str(v.stuecke).trim().length >= 3 && str(v.stuecke).length <= LIMITS.stuecke ? "" : "stuecke";
    case "art":
      return ARTEN.includes(v.art) ? "" : "art";
    case "zeitraum":
      return ZEITRAEUME.includes(v.zeitraum) ? "" : "zeitraum";
    case "ort":
      return str(v.ort).trim().length >= 2 && str(v.ort).length <= LIMITS.ort ? "" : "ort";
    case "vorname":
      return str(v.vorname).trim() && str(v.vorname).length <= LIMITS.name ? "" : "vorname";
    case "nachname":
      return str(v.nachname).trim() && str(v.nachname).length <= LIMITS.name ? "" : "nachname";
    case "email":
      return EMAIL_RE.test(str(v.email).trim()) && str(v.email).trim().length <= LIMITS.email ? "" : "email";
    case "telefon":
      return !str(v.telefon).trim() || PHONE_RE.test(str(v.telefon).trim()) ? "" : "telefon";
    default:
      return "";
  }
}

/** Alle Fehler: { feld: fehlerSchluessel }. Leer = gültig. */
export function validate(values) {
  const errors = {};
  for (const name of FIELD_ORDER) {
    const e = validateField(name, values);
    if (e) errors[name] = e;
  }
  return errors;
}

const clean = (v, max) =>
  str(v)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);

/** Ausgewählte Materialien, bereinigt und in fester Reihenfolge. */
export function selectedMaterials(list) {
  const set = new Set(Array.isArray(list) ? list : []);
  return MATERIAL_KEYS.filter((k) => set.has(k));
}

/**
 * Klartext für das Backoffice (Feld bitte_beschreiben_sie_ihr_vorhaben).
 * @param {object} values  Formularwerte
 * @param {{locale?: string, nachkaufVersion?: string}} [meta]
 */
export function anfrageText(values, { locale = "de", nachkaufVersion = NACHKAUF_VERSION, nachkaufText = "", jetzt = new Date() } = {}) {
  const mats = selectedMaterials(values.material).map((k) => DE_LABELS.material[k]);
  const lines = [
    "Pflege-Service – Anfrage über /pflege-service",
    `Lead-Kontext: pflege`,
    `Materialien: ${mats.join(", ") || "–"}`,
    `Art: ${DE_LABELS.art[values.art] || "–"}`,
    `Wunschzeitraum: ${DE_LABELS.zeitraum[values.zeitraum] || "–"}`,
    `Ort der Möbel: ${clean(values.ort, LIMITS.ort) || "–"}`,
    "",
    "Möbelstücke:",
    clean(values.stuecke, LIMITS.stuecke) || "–",
  ];
  const msg = clean(values.nachricht, LIMITS.nachricht);
  if (msg) lines.push("", "Nachricht:", msg);
  lines.push(
    "",
    values.nachkauf
      ? `Erinnerung an Pflegemittel per E-Mail: JA, Einwilligung erteilt (${nachkaufVersion}, Seite ${locale})`
      : "Erinnerung an Pflegemittel per E-Mail: nein"
  );
  // Nachweis nach Art. 7 Abs. 1 DSGVO (QA Recht P1-6), solange der Doctype
  // „Pflege Abo“ nicht installiert ist: eine maschinenlesbare Zeile mit
  // Zweck, Version, Zeitpunkt (Absenden, UTC), Sprache und dem Wortlaut, den
  // die Person gesehen hat. Die Kundenbetreuung übernimmt sie beim Import in
  // ihren Einwilligungs-Datensatz (service-pflege-schnittstelle.md §5).
  if (values.nachkauf) lines.push(nachkaufNachweis({ version: nachkaufVersion, locale, text: nachkaufText, jetzt }));
  return lines.join("\n");
}

/** Version des Einwilligungstexts „Erinnerung an Pflegemittel“ (für den Nachweis). */
export const NACHKAUF_VERSION = "pflege-nachkauf-v1-2026-10-29";
export const NACHKAUF_ZWECK = "pflege_nachkauf";

/**
 * Nachweiszeile, z. B.
 * `Einwilligungsnachweis: zweck=pflege_nachkauf; version=…; zeitpunkt=2026-10-29T10:00:00.000Z; sprache=de; wortlaut="…"`
 */
export function nachkaufNachweis({ version = NACHKAUF_VERSION, locale = "de", text = "", jetzt = new Date() } = {}) {
  const wortlaut = clean(text, 400).replace(/"/g, "'");
  return `Einwilligungsnachweis: zweck=${NACHKAUF_ZWECK}; version=${version}; zeitpunkt=${jetzt.toISOString()}; sprache=${locale}; wortlaut="${wortlaut}"`;
}

/** Liest die Nachweiszeile wieder (Import in die Kundenbetreuung, Tests). */
export function parseNachkaufNachweis(text) {
  const m = String(text || "").match(/^Einwilligungsnachweis: zweck=(\w+); version=([\w.-]+); zeitpunkt=([\d:.TZ-]+); sprache=(\w+); wortlaut="([^"]*)"$/m);
  return m ? { zweck: m[1], version: m[2], zeitpunkt: m[3], sprache: m[4], wortlaut: m[5] } : null;
}

/**
 * Payload im Format des Beratungs-Backends (beratungSchema).
 * Ohne website/_t/lead_ref: die setzen useFormGuard() und postForm().
 */
export function toBeratungPayload(values, meta = {}) {
  const mats = selectedMaterials(values.material).map((k) => DE_LABELS.material[k]);
  const thema = `Pflege-Service: ${mats.join(", ") || "Material offen"}${values.art === "abo" ? " · Abo" : ""}`.slice(0, 200);
  return {
    bei_meiner_anfrage_geht_es_um: thema,
    das_projekt_soll_verwirklicht_werden: DE_LABELS.zeitraum[values.zeitraum] || "noch offen",
    bitte_beschreiben_sie_ihr_vorhaben: anfrageText(values, meta),
    vorname: clean(values.vorname, LIMITS.name),
    nachname: clean(values.nachname, LIMITS.name),
    email: clean(values.email, LIMITS.email),
    telefon: clean(values.telefon, LIMITS.telefon),
  };
}

/** Vorbelegung aus der URL (?stueck=, ?material=) – nur bekannte Werte, kurz, ohne Steuerzeichen. */
export function prefillFromSearch(search) {
  let params;
  try {
    params = new URLSearchParams(typeof search === "string" ? search : "");
  } catch {
    return {};
  }
  const out = {};
  const stueck = clean(params.get("stueck"), 120).replace(/[<>]/g, "");
  if (stueck) out.stuecke = stueck;
  const mats = selectedMaterials(String(params.get("material") || "").split(","));
  if (mats.length) out.material = mats;
  if (params.get("art") === "abo") out.art = "abo";
  return out;
}
