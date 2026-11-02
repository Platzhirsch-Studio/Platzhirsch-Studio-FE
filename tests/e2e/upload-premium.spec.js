// tests/e2e/upload-premium.spec.js — Labs-Ausbau "Handy-Upload Premium":
// Übergabekarte (QR in viewfinder, 3-step guide, validity countdown, prepared
// "Link an mich senden" (desktop only), "Auf diesem Gerät") and the mobile upload
// page (stepper, capture tiles, tips, preview gallery, success summary), on
// Desktop Chrome (this file) and iPhone WebKit (upload-premium-iphone.spec.js).
// SAFETY: blockFormSends() answers every non-GET /api/** except the upload
// routes (dev store only, never the backoffice); nothing is sent by e-mail or
// SMS — the SMS/E-Mail buttons only build sms:/mailto: links and are not clicked.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import { collectConsoleErrors, settle } from "./helpers.js";

// ---- F4 Fix-Runde 1 (r1-recht-inhalt P0-4) -----------------------------------
// /de/upload is a service page without demo, test link or demo reference, and
// while the Löschfrist is unconfirmed (UPLOAD_CONFIG.retentionConfirmed=false)
// the upload takes nothing (session route 503 "upload_paused", no card after a
// form, /de/upload/<token> shows the "paused" notice). Expectations changed on
// purpose:
//   - flow tests skip while paused and run again on their own once confirmed,
//   - tests built on the removed /de/upload demo skip with DEMO_REMOVED; once
//     the upload runs they move to the form flow (card) or a minted token page.
// The paused state itself: tests/e2e/upload-f4.spec.js, tests/unit/f4-upload-recht.test.mjs.
const PAUSED_REASON =
  "Upload nimmt nichts an, solange die Löschfrist nicht bestätigt ist (r1-recht-inhalt P0-4, UPLOAD_CONFIG.retentionConfirmed=false); läuft wieder, sobald die Frist bestätigt ist.";
const DEMO_REMOVED =
  "Demo auf /de/upload entfernt (r1-recht-inhalt P0-4: kein Demo- oder Test-Link öffentlich). Mit bestätigter Frist auf Formular-Weg (Karte) bzw. Token-Seite umstellen.";
/** Skips the running test while the upload is paused (no Origin needed: the gate comes first). */
async function skipIfPaused(page) {
  const res = await page.request.post("/api/upload/session", { data: { ticket: "x".repeat(40) }, timeout: 90_000 });
  const body = await res.json().catch(() => ({}));
  test.skip(res.status() === 503 && body.error === "upload_paused", PAUSED_REASON);
}


const FIXTURES = path.resolve("qa-screenshots/handy-upload/fixtures");
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

/** Blocks every non-GET /api/** except the upload routes of the demo/dev store. */
async function guard(page) {
  const blocked = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    const p = new URL(req.url()).pathname;
    if (req.method() === "GET" || req.method() === "HEAD" || /^\/api\/upload\/(?!inquiry\/)/.test(p)) return route.continue();
    blocked.push(`${req.method()} ${p}`);
    return route.fulfill({ status: 503, contentType: "application/json", body: '{"ok":false,"code":"blocked_by_test"}' });
  });
  return blocked;
}

test.describe("Handy-Upload Premium · Desktop", () => {
  test("Übergabekarte: QR mit Sucher, 3 Schritte, Gültigkeit, vorbereiteter Versand, dieses Gerät", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    const errors = collectConsoleErrors(page);
    const blocked = await guard(page);
    await page.goto("/de/upload");
    await settle(page);
    const card = page.locator("section[aria-labelledby=upload-handoff-title]");
    await expect(card).toBeVisible();

    const qr = card.getByRole("img", { name: /QR-Code zur Upload-Seite/ });
    await expect(qr).toBeVisible();
    const box = await qr.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(220); // ≥ 3 px per module (scan check: qr-scan.mjs)
    expect(await qr.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await qr.getAttribute("src")).toMatch(/^data:image\/svg\+xml/);

    // fix1 P2-1: wide card (≈ 860–920 px at 1440) with a 256 px code
    expect((await card.boundingBox()).width).toBeGreaterThanOrEqual(860);
    expect((await card.boundingBox()).width).toBeLessThanOrEqual(930);
    expect(box.width).toBeGreaterThanOrEqual(250);
    await expect(card.getByText(/Code bereit/)).toBeVisible();

    const guide = card.getByRole("list", { name: "So geht es" });
    await expect(guide.getByRole("listitem")).toHaveCount(3);
    // fix1 P2-5: label "Gültig" once, value "noch 60 Min." (no doubled word)
    const validity = card.locator("[data-upload-validity]");
    await expect(validity).toHaveText(/^noch \d+ (Min\.|Std\.|Tage)$/);
    await expect(card.getByText("Gültig", { exact: true })).toHaveCount(1);
    expect(await validity.textContent()).not.toMatch(/gültig/i);
    await expect(card.getByText(/Referenz PH-D/)).toBeVisible();

    // "Auf diesem Gerät": secondary, new tab, exactly one visible link
    await expect(card.getByText("Auf diesem Gerät hochladen")).toBeVisible();
    const own = card.locator("a[data-upload-link]:visible");
    await expect(own).toHaveCount(1);
    await expect(own).toHaveAttribute("target", "_blank");

    // prepared "Link an mich senden": one line, closed by default, marked, E-Mail first, builds own-app links only
    const toggle = card.getByRole("button", { name: /Link an mich senden/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toContainText("Vorbereitet");
    const line = await toggle.getByText("Link an mich senden", { exact: true }).boundingBox();
    expect(line.height, "title on one line").toBeLessThan(30);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(card.getByRole("button", { name: "E-Mail", exact: true })).toHaveAttribute("aria-pressed", "true");
    await card.getByLabel("Ihre E-Mail-Adresse").fill("kunde@example.invalid");
    expect(await card.getByRole("link", { name: "In meiner Mail-App öffnen" }).getAttribute("href")).toMatch(/^mailto:kunde@example\.invalid\?subject=/);
    await card.getByRole("button", { name: "SMS", exact: true }).click();
    await card.getByLabel("Ihre Handynummer").fill("+43 660 1234567");
    const smsLink = card.getByRole("link", { name: "In meiner SMS-App öffnen" });
    expect(await smsLink.getAttribute("href")).toMatch(/^sms:\+436601234567\?&body=.*%2Fde%2Fupload%2F/);
    await expect(card.getByText(/direkte Versand durch Platzhirsch ist noch nicht aktiv/)).toBeVisible();

    const axe = await new AxeBuilder({ page }).include("section[aria-labelledby=upload-handoff-title]").withTags(TAGS).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    expect(blocked).toEqual([]);
    expect(errors.filter((e) => !/hydrat|Fast Refresh|HMR|Download the React DevTools/i.test(e))).toEqual([]);
  });

  test("fix1 P2-4: „Link kopieren“ direkt nach domcontentloaded zeigt „Kopiert“", async ({ page, context }) => {
    test.skip(true, DEMO_REMOVED);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/de/upload", { waitUntil: "domcontentloaded" });
    const btn = page.locator("[data-upload-copy]");
    // disabled until mounted; Playwright's click waits for "enabled" like an impatient visitor's second tap
    await btn.click();
    await expect(btn).toHaveText("Kopiert");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/de\/upload\//);
  });

  test("fix1 P1-1 / P2-3: Wiederholversuch sichtbar, falsche Datei sofort abgelehnt", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    test.setTimeout(600_000); // the dev store answers slowly while other teams compile
    const blocked = await guard(page);
    // the first chunk PUT fails once (network), the retry goes through to the dev store
    let failed = 0;
    await page.route(/\/api\/upload\/[^/]+\/files\/[^/?]+\?index=/, (route) => {
      if (route.request().method() === "PUT" && failed++ === 0) return route.abort("connectionreset");
      return route.continue();
    });
    await page.goto("/de/upload");
    await settle(page);
    const phone = page.locator("[data-upload-scroll]");
    test.skip(await phone.getByText(/keine Dateien angenommen/).isVisible(), "demo uploads off on this server");
    await phone.getByRole("checkbox").check();
    const gallery = phone.locator('input[type="file"][accept="image/*,video/*"]');

    // renamed .exe: refused in the browser before any request
    const puts = [];
    page.on("request", (r) => /\/api\/upload\/[^/]+\/files/.test(r.url()) && puts.push(r.method()));
    const t0 = Date.now();
    await gallery.setInputFiles({ name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("MZ\x90\x00 this is not a picture at all") });
    const files = phone.getByRole("list", { name: "Ihre Dateien" });
    await expect(files.getByText(/Abgelehnt:/)).toBeVisible({ timeout: 3000 });
    expect(Date.now() - t0).toBeLessThan(3000);
    expect(puts, "no upload request for the fake file").toEqual([]);
    await expect(files.getByText(/Lädt hoch/)).toHaveCount(0);

    // real photo: first attempt fails → "neuer Versuch (2/5)" is shown, then done
    await gallery.setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    await expect(files.getByText(/neuer Versuch \(2\/5\)/)).toBeVisible({ timeout: 240_000 });
    await expect(files.getByText(/Hochgeladen/)).toBeVisible({ timeout: 240_000 });
    expect(failed).toBeGreaterThanOrEqual(2);
    expect(blocked).toEqual([]);
  });

  test("fix1 P3-4: Kachel vor der Zustimmung führt zur Checkbox", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    await guard(page);
    await page.goto("/de/upload");
    await settle(page);
    const phone = page.locator("[data-upload-scroll]");
    const tile = phone.getByRole("button", { name: /Foto aufnehmen/ });
    await expect(tile).toHaveAttribute("aria-disabled", "true");
    await expect(tile).not.toHaveAttribute("disabled", "");
    await tile.dispatchEvent("click");
    await expect(phone.getByRole("checkbox")).toBeFocused();
    await expect(phone.getByText("Einmal oben zustimmen – dann geht es los.")).toBeVisible();
    await expect(phone.getByRole("group", { name: "Tipp wählen" }).getByRole("button")).toHaveCount(4);
  });

  test("Demo-Handy: Stepper, Kacheln, Tipps, Galerie mit Fortschritt, Erfolgsseite mit Zusammenfassung", async ({ page }) => {
    test.skip(true, DEMO_REMOVED);
    const blocked = await guard(page);
    await page.goto("/de/upload");
    await settle(page);
    const phone = page.locator("[data-upload-scroll]");
    test.skip(await phone.getByText(/keine Dateien angenommen/).isVisible(), "demo uploads off on this server");

    const stepper = phone.getByRole("list", { name: /Fortschritt: Schritt 1 von 3/ });
    await expect(stepper).toBeVisible();
    for (const name of ["Foto aufnehmen", "Video-Rundgang", "Grundriss / Plan", "Aus Galerie", "Notiz & Maße"]) {
      const tile = phone.getByRole("button", { name: new RegExp(name.replace(/[/&]/g, ".")) });
      await expect(tile).toBeDisabled();
      const b = await tile.boundingBox();
      expect(b.height, name).toBeGreaterThanOrEqual(44);
    }
    await expect(phone.getByRole("list", { name: /Aufnahme-Tipps/ }).getByRole("listitem")).toHaveCount(4);

    await phone.getByRole("checkbox").check();
    await expect(phone.getByRole("list", { name: /Schritt 2 von 3/ })).toBeVisible();
    await phone.locator('input[type="file"][accept="image/*,video/*"]').setInputFiles(path.join(FIXTURES, "foto-mit-gps.jpg"));
    const gallery = phone.getByRole("list", { name: "Ihre Dateien" });
    await expect(gallery.getByRole("listitem")).toHaveCount(1);
    await expect(gallery.getByText(/Hochgeladen/)).toBeVisible({ timeout: 60_000 });
    await expect(gallery.locator("img")).toHaveCount(1); // local preview (object URL)
    await expect(phone.getByRole("list", { name: /Schritt 3 von 3/ })).toBeVisible();
    await expect(phone.getByRole("button", { name: /Foto aufnehmen.*1 Datei gewählt/ })).toBeVisible();

    await phone.getByLabel(/Notiz & Maße/).fill("Raumhöhe 2,60 m (QA-Test, bitte ignorieren)");
    await phone.getByRole("button", { name: /An Platzhirsch senden/ }).click();
    const heading = phone.getByRole("heading", { name: "Vielen Dank!" });
    await expect(heading).toBeVisible({ timeout: 20_000 });
    await expect(heading).toBeFocused();
    const done = phone.locator("[data-upload-done]");
    await expect(done.getByText("1 Foto")).toBeVisible();
    await expect(done.getByText("mitgesendet")).toBeVisible();
    await expect(done.getByRole("heading", { name: "So geht es weiter" })).toBeVisible();
    await expect(done.getByText(/Demo-Modus/)).toBeVisible();
    expect(blocked).toEqual([]);
  });
});
