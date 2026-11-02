// tests/e2e/concierge-sitewide-iphone.spec.js — KI-Concierge seitenweit auf dem
// iPhone (WebKit, iPhone 15 Pro profile), run from the desktop project:
//   npx playwright test tests/e2e/concierge-sitewide-iphone.spec.js --project=desktop
// Mock mode only; no form is sent. See concierge-sitewide.spec.js.
import { test, expect, devices } from "@playwright/test";
import { settle } from "./helpers.js";
import { LAUNCH, LAUNCHER, SERVER, ask, dismissCookies, enterMock, freshIp, mockAvailable, testIp } from "./concierge-helpers.js";

// r7-p1 (ux P1-4): phones have no floating launcher any more; the KI entry is
// the third item of the mobile CTA bar ([data-cta-ai]), which opens the same
// panel. Expectations changed on purpose (before: 48-px button above the bar).
// Runde 5 (P3, ux P1-2, bewusst geänderte Erwartung): den KI-Eintrag der
// Leiste gibt es nur mit echtem Schlüssel (conciergeLive()). Im Mock-Dev-
// Server fehlt er – das Panel wird dann über dieselbe Schnittstelle geöffnet,
// die die Leiste aufruft (window.phConcierge), und der Test prüft, dass die
// Leiste keinen KI-Link trägt.
async function openFromBar(page) {
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await expect.poll(() => page.evaluate(() => typeof window.phConcierge), LAUNCH).toBe("function");
  const ai = page.locator("[data-cta-ai]");
  if (await ai.count()) {
    await expect(ai).toBeInViewport(LAUNCH);
    await ai.click();
  } else {
    await expect(page.locator('a[href$="/concierge"]')).toHaveCount(0);
    await page.evaluate(() => window.phConcierge());
  }
  const panel = page.locator("#concierge-panel");
  await expect(panel).toBeVisible(SERVER);
  return panel;
}

const { defaultBrowserType, ...iphone } = devices["iPhone 15 Pro"];
test.use({ ...iphone, browserName: defaultBrowserType, extraHTTPHeaders: { "x-forwarded-for": testIp() } });
// Shared dev server under load (parallel workflows): 300 s per test (QA2 P1-1).
test.describe.configure({ timeout: 300_000 });

test.describe("iPhone (WebKit)", () => {
  test("kein schwebender Knopf; KI in der CTA-Leiste öffnet das Bottom-Sheet modal, Seitenwechsel minimiert", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await freshIp(page);
    await page.goto("/de");
    await settle(page);
    await dismissCookies(page);
    await page.waitForTimeout(2500);
    await expect(page.locator(`${LAUNCHER}:visible`)).toHaveCount(0);
    const panel = await openFromBar(page);
    await (await enterMock(panel)).click();
    await expect(panel.getByRole("textbox", { name: /Ihre Nachricht/ })).toBeEnabled(SERVER);
    expect(await page.evaluate(() => document.querySelector("#concierge-panel").matches(":modal"))).toBe(true);
    // QA2 P3-4: after "Concierge starten" the focus is in the composer (WebKit too).
    await expect(panel.getByRole("textbox", { name: /Ihre Nachricht/ })).toBeFocused(SERVER);
    await ask(panel, "Bitte zum Showroom");
    const card = panel.locator("section").filter({ hasText: "KI-Vorschlag" }).last();
    await card.getByRole("button", { name: "Ausführen" }).click({ timeout: 60_000 });
    await expect(page).toHaveURL(/\/de\/kontakt$/, { timeout: 120_000 });
    await expect(panel).toBeHidden();
    const bar = page.locator(LAUNCHER);
    await expect(bar).toContainText("Gespräch fortsetzen", SERVER);
    await bar.click();
    await expect(panel).toBeVisible({ timeout: 60_000 }); // lazy chunk compiles on first use (dev)
    await expect(panel).toContainText("Erledigt", SERVER);
    await panel.getByRole("button", { name: "Concierge schließen" }).click();
    await expect(panel).toBeHidden();
  });

  test("Einwilligung kurz: Checkbox und Start ohne Scrollen sichtbar, Details aufklappbar, 30 Tage", async ({ page, request }) => {
    test.skip(!(await mockAvailable(request)), "Mock nicht freigegeben");
    await page.goto("/de/news");
    await settle(page);
    await dismissCookies(page);
    const panel = await openFromBar(page);
    const start = await enterMock(panel);
    const inView = () =>
      start.evaluate((b) => {
        const r = b.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight;
      });
    expect(await inView(), "Start-Button ohne Scrollen sichtbar").toBe(true);
    await expect(panel.getByRole("checkbox")).toBeInViewport();
    await expect(panel).toContainText("Löschung nach 30 Tagen");
    await expect(panel).toContainText("kein Mensch");
    // Full AI Act / GDPR text one tap away; start stays pinned while it is open.
    await panel.locator("summary").click();
    await expect(panel.locator("details")).toContainText("verbindlich sind nur Auskünfte");
    expect(await inView(), "Start bleibt am unteren Rand").toBe(true);
  });
});
