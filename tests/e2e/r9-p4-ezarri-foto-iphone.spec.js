// Runde 5 (neuland P1-3): Ezarri-Konfigurator „Eigenes Foto“ mit perspektivischer
// Montage. Vier Eckpunkte ziehbar (Zeiger/Finger), per Pfeiltasten und ohne
// Ziehen per Ecke-Wahl + Regler (WCAG 2.5.7). Das Foto bleibt im Browser:
// Es darf keine Anfrage mit dem Foto rausgehen. Hier: iPhone 15 Pro (WebKit,
// Tippen + Touch-Ziehen); Desktop steht in r9-p4-ezarri-foto.spec.js.
import { test, expect, devices } from "@playwright/test";
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

test.use({ ...devices["iPhone 15 Pro"], browserName: "webkit" });

test.describe("Ezarri – eigenes Foto in Perspektive (iPhone)", () => {
  test("Ecken antippen und mit dem Finger ziehen, Ziele ≥ 44 px, kein seitliches Scrollen", async ({ page }) => {
    const { box, uploads } = await oeffnen(page);
    const griffe = box.locator("[data-ezk-ecke]");
    for (let i = 0; i < 4; i++) {
      const b = await griffe.nth(i).boundingBox();
      expect(b.width).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
    }
    const ur = box.locator('[data-ezk-ecke="ur"]');
    await ur.scrollIntoViewIfNeeded();
    await ur.tap();
    await expect(ur).toHaveAttribute("aria-pressed", "true");
    const vor = await ur.getAttribute("aria-label");
    // Touch-Ziehen per Pointer-Events (WebKit-Touch über CDP gibt es nicht).
    const m = await eckenMitte(ur);
    await ur.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", clientX: m.x, clientY: m.y, isPrimary: true, bubbles: true });
    await ur.dispatchEvent("pointermove", { pointerId: 7, pointerType: "touch", clientX: m.x - 30, clientY: m.y - 25, isPrimary: true, bubbles: true });
    await ur.dispatchEvent("pointerup", { pointerId: 7, pointerType: "touch", clientX: m.x - 30, clientY: m.y - 25, isPrimary: true, bubbles: true });
    await expect(ur).not.toHaveAttribute("aria-label", vor);
    await flaecheSitztAufEcken(box);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    expect(uploads).toEqual([]);
    await page.screenshot({ path: "qa-screenshots/fertig/r5-fix-p4/ezarri-eigenes-foto--iphone.png" });
  });
});
