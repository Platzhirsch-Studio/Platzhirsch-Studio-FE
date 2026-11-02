// tests/e2e/labs-dreilaender.spec.js — R2-labs-service: Dreiländer-Karte und Preisrechner.
// Run: npx playwright test tests/e2e/labs-dreilaender.spec.js --project=desktop
// Läuft im Desktop-Projekt; die mobilen Fälle setzen ihre Größe selbst (375 px).
import { test, expect } from "@playwright/test";
import { settle } from "./helpers.js";

const PATH = "/de/dreilaender-rechner";

// Wartet, bis die Seite nicht mehr scrollt (smooth scroll, Layout-Nachlauf).
async function scrollSettled(page) {
  await page.waitForFunction(
    () =>
      new Promise((resolve) => {
        const y = scrollY;
        setTimeout(() => resolve(scrollY === y), 250);
      }),
    null,
    { timeout: 10_000 }
  );
}

async function dismissCookies(page) {
  // Der Banner kann unter Last erst nach dem Laden erscheinen: kurz auf ihn warten.
  const btn = page.getByRole("button", { name: "Weiter ohne Einwilligung" }).first();
  try {
    await btn.waitFor({ state: "visible", timeout: 8_000 });
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 5_000 });
  } catch {
    // Kein Banner (Einwilligung schon gesetzt) – weiter.
  }
}

// Unter Last (Sammellauf, Dev-Server kompiliert) kann der erste Abruf dauern:
// eigener, längerer Timeout plus ein Warm-up-Abruf, der Fehler nur protokolliert.
// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): feste URL /de/dreilaender-rechner, indexierbar; /labs → 308.
test("Seite: 200, indexierbar, nur Deutsch", async ({ request }) => {
  test.setTimeout(300_000);
  await request.get(PATH, { timeout: 150_000 }).catch(() => {});
  const res = await request.get(PATH, { timeout: 150_000 });
  expect(res.status()).toBe(200);
  expect(await res.text()).toMatch(/<meta name="robots" content="index, follow"/);
  // R7-P4 (bewusst geändert): Deutsch-only-Seiten leiten aus EN/FR/IT seit Runde 2 per 308 auf /de (?lang=…) um,
  // eine eigene EN-Seite gibt es weiterhin nicht.
  // Sprach-Integration 01.11.2026 (bewusst geändert): /en/dreilaender-rechner ist eine eigene Seite.
  const en = await request.get("/en/dreilaender-rechner", { timeout: 150_000, maxRedirects: 0 });
  expect(en.status()).toBe(200);
  expect(await en.text()).toMatch(/<html[^>]*\blang="en"/);
  expect((await request.get("/de/labs/dreilaender", { maxRedirects: 0, timeout: 150_000 })).status()).toBe(308);
});

test("Wechselkurs-API: Quelle, Datum und Alter sind immer dabei", async ({ request }) => {
  const res = await request.get("/api/labs/wechselkurs");
  const data = await res.json();
  if (res.status() === 503) {
    expect(data.rate).toBeNull();
    return;
  }
  expect(res.status()).toBe(200);
  expect(data).toMatchObject({ base: "EUR", quote: "CHF" });
  expect(data.rate).toBeGreaterThan(0.5);
  expect(data.rate).toBeLessThan(2);
  expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(["ezb", "zwischenspeicher", "festwert"]).toContain(data.source);
  expect(typeof data.stale).toBe("boolean");
  expect(Number.isInteger(data.ageDays)).toBe(true);
});

test("Rechner: Kurshinweis mit Datum sichtbar, Richtwert-Kennzeichnung bleibt", async ({ page }) => {
  await page.goto(PATH);
  await settle(page);
  await dismissCookies(page);
  await expect(page.getByText(/EZB-(Referenzkurs|Kurs) vom \d{2}\.\d{2}\.\d{4}/).first()).toBeVisible();
  await page.getByRole("button", { name: "Rechenweg anzeigen" }).nth(1).click();
  await expect(page.getByText(/Richtwert – Beispielwert/).first()).toBeVisible();
});

test("Live-Region der Preiszusammenfassung wartet, bis das Tippen ruht", async ({ page }) => {
  await page.goto(PATH);
  await settle(page);
  await dismissCookies(page);
  await page.locator("input[name=dl-country][value=DE]").check({ force: true });
  const live = page.locator("#dl-ergebnis > p[aria-live]");
  await expect(live).toContainText("Deutschland");
  const input = page.locator("#dl-rechner-section input[inputmode=decimal]");
  await input.fill("");
  await input.pressSequentially("12000", { delay: 100 });
  await expect(live).not.toContainText("12.000");
  await expect(live).toContainText("12.000", { timeout: 3000 });
});

test.describe("mobil 375 px", () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

  test("Kartenpunkte ≥ 44 px, Bregenz und Rheintal mit Namen antippbar", async ({ page }) => {
    await page.goto(PATH);
    await settle(page);
    await dismissCookies(page);
    await page.locator("svg[aria-labelledby='dl-map-title dl-map-desc']").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-place-button='bregenz'] rect")).toHaveCount(1);
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll("[data-place-button]")].map((g) => {
        const r = g.getBoundingClientRect();
        return { id: g.getAttribute("data-place-button"), w: r.width, h: r.height };
      })
    );
    for (const s of sizes) {
      expect(s.w, s.id).toBeGreaterThanOrEqual(44);
      expect(s.h, s.id).toBeGreaterThanOrEqual(44);
    }
    for (const [id, name] of [
      ["bregenz", "Bregenz"],
      ["rheintal", "Rheintal"],
    ]) {
      await expect(page.locator(`[data-place='${id}'] text`, { hasText: name }).locator("visible=true")).toHaveCount(1);
      const hit = page.locator(`[data-place-button='${id}'] rect`);
      // Vor jedem Tipp: Ziel ins Bild holen und warten, bis nichts mehr scrollt –
      // sonst trifft der Tipp veraltete Koordinaten.
      await hit.scrollIntoViewIfNeeded();
      await scrollSettled(page);
      // Ohne force: Playwright prüft, dass die Mitte des Callouts den Button trifft
      // (keine Label-Ebene darüber).
      const yBefore = await page.evaluate(() => scrollY);
      await hit.tap();
      await expect(page.locator(`[data-place-button='${id}']`)).toHaveAttribute("aria-pressed", "true");
      await scrollSettled(page);
      // Kurzkarte war im Bild → die Karte bleibt stehen.
      expect(Math.abs((await page.evaluate(() => scrollY)) - yBefore), "Seite scrollt nach Tipp").toBeLessThanOrEqual(1);
    }
    await page.locator("svg[aria-labelledby='dl-map-title dl-map-desc']").scrollIntoViewIfNeeded();
    await scrollSettled(page);
    // Hit-Test: Mitte jedes Orts trifft den eigenen Button (Label-Ebene ist mobil durchlässig).
    const misses = await page.evaluate(() =>
      [...document.querySelectorAll("[data-place-button]")]
        .map((g) => {
          const a = g.querySelector("rect") || g.querySelectorAll("circle")[1];
          const r = a.getBoundingClientRect();
          const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          // Treffer außerhalb der Karte (z. B. ein später eingeblendetes Overlay) zählen nicht als Fehler der Karte.
          if (el && !el.closest("svg[aria-labelledby='dl-map-title dl-map-desc']")) return null;
          return el?.closest?.("[data-place-button]") === g ? null : g.getAttribute("data-place-button");
        })
        .filter(Boolean)
    );
    expect(misses).toEqual([]);
  });

  test("Kurzkarte: CTA in eigener Zeile, einzeilig, kein Querscrollen", async ({ page }) => {
    await page.goto(PATH);
    await settle(page);
    await dismissCookies(page);
    await page.locator("#dl-chip-vaduz").click();
    const box = await page.getByRole("button", { name: "Preis für Liechtenstein berechnen" }).first().boundingBox();
    expect(box.height).toBeLessThanOrEqual(48);
    expect(box.width).toBeGreaterThan(280);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});
