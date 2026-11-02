// Stil-Finder, Feinschliff P2.1 (qa-screenshots/feinschliff/stilfinder/feedback.md):
// Auf dem Handy darf keine Textzeile des Quiz-Intros unter den KI-Button laufen.
// Gemessen statt per Regex: die Text-Rects (Range je Textknoten) des Intro-Blocks
// [data-sf-ki-gap] enden links vom Rect von [data-concierge-launcher] – unabhängig
// von der Scrollposition, also auch, wenn eine Zeile am unteren Rand steht.
// Viewports von Pixel 7 (412 px) und iPhone 15 Pro (393 px), nach
// „Weiter ohne Einwilligung“ (vorher blendet der Concierge den Button aus).
// Läuft im desktop-Projekt (Chromium mit Handy-Emulation); die Handy-Projekte
// der Config führen nur smoke/a11y aus. Es wird nichts gesendet.
import { test, expect, devices } from "@playwright/test";
import { dismissCookieBanner } from "./helpers.js";

const QUIZ = "/de/stil-finder";
const SHOTS = process.env.SF_KI_SHOTS; // optional: Ordner für Beleg-Screenshots

const PHONES = {
  "Pixel 7": devices["Pixel 7"],
  "iPhone 15 Pro": devices["iPhone 15 Pro"],
};

for (const [name, d] of Object.entries(PHONES)) {
  test.describe(`KI-Abstand ${name}`, () => {
    test.use({ viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor, isMobile: true, hasTouch: true, userAgent: d.userAgent });

    test("Intro-Text läuft nie unter den KI-Button", async ({ page }) => {
      await page.goto(QUIZ);
      await dismissCookieBanner(page, 30_000);
      const btn = page.locator("[data-concierge-launcher]");
      // the concierge mounts after idle and stays hidden while a banner is open.
      // R7-P4 (bewusst geändert): Seit Runde 2 zeigt der Concierge auf Handys im geschlossenen
      // Zustand keinen schwebenden Knopf mehr (Launcher.js: phone && closed → Zugang über die
      // untere Leiste). Dann kann auch kein Intro-Text darunter laufen – das ist der Prüfgegenstand.
      const shown = await btn.waitFor({ state: "visible", timeout: 30_000 }).then(() => true).catch(() => false);
      if (!shown) {
        await expect(btn).toHaveCount(0);
        return;
      }
      const m = await page.evaluate(() => {
        const box = document.querySelector("[data-sf-ki-gap]");
        const b = document.querySelector("[data-concierge-launcher]").getBoundingClientRect();
        const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
        let right = 0;
        let lines = 0;
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (!n.textContent.trim()) continue;
          const r = document.createRange();
          r.selectNodeContents(n);
          for (const q of r.getClientRects()) {
            if (!q.width) continue;
            lines++;
            right = Math.max(right, q.right);
          }
        }
        // the start button and links are boxes, not text: their right edge counts too
        for (const el of box.querySelectorAll("a,button")) right = Math.max(right, el.getBoundingClientRect().right);
        return {
          btnLeft: b.left,
          btnWidth: b.width,
          right,
          lines,
          pad: parseFloat(getComputedStyle(box).paddingRight),
          vw: innerWidth,
        };
      });
      expect(m.lines).toBeGreaterThan(3);
      expect(m.pad, "Abstand 1,25 × --ph-concierge-h").toBeCloseTo(80, 0);
      expect(m.right, JSON.stringify(m)).toBeLessThanOrEqual(m.btnLeft);

      if (SHOTS) {
        // proof with the button visible: scroll the last intro paragraph to the button's height
        await page.evaluate(() => {
          const ps = document.querySelectorAll("[data-sf-ki-gap] p");
          const p = ps[ps.length - 1];
          const b = document.querySelector("[data-concierge-launcher]").getBoundingClientRect();
          scrollBy(0, p.getBoundingClientRect().top - b.top);
        });
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${SHOTS}/ki-abstand-${name.replace(/\s+/g, "-").toLowerCase()}.png` });
      }
    });
  });
}
