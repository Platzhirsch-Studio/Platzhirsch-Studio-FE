// node --test tests/unit/planer-tools-r4.test.mjs
// QM planer-tools r4: Stil-Finder-Sicherheitsnetz (Firefox: Ergebnis kam nie an),
// Küchenplaner replaceState ohne Router-Neuladen, Scroll-Hinweis der Reiterleiste,
// markierte Startform im Sofaplaner, geschützte Leerzeichen „+ Platte“.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

const { navFallbackDecision, FIRST_CHECK_MS, HARD_LIMIT_MS } = await import("../../src/components/Labs/Stilfinder/navFallback.js");
const { activeTemplateKey, sameComposition } = await import("../../src/lib/sofaplaner/templates.js");
const { keepTogether } = await import("../../src/lib/kuechenplaner/typo.js");

test("Stil-Finder: langsame Client-Navigation wird nie hart abgebrochen", () => {
  const base = { pending: true, moved: false, leaving: false, done: false };
  assert.equal(navFallbackDecision({ ...base, elapsed: 1000 }), "wait");
  // 6 s, Navigation läuft noch (Server rendert) → weiter warten, kein location.assign
  assert.equal(navFallbackDecision({ ...base, elapsed: FIRST_CHECK_MS }), "wait");
  assert.equal(navFallbackDecision({ ...base, elapsed: HARD_LIMIT_MS - 1 }), "wait");
  // letztes Mittel
  assert.equal(navFallbackDecision({ ...base, elapsed: HARD_LIMIT_MS }), "assign");
});

test("Stil-Finder: hängende (nicht mehr laufende) Navigation → einmal hart laden", () => {
  const base = { pending: false, moved: false, leaving: false, done: false };
  assert.equal(navFallbackDecision({ ...base, elapsed: FIRST_CHECK_MS - 1 }), "wait");
  assert.equal(navFallbackDecision({ ...base, elapsed: FIRST_CHECK_MS }), "assign");
  // Adresse schon gewechselt, Seite wird verlassen oder schon erledigt → nichts tun
  assert.equal(navFallbackDecision({ ...base, elapsed: 9000, moved: true }), "stop");
  assert.equal(navFallbackDecision({ ...base, elapsed: 9000, leaving: true }), "stop");
  assert.equal(navFallbackDecision({ ...base, elapsed: 9000, done: true }), "stop");
});

test("Stil-Finder: router.push in einer Transition, kein fester 6-s-Timer mehr", () => {
  const src = read("src/components/Labs/Stilfinder/StilfinderQuiz.js");
  assert.match(src, /startNav\(\(\) => router\.push\(href\)\)/);
  assert.match(src, /navFallbackDecision\(/);
  assert.doesNotMatch(src, /NAV_FALLBACK_MS/);
  assert.doesNotMatch(src, /addEventListener\("beforeunload"/); // bfcache bleibt
});

test("Küchenplaner: replaceState gibt Nexts Verlaufszustand weiter (kein RSC-Abruf je Planänderung)", () => {
  const src = read("src/components/Labs/Kuechenplaner/KuechenplanerApp.js");
  assert.match(src, /window\.history\.replaceState\(window\.history\.state, "",/);
  assert.doesNotMatch(src, /window\.history\.replaceState\(null,/);
});

test("Reiterleiste: Verlauf + Pfeil nur an der Seite mit verdecktem Inhalt", async () => {
  // ScrollStrip.js ist eine Client-Komponente (JSX) – edgeState hier nachgebaut geprüft über den Quelltext
  const src = read("src/components/Labs/Kuechenplaner/ScrollStrip.js");
  const fn = src.match(/export function edgeState[\s\S]*?\n}\n/)[0].replace("export ", "");
  const edgeState = new Function(`${fn}; return edgeState;`)();
  assert.deepEqual(edgeState(0, 300, 300), { l: false, r: false });
  assert.deepEqual(edgeState(0, 300, 500), { l: false, r: true });
  assert.deepEqual(edgeState(100, 300, 500), { l: true, r: true });
  assert.deepEqual(edgeState(200, 300, 500), { l: true, r: false });
  assert.match(read("src/components/Labs/Kuechenplaner/KuechenplanerApp.js"), /<ScrollStrip role="tablist"/);
});

test("Sofaplaner: aktuelle Startform wird erkannt (zuletzt gewählt, sonst eindeutiger Treffer)", () => {
  const T = [
    { key: "gerade", items: [{ code: "A" }, { code: "B" }] },
    { key: "ecke-links", items: [{ code: "A" }, { code: "C" }, { code: "B" }] },
    { key: "ecke-rechts", items: [{ code: "B" }, { code: "C" }, { code: "A" }] },
  ];
  const plan = (...c) => c.map((code, i) => ({ id: String(i), code, x: i * 10, y: 0, rot: 0 }));
  assert.equal(sameComposition(plan("B", "A"), T[0].items), true);
  assert.equal(activeTemplateKey(plan("B", "A"), T), "gerade");
  // Ecke links/rechts: gleiche Elemente → nur mit gemerkter Wahl markiert
  assert.equal(activeTemplateKey(plan("A", "B", "C"), T), null);
  assert.equal(activeTemplateKey(plan("A", "B", "C"), T, "ecke-rechts"), "ecke-rechts");
  // … oder wenn die Anordnung (verschoben) genau einer der beiden entspricht
  const L = [
    { key: "ecke-links", items: [{ code: "E", x: 0, y: 0, rot: 0 }, { code: "S", x: 100, y: 0, rot: 0 }, { code: "S", x: 0, y: 100, rot: 90 }] },
    { key: "ecke-rechts", items: [{ code: "E", x: 200, y: 0, rot: 90 }, { code: "S", x: 100, y: 0, rot: 0 }, { code: "S", x: 200, y: 100, rot: 270 }] },
  ];
  const shifted = L[0].items.map((i, n) => ({ ...i, id: `d${n}`, x: i.x + 80, y: i.y + 5 }));
  assert.equal(activeTemplateKey(shifted, L), "ecke-links");
  // Plan verändert → keine Markierung
  assert.equal(activeTemplateKey(plan("A", "B", "B"), T, "gerade"), null);
  assert.equal(activeTemplateKey([], T), null);
  const src = read("src/components/Labs/Sofaplaner/Planner.js");
  assert.match(src, /aria-current=\{current \? "true" : undefined\}/);
  for (const f of ["ui-en.js", "ui-fr.js", "ui-it.js"]) assert.match(read(`src/lib/sofaplaner/copy/${f}`), /W\("Aktuelle Form", /);
});

test("Küchenplaner-Typografie: „+ Platte“ bleibt zusammen", () => {
  const out = keepTogether("Arbeitshöhe: 95 cm (Sockel 15 + Korpus 78 + Platte)");
  assert.match(out, /78 \+ Platte/);
  assert.match(out, /95 cm/);
});

test("Stil-Finder: Stilname im Hinweis in Anführungszeichen (keine falsche Beugung)", () => {
  assert.match(read("src/lib/stilfinder/intl/de.js"), /hint: "… mit einem Hauch von „\{name\}“\."/);
});

test("Druckansicht: Wandansichten ab sm in voller Kartenbreite, nebeneinander erst ab lg", () => {
  const src = read("src/app/[locale]/kuechenplaner/druck/page.js");
  // QM r5: paarweise nebeneinander ab lg/Druck, Breite ∝ Ansichtsbreite (gleicher Maßstab)
  assert.match(src, /flex min-w-0 flex-col gap-4 lg:flex-row print:flex-row/);
  assert.ok(src.includes("lg:[flex:var(--kp-ev)_1_0%]"));
  assert.match(src, /sm:h-auto sm:max-h-\[420px\] sm:w-full sm:max-w-full/);
});
