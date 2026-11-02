// src/app/api/ezarri/anfrage/versand.js – Versandweg der Ezarri-Anfrage (Team C).
//
// ZWEI SCHALTER (beide müssen stimmen, sonst geht NICHTS ans Backoffice):
//
//   1. EZARRI_ANFRAGE_BACKOFFICE (Konstante unten, heute false)
//      Code-Schalter wie EZARRI_PUBLIC: Freischalten ist eine sichtbare Änderung
//      in genau dieser Zeile, mit OK des Inhabers und nachdem das Backoffice-Team
//      den Empfang geprüft hat (offener Punkt: eigener Doctype oder create_anfrage
//      mit optionalem Telefon / optionaler E-Mail, siehe Doku).
//   2. Laufzeit: nur in Produktion (NODE_ENV=production) und nie mit
//      EZARRI_ANFRAGE_DRY_RUN=1 (Tests, Prüfserver).
//
// Sonst „Dry-Run“: Die Anfrage landet als JSON-Datei im Postausgang
// .data/ezarri/outbox/<zeit>-<id>.json (gitignored) und die Route antwortet
// {success: true, dryRun: true}. Im Produktivbetrieb mit Schalter aus wird die
// Anfrage ebenfalls nur dort abgelegt und im Server-Log gemeldet (ohne
// personenbezogene Daten), damit keine Anfrage verloren geht.
//
// FREISCHALTUNG: EZARRI_PUBLIC (src/lib/ezarri/config.js) darf erst auf true, wenn
// EZARRI_ANFRAGE_BACKOFFICE true ist (freischaltungZulaessig, Unit-Test). In Produktion
// ohne Backoffice antwortet die Route 503 „unavailable“ (postausgangAlsTest).
//
// Keine "@/"-Aliase: node --test importiert die Datei direkt.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ARTEN, LAENDER, PROFILE, PROJEKTARTEN, ZEITRAEUME, ZUBEHOER, labelOf } from "./schema.js";
import { SITE_URL } from "../../../../lib/site.js";
import { EZARRI_PUBLIC } from "../../../../lib/ezarri/config.js";
import { decodeMix, decodeRechner, encodeCustomMix } from "../../../../lib/ezarri/rechner/url.js";
import { poolFlaechen } from "../../../../lib/ezarri/rechner/flaechen.js";
import { FORMATE, formatZahl, quantities } from "../../../../lib/ezarri/rechner/core.js";

/** Code-Schalter: Weiterleitung ans Backoffice. NUR mit Inhaber-OK auf true. */
export const EZARRI_ANFRAGE_BACKOFFICE = true; // mit EZARRI_PUBLIC (Freischalt-Sperre); wirkt nur in Produktion ohne EZARRI_ANFRAGE_DRY_RUN. Vor dem Deploy: Empfang im Backoffice prüfen (integration.md).

/**
 * Freischalt-Sperre (QM P1-4): Die Ezarri-Welt darf nur öffentlich werden, wenn
 * auch der Anfrageweg ans Backoffice an ist. Sonst landen echte Kundenanfragen
 * in einem Ordner auf dem Server, den niemand liest. tests/unit/ezarri-rechner
 * wird rot, sobald EZARRI_PUBLIC = true und EZARRI_ANFRAGE_BACKOFFICE = false.
 */
export function freischaltungZulaessig({ isPublic = EZARRI_PUBLIC, backoffice = EZARRI_ANFRAGE_BACKOFFICE } = {}) {
  return !isPublic || Boolean(backoffice);
}

/**
 * Darf der Postausgang als Erfolg gemeldet werden? Nur außerhalb der Produktion
 * oder mit ausdrücklichem EZARRI_ANFRAGE_DRY_RUN=1 (Prüfserver). In Produktion
 * antwortet die Route sonst 503 „unavailable“ und das Formular nennt Telefon
 * und E-Mail des Studios: Eine nur lokal abgelegte Anfrage ist kein Erfolg.
 */
export function postausgangAlsTest({ env = process.env } = {}) {
  if (env.EZARRI_ANFRAGE_DRY_RUN === "1" || env.EZARRI_ANFRAGE_DRY_RUN === "true") return true;
  return env.NODE_ENV !== "production";
}

/**
 * Vorbereiteter Produktionsweg: die bestehende Beratungs-Schnittstelle des
 * Backoffice (wie /api/beratung_anfrage). Feldzuordnung: toBackofficePayload().
 */
export const BACKOFFICE_URL =
  "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.anfrage.api.create_anfrage";

export const OUTBOX_DIR = path.join(process.cwd(), ".data", "ezarri", "outbox");

/**
 * Welcher Weg gilt? "backoffice" nur, wenn Code-Schalter an, Produktion und kein Dry-Run.
 * @param {{schalter?: boolean, env?: Record<string,string|undefined>}} [o]
 * @returns {"backoffice"|"outbox"}
 */
export function versandModus({ schalter = EZARRI_ANFRAGE_BACKOFFICE, env = process.env } = {}) {
  if (!schalter) return "outbox";
  if (env.NODE_ENV !== "production") return "outbox";
  if (env.EZARRI_ANFRAGE_DRY_RUN === "1" || env.EZARRI_ANFRAGE_DRY_RUN === "true") return "outbox";
  return "backoffice";
}

const FORMAT_LABEL = { 25: "25 mm", 50: "50 mm", hexa: "Hexa" };
const zahl = (n, d = 2) => formatZahl(n, d);

/**
 * Mengen aus dem Rechner-Zustand nachgerechnet (Server, nicht vom Browser übernommen).
 * @param {object} d   geprüfte Anfrage
 * @param {{mixNamen?: Record<string,{name:string, serie?:string}>}} [o]
 * @returns {string[]} Klartextzeilen, leer ohne gültigen Rechner-Zustand
 */
export function mengenZeilen(d, { mixNamen = {} } = {}) {
  if (!d.rechner) return [];
  const { eingabe, mix: rmix } = decodeRechner(d.rechner);
  const mix = d.m ? decodeMix(d.m) : rmix;
  const f = poolFlaechen(eingabe);
  if (Object.keys(f.fehler).length) return [];
  const q = quantities({ flaechen: f, margeProzent: f.margeProzent, format: f.format, mix });
  const z = [
    `Mengen laut Rechner (${FORMAT_LABEL[q.format]}): ${zahl(q.m2)} m² = ${q.kartons} Kartons à ${zahl(FORMATE[q.format].m2ProKarton)} m² (netto ${zahl(q.netto)} m² + ${zahl(q.margeProzent)} % Verschnitt)`,
  ];
  if (q.mischung.length) {
    z.push(`  je Mosaik: ${q.mischung.map((x) => `${mixNamen[x.id]?.name ?? `Mosaik ${x.id}`} ${x.anteil} % = ${x.kartons} Kartons`).join("; ")}`);
    if (q.mehrKartonsDurchMischung > 0) z.push(`  (jedes Mosaik auf volle Kartons gerundet: +${q.mehrKartonsDurchMischung} gegenüber ungemischt)`);
  }
  z.push(`Kleber ca. ${zahl(q.kgKleber)} kg, Epoxidfuge ca. ${zahl(q.kgFuge)} kg, Gewicht Mosaik ca. ${zahl(q.kgMosaik)} kg, ${q.paletten} Palette(n)`);
  if (f.werte.spezial && (q.lfmCorner || q.lfmCove)) z.push(`Corner ${zahl(q.lfmCorner, 1)} lfm, Cove ${zahl(q.lfmCove, 1)} lfm`);
  return z;
}

/**
 * Lesbarer Text der Anfrage (für Backoffice-Beschreibung und Postausgang).
 * Mengen als Klartext, Links absolut (das Team liest ihn im Backoffice oder in der Mail).
 * @param {object} d
 * @param {{referenzen?: Array, mixNamen?: object, fugeName?: (id:string) => string|undefined, base?: string}} [o]
 */
export function anfrageText(d, { referenzen = [], mixNamen = {}, fugeName, base = SITE_URL } = {}) {
  const zeilen = [`Ezarri-Anfrage: ${labelOf(ARTEN, d.art)}`];
  if (referenzen.length) zeilen.push(`Mosaike: ${referenzen.map((r) => `${r.name} (${r.code || r.id})`).join(", ")}`);
  else if (d.referenzen?.length) zeilen.push(`Mosaike: ${d.referenzen.join(", ")}`);
  if (d.m2) zeilen.push(`Fläche: ca. ${String(d.m2).replace(".", ",")} m²`);
  if (d.fuge || d.format) {
    const fu = d.fuge ? `Fuge: ${(fugeName && fugeName(d.fuge)) || `Nr. ${d.fuge}`}` : null;
    zeilen.push([fu, d.format ? `Format ${FORMAT_LABEL[d.format]}` : null].filter(Boolean).join(" · "));
  }
  zeilen.push(...mengenZeilen(d, { mixNamen }));
  if (d.zubehoer) {
    const liste = ZUBEHOER.filter((x) => d.zubehoer[x.id]).map((x) => `${x.label} ${zahl(d.zubehoer[x.id], 1)} ${x.einheit}`);
    if (liste.length) zeilen.push(`Zubehör mit anbieten: ${liste.join(", ")}`);
  }
  if (d.projektart) zeilen.push(`Projekt: ${labelOf(PROJEKTARTEN, d.projektart)}`);
  if (d.profil) zeilen.push(`Profil: ${labelOf(PROFILE, d.profil)}`);
  if (d.ort || d.land) zeilen.push(`Ort: ${[d.ort, d.land ? labelOf(LAENDER, d.land) : null].filter(Boolean).join(", ")}`);
  if (d.zeitraum) zeilen.push(`Zeitraum: ${labelOf(ZEITRAEUME, d.zeitraum)}`);
  if (d.m) {
    const mixNamenZeile = decodeMix(d.m).map((x) => `${mixNamen[x.id]?.name ?? `Mosaik ${x.id}`} ${x.anteil} %`);
    zeilen.push(`Mischung (Custom Mix): ${mixNamenZeile.join(", ")}`);
    zeilen.push(`  ${base}/de/ezarri/custom-mix?${encodeCustomMix({ mix: decodeMix(d.m), fuge: d.fuge, format: d.format })}`);
  }
  if (d.k) zeilen.push(`Konfiguration: ${base}/de/ezarri/konfigurator?k=${d.k}`);
  if (d.rechner) zeilen.push(`Rechner: ${base}/de/ezarri/rechner?${d.rechner}`);
  if (d.nachricht) zeilen.push("", d.nachricht);
  return zeilen.join("\n");
}

/**
 * Feldzuordnung auf die Beratungs-Schnittstelle (beratungSchema in src/lib/forms/schemas.js).
 * Name wird an der ersten Lücke geteilt. Fehlt E-Mail oder Telefon, steht ein
 * Leerstring da – das Backoffice muss das vor dem Freischalten akzeptieren.
 */
export function toBackofficePayload(d, opts = {}) {
  const [vorname, ...rest] = String(d.name || "").trim().split(/\s+/);
  return {
    bei_meiner_anfrage_geht_es_um: `Ezarri Glasmosaik – ${labelOf(ARTEN, d.art)}`,
    das_projekt_soll_verwirklicht_werden: d.zeitraum ? labelOf(ZEITRAEUME, d.zeitraum) : "noch offen",
    bitte_beschreiben_sie_ihr_vorhaben: anfrageText(d, opts),
    vorname: vorname || "-",
    nachname: rest.join(" ") || "-",
    email: d.email || "",
    telefon: d.telefon || "",
  };
}

/**
 * Legt die Anfrage im Postausgang ab. Gibt die ID zurück.
 * @param {object} eintrag  {data, text, modus, ...}
 */
export async function inPostausgang(eintrag, { dir = OUTBOX_DIR, now = new Date() } = {}) {
  const id = crypto.randomBytes(6).toString("hex");
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${stamp}-${id}.json`);
  await fs.writeFile(file, JSON.stringify({ id, eingang: now.toISOString(), ...eintrag }, null, 2), "utf8");
  return { id, file };
}
