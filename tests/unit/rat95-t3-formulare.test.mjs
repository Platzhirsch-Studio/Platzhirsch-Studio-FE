// Rat 9,5 T3 – B10 (B2B-Anfrage in zwei Stufen) und A3 (Bestätigung sichtbar).
// Hotel & Objekt und Architekten: genau vier Pflichtfelder, Details freiwillig,
// Payload passt weiter zum bestehenden beratungSchema (Lead-Weg unverändert),
// keine leeren Zeilen im Anfragetext. Nichts wird gesendet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hotelCopy } from "../../src/lib/hotel/content.js";
import { architektenCopy } from "../../src/lib/architekten/copy.js";
import { EMPTY_QUICK, QUICK_REQUIRED, buildQuickPayload, detailsHaveError, quickText, splitName, validateQuick } from "../../src/components/Hotel/quickInquiry.js";
import { ARCH_REQUIRED, archQuickText, buildArchQuickPayload, validateArchQuick } from "../../src/components/Architekten/quickLead.js";
import { beratungSchema } from "../../src/lib/forms/schemas.js";

const read = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
const LABELS = { topic: "ein Objekt oder Hotel", place: "in einem Hotel oder einer Gastronomie" };

test("splitName: zwei Teile nötig, Vorname darf mehrteilig sein", () => {
  assert.equal(splitName("Erika"), null);
  assert.deepEqual(splitName("  Anna  Maria Muster "), { vorname: "Anna Maria", nachname: "Muster" });
});

for (const locale of ["de", "en", "fr", "it"]) {
  const form = hotelCopy(locale).form;
  const q = quickText(locale);

  test(`Hotel ${locale}: genau vier Pflichtfelder (Haus, Name, E-Mail, Vorhaben)`, () => {
    assert.deepEqual([...QUICK_REQUIRED], ["haus", "name", "email", "nachricht"]);
    assert.deepEqual(Object.keys(validateQuick({ ...EMPTY_QUICK }, form, q)).sort(), ["email", "haus", "nachricht", "name"]);
    // Details sind freiwillig: leer ok, falsches Format nicht
    const ok = { ...EMPTY_QUICK, haus: "Hotel Test", name: "Erika Muster", email: "e@example.com", nachricht: "Zimmer und Lobby neu einrichten" };
    assert.deepEqual(validateQuick(ok, form, q), {});
    const bad = validateQuick({ ...ok, zimmer: "viele", telefon: "abc" }, form, q);
    assert.deepEqual(Object.keys(bad).sort(), ["telefon", "zimmer"]);
    assert.equal(detailsHaveError(bad), true);
    assert.equal(validateQuick({ ...ok, name: "Erika" }, form, q).name, q.errors.nameBoth);
  });

  test(`Hotel ${locale}: Payload passt zum beratungSchema, ohne leere Zeilen`, () => {
    const data = { ...EMPTY_QUICK, haus: "Hotel Test", name: "Erika Muster", email: "e@example.com", nachricht: "Zimmer und Lobby neu einrichten" };
    const body = buildQuickPayload(data, form, LABELS);
    assert.equal(body.vorname, "Erika");
    assert.equal(body.nachname, "Muster");
    assert.ok(beratungSchema.safeParse({ ...body, lead_ref: undefined }).success, JSON.stringify(beratungSchema.safeParse(body).error?.issues));
    const L = form.messageLabels;
    for (const key of ["ort", "art", "zeitfenster"]) assert.doesNotMatch(body.bitte_beschreiben_sie_ihr_vorhaben, new RegExp(`^${L[key]}:\\s*$`, "m"));
    assert.match(body.bitte_beschreiben_sie_ihr_vorhaben, new RegExp(`${L.haus}: Hotel Test`));
    assert.match(body.bitte_beschreiben_sie_ihr_vorhaben, /Zimmer und Lobby neu einrichten/);
    // mit Details bleiben die Zeilen erhalten
    const full = buildQuickPayload({ ...data, ort: "Lech", art: "chalet", zeitfenster: "12" }, form, LABELS);
    assert.match(full.bitte_beschreiben_sie_ihr_vorhaben, new RegExp(`${L.ort}: Lech`));
  });
}

for (const locale of ["de", "en"]) {
  const c = architektenCopy(locale);
  const T = archQuickText(locale);
  test(`Architekten ${locale}: genau vier Pflichtfelder, Projektart/Phase/Anliegen freiwillig`, () => {
    assert.deepEqual([...ARCH_REQUIRED], ["buero", "name", "email", "bedarf"]);
    assert.deepEqual(Object.keys(validateArchQuick({})).sort(), ["bedarf", "buero", "email", "name"]);
    const ok = { buero: "Büro Test", name: "Erika Muster", email: "e@example.com", bedarf: "Möblierung für zwölf Wohnungen" };
    assert.deepEqual(validateArchQuick(ok), {});
    assert.equal(validateArchQuick({ ...ok, name: "Erika" }).name, "nameBoth");
    const body = buildArchQuickPayload(ok, {
      anliegenLabels: c.FORM.anliegen.options,
      musterLabels: {},
      lines: c.FORM.lines,
      notGiven: T.notGiven,
    });
    assert.equal(body.bei_meiner_anfrage_geht_es_um, c.FORM.anliegen.options.architekt);
    assert.equal(body.das_projekt_soll_verwirklicht_werden, T.notGiven);
    assert.doesNotMatch(body.bitte_beschreiben_sie_ihr_vorhaben, new RegExp(`^${c.FORM.lines.phase}:\\s*$`, "m"));
    assert.ok(beratungSchema.safeParse(body).success);
  });
}

test("A3: Hotel- und Architektenformular holen die Bestätigung in den Viewport (focus ohne Sprung + scrollIntoView)", () => {
  const reveal = read("src/components/Landing/revealConfirmation.js");
  assert.match(reveal, /focus\(\{ preventScroll: true \}\)/);
  assert.match(reveal, /scrollIntoView\(\{ block: "start"/);
  assert.match(reveal, /prefers-reduced-motion/);
  assert.match(reveal, /data(set)?\.motion|data-motion/);
  for (const f of ["src/components/Hotel/HotelInquiryForm.js", "src/components/Architekten/ArchitektenForm.js"]) {
    const src = read(f);
    assert.match(src, /revealConfirmation\(/, f);
    assert.match(src, /scroll-mt-\[88px\]/, f);
  }
});
