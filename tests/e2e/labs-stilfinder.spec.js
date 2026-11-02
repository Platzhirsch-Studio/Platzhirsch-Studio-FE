// Stil-Finder (Labs), Runde 2 – Zähler (Punkt 7), Mischbalken (Punkt 8), Konsole (Punkt 5).
// Läuft im desktop-Projekt. Es wird nichts gespeichert oder gesendet.
import { test, expect } from "@playwright/test";
import { collectConsoleErrors, dismissCookieBanner } from "./helpers.js";

const QUIZ = "/de/stil-finder";
const RESULT = "/de/stil-finder/ergebnis/italienische-ruhe?a=0000000";
const hydrated = (page) =>
  page.waitForFunction(() => {
    const b = document.querySelector("#stilfinder button");
    return b && Object.keys(b).some((k) => k.startsWith("__reactProps"));
  }, null, { timeout: 60_000 });

test.describe("Stil-Finder R2", () => {
  test("Punkt 7: Zähler wechselt erst mit der neuen Frage", async ({ page }) => {
    await page.goto(QUIZ);
    await dismissCookieBanner(page, 8_000);
    await hydrated(page);
    await page.getByRole("button", { name: /Stil-Finder starten/ }).click();
    const counter = page.locator("#stilfinder .tabular-nums").first();
    await expect(counter).toHaveText("01 / 07");
    await page.locator("#stilfinder [role=group] button").first().click();
    // Während die alte Frage noch sichtbar ist, bleibt der Zähler stehen.
    for (let i = 0; i < 12; i++) {
      const s = await page.evaluate(() => ({
        c: document.querySelector("#stilfinder .tabular-nums")?.textContent,
        h: [...document.querySelectorAll("#stilfinder h2")].map((h) => h.textContent).join("|"),
      }));
      if (s.h.startsWith("Wo möchten")) expect(s.c).toBe("01 / 07");
      await page.waitForTimeout(80);
    }
    await expect(counter).toHaveText("02 / 07");
  });

  test.describe("reduzierte Bewegung", () => {
    test.use({ reducedMotion: "reduce" });
    test("Punkt 8/5: Mischbalken sofort voll, keine Hydration-Warnung der Ergebnisseite", async ({ page }) => {
      const errors = collectConsoleErrors(page);
      await page.goto(RESULT);
      const bar = page.getByTestId("sf-mix-bar");
      await expect(bar).toBeVisible();
      const st = await bar.evaluate((b) => ({
        anim: getComputedStyle(b).animationName,
        filled: [...b.children].reduce((a, s) => a + s.getBoundingClientRect().width, 0) / b.getBoundingClientRect().width,
      }));
      expect(st.anim).toBe("none");
      expect(st.filled).toBeGreaterThan(0.95);
      await page.waitForTimeout(2000);
      expect(errors.filter((e) => /StilResult|sf-/.test(e))).toEqual([]);
    });
  });
});
