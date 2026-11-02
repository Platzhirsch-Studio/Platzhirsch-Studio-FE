// node --test tests/unit/kp-lead-planlink-einmal.test.mjs
// Lead-Übergabe (Küchenplaner-Team, fix-06): Kommt die Planung als ?plan=
// mit, steht der lange Plan-Link nicht zusätzlich im Nachrichtenfeld
// (BeratungClient hängt ihn beim Senden einmal als „Plan: …“ an).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { withoutPlanLine } from "../../src/lib/forms/draft.js";
import { handoffSummary } from "../../src/lib/kuechenplaner/handoff.js";
import { attachmentsOf } from "../../src/lib/forms/beratungContext.js";

const URL_K = "https://platzhirsch.studio/de/kuechenplaner?k=eyJ2IjoyfQ";

test("Plan-Zeile fällt weg, wenn derselbe Plan angehängt ist", () => {
  const text = handoffSummary({ lines: ["Grundform: L-Form · Raster 60 cm", "Raum: Wand A 420 cm"], shareUrl: URL_K });
  const att = attachmentsOf(new URLSearchParams({ plan: URL_K }));
  const out = withoutPlanLine(text, att.plan);
  assert.doesNotMatch(out, /Planung öffnen/);
  assert.match(out, /Raum: Wand A 420 cm/);
  assert.match(out, /^Küchenplanung aus dem 3D-Küchenplaner/);
});

test("Ohne Anlage oder bei anderem Link bleibt der Text unverändert", () => {
  const text = `Sofaplanung aus dem Sofaplaner\nPlan öffnen: ${URL_K}`;
  assert.equal(withoutPlanLine(text, null), text);
  assert.equal(withoutPlanLine(text, "https://platzhirsch.studio/de/sofaplaner?s=1"), text);
  assert.equal(withoutPlanLine(text, URL_K), "Sofaplanung aus dem Sofaplaner");
  // Freitext mit Doppelpunkt, der keine URL ist, bleibt
  assert.equal(withoutPlanLine("Wunsch: Insel mit Bar", URL_K), "Wunsch: Insel mit Bar");
});

test("BeratungClient nutzt withoutPlanLine für die Übergabe", () => {
  const src = readFileSync(new URL("../../src/components/BeratungClient/BeratungClient.js", import.meta.url), "utf8");
  assert.match(src, /withoutPlanLine\(handoff\.text, context\?\.plan \|\| null\)/);
});
