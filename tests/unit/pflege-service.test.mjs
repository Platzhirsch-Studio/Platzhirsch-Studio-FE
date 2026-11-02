// Pflege-Service Leder, Stoff, Holz (Service Nr. 4, 29.10.2026).
// Reine Logik: Konfiguration (leer = nicht rendern), Materialerkennung,
// Anfrage-Payload (Beratungs-Schema), Portal-Einträge, Texte ohne Superlative/Preise.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PFLEGE_CONFIG, gesetzt, konditionenZeilen } from "../../src/lib/service/pflege/config.js";
import { MATERIALS, MATERIAL_KEYS, leistungenVon, materialsOf } from "../../src/lib/service/pflege/materials.js";
import { LOCALES, PORTAL_COPY, pflegeCopy } from "../../src/lib/service/pflege/copy.js";
import { NACHKAUF_VERSION, emptyValues, parseNachkaufNachweis, prefillFromSearch, toBeratungPayload, validate } from "../../src/lib/service/pflege/anfrage.js";
import { addMonths, buildCareEntries, nextCare } from "../../src/lib/service/pflege/portal.js";
import { languages, pageUrl, pflegeSchema } from "../../src/lib/service/pflege/schema.js";
import { beratungSchema } from "../../src/lib/forms/schemas.js";
import { leadKindOf } from "../../src/lib/forms/leadPayload.js";

const LABELS = pflegeCopy("de").KONDITIONEN;

test("Konfiguration: leere Werte erzeugen keine Zeile, Preise stehen „auf Anfrage“", () => {
  const rows = konditionenZeilen(LABELS, { ...PFLEGE_CONFIG });
  const keys = rows.map((r) => r.key);
  assert.deepEqual(keys.slice(0, 2), ["preisTermin", "preisAbo"]);
  for (const r of rows.slice(0, 2)) assert.equal(r.value, "auf Anfrage");
  // heute sind alle übrigen Inhaber-Werte leer → keine Zeile
  for (const k of ["anfahrt", "einsatzgebiet", "ausfuehrung", "mindestlaufzeit", "kuendigung"]) {
    if (!gesetzt(PFLEGE_CONFIG[k])) assert.ok(!keys.includes(k), `${k} darf leer nicht erscheinen`);
  }
  const filled = konditionenZeilen(LABELS, { ...PFLEGE_CONFIG, einsatzgebiet: "Vorarlberg", preisAbo: "ab 1 €" });
  assert.equal(filled.find((r) => r.key === "einsatzgebiet").value, "Vorarlberg");
  assert.equal(filled.find((r) => r.key === "preisAbo").value, "ab 1 €");
  assert.equal(gesetzt("  "), false);
  assert.equal(gesetzt([]), false);
});

test("Konfiguration: keine erfundenen Preise oder Gebiete im Code", () => {
  for (const k of ["preisTermin", "preisAbo", "anfahrt", "einsatzgebiet", "ausfuehrung", "mindestlaufzeit", "kuendigung"]) {
    assert.equal(PFLEGE_CONFIG[k], "", `${k} ist Inhaber-Entscheidung und muss leer bleiben`);
  }
  assert.deepEqual(PFLEGE_CONFIG.pflegeprodukte, []);
  assert.equal(PFLEGE_CONFIG.indexieren, false);
});

test("Materialerkennung aus Produktpass, Variante und Kategorie", () => {
  assert.deepEqual(materialsOf(["Bezugsstoff lt. Auftrag"], "Eckkombination, Bezug Stoff", "Sofa"), ["stoff"]);
  assert.deepEqual(materialsOf(["Marmorsockel", "Edelstahl"], "Marmorsockel", "Leuchte"), ["stein"]);
  assert.deepEqual(materialsOf(["Anilinleder"], "", "Sessel"), ["leder"]);
  assert.deepEqual(materialsOf(["Nussbaum geölt"], "Furnier", "Tisch"), ["holz"]);
  assert.deepEqual(materialsOf(["Material lt. Musterkarte"], "", "Teppich"), ["stoff"]);
  assert.deepEqual(materialsOf(["Edelstahl"], "", "Leuchte"), []);
  assert.deepEqual(materialsOf(null, undefined), []);
});

test("Materialtexte vollständig in DE und EN", () => {
  for (const l of ["de", "en"]) {
    for (const k of MATERIAL_KEYS) {
      const m = MATERIALS[l][k];
      assert.ok(m.title && m.intro && m.grenzen, `${l}/${k}`);
      assert.ok(m.leistungen.length >= 2 && m.alltag.length >= 3, `${l}/${k}`);
    }
  }
});

test("Leistungen laut Auftrag: Leder, Stoff, Holz/Furnier/Marmor", () => {
  const de = MATERIALS.de;
  const all = (k) => de[k].leistungen.join(" ");
  assert.match(all("leder"), /Reinigung/);
  assert.match(all("leder"), /Pflege/);
  // Farbauffrischung/Ausbesserungen nur nach Klärung der Gewerbefrage (QA Recht P1-3).
  assert.doesNotMatch(all("leder"), /Farbauffrischung/);
  assert.match(de.leder.ausbesserung, /Farbauffrischung auf Anfrage/);
  assert.equal(PFLEGE_CONFIG.ausbesserungenFreigegeben, false);
  assert.deepEqual(leistungenVon(de.holz, false), de.holz.leistungen);
  assert.match(leistungenVon(de.holz, true).join(" "), /Ausbesserungen/);
  assert.match(all("leder"), /Nubuk und Velours/);
  assert.doesNotMatch(all("stoff"), /\b(W|WS|X)\b/, "keine US-Stoffcodes");
  assert.match(all("stoff"), /Tiefenreinigung/);
  assert.match(all("stoff"), /Fleckenbehandlung/);
  assert.match(all("stoff"), /Imprägnierung/);
  assert.doesNotMatch(all("holz") + all("stein"), /Ausbesserungen/);
});

const valid = () => ({
  ...emptyValues(),
  material: ["leder", "holz"],
  stuecke: "Ledersofa, Esstisch Nussbaum",
  art: "abo",
  zeitraum: "herbst",
  ort: "6911 Lochau",
  vorname: "Anna",
  nachname: "Muster",
  email: "anna@beispiel.at",
});

test("Prüfung: Pflichtfelder, E-Mail, Telefon", () => {
  assert.deepEqual(validate(valid()), {});
  const e = validate(emptyValues());
  for (const k of ["material", "stuecke", "art", "zeitraum", "ort", "vorname", "nachname", "email"]) assert.ok(e[k], k);
  assert.equal(e.telefon, undefined, "Telefon ist freiwillig");
  assert.equal(validate({ ...valid(), telefon: "abc" }).telefon, "telefon");
  assert.equal(validate({ ...valid(), material: ["gold"] }).material, "material");
});

test("Payload passt in das Beratungs-Schema und trägt den Lead-Kontext pflege", () => {
  const p = toBeratungPayload(valid(), { locale: "en" });
  const r = beratungSchema.safeParse(p);
  assert.ok(r.success, JSON.stringify(r.error?.issues));
  assert.equal(p.bei_meiner_anfrage_geht_es_um, "Pflege-Service: Leder, Holz/Furnier · Abo");
  assert.equal(p.das_projekt_soll_verwirklicht_werden, "im Herbst");
  assert.match(p.bitte_beschreiben_sie_ihr_vorhaben, /Lead-Kontext: pflege/);
  assert.match(p.bitte_beschreiben_sie_ihr_vorhaben, /Ort der Möbel: 6911 Lochau/);
  assert.match(p.bitte_beschreiben_sie_ihr_vorhaben, /Pflegemittel per E-Mail: nein/);
  const yes = toBeratungPayload({ ...valid(), nachkauf: true });
  assert.match(yes.bitte_beschreiben_sie_ihr_vorhaben, new RegExp(`JA, Einwilligung erteilt \\(${NACHKAUF_VERSION}`));
  assert.equal(leadKindOf("/api/upload/inquiry/beratung"), "beratung");
});

test("Vorbelegung aus der URL nur mit bekannten Werten", () => {
  assert.deepEqual(prefillFromSearch("?stueck=Minotti%20Connery&material=stoff,gold&art=abo"), { stuecke: "Minotti Connery", material: ["stoff"], art: "abo" });
  assert.deepEqual(prefillFromSearch("?stueck=%3Cscript%3E"), { stuecke: "script" });
  assert.deepEqual(prefillFromSearch(""), {});
});

const project = {
  id: "P1",
  title: "Wohnzimmer",
  items: [
    { id: "I1", name: "Sofa", brand: "Minotti", category: "Sofa", variant: "Bezug Stoff", status: "geliefert", productPassId: "PASS-1" },
    { id: "I2", name: "Tisch", brand: "X", category: "Tisch", variant: "Nussbaum", status: "bestellt", productPassId: null },
    { id: "I3", name: "Leuchte", brand: "Flos", category: "Leuchte", status: "geplant", productPassId: null },
  ],
};
const passes = { "PASS-1": { id: "PASS-1", materials: ["Bezugsstoff"], care: ["Saugen."], deliveredAt: "2026-03-01T10:00:00+01:00" } };
const now = new Date("2026-10-29T12:00:00Z");

test("Portal: nur bestellte/gelieferte Stücke, Material und Pflegehinweise aus dem Pass", () => {
  const entries = buildCareEntries({ projects: [project], passes, now });
  assert.deepEqual(entries.map((e) => e.item.id), ["I1", "I2"]);
  assert.deepEqual(entries[0].materials, ["stoff"]);
  assert.deepEqual(entries[0].care, ["Saugen."]);
  assert.deepEqual(entries[1].materials, ["holz"]);
  assert.equal(entries[0].next.kind, "offen");
  assert.equal(entries[1].next.kind, "abLieferung");
});

test("Portal: nächster Termin – Termin vor Abo-Datum vor Lieferung + Intervall", () => {
  const item = project.items[0];
  const pass = passes["PASS-1"];
  const abo = { status: "aktiv", itemIds: ["I1"] };
  assert.deepEqual(nextCare({ item, pass, abo, now }), { kind: "faellig", date: addMonths(pass.deliveredAt, 12) });
  assert.deepEqual(nextCare({ item, pass, abo: { ...abo, naechsterTermin: "2027-04-01" }, now }), { kind: "faellig", date: "2027-04-01" });
  const appt = { kind: "pflege", status: "bestaetigt", start: "2026-11-20T09:00:00+01:00" };
  assert.deepEqual(nextCare({ item, pass, abo, appointments: [appt], now }), { kind: "geplant", date: appt.start });
  assert.equal(nextCare({ item, pass, abo, appointments: [{ ...appt, status: "abgesagt" }], now }).kind, "faellig");
  const entries = buildCareEntries({ projects: [project], passes, subscriptions: [abo], now });
  assert.ok(entries[0].abo);
  assert.equal(entries[1].abo, null);
});

// Sprachen-Ausbau 01.11.2026 (bewusst geändert): FR/IT eigene Fassungen (copy-intl.js).
test("SEO: DE/EN/FR/IT, hreflang und JSON-LD ohne Preis/Bewertung", () => {
  assert.deepEqual([...LOCALES], ["de", "en", "fr", "it"]);
  assert.equal(pageUrl("en"), "https://platzhirsch.studio/en/pflege-service");
  assert.equal(pageUrl("fr"), "https://platzhirsch.studio/fr/pflege-service");
  assert.deepEqual(Object.keys(languages()), ["de", "en", "fr", "it", "x-default"]);
  for (const l of LOCALES) {
    const json = JSON.stringify(pflegeSchema(l));
    assert.doesNotMatch(json, /"offers"|"price"|AggregateRating|"Review"/);
    const faq = pflegeSchema(l)["@graph"].find((n) => n["@type"] === "FAQPage");
    assert.equal(faq.mainEntity.length, pflegeCopy("de").FAQ.length);
  }
});

test("Texte: keine Superlative, kein Ausrufezeichen, keine Euro-Preise, kein Garantie-Versprechen", () => {
  const texts = JSON.stringify([pflegeCopy("de"), pflegeCopy("en"), MATERIALS, PORTAL_COPY]);
  assert.doesNotMatch(texts, /größt|\bbeste[nrs]?\b|exklusiv|Luxus|\bTraum|\beinzige|führend|\bbest\b|largest|leading|exclusive|luxury/i);
  assert.doesNotMatch(texts, /!/);
  assert.doesNotMatch(texts, /\d\s?€|€\s?\d|EUR\s?\d/);
  assert.doesNotMatch(texts, /Garantie bleibt erhalten|garantiert/i);
  assert.match(texts, /auf Anfrage/);
});

test("Seite: unbekannte Sprachen 404, noindex bis Freigabe, Ratgeber nur verlinkt", () => {
  const page = fs.readFileSync(new URL("../../src/app/[locale]/pflege-service/page.js", import.meta.url), "utf8");
  assert.match(page, /if \(!LOCALES\.includes\(locale\)\) notFound\(\)/);
  assert.match(page, /index: false/);
  const comp = fs.readFileSync(new URL("../../src/components/Service/Pflege/PflegePage.js", import.meta.url), "utf8");
  assert.doesNotMatch(comp, /designmoebel-pflegen-leder-stoff-holz\.md|readFileSync/);
  assert.doesNotMatch(comp, /tone="inverse"/, "keine zweite Walnut-Fläche neben dem Footer");
});

test("Nachkauf-Einwilligung: Nachweis mit Zweck, Version, Zeitpunkt und Wortlaut (Art. 7 Abs. 1)", () => {
  const jetzt = new Date("2026-10-29T10:00:00.000Z");
  const text = toBeratungPayload({ ...valid(), nachkauf: true }, { locale: "de", nachkaufText: "Bitte erinnern Sie mich.", jetzt }).bitte_beschreiben_sie_ihr_vorhaben;
  const n = parseNachkaufNachweis(text);
  assert.deepEqual(n, { zweck: "pflege_nachkauf", version: NACHKAUF_VERSION, zeitpunkt: "2026-10-29T10:00:00.000Z", sprache: "de", wortlaut: "Bitte erinnern Sie mich." });
  const ohne = toBeratungPayload({ ...valid(), nachkauf: false }, { locale: "de" }).bitte_beschreiben_sie_ihr_vorhaben;
  assert.equal(parseNachkaufNachweis(ohne), null);
});

test("Texte: keine Garantie-Zusage, keine absoluten Versprechen (QA Recht P1-2/P2)", () => {
  const all = JSON.stringify([pflegeCopy("de"), pflegeCopy("en")]);
  for (const bad of ["ohne Risiko", "without risk", "um nichts kümmern", "statutory guarantee", "melden wir ihn für Sie", "Erinnerung vorab", "nach den Vorgaben des Herstellers"]) {
    assert.ok(!all.includes(bad), bad);
  }
});
