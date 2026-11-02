// r8-leads (Fix-Team P3, Runde 3): Mega-Menü Hover+Klick, Wizard-Kontext für
// Yacht/Objekt/Architektur, stimmige Bestätigung, Kopf von /beratung,
// Kontext aus Yacht-Schluss-CTA und Dreiländer-Rechner.
//   PW_WORKERS=1 npx playwright test tests/e2e/r8-leads-context.spec.js --project=desktop
// Forms are only ever answered by route.fulfill (blockFormSends + mock), no
// real lead reaches the backoffice.
import { test, expect } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, settle } from "./helpers.js";

const OK = { success: true, message: "ok", data: {} };

async function mockSend(page, path) {
  const sent = [];
  await page.route(`**${path}`, (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request().postDataJSON());
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(OK) });
  });
  return sent;
}

test.describe("Mega-Menü (ux P1-1)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("Hover öffnet, der folgende Klick lässt es offen; zweiter Klick, Enter und Escape funktionieren", async ({ page }) => {
    await page.goto("/de");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const trigger = page.locator("#ph-nav-trigger-services");
    // Hover, wait for the 300 ms open delay, then click (the typical mouse path).
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#ph-nav-panel-services")).toBeVisible();
    // A second click closes.
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Hover + click within the open delay opens at once and stays open.
    await page.mouse.move(10, 600);
    const kitchen = page.locator("#ph-nav-trigger-kitchen");
    await kitchen.click();
    await expect(kitchen).toHaveAttribute("aria-expanded", "true");
    await page.waitForTimeout(400);
    await expect(kitchen).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(kitchen).toHaveAttribute("aria-expanded", "false");
    await expect(kitchen).toBeFocused();
    // Keyboard: Enter toggles, Escape closes and returns focus.
    await page.mouse.move(10, 600);
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  // R4 (bewusst geändert): ux P1-3 / Inhaber-Entscheidung Nr. 9 – Outdoor-
  // Gartenplanung und Handy-Upload gehören ins Menü; nur der Showroom-Rundgang
  // ohne Aufnahme bleibt draußen. technik P1-2: die Panel-Links entstehen erst
  // beim Öffnen (nicht mehr im RSC-Payload), darum werden alle Panels geöffnet.
  test("Menü: Outdoor-Gartenplanung und Upload drin, kein Showroom-Rundgang", async ({ page }) => {
    await page.goto("/de");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    const hrefs = [];
    for (const t of await page.locator("header nav button[id^='ph-nav-trigger-']").all()) {
      await t.click();
      const id = (await t.getAttribute("aria-controls")) || "";
      await expect(page.locator(`#${id} a`).first()).toBeVisible();
      hrefs.push(...(await page.locator(`#${id} a[href]`).evaluateAll((as) => as.map((a) => a.getAttribute("href")))));
      await page.keyboard.press("Escape");
    }
    expect(hrefs.length).toBeGreaterThan(20);
    expect(hrefs).not.toContain("/de/showroom");
    for (const good of ["/de/outdoor-gartenplanung", "/de/upload"]) expect(hrefs).toContain(good);
  });
});

test.describe("Wizard-Kontext (ux P1-2)", () => {
  for (const [thema, option, heading] of [
    ["yacht", "ein Yacht-Interieur", "Beratung für Ihr Yacht-Interieur"],
    ["objekt", "ein Objekt oder Hotel", "Beratung für Hotel und Objekt"],
    ["hotel", "ein Objekt oder Hotel", "Beratung für Hotel und Objekt"],
    ["architekt", "ein Projekt meines Architektur- oder Planungsbüros", "Für Architektur- und Planungsbüros"],
  ]) {
    test(`?thema=${thema}: Schritt 1 vorbelegt, Überschrift passt`, async ({ page }) => {
      await blockFormSends(page);
      await page.goto(`/de/beratung?thema=${thema}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.getByRole("radio", { name: option })).toBeChecked();
    });
  }

  test("Yacht: Bestätigung ohne „Neubau“ und ohne doppelten Ort (gemockt)", async ({ page }) => {
    await blockFormSends(page);
    const sent = await mockSend(page, "/api/upload/inquiry/beratung");
    await page.goto("/de/beratung?thema=yacht");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    // The yacht picture carries the visible AI label.
    await expect(page.locator("[data-ki-label]").first()).toBeVisible();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByRole("radio", { name: "auf einem Boot oder einer Yacht" })).toBeChecked();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorhaben").press("ControlOrMeta+End");
    await page.locator("#beratung-vorhaben").pressSequentially("Salon und zwei Kabinen.");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.locator("#beratung-vorname").fill("Erika");
    await page.locator("#beratung-nachname").fill("Muster");
    await page.locator("#beratung-email").fill("erika@example.com");
    await page.locator("#beratung-telefon").fill("+43 664 1234567");
    await page.getByRole("button", { name: "Absenden" }).click();
    await expect.poll(() => sent.length).toBe(1);
    expect(sent[0].bei_meiner_anfrage_geht_es_um).toBe("ein Yacht-Interieur");
    expect(sent[0].das_projekt_soll_verwirklicht_werden).toBe("auf einem Boot oder einer Yacht");
    const box = page.locator("[data-confirmation=beratung]");
    await expect(box).toContainText("ein Yacht-Interieur");
    await expect(box).not.toContainText("Neubau");
    await expect(box).not.toContainText("auf einem Boot oder einer Yacht");
  });

  test("Thema „Objekt oder Hotel“ gewählt → Ort Hotel/Gastronomie vorbelegt", async ({ page }) => {
    await blockFormSends(page);
    await page.goto("/de/beratung");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    // Rat 9,5 C3 (UX10): Schritt 1 zeigt sechs Karten, die übrigen Themen hinter „Andere Anliegen“.
    await page.locator("[data-beratung-more]").click();
    await page.getByRole("radio", { name: "ein Objekt oder Hotel" }).check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.getByRole("radio", { name: /Hotel oder einer Gastronomie/ })).toBeChecked();
  });
});

test.describe("Kontext erhalten (ux P1-3)", () => {
  test("Yacht: Schluss-CTA „Termin anfragen“ mit ?thema=yacht", async ({ page }) => {
    await page.goto("/de/yacht-interior");
    const closing = page.locator("section").filter({ has: page.getByRole("heading", { name: "Termin an Bord oder im Showroom" }) });
    // Rat 9,5 B1 (bewusst geändert): Wort und Ziel aus dem zentralen Terminhelfer – mit Kalender
    // „Termin wählen“ → /termin plus Nebenweg „Lieber schreiben“ → /beratung, sonst „Termin anfragen“
    // → /beratung. Das Thema yacht läuft auf jedem Weg mit.
    const termin = closing.getByRole("link", { name: /^Termin (wählen|anfragen)$/ });
    const href = await termin.getAttribute("href");
    if (href.startsWith("/de/termin")) {
      expect(href).toBe("/de/termin?thema=yacht");
      await expect(closing.getByRole("link", { name: "Lieber schreiben" })).toHaveAttribute("href", "/de/beratung?thema=yacht");
    } else {
      expect(href).toBe("/de/beratung?thema=yacht");
    }
  });

  test("Dreiländer-Rechner: „Termin anfragen“ trägt Land und Wertband, Standard-Buttons", async ({ page }) => {
    await page.goto("/de/dreilaender-rechner");
    await settle(page);
    const termin = page.locator("[data-dl-termin]");
    await expect(termin).toHaveAttribute("href", /\/de\/beratung\?planer=dreilaender&land=CH&wert=15000-50000/);
    await expect(termin).toHaveText("Termin anfragen");
    // No upper-case gold buttons any more.
    const transforms = await page.locator("main a, main button").evaluateAll((els) =>
      els.filter((e) => getComputedStyle(e).textTransform === "uppercase").map((e) => e.textContent.trim())
    );
    expect(transforms).toEqual([]);
    // The wizard turns the band into a readable line (no exact amount).
    await blockFormSends(page);
    await page.goto("/de/beratung?planer=dreilaender&land=CH&wert=15000-50000");
    await page.getByRole("radio", { name: "eine Küche" }).check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.getByRole("radio", { name: "in einer Wohnung" }).check();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-vorhaben")).toHaveValue(
      "Aus dem Dreiländer-Rechner: Lieferland Schweiz, Warenwert 15.000 bis 50.000 € (Richtwert).\n"
    );
  });

  test("Header-„Termin“ auf Sofaplaner und Produktseite trägt den Kontext", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de/sofaplaner");
    // Online-Kalender (Inhaber Nr. 12, bewusst geändert): Header-„Termin“ führt auf /de/termin,
    // solange der Kalender aktiv ist (sonst /de/beratung) – der Kontext bleibt in beiden Fällen.
    await expect(page.locator("header a[data-header-cta]")).toHaveAttribute("href", /^\/de\/(termin|beratung)\?thema=sofa&planer=sofaplaner$/);
    await page.goto("/de/produkte/lamps/lamps-2097-18");
    await settle(page);
    const h1 = (await page.locator("main h1").first().textContent()).trim().replace(/\s+/g, " ");
    const query = String(new URLSearchParams({ produkt: h1 })).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(page.locator("header a[data-header-cta]")).toHaveAttribute("href", new RegExp(`^/de/(termin|beratung)\\?${query}$`));
  });
});
