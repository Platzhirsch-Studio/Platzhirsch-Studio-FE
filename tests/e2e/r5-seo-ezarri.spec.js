// tests/e2e/r5-seo-ezarri.spec.js – Runde 4 P5 (seo/ux, neuland P2-2)
// 1. /de/ezarri auf dem iPhone: „Vertragshändler für Ezarri“ und „Termin anfragen“
//    (?thema=ezarri) im ersten Bildschirm, über der Cookie-Leiste (ux P1-4a).
// 2. Mosaik-Detail: H1 mit Ezarri, Code und Kollektion; noindex,follow für
//    Beinahe-Dubletten, index für indexierbare (seo P1-2).
// 3. BreadcrumbList: jede Stufe außer der letzten hat `item` (Hub, Mosaik,
//    Kollektion, Konfigurator) (seo P1-3).
// 4. Konfigurator: eigenes Beckenfoto nur lokal, ohne Upload (neuland P2-2).
// Run: PW_WORKERS=1 npx playwright test tests/e2e/r5-seo-ezarri.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import { blockFormSends, jsonLdNodes } from "./helpers.js";

test.describe("Ezarri iPhone erster Bildschirm", () => {
  test.use({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  test("Händler-Zeile und „Termin anfragen“ über der Cookie-Leiste", async ({ page }) => {
    await page.goto("/de/ezarri", { waitUntil: "domcontentloaded" });
    const banner = page.getByRole("region", { name: /^Cookie-Einstellungen$/ });
    await expect(banner).toBeVisible({ timeout: 30_000 });
    const line = page.locator("[data-ezarri-termin] [data-ezarri-dealer='kopf']");
    const button = page.locator("[data-ezarri-termin]").getByRole("link", { name: "Termin anfragen" });
    await expect(line).toHaveText(/^Vertragshändler für Ezarri/);
    await expect(button).toHaveAttribute("href", "/de/beratung?thema=ezarri");
    const top = (await banner.boundingBox()).y;
    for (const el of [line, button]) {
      const box = await el.boundingBox();
      expect(box, "sichtbar").not.toBeNull();
      expect(box.y + box.height, "über der Cookie-Leiste").toBeLessThanOrEqual(top);
    }
  });
});

test.describe("Ezarri SEO", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "läuft einmal (Desktop)");

  const robotsOf = async (page) => (await page.locator('meta[name="robots"]').getAttribute("content")) || "";

  test("Mosaik: H1 mit Ezarri, Code und Kollektion; Beinahe-Dublette noindex,follow", async ({ page }) => {
    await page.goto("/de/ezarri/mosaike/2511-a", { waitUntil: "domcontentloaded" });
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Ezarri Mosaik 2511-A 25");
    await expect(h1).toContainText("Kollektion Niebla");
    expect(await robotsOf(page)).toMatch(/noindex,\s*follow/);
  });

  test("Mosaik mit eigenem Profil bleibt index", async ({ page }) => {
    await page.goto("/de/ezarri/mosaike/marron", { waitUntil: "domcontentloaded" });
    expect(await robotsOf(page)).not.toContain("noindex");
    await expect(page.locator("h1")).toContainText(/^Ezarri /);
  });

  for (const url of ["/de/ezarri", "/de/ezarri/mosaike/basalt", "/de/ezarri/kollektionen/gea", "/de/ezarri/konfigurator", "/de/ezarri/pool"]) {
    test(`${url}: BreadcrumbList – item an jeder Stufe außer der letzten`, async ({ request }) => {
      const res = await request.get(url);
      expect(res.status()).toBe(200);
      const lists = jsonLdNodes(await res.text()).filter((n) => n["@type"] === "BreadcrumbList");
      expect(lists.length, "BreadcrumbList vorhanden").toBeGreaterThan(0);
      for (const list of lists) {
        const items = list.itemListElement;
        items.slice(0, -1).forEach((it, i) => expect(it.item, `${url} Stufe ${i + 1} (${it.name})`).toMatch(/^https:\/\/platzhirsch\.studio\/de/));
        items.forEach((it, i) => expect(it.position).toBe(i + 1));
      }
    });
  }

  test("Konfigurator: eigenes Beckenfoto bleibt lokal (kein Upload)", async ({ page }) => {
    const posts = [];
    page.on("request", (r) => {
      if (r.method() !== "GET" && r.method() !== "HEAD") posts.push(r.url());
    });
    await blockFormSends(page);
    await page.goto("/de/ezarri/konfigurator", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-ezk-ready]")).toBeAttached({ timeout: 120_000 });
    await page.getByRole("tab", { name: "Becken" }).click();
    const block = page.locator("[data-ezk-eigenes-foto]");
    await expect(block).toContainText("nicht hochgeladen");
    // 1×1-PNG als Testfoto
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkqPv/HwAFAwJ/l9DVzQAAAABJRU5ErkJggg==", "base64");
    await block.locator('input[type="file"]').setInputFiles({ name: "becken.png", mimeType: "image/png", buffer: png });
    const img = block.getByRole("img", { name: /Ihr Foto/ });
    await expect(img).toBeVisible();
    expect(await img.getAttribute("src")).toMatch(/^blob:/);
    await expect(block.getByRole("slider", { name: /Deckkraft/ })).toBeVisible();
    await block.getByRole("button", { name: "Foto entfernen" }).click();
    await expect(img).toHaveCount(0);
    expect(posts.filter((u) => !/\/_next\/|__nextjs|webpack|turbopack/.test(u))).toEqual([]);
  });
});
