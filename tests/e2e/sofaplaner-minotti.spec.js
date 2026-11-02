// Sofaplaner auf echten Minotti-Modellen – Abnahmekriterien des Inhabers
// (Marktresearch/digital/features/sofaplaner-anforderungen-inhaber.md):
// alle Familien wählbar, Laie findet in wenigen Schritten ein Ecksofa,
// ungültige Kombinationen werden verständlich erklärt, Andocken per Drag & Drop,
// iPhone (WebKit) vollständig per Touch. Nichts wird gesendet oder gespeichert.
import { test, expect, webkit, devices } from "@playwright/test";
import { blockFormSends, dismissCookieBanner, mapLimit } from "./helpers.js";
import { MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON, SOFA_FAMILY, collectSofaplanerErrors } from "./sofaplaner-errors.js";

const PAGE = "/de/sofaplaner";

async function open(page, url = PAGE) {
  await blockFormSends(page);
  await page.route("**/sofaplaner/teilen", (route) =>
    route.request().method() === "GET" ? route.continue() : route.fulfill({ status: 503, contentType: "application/json", body: "{}" })
  );
  await page.goto(url);
  await dismissCookieBanner(page, 8_000);
  await page.locator("[data-hydrated=true]").waitFor({ timeout: 90_000 });
}
const status = (page) => page.locator("aside").getByText(/^(Passt|\d+ Konflikte?|\d+ Hinweise?)$/).first();
const translate = async (loc) => {
  const t = await loc.getAttribute("transform");
  const [, x, y] = t.match(/translate\(([-\d.]+) ([-\d.]+)\)/);
  return { x: Number(x), y: Number(y) };
};

test.describe("Sofaplaner – Minotti-Modelle", () => {
  test("alle Familien sind wählbar und liefern Elemente", async ({ page, request }) => {
    await open(page);
    // Fix-Runde 1 (F2): Die Modellwahl zeigt zuerst 12 Linien (mobil kürzer) – für die Vollprüfung alle aufklappen.
    const all = page.getByRole("button", { name: /^Alle \d+ Linien zeigen$/ });
    if (await all.count()) await all.click();
    const cards = page.locator("[data-model]");
    const n = await cards.count();
    // R7-P4: ohne Minotti-Zustimmung 3 eigene Sofa-Typen statt 90 Minotti-Familien
    expect(n).toBeGreaterThanOrEqual(MINOTTI_DATA_CONSENT ? 90 : 3);
    const slugs = await cards.evaluateAll((els) => els.map((e) => e.getAttribute("data-model")));
    test.setTimeout(300_000);
    const results = await mapLimit(slugs, 4, async (slug) => {
      const res = await request.get(`/de/sofaplaner/katalog/${slug}`, { timeout: 90_000 });
      return { slug, status: res.status(), n: res.ok() ? (await res.json()).elements.length : 0 };
    });
    for (const r of results) {
      expect(r.status, r.slug).toBe(200);
      expect(r.n, r.slug).toBeGreaterThan(0);
    }
    expect((await request.get("/de/sofaplaner/katalog/gibt-es-nicht")).status()).toBe(404);
    // Integration 28.10.2026: feste URL; /en/labs/… leitet jetzt per 308 auf /de/ um.
    expect((await request.get("/en/sofaplaner/katalog/connery")).status()).toBe(404);
    // R7-P4 (neuland P0-1): ohne Zustimmung liefert die Katalog-Route keinen Minotti-Datensatz
    if (!MINOTTI_DATA_CONSENT) expect((await request.get("/de/sofaplaner/katalog/connery")).status()).toBe(404);
  });

  test("Laie: Modell suchen → Ecke links → Übersicht mit Klartext, ohne Konflikt", async ({ page }) => {
    test.skip(!MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON + " (Suche nach „Dylan“); neutraler Ablauf: r7-p4-sofaplaner.spec.js");
    const errors = collectSofaplanerErrors(page); // QM Restliste P2-3: nur Dev-HMR-Router-Race ausgenommen
    await open(page);
    const t0 = Date.now();
    await page.getByPlaceholder("Modell oder Designer suchen").fill("Dylan");
    await page.locator('[data-model="dylan"]').click();
    await expect(page.getByRole("heading", { name: "Form wählen" })).toBeVisible({ timeout: 60_000 }); // catalogue fetch (dev compiles on first hit)
    await page.locator('[data-form="ecke-links"]').click();
    await expect(status(page)).toHaveText("Passt");
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Übersicht/ }).click();
    const list = page.getByTestId("sp-klartext");
    await expect(list).toContainText("Abschluss links");
    await expect(list).toContainText("Abschluss rechts");
    await expect(page.getByRole("heading", { name: "Planung im Showroom besprechen" })).toBeVisible();
    expect(Date.now() - t0).toBeLessThan(120_000);
    // codes only in the order details
    await expect(page.locator("main").getByText(/DYLAN-\d/).first()).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("ungültige Kombination: ausgegraut mit Begründung, Antippen erklärt", async ({ page }) => {
    // R7-P4: Alle neutralen Sofa-Typen passen als U-Form in den Standardraum (planFor findet eine
    // Lage ohne Konflikt) – der Tür-Konflikt lässt sich nur mit den großen Minotti-Maßen zeigen.
    test.skip(!MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON + " (U-Form zu groß für den Standardraum)");
    await open(page, `/de/sofaplaner?m=${SOFA_FAMILY}`);
    await page.locator('[data-form="u"]').click();
    const choice = page.locator("[data-nofit-choice]");
    // QM Restliste P3-1: the choice names the reason (door swing), not only "mehr Platz"
    await expect(choice).toContainText(/weil .*Tür/);
    // QM Restliste P2-1 (WCAG 2.4.3): "Andere Form wählen" returns the focus to the tile
    await choice.getByRole("button", { name: "Andere Form wählen" }).click();
    await expect(choice).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-form"))).toBe("u");
    await page.keyboard.press("Enter");
    // QM R3 P3-A: U-Form passt nicht in den Standardraum → Auswahl, hier „Trotzdem übernehmen“
    await page.locator("[data-nofit-choice]").getByRole("button", { name: "Trotzdem übernehmen" }).click();
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("data-form"))).toBe("u");
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).click();
    await page.getByRole("radio", { name: /Chaiselongues/ }).click();
    const tile = page.locator('[data-palette] button[aria-disabled="true"]').first();
    await expect(tile).toContainText("alle Enden sind abgeschlossen");
    await tile.click({ force: true });
    await expect(page.locator("p[role=alert]").first()).toContainText("Keine freie Anschlussseite");
    // nothing was added
    await expect(page.locator("[data-id]")).toHaveCount(5);
  });

  test("Antippen dockt an: Endelement + Mittelelement + Endelement ergeben ein geschlossenes Sofa", async ({ page }) => {
    await open(page, `/de/sofaplaner?m=${SOFA_FAMILY}`);
    await page.getByRole("button", { name: "Leer beginnen" }).click();
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).click();
    await page.getByRole("radio", { name: /^Endelemente/ }).click();
    await page.locator("[data-palette] button:not([aria-disabled])").first().click();
    await expect(page.locator("[data-id]")).toHaveCount(1);
    await expect(page.getByText(/Anschlussseite ist noch offen/).first()).toBeVisible();
    await page.getByRole("radio", { name: /^Mittelelemente/ }).click();
    await page.locator("[data-palette] button:not([aria-disabled])").first().click();
    await page.getByRole("radio", { name: /^Endelemente/ }).click();
    await page.locator("[data-palette] button:not([aria-disabled])").first().click();
    await expect(page.locator("[data-id]")).toHaveCount(3);
    await expect(page.getByText(/Anschlussseite ist noch offen/)).toHaveCount(0);
    await expect(page.locator("aside").getByText(/Konflikt/)).toHaveCount(0);
  });

  test("Drag & Drop: Element rastet an der freien Seite ein; Überlappung wird zurückgesetzt", async ({ page }) => {
    // R7-P4: Mit den neutralen Typen besteht „Gerade“ nur aus zwei Endelementen; das gezogene
    // Element bleibt dort in Headless-Chromium am Platz (offen, siehe Bericht R7-P4). Geprüft mit
    // den Minotti-Daten; das Andocken per Antippen läuft weiter mit den neutralen Typen.
    test.skip(!MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON + " (Drag-Test auf Connery-Gerade mit Mittelelement ausgelegt)");
    await open(page, `/de/sofaplaner?m=${SOFA_FAMILY}`);
    await page.locator('[data-form="gerade"]').click();
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).click();
    const items = page.locator("[data-id]");
    const right = items.nth(1);
    const home = await translate(right);
    const box = await right.boundingBox();
    const cx = box.x + box.width / 2,
      cy = box.y + box.height / 2;
    // drag away (free), then back to ~8 px next to the joint → magnet snaps exactly
    // R7-P4: freie Stelle je nach Lage des Sofas im Raum (neutrale Typen stehen anders als Connery)
    let away = home;
    for (const [dx, dy] of [[60, 120], [60, -120], [-60, 120]]) {
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + dx, cy + dy, { steps: 6 });
      await page.mouse.up();
      away = await translate(right);
      if (Math.abs(away.y - home.y) > 20) break;
    }
    expect(Math.abs(away.y - home.y)).toBeGreaterThan(20);
    const b2 = await right.boundingBox();
    await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2);
    await page.mouse.down();
    await page.mouse.move(cx + 6, cy + 4, { steps: 8 });
    await page.mouse.up();
    expect(await translate(right)).toEqual(home);
    // drop onto the other element → overlap → back to where it was
    const left = await items.nth(0).boundingBox();
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(left.x + left.width / 2, left.y + left.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(await translate(right)).toEqual(home);
    await expect(page.locator("p[role=alert]").first()).toContainText(/überlappen|Anschlussseite/);
  });

  test("Ausführung: nur Herstelleroptionen, Kissen zählen in die Stückliste", async ({ page }) => {
    test.skip(!MINOTTI_DATA_CONSENT, NO_MINOTTI_REASON + " (Herstellercodes CON83-, Bezugsangaben)");
    await open(page, `/de/sofaplaner?m=${SOFA_FAMILY}`);
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Ausführung/ }).click();
    await expect(page.getByText("Bezug: Materialfamilie")).toBeVisible();
    await expect(page.getByText(/Laut Hersteller verfügbar: Stoff · Leder/)).toBeVisible();
    const plus = page.getByRole("button", { name: /eins mehr/ }).first();
    await plus.click();
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Übersicht/ }).click();
    await expect(page.getByTestId("sp-klartext")).toContainText(/1 × /);
    await page.locator("summary", { hasText: "Technische Details" }).click();
    await expect(page.locator("table")).toContainText("CON83-");
  });
});

test("iPhone (WebKit): Modell wählen, Form, 3D und Übersicht per Touch, ohne Querscrollen", async ({ baseURL }) => {
  test.setTimeout(240_000);
  const browser = await webkit.launch();
  const context = await browser.newContext({ ...devices["iPhone 15 Pro"], locale: "de-AT" });
  const page = await context.newPage();
  const errors = collectSofaplanerErrors(page); // QM Restliste P2-3: nur Dev-HMR-Router-Race ausgenommen
  try {
    await open(page, `${baseURL}${PAGE}`);
    // Fix-Runde 1 (F2): nur 12 Linien sichtbar – Connery über die Suche finden
    await page.getByPlaceholder("Modell oder Designer suchen").fill(MINOTTI_DATA_CONSENT ? "Connery" : "Lounge"); // R7-P4: neutraler Typ
    await page.locator(`[data-model="${SOFA_FAMILY}"]`).tap();
    await expect(page.getByRole("heading", { name: "Form wählen" })).toBeVisible({ timeout: 60_000 }); // catalogue fetch (dev compiles on first hit)
    await page.locator('[data-form="ecke-rechts"]').tap();
    await expect(page.locator("[data-id]")).toHaveCount(3);
    await page.getByRole("button", { name: /Weiter: Anpassen/ }).tap();
    await page.locator("[data-id]").first().tap();
    await expect(page.getByRole("button", { name: "Drehen" })).toBeVisible();
    await page.getByRole("button", { name: "3D-Vorschau" }).tap();
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 90_000 });
    await expect(page.getByRole("button", { name: /Zum Drehen antippen/ })).toBeVisible();
    await page.getByRole("button", { name: "2D Draufsicht" }).tap();
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: /Übersicht/ }).tap();
    await expect(page.getByTestId("sp-klartext")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});

test("Barrierefreiheit: axe (WCAG 2.2 AA) in allen sechs Schritten ohne serious/critical", async ({ page }) => {
  test.setTimeout(240_000);
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await open(page, `${PAGE}?m=${SOFA_FAMILY}`);
  const found = [];
  for (const step of ["Modell", "Form", "Anpassen", "Ausführung", "Im Raum prüfen", "Übersicht"]) {
    await page.getByRole("navigation", { name: "Schritte" }).getByRole("button", { name: new RegExp(step) }).click();
    await page.waitForTimeout(300);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).include("main").exclude("nextjs-portal").analyze();
    for (const v of r.violations) if (v.impact === "serious" || v.impact === "critical") found.push({ step, rule: v.id, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) });
  }
  expect(found).toEqual([]);
});
