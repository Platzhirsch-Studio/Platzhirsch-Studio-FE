// node --test tests/unit/r8-claims-laender.test.mjs
// R8 (Fix-Team P1-claims, recht P0-2, Inhaber-Entscheidung Nr. 3): Kein
// pauschales Länderversprechen („Lieferung und Montage in ganz Österreich“) auf
// den Markenseiten. resolveShowroomText() ersetzt es durch „auf Wunsch“.
// Datengrundlage: Showroom-Texte ALLER Marken aus dem Backoffice
// (r8-claims-marken.fixture.json, GET marken_data am 28.10.2026), dazu ein
// Live-Teil gegen den Dev-Server (SITEMAP_BASE, Standard localhost:3000).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolveShowroomText } from "../../src/lib/legal/manufacturerText.js";
import { hasCountryPromise, softenCountryPromise } from "../../src/lib/legal/claims.js";

// Live-Teil nur mit ausdrücklich gesetzter SITEMAP_BASE/QA_BASE (R5-Fix P1, technik P1-4):
// ohne Variable kein Abruf, npm test bleibt offline und schnell.
const BASE = process.env.SITEMAP_BASE || process.env.QA_BASE || "";
const { marken } = JSON.parse(readFileSync(new URL("./r8-claims-marken.fixture.json", import.meta.url), "utf8"));
const LOCALES = ["de", "en", "fr", "it"];
const PROMISE = /ganz (Österreich|Deutschland|Europa|der Schweiz)|(österreich|europa|deutschland|welt)weit|throughout (Austria|Europe)|toute l['’]Autriche|in tutta (l['’])?Austria/i;

test("Fixture: alle Marken aus dem Backoffice, Ausgangslage mit Länderversprechen", () => {
  assert.ok(marken.length >= 30, `${marken.length} Marken`);
  // Belegt, dass der Test etwas prüft: die Rohtexte tragen das Versprechen.
  assert.ok(marken.filter((m) => PROMISE.test(m.dealers_description_de || "")).length >= 30);
});

test("Alle Markenseiten (alle Sprachen): kein „ganz Österreich“, kein Länderversprechen", () => {
  for (const m of marken) {
    for (const l of LOCALES) {
      const { title, text } = resolveShowroomText(m, l, undefined, m.name1);
      assert.doesNotMatch(`${title} ${text}`, PROMISE, `${m.name1}/${l}: ${text}`);
      assert.equal(hasCountryPromise(text), false, `${m.name1}/${l}`);
      assert.ok(text.trim().length > 20, `${m.name1}/${l}: Text bleibt stehen`);
    }
  }
});

test("Formulierung nach Entscheidung Nr. 3: „auf Wunsch“ statt Land, Satz bleibt erhalten", () => {
  const minotti = marken.find((m) => m.name1 === "Minotti");
  assert.ok(minotti, "Minotti in der Fixture");
  const { text } = resolveShowroomText(minotti, "de", undefined, "Minotti");
  assert.match(text, /Lieferung und Montage auf Wunsch\./);
  assert.match(text, /In unserer Ausstellung in Lochau/);
});

test("softenCountryPromise: DE/EN/FR/IT, Ketten und Welt-Versprechen", () => {
  const cases = [
    ["… bis zur Lieferung und Montage in ganz Österreich.", "… bis zur Lieferung und Montage auf Wunsch."],
    ["Wir liefern in ganz Österreich und der Schweiz sowie Deutschland.", "Wir liefern auf Wunsch."],
    ["Montage österreichweit.", "Montage auf Wunsch."],
    ["We deliver throughout Austria and Germany.", "We deliver on request."],
    ["Livraison dans toute l’Autriche et la Suisse.", "Livraison sur demande."],
    ["Consegna in tutta l’Europa.", "Consegna su richiesta."],
    ["Ganzheitlich geplant.", "Ganzheitlich geplant."],
  ];
  for (const [input, want] of cases) assert.equal(softenCountryPromise(input), want, input);
});

test("Live: Markenseiten Minotti, ClassiCon, Flos ohne „ganz Österreich“", async (t) => {
  for (const slug of ["minotti", "classicon", "flos"]) {
    let html;
    try {
      const res = await fetch(`${BASE}/de/ueber-uns/marken/${slug}`, { signal: AbortSignal.timeout(180000) });
      if (res.status !== 200) return t.skip(`${slug}: HTTP ${res.status}`);
      html = await res.text();
    } catch (e) {
      return t.skip(`dev server not reachable at ${BASE}: ${e.message}`);
    }
    assert.doesNotMatch(html, /ganz Österreich/, slug);
  }
});
