// tests/e2e/ezarri-rechner-qm1.spec.js – Team C, QM-Runde 1 (qa-screenshots/ezarri/rechner/feedback-1.md).
// Läuft im Projekt desktop; der Mobil-Block setzt iPhone-Maße (Chromium, wegen axe/Download).
// Nie echt senden: POST /api/** wird abgefangen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, settle } from "./helpers.js";

const consent = (origin) => ({ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: origin });

async function open(page, url) {
  await page.context().addCookies([consent(new URL(test.info().project.use.baseURL || "http://localhost:3000").origin)]);
  await expect(async () => {
    const res = await page.goto(url, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  }).toPass({ timeout: 360_000, intervals: [5_000, 10_000] });
  await settle(page);
  await dismissCookieBanner(page);
}

async function intercept(page, antwort = { status: 200, body: { success: true, dryRun: true, id: "test" } }) {
  const sent = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
    sent.push({ path: new URL(req.url()).pathname, body: req.postDataJSON?.() ?? null });
    return route.fulfill({ status: antwort.status, contentType: "application/json", body: JSON.stringify(antwort.body) });
  });
  return sent;
}

// 2521-B (id 40) 64 %, 2522-B (42) 7 %, 2505-A (39) 4 %, 2516-B (44) 25 %
const MIX = "40-64.42-7.39-4.44-25";

test.describe("Ezarri QM-Runde 1 · Desktop", () => {
  test.describe.configure({ timeout: 480_000 });

  test("P1-1: Rechner mit Mischung – Gesamtkartons = Summe je Mosaik, Hinweis zur Rundung", async ({ page }) => {
    await open(page, `/de/ezarri/rechner?m=${MIX}`);
    const ergebnis = page.locator("#rr-ergebnis");
    await expect(ergebnis).toContainText("110");
    await expect(ergebnis).toContainText("+2 Kartons gegenüber ungemischt");
    const zeilen = await ergebnis.locator("li").filter({ hasText: /Kartons · / }).allInnerTexts();
    const summe = zeilen.map((t) => Number(t.match(/(\d+) Kartons ·/)[1])).reduce((a, b) => a + b, 0);
    expect(summe).toBe(55);
    const anfrage = await page.getByRole("link", { name: "Angebot und Muster anfragen" }).getAttribute("href");
    expect(anfrage).toMatch(/m2=110/);
  });

  test("P1-2/P1-3/P2-2/P2-6/P2-7: Custom Mix – 25-mm-Referenzen, Bild speichern, Fokus, Suche, Format-Hinweis", async ({ page }) => {
    await open(page, `/de/ezarri/custom-mix?m=${MIX}&fu=2`);
    await expect.poll(async () => page.locator("[data-mosaik-canvas]").first().evaluate((c) => c.getContext("2d").getImageData(5, 5, 1, 1).data[3]), { timeout: 60_000 }).toBe(255);
    const href = await page.getByRole("link", { name: "Muster dieser Mosaike anfragen" }).getAttribute("href");
    expect(href).toContain("ref=2521-b,2522-b,2505-a,2516-b");
    expect(href).not.toMatch(/-50\b/);
    expect(href).toMatch(/fu=2/);
    expect(href).toMatch(/f=25/);

    // Bild speichern: echte PNG-Datei
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 60_000 }), page.locator("[data-cm-bild]").click()]);
    expect(download.suggestedFilename()).toMatch(/^mischung-.+-25mm\.png$/);

    // 4 Mosaike → Knopf gesperrt; eins entfernen, dann Dialog per Tastatur
    await page.getByRole("button", { name: /^2516-B entfernen$/ }).click();
    const knopf = page.getByRole("button", { name: "Mosaik hinzufügen" });
    await expect(knopf).toBeEnabled();
    await knopf.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Mosaik wählen" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("searchbox").fill("blau");
    await expect(dialog.getByRole("status")).toContainText(/[1-9]\d* Mosaike?/);
    await dialog.getByRole("searchbox").fill("mojito");
    await expect(dialog).toContainText("Fertig gemischt, nicht veränderbar");
    await dialog.getByRole("searchbox").fill("gibtsnichtxyz");
    await dialog.getByRole("button", { name: "Filter zurücksetzen" }).click();
    await expect(dialog.getByRole("searchbox")).toHaveValue("");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(knopf).toBeFocused();

    // Format-Hinweis nennt das Mosaik, an dem 50 mm/Hexa scheitern
    await page.getByRole("button", { name: "Mosaik hinzufügen" }).click();
    await dialog.getByRole("searchbox").fill("blue iridescent");
    await dialog.locator("button[aria-pressed=false]").first().click();
    await dialog.getByRole("button", { name: "Schließen" }).last().click();
    await expect(page.locator("#cm-format-hinweis")).toContainText("50 mm gibt es nicht für Blue Iridescent");
    // Jetzt 4 Mosaike, der Knopf ist gesperrt → Fokus auf die Überschrift „Mischung“
    await expect(page.getByRole("button", { name: "Mosaik hinzufügen" })).toBeDisabled();
    await expect(page.locator("#cm-mischung")).toBeFocused();
  });

  test("P1-4/P2-5: Anfrage – Fuge/Format im Kontext, Zubehör vorbelegt, 503 zeigt Telefon und E-Mail", async ({ page }) => {
    const sent = await intercept(page, { status: 503, body: { success: false, code: "unavailable", error: "Anfrage derzeit nicht möglich" } });
    const r = "sp=1";
    await open(page, `/de/ezarri/anfrage?art=angebot&m=${MIX}&fu=2&f=25&r=${encodeURIComponent(r)}&quelle=rechner`);
    const form = page.locator("[data-ezarri-anfrage]");
    await expect(form).toContainText("Fuge: Grigio Ardesia 130 · Format 25 mm");
    await expect(form).toContainText("2521-B");
    await expect(page.getByRole("checkbox", { name: /Kleber/ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /Corner/ })).toBeChecked();
    await page.getByLabel(/^Name/).fill("Test Person");
    await page.getByLabel(/^Telefon/).fill("+43 5574 12345");
    await page.getByRole("checkbox", { name: /kontaktieren/ }).check();
    await page.waitForTimeout(3100);
    await page.getByRole("button", { name: "Anfrage senden" }).click();
    await expect(form.getByRole("link", { name: "+43 5574 46255" })).toBeVisible();
    await expect(form.getByRole("link", { name: "info@platzhirsch.studio" })).toBeVisible();
    await expect(page.getByText("Danke, Ihre Anfrage ist da.")).toHaveCount(0);
    expect(sent).toHaveLength(1);
    expect(sent[0].body).toMatchObject({ art: "angebot", fuge: "2", format: "25", m: MIX });
    expect(Number(sent[0].body.zubehoer.kleber)).toBeGreaterThan(0);
    expect(sent[0].body.referenzen).toEqual(["2521-b", "2522-b", "2505-a", "2516-b"]);
  });
});

test.describe("Ezarri QM-Runde 1 · Handy-Maße", () => {
  test.describe.configure({ timeout: 480_000 });
  test.use({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  test("P2-1: Rechenweg als Liste, axe ohne serious/critical (scrollable-region-focusable)", async ({ page }) => {
    await open(page, "/de/ezarri/rechner");
    await expect(page.locator("ul[aria-label='Teilflächen']")).toBeVisible();
    await expect(page.getByRole("region", { name: "Rechenweg" })).toBeHidden();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
    expect(bad).toEqual([]);
  });

  test("P2-3: kleine Vorschau beim Mischen", async ({ page }) => {
    await open(page, "/de/ezarri/custom-mix");
    await page.locator("[data-anteil-regler]").first().scrollIntoViewIfNeeded();
    await expect(page.locator("[data-cm-mini]")).toBeVisible({ timeout: 30_000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator("[data-cm-mini]")).toHaveCount(0);
  });
});
