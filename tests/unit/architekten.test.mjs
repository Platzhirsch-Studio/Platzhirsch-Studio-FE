// tests/unit/architekten.test.mjs – Seite Architekten & Bauträger (Welle 2, QA-Nachbesserung).
// Texte DE/EN deckungsgleich, keine Händler-Aussage im Text (nur über
// dealerStatement), keine Antwortfristen, leerer Ansprechperson-Slot,
// Anfrage-Payload passt zum bestehenden Lead-Schema.
// Run: node --test tests/unit/architekten.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANSPRECHPERSON, LOCALES, PATH, architektenCopy, isArchitektenLocale } from "../../src/lib/architekten/copy.js";
import { ANLIEGEN, MUSTER_IDS, anliegenFromParam, buildArchitektPayload, cleanMuster, pageContextOf, validateArchitekt } from "../../src/lib/architekten/lead.js";
import { beratungSchema } from "../../src/lib/forms/schemas.js";
import { dealerStatement, dealerStatementList, findClaims } from "../../src/lib/legal/claims.js";

const de = architektenCopy("de");
const en = architektenCopy("en");

function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}
function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape(value[k])]));
  return typeof value;
}

// Sprachen-Ausbau 01.11.2026 (bewusst geändert): FR und IT sind eigene Fassungen (copy-intl.js).
test("Pfad und Sprachen: DE, EN, FR und IT", () => {
  assert.equal(PATH, "/architekten");
  assert.deepEqual([...LOCALES], ["de", "en", "fr", "it"]);
  for (const l of ["de", "en", "fr", "it"]) assert.ok(isArchitektenLocale(l), l);
  assert.ok(!isArchitektenLocale("es"));
});

test("DE und EN haben dieselbe Struktur", () => {
  const { NOTICE_LANG: _n, ...deRest } = de;
  assert.deepEqual(shape(en), shape(deRest));
});

test("Keine Händler-Aussage als fester Text, Ezarri nur über dealerBrand", () => {
  for (const locale of LOCALES) {
    const all = strings(architektenCopy(locale));
    const hits = all.flatMap((t) => findClaims(t, { locale }));
    assert.deepEqual(hits, [], `${locale}: ${JSON.stringify(hits)}`);
    for (const t of all) assert.doesNotMatch(t, /h(ä|ae)ndler|dealer|authori[sz]ed|offiziell|official/i, t);
    const muster = architektenCopy(locale).ANGEBOT.items.find((i) => i.id === "muster");
    assert.equal(muster.dealerBrand, "ezarri");
  }
  assert.equal(dealerStatement("ezarri", "de"), "Platzhirsch Home Living ist Vertragshändler von Ezarri.");
  assert.equal(dealerStatement("ezarri", "en"), "Platzhirsch Home Living is an Ezarri dealer.");
});

test("dealerStatementList: belegte Marken in einem Satz, unbelegte fallen heraus", () => {
  assert.equal(dealerStatementList(["classicon", "ezarri"], "de"), "Platzhirsch Home Living ist Vertragshändler von ClassiCon und Ezarri.");
  assert.equal(dealerStatementList(["classicon", "ezarri"], "en"), "Platzhirsch Home Living is a ClassiCon and Ezarri dealer.");
  // Inhaber-Entscheidung Nr. 22 (bewusst geändert, 31.10.2026): Minotti ist belegt → unbelegtes Beispiel Poliform.
  assert.equal(dealerStatementList(["poliform", "classicon"], "de"), "Platzhirsch Home Living ist Vertragshändler von ClassiCon.");
  assert.equal(dealerStatementList(["poliform"], "de"), "");
  assert.equal(dealerStatementList(["rimadesio", "agape"], "de"), "");
});

test("Keine Antwortfristen, keine Superlative, keine Preise", () => {
  for (const locale of LOCALES) {
    for (const t of strings(architektenCopy(locale))) {
      assert.doesNotMatch(t, /werktag|working day|innerhalb von \d|within \d+ (hours|days)|24 ?h/i, t);
      assert.doesNotMatch(t, /\b(beste[nrs]?|einzige[nrs]?|führende[nrs]?|best|leading)\b/i, t);
      assert.doesNotMatch(t, /(€|EUR|CHF)\s?\d|\d\s?(€|EUR|CHF)/, t);
    }
  }
});

test("Ansprechperson-Slot ist leer: die Seite nennt nur die Rolle", () => {
  assert.equal(ANSPRECHPERSON, null);
  assert.ok(de.ANGEBOT.contactFallback && en.ANGEBOT.contactFallback);
});

test("Brotkrume: Startseite › Architekten und Bauträger", () => {
  assert.deepEqual(de.CRUMBS.map((c) => c.href ?? null), ["/", null]);
  assert.deepEqual(en.CRUMBS.map((c) => c.label), ["Home", "Architects and developers"]);
});

test("Formular-Texte decken alle Anliegen und Muster ab", () => {
  for (const locale of LOCALES) {
    const c = architektenCopy(locale);
    assert.deepEqual(Object.keys(c.FORM.anliegen.options), [...ANLIEGEN]);
    assert.deepEqual(c.MUSTER.groups.map((g) => g.id), [...MUSTER_IDS]);
  }
});

test("URL-Parameter: nur bekannte Anliegen, Aliasse", () => {
  assert.equal(anliegenFromParam("staging"), "staging");
  assert.equal(anliegenFromParam("Home-Staging"), "staging");
  assert.equal(anliegenFromParam("planer"), "architekt");
  assert.equal(anliegenFromParam("<script>"), null);
  assert.equal(anliegenFromParam(null), null);
  assert.match(pageContextOf("staging"), /Home-Staging/);
  assert.match(pageContextOf("unbekannt"), /Architektur/);
});

test("Musterliste: nur bekannte IDs, ohne Doppelte, feste Reihenfolge", () => {
  assert.deepEqual(cleanMuster(["ezarri", "stoff", "stoff", "xx"]), ["stoff", "ezarri"]);
  assert.deepEqual(cleanMuster("kaputt"), []);
});

const FILLED = { anliegen: "architekt", buero: "Büro Test", projektart: "Wohnanlage", phase: "Entwurf und Einreichung", bedarf: "Möblierung für mehrere Wohnungen", vorname: "Test", nachname: "Person", email: "test@example.com", telefon: "", muster: ["stoff", "ezarri"], merkliste: ["Sofa A"] };

test("Validierung: leere Werte melden alle Pflichtfelder, gefüllte nichts", () => {
  const e = validateArchitekt({});
  for (const k of ["anliegen", "projektart", "phase", "bedarf", "vorname", "nachname", "email"]) assert.ok(e[k], k);
  assert.equal(e.telefon, undefined);
  assert.deepEqual(validateArchitekt(FILLED), {});
  assert.equal(validateArchitekt({ ...FILLED, telefon: "abc" }).telefon, "phone");
});

test("Anfrage: Payload passt zum bestehenden beratungSchema (Lead-Weg)", () => {
  const payload = buildArchitektPayload(FILLED, {
    anliegenLabel: de.FORM.anliegen.options.architekt,
    musterLabels: Object.fromEntries(de.MUSTER.groups.map((g) => [g.id, g.label])),
    lines: de.FORM.lines,
  });
  const parsed = beratungSchema.safeParse(payload);
  assert.ok(parsed.success, JSON.stringify(parsed.error?.issues));
  assert.match(payload.bitte_beschreiben_sie_ihr_vorhaben, /Musterwunsch: Stoffmuster für Polster, Ezarri-Glasmosaik/);
  assert.match(payload.bitte_beschreiben_sie_ihr_vorhaben, /Aus der Merkliste: Sofa A/);
});
