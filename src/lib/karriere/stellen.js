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
// GlBG § 9 Abs 2: Jede Stelle nennt das kollektivvertragliche Mindestentgelt
// und die Überzahlungsbereitschaft (Inhaber-Entscheidung Nr. 47, 03.11.2026).
// Solange `entgelt` unvollständig wäre, gälte die Stelle als NICHT
// veröffentlichbar (src/components/Karriere/glbg.js). Keine Werte schätzen.
//
// Einstufung (Einrichtungshaus = Handelsbetrieb, alle direkt angestellt):
//   Angestellte: KV Handel Angestellte, Gehaltssystem NEU, Gehaltstafel
//     gültig ab 1.1.2026, Stufe 1 (1.–3. Jahr), 38,5 h/Woche
//     https://www.wko.at/kollektivvertrag/gehaltstafeln-angestellte-handel-2026
//   Arbeiter:innen: KV Handel Arbeiter:innen, Lohntafel A, gültig ab
//     1.1.2026, Stufe „bis 1 Jahr Betriebszugehörigkeit“
//     https://www.wko.at/kollektivvertrag/lohntafeln-arbeiter-handel-2026
// Begründung je Stelle und Alternativ-KV bei eigener Gewerbeberechtigung:
// Platzhirsch-Status/berichte/KARRIERE-KV-2026-11-03.md (Einstufung vom
// Steuerberater / der Lohnverrechnung bestätigen lassen).
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
export const VEROEFFENTLICHT = "2026-11-03";
export const GUELTIG_BIS = "2027-01-02";

/** KV-Mindestentgelt (brutto pro Monat, Vollzeit) mit Überzahlungsbereitschaft. */
const KV = (kvMindestBrutto, kollektivvertrag) => ({ kvMindestBrutto, zeitraum: "Monat", ueberzahlung: true, kollektivvertrag });
const ANG = (bg, betrag) => KV(betrag, `KV Handel Angestellte, Beschäftigungsgruppe ${bg}, Stufe 1`);
const ARB = (gruppe, betrag) => KV(betrag, `KV Handel Arbeiter:innen, Lohntafel A, Gruppe ${gruppe}, bis 1 Jahr Betriebszugehörigkeit`);

// Je Stelle: Schlüssel der Texte, Entgelt, Beschäftigungsausmaß
// (Schlüssel aus AUSMASS der Sprachdateien), Start (Schlüssel aus START), Anzahl.
export const STELLEN_META = [
  // Technischer Dienst, eigenständige nicht-standardisierte Planungsaufgaben (BG E, 2.535 €).
  { key: "cad-planer", entgelt: ANG("E", 2535), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
  // Studium, eigenständige Konzept-/Beratungsarbeit, Referenz „Bautechnik/Planung“ (BG F, 2.879 €).
  { key: "innenarchitekt", entgelt: ANG("F", 2879), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
  // Verkauf & Vertrieb, Kundenberatung mit vertieften Warenkenntnissen (BG D, 2.362 €).
  { key: "verkaeufer", entgelt: ANG("D", 2362), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
  // Professionist:in mit Lehrabschluss, für den Betrieb relevant (Gruppe 5 Fachkräfte, 2.358 €).
  { key: "monteur-tischler", entgelt: ARB("5 (Fachkräfte)", 2358), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
  // Möbelmonteur:in ohne passenden Lehrabschluss (Gruppe 2, 2.178 €).
  { key: "monteur", entgelt: ARB("2", 2178), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
  { key: "fliesenleger", entgelt: ARB("5 (Fachkräfte)", 2358), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
  { key: "installateur", entgelt: ARB("5 (Fachkräfte)", 2358), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
  // Technischer Dienst wie CAD-Planung (BG E, 2.535 €).
  { key: "elektroplaner", entgelt: ANG("E", 2535), ausmass: "Vollzeit", start: "ab sofort", positions: 1 },
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
    // Ausmaß und Beginn in der Seitensprache (JobDetail liest job_status_*, start_*).
    if (meta.ausmass) job[`job_status_${l}`] = TEXTE[l].AUSMASS?.[meta.ausmass] || meta.ausmass;
    if (meta.start) job[`start_${l}`] = TEXTE[l].START?.[meta.start] || meta.start;
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
 * `salary` = KV-Mindestbrutto pro Monat (leer nur ohne Entgeltangabe).
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
