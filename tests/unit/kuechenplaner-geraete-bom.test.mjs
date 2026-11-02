// node --test tests/unit/kuechenplaner-geraete-bom.test.mjs
// Küchenplaner × Herstellerkatalog: gewählte Geräte in Stückliste, Zusammenfassung
// (Übergabe an die Beratung) und Druckansicht – mit Status und Produktlink, ohne Preise in der Stückliste.
import { test } from "node:test";
import assert from "node:assert/strict";
import { KATALOG_MARKEN, produkteByWelt } from "../../src/lib/katalog/index.js";
import { buildGeraeteIndex, geraeteSlots, geraetVorwahl, gewaehlteGeraete, kandidaten } from "../../src/lib/kuechenplaner/geraete.js";
import { defaultPlan } from "../../src/components/Labs/Kuechenplaner/planState.js";
import { buildKitchen } from "../../src/components/Labs/Kuechenplaner/geometry.js";
import { summaryLines } from "../../src/components/Labs/Kuechenplaner/pricing.js";
import { buildBom } from "../../src/lib/kuechenplaner/bom.js";

const marken = Object.fromEntries(KATALOG_MARKEN.map((m) => [m.slug, m.name]));
const INDEX = buildGeraeteIndex(produkteByWelt("kuechengeraete"), { heute: "2026-10-31", an: true, marken });
const bySlug = (s) => INDEX.find((g) => g.s === s);
const slot = (m, i = 0) => geraeteSlots(m)[i];

test("Stückliste, Zusammenfassung und Druck: gewähltes Modell mit Status und Produktlink", () => {
  const plan0 = defaultPlan("zeile");
  const { plan, ort } = geraetVorwahl(plan0, bySlug("miele-g-5611-i") || kandidaten(slot({ t: "geschirrspueler", w: 60 }), INDEX, plan0).passt[0]);
  assert.ok(ort, "Gerät eingeplant");
  const rows = buildBom(plan, buildKitchen(plan), INDEX).rows.filter((r) => r.group === "Geräte (Katalogauswahl)");
  assert.equal(rows.length, 1);
  assert.match(rows[0].href, /^\/de\/kuechengeraete\/produkte\//);
  assert.equal(rows[0].status, "passt");
  assert.doesNotMatch(JSON.stringify(rows), /€/, "Stückliste ohne Preise");
  assert.ok(summaryLines(plan, INDEX).some((l) => /^Geräte \(Katalogauswahl\): Geschirrspüler: /.test(l)));
  // ohne Index (Client lädt noch): Slug statt Name, nichts bricht
  assert.ok(buildBom(plan, buildKitchen(plan)).rows.some((r) => r.group === "Geräte (Katalogauswahl)"));
  // Ein Gerät, das nach Änderung nicht mehr passt, bleibt sichtbar und wird gemeldet
  const w45 = { ...plan, runs: { ...plan.runs, [ort.wall]: plan.runs[ort.wall].map((m, k) => (k === ort.i ? { ...m, w: 45 } : m)) } };
  assert.equal(gewaehlteGeraete(w45, INDEX)[0].status, "passtNicht");
});
