// tests/e2e/rat95-t3.spec.js – Rat 9,5 · T3 Bildsprache & Geschäftsfelder.
// Abnahme (qa-screenshots/rat95/00-plan.md §5, T3):
//  - Hotel, Architekten, Küchen, Stadtseiten: iPhone mit Grafik im ersten
//    Bildschirm (≤ 40 % der Höhe, über der H1), Beschriftung „Schema des
//    Studios“; Desktop ohne leere Hälfte (Grafik in der rechten Spalte).
//  - Hotel- und Architektenanfrage: 4 Pflichtfelder, Knopf über der Cookie-Leiste,
//    Bestätigung nach dem Senden im Viewport (A3, POST abgefangen).
//  - Ezarri iPhone: H1 ≤ 2 Zeilen, Poolbild im ersten Bildschirm, ≤ 2 Knöpfe.
//  - Yacht: Hero mit freigegebenem Navetta-Foto und Credit (yacht-werfthalle.spec.js).
// SICHERHEIT: jeder POST an /api/** wird abgefangen – nichts erreicht das Backoffice.
// Run: PW_WORKERS=1 npx playwright test tests/e2e/rat95-t3.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { blockFormSends, dismissCookieBanner, measureOverflow } from "./helpers.js";

const OK = { success: true, message: "Form submitted successfully", data: {} };
const IPHONE = { viewport: { width: 393, height: 659 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 };
const SCHEMA_PAGES = [
  ["/de/hotel-objekt", "hotel"],
  ["/de/architekten", "architekten"],
  ["/de/kuechen-vorarlberg", "kueche"],
  ["/de/designermoebel-st-gallen", "stadt"],
  ["/de/designermoebel-lindau", "stadt"],
];

test.describe("T3 iPhone: Bildsignal im ersten Bildschirm", () => {
  test.use(IPHONE);

  for (const [url, kind] of SCHEMA_PAGES) {
    // Design-Jury 30.10.2026 P1-4 (bewusst geänderte Erwartung): die Grafik stand über der H1
    // und drückte sie in die untere Bildschirmhälfte. Jetzt H1 → Knopf → Grafik, die
    // Beschriftung „Schema des Studios“ als figcaption UNTER dem Kasten.
    test(`${url}: Studio-Grafik unter H1 und Knopf, ≤ 40 % Höhe, beschriftet`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const fig = page.locator(`[data-studio-schema="${kind}"]`);
      await expect(fig).toBeVisible();
      // QM-Endabnahme 02.11.2026 (bewusst geändert, QM R1 01.11.): Beschriftung je Grafik („Schema eines Hotelflurs …“,
      // src/components/Landing/schema/text.js) statt überall „Schema des Studios“.
      await expect(fig.locator("[data-schema-label]")).toHaveText(/^(Schema (des|eines|einer) |Kartenskizze: )/);
      const vh = page.viewportSize().height;
      const box = await fig.boundingBox();
      const h1 = await page.locator("h1").boundingBox();
      const cta = await page.locator("main").getByRole("link", { name: /anfragen|wählen/ }).first().boundingBox();
      expect(box.height / vh, "≤ 40 % der Höhe").toBeLessThanOrEqual(0.4);
      expect(box.y, "unter der H1").toBeGreaterThanOrEqual(h1.y + h1.height);
      expect(box.y, "unter dem Knopf").toBeGreaterThanOrEqual(cta.y + cta.height);
      const label = await fig.locator("[data-schema-label]").boundingBox();
      const frame = await fig.locator(":scope > div").first().boundingBox();
      expect(label.y, "Beschriftung unter dem Kasten").toBeGreaterThanOrEqual(frame.y + frame.height);
      expect((await measureOverflow(page)).sw).toBeLessThanOrEqual(page.viewportSize().width + 1);
    });
  }

  for (const [url, name] of [
    ["/de/hotel-objekt", "Projekt anfragen"],
    ["/de/architekten", "Projekt anfragen"],
  ]) {
    test(`${url}: „${name}“ über der Cookie-Leiste`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const banner = page.getByRole("region", { name: /^Cookie-Einstellungen$/ });
      await expect(banner).toBeVisible({ timeout: 30_000 });
      const button = page.locator("main").getByRole("link", { name }).first();
      const top = (await banner.boundingBox()).y;
      const box = await button.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(top);
    });
  }

  test("Ezarri: H1 ≤ 2 Zeilen, Poolbild im ersten Bildschirm, ≤ 2 Knöpfe im Einstieg", async ({ page }) => {
    await page.goto("/de/ezarri", { waitUntil: "domcontentloaded" });
    const h1 = page.locator("[data-ezarri-h1]");
    const lines = await h1.evaluate((el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)));
    expect(lines).toBeLessThanOrEqual(2);
    const img = page.locator("header figure img").first();
    const box = await img.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
    expect(await page.locator("main header a").count()).toBeLessThanOrEqual(2);
  });

  for (const [url, fill, success] of [
    [
      "/de/hotel-objekt#anfrage",
      async (page) => {
        await page.locator("#ho-haus").fill("Hotel Testhaus");
        await page.locator("#ho-name").fill("Erika Test");
        await page.locator("#ho-email").fill("erika@example.com");
        await page.locator("#ho-nachricht").fill("Zimmer und Lobby neu einrichten");
      },
      "[data-hotel-success]",
    ],
    [
      "/de/architekten#anfrage",
      async (page) => {
        await page.locator("#arch-buero").fill("Büro Test");
        await page.locator("#arch-name").fill("Erika Test");
        await page.locator("#arch-email").fill("erika@example.com");
        await page.locator("#arch-bedarf").fill("Möblierung für zwölf Wohnungen");
      },
      "main [role=status]:has-text('Danke')",
    ],
  ]) {
    test(`${url.split("#")[0]}: vier Pflichtfelder genügen, Bestätigung im Viewport (A3)`, async ({ page }) => {
      await blockFormSends(page);
      const sent = [];
      await page.route("**/api/beratung_anfrage", (route) => {
        if (route.request().method() !== "POST") return route.continue();
        sent.push(route.request().postDataJSON());
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK) });
      });
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await dismissCookieBanner(page);
      await fill(page);
      await page.getByRole("button", { name: "Anfrage senden" }).click();
      const done = page.locator(success).first();
      await expect(done).toBeVisible();
      await expect.poll(() => sent.length).toBe(1);
      await expect
        .poll(async () => {
          const b = await done.boundingBox();
          return b && b.y >= 0 && b.y < page.viewportSize().height;
        })
        .toBe(true);
    });
  }
});

test.describe("T3 Desktop: keine leere Hälfte", () => {
  for (const [url, kind] of SCHEMA_PAGES) {
    test(`${url}: Grafik in der rechten Spalte des ersten Bildschirms`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const fig = page.locator(`[data-studio-schema="${kind}"]`);
      const box = await fig.boundingBox();
      const vp = page.viewportSize();
      expect(box.x, "rechte Hälfte").toBeGreaterThan(vp.width / 2);
      expect(box.width, "füllt die Spalte").toBeGreaterThan(vp.width * 0.3);
      expect(box.y).toBeLessThan(vp.height);
    });
  }

  for (const url of ["/de/hotel-objekt", "/de/architekten", "/de/kuechen-vorarlberg", "/de/designermoebel-st-gallen", "/de/designermoebel-bregenz", "/de/ezarri", "/de/yacht-interior", "/de/outdoor-gartenplanung"]) {
    test(`${url}: axe WCAG 2.2 AA ohne serious/critical`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await dismissCookieBanner(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).include("main").analyze();
      const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(severe.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }

  test("Bregenz: freigegebenes Showroom-Foto als Intro-Bild, ungeschnitten", async ({ page }) => {
    await page.goto("/de/designermoebel-bregenz", { waitUntil: "domcontentloaded" });
    const intro = page.locator("[data-landing-intro-image] img");
    await expect(intro).toHaveAttribute("src", /aboutHome\.jpg/);
    await expect(intro).toHaveClass(/object-contain/);
  });

  test("Outdoor und Hotel: Ezarri-Bild früh, mit Quellenangabe", async ({ page }) => {
    await page.goto("/de/outdoor-gartenplanung", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-outdoor-ezarri] [data-ezarri-credit]")).toHaveText("Bild: Ezarri, ezarri.com");
    await page.goto("/de/hotel-objekt", { waitUntil: "domcontentloaded" });
    const fig = page.locator("[data-hotel-ezarri]");
    await expect(fig).toContainText("Bild: Ezarri, ezarri.com");
    // im ersten Abschnitt nach dem Kopf (Leistungen), nicht erst bei den Marken
    await expect(page.locator("#leistungen [data-hotel-ezarri]")).toHaveCount(1);
  });

  test("Hotel: Sprungnavigation mit Ankern, die es gibt", async ({ page }) => {
    await page.goto("/de/hotel-objekt", { waitUntil: "domcontentloaded" });
    const links = page.locator("[data-hotel-jump] a");
    expect(await links.count()).toBeGreaterThanOrEqual(5);
    for (const href of await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
      await expect(page.locator(href)).toHaveCount(1);
    }
  });
});
