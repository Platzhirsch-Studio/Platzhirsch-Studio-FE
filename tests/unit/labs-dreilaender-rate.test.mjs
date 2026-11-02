// tests/unit/labs-dreilaender-rate.test.mjs — R2-labs-service: EUR/CHF-Kurs.
// Run: node --test tests/unit/labs-dreilaender-rate.test.mjs
// Kein Netz: die EZB ist immer eine Attrappe. Regel: nie stillschweigend falsch rechnen.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STALE_DAYS,
  ageDays,
  hasRate,
  parseEcbXml,
  rateNotice,
  resolveEurChf,
} from "../../src/components/Labs/Dreilaender/rate.js";

const NOW = Date.parse("2026-10-26T10:00:00Z");
const FIXED = { rate: 0.9227, date: "2026-10-23" };
const xml = (date, rate) =>
  `<gesmes:Envelope><Cube><Cube time='${date}'><Cube currency='USD' rate='1.08'/><Cube currency='CHF' rate='${rate}'/></Cube></Cube></gesmes:Envelope>`;
const fail = async () => {
  throw new Error("EZB nicht erreichbar");
};
const fmt = { date: (d) => d.split("-").reverse().join("."), rate: (r) => r.toFixed(4).replace(".", ",") };

test("parseEcbXml liest Datum und CHF-Kurs, lehnt Unsinn ab", () => {
  assert.deepEqual(parseEcbXml(xml("2026-10-26", "0.9301")), { rate: 0.9301, date: "2026-10-26" });
  assert.throws(() => parseEcbXml("<html>Wartung</html>"));
  assert.throws(() => parseEcbXml(xml("2026-10-26", "93.01")), "Kurs außerhalb 0,5–2 wird abgelehnt");
  assert.throws(() => parseEcbXml(undefined));
});

test("ageDays zählt Kalendertage, nie negativ", () => {
  assert.equal(ageDays("2026-10-26", NOW), 0);
  assert.equal(ageDays("2026-10-23", NOW), 3);
  assert.equal(ageDays("2026-10-30", NOW), 0);
  assert.equal(ageDays("kaputt", NOW), null);
});

test("EZB erreichbar → Live-Kurs, wird gespeichert", async () => {
  const saved = [];
  const r = await resolveEurChf({
    fetchXml: async () => xml("2026-10-26", "0.9301"),
    readLast: async () => null,
    saveLast: async (e) => saved.push(e),
    fixed: FIXED,
    now: NOW,
  });
  assert.equal(r.source, "ezb");
  assert.equal(r.fallback, false);
  assert.equal(r.rate, 0.9301);
  assert.equal(r.stale, false);
  assert.deepEqual(saved, [{ rate: 0.9301, date: "2026-10-26" }]);
  assert.equal(rateNotice(r, fmt).level, "ok");
});

test("EZB nicht erreichbar → letzter gespeicherter Kurs mit Datum und Hinweis", async () => {
  const warnings = [];
  const r = await resolveEurChf({
    fetchXml: fail,
    readLast: async () => ({ rate: 0.931, date: "2026-10-25" }),
    saveLast: async () => assert.fail("Fallback darf nichts speichern"),
    fixed: FIXED,
    now: NOW,
    warn: (e) => warnings.push(e.message),
  });
  assert.equal(r.source, "zwischenspeicher");
  assert.equal(r.fallback, true);
  assert.equal(r.rate, 0.931);
  assert.equal(r.date, "2026-10-25");
  assert.equal(r.ageDays, 1);
  assert.equal(warnings.length, 1);
  const n = rateNotice(r, fmt);
  assert.equal(n.level, "fallback");
  assert.match(n.text, /25\.10\.2026/);
  assert.match(n.text, /nicht abrufbar/);
});

test("EZB liefert Unsinn (Wartungsseite) → Fallback statt falscher Kurs", async () => {
  const r = await resolveEurChf({
    fetchXml: async () => "<html>Wartung</html>",
    readLast: async () => null,
    saveLast: async () => assert.fail("Unsinn darf nicht gespeichert werden"),
    fixed: FIXED,
    now: NOW,
  });
  assert.equal(r.source, "festwert");
  assert.equal(r.fallback, true);
  assert.equal(r.rate, 0.9227);
  assert.equal(r.stale, false, "3 Tage (Wochenende) gelten noch nicht als alt");
});

test("defekter Zwischenspeicher wird ignoriert, jüngerer Ersatzwert gewinnt", async () => {
  const broken = await resolveEurChf({
    fetchXml: fail,
    readLast: async () => ({ rate: "viel", date: "gestern" }),
    fixed: FIXED,
    now: NOW,
  });
  assert.equal(broken.source, "festwert");

  const older = await resolveEurChf({
    fetchXml: fail,
    readLast: async () => ({ rate: 0.95, date: "2026-09-01" }),
    fixed: FIXED,
    now: NOW,
  });
  assert.equal(older.source, "festwert", "Festwert vom 23.10. ist jünger als Speicherstand vom 01.09.");

  const throwing = await resolveEurChf({
    fetchXml: fail,
    readLast: async () => {
      throw new Error("EACCES");
    },
    fixed: FIXED,
    now: NOW,
  });
  assert.equal(throwing.source, "festwert");
});

test(`Kurs älter als ${STALE_DAYS} Tage → deutliche Warnung mit Alter`, async () => {
  const r = await resolveEurChf({
    fetchXml: fail,
    readLast: async () => ({ rate: 0.94, date: "2026-10-12" }),
    fixed: { rate: 0.95, date: "2026-10-01" },
    now: NOW,
  });
  assert.equal(r.date, "2026-10-12");
  assert.equal(r.stale, true);
  assert.equal(r.ageDays, 14);
  const n = rateNotice(r, fmt);
  assert.equal(n.level, "stale");
  assert.match(n.text, /^Achtung/);
  assert.match(n.text, /vor 14 Tagen/);
  assert.match(n.text, /12\.10\.2026/);
});

test("auch die EZB selbst kann alt sein → als alt gekennzeichnet", async () => {
  const r = await resolveEurChf({
    fetchXml: async () => xml("2026-10-02", "0.9400"),
    readLast: async () => null,
    saveLast: async () => {},
    fixed: FIXED,
    now: NOW,
  });
  assert.equal(r.source, "ezb");
  assert.equal(r.stale, true);
  assert.equal(rateNotice(r, fmt).level, "stale");
});

test("gar kein gültiger Kurs → rate null, kein Rechnen in CHF", async () => {
  const r = await resolveEurChf({
    fetchXml: fail,
    readLast: async () => null,
    fixed: { rate: 0, date: "" },
    now: NOW,
  });
  assert.equal(r.rate, null);
  assert.equal(r.source, "keiner");
  assert.equal(hasRate(r), false);
  const n = rateNotice(r, fmt);
  assert.equal(n.level, "none");
  assert.match(n.text, /rechnen wir deshalb nicht/);
});

test("hasRate prüft Wertebereich und Datum", () => {
  assert.equal(hasRate({ rate: 0.93, date: "2026-10-26" }), true);
  assert.equal(hasRate({ rate: NaN, date: "2026-10-26" }), false);
  assert.equal(hasRate({ rate: 0.93 }), false);
  assert.equal(hasRate(null), false);
});
