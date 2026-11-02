// AR-Viewer, Restliste nach QA R2 (feedback-2.md, P2/P3):
//   Pinch-Zoom-Ansicht der Fotos (Knopf, Tastatur, Esc), Höhen-Bedingung mit Beleg,
//   ClassiCon-Pilot Stufe 2b (Raumbedarf aus dem Product Sheet).
// Nichts wird gesendet.
//   PW_WORKERS=1 npx playwright test tests/e2e/ar-viewer-feinschliff.spec.js --project=desktop
import { test, expect as baseExpect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers.js";

const expect = baseExpect.configure({ timeout: 90_000 });

test.describe("AR-Viewer Feinschliff (Desktop)", () => {
  test.setTimeout(300_000);

  test("Fotos: „Bild vergrößern“ öffnet den Zoom, + vergrößert, Esc schließt, Fokus kehrt zurück", async ({ page }) => {
    await page.goto("/de/3d-ansicht/lamps-265-chromatica");
    await dismissCookieBanner(page);
    const start = page.getByTestId("arv-zoom-start");
    await expect(start).toBeVisible();
    await start.click();
    const dlg = page.getByTestId("arv-zoom");
    await expect(dlg).toBeVisible();
    await expect(page.getByTestId("arv-zoom-stufe")).toHaveText("100 %");
    await dlg.getByRole("button", { name: "Vergrößern" }).click();
    await expect(page.getByTestId("arv-zoom-stufe")).toHaveText("150 %");
    await expect(page.getByTestId("arv-zoom-flaeche")).toHaveAttribute("data-scale", "1.50");
    await page.keyboard.press("0");
    await expect(page.getByTestId("arv-zoom-stufe")).toHaveText("100 %");
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    await expect(start).toBeFocused();
  });

  test("Fotos: Klick aufs Foto öffnet den Zoom ohne Seitenfehler", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/de/3d-ansicht/lamps-265-chromatica");
    await dismissCookieBanner(page);
    await expect(page.getByTestId("arv-zoom-start")).toBeVisible();
    await page.getByTestId("arv-fotos").locator('[aria-roledescription="Folie"]').first().click();
    await expect(page.getByTestId("arv-zoom")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("Jazz-Liege: Höhe mit Bedingung laut Datenblatt", async ({ page }) => {
    await page.goto("/de/3d-ansicht/sun-loungers-jazz-lounger");
    await expect(page.getByTestId("arv-hoehe-hinweis")).toContainText("Höhe 50 cm mit flacher Rückenlehne und Nackenrolle; Liegefläche 32 cm (laut Datenblatt)");
  });

  test("ClassiCon Lota: Raumbedarf aus dem Product Sheet mit Quelle", async ({ page }) => {
    await page.goto("/de/3d-ansicht/sofas-couches-lota-sofa");
    const masse = page.getByTestId("arv-produkt-masse");
    await expect(masse).toContainText("240 cm");
    await expect(masse).toContainText("95 cm");
    await expect(masse).toContainText("85 cm");
    await expect(masse.getByRole("link", { name: /Datenblatt ClassiCon/ })).toHaveAttribute("href", /classicon\.com\/files\/classicon\/Product%20Sheets\/ClassiCon-Lota-Sofa/);
    await expect(page.getByTestId("arv-produkt-buehne")).toHaveAttribute("data-view", "raum");
  });
});
