// node --test tests/unit/sofaplaner-fr-it.test.mjs
// Sprachen-Welle FR/IT (01.11.2026): /fr/sofaplaner und /it/sofaplaner.
// - Struktur-Parität: jeder deutsche Schlüssel (UI_EN = Referenz) hat FR und IT
// - keine deutschen Reste in Oberfläche, Prüfungen, Anfrage-Text, Seitentexten
// - Typografie: FR geschützte Leerzeichen vor : ; ? ! und in « », IT «» (keine „“)
// - Claim-Wächter (Superlative, Händler, unbelegte Werbeaussagen), keine Preise
// - SEO: Titel ≤ 60, Description 120–155; Wörterbuch kommt nachgeladen (nicht in t.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { UI_EN } from "../../src/lib/sofaplaner/copy/ui-en.js";
import FR from "../../src/lib/sofaplaner/copy/ui-fr.js";
import IT from "../../src/lib/sofaplaner/copy/ui-it.js";
import { loadDict, needsDict } from "../../src/lib/sofaplaner/copy/dicts.js";
import { makeT, dictFor } from "../../src/lib/sofaplaner/copy/t.js";
import { sourceCopy, terminHref } from "../../src/lib/sofaplaner/copy/source.js";
import { localizeFamilyIntl, localizeIndexIntl } from "../../src/lib/sofaplaner/copy/family-intl.js";
import { SOFA_PAGE_COPY, sofaPageIntl, sofaSeoIntl } from "../../src/lib/sofaplaner/copy/page-texts.js";
import { normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { handoffHref, handoffProdukt, handoffSummary, leadLines, leadOptions, LEAD_LAND, LEAD_ZEIT } from "../../src/lib/sofaplaner/handoff.js";
import { checkPlan, makeLookup, planFor, planToText } from "../../src/components/Labs/Sofaplaner/model.js";
import { findClaims, hasUnprovenClaim } from "../../src/lib/legal/claims.js";

const DICTS = { fr: FR, it: IT };
const DATA_DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);

// Deutsch, das auf FR/IT nicht stehen bleiben darf (Umlaute, ß und häufige Wörter)
const GERMAN = /[äöüßÄÖÜ„]|(?<!\p{L})(und|oder|mit|nicht|bitte|Raum|Elemente|Anschluss|Armlehne|Rücken|Tiefe|Breite|Höhe|Sitz\p{L}*|wählen|prüfen|Hinweis|Konflikt|Fenster|Sofaplaner)(?!\p{L})/u;

await loadDict("fr");
await loadDict("it");

/** alle Strings eines Werts (rekursiv, ohne Funktionen/RegExp) */
function strings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === "object" && !(v instanceof RegExp)) Object.values(v).forEach((x) => strings(x, out));
  return out;
}

/** alle FR/IT-Texte einer Sprache (Oberfläche, Datenquelle, Übergabe, Seite, SEO) */
function allTexts(l) {
  const d = DICTS[l];
  return [...Object.values(d.UI), ...strings(d.SOURCE), ...strings(d.HANDOFF), ...strings(d.FAMILY), ...strings(d.NET), ...strings(SOFA_PAGE_COPY[l])];
}

test("Wörterbücher werden nachgeladen und sind in der Registry (nicht in t.js)", () => {
  assert.equal(needsDict("de"), false);
  assert.equal(needsDict("fr"), false);
  assert.equal(dictFor("fr").locale, "fr");
  assert.equal(dictFor("it").locale, "it");
  const tSrc = readFileSync(new URL("../../src/lib/sofaplaner/copy/t.js", import.meta.url), "utf8");
  assert.doesNotMatch(tSrc, /^import[^\n]*ui-(fr|it)/m, "t.js darf FR/IT nicht statisch importieren (Bundle DE/EN)");
});

test("Struktur-Parität: jeder deutsche Schlüssel hat FR und IT (gleiche Platzhalter)", () => {
  for (const l of ["fr", "it"]) {
    const UI = DICTS[l].UI;
    const missing = Object.keys(UI_EN).filter((k) => UI[k] == null);
    assert.deepEqual(missing, [], `${l}: fehlende Schlüssel`);
    const extra = Object.keys(UI).filter((k) => UI_EN[k] == null);
    assert.deepEqual(extra, [], `${l}: Schlüssel ohne deutsche Quelle`);
    for (const [k, v] of Object.entries(UI)) {
      const ph = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
      assert.equal(ph(v), ph(k), `${l}: Platzhalter in „${k}“`);
    }
  }
  // Seitentexte FR und IT mit denselben Feldern
  const keys = (o) => Object.keys(o).sort().join(",");
  assert.equal(keys(SOFA_PAGE_COPY.fr.page), keys(SOFA_PAGE_COPY.it.page));
  assert.equal(keys(SOFA_PAGE_COPY.fr.seo), keys(SOFA_PAGE_COPY.it.seo));
  assert.equal(SOFA_PAGE_COPY.fr.page.tips.length, SOFA_PAGE_COPY.it.page.tips.length);
  for (const k of ["neutral", "minotti"]) assert.equal(keys(FR.SOURCE[k]), keys(IT.SOURCE[k]));
  assert.equal(keys(FR.HANDOFF.zeit), LEAD_ZEIT.map((r) => r[0]).sort().join(","));
  assert.equal(keys(IT.HANDOFF.land), LEAD_LAND.map((r) => r[0]).sort().join(","));
});

test("keine deutschen Reste in den FR/IT-Texten", () => {
  for (const l of ["fr", "it"]) {
    for (const s of allTexts(l)) {
      // erlaubte Eigennamen/Fachwörter: Lochau, Minotti, Platzhirsch Home Living, Harald Menghin, Daybed, Outdoor, Bouclé
      assert.doesNotMatch(s, GERMAN, `${l}: ${s}`);
    }
  }
});

test("Typografie: FR mit geschützten Leerzeichen und « », IT mit «», keine deutschen Anführungszeichen", () => {
  for (const s of allTexts("fr")) {
    assert.doesNotMatch(s, / [:;?!](\s|$)/, `FR normales Leerzeichen vor Satzzeichen: ${s}`);
    assert.doesNotMatch(s, /«(?! )|(?<! )»/, `FR « » ohne geschütztes Leerzeichen: ${s}`);
    assert.doesNotMatch(s, /[„“”]/, `FR mit „“: ${s}`);
    assert.doesNotMatch(s, /\p{L}'\p{L}/u, `FR gerader Apostroph: ${s}`);
  }
  for (const s of allTexts("it")) {
    assert.doesNotMatch(s, /[„“”]/, `IT mit „“: ${s}`);
    assert.doesNotMatch(s, /« | »/, `IT « » mit Leerzeichen: ${s}`);
    assert.doesNotMatch(s, /\p{L}'\p{L}/u, `IT gerader Apostroph: ${s}`);
  }
  assert.equal(makeT("fr")("Konflikt: "), "Conflit : ");
  assert.equal(makeT("fr")("Sie haben in diesem Browser einen Entwurf „{name}“ gespeichert.", { name: "Salon" }), "Vous avez enregistré un brouillon « Salon » dans ce navigateur.");
  assert.equal(makeT("it")("Sie haben in diesem Browser einen Entwurf „{name}“ gespeichert.", { name: "Soggiorno" }), "Avete salvato una bozza «Soggiorno» in questo browser.");
});

test("Claim-Wächter: keine Superlative, Händler- oder Werbeaussagen, keine Preise", () => {
  for (const l of ["fr", "it"]) {
    for (const s of allTexts(l)) {
      assert.deepEqual(findClaims(s, { locale: l }), [], `${l}: ${s}`);
      assert.equal(hasUnprovenClaim(s), false, `${l}: ${s}`);
      assert.doesNotMatch(s, /(€|CHF|EUR)\s?\d|\d\s?(€|CHF|EUR)/, `${l} Preis: ${s}`);
    }
    // Abgrenzung zu Minotti in jeder Sprache (Fix-Runde 1, F2)
    assert.match(DICTS[l].SOURCE.minotti.unabhaengig, l === "fr" ? /non une offre de Minotti/ : /non un’offerta di Minotti/);
    assert.match(DICTS[l].SOURCE.minotti.sourceNote, /Minotti S\.p\.A\./);
    assert.match(DICTS[l].SOURCE.minotti.sourceNote, l === "fr" ? /n’affiche aucun prix/ : /non mostra prezzi/);
  }
});

test("SEO: Titel ≤ 60, Description 120–155, beide Datenquellen", () => {
  for (const l of ["fr", "it"]) {
    const s = sofaSeoIntl(l);
    assert.ok(s.title.length <= 60, `${l} title ${s.title.length}`);
    assert.ok(s.description.length >= 120 && s.description.length <= 155, `${l} description ${s.description.length}`);
    for (const k of ["minotti", "neutral"]) {
      const x = SOFA_PAGE_COPY[l].seo[k];
      assert.ok(x.title.length <= 60, `${l}/${k} title ${x.title.length}`);
      assert.ok(x.description.length >= 120 && x.description.length <= 155, `${l}/${k} description ${x.description.length}`);
    }
  }
});

test("makeT, Datenquelle, Termin- und Übergabe-Link auf FR/IT", () => {
  assert.equal(makeT("fr")("Schritt {n} von 6", { n: 2 }), "Étape 2 sur 6");
  assert.equal(makeT("it")("Schritt {n} von 6", { n: 2 }), "Passo 2 di 6");
  assert.equal(makeT("fr").num(64.5), "64,5");
  assert.equal(makeT("it")("B"), "L");
  assert.equal(makeT("fr").foreign, true);
  assert.equal(makeT("de").foreign, false);
  assert.equal(makeT("de")("Schritt {n} von 6", { n: 2 }), "Schritt 2 von 6");
  assert.equal(makeT("en")("Schritt {n} von 6", { n: 2 }), "Step 2 of 6");
  assert.equal(sourceCopy("fr").pickerLead(90).startsWith("Les 90 familles"), true);
  assert.equal(sourceCopy("it").modelWord, "Modello Minotti");
  assert.match(terminHref("fr"), /^\/fr\/conseil\?/);
  assert.match(terminHref("it"), /^\/it\/consulenza\?/);
  assert.match(handoffHref({ locale: "fr", name: "Lounge", count: 4 }), /^\/fr\/conseil\?produkt=Canap%C3%A9\+Minotti(\+|%C2%A0)%3A\+Lounge%2C\+4\+%C3%A9l%C3%A9ments/);
  assert.equal(handoffProdukt({ name: "Lounge", count: 1, locale: "it" }), "Divano Minotti: Lounge, 1 elemento");
  assert.equal(handoffProdukt({ name: "Lounge", count: 4 }), "Minotti-Sofa: Lounge, 4 Elemente");
  assert.match(handoffSummary({ text: "x", shareUrl: "https://platzhirsch.studio/fr/sofaplaner?p=a", locale: "fr" }), /^Plan de canapé du configurateur de canapé\nx\nOuvrir le plan/);
  assert.deepEqual(leadOptions(LEAD_LAND, "it")[0], ["AT", "Austria"]);
  assert.deepEqual(leadLines({ zeit: "bald", land: "CH" }, "fr"), ["Calendrier : dans les 3 prochains mois", "Pays de livraison : Suisse"]);
  // Review 01.11.: keine Schrägstrich-Mehrzahl (élément(s), elemento/i) und Website-Wörter für Datenschutz/Schreiben
  for (const l of ["fr", "it"]) for (const v of Object.values(DICTS[l].UI)) assert.doesNotMatch(v, /\p{L}\((s|e|en|nt)\)|\p{L}\/(e|i)(?!\p{L})/u, `${l} Mehrzahl mit Klammer/Schrägstrich: ${v}`);
  assert.equal(makeT("fr")("Datenschutzerklärung"), "politique de confidentialité");
  assert.equal(makeT("it")("Lieber schreiben"), "Preferite scrivere");
  const p = sofaPageIntl("fr");
  assert.equal(p.sharedLoaded("Salon", 2), "Plan partagé « Salon » chargé. Les modifications ne concernent que votre affichage. Éléments qui ne figurent plus au catalogue : 2.");
  assert.equal(sofaPageIntl("de"), null);
});

const families = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => normalizeFamily(JSON.parse(readFileSync(new URL(f, DATA_DIR), "utf8"))));

test("Startformen und Modellkarte auf FR/IT (alle Familien), Namen von Minotti unverändert", () => {
  for (const l of ["fr", "it"]) {
    const d = DICTS[l];
    const miss = new Set();
    for (const fam of families) {
      const loc = localizeFamilyIntl({ ...fam, templates: buildTemplates(fam) }, d);
      assert.equal(loc.lang, l);
      for (const t of loc.templates) for (const x of [t.label, t.hint]) if (x && GERMAN.test(x)) miss.add(x);
      assert.doesNotMatch(loc.character, GERMAN, `${fam.slug}: ${loc.character}`);
      // Modellname (Minotti) bleibt, nur Anführungszeichen der Sprache
      assert.equal(loc.name.replace(/[«» “”„"]/g, ""), fam.name.replace(/[«» “”„"]/g, ""));
      // idempotent
      assert.equal(localizeFamilyIntl(loc, d), loc);
    }
    assert.deepEqual([...miss], [], `${l}: deutsche Startformen`);
    const idx = localizeIndexIntl(families.map((f) => ({ slug: f.slug, name: f.name, designer: f.designer, modular: f.modular, outdoor: f.outdoor, sofabed: f.sofabed, character: f.character })), d);
    for (const f of idx) {
      assert.doesNotMatch(f.character, GERMAN);
      if (f.designer) assert.doesNotMatch(f.designer, / (mit|und) /);
    }
  }
});

test("Plan-Prüfungen und Anfrage-Text auf FR/IT ohne deutsche Reste", () => {
  for (const l of ["fr", "it"]) {
    const T = makeT(l);
    const seen = new Set();
    for (const fam of families.slice(0, 40)) {
      const loc = localizeFamilyIntl({ ...fam, templates: buildTemplates(fam) }, DICTS[l]);
      const lookup = makeLookup(loc);
      for (const t of loc.templates) {
        const plan = planFor(loc, t.key, { w: 260, d: 240 }, [{ id: "d1", type: "door", wall: "top", offset: 20, width: 90, sill: 0 }]);
        for (const c of checkPlan(plan, lookup)) {
          const out = T.dyn(c.text);
          seen.add(c.kind);
          assert.doesNotMatch(out, GERMAN, `${l} ${fam.slug}/${t.key} ${c.kind}: ${out}`);
        }
        const text = planToText(plan, loc, `https://platzhirsch.studio/${l}/sofaplaner?p=x`).split("\n").map((x) => T.dyn(x)).join("\n");
        for (const line of text.split("\n")) {
          // Optionsnamen: Herstellerangaben (englisch oder als Deutsch markiert), wie /en
          if (/^(Dossier|Accoudoir|Socle\/pieds|Type de revêtement|Version du revêtement|Schienale|Bracciolo|Base\/piedi|Tipo di rivestimento|Versione del rivestimento|- )/.test(line)) continue;
          assert.doesNotMatch(line, GERMAN, `${l} ${fam.slug}/${t.key}: ${line}`);
        }
      }
    }
    assert.ok(seen.size >= 3, `${l}: nur ${[...seen].join(", ")} geprüft`);
  }
});
