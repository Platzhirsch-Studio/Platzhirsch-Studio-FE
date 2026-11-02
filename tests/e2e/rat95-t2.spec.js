// Rat 9,5 – Team T2 „Werkzeuge & Ihre Auswahl“ (qa-screenshots/rat95/00-plan.md, Abschnitt 5).
// Läuft gegen den Dev-Server (:3000), sendet nichts (alle POST abgefangen).
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const SLOW = { timeout: 180_000 };
const ITEMS = [
  { id: 1, produkte_id: 4711, name: "Testprodukt", category: "Sofas", image: null, quantity: 1 },
  { id: 2, produkte_id: 4712, name: "Leuchte", category: "Foscarini", image: null, quantity: 1 },
];

async function blockPosts(page) {
  const sent = [];
  await page.route("**/api/**", (route) => {
    if (route.request().method() === "POST") {
      sent.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    }
    return route.continue();
  });
  return sent;
}

async function dismissCookies(page) {
  const btn = page.getByRole("button", { name: "Weiter ohne Einwilligung" });
  if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) await btn.click();
}

async function axe(page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
}

test.describe("Ihre Auswahl (B9)", () => {
  test("Leerzustand: genau eine Überschrift im Inhalt, Reiter, Beratungsweg; axe 0", async ({ page }) => {
    await page.goto("/de/merkliste", SLOW);
    await dismissCookies(page);
    const main = page.locator("main");
    await expect(main.getByText("Noch nichts gemerkt.")).toBeVisible();
    // Überschriften im Inhalt (ohne Footer): nur die H1
    await expect
      .poll(() => main.locator("h1, h2, h3").evaluateAll((els) => els.filter((e) => !e.closest("footer") && e.offsetParent !== null).map((e) => e.textContent.trim())).catch(() => null))
      .toEqual(["Ihre Auswahl"]);
    const tabs = page.getByRole("navigation", { name: "Ihre Auswahl" });
    await expect(tabs.getByRole("link", { name: /Stücke/ })).toHaveAttribute("aria-current", "page");
    await expect(tabs.getByRole("link", { name: /Ideen/ })).toHaveAttribute("href", "/de/ideenboard");
    await expect(page.locator("[data-selection-advice]")).toHaveAttribute("href", "/de/beratung");
    expect(await axe(page)).toEqual([]);
  });

  test("Mit Stücken: drei gleich gewichtete Wege, Teilen-Link, Druck; geteilter Link übernimmt", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const sent = await blockPosts(page);
    await page.addInitScript((items) => {
      if (!sessionStorage.getItem("t2-init")) {
        localStorage.setItem("cart", JSON.stringify(items));
        sessionStorage.setItem("t2-init", "1");
      }
    }, ITEMS);
    await page.goto("/de/merkliste", SLOW);
    await dismissCookies(page);
    const ways = page.locator("[data-selection-way]");
    await expect(ways).toHaveCount(3);
    const boxes = await ways.evaluateAll((els) => els.map((e) => [Math.round(e.getBoundingClientRect().width), getComputedStyle(e).borderTopWidth, getComputedStyle(e).backgroundColor]));
    expect(new Set(boxes.map((b) => b.join())).size, JSON.stringify(boxes)).toBe(1);
    await expect(page.locator("[data-selection-print]")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Ihre Auswahl" }).getByRole("link", { name: /Stücke/ })).toContainText("(2)");
    await page.locator('[data-selection-way="teilen"]').click();
    const url = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toMatch(/\/de\/merkliste#auswahl=[A-Za-z0-9_-]+$/);
    expect(await axe(page)).toEqual([]);
    // Empfänger: leere Auswahl, geteilter Link → übernehmen
    await page.evaluate(() => localStorage.removeItem("cart"));
    await page.goto(url, SLOW);
    const panel = page.locator("[data-selection-shared]");
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Sofas · Testprodukt");
    await panel.getByRole("button", { name: "In meine Auswahl übernehmen" }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator("[data-selection-way]")).toHaveCount(3);
    expect(new URL(page.url()).hash).toBe("");
    expect(sent).toEqual([]);
  });

  test("Ideenboard ist der Reiter „Ideen“", async ({ page }) => {
    await page.goto("/de/ideenboard", SLOW);
    const tabs = page.getByRole("navigation", { name: "Ihre Auswahl" });
    await expect(tabs.getByRole("link", { name: /Ideen/ })).toHaveAttribute("aria-current", "page");
    await expect(tabs.getByRole("link", { name: /Stücke/ })).toHaveAttribute("href", "/de/merkliste");
  });
});

test.describe("Wunschliste-Einstieg (A17)", () => {
  for (const l of ["de", "en"]) {
    test(`/${l}/wunschliste: 200, eine H1, Weg in die Auswahl; axe 0`, async ({ page }) => {
      const res = await page.goto(`/${l}/wunschliste`, SLOW);
      expect(res.status()).toBe(200);
      await dismissCookies(page);
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("[data-wunschliste-landing] a").first()).toHaveAttribute("href", l === "de" ? "/de/merkliste" : "/en/wishlist");
      await expect(page.locator("main")).not.toContainText(/€|kostenlos/);
      expect(await axe(page)).toEqual([]);
    });
  }
});

test.describe("Werkzeuge → Termin mit Plan (A4, A11, B2)", () => {
  test("Küchenplaner: Harald-Zeile, „Termin mit diesem Plan“ mit Plan-Link; Übergabe ≤ 30 min", async ({ page }) => {
    const sent = await blockPosts(page);
    await page.goto("/de/kuechenplaner?t=ergebnis&uebergabe=1", SLOW);
    await expect(page.locator("[data-hand-line]")).toContainText("Harald Menghin zeichnet Ihr Konzept danach von Hand");
    const link = page.locator("[data-kp-termin-link]");
    await expect(link).toBeVisible({ timeout: 120_000 });
    await expect.poll(async () => new URL(await link.getAttribute("href"), "http://x").searchParams.get("plan") || "", { timeout: 30_000 }).toMatch(/\/de\/kuechenplaner\?k=/);
    const u = new URL(await link.getAttribute("href"), "http://x");
    expect(u.pathname).toBe("/de/termin"); // Dev: Kalender im Testbetrieb aktiv
    expect(u.searchParams.get("thema")).toBe("kueche");
    await link.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
    await link.click();
    const stored = await page.evaluate(() => JSON.parse(sessionStorage.getItem("ph-planer-uebergabe") || "null"));
    expect(stored.planer).toBe("kuechenplaner");
    expect(Date.now() - stored.at).toBeLessThan(30 * 60 * 1000);
    expect(sent).toEqual([]);
  });

  test("Stil-Finder-Ergebnis: Harald-Zeile und Termin mit Ergebnis-Link", async ({ page }) => {
    await page.goto("/de/stil-finder/ergebnis/italienische-ruhe", SLOW);
    await expect(page.locator("[data-hand-line]")).toBeVisible();
    const u = new URL(await page.locator("[data-stil-termin]").getAttribute("href"), "http://x");
    expect(u.searchParams.get("stil")).toBe("italienische-ruhe");
    expect(u.searchParams.get("plan")).toBe("https://platzhirsch.studio/de/stil-finder/ergebnis/italienische-ruhe");
  });

  test("Sofaplaner Desktop: Harald-Zeile und „Planung starten ↓“ über dem Falz", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de/sofaplaner", SLOW);
    await expect(page.locator("[data-hand-line]")).toBeVisible();
    const start = page.locator("[data-planer-start]");
    await expect(start).toBeVisible();
    const box = await start.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(900);
    await expect(start).toHaveAttribute("href", "#planer-start");
    await expect(page.locator("#planer-start")).toHaveCount(1);
  });
});

const { defaultBrowserType: _b, ...IPHONE } = devices["iPhone 15 Pro"];
test.describe("Mobil (B11, C1)", () => {
  test.use(IPHONE);
  test("Sofaplaner iPhone: Grundriss mit Bemaßung im ersten Bildschirm, kein Querscroll", async ({ page }) => {
    await page.goto("/de/sofaplaner", SLOW);
    const plan = page.locator("[data-sofa-hero] [data-sofa-draufsicht] svg");
    await expect(plan).toBeVisible();
    const box = await plan.boundingBox();
    expect(box.y).toBeLessThan(page.viewportSize().height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });

  test("Startseite iPhone: „Planen & Erleben“ als Bildreihe sichtbar", async ({ page }) => {
    await page.goto("/de", SLOW);
    const row = page.locator("[data-home-labs]");
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
    await expect(page.locator("[data-home-labs-item]").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });
});
