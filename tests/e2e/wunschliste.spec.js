// Wunschliste (Service 10): Teilen aus der Merkliste, öffentliche Ansicht,
// Reservieren ohne Doppelte, Verwaltung, Widerruf.
// Schreibt NUR in den lokalen Entwicklungs-Speicher (.data/wunschliste) des
// Servers – nichts geht an das produktive Backoffice, es wird keine Mail
// verschickt. Der Beitrag-Weg (Gutschein-Anfrage) wird nicht abgeschickt,
// nur die Feldprüfung im Browser. Läuft im Projekt desktop (und mobil nur,
// wenn ausdrücklich gewählt). Immer mit PW_WORKERS=1.
import { test as base, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Testisolation (Prüfung Technik: 429 über Wiederholungsläufe, wunschliste:36/90):
// Die Rate-Limits (src/lib/wunschliste/service.js RATE) leben im Speicher des
// Dev-Servers und zählen über Läufe hinweg. Jeder Test bekommt deshalb einen
// EIGENEN Besucher-Schlüssel: eine erfundene X-Forwarded-For-Adresse, die
// visitorKey() (src/lib/wunschliste/http.js) ohne UPLOAD_TRUSTED_IP_HEADER als
// Schlüssel nimmt – für page, request und weitere Kontexte desselben Tests.
// Die Limits selbst bleiben unverändert (eigener Test unten prüft das 429).
const fakeIp = () => `10.${1 + Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
const test = base.extend({
  extraHTTPHeaders: async ({}, provide) => {
    await provide({ "x-forwarded-for": fakeIp() });
  },
});

const ITEMS = [
  { id: "e2e-1", name: "Hamilton Sofa", category: "Minotti", image: "/Images/fallback-og.jpg", href: "/produkte/sofas-couches/hamilton", quantity: 1 },
  { id: "e2e-2", name: "Arco", category: "Flos", image: "", href: "", quantity: 1 },
];

async function createList(request, over = {}) {
  const res = await request.post("/api/wunschliste", {
    data: { locale: "de", occasion: "hochzeit", title: "Anna & Luca", date: "2027-06-12", message: "Wir freuen uns.", understood: true, items: ITEMS, ...over },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

const pathOf = (url) => new URL(url).pathname + new URL(url).hash;

test.describe("Wunschliste", () => {
  test("API lehnt fehlende Bestätigung und leere Liste ab", async ({ request }) => {
    const a = await request.post("/api/wunschliste", { data: { occasion: "einzug", title: "Titel", items: ITEMS, understood: false } });
    expect(a.status()).toBe(422);
    const b = await request.post("/api/wunschliste", { data: { occasion: "einzug", title: "Titel", items: [], understood: true } });
    expect(b.status()).toBe(422);
    const c = await request.post("/api/wunschliste/verwalten", { data: { token: `${"a".repeat(32)}.${"b".repeat(32)}`, action: "view" } });
    expect(c.status()).toBe(404);
  });

  test("öffentliche Ansicht: noindex, keine Preise, Reservieren ohne Doppelte", async ({ page, request, extraHTTPHeaders }) => {
    const created = await createList(request);
    expect(created.shareUrl).toMatch(/\/de\/wunschliste\/[A-Za-z0-9_-]{32}$/);
    expect(created.manageUrl).toContain("/de/wunschliste/verwalten#");
    expect(created.qr).toMatch(/^data:image\/svg\+xml/);

    const res = await page.goto(pathOf(created.shareUrl));
    expect(res.status()).toBe(200);
    expect(res.headers()["cache-control"] || "").not.toContain("public");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
    await expect(page).toHaveTitle(/^Wunschliste \|/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anna & Luca");
    const body = await page.locator("main, body").first().innerText();
    expect(body).not.toMatch(/€\s?\d|\d\s?€/);

    // Reservieren (Name optional, nur für den Ersteller)
    await page.getByRole("button", { name: "Arco reservieren" }).click();
    await page.getByRole("textbox", { name: "Ihr Name (optional)" }).fill("Tante Erika");
    await page.getByRole("button", { name: "Reservierung bestätigen" }).click();
    await expect(page.getByText("Von Ihnen reserviert")).toBeVisible();
    await expect(page.getByText("Tante Erika")).toHaveCount(0);

    // Zweite Reservierung desselben Stücks über die API: 409
    const shareId = created.shareUrl.split("/").pop();
    const items = await request.post(`/api/wunschliste/${shareId}/reservieren`, { data: { item: "0".repeat(16) } });
    expect(items.status()).toBe(404);

    // Eine andere Person sieht nur „Reserviert“
    const other = await page.context().browser().newContext({ extraHTTPHeaders });
    const p2 = await other.newPage();
    await p2.goto(pathOf(created.shareUrl));
    await expect(p2.getByText("Reserviert", { exact: true })).toBeVisible();
    await expect(p2.getByRole("button", { name: "Arco reservieren" })).toHaveCount(0);
    await other.close();

    // Beitrag: leeres Absenden markiert Pflichtfelder, schickt nichts
    let sent = false;
    page.on("request", (r) => {
      if (r.url().includes("/beitrag")) sent = true;
    });
    await page.getByRole("button", { name: "Beitrag anfragen" }).click();
    await expect(page.getByRole("textbox", { name: "Ihr Name", exact: true })).toHaveAttribute("aria-invalid", "true");
    expect(sent).toBe(false);

    // Freigeben durch die reservierende Person
    await page.getByRole("button", { name: "Reservierung aufheben" }).click();
    await expect(page.getByRole("button", { name: "Arco reservieren" })).toBeVisible();

    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    const serious = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(serious, JSON.stringify(serious.map((v) => [v.id, v.nodes.map((n) => n.target)]), null, 1)).toEqual([]);
  });

  test("Verwaltung: Reservierung mit Namen, neuer Link, Widerruf, Löschen", async ({ page, request }) => {
    const created = await createList(request, { title: "Unser neues Zuhause", occasion: "einzug", date: "" });
    const shareId = created.shareUrl.split("/").pop();
    const view = await request.post("/api/wunschliste/verwalten", { data: { token: created.adminToken, action: "view" } });
    const first = (await view.json()).list.items[0].key;
    const r = await request.post(`/api/wunschliste/${shareId}/reservieren`, { data: { item: first, name: "Onkel Max", note: "Freu mich" } });
    expect(r.status()).toBe(200);
    const again = await request.post(`/api/wunschliste/${shareId}/reservieren`, { data: { item: first } });
    expect(again.status()).toBe(409);

    await page.goto(pathOf(created.manageUrl));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Unser neues Zuhause");
    await expect(page.getByText("Reserviert von Onkel Max")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    await page.getByRole("button", { name: "Neuen Teilen-Link erzeugen" }).click();
    await expect(page.getByText("Neuer Link erstellt.", { exact: false })).toBeVisible();
    expect((await request.get(pathOf(created.shareUrl))).status()).toBe(404);

    await page.getByRole("button", { name: "Teilen-Link widerrufen" }).click();
    await expect(page.getByText("Der Link ist widerrufen.")).toBeVisible();
    await page.getByRole("button", { name: "Wunschliste löschen" }).click();
    await page.getByRole("button", { name: "Endgültig löschen" }).click();
    await expect(page.getByText("Die Wunschliste ist gelöscht.").first()).toBeVisible();
    const gone = await request.post("/api/wunschliste/verwalten", { data: { token: created.adminToken, action: "view" } });
    expect(gone.status()).toBe(404);
  });

  test("Merkliste: Knopf „Als Wunschliste teilen“ öffnet das Formular", async ({ page }) => {
    await page.addInitScript((items) => window.localStorage.setItem("cart", JSON.stringify(items)), ITEMS);
    await page.goto("/de/merkliste");
    const open = page.getByRole("button", { name: "Als Wunschliste teilen" });
    await expect(open).toBeVisible();
    await open.click();
    await expect(page.getByRole("radio", { name: "Hochzeit" })).toBeVisible();
    await page.getByRole("radio", { name: "Hochzeit" }).check();
    await expect(page.getByRole("textbox", { name: "Titel" })).toHaveValue("Unsere Hochzeit");
    // ohne Bestätigung: Fehler am Feld, kein Request
    let sent = false;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/api/wunschliste")) sent = true;
    });
    await page.getByRole("button", { name: "Teilen-Link erstellen" }).click();
    await expect(page.getByText("Bitte bestätigen Sie den Hinweis zum Teilen-Link.").first()).toBeVisible();
    expect(sent).toBe(false);
  });

  test("Rate-Limit greift weiter je Besucher, ein anderer Besucher ist nicht betroffen", async ({ request, playwright, baseURL }) => {
    // manage: 60 Anfragen je 10 min und Schlüssel (RATE.manage). Ungültiger Token → 404,
    // es wird nichts gespeichert; die 61. Anfrage desselben Besuchers → 429.
    const token = `${"a".repeat(32)}.${"b".repeat(32)}`;
    const codes = [];
    for (let i = 0; i < 61; i++) codes.push((await request.post("/api/wunschliste/verwalten", { data: { token, action: "view" } })).status());
    expect(codes.slice(0, 60).every((c) => c === 404), codes.join(",")).toBe(true);
    expect(codes[60]).toBe(429);
    const fremd = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": fakeIp() } });
    expect((await fremd.post("/api/wunschliste/verwalten", { data: { token, action: "view" } })).status()).toBe(404);
    await fremd.dispose();
  });

  test("unbekannter Link: 404 mit Hilfetext, auch in EN", async ({ page }) => {
    const res = await page.goto(`/de/wunschliste/${"x".repeat(32)}`);
    expect(res.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Diese Wunschliste ist nicht erreichbar.");
    const en = await page.goto(`/en/wunschliste/${"x".repeat(32)}`);
    expect(en.status()).toBe(404);
  });
});
