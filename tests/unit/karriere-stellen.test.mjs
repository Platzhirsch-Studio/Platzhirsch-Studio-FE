// Inhaber-Auftrag 31.10.2026: 8 statische Stellen (src/lib/karriere/stellen.js).
// Prüft GlBG § 9 (geschlechtsneutral, keine diskriminierenden Angaben),
// § 9 Abs 2 (ohne Entgelt keine Veröffentlichung) und die Zusammenführung
// mit dem Backoffice.   node --test tests/unit/karriere-stellen.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STELLEN_META,
  STELLEN_LOCALES,
  VEROEFFENTLICHT,
  GUELTIG_BIS,
  buildStelle,
  entgeltVollstaendig,
  jobPageTitle,
  localizedTitle,
  mergeStellen,
  statischeStellen,
  toFrappeDoc,
} from "../../src/lib/karriere/stellen.js";
import { fehlendeAngaben, karriereVorschau, publishableJob, publishableJobs, visibleJobs } from "../../src/components/Karriere/glbg.js";
import { entgeltText } from "../../src/lib/karriere/texte.js";
import { generateSlug } from "../../src/lib/slugify.js";
import * as DE from "../../src/lib/karriere/stellen.de.js";
import * as EN from "../../src/lib/karriere/stellen.en.js";
import * as FR from "../../src/lib/karriere/stellen.fr.js";
import * as IT from "../../src/lib/karriere/stellen.it.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const TEXTE = { de: DE, en: EN, fr: FR, it: IT };
const MARKER = { de: "(m/w/d)", en: "(m/f/d)", fr: "(h/f/d)", it: "(m/f/d)" };
const VOLL = { kvMindestBrutto: 2400, zeitraum: "Monat", ueberzahlung: true, kollektivvertrag: "Handel" };

test("8 Stellen, eindeutige Slugs = generateSlug(Titel)", () => {
  const jobs = statischeStellen();
  assert.equal(jobs.length, 8);
  assert.equal(new Set(jobs.map((j) => j.slug)).size, 8);
  for (const j of jobs) {
    assert.equal(j.slug, generateSlug(j.title), j.title);
    assert.equal(j.status, "Aktiv");
    assert.equal(j.statisch, true);
  }
  const titles = jobs.map((j) => j.title).join(" | ");
  for (const word of ["CAD-Planer", "Innenarchitekt", "Verkäufer", "Tischlerlehre", "Monteur", "Fliesenleger", "Installateur", "Elektroplaner"]) {
    assert.ok(titles.includes(word), word);
  }
});

test("Titel geschlechtsneutral: Paarform und (m/w/d) bzw. Übersetzung", () => {
  for (const l of STELLEN_LOCALES) {
    for (const [key, s] of Object.entries(TEXTE[l].STELLEN)) {
      assert.ok(s.title.endsWith(MARKER[l]), `${l}/${key}: ${s.title}`);
    }
  }
  for (const s of Object.values(DE.STELLEN)) assert.match(s.title, /\/in\b/, s.title);
});

test("Alle Sprachen haben dieselbe Struktur wie Deutsch", () => {
  for (const l of ["en", "fr", "it"]) {
    assert.equal(TEXTE[l].BIETEN.length, DE.BIETEN.length, l);
    assert.deepEqual(Object.keys(TEXTE[l].STELLEN), Object.keys(DE.STELLEN), l);
    for (const [key, de] of Object.entries(DE.STELLEN)) {
      const t = TEXTE[l].STELLEN[key];
      assert.equal(t.aufgaben.length, de.aufgaben.length, `${l}/${key} aufgaben`);
      assert.equal(t.profil.length, de.profil.length, `${l}/${key} profil`);
      assert.ok(t.beschreibung.trim() && t.bereich.trim(), `${l}/${key}`);
    }
  }
  assert.deepEqual(STELLEN_META.map((m) => m.key), Object.keys(DE.STELLEN));
});

// Alter, Herkunft, Geschlecht, unbestätigte Benefits, Superlative (alle Sprachen).
const VERBOTEN = [
  /\bjung/i, /\balter\b/i, /\bjahre alt\b/i, /\b\d+\s*(jahre|years|ans|anni)\b/i, /berufseinsteiger/i, /\bbis \d+/i,
  /muttersprach/i, /native speaker/i, /langue maternelle/i, /madrelingua/i, /nationalit/i, /staatsbürger/i, /herkunft/i,
  /männlich|weiblich|\bmale\b|\bfemale\b/i, /belastbar/i, /\bresilient\b/i, /young/i, /jeune/i, /giovane/i,
  /firmenwagen|dienstwagen|company car|voiture de fonction|auto aziendale/i, /prämie|bonus|(^|\s)primes?(\s|$)|(^|\s)premi(\s|$)/i,
  /home.?office|télétravail|smart working/i, /weiterbildungsbudget|training budget/i, /gehalt|salary|salaire|stipendio/i,
  /\bbest|beste[nrs]?\b|meilleur|migliore/i, /(^|\s)führend|\bleading|\bleader/i, /exklusiv|exclusive|esclusiv/i,
  /einzigartig|unique|unico|unica/i, /premium/i, /\btop\b/i, /nr\.?\s*1|#1|number one/i,
];

test("Keine verbotenen Wörter, Alters- oder Herkunftsangaben", () => {
  for (const l of STELLEN_LOCALES) {
    const texts = [...TEXTE[l].BIETEN];
    for (const s of Object.values(TEXTE[l].STELLEN)) texts.push(s.title, s.bereich, s.beschreibung, ...s.aufgaben, ...s.profil);
    for (const text of texts) {
      for (const re of VERBOTEN) assert.doesNotMatch(text, re, `${l}: „${text}“`);
    }
  }
});

test("Entgelt-Pflicht (§ 9 Abs 2 GlBG) blockiert die Veröffentlichung", () => {
  const jobs = statischeStellen();
  // Heute: keine Werte bekannt → keine Stelle veröffentlichbar, keine geschätzt.
  for (const j of jobs) {
    assert.deepEqual(j.entgelt, { kvMindestBrutto: null, zeitraum: "Monat", ueberzahlung: null, kollektivvertrag: null });
    assert.equal(j.salary, null);
    assert.equal(publishableJob(j), false, j.title);
    assert.ok(fehlendeAngaben(j).includes("entgelt"));
  }
  assert.deepEqual(publishableJobs(jobs), []);
  // Produktion: unsichtbar; Vorschau (Dev oder KARRIERE_PREVIEW=1): sichtbar.
  assert.equal(karriereVorschau({ nodeEnv: "production", preview: undefined }), false);
  assert.equal(karriereVorschau({ nodeEnv: "production", preview: "1" }), true);
  assert.equal(karriereVorschau({ nodeEnv: "development" }), true);
  assert.equal(visibleJobs(jobs, false).length, 0);
  assert.equal(visibleJobs(jobs, true).length, 8);

  // Jede fehlende Teilangabe sperrt.
  for (const kaputt of [
    { ...VOLL, kvMindestBrutto: null },
    { ...VOLL, kvMindestBrutto: 0 },
    { ...VOLL, kvMindestBrutto: "2400" },
    { ...VOLL, zeitraum: "Woche" },
    { ...VOLL, kollektivvertrag: null },
    { ...VOLL, kollektivvertrag: " " },
    { ...VOLL, ueberzahlung: null },
  ]) {
    assert.equal(entgeltVollstaendig(kaputt), false, JSON.stringify(kaputt));
    const job = buildStelle({ ...STELLEN_META[0], entgelt: kaputt });
    assert.equal(publishableJob(job), false);
    assert.equal(job.salary, null);
  }
  // Vollständig → veröffentlichbar, mit Betrag fürs JobPosting.
  const ok = buildStelle({ ...STELLEN_META[0], entgelt: VOLL });
  assert.equal(publishableJob(ok), true);
  assert.equal(ok.salary, 2400);
  assert.equal(ok.salary_unit, "MONTH");
  assert.equal(buildStelle({ ...STELLEN_META[0], entgelt: { ...VOLL, zeitraum: "Jahr" } }).salary_unit, "YEAR");
  assert.equal(visibleJobs([ok], false).length, 1);
  assert.equal(publishableJob(buildStelle({ ...STELLEN_META[0], entgelt: { ...VOLL, ueberzahlung: false } })), true);
  assert.match(entgeltText(VOLL, "de"), /^Mindestentgelt laut Kollektivvertrag Handel: €\s2\.400,00 brutto pro Monat\. Bereitschaft zur Überzahlung/);
});

test("Backoffice hat Vorrang bei gleichem Slug, ohne Backoffice statische Stellen", () => {
  assert.equal(mergeStellen([]).length, 8);
  assert.equal(mergeStellen(null).length, 8);
  const bo = { title: "Monteur/in (m/w/d)", slug: "monteur-in-m-w-d", status: "Aktiv", salary: "2400" };
  const merged = mergeStellen([bo, { title: "Koch", slug: "koch", status: "Aktiv" }]);
  assert.equal(merged.length, 9);
  const monteur = merged.filter((j) => j.slug === "monteur-in-m-w-d");
  assert.equal(monteur.length, 1);
  assert.equal(monteur[0], bo);
});

test("Seitentitel ≤ 60 Zeichen, JobPosting-Daten, Frappe-Export", () => {
  const LABEL = { de: "Karriere", en: "Career", fr: "Carrière", it: "Carriera" };
  for (const j of statischeStellen()) {
    for (const l of STELLEN_LOCALES) {
      const t = jobPageTitle(localizedTitle(j, l), LABEL[l]);
      assert.ok(t.length <= 60, `${l}: ${t} (${t.length})`);
      assert.ok(t.includes(localizedTitle(j, l)));
    }
    assert.equal(j.posted, VEROEFFENTLICHT);
    assert.equal(j.valid_through, GUELTIG_BIS);
    const doc = toFrappeDoc(j);
    assert.equal(doc.doctype, "Karriere");
    assert.equal(doc.salary, "");
    assert.ok(Array.isArray(doc.responsibilities_de) && doc.responsibilities_de[0].responsibility);
  }
  const days = (Date.parse(GUELTIG_BIS) - Date.parse(VEROEFFENTLICHT)) / 86400000;
  assert.equal(days, 60);

  const schema = read("src/lib/seo/structuredData.js");
  assert.match(schema, /\.\.\.\(validThrough \? \{ validThrough \} : \{\}\)/);
  assert.match(schema, /\.\.\.\(salaryMin\s*\?\s*\{\s*baseSalary/);
  // Detailseite: JobPosting nur mit Entgelt, sonst noindex; Sitemap nur veröffentlichbare.
  const detail = read("src/app/[locale]/ueber-uns/karriere/[slug]/page.js");
  assert.match(detail, /\{live && <JobPostingJsonLd/);
  assert.match(detail, /robots: live \? \{ index: true, follow: true \} : NOINDEX/);
  assert.match(read("src/lib/seo/sitemapEntries.js"), /return publishableJobs\(await fetchKarriereData\(\)\);/);
  assert.match(read("src/lib/api/fetchKarrierData.js"), /return mergeStellen\(await fetchBackofficeKarriere\(\)\);/);
});

test("Bewerbungsweg: allgemeine Adresse und Hinweis auf die Datenschutzerklärung", () => {
  for (const f of ["src/components/Karriere/JobDetail.js", "src/components/Karriere/karriereposition.js"]) {
    assert.match(read(f), /href="\/datenschutz#bewerbungen"/, f);
  }
  assert.match(read("src/components/LegalDrafts/docs/datenschutz.js"), /id: "bewerbungen"/);
});

// Inhaber-Entscheidung Nr. 36 (31.10.2026): CAD-Software, Führerschein,
// eigenes Team statt Partnerbetriebe, Ansprechperson – in allen 4 Sprachen.
test("Nr. 36: Archicad/AutoCAD, Führerschein B/C, eigenes Team", () => {
  const LICENCE = { de: /Führerschein B \(Voraussetzung\), Führerschein C von Vorteil/, en: /category B \(required\), category C an advantage/, fr: /Permis B \(obligatoire\), permis C apprécié/, it: /Patente B \(requisito\), patente C/ };
  const TEAM = { de: /in unserem (Montage|Planungs)team/, en: /As part of our (installation|planning) team/, fr: /Au sein de notre équipe de (montage|conception)/, it: /Nel nostro team di (montaggio|progettazione)/ };
  for (const l of STELLEN_LOCALES) {
    const S = TEXTE[l].STELLEN;
    for (const key of ["cad-planer", "elektroplaner"]) {
      assert.ok(S[key].profil.some((p) => /Archicad/.test(p) && /AutoCAD/.test(p)), `${l}/${key} CAD`);
    }
    for (const key of ["monteur-tischler", "monteur"]) {
      assert.ok(S[key].profil.some((p) => LICENCE[l].test(p)), `${l}/${key} Führerschein`);
    }
    for (const key of ["fliesenleger", "installateur", "elektroplaner"]) {
      assert.match(S[key].beschreibung, TEAM[l], `${l}/${key} Team`);
      const all = [S[key].beschreibung, ...S[key].aufgaben, ...S[key].profil].join(" ");
      assert.doesNotMatch(all, /Partner|Fachbetrieb|contractor|entreprises|imprese/i, `${l}/${key} keine Partnerbetriebe`);
    }
  }
});

test("Ansprechperson Harald Menghin auf Liste und Detailseite, ohne eigene Mailadresse, nicht im Schema", () => {
  assert.match(read("src/lib/karriere/texte.js"), /export const BEWERBUNG_ANSPRECHPERSON = "Harald Menghin";/);
  for (const f of ["src/components/Karriere/JobDetail.js", "src/components/Karriere/karriereposition.js"]) {
    const src = read(f);
    assert.match(src, /\{k\.ansprechperson\}: \{BEWERBUNG_ANSPRECHPERSON\}/, f);
    assert.doesNotMatch(src, /harald@|menghin@/i, f);
  }
  assert.doesNotMatch(read("src/lib/seo/structuredData.js"), /BEWERBUNG_ANSPRECHPERSON|applicationContact/);
});
