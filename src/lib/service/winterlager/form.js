// src/lib/service/winterlager/form.js – Prüfung und Payload der Winterlager-Anmeldung.
//
// Versandweg (bestehend, nicht verändert): POST /api/upload/inquiry/beratung
// → /api/beratung_anfrage (beratungSchema, Backoffice-Doctype „Anfrage“).
// Die Antwort trägt ein Upload-Ticket, damit der Kunde danach Fotos über den
// bestehenden Handy-Upload schicken kann (UploadHandoff, nur DE).
// Lead-Kontext „winterlager“: steht als Zeile „Kontext: Outdoor-Winterlager
// (winterlager)“ im Herkunfts-Block (leadPayload.js, pageContext; gleiches
// Muster wie „Kontext: Pflege-Service (pflege)“, Abnahme Service A1 – vorher
// doppelt „Kontext: Lead-Kontext: …“) UND als Kopfzeile im Beschreibungstext. Daran erkennt die Kundenbetreuung bzw. später der
// Doctype „Service Auftrag“ (../platzhirsch-frappe-service) die Anmeldung.
//
// Das Backoffice bekommt NUR die Felder des beratungSchema; die Möbelliste,
// Adresse und Wunschtermine stehen strukturiert im Beschreibungstext
// (Format siehe buildDescription, maschinenlesbar mit parseDescription).
// das_projekt_soll_verwirklicht_werden trägt wie bei Beratung und Pflege den
// Zeitraum (Wunsch Abholung/Rückbringung), NICHT den Abholort – der steht in
// der Zeile „Adresse:“ der Beschreibung (Abnahme Service A1).
// Rein, ohne React und ohne "@/..."-Importe (node --test).
import { WINTERLAGER_CONFIG } from "./config.js";
import {
  COPY,
  COUNTRY_KEYS,
  FORM_MATERIAL_KEYS,
  FURNITURE_KEYS,
  PICKUP_KEYS,
  RETURN_KEYS,
  VARIANT_KEYS,
  fill,
} from "./copy.js";

export const LEAD_CONTEXT = "winterlager";
export const PAGE_CONTEXT = `Outdoor-Winterlager (${LEAD_CONTEXT})`;
export const SEND_URL = "/api/upload/inquiry/beratung";
export const HEADER_LINE = `[${LEAD_CONTEXT}]`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-()\s]{6,20}$/;
const clean = (v, max = 200) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

let rowSeq = 0;
/** Neue leere Zeile der Möbelliste (id nur für React-Keys). */
export function emptyRow() {
  rowSeq += 1;
  return { id: `p${rowSeq}`, type: "", count: "1", material: "", note: "" };
}

export function initialValues() {
  return {
    variant: "",
    rows: [emptyRow()],
    reparatur: false,
    aufbau: false,
    street: "",
    zip: "",
    city: "",
    country: "AT",
    access: "",
    pickup: "flexibel",
    back: "flexibel",
    dateNote: "",
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    message: "",
  };
}

const rowFilled = (r) => Boolean(r && (r.type || r.material || clean(r.note)));

/** Anzahl als ganze Zahl 1…maxAnzahl, sonst null. */
export function parseCount(value, max = WINTERLAGER_CONFIG.maxAnzahl) {
  const s = String(value ?? "").trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= max ? n : null;
}

/**
 * Prüft die Werte. Rückgabe: { [feldId]: Fehlertext } (leer = gültig).
 * Feld-Ids entsprechen den ids im Formular (wl-…).
 */
export function validate(values, locale = "de") {
  const e = COPY[locale]?.form.errors || COPY.de.form.errors;
  const errors = {};
  if (!VARIANT_KEYS.includes(values.variant)) errors["wl-variant"] = e.variant;
  const rows = (values.rows || []).slice(0, WINTERLAGER_CONFIG.maxPositionen);
  const filled = rows.filter(rowFilled);
  if (!filled.length) errors["wl-row-0-type"] = e.list;
  rows.forEach((r, i) => {
    if (!rowFilled(r) && (i > 0 || filled.length)) return; // leere Zusatzzeilen ignorieren
    if (!FURNITURE_KEYS.includes(r.type)) errors[`wl-row-${i}-type`] = errors[`wl-row-${i}-type`] || e.list;
    if (parseCount(r.count) === null) errors[`wl-row-${i}-count`] = fill(e.count, { max: WINTERLAGER_CONFIG.maxAnzahl });
    if (!FORM_MATERIAL_KEYS.includes(r.material)) errors[`wl-row-${i}-material`] = e.list;
  });
  if (!clean(values.zip, 12)) errors["wl-zip"] = e.zip;
  if (!clean(values.city, 100)) errors["wl-city"] = e.city;
  if (!clean(values.vorname, 100)) errors["wl-vorname"] = e.vorname;
  if (!clean(values.nachname, 100)) errors["wl-nachname"] = e.nachname;
  if (!EMAIL_RE.test(String(values.email || "").trim())) errors["wl-email"] = e.email;
  const tel = String(values.telefon || "").trim();
  if (tel && !PHONE_RE.test(tel)) errors["wl-telefon"] = e.telefon;
  return errors;
}

/** Reihenfolge der Felder für Fehlerliste und Fokus. */
export function fieldOrder(values) {
  const rows = (values.rows || []).flatMap((_, i) => [`wl-row-${i}-type`, `wl-row-${i}-count`, `wl-row-${i}-material`]);
  return ["wl-variant", ...rows, "wl-zip", "wl-city", "wl-vorname", "wl-nachname", "wl-email", "wl-telefon"];
}

const de = COPY.de;
const labelOf = (map, key) => (key && map[key]) || "";

/** Abholort-Zeile: "6911 Lochau (AT)" (Teil der Zeile „Adresse:“). */
export function placeLine(values) {
  const country = COUNTRY_KEYS.includes(values.country) ? values.country : "";
  return [clean(values.zip, 12), clean(values.city, 100)].filter(Boolean).join(" ") + (country ? ` (${country})` : "");
}

/**
 * Beschreibungstext fürs Backoffice (immer Deutsch, das Studio liest ihn).
 * Format (eine Angabe je Zeile, "Schlüssel: Wert", Möbel als "- n × Art · Material · Notiz"):
 *   [winterlager] Winterlager-Anmeldung
 *   Variante: Im Abo, jedes Jahr
 *   Möbelliste:
 *   - 6 × Stuhl · Teak · Gloster
 *   Zusätzlich: Im Frühling wieder aufbauen
 *   Adresse: Landstraße 1, 6911 Lochau (AT)
 *   …
 */
export function buildDescription(values) {
  const p = de.payload;
  const f = de.form;
  const rows = (values.rows || [])
    .slice(0, WINTERLAGER_CONFIG.maxPositionen)
    .filter(rowFilled)
    .map((r) => {
      const n = parseCount(r.count) ?? 1;
      const parts = [labelOf(f.list.types, r.type), labelOf(f.list.materials, r.material), clean(r.note, 120)].filter(Boolean);
      return `- ${n} × ${parts.join(" · ")}`;
    });
  const extras = [values.reparatur && f.extras.reparatur, values.aufbau && f.extras.aufbau].filter(Boolean);
  const street = clean(values.street, 160);
  const lines = [
    `${HEADER_LINE} ${p.header}`,
    `${p.variant}: ${labelOf(f.variant, values.variant) || p.none}`,
    `${p.list}:`,
    ...rows,
    `${p.extras}: ${extras.length ? extras.join("; ") : p.none}`,
    `${p.address}: ${[street, placeLine(values)].filter(Boolean).join(", ")}`,
    clean(values.access, 300) && `${p.access}: ${clean(values.access, 300)}`,
    `${p.pickup}: ${labelOf(f.dates.pickupOptions, PICKUP_KEYS.includes(values.pickup) ? values.pickup : "flexibel")}`,
    `${p.back}: ${labelOf(f.dates.returnOptions, RETURN_KEYS.includes(values.back) ? values.back : "flexibel")}`,
    clean(values.dateNote, 200) && `${p.dateNote}: ${clean(values.dateNote, 200)}`,
  ].filter(Boolean);
  const message = String(values.message || "").trim().slice(0, 4000);
  return message ? `${lines.join("\n")}\n\n${p.message}:\n${message}` : lines.join("\n");
}

/** Zeitraum fürs Backoffice-Feld „Projekt soll verwirklicht werden“: "Abholung Oktober, Rückbringung April". */
export function periodLine(values) {
  const f = de.form.dates;
  return fill(de.payload.period, {
    pickup: labelOf(f.pickupOptions, PICKUP_KEYS.includes(values.pickup) ? values.pickup : "flexibel"),
    back: labelOf(f.returnOptions, RETURN_KEYS.includes(values.back) ? values.back : "flexibel"),
  });
}

/**
 * Payload im Format von beratungSchema (src/lib/forms/schemas.js).
 * Herkunfts-Block und lead_ref ergänzt postForm() (pageContext = PAGE_CONTEXT).
 */
export function buildPayload(values) {
  return {
    bei_meiner_anfrage_geht_es_um: de.payload.topic,
    das_projekt_soll_verwirklicht_werden: periodLine(values).slice(0, 200),
    bitte_beschreiben_sie_ihr_vorhaben: buildDescription(values),
    vorname: clean(values.vorname, 100),
    nachname: clean(values.nachname, 100),
    email: String(values.email || "").trim(),
    telefon: String(values.telefon || "").trim(),
  };
}

/**
 * Liest den Beschreibungstext wieder ein (für die Frappe-Übernahme in
 * „Service Auftrag“, gleiche Logik in platzhirsch_service/winterlager/parse.py).
 * Rückgabe: { isWinterlager, fields: { Variante: …, … }, positions: [{ count, text }] }.
 */
export function parseDescription(text) {
  const src = String(text || "");
  const isWinterlager = src.startsWith(HEADER_LINE);
  const fields = {};
  const positions = [];
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    const pos = line.match(/^- (\d+) × (.+)$/);
    if (pos) {
      positions.push({ count: Number(pos[1]), text: pos[2] });
      continue;
    }
    const kv = line.match(/^([A-Za-zÄÖÜäöüß ]+): (.+)$/);
    if (kv && !(kv[1] in fields)) fields[kv[1]] = kv[2];
  }
  return { isWinterlager, fields, positions };
}
