// tests/e2e/r5-conv-p3.spec.js — Runde 4, Fix-Team P3 „Conversion-Pfade“:
// Leistungen ohne Mock/Showroom/noindex-Links, Concierge-Gating, Termin-Kontext
// im Footer, Beratung/Kontakt im ersten Bildschirm (iPhone 13), 3D-Beispiel,
// Telefon freiwillig. Es wird nichts gesendet: jeder POST an /api wird
// abgefangen (route.fulfill), echte Formulare/Mails gehen nie raus.
// Run: PW_WORKERS=1 npx playwright test tests/e2e/r5-conv-p3.spec.js --project=desktop --reporter=list
import { test, expect, devices } from "@playwright/test";
import { dismissCookieBanner, settle } from "./helpers.js";

const SLOW = { timeout: 300_000 };
const { defaultBrowserType: _d, ...IPHONE13 } = devices["iPhone 13"];

test.describe.configure({ timeout: 600_000 });

/** Every POST to /api answered locally – nothing reaches the backoffice. */
async function mockPosts(page) {
  const sent = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
    sent.push({ url: req.url(), body: req.postDataJSON?.() ?? null });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });
  return sent;
}

test("Leistungen: kein Mock, kein PH-DEMO, kein 3D-Raum, keine noindex-/307-Ziele (alle Sprachen)", async ({ request }) => {
  for (const l of ["de", "en", "fr", "it"]) {
    const res = await request.get(`/${l}/leistungen`, SLOW);
    expect(res.status(), l).toBe(200);
    const html = await res.text();
    expect(html, l).not.toMatch(/begehbar|3D-Raum|Mock|PH-DEMO/);
    // Runde 5 (P3, ux P1-4, bewusst geänderte Erwartung): die Übersicht zeigt
    // wie das Menü Upload und Portal (Anmeldung direkt, kein 307); Garten &
    // Terrasse steht als Link unter „Beraten & planen“, MCP unter „Für
    // Fachleute“ – beide ohne Karte. Der Showroom bleibt ohne Aufnahme weg.
    expect(html, l).toContain('data-feature="kuechenplaner"');
    expect(html, l).toContain('data-feature="upload"');
    expect(html, l).toContain('data-feature="portal"');
    expect(html, l).not.toMatch(/data-feature="(showroom|outdoor|agent)"/);
    expect(html, l).not.toMatch(/href="\/de\/portal"/);
  }
});

test("Concierge ohne echten KI-Schlüssel: keine Karte, Seite mit Hinweis und „Termin anfragen“", async ({ request }) => {
  const { mode } = await (await request.get("/api/labs/concierge", SLOW)).json();
  test.skip(mode === "live", "Server mit echtem KI-Schlüssel");
  const hub = await (await request.get("/de/leistungen", SLOW)).text();
  expect(hub).not.toContain('data-feature="concierge"');
  const page = await (await request.get("/de/concierge", SLOW)).text();
  expect(page).toContain("data-concierge-ersatz");
  expect(page).toContain("Termin anfragen");
  expect(page).toMatch(/noindex/);
  expect(page.match(/<main[\s>]/g) || []).toHaveLength(1);
});

test("Yacht-Interieur: alle Termin-Links der Seite, des Footers und der Leiste mit ?thema=yacht", async ({ page }) => {
  await mockPosts(page);
  await page.goto("/de/yacht-interior", SLOW);
  await settle(page);
  // Mega-Menü-Panels (Navbar) ausgenommen: sie gehören zum Menü, nicht zur Seite.
  // Online-Kalender (Inhaber Nr. 12, bewusst geändert): Header-„Termin“ und Footer-Band führen
  // auf /de/termin, die Anfrage-Links auf /de/beratung – beide behalten ?thema=yacht.
  const hrefs = await page
    .locator('main a[href^="/de/beratung"], main a[href^="/de/termin"], footer a[href^="/de/beratung"], footer a[href^="/de/termin"], a[data-header-cta]') // QM-Endabnahme: Wrapper-div trägt jetzt auch data-header-cta
    .evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(2);
  // QM-Endabnahme 02.11.2026 (bewusst geändert): Werft-Links tragen zusätzlich &rolle=werft.
  for (const h of hrefs) expect(h).toMatch(/^\/de\/(beratung|termin)\?thema=yacht(&[a-z]+=[\w-]+)*$/);
  // Footer: Band-Knopf und Spaltenlink, nicht vorgeladen.
  const footer = page.locator('footer [data-termin-link]');
  await expect(footer).toHaveCount(2);
  for (const a of await footer.all()) await expect(a).toHaveAttribute("data-prefetched", "1");
});

test.describe("iPhone 13, erster Besuch mit Cookie-Leiste", () => {
  test.use(IPHONE13);

  for (const [url, label] of [["/de/beratung", "einen Neubau"], ["/de/beratung?thema=yacht", "ein Yacht-Interieur"]]) {
    test(`${url}: erste bzw. vorgewählte Option über 500 px sichtbar`, async ({ page }) => {
      await mockPosts(page);
      await page.goto(url, SLOW);
      await settle(page);
      const first = page.locator("#beratung-art label, #beratung-art [role=radio]").filter({ hasText: label }).first();
      await expect(first).toBeVisible();
      const box = await first.boundingBox();
      expect(box.y + box.height, `${label} endet bei ${Math.round(box.y + box.height)} px`).toBeLessThanOrEqual(500);
      if (url.includes("yacht")) await expect(page.locator("#beratung-art input:checked")).toHaveCount(1);
    });
  }

  test("/de/kontakt: Lead höchstens drei Zeilen, beide Knöpfe im ersten Bildschirm", async ({ page }) => {
    await mockPosts(page);
    await page.goto("/de/kontakt", SLOW);
    await settle(page);
    const lead = page.locator("main h1 + p");
    const lines = await lead.evaluate((p) => Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)));
    expect(lines).toBeLessThanOrEqual(3);
    const vh = page.viewportSize().height;
    const bar = page.locator('section[role="region"][aria-label="Cookie-Einstellungen"]');
    const limit = (await bar.count()) && (await bar.isVisible()) ? (await bar.boundingBox()).y : vh;
    for (const name of [/Nachricht schreiben/, /Anrufen/]) {
      const b = await page.getByRole("link", { name }).first().boundingBox();
      expect(b.y + b.height, String(name)).toBeLessThanOrEqual(limit);
    }
  });
});

test("Beratung: Telefon freiwillig – Absenden ohne Nummer, POST abgefangen", async ({ page }) => {
  const sent = await mockPosts(page);
  await page.goto("/de/beratung?thema=yacht", SLOW);
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  await page.getByRole("button", { name: "Weiter" }).click();
  await expect(page.getByText("Schritt 2 von 4")).toBeVisible();
  await page.getByRole("button", { name: "Weiter" }).click();
  await expect(page.getByText("Schritt 3 von 4")).toBeVisible();
  await page.locator("#beratung-vorhaben").fill("Salon und Kabine eines Daycruisers neu einrichten.");
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.locator("#beratung-vorname").fill("Erika");
  await page.locator("#beratung-nachname").fill("Muster");
  await page.locator("#beratung-email").fill("erika@example.com");
  await expect(page.locator('label[for="beratung-telefon"]')).toContainText("optional");
  await expect(page.locator("#beratung-telefon")).not.toHaveAttribute("required", /.*/);
  // Unsinn wird weiterhin geprüft …
  await page.locator("#beratung-telefon").fill("abc");
  await page.getByRole("button", { name: "Absenden" }).click();
  await expect(page.locator("#beratung-telefon")).toHaveAttribute("aria-invalid", "true");
  // … leer geht durch.
  await page.locator("#beratung-telefon").fill("");
  await page.getByRole("button", { name: "Absenden" }).click();
  await expect.poll(() => sent.length, { timeout: 30_000 }).toBeGreaterThan(0);
  const body = sent.at(-1).body;
  expect(body.telefon).toBe("");
  expect(body.bei_meiner_anfrage_geht_es_um).toBe("ein Yacht-Interieur");
});

test("3D-Ansicht: Raumbedarf-Beispiel im ersten Bildschirm, Suche darunter, Termin mit Kontext", async ({ page }) => {
  await mockPosts(page);
  await page.goto("/de/3d-ansicht", SLOW);
  await settle(page);
  const ex = page.locator('[data-testid="arv-beispiel"]');
  await expect(ex).toBeVisible();
  await expect(ex).toContainText("Raumbedarf in Originalgröße");
  const img = ex.locator("img");
  await expect(img).toHaveAttribute("fetchpriority", "high");
  const exBox = await ex.boundingBox();
  expect(exBox.y).toBeLessThan(page.viewportSize().height);
  const search = page.getByRole("searchbox").or(page.locator('input[type="search"]')).first();
  if (await search.count()) expect((await search.boundingBox()).y).toBeGreaterThan(exBox.y);
  await expect(ex.getByRole("link", { name: "Termin anfragen" })).toHaveAttribute("href", /\/de\/beratung\?thema=3d-ansicht&produkt=ClassiCon/);
  await expect(page.getByRole("link", { name: "Beratung im Showroom vereinbaren" })).toHaveCount(0);
});
