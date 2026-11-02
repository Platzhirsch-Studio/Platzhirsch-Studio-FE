// Stil-Finder: Moodboard als PDF per E-Mail (Team „Stil-Finder mit Premium-PDF“).
// Läuft im desktop-Projekt; ein Block simuliert das iPhone-Viewport (Touch).
// Es wird nichts gesendet: Der POST an /api/labs/stilfinder/moodboard wird im
// UI-Test per page.route beantwortet. Die API-Tests schicken nur ungültige
// Anfragen (400/403), die kein PDF erzeugen und keinen Sendeplatz belegen.
// Ein echtes PDF erzeugt tests/unit/stilfinder-pdf.test.mjs (offline).
import { test, expect, devices } from "@playwright/test";
import { dismissCookieBanner } from "./helpers.js";

const RESULT = "/de/stil-finder/ergebnis/italienische-ruhe?a=0000000";
const API = "/api/labs/stilfinder/moodboard";

const hydratedForm = (page) =>
  page.waitForFunction(() => {
    const b = [...document.querySelectorAll("form button[type=submit]")].find((x) => /Moodboard senden/.test(x.textContent));
    return b && Object.keys(b).some((k) => k.startsWith("__reactProps"));
  }, null, { timeout: 60_000 });

async function openForm(page) {
  await page.goto(RESULT);
  await dismissCookieBanner(page, 8_000);
  await hydratedForm(page);
  const form = page.locator("form").filter({ hasText: "Moodboard senden" });
  await form.scrollIntoViewIfNeeded();
  return form;
}

function flow(label) {
  test(`${label}: Pflichtfeld nur E-Mail, Newsletter nicht vorangekreuzt, Fehler und Erfolg`, async ({ page }) => {
    let posted = null;
    await page.route(`**${API}`, async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({ json: { success: true, mode: "outbox", pages: 28, preview: "/api/labs/stilfinder/postausgang/test" } });
    });
    const form = await openForm(page);

    const email = form.getByLabel(/E-Mail-Adresse/);
    await expect(email).toHaveAttribute("required", "");
    for (const f of [/^Name/, /Vorhaben/, /Region/]) await expect(form.getByLabel(f)).not.toHaveAttribute("required", "");
    const nl = form.getByRole("checkbox", { name: /Newsletter/ });
    await expect(nl).not.toBeChecked();
    await expect(form).toContainText("Double-Opt-in");
    await expect(form).toContainText("KI-gestützt");

    // Zeitfalle (3 s) abwarten, dann leer absenden → Fehler am Feld, Fokus dort
    await page.waitForTimeout(3_200);
    await form.getByRole("button", { name: /Moodboard senden/ }).click();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toBeFocused();
    expect(posted).toBeNull();

    await email.fill("ana@example.invalid");
    await form.getByLabel(/Region/).selectOption("vorarlberg");
    await form.getByRole("button", { name: /Moodboard senden/ }).click();
    const done = page.getByRole("heading", { name: "Ihr Moodboard ist unterwegs." });
    await expect(done).toBeVisible();
    await expect(done).toBeFocused();
    // Integration 28.10.2026: kein „Labs“ mehr in der Kundenansicht (P0-15).
    await expect(page.getByText(/Testbetrieb:/)).toBeVisible();
    expect(posted).toMatchObject({ email: "ana@example.invalid", region: "vorarlberg", newsletter: false, profil: "italienische-ruhe", code: "0000000", website: "" });
    expect(posted._t).toBeGreaterThan(3000);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test.describe("Stil-Finder PDF – Formular", () => {
  flow("Desktop");
  test.describe("iPhone-Viewport", () => {
    const { defaultBrowserType, ...iphone } = devices["iPhone 15 Pro"];
    void defaultBrowserType;
    test.use(iphone);
    flow("iPhone");
  });
});

test.describe("Stil-Finder PDF – API", () => {
  test("ungültige E-Mail → 400 ohne PDF", async ({ request }) => {
    const res = await request.post(API, { data: { email: "kein-at", profil: "seeterrasse", _t: 6000 } });
    // 429, wenn der Sende-Topf dieser IP durch vorherige echte Läufe (Dev-Postausgang) voll ist.
    expect([400, 429]).toContain(res.status());
    if (res.status() === 400) expect((await res.json()).field).toBe("email");
    else expect(res.headers()["retry-after"]).toBeTruthy();
  });
  test("fremde Herkunft → 403", async ({ request }) => {
    const res = await request.post(API, { data: { email: "a@b.at", profil: "seeterrasse", _t: 6000 }, headers: { origin: "https://evil.example" } });
    expect(res.status()).toBe(403);
  });
  test("Postausgang: unbekannte ID → 404", async ({ request }) => {
    const res = await request.get("/api/labs/stilfinder/postausgang/unbekannt-aaaaaaaaaaaaaaaaaaaaa");
    expect(res.status()).toBe(404);
  });
});
