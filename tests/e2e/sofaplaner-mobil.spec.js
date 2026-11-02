// Sofaplaner – QM-Runde 1 (qa-screenshots/labs-ausbau/sofaplaner/feedback-1.md):
// P1-1 Touch-Drag auf Android (echte Touch-Events per CDP), P1-2 mobiles Layout
// (Plan oben, Schrittinhalt sichtbar, Weiter-Leiste unten), P1-3 „Ecke rechts“
// ohne Konflikt, P1-4 ungültige Raumeingabe, P2-1 Hinweis verschwindet beim
// Schrittwechsel, P2-4 Auswahl-Aktionen im Sichtbereich. Nichts wird gesendet.
import { test, expect, chromium, devices } from "@playwright/test";
import { blockFormSends, dismissCookieBanner } from "./helpers.js";
import { MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON, SOFA_FAMILY, collectSofaplanerErrors } from "./sofaplaner-errors.js";

const PAGE = `/de/sofaplaner?m=${SOFA_FAMILY}`; // R7-P4: neutraler Typ ohne Minotti-Zustimmung

async function open(page, url) {
  await blockFormSends(page);
  await page.route("**/sofaplaner/teilen", (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
  );
  await page.goto(url);
  await dismissCookieBanner(page, 8_000);
  await page.locator("[data-hydrated=true]").waitFor({ timeout: 90_000 });
}
const translate = async (loc) => {
  const [, x, y] = (await loc.getAttribute("transform")).match(/translate\(([-\d.]+) ([-\d.]+)\)/);
  return { x: Number(x), y: Number(y) };
};
const statusBadge = (page) => page.locator("aside").getByText(/^(Passt|\d+ Konflikte?|\d+ Hinweise?)$/).first();

test("P1-1/P1-2 Pixel 7 (Chromium, echte Touch-Events): Element ziehen ohne Seiten-Scroll, Schrittinhalt sichtbar", async ({ baseURL }) => {
  test.setTimeout(240_000);
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...devices["Pixel 7"], locale: "de-AT" });
  const page = await context.newPage();
  const errors = collectSofaplanerErrors(page); // QM Restliste P2-3: nur Dev-HMR-Router-Race ausgenommen
  try {
    await open(page, `${baseURL}${PAGE}`);
    await page.locator('[data-form="gerade"]').tap();
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).tap();
    // P1-2: Plan oben (sticky), Schrittüberschrift direkt darunter im Sichtbereich
    const vh = page.viewportSize().height;
    const title = page.getByRole("heading", { name: "Anpassen" });
    await expect(title).toBeFocused();
    await expect.poll(async () => (await title.boundingBox()).y, { timeout: 5_000 }).toBeLessThan(vh * 0.8);
    const svg = await page.locator("svg[data-editable]").boundingBox();
    expect(svg.y).toBeGreaterThanOrEqual(0);
    expect(svg.y + svg.height).toBeLessThan(vh * 0.75);
    const nav = await page.locator("[data-step-nav]").boundingBox();
    expect(nav.y + nav.height).toBeLessThanOrEqual(vh + 1);
    // P1-1: Touch-Drag per CDP
    const item = page.locator("[data-id]").nth(1);
    const before = await translate(item);
    const box = await item.boundingBox();
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    // wait until the smooth scroll of the step change has settled
    await expect
      .poll(async () => {
        const a = await page.evaluate(() => window.scrollY);
        await page.waitForTimeout(250);
        return Math.abs((await page.evaluate(() => window.scrollY)) - a);
      })
      .toBeLessThan(1);
    const scroll0 = await page.evaluate(() => window.scrollY);
    const cdp = await context.newCDPSession(page);
    const touch = (type, px, py) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: px, y: py, id: 1 }] });
    await touch("touchStart", x, y);
    for (let i = 1; i <= 9; i++) await touch("touchMove", x, y + i * 10);
    await touch("touchEnd");
    const after = await translate(item);
    expect(after.y - before.y).toBeGreaterThan(40);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scroll0)).toBeLessThan(5); // vorher: Seite scrollte 75 px
    // P2-4: Aktionen am gewählten Element im Sichtbereich
    const rotate = page.getByRole("button", { name: "Drehen" });
    await expect(rotate).toBeVisible();
    const rb = await rotate.boundingBox();
    expect(rb.y + rb.height).toBeLessThanOrEqual(vh);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});

test.describe("Sofaplaner QM R1 (Desktop)", () => {
  test("P1-3: „Ecke rechts“ startet im Standardraum ohne Konflikt", async ({ page }) => {
    await open(page, PAGE);
    await page.locator('[data-form="ecke-rechts"]').click();
    await expect(page.locator("[data-id]")).toHaveCount(3);
    await expect(statusBadge(page)).not.toContainText("Konflikt");
  });

  test("P1-4: „50“ und leeres Feld werden abgelehnt, Raum und Sofa bleiben", async ({ page }) => {
    await open(page, PAGE);
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Im Raum prüfen/ }).click();
    const before = await page.locator("[data-id]").evaluateAll((els) => els.map((e) => e.getAttribute("transform")));
    const input = page.getByLabel("Raumbreite");
    await input.fill("50");
    await input.press("Enter");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(/Bitte 150–2 000 cm eingeben/)).toBeVisible();
    await input.fill("");
    await input.blur();
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("svg[data-editable]")).toHaveAttribute("aria-label", /^Grundriss 560 × 440 cm/);
    expect(await page.locator("[data-id]").evaluateAll((els) => els.map((e) => e.getAttribute("transform")))).toEqual(before);
    await input.fill("200");
    await input.press("Enter");
    await expect(input).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText(/ist breiter als der Raum \(200 cm\)/).first()).toBeVisible();
    await expect(page.getByText(/überlappen sich/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Rückgängig", exact: true }).first()).toBeVisible();
  });

  test("P2-1: Hinweis verschwindet beim Schrittwechsel", async ({ page }) => {
    await open(page, PAGE);
    await page.locator('[data-form="u"]').click();
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).click();
    await page.getByRole("radio", { name: /Chaiselongues/ }).click();
    await page.locator('[data-palette] button[aria-disabled="true"]').first().click({ force: true });
    await expect(page.locator("p[role=alert]").first()).toBeVisible();
    await page.getByRole("button", { name: /Weiter: Ausführung/ }).click();
    await expect(page.locator("p[role=alert]")).toHaveCount(0);
  });

  test("P2-3: Rücken als Einzelwahl, „Ohne Rücken“ ohne Hocker ausgegraut", async ({ page }) => {
    test.skip(!MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON + " (Rückenoptionen laut Hersteller)");
    await open(page, PAGE);
    await page.locator('[data-form="gerade"]').click();
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Ausführung/ }).click();
    const group = page.getByRole("group", { name: "Rücken" });
    await expect(group.getByRole("radio", { name: /Fester gepolsterter Rücken/ })).toBeVisible();
    await expect(group.getByRole("radio", { name: /Ohne Rücken/ })).toBeDisabled();
    await expect(page.getByText("Optionales Rückenkissen 65 × 60 cm")).toBeVisible();
    await expect(page.getByText("Optional backrest cushion")).toHaveCount(0);
    await expect(page.getByText("Bezugskollektionen laut Hersteller")).toBeVisible();
  });
});
