// node --test tests/unit/sofaplaner-minotti.test.mjs
// Sofaplaner auf echten Minotti-Daten: Katalog vollständig und ohne erfundene
// Maße, Anschlussregeln (links/rechts, Ecke, Linie, Sitzmodul), Startformen
// gültig, Plan-Schema v2, Anfrage-Text ohne Preise.
import { test } from "node:test";
import assert from "node:assert/strict";
import { SOURCE_COPY } from "../../src/lib/sofaplaner/consent.js";
import { readFileSync, readdirSync } from "node:fs";
import { analyzeJoins, dockCandidate, findDock, joinIssue, topology } from "../../src/lib/sofaplaner/geometry.js";
import { germanLabel, normalizeFamily } from "../../src/lib/sofaplaner/normalize.js";
import { buildTemplates } from "../../src/lib/sofaplaner/templates.js";
import { checkPlan, makeLookup, overlappingPairs, planFor, planSchema, planToText, resolvePlan } from "../../src/components/Labs/Sofaplaner/model.js";

const DIR = new URL("../../src/lib/sofaplaner/minotti/", import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
const raws = new Map(files.map((f) => [f, JSON.parse(readFileSync(new URL(f, DIR), "utf8"))]));
const families = new Map([...raws].map(([f, j]) => [f, normalizeFamily(j)]));
const withTemplates = (fam) => ({ ...fam, templates: buildTemplates(fam) });

test("alle Familien werden gelesen, jede hat platzierbare Elemente", () => {
  assert.ok(files.length >= 90, `nur ${files.length} Familien`);
  for (const [f, fam] of families) {
    assert.ok(fam.elements.length > 0, f);
    assert.ok(fam.elements.some((e) => e.role !== "acc" && e.w && e.d), `${f}: kein platzierbares Element`);
    assert.ok(fam.sources.every((u) => /^https?:\/\//.test(u)), `${f}: Quelle ohne URL`);
  }
});

test("Elementcodes sind je Familie eindeutig", () => {
  for (const [f, fam] of families) {
    const codes = fam.elements.map((e) => e.code);
    assert.equal(new Set(codes).size, codes.length, f);
  }
});

test("keine erfundenen Maße: jede Zahl stammt 1:1 aus der Recherche-Datei", () => {
  for (const [f, j] of raws) {
    const fam = families.get(f);
    const bySrc = new Map(j.elemente.map((e) => [String(e.code ?? e.id), e]));
    for (const el of fam.elements) {
      const src = bySrc.get(el.code.replace(/-(SX|DX)$/, "")) || bySrc.get(el.code);
      assert.ok(src, `${f}: ${el.code} ohne Quelle`);
      const pos = (v) => (typeof v === "number" && v > 0 ? v : null);
      assert.equal(el.w, pos(src.breite_cm) ?? pos(src.durchmesser_cm), `${f} ${el.code} Breite`);
      assert.equal(el.d, pos(src.tiefe_cm) ?? pos(src.durchmesser_cm), `${f} ${el.code} Tiefe`);
      assert.equal(el.h, pos(src.hoehe_cm), `${f} ${el.code} Höhe`);
      assert.equal(el.sh, pos(src.sitzhoehe_cm), `${f} ${el.code} Sitzhöhe`);
      for (const k of el.missing) assert.equal(el[k], null, `${f} ${el.code} ${k} als fehlend markiert`);
    }
  }
});

test("SX/DX: Elemente mit beiden Seiten werden zu zwei Varianten, Endelemente haben genau eine Anschlussseite", () => {
  const connery = families.get("connery.json");
  const sx = connery.elements.find((e) => e.code === "CON83-END-192-SX");
  const dx = connery.elements.find((e) => e.code === "CON83-END-192-DX");
  assert.ok(sx && dx);
  assert.deepEqual(topology(sx).open, ["right"]);
  assert.deepEqual(topology(sx).closed, ["left"]);
  assert.deepEqual(topology(dx).open, ["left"]);
  const orion = families.get("orion.json");
  const twin = orion.elements.filter((e) => e.side && e.group === orion.elements.find((x) => x.side === "SX" && x.role === "end").group);
  assert.equal(new Set(twin.map((e) => e.side)).size, 2);
});

test("Andocken: Endelement links + Endelement rechts, Rücken bündig, keine offene Seite", () => {
  const fam = families.get("connery.json");
  const lookup = makeLookup(fam);
  const sx = lookup("CON83-END-192-SX");
  const dx = lookup("CON83-END-192-DX");
  const a = { id: "a", code: sx.code, x: 96, y: 51, rot: 0, w: sx.w, d: sx.d };
  const r = findDock([a], lookup, [dx, sx], { makeId: () => "b" });
  assert.ok(r.item, r.reason);
  assert.equal(r.item.code, dx.code, "die rechte Variante wird gewählt");
  assert.equal(r.item.y, a.y);
  assert.equal(r.item.x, a.x + sx.w / 2 + dx.w / 2);
  const { joins, free, clashes } = analyzeJoins([a, r.item], lookup);
  assert.equal(joins.length, 1);
  assert.equal(free.length, 0);
  assert.equal(clashes.length, 0);
});

test("Andocken an die Ecke: der Schenkel wird gedreht, Rücken an der Wand", () => {
  const fam = families.get("connery.json");
  const lookup = makeLookup(fam);
  const corner = fam.elements.find((e) => e.role === "corner" && e.w && e.d);
  const end = lookup("CON83-END-192-SX");
  const c = { id: "c", code: corner.code, x: corner.w / 2, y: corner.d / 2, rot: 0, w: corner.w, d: corner.d };
  const leg = dockCandidate(c, corner, "bottom", end, 270, "right");
  assert.ok(leg, "Schenkel unter der Ecke");
  assert.equal(leg.x - end.d / 2, 0, "bündig an der linken Wand");
  assert.equal(leg.y - end.w / 2, corner.d, "direkt unter der Ecke");
});

test("ungültig: Armlehne an Anschlussseite und gemischte Linien werden erkannt", () => {
  const fam = families.get("connery.json");
  const lookup = makeLookup(fam);
  const sx = lookup("CON83-END-192-SX");
  // two SX ends: the open side of the first meets the ARM of the second
  const a = { id: "a", code: sx.code, x: 96, y: 51, rot: 0, w: sx.w, d: sx.d };
  const b = { id: "b", code: sx.code, x: 96 + sx.w, y: 51, rot: 0, w: sx.w, d: sx.d };
  const checks = checkPlan({ room: { w: 600, d: 400 }, items: [a, b], openings: [] }, lookup);
  assert.ok(checks.some((c) => c.level === "error" && c.kind === "join"), "Armlehne an Anschluss = Konflikt");
  // line and seat module rules
  const m83 = fam.elements.find((e) => e.module === 83 && e.role === "mid");
  const m68 = fam.elements.find((e) => e.module === 68 && e.role === "mid");
  assert.equal(joinIssue(m83, m68)?.code, "module");
  assert.equal(joinIssue({ ...m83, line: "LOW" }, { ...m83, line: "HIGH" })?.code, "line");
  assert.equal(joinIssue(m83, m83), null);
});

test("Startformen aller Familien sind gültige Kompositionen (keine Überlappung, kein Konflikt, keine offene Seite)", () => {
  let count = 0;
  for (const [f, fam] of families) {
    const lookup = makeLookup(fam);
    for (const t of buildTemplates(fam)) {
      count += 1;
      assert.equal(overlappingPairs(t.items).length, 0, `${f} ${t.key}`);
      const { joins, clashes, free } = analyzeJoins(t.items, lookup);
      assert.equal(clashes.length, 0, `${f} ${t.key} Armlehne an Anschluss`);
      assert.equal(free.length, 0, `${f} ${t.key} offene Seite`);
      assert.ok(joins.every((j) => j.issue?.level !== "error"), `${f} ${t.key} ungültige Verbindung`);
    }
  }
  assert.ok(count > 250, `nur ${count} Startformen`);
});

test("Modulare Familien mit Ecke bieten Ecke links/rechts; Plan v2 besteht das Schema", () => {
  const fam = withTemplates(families.get("dylan.json"));
  const keys = fam.templates.map((t) => t.key);
  for (const k of ["gerade", "ecke-links", "ecke-rechts", "u"]) assert.ok(keys.includes(k), k);
  const plan = planFor(fam, "ecke-rechts");
  const parsed = planSchema.safeParse(JSON.parse(JSON.stringify(plan)));
  assert.ok(parsed.success);
  assert.equal(planSchema.safeParse({ ...plan, v: 1 }).success, false, "alte v1-Pläne werden nicht geladen");
  const lookup = makeLookup(fam);
  assert.equal(checkPlan(plan, lookup).filter((c) => c.level === "error").length, 0);
});

test("resolvePlan entfernt unbekannte Codes und übernimmt Maße aus dem Katalog", () => {
  const fam = withTemplates(families.get("connery.json"));
  const plan = planFor(fam);
  const tampered = { ...plan, items: [...plan.items.map((i) => ({ ...i, w: 999 })), { id: "x", code: "GIBT-ES-NICHT", x: 10, y: 10, rot: 0, w: 50, d: 50 }] };
  const { plan: p, dropped } = resolvePlan(tampered, fam);
  assert.equal(dropped, 1);
  const lookup = makeLookup(fam);
  assert.ok(p.items.every((i) => i.w === lookup(i.code).w));
});

test("Anfrage-Text: Modell beschreibend, Elemente mit Seite, keine Preise", () => {
  const fam = withTemplates(families.get("connery.json"));
  const text = planToText(planFor(fam, "ecke-links"), fam, null);
  // R7-P4 (neuland P0-1, bewusst geändert): Modellwort hängt an MINOTTI_DATA_CONSENT („Minotti-Modell“ bzw. „Sofa-Typ“)
  assert.ok(text.includes(`Modell: ${SOURCE_COPY.modelWord} Connery`), text);
  assert.match(text, /Abschluss (links|rechts)/);
  assert.match(text, /Showroom/);
  assert.doesNotMatch(text, /\d\s?(EUR|€)|€\s?\d/);
  assert.doesNotMatch(text, /Händler|autorisiert/i);
});

test("deutsche Elementnamen für englische Herstellerbezeichnungen", () => {
  assert.equal(germanLabel("ELEMENT WITH ONE ARMREST LOW CM 152"), "Endelement mit Armlehne Low 152 cm");
  assert.equal(germanLabel("Double couch cm 140x181 - SEAT CUSHION 68 CM"), "Doppel-Couch 140 × 181 cm - Sitzkissen 68 cm");
});
