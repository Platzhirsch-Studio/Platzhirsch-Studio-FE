// tests/unit/r4-portal.test.mjs — R4-portal-labs: Upload ohne FocusShell, N6, A5.
// Run: node --test tests/unit/r4-portal.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const exists = (p) => fs.existsSync(new URL(`../../${p}`, import.meta.url));

test("Upload: FocusShell entfernt, Rahmen ohne Cover, inert oder eigenes Logo", () => {
  assert.equal(exists("src/components/Upload/FocusShell.js"), false);
  const frame = read("src/components/Upload/UploadFrame.js");
  assert.doesNotMatch(frame, /import FocusShell|<FocusShell/);
  assert.doesNotMatch(frame, /fixed inset-0|setAttribute\("inert"|Logo\.png/);
  // Eigene Rechts-Navigation bleibt (BareShell blendet ihre Fußzeile dann aus).
  assert.match(frame, /aria-label="Rechtliches"/);
  // Die Shell liefert die schlanke Kopfzeile für /upload.
  assert.match(read("src/app/[locale]/client-layout.js"), /BARE_ROUTES = \['upload'\]/);
  assert.match(read("src/components/Reusable/BareShell.js"), /data-shell="bare"/);
});

test("N6: Dokumente – Zahlung und Projekt als Auswahl statt Chip-Reihen", () => {
  const page = read("src/app/[locale]/portal/dokumente/page.js");
  assert.match(page, /<FilterSelects/);
  assert.doesNotMatch(page, /label="Zahlungsstatus"/);
  assert.doesNotMatch(page, /label="Projekt"/);
  assert.equal((page.match(/<FilterChips/g) || []).length, 1);
  const sel = read("src/components/Portal/Docs/FilterSelects.js");
  assert.match(sel, /method="get"/); // funktioniert ohne JavaScript
  assert.match(sel, /<noscript>/);
  assert.match(sel, /appearance-none/); // WebKit-Systemfläche (rund, grau) aus; Radius 0 aus dem Preflight
  assert.match(sel, /htmlFor=/);
});

test("A5: mobile Portal-Leiste weicht der Cookie-Leiste aus", () => {
  assert.match(read("src/components/Portal/Core/PortalNav.js"), /bottom-\[var\(--ph-consent-h,0px\)\]/);
});

test("Portal-Seiten bleiben noindex", () => {
  for (const p of ["portal/dokumente/page.js", "portal/layout.js"]) {
    const src = read(`src/app/[locale]/${p}`);
    if (/metadata/.test(src)) assert.match(src, /index: false/, p);
  }
});
