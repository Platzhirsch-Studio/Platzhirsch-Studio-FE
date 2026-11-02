// tests/e2e/ezarri-rechner-qm2.spec.js – Team C, QM-Runde 2 (qa-screenshots/ezarri/rechner/feedback-2.md).
// Läuft im Projekt desktop (Chromium); die Mobil-Blöcke setzen iPhone-15-Pro- bzw. Pixel-7-Maße.
// Nichts wird gesendet: Die Tests klicken keine Absende-Knöpfe.
import { test, expect } from "@playwright/test";
import { dismissCookieBanner, settle } from "./helpers.js";

const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, url) {
  await page.context().addCookies([consent(new URL(test.info().project.use.baseURL || "http://localhost:3000").origin)]);
  await expect(async () => {
    const res = await page.goto(url, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  }).toPass({ timeout: 360_000, intervals: [5_000, 10_000] });
  await settle(page);
  await dismissCookieBanner(page);
  await expect(page.locator("[data-anteil-feld]").first()).toBeVisible({ timeout: 120_000 });
}

/** Trifft elementFromPoint an der Mitte des Elements das Element selbst (oder ein Kind)? */
const frei = (loc) =>
  loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return Boolean(t && (t === el || el.contains(t) || t.contains(el)));
  });

const GERAETE = [
  { name: "iPhone 393", viewport: { width: 393, height: 659 } },
  { name: "Pixel 412", viewport: { width: 412, height: 839 } },
];

for (const g of GERAETE) {
  test.describe(`Ezarri QM-Runde 2 · ${g.name}`, () => {
    test.describe.configure({ timeout: 480_000 });
    test.use({ viewport: g.viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: "reduce" });

    test("P2-1: Mini-Vorschau erscheint beim ersten Regler und liegt nie über der Vorschau-Sektion", async ({ page }) => {
      await open(page, "/de/ezarri/custom-mix");
      await page.locator("[data-anteil-regler]").first().evaluate((el) => el.scrollIntoView({ block: "center" }));
      const mini = page.locator("[data-cm-mini]");
      await expect(mini).toBeVisible({ timeout: 10_000 });
      const lage = await page.evaluate(() => {
        const m = document.querySelector("[data-cm-mini]").getBoundingClientRect();
        const s = document.querySelector('section[aria-labelledby="cm-vorschau"]').getBoundingClientRect();
        const knoepfe = [...document.querySelectorAll('section[aria-labelledby="cm-vorschau"] button, section[aria-labelledby="cm-vorschau"] label')].map((b) => b.getBoundingClientRect());
        const schneidet = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return { miniTop: m.top, sektionUnten: s.bottom, ueberKnopf: knoepfe.some((k) => k.width && schneidet(m, k)), unten: m.bottom, vh: innerHeight };
      });
      expect(lage.ueberKnopf).toBe(false);
      expect(lage.miniTop).toBeGreaterThanOrEqual(lage.sektionUnten);
      expect(lage.unten).toBeLessThanOrEqual(lage.vh);
      for (const name of [/Neu mischen/, /Drucken/, /Bild speichern/]) {
        const knopf = page.getByRole("button", { name });
        if (await knopf.isVisible()) {
          const box = await knopf.boundingBox();
          if (box && box.y + box.height / 2 > 80) expect(await frei(knopf), String(name)).toBe(true);
        }
      }
      // Ganz oben (Vorschau sichtbar): keine Mini-Vorschau
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(mini).toHaveCount(0);
    });

    test("P2-2: Jedes %-Feld ist nach Tab nicht verdeckt (WCAG 2.4.11), Schnellkontakt weicht aus", async ({ page }) => {
      await open(page, "/de/ezarri/custom-mix");
      const felder = page.locator("[data-anteil-feld]");
      const n = await felder.count();
      expect(n).toBeGreaterThan(1);
      for (let i = 0; i < n; i++) {
        // Fokus auf den „+“-Knopf davor, dann per Tab ins Feld
        await felder.nth(i).evaluate((el) => el.closest("label").previousElementSibling.focus());
        await page.keyboard.press("Tab");
        await expect(felder.nth(i)).toBeFocused();
        await expect.poll(() => frei(felder.nth(i)), { timeout: 5_000, message: `Feld ${i + 1}` }).toBe(true);
      }
      // Unterstes Mosaik in Sicht: die Leiste „Anrufen / Termin wählen“ ist ausgeblendet
      await felder.nth(n - 1).evaluate((el) => el.scrollIntoView({ block: "center" }));
      const leiste = page.locator("nav").filter({ has: page.locator('a[href^="tel:"]') }).last();
      if (await leiste.count()) await expect(leiste).toHaveAttribute("inert", "");
    });
  });
}

test.describe("Ezarri QM-Runde 2 · Desktop", () => {
  test.describe.configure({ timeout: 480_000 });
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("P2-2: Tab durch die Mischung – kein Feld und kein Knopf verdeckt (Concierge)", async ({ page }) => {
    await open(page, "/de/ezarri/custom-mix");
    // Concierge wird nach Leerlauf geladen: kurz warten, damit er mitgeprüft wird
    await page.waitForTimeout(3_000);
    const ziele = page.locator('section[aria-labelledby="cm-mischung"] :is(button, input)');
    const n = await ziele.count();
    await ziele.first().focus();
    for (let i = 0; i < n; i++) {
      const el = ziele.nth(i);
      if (!(await el.isEnabled())) continue;
      await el.focus();
      await expect.poll(() => frei(el), { timeout: 5_000, message: `Ziel ${i + 1}` }).toBe(true);
    }
  });
});
