// WhatsApp-Beratung (Inhaber-Entscheidung Nr. 15, 29.10.2026).
// 1. Ohne WHATSAPP_NUMBER: kein Einstieg, kein wa.me mit Nummer im HTML,
//    keine Anfrage an WhatsApp/Meta.
// 2. Dev-Vorschau (?whatsapp=test, fiktive Testnummer): Hinweis vor dem
//    Wechsel per Tastatur erreichbar, Link korrekt, QR auf Desktop,
//    MobileCtaBar mit drittem Eintrag, Concierge-Übergabe, axe ohne schwere
//    Verstöße. Die Vorschau gibt es nur im Dev-Server – gegen einen
//    Produktionsserver laufen nur die Prüfungen aus Teil 1.
// Laufen mit PW_WORKERS=1 (Dev-Server kompiliert beim ersten Aufruf).
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, PRODUCT_PATH, settle } from "./helpers.js";

const PROD = process.env.npm_lifecycle_event === "test:e2e:prod" || /:3100\b/.test(process.env.BASE_URL || "");
// Gegen einen Server MIT gesetzter Nummer: WHATSAPP_EXPECT=on (dann entfällt Teil 1).
const NUMBER_SET = process.env.WHATSAPP_EXPECT === "on";
const TEST_DIGITS = "15555550100";
const META_HOST = /(^|\.)(whatsapp\.(com|net)|facebook\.(com|net)|fbcdn\.net|wa\.me)$/i;

function watchMetaRequests(page) {
  const hits = [];
  page.on("request", (req) => {
    try {
      if (META_HOST.test(new URL(req.url()).hostname)) hits.push(req.url());
    } catch {
      // data: / blob:
    }
  });
  return hits;
}

test.describe("WhatsApp ohne Nummer", () => {
  test.skip(NUMBER_SET, "Server hat WHATSAPP_NUMBER gesetzt");

  for (const path of ["/de", "/de/kontakt", "/de/beratung", PRODUCT_PATH, "/en/contact"]) {
    test(`kein Einstieg auf ${path}`, async ({ page, request }) => {
      const html = await (await request.get(path)).text();
      expect(html).not.toMatch(/wa\.me\/\d/);
      expect(html).not.toContain("data-whatsapp-entry");
      const meta = watchMetaRequests(page);
      await page.goto(path);
      await settle(page);
      await expect(page.locator("[data-whatsapp-entry], [data-whatsapp-open]")).toHaveCount(0);
      await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
      expect(meta).toEqual([]);
    });
  }

  test("Concierge-API meldet keinen WhatsApp-Kanal als aktiv", async ({ request }) => {
    const res = await request.get("/api/labs/concierge");
    const body = await res.json();
    expect(body.showroom?.whatsapp).not.toBe("on");
    if (PROD) expect(body.showroom?.whatsapp).toBe(false);
  });
});

test.describe("WhatsApp Dev-Vorschau", () => {
  test.skip(PROD || NUMBER_SET, "Vorschau nur im Dev-Server ohne Nummer");

  test("Kontakt: Hinweis zuerst, dann wa.me – per Tastatur", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const meta = watchMetaRequests(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/de/kontakt?whatsapp=test");
    await dismissCookieBanner(page);
    const block = page.locator('[data-whatsapp-entry="block"]');
    await expect(block).toBeVisible();
    await expect(block.getByRole("heading", { name: "Schreiben statt anrufen" })).toBeVisible();
    // Vor dem Klick: kein wa.me-Link mit Nummer auf der Seite
    await expect(page.locator(`a[href^="https://wa.me/${TEST_DIGITS}"]`)).toHaveCount(0);

    const trigger = block.getByRole("button", { name: "Per WhatsApp schreiben" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const hint = block.locator("[data-whatsapp-hint]");
    await expect(hint).toBeVisible();
    await expect(hint.getByText("Sie wechseln zu WhatsApp (Meta)")).toBeFocused();
    await expect(hint).toContainText("USA");
    // Zweck mit Ablage im Kundensystem (QA Recht P1-3)
    await expect(hint).toContainText("in unserem Kundensystem ab");
    await expect(hint).toContainText("Dev-Vorschau");

    const link = hint.locator("a[data-whatsapp-link]");
    const href = await link.getAttribute("href");
    expect(href).toMatch(new RegExp(`^https://wa\\.me/${TEST_DIGITS}\\?text=`));
    expect(new URL(href).searchParams.get("text")).toBe("Guten Tag, ich habe eine Frage zur Einrichtung.");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAccessibleName(/Weiter zu WhatsApp.*öffnet WhatsApp/);
    await expect(hint.getByRole("link", { name: "Datenschutzerklärung" })).toHaveAttribute("href", "/de/datenschutz#whatsapp");
    await expect(hint.getByRole("link", { name: /Telefon/ })).toHaveAttribute("href", "tel:+43557446255");

    // Desktop: lokal erzeugter QR-Code (data:-URL, kein Fremddienst)
    const qr = hint.locator("img[data-whatsapp-qr]");
    await expect(qr).toBeVisible();
    expect(await qr.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);

    // Zielgröße des Haupt-Links und des Auslösers ≥ 44 px Höhe
    for (const el of [trigger, link]) {
      const box = await el.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    const axe = await new AxeBuilder({ page }).include('[data-whatsapp-entry="block"]').withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);

    // Escape schließt, Fokus zurück auf den Auslöser
    await page.keyboard.press("Escape");
    await expect(hint).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(meta).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("#whatsapp öffnet den Hinweis (Concierge-Übergabe)", async ({ page }) => {
    await page.goto("/de/kontakt?whatsapp=test#whatsapp");
    await expect(page.locator('[data-whatsapp-entry="block"] [data-whatsapp-hint]')).toBeVisible();
  });

  test("Produktseite: Frage zu diesem Stück mit Produkt und Seite, ohne Query", async ({ page }) => {
    await page.goto(`${PRODUCT_PATH}?whatsapp=test&utm_source=test`);
    await dismissCookieBanner(page);
    const trigger = page.getByRole("button", { name: "Frage zu diesem Stück per WhatsApp" });
    await expect(trigger).toBeVisible();
    await trigger.click();
    const href = await page.locator("main a[data-whatsapp-link]").first().getAttribute("href");
    const text = new URL(href).searchParams.get("text");
    expect(text).toMatch(/^Guten Tag, ich interessiere mich für .+\./);
    // Name in der Nachricht = H1 der Seite (QA Technik P2-2)
    const h1 = (await page.locator("#product-title").innerText()).replace(/\s+/g, " ").trim();
    expect(text.startsWith(`Guten Tag, ich interessiere mich für ${h1}. `)).toBe(true);
    expect(text).toContain(`https://platzhirsch.studio${PRODUCT_PATH}`);
    expect(text).not.toContain("utm_");
    expect(text).not.toContain("whatsapp=test");
  });

  test("Beratung: Nebenweg „Lieber schreiben?“ unter dem Formular", async ({ page }) => {
    await page.goto("/de/beratung?whatsapp=test");
    const block = page.locator('[data-whatsapp-entry="block"]');
    await expect(block.getByRole("heading", { name: "Lieber schreiben?" })).toBeVisible();
    // Nie ein gefüllter Primärknopf
    await expect(block.locator(".bg-action")).toHaveCount(0);
    await block.getByRole("button", { name: "Per WhatsApp schreiben" }).click();
    const href = await block.locator("a[data-whatsapp-link]").getAttribute("href");
    expect(new URL(href).searchParams.get("text")).toBe("Guten Tag, ich möchte eine Beratung vereinbaren.");
  });

  test("Footer: Textlink mit Hinweis, Sprache EN", async ({ page }) => {
    await page.goto("/en/contact?whatsapp=test");
    await dismissCookieBanner(page);
    const footer = page.locator("#site-footer");
    const trigger = footer.getByRole("button", { name: "Message us on WhatsApp" });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const href = await footer.locator("a[data-whatsapp-link]").getAttribute("href");
    expect(new URL(href).searchParams.get("text")).toBe("Hello, I have a question about furnishing.");
    await expect(footer.locator("[data-whatsapp-hint]")).toContainText("Meta");
  });

  test("MobileCtaBar: dritter Eintrag öffnet den Hinweis über der Leiste", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto(`${PRODUCT_PATH}?whatsapp=test`);
    await dismissCookieBanner(page);
    await page.mouse.wheel(0, 2400);
    const bar = page.getByRole("navigation", { name: "Schnellkontakt" });
    const waBtn = bar.getByRole("button", { name: /Per WhatsApp schreiben/ });
    await expect(waBtn).toBeVisible();
    // Leiste bleibt ohne horizontales Überlaufen
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await waBtn.click();
    const hint = bar.locator("[data-whatsapp-hint]");
    await expect(hint).toBeVisible();
    await expect(hint.locator("a[data-whatsapp-link]")).toHaveAttribute("href", new RegExp(`^https://wa\\.me/${TEST_DIGITS}\\?text=`));
    // Telefone laden keinen QR-Code
    await expect(hint.locator("img[data-whatsapp-qr]")).toHaveCount(0);
    await hint.getByRole("button", { name: "Hinweis schließen" }).click();
    await expect(hint).toHaveCount(0);
    await expect(waBtn).toBeFocused();
  });

  test("?whatsapp=off schaltet die Vorschau wieder aus", async ({ page }) => {
    await page.goto("/de/kontakt?whatsapp=test");
    await expect(page.locator('[data-whatsapp-entry="block"]')).toBeVisible();
    // Sitzungsschalter (im Effekt gemerkt) gilt auch ohne Parameter
    await page.goto("/de/kontakt");
    await expect(page.locator('[data-whatsapp-entry="block"]')).toBeVisible();
    await page.goto("/de/kontakt?whatsapp=off");
    await settle(page);
    await expect(page.locator("[data-whatsapp-entry]")).toHaveCount(0);
  });
});
