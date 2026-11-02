// Runde 5 (neuland P1-3): Ezarri-Konfigurator „Eigenes Foto“ mit perspektivischer
// Montage. Vier Eckpunkte ziehbar (Zeiger/Finger), per Pfeiltasten und ohne
// Ziehen per Ecke-Wahl + Regler (WCAG 2.5.7). Das Foto bleibt im Browser:
// Es darf keine Anfrage mit dem Foto rausgehen. Desktop (Chromium) und
// iPhone 15 Pro (WebKit, Tippen + Touch-Ziehen).
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { blockFormSends } from "./helpers.js";

const PAGE = "/de/ezarri/konfigurator";
const FOTO = path.resolve("public/ezarri/allgemein/anw-azur-50-iris-mosaic-ezarri-pool-1-1600.webp");
const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function oeffnen(page) {
  const origin = new URL(test.info().project.use.baseURL || "http://localhost:3000").origin;
  await page.context().addCookies([consent(origin)]);
  await blockFormSends(page);
  const uploads = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && (r.postDataBuffer()?.length || 0) > 50_000) uploads.push(r.url());
  });
  await page.goto(PAGE, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await expect(page.locator("[data-ezk-ready]")).toBeAttached({ timeout: 150_000 });
  await page.getByRole("tab", { name: "Becken" }).click();
  const box = page.locator("[data-ezk-eigenes-foto]");
  await box.scrollIntoViewIfNeeded();
  await box.locator('input[type="file"]').setInputFiles({ name: "becken.webp", mimeType: "image/webp", buffer: fs.readFileSync(FOTO) });
  await expect(box.locator("[data-ezk-foto-buehne] img")).toBeVisible();
  return { box, uploads };
}

async function eckenMitte(loc) {
  const b = await loc.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/**
 * Prüft per Pixel, dass die Montage genau im Viereck der vier Griffe liegt:
 * am Schwerpunkt deckend, je Griff 10 px nach innen deckend und 12 px nach
 * außen leer.
 */
async function flaecheSitztAufEcken(box) {
  await expect
    .poll(async () =>
      box.evaluate((root) => {
        const c = root.querySelector("[data-ezk-foto-flaeche]");
        const r = c.getBoundingClientRect();
        const ctx = c.getContext("2d");
        const sx = c.width / r.width;
        const sy = c.height / r.height;
        const g = [...root.querySelectorAll("[data-ezk-ecke]")].map((el) => {
          const b = el.getBoundingClientRect();
          return { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top };
        });
        const alpha = (x, y) => ctx.getImageData(Math.round(x * sx), Math.round(y * sy), 1, 1).data[3];
        const mx = g.reduce((s, p) => s + p.x, 0) / 4;
        const my = g.reduce((s, p) => s + p.y, 0) / 4;
        const ok = g.every((p) => {
          const dx = p.x - mx;
          const dy = p.y - my;
          const l = Math.hypot(dx, dy);
          const ax = p.x + (dx / l) * 12;
          const ay = p.y + (dy / l) * 12;
          const aussenLeer = ax < 0 || ay < 0 || ax >= r.width || ay >= r.height || alpha(ax, ay) === 0;
          return aussenLeer && alpha(p.x - (dx / l) * 10, p.y - (dy / l) * 10) > 0;
        });
        return alpha(mx, my) > 0 && ok;
      }),
    )
    .toBe(true);
}

test.describe("Ezarri – eigenes Foto in Perspektive (Desktop)", () => {
  test("Ecke ziehen, Pfeiltasten, Regler; Fläche folgt den Ecken, kein Upload", async ({ page }) => {
    const { box, uploads } = await oeffnen(page);
    await expect(box.locator("[data-ezk-ecke]")).toHaveCount(4);
    await flaecheSitztAufEcken(box);

    // Ziehen: Ecke oben rechts nach links/oben
    const or = box.locator('[data-ezk-ecke="or"]');
    const vor = await or.getAttribute("aria-label");
    const m = await eckenMitte(or);
    await page.mouse.move(m.x, m.y);
    await page.mouse.down();
    await page.mouse.move(m.x - 40, m.y - 20, { steps: 6 });
    await page.mouse.up();
    await expect(or).not.toHaveAttribute("aria-label", vor);
    await flaecheSitztAufEcken(box);

    // Tastatur: Ecke unten links fokussieren, 5× rechts, 1× Umschalt+oben
    const ul = box.locator('[data-ezk-ecke="ul"]');
    await ul.focus();
    await expect(ul).toHaveAttribute("aria-label", /6 % von links, 88 % von oben/);
    for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowUp");
    await expect(ul).toHaveAttribute("aria-label", /11 % von links, 83 % von oben/);
    await expect(ul).toHaveAttribute("aria-pressed", "true");

    // Ohne Ziehen: Ecke „oben links“ wählen, Regler setzen
    await box.getByRole("radio", { name: "oben links" }).check();
    const regler = box.getByRole("slider", { name: /oben links – waagrecht/ });
    await regler.fill("30");
    await expect(box.locator('[data-ezk-ecke="ol"]')).toHaveAttribute("aria-label", /30 % von links/);

    // Überkreuzen wird abgewiesen
    await regler.fill("100");
    await expect(box.locator("[data-ezk-foto-status]")).toContainText("überkreuzen");
    await flaecheSitztAufEcken(box);

    await box.getByRole("button", { name: "Fläche zurücksetzen" }).click();
    await expect(box.locator('[data-ezk-ecke="ol"]')).toHaveAttribute("aria-label", /22 % von links, 44 % von oben/);
    expect(uploads).toEqual([]);

    await box.getByRole("button", { name: "Foto entfernen" }).click();
    await expect(box.locator("[data-ezk-foto-buehne]")).toHaveCount(0);
  });
});

