// Accessibility: axe (WCAG 2.0 A/AA, 2.1 AA, 2.2 AA) on key pages, failing on
// serious and critical findings; reduced motion; no horizontal overflow at 375 px.
// axe with the cookie bar open runs in the Pixel and Desktop projects (Chromium);
// axe after closing the cookie bar runs on iPhone (WebKit), Pixel and Desktop; motion
// and overflow in all.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PROD_GATED, PRODUCT_PATH, dismissCookieBanner, measureOverflow, settle } from "./helpers.js";

const AXE_PAGES = ["/de", "/de/produkte", PRODUCT_PATH, "/de/kontakt"];
// After the cookie bar is closed: the same pages plus the new pages of round 2.
const AXE_AFTER_BANNER_PAGES = [...AXE_PAGES, "/de/ratgeber", "/de/adventsabend", "/de/bewerten"];
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

// Known findings (see tests/README.md, "A11y"). Key: page path → axe rule ids.
// They end the test as fixme while present; every other serious/critical rule
// fails. Remove entries once fixed.
const KNOWN_AXE = {};

function summarize(violations) {
  return violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
  }));
}

/** Runs axe, attaches all violations, fails on unknown serious/critical ones, fixme on known ones. */
async function axeVerdict(page, testInfo, path) {
  // nextjs-portal is the dev error overlay/indicator, not part of the site.
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  const severe = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  await testInfo.attach("axe-violations.json", {
    body: JSON.stringify(summarize(results.violations), null, 2),
    contentType: "application/json",
  });

  const known = new Set(KNOWN_AXE[path] || []);
  const unknown = severe.filter((v) => !known.has(v.id));
  expect(summarize(unknown), `neue serious/critical axe-Befunde auf ${path}`).toEqual([]);

  const stillKnown = severe.filter((v) => known.has(v.id));
  if (stillKnown.length) {
    test.fixme(true, `Bekannte axe-Befunde: ${stillKnown.map((v) => v.id).join(", ")} (tests/README.md)`);
  }
}

test.describe("axe", () => {
  for (const path of AXE_PAGES) {
    test(`axe ${path}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === "iphone", "axe mit offenem Banner läuft in den Chromium-Projekten");
      const res = await page.goto(path, { waitUntil: "load" });
      // P6 Runde 2: in Produktion bis zur Freigabe 404 (recht P1-5/P2-6).
      if (PROD_GATED.has(path) && res.status() === 404) return;
      expect(res.status()).toBe(200);
      await settle(page);
      await axeVerdict(page, testInfo, path);
    });
  }
});

// The cookie bar covers the lower part of the page on a first visit. This run
// checks the page a visitor sees after closing it with "Weiter ohne Einwilligung"
// (no consent): the bar must be gone and the page underneath must pass axe.
test.describe("axe nach Schließen des Cookie-Banners", () => {
  for (const path of AXE_AFTER_BANNER_PAGES) {
    test(`axe ohne Banner ${path}`, async ({ page }, testInfo) => {
      test.skip(!["iphone", "pixel", "desktop"].includes(testInfo.project.name), "läuft auf iPhone, Pixel und Desktop");
      const res = await page.goto(path, { waitUntil: "load" });
      // P6 Runde 2: in Produktion bis zur Freigabe 404 (recht P1-5/P2-6).
      if (PROD_GATED.has(path) && res.status() === 404) return;
      expect(res.status()).toBe(200);
      await settle(page);
      const closed = await dismissCookieBanner(page);
      expect(closed, "Cookie-Banner erscheint beim ersten Besuch und lässt sich schließen").toBe(true);
      await expect(page.getByRole("region", { name: /^Cookie-Einstellungen$/ })).toHaveCount(0);
      await axeVerdict(page, testInfo, path);
    });
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("/de: keine laufenden CSS-Animationen bei prefers-reduced-motion", async ({ page }) => {
    const res = await page.goto("/de", { waitUntil: "load" });
    expect(res.status()).toBe(200);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    await settle(page);

    // Finite transitions may finish; anything still running after the page settled
    // (infinite loops, long marquees, Ken Burns) is a defect.
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            document
              .getAnimations()
              .filter((a) => a.playState === "running")
              .filter((a) => (window.CSSAnimation && a instanceof CSSAnimation) || (window.CSSTransition && a instanceof CSSTransition))
              .map((a) => {
                const el = a.effect && a.effect.target;
                const desc = el ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.getAttribute("class") || "").slice(0, 60)}` : "?";
                return `${a.animationName || a.transitionProperty || "anim"} @ ${desc}`;
              })
          ),
        { timeout: 10_000, message: "laufende CSS-Animationen trotz reduced motion" }
      )
      .toEqual([]);
  });
});

test.describe("375 px ohne horizontalen Überlauf", () => {
  for (const path of ["/de", "/de/produkte", PRODUCT_PATH, "/de/kontakt"]) {
    test(`375 px ${path}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === "desktop", "läuft in den Telefon-Projekten");
      await page.setViewportSize({ width: 375, height: 812 });
      const res = await page.goto(path, { waitUntil: "load" });
      // P6 Runde 2: in Produktion bis zur Freigabe 404 (recht P1-5/P2-6).
      if (PROD_GATED.has(path) && res.status() === 404) return;
      expect(res.status()).toBe(200);
      await settle(page);
      // Outermost culprits only: no SVG internals, no children of an element that already sticks out.
      const overflow = await measureOverflow(page);
      expect(overflow.sw, `scrollWidth > Viewport, z. B. ${overflow.wide.join(" | ")}`).toBeLessThanOrEqual(
        overflow.vw + 1
      );
    });
  }
});
