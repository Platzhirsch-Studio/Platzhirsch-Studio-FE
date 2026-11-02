// tests/e2e/portal-raum.spec.js — N2 „Ihr Raum als Zwilling“ (Kundenportal).
// Läuft gegen den Dev-Server mit Mock-Adapter (Demo-Kunde CUST-DEMO-0001,
// Demo-Räume PRJ-2026-014 = synthetischer Testraum, PRJ-2026-021 = wartet auf Video).
// Nichts wird echt versendet: Meldungen landen im Postausgang (.data/raumzwilling),
// alle Anfragen an fremde Hosts werden blockiert und gezählt.
//   PW_WORKERS=1 npx playwright test tests/e2e/portal-raum.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SECRET = process.env.PORTAL_SESSION_SECRET || "dev-only-portal-secret-do-not-use-in-production-0000";
const RAUM = "/de/portal/raum/PRJ-2026-014";
const OFFEN = "PRJ-2026-021";
const TEAM_TOKEN = process.env.RAUM_TEAM_TOKEN || "dev-team-raum";

test.describe.configure({ mode: "serial" });
test.skip(({ browserName }) => browserName !== "chromium", "Portal-Raum: Desktop-Chromium (Mobil siehe 375-px-Test)");

function sessionValue() {
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
  return `${body}.${createHmac("sha256", SECRET).update(`portal-session:${body}`).digest("base64url")}`;
}

async function login(context, baseURL) {
  await context.addCookies([{ name: "ph_portal_session", value: sessionValue(), url: baseURL, httpOnly: true, sameSite: "Lax" }]);
}

async function teamLogin(request, baseURL) {
  const res = await request.post("/api/portal/raum/team", { form: { schluessel: TEAM_TOKEN, name: "E2E", next: "" }, headers: { origin: baseURL }, maxRedirects: 0 });
  expect([303, 307]).toContain(res.status());
}

/** Ohne WebGL2: die Seite muss Standbilder + Liste zeigen (Akzeptanz 5). */
const ohneWebgl = () => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (type === "webgl2") return null;
    return orig.call(this, type, ...rest);
  };
};

function fremdeHosts(page, baseURL) {
  const fremd = [];
  const own = new URL(baseURL).host;
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (!["http:", "https:"].includes(u.protocol)) return;
    if (u.host !== own) fremd.push(r.url());
  });
  return fremd;
}

const sameOrigin = (baseURL) => ({ origin: baseURL });

// P6 Runde 2 (r2-technik P1-6): isolierte Demo-Daten. Vorher hing der Kunde-Test
// am Stand, den ein früherer Lauf (Löschknopf, Video-Upload) in .data/raumzwilling
// hinterlassen hatte. Jetzt werden beide Demo-Räume vor JEDEM Test über die
// Team-Aktion „demo-zuruecksetzen“ gelöscht; die Seite legt sie beim nächsten
// Aufruf frisch aus dem Seed an (src/lib/raumzwilling/seed.js). Ohne Demo-Modus
// (Produktion, Frappe-Adapter) antwortet die Aktion 404 – dann passiert nichts.
// Team-Anmeldung EINMAL je Lauf (die Anmeldung ist pro IP begrenzt, „zu-viele“).
let resetCtx = null;
test.beforeAll(async ({ playwright, baseURL }) => {
  const ctx = await playwright.request.newContext({ baseURL });
  const t = await ctx.post("/api/portal/raum/team", { form: { schluessel: TEAM_TOKEN, name: "E2E", next: "" }, headers: { origin: baseURL }, maxRedirects: 0, timeout: 120_000 }).catch(() => null);
  if (t && [303, 307].includes(t.status())) resetCtx = ctx;
  else await ctx.dispose();
});
test.afterAll(async () => {
  await resetCtx?.dispose();
  resetCtx = null;
});
test.beforeEach(async ({ baseURL }) => {
  if (!resetCtx) return;
  for (const id of ["PRJ-2026-014", OFFEN]) {
    await resetCtx.post(`/api/portal/raum/${id}/aktion`, { data: { aktion: "demo-zuruecksetzen" }, headers: sameOrigin(baseURL), timeout: 120_000 }).catch(() => null);
    // Frisch anlegen (Seed) – Tests, die direkt die Team-API rufen, brauchen den Raum.
    await resetCtx.get(`/api/portal/raum/${id}`, { headers: { cookie: `ph_portal_session=${sessionValue()}` }, timeout: 180_000 }).catch(() => null);
  }
});

test("ohne Session: Seite leitet zum Login, API und Splat-Datei antworten 401, nichts unter public/", async ({ page, request, baseURL }) => {
  const res = await page.goto(RAUM);
  expect(page.url()).toContain("/de/portal/login");
  expect(page.url()).toContain(encodeURIComponent(RAUM));
  expect(res.status()).toBe(200);
  for (const p of ["/api/portal/raum/PRJ-2026-014", "/api/portal/raum/PRJ-2026-014/datei/splat/meta", "/api/portal/raum/PRJ-2026-014/datei/standbild/1"]) {
    const r = await request.get(p);
    expect(r.status(), p).toBe(401);
  }
  const k = await request.post("/api/portal/raum/PRJ-2026-014/kommentar", { data: { text: "x" }, headers: sameOrigin(baseURL) });
  expect(k.status()).toBe(401);
  expect((await request.get("/raumzwilling/PRJ-2026-014/splat/meta.json")).status()).toBe(404);
  expect((await request.get("/api/portal/raum/katalog?q=lota")).status()).toBe(401);
  expect(fs.existsSync(path.join(process.cwd(), "public", "raumzwilling"))).toBe(false);
});

test("Kunde: Raum mit Kennzeichnung, Ebenen, Maßhinweis, Tabelle, Grundriss; Datei nur mit Session", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  const fremd = fremdeHosts(page, baseURL);
  await page.addInitScript(ohneWebgl);
  const res = await page.goto(RAUM);
  test.skip(page.url().includes("/login"), "Server nutzt ein anderes PORTAL_SESSION_SECRET");
  expect(res.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("kennzeichnung")).toContainText("Synthetischer Testraum");
  await expect(page.getByTestId("mass-hinweis")).toContainText("Maße aus Video, Aufmaß vor Bestellung");
  const ebenen = page.getByRole("group", { name: "Ebenen" });
  for (const n of ["Raum", "Planung", "Skizze"]) await expect(ebenen.getByRole("button", { name: n })).toBeVisible();
  // ohne WebGL2: Standbilder statt Canvas, Hinweis
  await expect(page.getByText("WebGL 2 fehlt")).toBeVisible();
  const bilder = page.locator('img[src*="/datei/standbild/"]');
  await expect(bilder).toHaveCount(3);
  await expect(bilder.first()).toHaveJSProperty("complete", true);
  expect(await bilder.first().evaluate((i) => i.naturalWidth)).toBeGreaterThan(100);
  await expect(page.locator("canvas")).toHaveCount(0);
  // Volumen-Tabelle mit Herstellermaßen und Position in Worten
  const tabelle = page.getByRole("table");
  await expect(tabelle.getByRole("rowheader", { name: /Lota Sofa/ })).toBeVisible();
  await expect(tabelle).toContainText("B 240 cm × T 95 cm × H 85 cm");
  await expect(tabelle).toContainText(/vor der (Fensterwand|vorderen Wand|Türwand|rechten Wand)/);
  await expect(page.getByRole("img", { name: /Grundriss Ihres Raums/ })).toBeVisible();
  // Skizze-Ebene: keine erfundene Skizze
  await ebenen.getByRole("button", { name: "Skizze" }).click();
  await expect(page.getByText("Haralds Skizze folgt.")).toBeVisible();
  await expect(page.locator('img[src*="/datei/skizze/"]')).toHaveCount(0);
  expect(fremd, "keine Anfragen an fremde Hosts").toEqual([]);
});

test("Kommentar an einem Stück speichern und wieder löschen; Team-Meldung nur im Postausgang", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  await page.addInitScript(ohneWebgl);
  await page.goto(RAUM);
  test.skip(page.url().includes("/login"), "anderes Secret");
  const text = `E2E Hier steht das Klavier ${Date.now()}`;
  await page.getByLabel("Worum geht es?").selectOption({ label: "ClassiCon · Lota Sofa" });
  await page.getByLabel("Ihr Kommentar").fill(text);
  await page.getByRole("button", { name: "Kommentar senden" }).click();
  await expect(page.getByRole("status").filter({ hasText: "gespeichert" })).toBeVisible();
  const eintrag = page.locator("li[data-k]").filter({ hasText: text });
  await expect(eintrag).toContainText("zu ClassiCon Lota Sofa");
  // gespeichert im Mock-Store
  const api = await page.request.get("/api/portal/raum/PRJ-2026-014");
  const raum = (await api.json()).raum;
  expect(raum.kommentare.some((k) => k.text === text && k.bezug.art === "volumen")).toBe(true);
  // Postausgang: Meldung, nicht versendet
  const post = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".data", "raumzwilling", "postausgang.json"), "utf8"));
  const letzte = post.filter((m) => m.projektId === "PRJ-2026-014" && m.art === "kommentar").pop();
  expect(letzte.versendet).toBe(false);
  await eintrag.getByRole("button", { name: "Kommentar löschen" }).click();
  await expect(page.locator("li[data-k]").filter({ hasText: text })).toHaveCount(0);
});

test("Sprachnachricht an einem Raumpunkt (Datei-Signatur geprüft, Einwilligung Pflicht)", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  await page.goto(RAUM);
  test.skip(page.url().includes("/login"), "anderes Secret");
  const webm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(2048, 1)]);
  const multipart = (einwilligung) => ({
    text: "",
    bezug: JSON.stringify({ art: "punkt" }),
    punkt: JSON.stringify([0.2, 1.1, -1.7]),
    sekunden: "3",
    ...(einwilligung ? { einwilligung: "ja" } : {}),
    audio: { name: "sprachnachricht.webm", mimeType: "audio/webm", buffer: webm },
  });
  const ohne = await page.request.post("/api/portal/raum/PRJ-2026-014/kommentar", { multipart: multipart(false), headers: sameOrigin(baseURL) });
  expect(ohne.status()).toBe(400);
  const falsch = await page.request.post("/api/portal/raum/PRJ-2026-014/kommentar", {
    multipart: { ...multipart(true), audio: { name: "x.webm", mimeType: "audio/webm", buffer: Buffer.alloc(2048, 7) } },
    headers: sameOrigin(baseURL),
  });
  expect(falsch.status()).toBe(415);
  const ok = await page.request.post("/api/portal/raum/PRJ-2026-014/kommentar", { multipart: multipart(true), headers: sameOrigin(baseURL) });
  expect(ok.status()).toBe(201);
  const { kommentar } = await ok.json();
  expect(kommentar.audio.datei).toMatch(/^a-[a-z0-9]+\.webm$/);
  expect(kommentar.punkt).toEqual([0.2, 1.1, -1.7]);
  const audio = await page.request.get(`/api/portal/raum/PRJ-2026-014/datei/audio/${kommentar.audio.datei.replace(/\.webm$/, "")}`);
  expect(audio.status()).toBe(200);
  expect(audio.headers()["cache-control"]).toContain("no-store");
  const weg = await page.request.delete(`/api/portal/raum/PRJ-2026-014/kommentar?id=${kommentar.id}`, { headers: sameOrigin(baseURL) });
  expect(weg.status()).toBe(200);
  // fremdes Projekt → 404, falsche Herkunft → 403
  expect((await page.request.get("/api/portal/raum/PRJ-2099-999")).status()).toBe(404);
  expect((await page.request.post("/api/portal/raum/PRJ-2026-014/kommentar", { data: { text: "x" }, headers: { origin: "https://boese.example" } })).status()).toBe(403);
});

test("3D-Ansicht mit WebGL2: Canvas aria-hidden, Ansicht per Tastatur bedienbar, Standpunkte", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  const fehler = [];
  page.on("pageerror", (e) => fehler.push(String(e)));
  await page.goto(RAUM);
  test.skip(page.url().includes("/login"), "anderes Secret");
  const ansicht = page.locator('[aria-roledescription="3D-Ansicht"]');
  await expect(ansicht).toBeVisible({ timeout: 60_000 });
  await expect(page.locator("canvas")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("status").filter({ hasText: "Raum wird geladen" })).toHaveCount(0, { timeout: 90_000 });
  await ansicht.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowUp");
  const sp = page.getByRole("group", { name: "Standpunkte im Raum" });
  await sp.getByRole("button").nth(1).click();
  await expect(sp.getByRole("button").nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: /Lota Sofa, Breite 240/ }).or(page.getByRole("button", { name: /Bibendum Armchair, Breite 90/ })).first()).toBeAttached();
  expect(fehler).toEqual([]);
});

test("Team-Werkzeug: nur mit Team-Rolle; Platzierung prüft Schema; Katalog liefert geprüfte Maße", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  const bearbeiten = await page.goto(`${RAUM}/bearbeiten`);
  test.skip(page.url().includes("/portal/login"), "anderes Secret");
  // P6 Runde 2: ohne RAUM_TEAM_TOKEN (Produktion) ist das Team-Werkzeug aus → 404.
  test.skip(bearbeiten?.status() === 404, "Team-Werkzeug auf diesem Server aus (kein RAUM_TEAM_TOKEN)");
  expect(page.url()).toContain("/de/portal/raum/team");
  // Kunde darf nicht platzieren
  const verboten = await page.request.put("/api/portal/raum/PRJ-2026-014/platzierung", { data: { version: 1, volumen: [] }, headers: sameOrigin(baseURL) });
  expect(verboten.status()).toBe(403);
  await page.getByLabel("Ihr Name").fill("E2E");
  await page.getByLabel("Team-Schlüssel").fill(TEAM_TOKEN);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(new RegExp(`${RAUM}/bearbeiten$`));
  await expect(page.getByRole("tablist", { name: "Werkzeuge" })).toBeVisible();
  const kaputt = await page.request.put("/api/portal/raum/PRJ-2026-014/platzierung", { data: { version: 1, volumen: [{ id: "v-x", name: "x" }] }, headers: sameOrigin(baseURL) });
  expect(kaputt.status()).toBe(400);
  const raum = (await (await page.request.get("/api/portal/raum/PRJ-2026-014")).json()).raum;
  const gleich = await page.request.put("/api/portal/raum/PRJ-2026-014/platzierung", { data: { version: 1, volumen: raum.platzierung.volumen }, headers: sameOrigin(baseURL) });
  expect(gleich.status()).toBe(200);
  const kat = await page.request.get("/api/portal/raum/katalog?q=Bibendum");
  expect(kat.status()).toBe(200);
  const treffer = (await kat.json()).treffer;
  expect(treffer.some((t) => t.masse && t.masse.w === 90 && t.masse.quelle.art === "hersteller")).toBe(true);
});

test("Fallback Raum-Link: einmal einlösbar, nur dieser Raum, Gast darf nicht löschen", async ({ browser, baseURL }) => {
  const teamCtx = await browser.newContext();
  await teamLogin(teamCtx.request, baseURL);
  const r = await teamCtx.request.post("/api/portal/raum/PRJ-2026-014/aktion", { data: { aktion: "link" }, headers: sameOrigin(baseURL) });
  expect(r.status()).toBe(200);
  const { url } = await r.json();
  await teamCtx.close();
  const gast = await browser.newContext();
  const page = await gast.newPage();
  await page.goto(url.replace(/^https?:\/\/[^/]+/, baseURL));
  await expect(page).toHaveURL(new RegExp(`${RAUM}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Raum löschen" })).toHaveCount(0);
  expect((await page.request.delete("/api/portal/raum/PRJ-2026-014", { headers: sameOrigin(baseURL) })).status()).toBe(403);
  expect((await page.request.get(`/api/portal/raum/${OFFEN}`)).status()).toBe(401);
  // zweites Einlösen → Hinweisseite
  const zweite = await browser.newContext();
  const p2 = await zweite.newPage();
  await p2.goto(url.replace(/^https?:\/\/[^/]+/, baseURL));
  await expect(p2).toHaveURL(/\/de\/portal\/raum\/link\?fehler=ungueltig/);
  await zweite.close();
  await gast.close();
});

test("Raumvideo: Aufnahmehilfe, Einwilligung Pflicht, Upload in Stücken → in Arbeit; Löschknopf", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  await page.goto(`/de/portal/raum/${OFFEN}`);
  test.skip(page.url().includes("/login"), "anderes Secret");
  await expect(page.getByText("Drei Höhen.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Raum von oben/ })).toBeVisible();
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypisom"), Buffer.alloc(4), Buffer.from("isom"), Buffer.alloc(6000, 3)]);
  const ohne = await page.request.post(`/api/portal/raum/${OFFEN}/video?schritt=start`, { data: { name: "raum.mp4", bytes: mp4.length, typ: "video/mp4", sekunden: 90 }, headers: sameOrigin(baseURL) });
  expect(ohne.status()).toBe(400);
  // über die Oberfläche (setInputFiles), 25-s-Video wird im Browser nicht dekodiert → Dauer unbekannt, Server prüft Typ
  await page.locator("#raumvideo").setInputFiles({ name: "raum.mp4", mimeType: "video/mp4", buffer: mp4 });
  await page.getByRole("button", { name: "Raumvideo senden" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Einwilligung" })).toBeVisible();
  await page.getByLabel(/Ich willige ein, dass Platzhirsch Home Living mein Raumvideo/).check();
  await page.getByRole("button", { name: "Raumvideo senden" }).click();
  await expect(page.getByText("Ihr Raumvideo ist angekommen")).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Wir bauen Ihren Raum" })).toBeVisible();
  // Löschknopf (Widerruf)
  await page.getByLabel("Ja, diesen Raum mit allen Kommentaren endgültig löschen.").check();
  await page.getByRole("button", { name: "Raum löschen" }).click();
  await expect(page).toHaveURL(/\/de\/portal\/raum\?geloescht=PRJ-2026-021/);
  await expect(page.getByRole("status").filter({ hasText: "ist gelöscht" })).toBeVisible();
  // Demo wieder herstellen (nur Entwicklung)
  await teamLogin(page.request, baseURL);
  expect((await page.request.post(`/api/portal/raum/${OFFEN}/aktion`, { data: { aktion: "demo-zuruecksetzen" }, headers: sameOrigin(baseURL) })).status()).toBe(200);
});

test("WCAG 2.2 AA (axe) auf Raum-Seite und Übersicht, 375 px ohne Querscroll", async ({ page, context, baseURL }) => {
  await login(context, baseURL);
  await page.addInitScript(ohneWebgl);
  for (const p of [RAUM, "/de/portal/raum", `/de/portal/raum/${OFFEN}`]) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(p);
    test.skip(page.url().includes("/login"), "anderes Secret");
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    const schwer = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
    expect(schwer, p).toEqual([]);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${p} @375`).toBe(true);
  }
});
