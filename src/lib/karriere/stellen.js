// src/lib/karriere/stellen.js – statische Stellen (Inhaber-Auftrag 31.10.2026).
//
// Das Frappe-Backoffice (Doctype „Karriere“, karriere_data) bleibt die Quelle;
// hier stehen die 8 beauftragten Stellen zusätzlich im Repo, im selben
// Datenformat wie die Backoffice-Einträge. fetchKarriereData() führt beide
// zusammen (mergeStellen): eine Backoffice-Stelle mit gleichem Slug hat
// Vorrang, ohne Backoffice-Antwort erscheinen die statischen Stellen.
// Export fürs Backoffice: qa-screenshots/karriere/frappe-import.json
// (toFrappeDoc unten).
//
// GlBG § 9 Abs 2: Das kollektivvertragliche Mindestentgelt und der Hinweis
// auf die Überzahlungsbereitschaft fehlen noch (Inhaber liefert). Solange
// `entgelt` unvollständig ist, gilt die Stelle als NICHT veröffentlichbar
// (src/components/Karriere/glbg.js): in Produktion unsichtbar, in der
// Vorschau mit Sperr-Markierung. Keine Werte schätzen.
//
// Rein: keine Pakete, keine "@/"-Aliase (tests/unit/karriere-stellen.test.mjs).
import { generateSlug } from "../slugify.js";
import * as DE from "./stellen.de.js";
import * as EN from "./stellen.en.js";
import * as FR from "./stellen.fr.js";
import * as IT from "./stellen.it.js";

const TEXTE = { de: DE, en: EN, fr: FR, it: IT };
export const STELLEN_LOCALES = Object.freeze(["de", "en", "fr", "it"]);

/** Ausschreibungsdatum und Gültigkeit (+60 Tage) für JobPosting. */
export const VEROEFFENTLICHT = "2026-10-31";
export const GUELTIG_BIS = "2026-12-30";

/** Leeres Entgelt: Pflichtangabe nach § 9 Abs 2 GlBG, vom Inhaber auszufüllen. */
const OFFEN = (zeitraum = "Monat") => ({ kvMindestBrutto: null, zeitraum, ueberzahlung: null, kollektivvertrag: null });

// Je Stelle: Schlüssel der Texte, Entgelt, Beschäftigungsausmaß
// ("Vollzeit" | "Teilzeit" | "Vollzeit oder Teilzeit" …), Start, Anzahl.
// null = vom Inhaber noch nicht angegeben (keine Annahmen).
export const STELLEN_META = [
  { key: "cad-planer", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
  { key: "innenarchitekt", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
  { key: "verkaeufer", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
  { key: "monteur-tischler", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
  { key: "monteur", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
  { key: "fliesenleger", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
  { key: "installateur", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
  { key: "elektroplaner", entgelt: OFFEN(), ausmass: null, start: null, positions: null },
];

// Feldnamen des Backoffice (abgeleitet aus JobDetail.js und structuredData.js).
const DESCRIPTION_FIELD = { de: "stellenbeschreibung", en: "job_description_en", fr: "description_de_lemploi", it: "jobs_description_it" };

/** Ist das Entgelt vollständig (Betrag, Zeitraum, KV, Überzahlungs-Hinweis)? */
export function entgeltVollstaendig(entgelt) {
  if (!entgelt || typeof entgelt !== "object") return false;
  const betrag = entgelt.kvMindestBrutto;
  const hatBetrag = typeof betrag === "number" && Number.isFinite(betrag) && betrag > 0;
  const hatZeitraum = entgelt.zeitraum === "Monat" || entgelt.zeitraum === "Jahr";
  const hatKv = typeof entgelt.kollektivvertrag === "string" && entgelt.kollektivvertrag.trim() !== "";
  // Überzahlung: true/false (Inhaber hat entschieden) oder eigener Wortlaut.
  const u = entgelt.ueberzahlung;
  const hatUeberzahlung = typeof u === "boolean" || (typeof u === "string" && u.trim() !== "");
  return hatBetrag && hatZeitraum && hatKv && hatUeberzahlung;
}

/** Eine statische Stelle im Format der Backoffice-Einträge (fetchKarriereData). */
export function buildStelle(meta) {
  const de = DE.STELLEN[meta.key];
  const job = {
    title: de.title,
    slug: generateSlug(de.title),
    status: "Aktiv",
    statisch: true,
    posted: VEROEFFENTLICHT,
    valid_through: GUELTIG_BIS,
    type: meta.ausmass || null,
    positions: meta.positions || null,
    ausmass: meta.ausmass || null,
    start: meta.start || null,
    entgelt: { ...meta.entgelt },
    salary: entgeltVollstaendig(meta.entgelt) ? meta.entgelt.kvMindestBrutto : null,
    salary_unit: meta.entgelt?.zeitraum === "Jahr" ? "YEAR" : "MONTH",
  };
  for (const l of STELLEN_LOCALES) {
    const t = TEXTE[l].STELLEN[meta.key];
    if (l !== "de") job[`title_${l}`] = t.title;
    job[DESCRIPTION_FIELD[l]] = t.beschreibung;
    job[`category_${l}`] = t.bereich;
    job[`responsibilities_${l}`] = t.aufgaben.map((responsibility) => ({ responsibility }));
    job[`requirement_${l}`] = t.profil.map((anforderungen) => ({ anforderungen }));
    job[`benefits_${l}`] = TEXTE[l].BIETEN.map((benefit) => ({ benefit }));
  }
  return job;
}

/** Alle statischen Stellen (frische Objekte). */
export function statischeStellen(meta = STELLEN_META) {
  return meta.map(buildStelle);
}

/** Backoffice zuerst; statische Stellen nur, wenn ihr Slug dort fehlt. */
export function mergeStellen(backoffice, statische = statischeStellen()) {
  const bo = Array.isArray(backoffice) ? backoffice : [];
  const slugs = new Set(bo.map((j) => j?.slug || generateSlug(j?.title)));
  return [...bo, ...statische.filter((j) => !slugs.has(j.slug))];
}

/** Titel in der Seitensprache (statische Stellen), sonst der Backoffice-Titel. */
export function localizedTitle(job, locale) {
  const own = job?.[`title_${locale}`];
  return (typeof own === "string" && own.trim()) || job?.title || "";
}

/**
 * Datensatz für den Frappe-Datenimport (Doctype „Karriere“). Kindtabellen
 * als Zeilenlisten mit den Feldnamen, die die Website liest; die Doctype-
 * Namen der Kindtabellen kennt nur das Backoffice (vor dem Import prüfen).
 * `salary` bleibt leer, bis der Inhaber das Entgelt nennt.
 */
export function toFrappeDoc(job) {
  const { slug, statisch, entgelt, ausmass, start, salary_unit, valid_through, ...felder } = job;
  return {
    doctype: "Karriere",
    ...felder,
    salary: felder.salary ?? "",
    _hinweise: { slug, entgelt, ausmass, start, valid_through, salary_unit },
  };
}

/**
 * <title> ≤ 60 Zeichen (Inhaber-Auftrag 31.10.2026): die längste passende
 * Variante, von „Titel | Karriere | Platzhirsch Home Living“ bis zum Titel.
 */
export function jobPageTitle(title, careerLabel) {
  const options = [
    `${title} | ${careerLabel} | Platzhirsch Home Living`,
    `${title} | Platzhirsch Home Living`,
    `${title} | Platzhirsch`,
  ];
  return options.find((o) => o.length <= 60) || title;
}
