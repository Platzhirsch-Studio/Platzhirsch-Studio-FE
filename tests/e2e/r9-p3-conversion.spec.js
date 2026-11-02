// tests/e2e/r9-p3-conversion.spec.js — Runde 5, Fix-Team P3: Bestätigung je
// Kontaktweg, KI-Knopf nur mit echter KI, Architektin/Interior/Stadt-Kontext,
// Footer auf /beratung, Launcher und „Privatsphäre-Einstellungen“, Merkliste,
// Personas-Abläufe aus r5-ux-conversion bis zur Bestätigung.
// Es wird NICHTS gesendet: jeder POST an /api wird abgefangen (route.fulfill).
// Run: PW_WORKERS=1 npx playwright test tests/e2e/r9-p3-conversion.spec.js --project=desktop --reporter=list
import { test, expect, devices } from "@playwright/test";
import fs from "node:fs";
import { dismissCookieBanner, settle } from "./helpers.js";
import { PROD, conciergeOn } from "./prod-mode.js";

const SLOW = { timeout: 300_000 };
const SHOTS = process.env.R9_P3_SHOTS || "";
const { defaultBrowserType: _i, ...IPHONE } = devices["iPhone 15 Pro"];
const { defaultBrowserType: _p, ...PIXEL } = devices["Pixel 7"];

test.describe.configure({ timeout: 600_000 });

/** Every POST to /api answered locally – nothing reaches the backoffice. */
async function mockPosts(page) {
  const sent = [];
  await page.route("**/api/**", (route) => {
    const req = route.request();
    if (req.method() === "GET" || req.method() === "HEAD") return route.continue();
    sent.push({ url: req.url(), body: req.postDataJSON?.() ?? null });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "ok", data: {} }) });
  });
  return sent;
}

/** Cookie bar away; IT wording changed to voi in Runde 5 (P5), the shared helper may still expect the old one. */
async function dismissCookies(page) {
  try {
    await dismissCookieBanner(page, 8_000);
  } catch {
    const btn = page.getByRole("button", { name: /senza consenso|ohne Einwilligung|without consent|sans consentement/ }).first();
    if (await btn.count()) await btn.click();
  }
}

async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

/** Wizard from the current step to the confirmation; returns the confirmation. */
async function finishWizard(page, sent, { message = "Wir möchten unser Wohnzimmer neu einrichten.", phone = "", name = "Anna" } = {}) {
  const next = page.getByRole("button", { name: /^(Weiter|Next|Suivant|Avanti)$/ });
  for (const id of ["beratung-art", "beratung-ort"]) {
    if ((await page.locator(`#${id}`).count()) && !(await page.locator(`#${id} input:checked`).count())) {
      await page.locator(`#${id}-0`).check();
    }
    if (await page.locator(`#${id}`).count()) await next.click();
  }
  const msg = page.locator("#beratung-vorhaben");
  await expect(msg).toBeVisible(SLOW);
  if (!(await msg.inputValue()).includes(message)) await msg.fill(`${(await msg.inputValue()).trim()}\n${message}`.trim());
  await next.click();
  await page.locator("#beratung-vorname").fill(name);
  await page.locator("#beratung-nachname").fill("Test");
  await page.locator("#beratung-email").fill("anna.test@example.com");
  await page.locator("#beratung-telefon").fill(phone);
  const before = sent.length;
  await page.locator('form button[type="submit"]').click();
  await expect.poll(() => sent.length, { timeout: 60_000 }).toBeGreaterThan(before);
  const box = page.locator("[data-confirmation]");
  await expect(box).toBeVisible(SLOW);
  return { box, body: sent.at(-1).body };
}

// ------------------------------------------------------------ 1 Bestätigung
test.describe("Bestätigung je Kontaktweg (ux P1-1)", () => {
  test("Beratung ohne Telefon: E-Mail-Variante, kein Anrufversprechen", async ({ page }) => {
    const sent = await mockPosts(page);
    await page.goto("/de/beratung?thema=kueche", SLOW);
    await settle(page);
    await dismissCookies(page);
    const { box, body } = await finishWizard(page, sent, { phone: "" });
    expect(body.telefon).toBe("");
    await expect(box).toHaveAttribute("data-contact-way", "email");
    await expect(box.locator("ol > li").first()).toContainText("per E-Mail");
    await expect(box.locator("ol")).not.toContainText("rufen Sie an");
    await shot(page, "bestaetigung-ohne-telefon");
  });

  test("Beratung mit Telefon: Anruf-Variante", async ({ page }) => {
    const sent = await mockPosts(page);
    await page.goto("/de/beratung?thema=kueche", SLOW);
    await settle(page);
    await dismissCookies(page);
    const { box } = await finishWizard(page, sent, { phone: "+43 664 1234567" });
    await expect(box).toHaveAttribute("data-contact-way", "phone");
    await expect(box.locator("ol > li").first()).toContainText("Wir rufen Sie an");
  });

  test("Kontakt ohne Telefon: E-Mail-Variante; IT in voi", async ({ page }) => {
    const sent = await mockPosts(page);
    await page.goto("/de/kontakt", SLOW);
    await settle(page);
    await dismissCookies(page);
    await page.locator("#kontakt-name").fill("Anna Test");
    await page.locator("#kontakt-email").fill("anna.test@example.com");
    await page.locator("#kontakt-nachricht").fill("Ich hätte gern Unterlagen zu einem Sofa.");
    await page.locator('form button[type="submit"]').click();
    await expect.poll(() => sent.length, { timeout: 60_000 }).toBeGreaterThan(0);
    const box = page.locator('[data-confirmation="kontakt"]');
    await expect(box).toHaveAttribute("data-contact-way", "email");
    await expect(box.locator("ol > li").first()).toContainText("per E-Mail");
  });
});

// ------------------------------------------------------------ 2 KI-Knopf
test.describe("KI-Knopf nur mit echter KI (ux P1-2)", () => {
  for (const path of ["/de", "/de/leistungen", "/de/yacht-interior", "/de/ezarri"]) {
    test(`Pixel 7 ${path}: ohne Schlüssel 0 Links und 0 Prefetches auf /concierge`, async ({ browser, request }) => {
      test.skip(await conciergeOn(request), "Server mit echtem KI-Schlüssel");
      const context = await browser.newContext(PIXEL);
      const page = await context.newPage();
      await mockPosts(page);
      const hits = [];
      page.on("request", (r) => {
        const u = new URL(r.url());
        if (/\/concierge(\/|$|\?)/.test(u.pathname) && !u.pathname.startsWith("/api/")) hits.push(r.url());
      });
      await page.goto(path, SLOW);
      await settle(page);
      await dismissCookies(page);
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
      await page.waitForTimeout(2500);
      await expect(page.locator('a[href*="/concierge"]')).toHaveCount(0);
      await expect(page.locator("[data-cta-ai]")).toHaveCount(0);
      await expect(page.locator('link[href*="/concierge"]')).toHaveCount(0);
      expect(hits, "keine Anfrage an /concierge").toEqual([]);
      // Die Leiste fällt auf zwei Spalten zurück.
      // QM-Endabnahme 02.11.2026 (bewusst geändert): zwei minmax(0,1fr)-Spalten statt grid-cols-2 (200-%-Zoom, QM shell-home r3).
      const bar = page.locator("nav[class*=\"grid-cols-[minmax(0,1fr)_minmax(0,1fr)]\"]").filter({ has: page.locator('a[href^="tel:"]') });
      await expect(bar).toHaveCount(1);
      await context.close();
    });
  }

  test("/api/labs/status: concierge folgt conciergeLive() (Mock ≠ verfügbar)", async ({ request }) => {
    const status = await (await request.get("/api/labs/status", SLOW)).json();
    const { mode } = await (await request.get("/api/labs/concierge", SLOW)).json();
    expect(status.concierge).toBe(mode === "live");
  });

  test("/de/concierge ohne Schlüssel: noindex", async ({ request }) => {
    test.skip(await conciergeOn(request), "Server mit echtem KI-Schlüssel");
    const html = await (await request.get("/de/concierge", SLOW)).text();
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });
});

// ------------------------------------------------------------ 3 Kontext
test.describe("Kontext: Architektin, Interior, Stadt", () => {
  test("St. Gallen → „Zusammenarbeit anfragen“ → Architekturbüro, Schritt 2 offen, Herkunft mit Stadt und Fachweg", async ({ page }) => {
    const sent = await mockPosts(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de/designermoebel-st-gallen", SLOW);
    await settle(page);
    await dismissCookies(page);
    const cta = page.getByRole("link", { name: "Zusammenarbeit anfragen" });
    await expect(cta).toHaveAttribute("href", "/de/beratung?rolle=architekt&ort=st-gallen");
    await page.goto("/de/beratung?rolle=architekt&ort=st-gallen", SLOW);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Architektur- und Planungsbüros");
    await expect(page.locator("[data-beratung-city]")).toContainText("St. Gallen");
    await expect(page.getByRole("radio", { name: /Architektur- oder Planungsbüros/ })).toBeChecked();
    await page.getByRole("button", { name: "Weiter" }).click();
    await expect(page.locator("#beratung-ort input:checked")).toHaveCount(0);
    await shot(page, "architektin-schritt2");
    const { box, body } = await finishWizard(page, sent, { message: "Villa am See, Einrichtung für unsere Bauherrschaft." });
    expect(body.bei_meiner_anfrage_geht_es_um).toBe("ein Projekt meines Architektur- oder Planungsbüros");
    expect(body.bitte_beschreiben_sie_ihr_vorhaben).toContain("Kontext: Stadtseite: St. Gallen · Fachweg: Architektur/Planung");
    expect(body.bitte_beschreiben_sie_ihr_vorhaben).not.toContain("Gesehen auf der Seite");
    await expect(box).toContainText("Stadtseite");
    await expect(box).toContainText("St. Gallen");
  });

  test("Interior Design: Termin-Knöpfe ohne „Neubau“-Vorwahl", async ({ page }) => {
    await mockPosts(page);
    await page.goto("/de/interior-design-vorarlberg", SLOW);
    await settle(page);
    const hrefs = await page.locator('main a[href^="/de/beratung"]').evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const h of hrefs) expect(h).not.toContain("thema=neubau");
    await page.goto("/de/beratung?thema=interior", SLOW);
    await settle(page);
    await expect(page.locator("#beratung-art input:checked")).toHaveCount(0);
  });

  test("Paar Bregenz (iPhone): Stadtzeile über Schritt 1, Freitext leer, Herkunft im Kontext", async ({ browser }) => {
    const context = await browser.newContext(IPHONE);
    const page = await context.newPage();
    const sent = await mockPosts(page);
    await page.goto("/de/beratung?ort=bregenz", SLOW);
    await settle(page);
    await dismissCookies(page);
    const line = page.locator("[data-beratung-city]");
    await expect(line).toHaveText("Ihre Anfrage von der Seite für Bregenz");
    await expect(line).toHaveAttribute("role", "status");
    await shot(page, "bregenz-iphone-schritt1");
    const { body } = await finishWizard(page, sent, { message: "Wohnzimmer und Essplatz für unsere Wohnung." });
    expect(body.bitte_beschreiben_sie_ihr_vorhaben.startsWith("Wohnzimmer und Essplatz")).toBe(true);
    expect(body.bitte_beschreiben_sie_ihr_vorhaben).toContain("Kontext: Stadtseite: Bregenz");
    await context.close();
  });
});

// ------------------------------------------------------------ 7 Footer, Merkliste
test("Footer auf /de/beratung?ort=bregenz: Termin-Links springen zum Formular, ?ort bleibt", async ({ page }) => {
  await mockPosts(page);
  await page.goto("/de/beratung?ort=bregenz", SLOW);
  await settle(page);
  await dismissCookies(page);
  const links = page.locator("footer [data-termin-link]");
  await expect(links).toHaveCount(2);
  // Online-Kalender (Inhaber Nr. 12, bewusst geändert): Das Footer-Band führt bei aktivem
  // Kalender auf /de/termin, der Spaltenlink springt weiter zum Formular.
  const hrefs = await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")));
  for (const h of hrefs) expect(h).toMatch(/^(#anfrage|\/de\/termin(\?ort=bregenz)?)$/);
  const jump = page.locator('footer [data-termin-link][href="#anfrage"]');
  await expect(jump).toHaveCount(hrefs.some((h) => h.startsWith("/de/termin")) ? 1 : 2);
  await jump.first().click();
  await expect(page).toHaveURL(/\/de\/beratung\?ort=bregenz#anfrage$/);
  await expect(page.locator("[data-beratung-city]")).toBeVisible();
});

test("Merkliste leer: Leerzustand im ersten Bildschirm, ohne Kopfbild, CLS 0", async ({ page }) => {
  await mockPosts(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const res = await page.request.get("/de/merkliste", SLOW);
  expect(await res.text()).toContain("Noch nichts gemerkt.");
  await page.goto("/de/merkliste", SLOW);
  await settle(page);
  await dismissCookies(page);
  const empty = page.getByText("Noch nichts gemerkt.");
  await expect(empty).toBeInViewport();
  await expect(page.locator('main img[src*="room"]')).toHaveCount(0);
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.01);
  await shot(page, "merkliste-leer-desktop");
});

// ------------------------------------------------------------ 5 Launcher
test.describe("Concierge-Launcher und „Privatsphäre-Einstellungen“", () => {
  test("Desktop: am Seitenende überdeckt der Launcher die Rechtszeile nicht", async ({ page }) => {
    test.skip(PROD && !(await conciergeOn(page.request)), "Launcher im Produktions-Build ohne Schlüssel aus");
    await mockPosts(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/de/news", SLOW);
    await settle(page);
    await dismissCookies(page);
    const launcher = page.locator("[data-concierge-launcher]");
    await expect(launcher).toBeVisible({ timeout: 60_000 });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1200);
    const privacy = page.getByRole("button", { name: "Privatsphäre-Einstellungen" });
    await expect(privacy).toBeInViewport();
    const a = await launcher.boundingBox();
    const b = await privacy.boundingBox();
    const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    expect(overlap, `Launcher ${JSON.stringify(a)} / Link ${JSON.stringify(b)}`).toBe(false);
    // Der Link ist tatsächlich klickbar (oberstes Element an seinem Mittelpunkt).
    const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.textContent?.trim(), { x: b.x + b.width / 2, y: b.y + b.height / 2 });
    expect(top).toBe("Privatsphäre-Einstellungen");
    await shot(page, "launcher-seitenende-desktop");
  });

  test("iPhone: am Seitenende ist „Privatsphäre-Einstellungen“ frei", async ({ browser }) => {
    const context = await browser.newContext(IPHONE);
    const page = await context.newPage();
    await mockPosts(page);
    await page.goto("/de/news", SLOW);
    await settle(page);
    await dismissCookies(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    const privacy = page.getByRole("button", { name: "Privatsphäre-Einstellungen" });
    await expect(privacy).toBeInViewport();
    const b = await privacy.boundingBox();
    const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.textContent?.trim(), { x: b.x + b.width / 2, y: b.y + b.height / 2 });
    expect(top).toBe("Privatsphäre-Einstellungen");
    await shot(page, "launcher-seitenende-iphone");
    await context.close();
  });
});

// ------------------------------------------------------------ 8 Personas
// r5-ux-conversion: alle Abläufe bis zur Bestätigung, POSTs gemockt.
const PERSONAS = [
  { name: "Bootseigner", device: PIXEL, start: "/de/yacht-interior", expect: "/de/beratung?thema=yacht", topic: "ein Yacht-Interieur" },
  { name: "Architektin", device: null, start: "/de/designermoebel-st-gallen", link: "Zusammenarbeit anfragen", expect: "/de/beratung?rolle=architekt&ort=st-gallen", topic: "ein Projekt meines Architektur- oder Planungsbüros" },
  { name: "Hotelier DE", device: null, start: "/de/beratung?thema=objekt", expect: "/de/beratung?thema=objekt", topic: "ein Objekt oder Hotel" },
  { name: "Hotelier IT", device: null, start: "/it/consulenza?thema=objekt", expect: "/it/consulenza?thema=objekt", it: true },
  { name: "Paar Bregenz", device: IPHONE, start: "/de/designermoebel-bregenz", expect: "/de/beratung?ort=bregenz" },
  { name: "Sofa", device: IPHONE, start: "/de/beratung?thema=sofa&planer=sofaplaner", expect: "/de/beratung?thema=sofa&planer=sofaplaner", topic: "ein Sofa" },
];

for (const p of PERSONAS) {
  test(`Persona ${p.name}: bis zur Bestätigung (POST gemockt)`, async ({ browser }) => {
    const context = await browser.newContext(p.device || { viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const sent = await mockPosts(page);
    await page.goto(p.start, SLOW);
    await settle(page);
    await dismissCookies(page);
    if (!p.start.includes("beratung") && !p.start.includes("consulenza")) {
      const link = p.link ? page.getByRole("link", { name: p.link }) : page.locator(`main a[href="${p.expect}"]`).first();
      await expect(link).toHaveAttribute("href", p.expect);
      await page.goto(p.expect, SLOW);
      await settle(page);
    }
    const { box, body } = await finishWizard(page, sent, { message: p.it ? "Arredo per dodici camere d’albergo." : "Wir möchten unser Wohnzimmer neu einrichten." });
    if (p.topic) expect(body.bei_meiner_anfrage_geht_es_um).toBe(p.topic);
    await expect(box).toHaveAttribute("data-contact-way", "email");
    if (p.it) await expect(box.locator("ol > li").first()).toContainText("Vi rispondiamo per e-mail");
    await shot(page, `persona-${p.name.toLowerCase().replace(/\s+/g, "-")}-bestaetigung`);
    await context.close();
  });
}
