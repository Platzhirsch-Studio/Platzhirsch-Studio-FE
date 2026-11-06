// /de/bewerten – Übersicht und Formular (Website-Anbindung Runde 2, Punkt 4).
// Der Dev-Server läuft ohne Gruppe "bewertung" auf ph: Übersicht im Leerzustand
// (keine Zahlen, kein Durchschnitt), kein Formular, Google-Link zuerst.
// Jeder POST an /de/bewerten/senden wird im Browser abgefangen; nichts geht an ein Backend.
// Desktop-Projekt: PW_WORKERS=1 npx playwright test tests/e2e/bewerten.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, measureOverflow } from "./helpers.js";

const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "nur Desktop");
});

async function guardSends(page) {
  const sent = [];
  await page.route("**/bewerten/senden", (route) => {
    sent.push(route.request().method());
    return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ success: false, code: "blocked_by_test" }) });
  });
  return sent;
}

test("Leerzustand ohne Zahlen, kein Formular im alt-Modus, Google-Link vor der Übersicht", async ({ page }) => {
  const sent = await guardSends(page);
  const res = await page.goto("/de/bewerten", { waitUntil: "load" });
  expect(res.status()).toBe(200);
  await dismissCookieBanner(page, 3000);
  const liste = page.locator("[data-bewertung-liste]");
  await expect(liste).toBeVisible();
  await expect(liste.getByRole("heading", { level: 2 })).toHaveText("Bewertungen unserer Kundinnen und Kunden");
  await expect(page.locator("[data-bewertung-leer]")).toBeVisible();
  await expect(page.locator("[data-bewertung-schnitt]")).toHaveCount(0);
  await expect(liste.locator("li")).toHaveCount(0);
  await expect(page.locator("[data-bewertung-form]")).toHaveCount(0);
  const order = await page.evaluate(() => {
    const g = [...document.querySelectorAll("main a")].find((a) => /Auf Google bewerten/.test(a.textContent));
    const l = document.querySelector("[data-bewertung-liste]");
    return Boolean(g && l && g.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order, "Übersicht steht nach dem Google-Link").toBe(true);
  expect(sent).toEqual([]);
});

test("Absende-Route sendet im alt-Modus nichts (403 ohne Herkunft, sonst 404 not_available)", async ({ request, baseURL }) => {
  const foreign = await request.post("/de/bewerten/senden", { data: { sterne: 5 }, headers: { Origin: "https://fremd.example" } });
  expect(foreign.status()).toBe(403);
  const own = await request.post("/de/bewerten/senden", { data: { sterne: 5, _t: 5000 }, headers: { Origin: new URL(baseURL).origin } });
  expect([403, 404]).toContain(own.status());
  expect(own.headers()["cache-control"] || "").toMatch(/no-store/);
});

test("axe WCAG 2.2 AA ohne ernste Befunde, 375 px ohne Überlauf", async ({ page }) => {
  await guardSends(page);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/de/bewerten", { waitUntil: "load" });
  await dismissCookieBanner(page, 3000);
  const o = await measureOverflow(page);
  expect(o.sw, JSON.stringify(o.wide)).toBeLessThanOrEqual(o.vw + 1);
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
