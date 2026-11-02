// AR-Viewer, Nachbesserung nach QA R2 (qa-screenshots/labs-ausbau/ar-viewer/feedback-2.md).
//   P1-1  Marke scheitert → Rückfall auf den letzten Stand bzw. sichtbarer Hinweis mit „mind.“
//         (Fehler per Header x-arviewer-sim, nur außerhalb von Produktion; ein Server-Fetch
//         lässt sich mit page.route nicht abfangen)
//   P2-2  Tipp-Suche und sofortiger Karten-Tap: die Produktseite bleibt
//   P2-1  Größen-Umschalter über dem AR-Knopf
//   P2-6  QR-Dialog: Skeleton bis zum Code, Vorschau-Hinweis, Live-Status „Auf dem Handy geöffnet“
// Nichts wird ans Backoffice gesendet (der Übergabe-Endpunkt ist lokal und speichert nur ein Token).
//   npx playwright test tests/e2e/ar-viewer-fix2.spec.js --project=desktop
import { test, expect as baseExpect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers.js";

const expect = baseExpect.configure({ timeout: 90_000 });
const LIST = "/de/3d-ansicht";
const DANIELS = "/de/3d-ansicht/sofas-daniels";

test.describe("AR-Viewer nach QA R2 (Desktop)", () => {
  test.setTimeout(300_000);

  test("P1-1: Marke fällt aus ohne Stand → Hinweis „wird gerade nicht geladen“, Zahlen mit „mind.“", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-arviewer-sim": "fehler=Minotti;ohne-stand" } });
    const page = await ctx.newPage();
    try {
      await page.goto(LIST);
      const hint = page.getByTestId("arv-teilkatalog");
      await expect(hint).toBeVisible();
      await expect(hint).toHaveAttribute("role", "status");
      await expect(hint).toContainText("Minotti wird gerade nicht geladen");
      await expect(hint.getByRole("link", { name: "Neu laden" })).toBeVisible();
      await expect(page.getByTestId("arv-intro-zahlen")).toContainText(/^mind\. /);
      await expect(page.locator("body")).not.toContainText(/\b0 davon/);
      await expect(page.locator("body")).not.toContainText("Sortiment ist gerade nicht erreichbar");
    } finally {
      await ctx.close();
    }
  });

  test("P1-1: Marke fällt aus mit Stand → vollständige Zahlen, Stand genannt, Minotti findbar", async ({ browser, baseURL }) => {
    // erst ohne Simulation laden, damit ein vollständiger Stand existiert
    const warm = await browser.newPage({ baseURL });
    await warm.goto(LIST);
    const intro = (await warm.getByTestId("arv-intro-zahlen").textContent()).replace(/\s+/g, " ").trim();
    await warm.close();
    const ctx = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-arviewer-sim": "fehler=Minotti" } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${LIST}?q=minoti`);
      await expect(page.getByTestId("arv-teilkatalog")).toHaveCount(0);
      await expect(page.getByTestId("arv-stand-hinweis")).toContainText(/Minotti: Stand/);
      await expect(page.getByTestId("arv-sortiment-liste").locator("li").first()).toBeVisible();
      await page.goto(LIST);
      expect((await page.getByTestId("arv-intro-zahlen").textContent()).replace(/\s+/g, " ").trim()).toBe(intro);
    } finally {
      await ctx.close();
    }
  });

  test("P2-2: „couch“ tippen und sofort eine Karte öffnen → Produktseite bleibt", async ({ page }) => {
    await page.goto(LIST);
    await dismissCookieBanner(page, 8_000);
    await page.waitForSelector("form[data-ready]", { timeout: 90_000 });
    const card = page.getByTestId("arv-sortiment-liste").locator("li a").first();
    const href = await card.getAttribute("href");
    await page.locator("#arv-q").pressSequentially("couch", { delay: 20 });
    await card.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await page.waitForTimeout(2_500); // länger als der Debounce (350 ms) plus Rendern
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page).not.toHaveURL(/q=couch/);
  });

  test("P2-1/P2-6: Größen-Umschalter, QR-Skeleton, Vorschau-Hinweis und Live-Status", async ({ page, request }) => {
    // QR-Bibliothek verzögern, damit das Skeleton sichtbar wird
    await page.route(/qrcode/, async (r) => {
      await new Promise((res) => setTimeout(res, 1_500));
      await r.continue();
    });
    await page.goto(DANIELS);
    await dismissCookieBanner(page, 8_000);
    const wahl = page.getByTestId("arv-groessen");
    await expect(wahl).toBeVisible();
    const second = wahl.getByRole("button").nth(1);
    await second.click();
    await expect(second).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("arv-produkt-masse")).toContainText(/Gezeigt: Sofa cm 248/);

    await page.getByRole("button", { name: "Auf dem Smartphone im Raum ansehen" }).click();
    const dlg = page.getByTestId("arv-qr-dialog");
    await expect(dlg.getByRole("img", { name: /QR-Code/ }).or(dlg.getByTestId("arv-qr-skeleton"))).toBeVisible();
    await expect(dlg.getByRole("img", { name: /QR-Code/ })).toBeVisible();
    await expect(dlg.getByTestId("arv-qr-skeleton")).toHaveCount(0);
    await expect(dlg.getByTestId("arv-qr-vorschau")).toContainText("Vorschau:");
    await expect(dlg).not.toContainText("localhost");

    // Live-Status: das Handy meldet das Token aus dem QR-Link
    const label = await dlg.getByRole("img", { name: /QR-Code/ }).getAttribute("aria-label");
    expect(label).toMatch(/\?von=qr$/);
    const tokenRes = await page.waitForResponse((r) => r.url().includes("/uebergabe") && r.request().method() === "GET", { timeout: 30_000 });
    const t = new URL(tokenRes.url()).searchParams.get("t");
    const meld = await request.post("/de/3d-ansicht/uebergabe", { data: { aktion: "geoeffnet", t } });
    expect(meld.ok()).toBe(true);
    await expect(dlg.getByTestId("arv-qr-geoeffnet")).toContainText("Auf dem Handy geöffnet.");
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
  });
});
