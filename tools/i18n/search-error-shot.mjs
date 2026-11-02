#!/usr/bin/env node
// tools/i18n/search-error-shot.mjs
// R6-i18n: Sichtprüfung der Suchhinweise Navbar.searchRateLimited (HTTP 429)
// und Navbar.searchError (HTTP 500) auf 4 Geräten. /api/shop-search wird im
// Browser abgefangen (kein Serverzustand, keine echten Anfragen ans Backoffice).
//
// Aufruf: node tools/i18n/search-error-shot.mjs <out-dir> [--base=http://localhost:3000]
import fs from "node:fs";
import path from "node:path";
import { chromium, webkit, devices } from "@playwright/test";

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith("--")) || "qa-screenshots/teamleiter/r6-i18n/suche";
const base = args.find((a) => a.startsWith("--base="))?.slice(7) || "http://localhost:3000";
fs.mkdirSync(out, { recursive: true });

const DEVICES = [
  { name: "iphone", browser: webkit, options: devices["iPhone 15 Pro"] },
  { name: "android", browser: chromium, options: devices["Pixel 7"] },
  { name: "ipad", browser: webkit, options: devices["iPad Pro 11"] },
  { name: "desktop", browser: chromium, options: { viewport: { width: 1440, height: 900 } } },
];
const CASES = [
  { locale: "de", status: 429, expect: "Zu viele Suchanfragen" },
  { locale: "it", status: 500, expect: "La ricerca non è disponibile" },
];

const report = [];
for (const d of DEVICES) {
  const browser = await d.browser.launch();
  for (const c of CASES) {
    const ctx = await browser.newContext({ ...d.options, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.route("**/api/shop-search**", (route) => route.fulfill({ status: c.status, contentType: "application/json", body: "{}" }));
    let ok = false;
    let err = "";
    try {
      await page.goto(`${base}/${c.locale}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      const refuse = page.getByRole("button", { name: /ohne Einwilligung|senza consenso/i });
      if (await refuse.isVisible({ timeout: 8000 }).catch(() => false)) await refuse.click();
      const open = page.locator("header").getByRole("button", { name: /such|cerc|search/i }).first();
      const input = page.locator('form[role="search"] input').first();
      // Vor der Hydration (Dev-Server kompiliert) bleibt der Klick wirkungslos: wiederholen.
      for (let i = 0; i < 15 && !(await input.isVisible().catch(() => false)); i++) {
        await open.click({ timeout: 30000 }).catch(() => {});
        await input.waitFor({ state: "visible", timeout: 6000 }).catch(() => {});
      }
      await input.fill("Sofa", { timeout: 30000 });
      await page.getByText(c.expect).first().waitFor({ timeout: 30000 });
      ok = true;
    } catch (e) {
      err = String(e.message || e).split("\n")[0];
    }
    const file = path.join(out, `suche-${c.locale}-${c.status}--${d.name}.png`);
    await page.screenshot({ path: file }).catch(() => {});
    report.push({ device: d.name, locale: c.locale, status: c.status, ok, err, file });
    console.log(`${ok ? "OK  " : "FAIL"} ${d.name} ${c.locale} ${c.status} ${err}`);
    await ctx.close();
  }
  await browser.close();
}
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
process.exit(report.every((r) => r.ok) ? 0 : 1);
