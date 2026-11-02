// R3-shell: consent bar and dialog, header at 320 px, mobile-menu focus,
// slim /upload shell. Runs in the desktop project; the phone checks switch
// device (and engine) per describe block. Read-only: the only "decision" is
// "Weiter ohne Einwilligung", which loads nothing.
//   npx playwright test tests/e2e/r3-shell.spec.js --project=desktop
import { test, expect, devices, chromium, webkit } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { settle } from "./helpers.js";

const REGION = { name: /^Cookie-Einstellungen$/ };
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

async function bar(page) {
  const region = page.getByRole("region", REGION);
  await region.waitFor({ state: "visible", timeout: 20_000 });
  return region;
}

// Phone/engine checks open their own browser: Playwright forbids switching
// device or engine per describe block, and the phone projects only run
// smoke/a11y specs (playwright.config.js).
async function onDevice(engine, options, path, fn) {
  const baseURL = test.info().project.use.baseURL || "http://localhost:3000";
  const browser = await engine.launch();
  try {
    const context = await browser.newContext({
      ...options,
      baseURL,
      locale: "de-AT",
    });
    const page = await context.newPage();
    await page.goto(path, { waitUntil: "load" });
    await settle(page);
    await fn(page, context);
  } finally {
    await browser.close();
  }
}

async function severeAxe(page) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    .exclude("nextjs-portal")
    .analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      rule: v.id,
      targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
    }));
}

for (const [label, engine, device] of [
  ["iPhone (WebKit)", webkit, devices["iPhone 15 Pro"]],
  ["Pixel 7 (Chromium)", chromium, devices["Pixel 7"]],
]) {
  test.describe(`Consent-Leiste ${label}`, () => {
    test("höchstens 25 % der Höhe, Hero-Primärknopf frei, gleichwertige Knöpfe", async () => {
      await onDevice(engine, device, "/de", async (page) => {
        const region = await bar(page);
        const box = await region.boundingBox();
        const vh = page.viewportSize().height;
        expect(
          box.height / vh,
          `Leiste ${Math.round(box.height)} von ${vh} px`,
        ).toBeLessThanOrEqual(0.25);

        const hero = page
          .locator(
            "main a.bg-action, main button.bg-action, main [data-cta='primary']",
          )
          .first();
        const heroBox = await hero.boundingBox();
        expect(
          heroBox.y + heroBox.height,
          "Hero-Primärknopf endet über der Leiste",
        ).toBeLessThanOrEqual(box.y);

        const accept = region.getByRole("button", { name: "Alle akzeptieren" });
        const reject = region.getByRole("button", {
          name: "Weiter ohne Einwilligung",
        });
        const style = (l) =>
          l.evaluate((el) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              bg: s.backgroundColor,
              color: s.color,
              border: s.borderTopColor,
              radius: s.borderTopLeftRadius,
              h: Math.round(r.height),
              w: Math.round(r.width),
              shadow: s.boxShadow,
            };
          });
        const [a, r] = [await style(accept), await style(reject)];
        expect(a).toEqual(r);
        expect(a.radius).toBe("0px");
        expect(a.h).toBeGreaterThanOrEqual(44);
        const regionStyle = await region.evaluate((el) => ({
          shadow: getComputedStyle(el).boxShadow,
          radius: getComputedStyle(el).borderTopLeftRadius,
        }));
        expect(regionStyle).toEqual({ shadow: "none", radius: "0px" });
      });
    });
  });
}

test.describe("Consent-Dialog (Desktop)", () => {
  test("Fokus-Falle, Esc, Fokus zurück, Speichern im alten Format", async ({
    page,
    context,
  }) => {
    await page.goto("/de", { waitUntil: "load" });
    await settle(page);
    const region = await bar(page);

    const customize = region.getByRole("button", {
      name: "Individuelle Einstellungen",
    });
    await customize.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Privatsphäre-Einstellungen", // r7-p1: calmer dialog title
    });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate((d) => d.open && d.matches(":modal"))).toBe(
      true,
    );
    expect(
      await page.evaluate(() => !!document.activeElement.closest("dialog")),
    ).toBe(true);

    // Focus stays inside for 40 Tabs (the page behind is inert).
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () =>
          !!document.activeElement.closest("dialog") ||
          document.activeElement === document.body,
      );
      expect(inside, `Tab ${i + 1}`).toBe(true);
    }

    await expect(await severeAxe(page), "axe mit offenem Dialog").toEqual([]);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(region, "ohne Entscheidung bleibt die Leiste").toBeVisible();
    expect(
      await page.evaluate(() => document.activeElement?.textContent?.trim()),
    ).toBe("Individuelle Einstellungen");

    // Decision inside the dialog: format of the cookie unchanged.
    await customize.click();
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Weiter ohne Einwilligung" })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(region).toHaveCount(0);
    const cookie = (await context.cookies()).find(
      (c) => c.name === "cookieConsent",
    );
    expect(Object.keys(JSON.parse(decodeURIComponent(cookie.value)))).toEqual([
      "essential",
      "functional",
      "statistics",
      "marketing",
      "googleMaps",
      "googleTagManager",
      "googleAnalytics",
      "googleAds",
      "einblicke",
    ]);
    expect(JSON.parse(decodeURIComponent(cookie.value)).googleAnalytics).toBe(
      false,
    );
    await expect(
      await severeAxe(page),
      "axe nach Schließen der Leiste",
    ).toEqual([]);
  });

  test("axe mit offener Leiste", async ({ page }) => {
    await page.goto("/de/kontakt", { waitUntil: "load" });
    await settle(page);
    await bar(page);
    await expect(await severeAxe(page)).toEqual([]);
  });

  test("Footer: Privatsphäre-Einstellungen öffnen den Dialog, Esc gibt den Fokus zurück", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "cookieConsent",
        value: encodeURIComponent(JSON.stringify({ essential: true })),
        url: "http://localhost:3000",
      },
    ]);
    await page.goto("/de/kontakt", { waitUntil: "load" });
    await settle(page);
    await expect(page.getByRole("region", REGION)).toHaveCount(0);
    const opener = page
      .locator("#site-footer")
      .getByRole("button", { name: /Privatsphäre|Cookie/ });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(await opener.evaluate((el) => el === document.activeElement)).toBe(
      true,
    );
  });
});

for (const [label, engine, options] of [
  [
    "WebKit 320",
    webkit,
    { viewport: { width: 320, height: 640 }, hasTouch: true },
  ],
  [
    "Chromium 320",
    chromium,
    { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true },
  ],
]) {
  test.describe(`Header ${label}`, () => {
    test("kein Überlauf, Mobilmenü: Fokus auf erstes Element, Esc → Auslöser", async () => {
      await onDevice(engine, options, "/de", async (page) => {
        const row = page.locator("header > div").first();
        const m = await row.evaluate((el) => ({
          sw: el.scrollWidth,
          cw: el.clientWidth,
          doc: document.documentElement.scrollWidth,
        }));
        expect(m.sw).toBeLessThanOrEqual(m.cw);
        expect(m.doc).toBeLessThanOrEqual(320);

        const trigger = page.getByRole("button", { name: "Menü öffnen" });
        const tb = await trigger.boundingBox();
        expect(tb.x + tb.width).toBeLessThanOrEqual(320);
        await trigger.click();
        const menu = page.locator("#ph-mobile-menu");
        await expect(menu).toBeVisible();
        const focus = await page.evaluate(() => {
          const d = document.getElementById("ph-mobile-menu");
          const first = d.querySelector(
            "a[href], button, summary, input, [tabindex]:not([tabindex='-1'])",
          );
          return {
            isFirst: document.activeElement === first,
            label: document.activeElement.getAttribute("aria-label"),
          };
        });
        expect(focus).toEqual({ isFirst: true, label: "Menü schließen" });
        // Opened by pointer: no visible ring, also in WebKit (QA P3-2).
        const ring = await page.evaluate(
          () => getComputedStyle(document.activeElement).outlineStyle,
        );
        expect(ring).toBe("none");
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
        expect(
          await trigger.evaluate((el) => el === document.activeElement),
        ).toBe(true);
      });
    });
  });
}

test.describe("Schlanke Upload-Hülle", () => {
  test("/de/upload/<token>: nur Logo und Zurück, kein Menü, Footer, Banner, CTA-Leiste", async () => {
    await onDevice(
      webkit,
      devices["iPhone 15 Pro"],
      "/de/upload/r3-shell-pruefung",
      async (page) => {
        const shell = page.locator("header[data-shell='bare']");
        await expect(shell).toHaveCount(1);
        await expect(shell.getByRole("link")).toHaveCount(1);
        await expect(
          shell.getByRole("link", { name: "Zurück zur Website" }),
        ).toHaveAttribute("href", "/de");
        await expect(page.locator("#site-footer")).toHaveCount(0);
        await expect(page.locator("#ph-mobile-menu")).toHaveCount(0);
        await expect(page.getByRole("region", REGION)).toHaveCount(0);
        await expect(
          page.getByRole("navigation", { name: "Schnellkontakt" }),
        ).toHaveCount(0);
        await expect(page.locator("main#main")).toHaveCount(1);
        // The page's own legal nav wins: the shell's legal footer is hidden.
        await expect(page.locator("[data-shell-legal]")).toBeHidden();
      },
    );
  });

  // Integration 28.10.2026 (Inhaber-Entscheidung Nr. 9): /de/upload ist jetzt die
  // Service-Seite „Fotos per Handy senden“ (früher /de/labs/upload-demo) mit voller
  // Hülle, nicht mehr ein 404 der schlanken Hülle. Die schlanke Hülle gilt nur für
  // /de/upload/<token> (Test oben).
  test("/de/upload: Service-Seite mit voller Hülle (Footer mit Impressum und Datenschutz)", async () => {
    await onDevice(webkit, devices["iPhone 15 Pro"], "/de/upload", async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Fotos per Handy senden" })).toBeVisible();
      const footer = page.locator("#site-footer");
      await expect(footer).toHaveCount(1);
      await expect(footer.getByRole("link", { name: "Impressum" }).first()).toHaveAttribute("href", "/de/impressum");
      await expect(footer.getByRole("link", { name: "Datenschutz" }).first()).toHaveAttribute("href", "/de/datenschutz");
    });
  });
});
