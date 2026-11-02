// node --test tests/unit/kp-lead-druck.test.mjs
// Lead-Übergabe (Küchenplaner-Team, fix-05): Die Druckansicht führt zum Termin
// mit genau dieser Planung und verlinkt im PDF die Planung selbst (nicht nur
// die Startseite des Planers).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { handoffHref } from "../../src/lib/kuechenplaner/handoff.js";
import { defaultPlan, encodePlan } from "../../src/components/Labs/Kuechenplaner/planState.js";

const src = readFileSync(new URL("../../src/app/[locale]/kuechenplaner/druck/page.js", import.meta.url), "utf8");

test("Druckansicht: Termin-Knopf und Plan-Link nur bei echter Planung", () => {
  assert.match(src, /const planUrl = decoded \? `\$\{SITE_URL\}\$\{back\}` : "";/);
  assert.match(src, /handoffHref\(\{ locale, lines, shareUrl: planUrl, calendar: ownCalendarActive\(\), t \}\)/);
  assert.match(src, /data-kp-print-termin=""/);
  assert.match(src, /<a href=\{planUrl\}[^>]*data-kp-print-plan=""/);
});

test("Termin-Link der Druckansicht trägt den Plan (?plan=) und das Thema Küche", () => {
  const planUrl = `https://platzhirsch.studio/de/kuechenplaner?k=${encodePlan(defaultPlan("l"))}`;
  const u = new URL(handoffHref({ locale: "de", lines: ["Grundform: L-Form · Raster 60 cm"], shareUrl: planUrl }), "https://platzhirsch.studio");
  assert.equal(u.pathname, "/de/beratung");
  assert.equal(u.searchParams.get("plan"), planUrl);
  assert.equal(u.searchParams.get("thema"), "kueche");
});
