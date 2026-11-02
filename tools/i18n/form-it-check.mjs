#!/usr/bin/env node
// tools/i18n/form-it-check.mjs
// Live-Prüfung (R4-i18n, QA P2-1): leeres Absenden des Kontaktformulars auf
// /it/contatto; Fehlertexte müssen aus forms.* (tu-Form) kommen, nicht aus FORM_TEXT.
// Aufruf: node tools/i18n/form-it-check.mjs [base] [outDir]
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] || "http://localhost:3000";
const out = process.argv[3] || "qa-screenshots/teamleiter/r4-R4-i18n/fix/form";
const LEI = /(?<![\p{L}])(?:Lei|il Suo|la Sua|le Sue|i Suoi|La preghiamo|Inserisca|Indichi|Controlli|Scelga|Chieda|voi|vostr[aeio])(?![\p{L}])/u;
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(`${base}/it/contatto`, { waitUntil: "networkidle", timeout: 120000 });
for (const label of ["Continua senza consenso", "Accetta tutti"]) {
  const b = page.getByRole("button", { name: label });
  if (await b.count()) { await b.first().click().catch(() => {}); break; }
}
const form = page.locator("form").filter({ has: page.locator('button[type="submit"]') }).first();
await form.scrollIntoViewIfNeeded();
await form.locator('button[type="submit"]').first().click();
await page.waitForTimeout(800);
const invalid = await form.locator('[aria-invalid="true"]').count();
const focused = await page.evaluate(() => {
  const a = document.activeElement;
  return a ? `${a.tagName.toLowerCase()}${a.id ? "#" + a.id : ""}${a.getAttribute("role") ? "[role=" + a.getAttribute("role") + "]" : ""}` : null;
});
const texts = await page.evaluate(() =>
  [...document.querySelectorAll('[role="alert"], [aria-live] *, [id$="-error"], [id*="error"]')]
    .map((e) => e.textContent.trim()).filter(Boolean)
);
const uniq = [...new Set(texts)];
const lei = uniq.filter((t) => LEI.test(t));
await page.screenshot({ path: path.join(out, "it-contatto-leer-absenden.png"), fullPage: false });
const result = { url: `${base}/it/contatto`, invalid, focused, texts: uniq, lei };
fs.writeFileSync(path.join(out, "form-it.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(invalid > 0 && lei.length === 0 ? 0 : 1);
