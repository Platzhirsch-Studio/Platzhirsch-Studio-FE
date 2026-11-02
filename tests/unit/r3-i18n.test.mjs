// tests/unit/r3-i18n.test.mjs
// R3-i18n: Messages gültig, Sprachen vollständig, IT-Anrede "tu", keine
// Prüfwörter (Superlative/Alleinstellung), keine verwaisten Namespaces,
// Werkzeuge (Merge, Rohschlüssel-Erkennung) verhalten sich wie dokumentiert.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { LOCALES, deepMerge, leaves, messagesPath, readMessages, serialize } from "../../tools/i18n/lib.mjs";
import { scanMessages } from "../../tools/i18n/claims-words.mjs";
import { findRawKeys, htmlTexts } from "../../tools/i18n/raw-keys.mjs";
import { analyse } from "../../tools/i18n/orphans.mjs";
import { placeholders } from "../../tools/i18n/apply-patch.mjs";
import { findClaims } from "../../src/lib/legal/claims.js";

const msgs = Object.fromEntries(LOCALES.map((l) => [l, readMessages(l)]));
const flat = Object.fromEntries(LOCALES.map((l) => [l, new Map(leaves(msgs[l].data))]));

test("alle 4 Dateien sind gültiges JSON im Bestandsformat (2 Leerzeichen, Zeilenumbruch am Ende)", () => {
  for (const l of LOCALES) {
    const src = fs.readFileSync(messagesPath(l), "utf8");
    assert.equal(src, serialize(JSON.parse(src), msgs[l].eol), `${l}.json weicht vom Format ab`);
  }
});

test("EN/FR/IT haben jeden deutschen Schlüssel und keinen zusätzlichen", () => {
  const de = [...flat.de.keys()];
  for (const l of ["en", "fr", "it"]) {
    assert.deepEqual(de.filter((k) => !flat[l].has(k)), [], `${l}: fehlende Schlüssel`);
    assert.deepEqual([...flat[l].keys()].filter((k) => !flat.de.has(k)), [], `${l}: Schlüssel ohne DE`);
  }
});

test("Platzhalter stimmen in allen Sprachen mit DE überein", () => {
  const bad = [];
  for (const [k, v] of flat.de) {
    if (typeof v !== "string") continue;
    for (const l of ["en", "fr", "it"]) {
      const o = flat[l].get(k);
      if (typeof o === "string" && placeholders(o) !== placeholders(v)) bad.push(`${l}:${k}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("R2-Vorschläge (Leads, SEO) sind vollständig übernommen", () => {
  for (const f of ["messages-r2-leads.json", "messages-r2-seo.json"]) {
    const p = JSON.parse(fs.readFileSync(new URL(`../../Marktresearch/digital/teamleiter/${f}`, import.meta.url), "utf8"));
    for (const l of LOCALES) {
      for (const [k] of leaves(p[l])) assert.ok(flat[l].has(k), `${f} ${l}:${k} fehlt`);
    }
  }
});

// Runde 4 (P2 Sprache, gesamtwerk P1-3 / recht P1-5): IT steht jetzt einheitlich
// in der voi-Form (tools/i18n/patches/r4-p2-it-voi.json); Lei bleibt ausgeschlossen.
test("IT: Einzelansprache durchgehend mit „voi“ (keine Lei-Formen in gelesenen Texten)", () => {
  const LEI = /(?<![\p{L}])(?:Lei|La preghiamo|La contatteremo|La ricontattiamo|ci chiami|ci scriva|ci contatti|Controlli|Compili|Scelga|Indichi|Inserisca|Selezioni|Descriva|Riprovi|Prenoti|Chieda|Si accomodi|Preferisce|il Suo|la Sua|i Suoi|le Sue|il suo progetto|la sua richiesta|i suoi dati)(?![\p{L}])/u;
  const hits = [...flat.it].filter(([, v]) => typeof v === "string" && LEI.test(v)).map(([k]) => k);
  assert.deepEqual(hits, []);
  // Höfliches Objektpronomen am Satzanfang, z. B. „La consigliamo …“
  const CLITIC = /(?:^|[.!?:]\s+)(?:La|Le) [a-zàèéìòù]+(?:iamo|remo)(?![\p{L}])/u;
  assert.deepEqual([...flat.it].filter(([, v]) => typeof v === "string" && CLITIC.test(v)).map(([k]) => k), []);
  // r7-p1 (ux P1-6): no vague "a breve" promise; the confirmation names the next steps.
  assert.equal(flat.it.get("MultiStepForm.thankYou"), "Grazie per la vostra richiesta. Vi ricontatteremo personalmente.");
  assert.equal(flat.it.get("ui.leitsatz"), "Accomodatevi.");
});

test("keine offenen Prüfwörter (Design-Bibel) und keine Claim-Funde in den Messages", () => {
  const open = scanMessages().filter((h) => !h.allowed);
  assert.deepEqual(open.map((h) => `${h.locale}:${h.key}:${h.word}`), []);
  const claims = [];
  for (const l of LOCALES) for (const [k, v] of flat[l]) if (typeof v === "string" && findClaims(v).length) claims.push(`${l}:${k}`);
  assert.deepEqual(claims, []);
});

// R6-i18n: Die Zahl „35“ hatte keinen Beleg (check-facts) und ist gestrichen.
test("Home.trust1 ohne „Premium“ und ohne unbelegte Zahl (R6)", () => {
  assert.equal(flat.de.get("Home.trust1"), "Internationale Designmarken");
  for (const l of LOCALES) {
    assert.doesNotMatch(flat[l].get("Home.trust1"), /[0-9]/, l);
    assert.doesNotMatch(flat[l].get("Home.trust1"), /premium/i, l);
  }
});

test("gelöschte Namespaces bleiben gelöscht; Verwaisten-Analyse läuft", () => {
  const backup = JSON.parse(
    fs.readFileSync(new URL("../../qa-screenshots/teamleiter/r3-i18n/geloescht-namespaces.json", import.meta.url), "utf8"),
  );
  const gone = [...backup.namespaces, ...backup.namespaces2_handgeprueft];
  for (const l of LOCALES) for (const ns of gone) assert.equal(msgs[l].data[ns], undefined, `${l}:${ns}`);
  // Neue Waisen entstehen, wenn andere Pakete Leser umbauen (z. B. JobsDetails
  // nach dem Karriere-Umbau). Sie werden gelistet, nicht automatisch gelöscht.
  const r = analyse();
  assert.ok(Array.isArray(r.orphanNamespaces) && Array.isArray(r.noTranslationReader));
});

test("deepMerge: bestehende Werte bleiben, Konflikte werden gemeldet, _-Schlüssel übersprungen", () => {
  const dst = { a: { b: "alt", c: "gleich" } };
  const r = deepMerge(dst, { _hinweis: "x", a: { b: "neu", c: "gleich", d: "dazu" } });
  assert.deepEqual(dst, { a: { b: "alt", c: "gleich", d: "dazu" } });
  assert.deepEqual(r.added, ["a.d"]);
  assert.deepEqual(r.same, ["a.c"]);
  assert.equal(r.conflicts[0].path, "a.b");
});

test("Rohschlüssel-Erkennung: findet Pfade, ignoriert Domains, Mails und Fließtext", () => {
  const ns = new Set(["HomePage", "Home", "contact"]);
  const html = `<html><head><title>HomePage.hero.title</title><meta name="description" content="ok"></head>
    <body><img alt="contact.mapTitle"><p>Mail: marketing@platzhirsch.studio · platzhirsch.cafe</p>
    <p>Platzhirsch Home.Living in Lochau</p><p>Version 1.2</p></body></html>`;
  const keys = findRawKeys(htmlTexts(html), ns).map((h) => h.key);
  assert.deepEqual(keys.sort(), ["HomePage.hero.title", "contact.mapTitle"]);
});

test("IT: kein „consigliare su“, CTAs im Imperativ (R3-Fix; seit Runde 4 voi)", () => {
  const BAD = /consigliamo su|\b(?:Scegliere|Prenotare) (?:un appuntamento|l’immagine)/iu;
  assert.deepEqual([...flat.it].filter(([, v]) => typeof v === "string" && BAD.test(v)).map(([k]) => k), []);
  assert.match(flat.it.get("Marken.introShowroom") ?? [...flat.it].find(([k]) => k.endsWith("introShowroom"))[1], /^Vi offriamo consulenza su \{brand\}/);
});
