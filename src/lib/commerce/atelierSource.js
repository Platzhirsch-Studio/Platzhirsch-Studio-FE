// src/lib/commerce/atelierSource.js
// Datenquelle Atelierverkauf (Masterplan AP9 Nr. 2): ein Google Sheet, dessen
// eigener VERÖFFENTLICHUNGS-Tab als CSV im Web veröffentlicht ist (Review 15:
// "als CSV veröffentlicht" heißt öffentlich lesbar, deshalb ein Tab nur mit
// den Spalten unten, ohne Einkaufspreise und Kundennamen).
//
//   ATELIER_CSV_URL  https://… (ohne Wert: Leerzustand, keine Anfrage)
//
// Jede Zeile wird mit zod geprüft. Fehlerhafte Zeilen werden übersprungen und
// protokolliert (Zeilennummer + Feld, keine Inhalte), die Seite bricht nicht.
// Sichtbar sind nur Stücke mit Status "verfuegbar": "reserviert" und
// "verkauft" verschwinden mit der nächsten Revalidierung (1 h, Tag "atelier").
// Fällt das Sheet aus, gilt die zuletzt gute Version dieses Prozesses, sonst
// der Leerzustand. Es gibt bewusst KEINE Beispiel- oder Repo-Daten: Testdaten
// stehen nur in tests/unit/r5-commerce*.test.mjs, nie auf der Seite.
//
// Spalten (Kopfzeile, Reihenfolge egal, Groß-/Kleinschreibung egal):
//   slug, titel, marke, kategorie, preis_eur, zustand, masse, status,
//   foto_url, foto_alt, uvp_eur, uvp_stand, uvp_quelle,
//   ausstellung_von, ausstellung_bis, hersteller, preis_gueltig_bis
// Keine "@/..."-Importe: direkt mit `node --test` getestet.
import { z } from "zod";
import { priceTextIssues } from "./priceRules.js";

export const REVALIDATE_SECONDS = 3600;
export const CACHE_TAG = "atelier";
export const FETCH_TIMEOUT_MS = 8000;
export const MAX_ROWS = 500;
export const STATUS = Object.freeze(["verfuegbar", "reserviert", "verkauft"]);

// ---------- CSV ----------

/**
 * Kleiner CSV-Leser (RFC 4180): Anführungszeichen, "" als Escape,
 * Zeilenumbrüche in Feldern, CRLF. Trennzeichen "," oder ";" (aus der
 * Kopfzeile erkannt). Liefert ein Array von Zeilen (Array von Strings).
 */
export function parseCsv(text) {
  const src = String(text ?? "").replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === "") quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// ---------- Zeilen-Schema ----------

/** "1.290", "1290,00", "1 290 €", "1290.5" → Zahl; sonst NaN. */
export function parseEuro(value) {
  let s = String(value ?? "")
    .replace(/€|eur/gi, "")
    .replace(/[\s  ]/g, "")
    .trim();
  if (!s) return NaN;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+(,\d{1,2})$/.test(s)) s = s.replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) s = s.replace(/,/g, "");
  return /^\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN;
}

const blankToUndefined = (v) => {
  const s = String(v ?? "").trim();
  return s ? s : undefined;
};
const text = (max) => z.string().trim().max(max);
const optionalText = (max) => z.preprocess(blankToUndefined, z.string().max(max).optional());
const isoDate = z.preprocess(blankToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum als JJJJ-MM-TT").optional());
const euro = z.preprocess(
  (v) => parseEuro(v),
  z.number({ error: "Betrag ungültig" }).refine(Number.isFinite, "Betrag ungültig").positive("Betrag muss größer als 0 sein").max(1_000_000)
);
const optionalEuro = z.preprocess(
  (v) => (blankToUndefined(v) === undefined ? undefined : parseEuro(v)),
  z.number({ error: "Betrag ungültig" }).refine(Number.isFinite, "Betrag ungültig").positive().max(1_000_000).optional()
);
// Eigene Fotos NUR als Pfad unter /atelier/ (public/atelier/**). Fremde
// https-Hosts sind ausgeschlossen (QA R5 P3): sonst ginge die IP-Adresse der
// Besucher an Dritte (Datenschutzerklärung) und CSP img-src bräche. Kein "..".
export const PHOTO_RE = /^\/atelier\/(?!.*\.\.)[\w./-]+\.(?:jpe?g|png|webp|avif)$/i;
const photo = z.preprocess(blankToUndefined, z.string().regex(PHOTO_RE, "Foto: nur /atelier/… (.jpg, .png, .webp, .avif)").optional());
const status = z.preprocess(
  (v) => String(v ?? "").trim().toLowerCase().replace("ü", "ue"),
  z.enum(STATUS, { error: "verfuegbar | reserviert | verkauft" })
);

export const atelierRowSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "nur a-z, 0-9 und Bindestrich"),
    titel: text(140).min(2, "fehlt"),
    marke: optionalText(80),
    kategorie: optionalText(80),
    preis_eur: euro,
    zustand: text(1500).min(10, "Zustandsbeschreibung fehlt"),
    masse: optionalText(200),
    status,
    foto_url: photo,
    foto_alt: optionalText(200),
    uvp_eur: optionalEuro,
    uvp_stand: isoDate,
    uvp_quelle: optionalText(200),
    ausstellung_von: isoDate,
    ausstellung_bis: isoDate,
    hersteller: optionalText(300),
    preis_gueltig_bis: isoDate,
  })
  .superRefine((row, ctx) => {
    for (const field of ["titel", "zustand", "masse", "kategorie"]) {
      if (priceTextIssues(row[field]).length) {
        ctx.addIssue({ code: "custom", path: [field], message: "verbotene Formulierung" });
      }
    }
    // UVP nur vollständig belegt (W8 b): Betrag ohne Stand/Quelle ist ein Fehler.
    if (row.uvp_eur !== undefined && (!row.uvp_stand || !row.uvp_quelle)) {
      ctx.addIssue({ code: "custom", path: ["uvp_eur"], message: "Stand und Quelle fehlen" });
    }
    // Foto ohne Beschreibung ist für Screenreader wertlos (WCAG 1.1.1).
    if (row.foto_url && !row.foto_alt) {
      ctx.addIssue({ code: "custom", path: ["foto_alt"], message: "Bildbeschreibung fehlt" });
    }
  });

/** Geprüfte Zeile → Stück für Seite, API und JSON-LD. */
function toItem(row) {
  return Object.freeze({
    slug: row.slug,
    titel: row.titel,
    marke: row.marke,
    kategorie: row.kategorie,
    preis: row.preis_eur,
    zustand: row.zustand,
    masse: row.masse,
    status: row.status,
    foto: row.foto_url,
    fotoAlt: row.foto_alt,
    uvp: row.uvp_eur,
    uvpStand: row.uvp_stand,
    uvpQuelle: row.uvp_quelle,
    ausstellungVon: row.ausstellung_von,
    ausstellungBis: row.ausstellung_bis,
    hersteller: row.hersteller,
    preisGueltigBis: row.preis_gueltig_bis,
    // Herkunft der Daten: nur "sheet" erzeugt JSON-LD (offerSchema.js).
    origin: "sheet",
  });
}

function defaultLog(message) {
  // Nur Zeilennummer und Feld, keine Inhalte aus dem Sheet.
  console.warn(`[atelier] ${message}`);
}

/**
 * CSV-Text → { items, skipped }. items = ALLE gültigen Zeilen (jeder Status),
 * skipped = [{ line, field, message }] (line = Zeile in der Datei, 1 = Kopf).
 * Doppelte slugs: die erste gültige Zeile gilt, weitere werden übersprungen.
 */
export function parseAtelierCsv(csvText, { log = defaultLog } = {}) {
  const rows = parseCsv(csvText);
  const items = [];
  const skipped = [];
  if (!rows.length) return { items, skipped };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const seen = new Set();
  rows.slice(1, MAX_ROWS + 1).forEach((cells, index) => {
    const line = index + 2;
    const record = Object.fromEntries(header.map((key, i) => [key, cells[i] ?? ""]));
    const parsed = atelierRowSchema.safeParse(record);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const field = issue?.path?.length ? String(issue.path[0]) : "?";
      const message = issue?.message || "ungültig";
      skipped.push({ line, field, message });
      log(`Zeile ${line} übersprungen (${field}: ${message})`);
      return;
    }
    if (seen.has(parsed.data.slug)) {
      skipped.push({ line, field: "slug", message: "doppelt" });
      log(`Zeile ${line} übersprungen (slug: doppelt)`);
      return;
    }
    seen.add(parsed.data.slug);
    items.push(toItem(parsed.data));
  });
  if (rows.length - 1 > MAX_ROWS) log(`mehr als ${MAX_ROWS} Zeilen, Rest ignoriert`);
  return { items, skipped };
}

/** Nur verkäufliche Stücke (Status "verfuegbar"). */
export const visibleItems = (items) => (items || []).filter((item) => item.status === "verfuegbar");

// Zuletzt gute Version dieses Prozesses (Fallback bei Ausfall des Sheets).
let lastGood = null;
/** Nur für Tests. */
export function resetAtelierCache() {
  lastGood = null;
}

/** ATELIER_CSV_URL, wenn es eine https-Adresse ist; sonst null. */
export function atelierCsvUrl(env = process.env) {
  const url = String(env.ATELIER_CSV_URL ?? "").trim();
  return /^https:\/\/\S+$/.test(url) ? url : null;
}

/**
 * Lädt das Sheet. Wirft nie.
 * @returns {Promise<{ items: object[], all: object[], skipped: object[],
 *   state: "empty" | "ok" | "stale" | "error" }>}
 *   items = sichtbare Stücke; state "empty" = keine URL konfiguriert.
 */
export async function loadAtelier({ env = process.env, fetchImpl = fetch, log = defaultLog } = {}) {
  const url = atelierCsvUrl(env);
  if (!url) return { items: [], all: [], skipped: [], state: "empty" };
  try {
    const res = await fetchImpl(url, {
      headers: { Accept: "text/csv" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [CACHE_TAG] },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { items, skipped } = parseAtelierCsv(await res.text(), { log });
    lastGood = { items, skipped };
    return { items: visibleItems(items), all: items, skipped, state: "ok" };
  } catch (error) {
    const reason = error?.name === "TimeoutError" ? "Zeitüberschreitung" : String(error?.message || error).slice(0, 80);
    log(`Sheet nicht lesbar (${reason})`);
    if (lastGood) return { items: visibleItems(lastGood.items), all: lastGood.items, skipped: lastGood.skipped, state: "stale" };
    return { items: [], all: [], skipped: [], state: "error" };
  }
}

/** Ein sichtbares Stück nach slug, oder null. */
export async function findAtelierItem(slug, options) {
  const { items } = await loadAtelier(options);
  const key = String(slug ?? "").toLowerCase();
  return items.find((item) => item.slug === key) || null;
}
