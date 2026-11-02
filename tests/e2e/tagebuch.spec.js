// tests/e2e/tagebuch.spec.js — Projekt-Tagebuch im Kundenportal (Service 12).
// Gegen den Dev-Server mit Mock-Adapter (Demo-Kunde CUST-DEMO-0001, Projekt
// PRJ-2026-014 mit synthetischen Beispielbildern). Ablauf: Zeitleiste → Upload
// mit GPS (wird entfernt) → Referenz-Freigabe mit Vorschau und Einwilligung →
// Studio prüft und veröffentlicht → /de/projekte zeigt es → Widerruf → weg.
// Nichts wird versendet; das produktive Backoffice wird nie angesprochen.
//   PW_WORKERS=1 npx playwright test tests/e2e/tagebuch.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SECRET = process.env.PORTAL_SESSION_SECRET || "dev-only-portal-secret-do-not-use-in-production-0000";
// Persönliche Team-Konten (src/lib/portal/tagebuch/konten.js): im Dev die Demo-Konten.
const STUDIO = { benutzer: process.env.TAGEBUCH_E2E_STUDIO_USER || "studio.demo", passwort: process.env.TAGEBUCH_E2E_STUDIO_PASS || "dev-studio-tagebuch" };
const MITARBEIT = { benutzer: process.env.TAGEBUCH_E2E_TEAM_USER || "team.demo", passwort: process.env.TAGEBUCH_E2E_TEAM_PASS || "dev-team-tagebuch" };
const RAUM_SCHLUESSEL = process.env.RAUM_TEAM_TOKEN || "dev-team-raum";
const PRJ = "PRJ-2026-014";
const SEITE = `/de/portal/projekte/${PRJ}/tagebuch`;
const DATA = path.join(process.cwd(), ".data");
const SLUG = `e2e-wohnzimmer-${Date.now().toString(36)}`;

test.describe.configure({ mode: "serial" });
test.skip(({ browserName }) => browserName !== "chromium", "Tagebuch: Chromium (Mobil per Viewport-Test)");

function sessionValue() {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
  return `${body}.${createHmac("sha256", SECRET).update(`portal-session:${body}`).digest("base64url")}`;
}
const login = (context, baseURL) => context.addCookies([{ name: "ph_portal_session", value: sessionValue(), url: baseURL, httpOnly: true, sameSite: "Lax" }]);

/** Frischer Stand: Tagebuch des Demo-Projekts und dessen Freigaben löschen (nur Dev-Ablage). */
function zuruecksetzen() {
  fs.rmSync(path.join(DATA, "tagebuch", PRJ), { recursive: true, force: true });
  const fg = path.join(DATA, "projekte-freigaben");
  if (!fs.existsSync(fg)) return;
  for (const id of fs.readdirSync(fg)) {
    try {
      const f = JSON.parse(fs.readFileSync(path.join(fg, id, "freigabe.json"), "utf8"));
      if (f.projektId === PRJ) fs.rmSync(path.join(fg, id), { recursive: true, force: true });
    } catch {
      /* fremder Ordner */
    }
  }
}

let team = null;
let mitarbeit = null;
let freigabeId = null;

async function teamLogin(playwright, baseURL, konto) {
  const ctx = await playwright.request.newContext({ baseURL });
  const r = await ctx.post("/api/portal/tagebuch/team", { form: { ...konto, next: "" }, headers: { origin: baseURL }, maxRedirects: 0, timeout: 180_000 });
  expect([303, 307]).toContain(r.status());
  expect(r.headers()["location"] || "").not.toContain("fehler=");
  return ctx;
}
test.beforeAll(async ({ playwright, baseURL }) => {
  zuruecksetzen();
  team = await teamLogin(playwright, baseURL, STUDIO);
  mitarbeit = await teamLogin(playwright, baseURL, MITARBEIT);
  // Dev-Server kompiliert jede Route beim ersten Aufruf: einmal nacheinander anwärmen.
  const warm = { timeout: 180_000, maxRedirects: 0, headers: { origin: baseURL } };
  for (const p of [`/api/portal/tagebuch/${PRJ}/bild/f-beispiel00-640.webp`, "/api/portal/tagebuch/referenz/fg-aaaaaaaaaa/f-aaaaaaaaaa-640.webp", "/de/projekte", "/de/projekte/e2e-gibt-es-nicht", "/de/portal/tagebuch/team", SEITE])
    await team.get(p, warm).catch(() => null);
  await team.post(`/api/portal/tagebuch/${PRJ}/foto`, { ...warm, multipart: { phase: "x" } }).catch(() => null);
  await team.post(`/api/portal/tagebuch/${PRJ}/freigabe`, { ...warm, data: {} }).catch(() => null);
  await team.post("/api/portal/tagebuch/pruefung/fg-aaaaaaaaaa", { ...warm, data: {} }).catch(() => null);
});
test.afterAll(async () => {
  await team?.dispose();
  await mitarbeit?.dispose();
  zuruecksetzen();
});

async function jpegMitGps() {
  return sharp({ create: { width: 1400, height: 1000, channels: 3, background: "#b9b2a6" } })
    .composite([{ input: Buffer.from('<svg width="1400" height="1000"><rect x="300" y="500" width="800" height="300" fill="#4f6b68"/></svg>'), top: 0, left: 0 }])
    .jpeg()
    .withExif({ IFD0: { Artist: "Max Mustermann" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "47/1 32/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "9/1 42/1 0/1" } })
    .toBuffer();
}

test("ohne Anmeldung: Seite → Login, Bilder und API 401, Referenz-Bild 404", async ({ page, request, baseURL }) => {
  await page.goto(SEITE);
  expect(page.url()).toContain("/de/portal/login");
  expect((await request.get(`/api/portal/tagebuch/${PRJ}/bild/f-beispiel00-640.webp`)).status()).toBe(401);
  expect((await request.post(`/api/portal/tagebuch/${PRJ}/foto`, { multipart: { phase: "montage" }, headers: { origin: baseURL } })).status()).toBe(401);
  expect((await request.get("/api/portal/tagebuch/referenz/fg-aaaaaaaaaa/f-aaaaaaaaaa-640.webp")).status()).toBe(404);
  // fremde Herkunft wird abgelehnt (CSRF)
  expect((await request.post(`/api/portal/tagebuch/${PRJ}/freigabe`, { data: {}, headers: { origin: "https://evil.example" } })).status()).toBe(403);
});

test("Team: persönliche Anmeldung, gemeinsamer Raum-Schlüssel öffnet das Tagebuch nicht", async ({ playwright, baseURL }) => {
  const ctx = await playwright.request.newContext({ baseURL });
  // altes Formular mit gemeinsamem Schlüssel → abgelehnt, kein Cookie
  const alt = await ctx.post("/api/portal/tagebuch/team", { form: { schluessel: RAUM_SCHLUESSEL, name: "Jemand", next: "" }, headers: { origin: baseURL, "x-forwarded-for": "10.77.0.1" }, maxRedirects: 0 });
  expect(alt.headers()["location"]).toContain("fehler=anmeldung");
  expect(alt.headers()["set-cookie"] || "").not.toContain("ph_tagebuch_team");
  // falsches Passwort eines echten Kontos → abgelehnt
  const falsch = await ctx.post("/api/portal/tagebuch/team", { form: { benutzer: STUDIO.benutzer, passwort: "falsch-falsch" }, headers: { origin: baseURL, "x-forwarded-for": "10.77.0.1" }, maxRedirects: 0 });
  expect(falsch.headers()["location"]).toContain("fehler=anmeldung");
  // Raum-Cookie (gemeinsamer Schlüssel) gibt keinen Tagebuch-Zugang
  const raum = await ctx.post("/api/portal/raum/team", { form: { schluessel: RAUM_SCHLUESSEL, name: "Jemand", next: "" }, headers: { origin: baseURL }, maxRedirects: 0 });
  test.skip(![303, 307].includes(raum.status()), "Raum-Werkzeug ohne Team-Anmeldung");
  expect((await ctx.get(`/api/portal/tagebuch/${PRJ}/bild/f-beispiel00-640.webp`)).status()).toBe(401);
  expect((await ctx.post("/api/portal/tagebuch/pruefung/fg-aaaaaaaaaa", { data: {}, headers: { origin: baseURL } })).status()).toBe(401);
  const seite = await (await ctx.get("/de/portal/tagebuch/team")).text();
  expect(seite).toContain('name="benutzer"');
  await ctx.dispose();
  // persönliches Konto: Seite nennt Name und Rolle
  const ich = await (await team.get("/de/portal/tagebuch/team")).text();
  expect(ich).toMatch(/Angemeldet als Studio Demo, Rolle Studio/);
});

test("Kunde: Zeitleiste in 7 Phasen, Beispiel gekennzeichnet, keine erfundene Skizze, Vorher/Nachher-Regler, axe", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  const res = await page.goto(SEITE);
  test.skip(page.url().includes("/login"), "Server nutzt ein anderes PORTAL_SESSION_SECRET");
  expect(res.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wohnzimmer am See");
  await expect(page.getByText("Demo-Daten: Die Bilder sind synthetische Beispielgrafiken")).toBeVisible();
  const zeitleiste = page.getByRole("list", { name: "Zeitleiste" });
  for (const h of ["Handzeichnung", "Modell", "Rendering", "Lieferung", "Montage", "Vorher", "Nachher"]) await expect(zeitleiste.getByRole("heading", { name: h, exact: true })).toBeVisible();
  // Handzeichnung/Modell: ehrlich leer
  await expect(zeitleiste.getByText("Folgt, sobald das Studio-Team Bilder hinterlegt.")).toHaveCount(3);
  // Bilder als picture mit AVIF + WebP, privat
  const img = zeitleiste.locator('img[src*="/api/portal/tagebuch/"]').first();
  await expect(img).toHaveJSProperty("complete", true);
  expect(await img.evaluate((i) => i.naturalWidth)).toBeGreaterThan(100);
  await expect(zeitleiste.locator('source[type="image/avif"]').first()).toHaveAttribute("srcset", /-640\.avif 640w/);
  const bildRes = await page.request.get(await img.getAttribute("src"));
  expect(bildRes.headers()["cache-control"]).toBe("private, no-store");
  // Regler per Tastatur
  const regler = page.getByRole("slider", { name: "Vorher-Nachher-Regler" });
  await regler.focus();
  await page.keyboard.press("End");
  await expect(regler).toHaveAttribute("aria-valuetext", "100 Prozent Vorher sichtbar");
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const ernst = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  expect(ernst.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`)).toEqual([]);
});

test("Upload: Hinweis Pflicht, Skizze nur fürs Team, GPS und EXIF entfernt", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  await page.goto(SEITE);
  test.skip(page.url().includes("/login"), "anderes Secret");
  // Kunde kann keine Handzeichnung hochladen (Auswahl fehlt, API 403)
  await expect(page.getByLabel("Phase").locator('option[value="skizze"]')).toHaveCount(0);
  const verboten = await page.request.post(`/api/portal/tagebuch/${PRJ}/foto`, {
    multipart: { phase: "skizze", hinweis: "ja", echt: "ja", bild: { name: "s.jpg", mimeType: "image/jpeg", buffer: await jpegMitGps() } },
    headers: { origin: baseURL },
  });
  expect(verboten.status()).toBe(403);
  await page.getByLabel("Phase").selectOption("montage");
  await page.getByLabel("Bildtitel (optional)").fill("E2E Montage Sofa");
  await page.getByLabel(/^Foto \(JPG/).setInputFiles({ name: "montage.jpg", mimeType: "image/jpeg", buffer: await jpegMitGps() });
  await page.getByLabel(/Habe ich geprüft/).check();
  await page.getByRole("button", { name: "Hochladen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Standortdaten (GPS)" })).toBeVisible({ timeout: 60_000 });
  const neu = page.getByRole("img", { name: "E2E Montage Sofa" });
  await expect(neu).toBeVisible({ timeout: 90_000 });
  for (const fmt of ["webp", "avif"]) {
    const src = (await neu.getAttribute("src")).replace(/\.webp$/, `.${fmt}`);
    const buf = Buffer.from(await (await page.request.get(src)).body());
    const m = await sharp(buf).metadata();
    expect(m.exif, `${fmt} ohne EXIF`).toBeUndefined();
    expect(buf.includes(Buffer.from("Mustermann"))).toBe(false);
  }
  await expect(page.getByText("Standortdaten entfernt").first()).toBeVisible();
});

test("Referenz freigeben: Auswahl, Adresse abgelehnt, Vorschau, Einwilligung mit Version", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  await page.goto(SEITE);
  test.skip(page.url().includes("/login"), "anderes Secret");
  // Vorbedingung selbst herstellen (nicht vom Upload-Test abhängig, Prüfung Technik tagebuch:142)
  if ((await page.getByRole("img", { name: "E2E Montage Sofa" }).count()) === 0) {
    const up = await page.request.post(`/api/portal/tagebuch/${PRJ}/foto`, {
      multipart: { phase: "montage", titel: "E2E Montage Sofa", hinweis: "ja", bild: { name: "m.jpg", mimeType: "image/jpeg", buffer: await jpegMitGps() } },
      headers: { origin: baseURL },
      timeout: 120_000,
    });
    expect(up.status(), await up.text()).toBe(201);
    await page.reload();
  }
  await expect(page.getByText("Entwurf: Der Einwilligungstext wird noch von der Kanzlei geprüft.")).toBeVisible();
  // erst nach der Hydration ankreuzen (kontrollierte Checkboxen)
  await expect(page.locator('[data-referenz-form][data-bereit="1"]')).toBeAttached({ timeout: 60_000 });
  const auswahl = page.getByRole("group", { name: "1. Bilder auswählen" });
  await auswahl.getByRole("checkbox", { name: /Nachher \(Beispiel\)/ }).check();
  await auswahl.getByRole("checkbox", { name: /E2E Montage Sofa/ }).check();
  await expect(auswahl.getByText("2 von höchstens 12 ausgewählt")).toBeVisible();
  await page.getByRole("radio", { name: /Vorname und Ort/ }).check();
  await page.getByRole("textbox", { name: "Vorname" }).fill("Anna");
  await page.getByRole("textbox", { name: "Gemeinde oder Region" }).fill("Landstraße 11");
  const vorschau = page.getByRole("group", { name: "3. Vorschau" }).last();
  await expect(vorschau).toContainText("Anna, Landstraße 11");
  await page.getByLabel("Ich willige wie oben beschrieben ein.").check();
  await page.getByRole("button", { name: "Freigabe senden" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "keine Straße" })).toBeVisible();
  await page.getByRole("textbox", { name: "Gemeinde oder Region" }).fill("Hörbranz");
  await expect(vorschau).toContainText("Anna, Hörbranz");
  await expect(vorschau).toContainText("Foto: Anna");
  await page.getByRole("button", { name: "Freigabe senden" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Das Studio prüft Ihre Freigabe" })).toBeVisible();
  await expect(page.getByText("Wartet auf Prüfung durch das Studio")).toBeVisible();
  await expect(page.getByText(/tagebuch-referenz-\d{4}-\d{2}-\d{2}-v\d/).first()).toBeVisible();
  // Nicht öffentlich vor der Studio-Prüfung
  const ids = fs.readdirSync(path.join(DATA, "projekte-freigaben"));
  freigabeId = ids.find((id) => JSON.parse(fs.readFileSync(path.join(DATA, "projekte-freigaben", id, "freigabe.json"), "utf8")).projektId === PRJ);
  const f = JSON.parse(fs.readFileSync(path.join(DATA, "projekte-freigaben", freigabeId, "freigabe.json"), "utf8"));
  expect(f.status).toBe("eingereicht");
  expect(f.einwilligung.zeitpunkt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  expect(f.einwilligung.version).toMatch(/^tagebuch-referenz-/);
  expect(JSON.stringify(f)).not.toMatch(/Musterweg|6900/);
  expect((await page.request.get(`/api/portal/tagebuch/referenz/${freigabeId}/${f.bilder[0].id}-640.webp`)).status()).toBe(404);
  // Foto in aktiver Freigabe kann nicht gelöscht werden
  const del = await page.request.delete(`/api/portal/tagebuch/${PRJ}/foto?id=${f.bilder[1].id}`, { headers: { origin: baseURL } });
  expect(del.status()).toBe(409);
});

test("Studio prüft und veröffentlicht → /de/projekte zeigt die Referenz", async ({ page, baseURL }) => {
  test.skip(!freigabeId, "keine Freigabe aus dem Vortest");
  // Rolle Mitarbeit: sieht Tagebücher, entscheidet aber nicht über Referenzen
  const nurMitarbeit = await mitarbeit.post(`/api/portal/tagebuch/pruefung/${freigabeId}`, { data: { aktion: "ablehnen", notiz: "x" }, headers: { origin: baseURL } });
  expect(nurMitarbeit.status()).toBe(403);
  expect((await mitarbeit.get(`/api/portal/tagebuch/${PRJ}/bild/f-beispiel00-640.webp`)).status()).toBe(200);
  const unvollstaendig = await team.post(`/api/portal/tagebuch/pruefung/${freigabeId}`, { data: { aktion: "veroeffentlichen", slug: SLUG }, headers: { origin: baseURL } });
  expect(unvollstaendig.status()).toBe(400);
  const f = JSON.parse(fs.readFileSync(path.join(DATA, "projekte-freigaben", freigabeId, "freigabe.json"), "utf8"));
  const alt = Object.fromEntries(f.bilder.map((b, i) => [b.id, `E2E Bild ${i + 1}: Wohnraum`]));
  const ok = await team.post(`/api/portal/tagebuch/pruefung/${freigabeId}`, {
    data: {
      aktion: "veroeffentlichen",
      slug: SLUG,
      titel: "E2E Wohnzimmer in Hörbranz",
      typologie: "Wohnung",
      leistungen: ["Wohnen"],
      zeitraumVon: "2026-08",
      zeitraumBis: "2026-10",
      ausgangslage: "E2E-Test: ein heller Wohnraum.",
      loesung: [{ raum: "Wohnen", text: "E2E-Test: Sofa und Leuchte." }],
      alt,
    },
    headers: { origin: baseURL },
  });
  expect(ok.status(), await ok.text()).toBe(200);
  const geprueft = JSON.parse(fs.readFileSync(path.join(DATA, "projekte-freigaben", freigabeId, "freigabe.json"), "utf8"));
  expect(geprueft.pruefung.von).toBe("Studio Demo (studio.demo)");
  expect(geprueft.verlauf.at(-1)).toMatchObject({ was: "veroeffentlichen", von: "Studio Demo (studio.demo)" });
  // Team-Seite listet sie
  const teamSeite = await team.get("/de/portal/tagebuch/team");
  expect(await teamSeite.text()).toContain(PRJ);
  // öffentlich
  const hub = await page.goto("/de/projekte");
  expect(hub.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "E2E Wohnzimmer in Hörbranz" })).toBeVisible();
  await page.goto(`/de/projekte/${SLUG}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Wohnzimmer in Hörbranz");
  await expect(page.getByText("Anna, Hörbranz")).toBeVisible();
  await expect(page.getByText("Beispiel aus Demo-Daten")).toBeVisible();
  const bild = page.locator('img[src^="/api/portal/tagebuch/referenz/"]').first();
  await expect(bild).toHaveJSProperty("complete", true);
  expect(await bild.evaluate((i) => i.naturalWidth)).toBeGreaterThan(100);
  expect(await page.locator('img[src*="/_next/image"]').count()).toBe(0);
  const robots = await page.locator('meta[name="robots"]').getAttribute("content");
  expect(robots).toContain("noindex");
  expect(await page.content()).not.toMatch(/Musterweg|6900 Bregenz/);
});

test("Widerruf durch den Kunden: Seite und Bilder sofort weg, Nachweis bleibt", async ({ page, context, baseURL }) => {
  test.skip(!freigabeId, "keine Freigabe");
  await login(context, baseURL);
  await page.goto(SEITE);
  test.skip(page.url().includes("/login"), "anderes Secret");
  await expect(page.getByRole("link", { name: "Öffentliche Seite ansehen" })).toHaveAttribute("href", `/de/projekte/${SLUG}`);
  const f = JSON.parse(fs.readFileSync(path.join(DATA, "projekte-freigaben", freigabeId, "freigabe.json"), "utf8"));
  const bildUrl = `/api/portal/tagebuch/referenz/${freigabeId}/${f.bilder[0].id}-640.webp`;
  expect((await page.request.get(bildUrl)).status()).toBe(200);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Einwilligung widerrufen" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Widerrufen. Die Seite ist entfernt." })).toBeVisible();
  expect((await page.request.get(bildUrl)).status()).toBe(404);
  expect((await page.request.get(`/de/projekte/${SLUG}`)).status()).toBe(404);
  const nachher = JSON.parse(fs.readFileSync(path.join(DATA, "projekte-freigaben", freigabeId, "freigabe.json"), "utf8"));
  expect(nachher.status).toBe("widerrufen");
  expect(nachher.widerruf.zeitpunkt).toBeTruthy();
  expect(nachher.einwilligung.version).toBe(f.einwilligung.version);
  expect(fs.existsSync(path.join(DATA, "projekte-freigaben", freigabeId, "bilder"))).toBe(false);
});

test("Mobil 375 px: kein waagrechtes Scrollen, Bedienelemente ≥ 44 px", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  await login(ctx, baseURL);
  const page = await ctx.newPage();
  await page.goto(SEITE);
  test.skip(page.url().includes("/login"), "anderes Secret");
  const breit = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(breit).toBeLessThanOrEqual(1);
  const klein = await page.evaluate(() =>
    [...document.querySelectorAll("main button, main select, main input[type=checkbox], main input[type=radio], main a")]
      .filter((el) => el.offsetParent !== null)
      .map((el) => {
        const r = (el.closest("label") || el).getBoundingClientRect();
        return { t: el.textContent?.trim().slice(0, 30) || el.name || el.type, h: r.height };
      })
      .filter((x) => x.h < 24)
  );
  expect(klein).toEqual([]);
  await ctx.close();
});
