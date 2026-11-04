// tests/e2e/shop-freigabe.spec.js — Shop + Gutscheinverkauf nach der Inhaber-
// Freigabe vom 03.11.2026 (Entscheidung Nr. 46), Ende-zu-Ende im TESTMODUS
// gegen den Entwicklungsserver (SHOP_MODE Standard "test", ohne Stripe-/
// LetMeShip-Schlüssel → beide Mocks; Gutschein über ?zahlung=mock).
//   - Bestellung Versand: Gewährleistungs-Mitteilung vor dem Bestellknopf,
//     Rechtstexte freigegeben verlinkt, Stripe-Mock, Bestätigung, Vertrags-
//     bestätigung im Test-Postausgang ([TEST], AGB + Belehrung + Formular + Anhänge)
//   - Bestellung Abholung mit Zahlung vor Ort: sofortige Vertragsbestätigung
//   - Online-Widerruf der Shop-Bestellung: Eingangsbestätigung im Postausgang
//   - Gutscheinkauf (Mock): Bedingungen/Belehrung ohne Marker, Aussteller im PDF
//   - Gutschein-Widerruf (Mock)
//   - Rechtstext-Seiten, Pixel-7-Ansichten ohne horizontales Scrollen
// NIE echte Zahlung, nie echte Mail (Postausgang = Ordner .data/payments/outbox).
//   PW_WORKERS=1 npx playwright test shop-freigabe.spec.js --project=desktop
// Screenshots: SHOP_SHOT_DIR (Standard qa-screenshots/shop/freigabe-2026-11-03)
import fs from "node:fs";
import path from "node:path";
import { test, expect, devices } from "@playwright/test";
import { dismissCookieBanner, measureOverflow, settle } from "./helpers.js";

const SHOT_DIR = process.env.SHOP_SHOT_DIR || "qa-screenshots/shop/freigabe-2026-11-03";
const OUTBOX = path.join(process.cwd(), ".data", "payments", "outbox");
const SHOT = (n) => path.join(SHOT_DIR, `${n}.png`);
fs.mkdirSync(SHOT_DIR, { recursive: true });

test.describe.configure({ mode: "serial" });

/** Neueste Postausgangs-Mail mit Tag, die nach `since` geschrieben wurde (wartet bis zu 20 s). */
async function outboxMail(tag, since) {
  for (let i = 0; i < 40; i++) {
    const hits = fs.existsSync(OUTBOX)
      ? fs
          .readdirSync(OUTBOX)
          .map((d) => path.join(OUTBOX, d))
          .filter((d) => fs.statSync(d).mtimeMs >= since - 2000 && fs.existsSync(path.join(d, "mail.json")))
          .map((d) => ({ dir: d, json: JSON.parse(fs.readFileSync(path.join(d, "mail.json"), "utf8")) }))
          .filter((m) => m.json.tag === tag)
          .sort((a, b) => fs.statSync(b.dir).mtimeMs - fs.statSync(a.dir).mtimeMs)
      : [];
    if (hits.length) return { ...hits[0], text: fs.readFileSync(path.join(hits[0].dir, "mail.txt"), "utf8") };
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

async function addTestItem(page, slug) {
  await page.goto("/de/shop/testartikel");
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  const card = page.locator(`[data-shop-testartikel="${slug}"]`);
  await expect(card).toBeVisible();
  return card;
}

const state = { shopOrder: null, voucherOrder: null };

test("Bestellung Versand: Gewährleistungs-Mitteilung, freigegebene Rechtstexte, Stripe-Mock, Vertragsbestätigung im Postausgang", async ({ page }) => {
  test.setTimeout(600_000);
  const since = Date.now();
  const card = await addTestItem(page, "testartikel-glas");
  await card.locator("[data-shop-in-warenkorb]").click();
  const drawer = page.locator("dialog[data-shop-minicart][open]");
  await expect(drawer.locator('[data-shop-minicart-zeile="testartikel-glas"]')).toBeVisible({ timeout: 30_000 });
  await drawer.locator("[data-shop-zum-warenkorb]").click();
  await page.waitForURL(/\/de\/shop\/warenkorb/);
  await expect(page.locator('[data-shop-zeile="testartikel-glas"]')).toBeVisible({ timeout: 30_000 });

  await page.getByRole("textbox", { name: "Straße", exact: true }).fill("Testgasse");
  await page.getByRole("textbox", { name: "Hausnummer", exact: true }).fill("1");
  await page.getByRole("textbox", { name: "PLZ", exact: true }).fill("6900");
  await page.getByRole("textbox", { name: "Ort", exact: true }).fill("Bregenz");
  await page.getByRole("textbox", { name: "Ort", exact: true }).blur();
  const fallback = page.locator("[data-shop-versand-berechnen]");
  if (await fallback.isVisible().catch(() => false)) await fallback.click();
  const versand = page.locator("[data-shop-versand]");
  await expect(versand).toBeVisible({ timeout: 30_000 });
  await expect(versand).toContainText("MOCK");
  await page.getByRole("textbox", { name: "Vor- und Nachname", exact: true }).fill("Test Kundin");
  await page.getByRole("textbox", { name: "E-Mail", exact: true }).fill("kundin@example.invalid");

  // Rechtstexte: AGB, Widerruf, Formular, Versand als Link ohne Marker; Datenschutz mit Lücke „Angabe wird ergänzt“ (LetMeShip, Inhaber).
  for (const id of ["agb", "widerruf", "widerrufsformular", "versand"]) {
    const li = page.locator(`[data-shop-recht-slot="${id}"]`);
    await expect(li.getByRole("link")).toBeVisible();
    await expect(li).not.toContainText(/Entwurf|Angabe wird ergänzt/);
  }
  await expect(page.locator('[data-shop-recht-slot="datenschutz"]')).toContainText("Angabe wird ergänzt");
  // Harmonisierte Mitteilung (§ 4 Abs 1 Z 12 FAGG) hervorgehoben, unmittelbar vor dem Bestellknopf.
  const gw = page.locator("[data-shop-gewaehrleistung]");
  await expect(gw).toBeVisible();
  await expect(gw).toContainText("Gesetzliche Gewährleistung");
  await expect(gw).toContainText("mindestens zwei Jahre ab Übergabe");
  const buy = page.locator("[data-shop-bestellen]");
  const gwBox = await gw.boundingBox();
  const buyBox = await buy.boundingBox();
  expect(gwBox.y + gwBox.height).toBeLessThanOrEqual(buyBox.y + 1);
  await gw.scrollIntoViewIfNeeded();
  await page.screenshot({ path: SHOT("01-warenkorb-versand"), fullPage: true });
  await gw.screenshot({ path: SHOT("02-gewaehrleistung-mitteilung") });

  await page.waitForTimeout(3_200);
  await expect(buy).toHaveText("Zahlungspflichtig bestellen");
  await buy.click();
  await page.waitForURL(/\/de\/zahlung\/mock\?session=cs_mock_/, { timeout: 170_000 });
  await expect(page.locator("body")).toContainText("es fließt kein Geld");
  await page.screenshot({ path: SHOT("03-stripe-mock-shop"), fullPage: true });
  await page.getByRole("button", { name: "Zahlung erfolgreich" }).click();
  await page.waitForURL(/\/de\/shop\/bestellung\?b=PH-S-/, { timeout: 170_000 });
  await expect(page.locator("[data-shop-status]")).toHaveAttribute("data-shop-status", "versandbereit");
  state.shopOrder = new URL(page.url()).searchParams.get("b");
  await page.screenshot({ path: SHOT("04-bestellung-versand"), fullPage: true });

  // Vertragsbestätigung (§ 7 Abs 3 FAGG) im Test nur über den Mock-Mailer (outbox), Betreff [TEST].
  const mail = await outboxMail("shop-vertragsbestaetigung", since);
  expect(mail, "Vertragsbestätigung im Postausgang").toBeTruthy();
  expect(mail.json.subject).toMatch(new RegExp(`^\\[TEST\\] Auftragsbestätigung ${state.shopOrder}`));
  expect(mail.json.to).toBe("kundin@example.invalid");
  for (const x of ["ALLGEMEINE GESCHÄFTSBEDINGUNGEN", "WIDERRUFSBELEHRUNG", "MUSTER-WIDERRUFSFORMULAR", "GESETZLICHE GEWÄHRLEISTUNG", "VERSAND- UND LIEFERBEDINGUNGEN", "MW Immobilienverwaltungs GmbH", "ATU70035339", "/de/shop/recht/widerruf-formular"]) {
    expect(mail.text, x).toContain(x);
  }
  expect(mail.text).not.toMatch(/\[PLATZHALTER|Kanzlei prüfen/);
  expect(mail.json.attachments.map((a) => a.filename)).toEqual(["AGB-Onlineshop.txt", "Widerrufsbelehrung-und-Formular.txt", "Versandbedingungen.txt"]);
});

test("Bestellung Abholung mit Zahlung vor Ort: reserviert, Vertragsbestätigung sofort im Postausgang", async ({ page }) => {
  test.setTimeout(300_000);
  const since = Date.now();
  const card = await addTestItem(page, "testartikel-kerze");
  await card.locator("[data-shop-variante]").selectOption("gross");
  await card.locator("[data-shop-reservieren]").click();
  await page.waitForURL(/\/de\/shop\/warenkorb\?lieferart=abholung&zahlung=vorort/);
  await expect(page.locator('[data-shop-zeile="testartikel-kerze"]')).toBeVisible({ timeout: 30_000 });
  await page.getByRole("textbox", { name: "Vor- und Nachname", exact: true }).fill("Test Kunde");
  await page.getByRole("textbox", { name: "E-Mail", exact: true }).fill("kunde@example.invalid");
  await expect(page.locator("[data-shop-gewaehrleistung]")).toBeVisible();
  await page.screenshot({ path: SHOT("05-warenkorb-abholung"), fullPage: true });
  await page.waitForTimeout(3_200);
  await page.getByRole("button", { name: "Zahlungspflichtig bestellen" }).click();
  await page.waitForURL(/\/de\/shop\/bestellung\?b=PH-S-/, { timeout: 60_000 });
  await expect(page.locator("[data-shop-status]")).toHaveAttribute("data-shop-status", "reserviert");
  await page.screenshot({ path: SHOT("06-bestellung-abholung"), fullPage: true });
  const mail = await outboxMail("shop-vertragsbestaetigung", since);
  expect(mail).toBeTruthy();
  expect(mail.json.to).toBe("kunde@example.invalid");
  expect(mail.text).toContain("Zahlung bei Abholung im Showroom");
  expect(mail.json.attachments.map((a) => a.filename)).toEqual(["AGB-Onlineshop.txt", "Widerrufsbelehrung-und-Formular.txt"]);
});

test("Online-Widerruf der Shop-Bestellung (§ 13a FAGG): Eingangsnummer, Bestätigung im Postausgang", async ({ page }) => {
  test.setTimeout(300_000);
  const since = Date.now();
  await page.goto("/de/shop/recht/widerruf-formular");
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  const form = page.locator("[data-shop-widerruf-form]");
  await form.getByLabel(/^Bestellnummer/).fill(state.shopOrder || "PH-S-261103-ABCDEF");
  await form.getByLabel(/^Name/).fill("Test Kundin");
  await form.getByLabel(/^Anschrift/).fill("Testgasse 1, 6900 Bregenz");
  await form.getByLabel(/E-Mail-Adresse der Bestellung/).fill("kundin@example.invalid");
  await form.getByLabel(/Waren oder Leistungen/).fill("2 × Testartikel Glas");
  const check = form.getByRole("checkbox").first();
  if (await check.isVisible().catch(() => false)) await check.check();
  await page.waitForTimeout(3_200);
  await form.getByRole("button", { name: "Widerruf bestätigen" }).click();
  await page.waitForURL(/\/de\/shop\/recht\/widerruf-formular\/bestaetigung\?id=WS-/, { timeout: 60_000 });
  await expect(page.locator("[data-shop-widerruf-bestaetigung]")).toContainText("Eingangsnummer WS-");
  await page.screenshot({ path: SHOT("07-widerruf-shop-bestaetigung"), fullPage: true });
  const mail = await outboxMail("shop-widerruf", since);
  expect(mail, "Eingangsbestätigung im Postausgang (Test → Mock-Mailer)").toBeTruthy();
  expect(mail.json.subject).toMatch(/^\[TEST\] Eingangsbestätigung Ihres Widerrufs \(WS-/);
  expect(mail.text).toContain("2 × Testartikel Glas");
});

test("Gutscheinkauf (Mock): Bedingungen und Belehrung ohne Marker, Mehrzweck-Hinweis, PDF mit Aussteller", async ({ page }) => {
  test.setTimeout(480_000);
  const since = Date.now();
  await page.goto("/de/gutscheine?zahlung=mock");
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  const body = page.locator("body");
  await expect(body).toContainText("Ohne Ablaufdatum");
  await expect(body).not.toContainText(/\[anwaltlich prüfen|\[Steuerberater|\[vom Unternehmen auszufüllen|sind Entwurf/);
  const wb = page.locator("#widerrufsbelehrung");
  await expect(wb).toContainText("MW Immobilienverwaltungs GmbH");
  await expect(wb).toContainText("Muster-Widerrufsformular");
  await expect(wb).not.toContainText("Entwurf");
  const form = page.locator("#kaufen form").first();
  await expect(form).toContainText("Die Umsatzsteuer wird bei der Einlösung berechnet.");
  await page.screenshot({ path: SHOT("08-gutscheine-kauf"), fullPage: true });
  await form.getByLabel("100 €").check();
  await form.getByLabel(/Geweih/).check();
  await form.getByLabel("Name auf dem Gutschein").fill("Anna");
  await form.getByLabel("Ihr Name").fill("Test Person");
  await form.getByLabel(/E-Mail für den Gutschein/).fill("gutschein@example.invalid");
  await form.getByRole("checkbox", { name: /Gutscheinbedingungen/ }).check();
  await page.waitForTimeout(3_200);
  await form.getByRole("button", { name: "Zahlungspflichtig kaufen" }).click();
  await page.waitForURL(/\/de\/zahlung\/mock\?session=cs_mock_/, { timeout: 170_000 });
  await page.screenshot({ path: SHOT("09-stripe-mock-gutschein"), fullPage: true });
  await page.getByRole("button", { name: "Zahlung erfolgreich" }).click();
  await page.waitForURL(/\/de\/zahlung\/erfolg\?session_id=cs_mock_/, { timeout: 170_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Danke, die Zahlung ist angekommen");
  await page.screenshot({ path: SHOT("10-gutschein-erfolg"), fullPage: true });

  const mail = await outboxMail("gutschein", since);
  expect(mail, "Gutschein-Mail im Postausgang").toBeTruthy();
  state.voucherOrder = (mail.json.subject.match(/\((G-[A-Z0-9]{4}-[A-Z0-9]{4})\)/) || [])[1] || null;
  expect(mail.text).toContain("Gültig ohne Ablaufdatum");
  expect(mail.text).toContain("Onlineshop");
  const pdfName = mail.json.attachments.find((a) => a.contentType === "application/pdf")?.filename;
  expect(pdfName).toBeTruthy();
  const pdf = fs.readFileSync(path.join(mail.dir, pdfName.replace(/[^\w.-]/g, "_")), "latin1");
  expect(pdf.startsWith("%PDF-")).toBe(true);
  expect(pdf).toContain("MW Immobilienverwaltungs GmbH");
  expect(pdf).toContain("ohne Ablaufdatum");
});

test("Gutschein-Widerruf (Mock): Formular → Eingangsnummer", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/de/zahlung/widerruf?zahlung=mock");
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  await page.getByLabel("Ihr Name").fill("Test Person");
  await page.getByLabel(/E-Mail-Adresse der Bestellung/).fill("gutschein@example.invalid");
  await page.getByLabel(/Bestellnummer oder Gutscheincode/).fill(state.voucherOrder || "G-TEST-0000");
  await page.waitForTimeout(3_200);
  await page.getByRole("button", { name: "Widerruf bestätigen" }).click();
  await expect(page.locator("body")).toContainText(/Eingangsnummer|eingegangen/, { timeout: 60_000 });
  await page.screenshot({ path: SHOT("11-widerruf-gutschein"), fullPage: true });
});

test("Rechtstext-Seiten: Zahlungsarten und Gewährleistungs-Mitteilung in den AGB, Datenschutz mit LetMeShip-Lücke, Gutscheinseiten hinter VOUCHER_MODE", async ({ page, request }) => {
  test.setTimeout(300_000);
  await page.goto("/de/shop/recht/agb");
  await settle(page);
  await dismissCookieBanner(page, 8_000);
  const agb = page.locator("[data-shop-recht-text='agb']");
  await expect(agb).toContainText("Kredit- oder Debitkarte");
  await expect(agb).toContainText("Zahlung vor Ort im Showroom");
  await expect(agb).toContainText("Gesetzliche Gewährleistung");
  await expect(agb).not.toContainText("wird ergänzt");
  await expect(page.locator("[data-shop-recht-entwurf]")).toHaveCount(0);
  await page.screenshot({ path: SHOT("12-agb-shop"), fullPage: true });
  await page.goto("/de/shop/recht/datenschutz");
  await settle(page);
  await expect(page.locator("[data-shop-recht-luecke]")).toHaveCount(1);
  await expect(page.locator("[data-shop-recht-entwurf='datenschutz']")).toContainText("Angabe wird ergänzt");
  // Ohne VOUCHER_MODE auf dem Server bleiben /gutscheine und /gutscheinbedingungen 404 (Schalter wirkt erst mit Variable).
  const terms = await request.get("/de/gutscheinbedingungen", { maxRedirects: 0 });
  expect([200, 404]).toContain(terms.status());
  if (terms.status() === 200) {
    const html = await terms.text();
    expect(html).toContain("MW Immobilienverwaltungs GmbH, FN 443753 d");
    expect(html).not.toMatch(/noindex/);
  }
  const preview = await (await request.get("/de/preview/commerce")).text();
  expect(preview).toContain("MW Immobilienverwaltungs GmbH, FN 443753 d, Landesgericht Feldkirch, UID ATU70035339");
  expect(preview).not.toMatch(/\[anwaltlich prüfen|Insolvenzrechtler\/Steuerberater offen/);
});

// Pixel 7 im selben Chromium-Worker (defaultBrowserType darf in describe nicht gesetzt werden).
const { defaultBrowserType: _pixelBrowser, ...PIXEL_7 } = devices["Pixel 7"];

test.describe("Pixel 7", () => {
  test.use(PIXEL_7);

  test("Warenkorb, Gutschein-Seite und AGB ohne horizontales Scrollen", async ({ page }) => {
    test.setTimeout(480_000);
    const card = await addTestItem(page, "testartikel-glas");
    await card.locator("[data-shop-in-warenkorb]").click();
    await page.goto("/de/shop/warenkorb");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    await expect(page.locator('[data-shop-zeile="testartikel-glas"]')).toBeVisible({ timeout: 30_000 });
    await page.getByRole("textbox", { name: "Vor- und Nachname", exact: true }).fill("Test Kundin");
    await page.getByRole("textbox", { name: "E-Mail", exact: true }).fill("kundin@example.invalid");
    const gw = page.locator("[data-shop-gewaehrleistung]");
    await gw.scrollIntoViewIfNeeded();
    await expect(gw).toBeVisible();
    let overflow = await measureOverflow(page);
    expect(overflow.sw, JSON.stringify(overflow.wide)).toBeLessThanOrEqual(overflow.vw);
    await page.screenshot({ path: SHOT("13-pixel7-warenkorb"), fullPage: true });
    await gw.screenshot({ path: SHOT("14-pixel7-gewaehrleistung") });

    await page.goto("/de/gutscheine?zahlung=mock");
    await settle(page);
    await dismissCookieBanner(page, 8_000);
    overflow = await measureOverflow(page);
    expect(overflow.sw, JSON.stringify(overflow.wide)).toBeLessThanOrEqual(overflow.vw);
    await page.screenshot({ path: SHOT("15-pixel7-gutscheine"), fullPage: true });

    await page.goto("/de/shop/recht/agb");
    await settle(page);
    overflow = await measureOverflow(page);
    expect(overflow.sw, JSON.stringify(overflow.wide)).toBeLessThanOrEqual(overflow.vw);
    await page.screenshot({ path: SHOT("16-pixel7-agb"), fullPage: true });
  });
});
