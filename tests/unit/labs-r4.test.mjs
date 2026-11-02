// tests/unit/labs-r4.test.mjs — R4-portal-labs: Studio-HDR, zod-Bundle, Dreiländer-Callouts.
// Run: node --test tests/unit/labs-r4.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildStudioHdr, parseFlatHdr, radiance, STUDIO_HDR_PATH, STUDIO_HDR_SIZE } from "../../src/components/Labs/ArViewer/studioHdr.js";
import { PLACES } from "../../src/components/Labs/Dreilaender/geo.js";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

test("Studio-HDR: Radiance-Kopf, flache Zeilen, Größe stimmt, deterministisch", () => {
  const a = buildStudioHdr();
  const b = buildStudioHdr();
  assert.deepEqual(a, b);
  const hdr = parseFlatHdr(a);
  assert.equal(hdr.w, STUDIO_HDR_SIZE.w);
  assert.equal(hdr.h, STUDIO_HDR_SIZE.h);
  assert.equal(hdr.length, hdr.start + hdr.w * hdr.h * 4);
  // three.js RGBELoader liest flach, wenn die Zeile nicht mit 2,2 beginnt.
  assert.ok(!(a[hdr.start] === 2 && a[hdr.start + 1] === 2));
  // model-viewer erkennt HDR nur an der Endung.
  assert.match(STUDIO_HDR_PATH, /\.hdr$/);
});

test("Studio-HDR: Decke heller als Boden, Hauptlicht vorne links, keine Punktlichter", () => {
  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  assert.ok(lum(radiance(0, 80)) > lum(radiance(0, -60)) * 2);
  assert.ok(lum(radiance(-40, 32)) > lum(radiance(40, 32)) * 2);
  // Weiche Kanten: 1° neben der Mitte ändert sich das Hauptlicht kaum.
  const d = Math.abs(lum(radiance(-40, 32)) - lum(radiance(-39, 32)));
  assert.ok(d < 0.05, `Kante zu hart (${d})`);
  // Spitzenwert begrenzt (keine "speckigen" Glanzpunkte).
  let max = 0;
  for (let az = -180; az < 180; az += 2) for (let el = -88; el <= 88; el += 2) max = Math.max(max, lum(radiance(az, el)));
  assert.ok(max < 4, `max ${max}`);
});

test("ModelStage: HDR wird vorgeladen, Fallback neutral, kein Fehlerpfad", () => {
  const src = read("src/components/Labs/ArViewer/ModelStage.js");
  assert.match(src, /environment-image=\{envImage \|\| "neutral"\}/);
  assert.match(src, /AbortController/);
  const route = read("src/app/api/labs/ar-viewer/studio-v1.hdr/route.js");
  assert.match(route, /noindex/);
  assert.match(route, /force-static/);
});

test("Bundle: Labs-Clientcode importiert zod nur über den schmalen Re-Export", () => {
  for (const f of ["Dreilaender/calc.js", "Dreilaender/pricing.js", "Dreilaender/rate.js", "Kuechenplaner/planState.js", "Kuechenplaner/ResultPanel.js"]) {
    const src = read(`src/components/Labs/${f}`);
    assert.doesNotMatch(src, /from "zod"/, f);
    assert.match(src, /import \* as z from "\.\.\/zod\.js"/, f);
  }
  assert.doesNotMatch(read("src/components/Labs/zod.js"), /^(import \{ z \}|export \*)/m);
  // Tempo-Runde 30.10.2026: der Sofaplaner nutzt im Browser nur noch zod/mini
  // (noch schmaler als ../zod.js), ebenfalls nur über einen benannten Re-Export.
  for (const f of ["Sofaplaner/model.js", "Sofaplaner/ResultPanel.js"]) {
    const src = read(`src/components/Labs/${f}`);
    assert.doesNotMatch(src, /from "zod"|from "\.\.\/zod\.js"/, f);
    assert.match(src, /import \* as z from "\.\/zod-mini\.js"/, f);
  }
  const mini = read("src/components/Labs/Sofaplaner/zod-mini.js");
  assert.doesNotMatch(mini, /^export \*/m);
  assert.doesNotMatch(mini, /from "zod"/);
  assert.match(mini, /from "zod\/mini"/);
  assert.match(mini, /config\(\{ jitless: true \}\)/);
});

test("Bundle: zod-Re-Export deckt alle genutzten Funktionen ab", async () => {
  const z = await import("../../src/components/Labs/zod.js");
  for (const k of ["array", "boolean", "enum", "literal", "number", "object", "string", "union"]) assert.equal(typeof z[k], "function", k);
  const s = z.object({ a: z.enum(["x"]), n: z.number().min(1) });
  assert.equal(s.safeParse({ a: "x", n: 2 }).success, true);
  assert.equal(s.safeParse({ a: "y", n: 0 }).success, false);
});

test("Dreiländer: Dornbirn mobil als Callout, Lindau ohne Callout", () => {
  const byId = Object.fromEntries(PLACES.map((p) => [p.id, p]));
  assert.ok(byId.dornbirn.callout);
  assert.equal(byId.lindau.callout, undefined);
});

test("Netz: Zeitüberschreitung, Offline-Text, Nutzerabbruch bleibt AbortError", async () => {
  const { fetchWithTimeout, netErrorText, LabsTimeoutError, OFFLINE_TEXT } = await import("../../src/components/Labs/net.js");
  const orig = globalThis.fetch;
  try {
    // Server antwortet nie → nach 50 ms LabsTimeoutError.
    globalThis.fetch = (_u, { signal }) =>
      new Promise((_r, reject) => signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
    await assert.rejects(fetchWithTimeout("/x", {}, 50), (e) => e instanceof LabsTimeoutError);
    // Nutzer bricht ab → AbortError (keine Fehlermeldung in der UI).
    const ctrl = new AbortController();
    const p = fetchWithTimeout("/x", { signal: ctrl.signal }, 5000);
    ctrl.abort();
    await assert.rejects(p, (e) => e.name === "AbortError");
    // Netzwerkfehler → deutsche Meldung statt "Failed to fetch".
    assert.equal(netErrorText(new TypeError("Failed to fetch"), "x"), OFFLINE_TEXT);
    assert.equal(netErrorText(new SyntaxError("Unexpected token <"), "Fallback"), "Fallback");
    assert.equal(netErrorText(new Error("Plan zu groß."), "x"), "Plan zu groß.");
  } finally {
    globalThis.fetch = orig;
  }
});
