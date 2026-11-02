// tests/e2e/termin.spec.js – Online-Kalender /de/termin im Mock (Dev-Server :3000).
//
// SICHERHEIT: Der Dev-Server läuft ohne FRAPPE_BOOKING_* → Mock-Adapter.
// Buchungen landen in .data/booking/ (gitignored), Mails nur im
// Dev-Postausgang (.data/booking/outbox, /de/termin/postausgang). Nichts geht
// ans Backoffice. Zusätzlich bricht der Test jede Anfrage an
// backoffice.platzhirsch.studio ab. Jede Testperson hat eine eigene
// (erfundene) X-Forwarded-For-Adresse, damit das Rate-Limit des Dev-Servers
// wiederholte Läufe nicht sperrt.
//
// Lauf: PW_WORKERS=1 npx playwright test tests/e2e/termin.spec.js --project=desktop
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { dismissCookieBanner, settle } from "./helpers.js";

test.describe.configure({ mode: "serial" });

const { defaultBrowserType: _d, ...IPHONE15 } = devices["iPhone 15 Pro"];

const rnd = () => Math.random().toString(36).slice(2, 8);
const fakeIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250) + 1}`;

async function prepare(page) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": fakeIp() });
  // Uhrzeiten werden nach der Tageswahl in Sicht geholt; ohne Animation trifft der Klick sicher.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/backoffice.platzhirsch.studio/**", (r) => r.abort());
  // Diagnose: fehlgeschlagene Termin-APIs mit Code im Testprotokoll
  page.on("response", async (r) => {
    if (!r.url().includes("/api/termin/") || r.status() < 400) return;
    const body = await r.text().catch(() => "");
    console.log(`[termin-e2e] ${r.status()} ${new URL(r.url()).pathname} ${body.slice(0, 160)}`);
  });
}

async function chooseFirstSlot(page) {
  const picker = page.locator("[data-slot-picker]");
  await expect(picker).toHaveAttribute("data-status", "ready", { timeout: 60_000 });
  // Bis zu drei Zwei-Wochen-Fenster nach einem freien Tag suchen.
  for (let i = 0; i < 3; i++) {
    const open = picker.locator('input[type="radio"][name$="-day"]:not([disabled])');
    if (await open.count()) break;
    await page.getByRole("button", { name: "Weitere Tage" }).click();
    await expect(picker).toHaveAttribute("data-status", "ready", { timeout: 60_000 });
  }
  await picker.locator('input[name$="-day"]:not([disabled])').first().check({ force: true });
  const time = picker.locator('input[name$="-time"]').first();
  await expect(time).toBeAttached();
  await time.check({ force: true });
}

test("Seite: Testbetrieb markiert, USP, vier Terminarten, noindex, keine Fremdanbieter", async ({ page }) => {
  await prepare(page);
  const hosts = new Set();
  page.on("request", (r) => {
    const h = new URL(r.url()).hostname;
    if (h !== "localhost") hosts.add(h);
  });
  const res = await page.goto("/de/termin");
  expect(res.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nehmen Sie sich Zeit. Wir tun es auch.");
  await expect(page.locator("[data-termin-testbetrieb]")).toContainText("Testbetrieb");
  await expect(page.getByText("Harald Menghin skizziert im Gespräch")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(4);
  // Erste Terminart schneidet im ersten Bildschirm an (QA UX P2-1)
  const firstCard = await page.getByRole("radio").first().boundingBox();
  expect(firstCard.y).toBeLessThan(page.viewportSize().height);
  await expect(page.getByText("Wenn Ihr Projekt es braucht, auch ein, zwei Tage.")).toBeVisible();
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toMatch(/noindex/);
  await settle(page);
  expect([...hosts].filter((h) => /calendly|cal\.com|google|zoom|teams|whereby/i.test(h))).toEqual([]);
});

/** Schritt 4 (unbestätigt) → Bestätigungslink aus dem Testbetrieb öffnen und bestätigen. */
async function confirmByLink(page) {
  await expect(page.getByRole("heading", { level: 2, name: "Bitte bestätigen Sie Ihre E-Mail-Adresse" })).toBeVisible({ timeout: 30_000 });
  const href = await page.locator("[data-termin-devconfirm]").getAttribute("href");
  expect(href).toMatch(/^\/de\/termin\/bestaetigen#PT-[0-9A-Z]{6}\.[A-Za-z0-9_-]{43}$/);
  await page.goto(href);
  await page.getByRole("button", { name: "Termin jetzt bestätigen" }).click();
  await expect(page.locator('[data-confirm-state="done"]')).toBeVisible({ timeout: 30_000 });
}

test("Ablauf Video: Pflichtangaben, Einwilligung, E-Mail bestätigen, .ics, Test-Raum, Verwaltungslink", async ({ page }) => {
  await prepare(page);
  await page.goto("/de/termin");
  await dismissCookieBanner(page, 5000);
  // Schritt 1 ohne Auswahl → Fehler am Feld + Zusammenfassung
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.locator("[data-termin-errors]")).toContainText("Bitte wählen Sie, wie Sie uns treffen möchten.");
  await page.getByRole("radio", { name: /Videoberatung/ }).check();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Wann passt es Ihnen?" })).toBeFocused();
  await expect(page.getByText("Alle Zeiten in Ortszeit Lochau (Europe/Vienna).")).toBeVisible();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.locator("[data-termin-errors]")).toContainText("Bitte wählen Sie eine Uhrzeit.");
  await chooseFirstSlot(page);
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Wie erreichen wir Sie?" })).toBeFocused();

  await page.getByLabel("Vorname").fill("Testperson");
  await page.getByLabel("Nachname").fill(`E2E ${rnd()}`);
  const wrong = `e2e-${rnd()}@exmaple.test`;
  const email = wrong.replace("exmaple", "example");
  await page.getByLabel("E-Mail").fill(wrong);
  // Upload ist aus → kein Handy-Upload versprochen (QA UX P2-2)
  await expect(page.getByText("Grundriss, Fotos oder Maße helfen uns.")).toBeVisible();
  await expect(page.getByText("nach der Buchung direkt vom Handy")).toHaveCount(0);
  // Volle Adresse vor dem Absenden (QA UX P2-5)
  await expect(page.locator("[data-termin-email-preview]")).toContainText(wrong);
  await page.getByRole("button", { name: "Termin verbindlich buchen" }).click();
  await expect(page.locator("[data-termin-errors]")).toContainText("Für die Videoberatung brauchen wir Ihre Einwilligung");
  const consent = page.getByRole("checkbox", { name: /Bild und Ton während des Gesprächs live übertragen/ });
  await expect(consent).not.toBeChecked();
  await expect(consent).toHaveAccessibleName(/jederzeit widerrufen/);
  await consent.check();
  // Zeitfalle (MIN_FILL_MS = 3 s ab Laden des Wizards, src/lib/booking/http.js): Der Test füllt
  // schneller als ein Mensch und lief je nach Serverlast in „generic“ (400). Mindestzeit abwarten.
  await page.waitForTimeout(3_500);
  await page.getByRole("button", { name: "Termin verbindlich buchen" }).click();

  // Double-Opt-in: volle Adresse sichtbar, Korrektur behält die Uhrzeit
  await expect(page.getByRole("heading", { level: 2, name: "Bitte bestätigen Sie Ihre E-Mail-Adresse" })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-termin-email]")).toHaveText(wrong);
  const ref = await page.locator("[data-termin-reference]").textContent();
  expect(ref).toMatch(/^PT-[0-9A-Z]{6}$/);
  await expect(page.locator("[data-termin-ics]")).toHaveCount(0);
  await expect(page.locator("[data-termin-manage]")).toHaveCount(0);
  await page.locator("[data-termin-fix]").click();
  await page.getByLabel("E-Mail").fill(email);
  await page.getByRole("button", { name: "Termin verbindlich buchen" }).click();
  await expect(page.locator("[data-termin-email]")).toHaveText(email, { timeout: 30_000 });
  await expect(page.locator("[data-termin-reference]")).toHaveText(ref);
  await confirmByLink(page);

  await expect(page.getByRole("heading", { level: 2, name: "Ihr Termin ist gebucht" })).toBeVisible();
  await expect(page.locator("[data-termin-reference]")).toHaveText(ref);
  // Videoraum erst 15 min vor Beginn; im Testbetrieb der markierte Test-Raum
  await expect(page.locator("[data-termin-meet]")).toHaveCount(0);
  await expect(page.locator("[data-termin-meetinfo]")).toContainText("Der Videoraum öffnet am");
  await expect(page.getByRole("link", { name: "Test-Raum öffnen (kein echtes Gespräch)" })).toHaveAttribute("href", /\/de\/termin\/testraum$/);
  const ics = page.locator("[data-termin-ics]");
  await expect(ics).toHaveAttribute("download", /\.ics$/);
  expect(decodeURIComponent(await ics.getAttribute("href"))).toMatch(/STATUS:CONFIRMED/);
  await expect(ics).toHaveAttribute("href", /^data:text\/calendar/);
  expect(decodeURIComponent(await ics.getAttribute("href"))).not.toMatch(/testraum/);
  const manage = await page.locator("[data-termin-manage]").getAttribute("href");
  expect(manage).toMatch(/^\/de\/termin\/verwalten#PT-[0-9A-Z]{6}\.1\./);

  // Dev-Postausgang: 2 Bestätigungslinks (falsche + korrigierte Adresse), dann Kundin + Studio
  await page.goto("/de/termin/postausgang");
  const mails = page.locator("li", { hasText: ref });
  await expect(mails).toHaveCount(4);
  await expect(mails.first()).toContainText("[TEST]");
  await expect(page.locator('li[data-outbox-mail="termin-verify"]', { hasText: wrong })).toHaveCount(1);

  // Test-Raum deutlich als Test markiert
  await page.goto("/de/termin/testraum");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Test-Videoraum");
  await expect(page.getByText("Das ist kein echtes Gespräch.")).toBeVisible();
  await expect(page.locator("main")).not.toContainText(/Frappe|meet\.platzhirsch/);

  // Verwalten: umbuchen (neuer Link, alter ungültig), dann absagen
  await page.goto(manage);
  await expect(page.locator('[data-manage-state="ready"]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("[data-termin-reference]")).toHaveText(ref);
  await page.getByRole("button", { name: "Anderen Zeitpunkt wählen" }).click();
  await chooseFirstSlot(page);
  await page.getByRole("button", { name: "Auf diese Uhrzeit verschieben" }).click();
  const moved = page.getByRole("status").filter({ hasText: "Ihr Termin ist verschoben" });
  const taken = page.getByRole("alert").filter({ hasText: "gerade vergeben" });
  await expect(moved.or(taken)).toBeVisible({ timeout: 90_000 });
  if (await moved.isVisible()) {
    expect(page.url()).toMatch(/#PT-[0-9A-Z]{6}\.2\./);
    const fresh = page.url();
    await page.goto("/de/termin");
    await page.goto(manage);
    await expect(page.locator('[data-manage-state="invalid"]')).toBeVisible({ timeout: 30_000 });
    await page.goto("/de/termin");
    await page.goto(fresh);
    await expect(page.locator('[data-manage-state="ready"]')).toBeVisible({ timeout: 30_000 });
  }
  await page.getByRole("button", { name: "Termin absagen" }).click();
  await page.getByRole("button", { name: "Ja, absagen" }).click();
  await expect(page.locator('[data-termin-status="storniert"]')).toBeVisible({ timeout: 90_000 });
  await expect(page.getByRole("status").filter({ hasText: "Ihr Termin ist abgesagt" })).toBeFocused();
});

test("Vor Ort: Telefon und PLZ/Ort Pflicht, Anfrage statt Buchung, Kern-USP", async ({ page }) => {
  await prepare(page);
  await page.goto("/de/termin?art=vor_ort");
  await dismissCookieBanner(page, 5000);
  await expect(page.getByRole("radio", { name: /Bei Ihnen vor Ort/ })).toBeChecked();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await chooseFirstSlot(page);
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await page.getByLabel("Vorname").fill("Testperson");
  await page.getByLabel("Nachname").fill(`E2E ${rnd()}`);
  await page.getByLabel("E-Mail").fill(`e2e-${rnd()}@example.test`);
  await page.locator("main").getByRole("button", { name: "Termin anfragen" }).click();
  const alert = page.locator("[data-termin-errors]");
  await expect(alert).toContainText("Bitte prüfen Sie 2 Angaben.");
  // Sprunglinks ≥ 24 px (WCAG 2.5.8, QA UX P2-6)
  const ax = await new AxeBuilder({ page }).withTags(["wcag22aa"]).include("[data-termin-errors]").analyze();
  expect(ax.violations.map((v) => v.id)).toEqual([]);
  await alert.getByRole("link", { name: /Telefonnummer/ }).click();
  await expect(page.getByLabel(/^Telefon/)).toBeFocused();
  await page.getByLabel(/^Telefon/).fill("+43 660 0000000");
  await page.getByLabel("PLZ und Ort").fill("6900 Bregenz");
  await page.waitForTimeout(3_500); // Zeitfalle MIN_FILL_MS (s. Ablauf Video)
  await page.locator("main").getByRole("button", { name: "Termin anfragen" }).click();
  // Sichtbare Rückmeldung direkt nach dem Absenden: Überschrift im Fokus, Statustext für die Anfrage
  const pendingHeading = page.getByRole("heading", { level: 2, name: "Bitte bestätigen Sie Ihre E-Mail-Adresse" });
  await expect(pendingHeading).toBeVisible({ timeout: 30_000 });
  await expect(pendingHeading).toBeFocused();
  await expect(page.locator("[data-termin-pending] [role=status]")).toContainText("dann ist Ihre Anfrage bei uns");
  await confirmByLink(page);
  await expect(page.getByRole("heading", { level: 2, name: "Ihre Terminanfrage ist bei uns" })).toBeVisible();
  await expect(page.locator("[data-termin-confirmed] [role=status]")).toContainText("Wir melden uns, um Termin und Anfahrt zu bestätigen.");
  await expect(page.getByText("Harald Menghin skizziert im Termin erste Ideen von Hand.")).toBeVisible();
  await expect(page.locator("[data-termin-meet]")).toHaveCount(0);
  // Anfrage, noch nicht vom Team bestätigt: im Kalender nur vorgemerkt (Abnahme Termin §3)
  const ics = decodeURIComponent(await page.locator("[data-termin-ics]").getAttribute("href"));
  expect(ics).toMatch(/STATUS:TENTATIVE/);
  expect(ics).not.toMatch(/STATUS:CONFIRMED/);
});

test("Tastatur: Tage und Uhrzeiten als Radiogruppe mit Pfeiltasten", async ({ page }) => {
  await prepare(page);
  await page.goto("/de/termin?art=studio");
  await dismissCookieBanner(page, 5000);
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  const picker = page.locator("[data-slot-picker]");
  await expect(picker).toHaveAttribute("data-status", "ready", { timeout: 60_000 });
  const enabled = picker.locator('input[name$="-day"]:not([disabled])');
  test.skip((await enabled.count()) < 2, "zu wenig freie Tage im ersten Fenster");
  await enabled.first().focus();
  await page.keyboard.press("Space");
  await expect(enabled.first()).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(enabled.nth(1)).toBeChecked();
  await expect(enabled.nth(1)).toBeFocused();
  await expect(picker.getByRole("group", { name: /^Uhrzeit am / })).toBeVisible();
});

test("axe WCAG 2.2 AA: Schritt 1 und Kalender", async ({ page }) => {
  await prepare(page);
  await page.goto("/de/termin");
  await dismissCookieBanner(page, 5000);
  const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
  let r = await new AxeBuilder({ page }).withTags(tags).include("main").analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);
  await page.getByRole("radio", { name: /Im Studio in Lochau/ }).check();
  await page.getByRole("button", { name: "Weiter", exact: true }).click();
  await expect(page.locator("[data-slot-picker]")).toHaveAttribute("data-status", "ready", { timeout: 60_000 });
  r = await new AxeBuilder({ page }).withTags(tags).include("main").analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);
});

test("API: fremde Herkunft 403, Origin null + Sec-Fetch-Site same-origin geprüft, Honeypot, Schema", async ({ request }) => {
  const h = { "content-type": "application/json", "x-forwarded-for": fakeIp() };
  const foreign = await request.post("/api/termin/book", { headers: { ...h, origin: "https://evil.example" }, data: {} });
  expect(foreign.status()).toBe(403);
  const opaque = await request.post("/api/termin/cancel", { headers: { ...h, origin: "null", "sec-fetch-site": "same-origin" }, data: { token: "PT-AAAAAA.1.zzzzzz.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } });
  expect(opaque.status()).toBe(403);
  expect((await opaque.json()).code).toBe("invalid_token");
  const cross = await request.post("/api/termin/cancel", { headers: { ...h, origin: "null", "sec-fetch-site": "cross-site" }, data: { token: "x" } });
  expect((await cross.json()).code).toBe("forbidden");
  const trap = await request.post("/api/termin/book", { headers: h, data: { art: "studio", website: "http://spam.example" } });
  expect(trap.status()).toBe(400);
  const bad = await request.post("/api/termin/book", { headers: h, data: { art: "studio", start: "2026-11-03T09:00:00.000Z", vorname: "", nachname: "x", email: "kaputt", t: 60000 } });
  expect(bad.status()).toBe(400);
  expect(Object.keys((await bad.json()).fields).sort()).toEqual(["email", "vorname"]);
  const slots = await request.get("/api/termin/slots?art=studio&von=2026-11-02&bis=2026-12-31", { headers: h });
  expect(slots.status()).toBe(400);
});

// Abnahme Termin §5 (P2): Erstbesuch auf dem iPhone, Cookie-Leiste offen, Testbetrieb-Hinweis
// sichtbar – die erste Terminart (Titel der Karte) steht trotzdem über der Leiste.
test.describe("iPhone 15 Pro, erster Besuch mit Cookie-Leiste", () => {
  test.use(IPHONE15);
  for (const locale of ["de", "en", "fr", "it"]) {
    test(`/${locale}/termin: erste Terminart im ersten Bildschirm`, async ({ page }) => {
      await prepare(page);
      await page.goto(`/${locale}/termin`);
      await settle(page);
      const vh = page.viewportSize().height;
      const region = page.getByRole("region", { name: /^(Cookie-Einstellungen|Cookie settings|Paramètres des cookies|Impostazioni dei cookie)$/ });
      const limit = (await region.count()) && (await region.isVisible()) ? (await region.boundingBox()).y : vh;
      expect(limit, "Cookie-Leiste beim Erstbesuch").toBeLessThan(vh);
      const title = page.locator('[data-termin-step="art"] label').first().locator("span.text-title");
      const box = await title.boundingBox();
      expect(box.y + box.height, `Titel der ersten Karte endet bei ${Math.round(box.y + box.height)} px, Leiste bei ${Math.round(limit)} px`).toBeLessThanOrEqual(limit);
    });
  }
});
