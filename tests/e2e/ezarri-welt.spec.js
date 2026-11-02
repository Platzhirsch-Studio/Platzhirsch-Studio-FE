// tests/e2e/ezarri-welt.spec.js – Team A „Ezarri-Welt & Sortiment“, Desktop.
// Interaktion: Filter (URL-Zustand), Vergleich, Merken, Detailseite, Galerie-Lightbox,
// Schalter EZARRI_PUBLIC=true (indexierbar, seit Integration 28.10.2026), andere Sprachen 404, kein Formular-Versand.
// Run: PW_WORKERS=1 npx playwright test tests/e2e/ezarri-welt.spec.js --project=desktop
import { test, expect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers.js";

const noHorizontalScroll = async (page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);

test.beforeEach(async ({ page }) => {
  // Nie etwas absenden: jede API-Anfrage außer Analytics wäre ein Fehler.
  await page.route("**/api/**", (route) => route.abort());
});

// Integration 28.10.2026 (Inhaber-Entscheidung Nr. 7 + 9): EZARRI_PUBLIC = true → indexierbar, Händler-Aussage sichtbar.
test("Startseite: H1, indexierbar (Schalter an), lokale Navigation, eine Walnut-Fläche, kein Querscroll", async ({ page }) => {
  const res = await page.goto("/de/ezarri");
  expect(res.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toContainText("Glasmosaik für Pool und Bad"); // Rat 9,5 A7 (bewusst geändert): kürzere Hero-H1, mobil ≤ 2 Zeilen
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index, follow/);
  await expect(page.getByRole("navigation", { name: "Ezarri-Glasmosaik" }).getByRole("link", { name: "Übersicht" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('[data-surface="inverse"]')).toHaveCount(1);
  await expect(page.getByText("Platzhirsch Home Living ist Vertragshändler von Ezarri.").first()).toBeVisible();
  await expect(page.getByText("Bild: Ezarri, ezarri.com").first()).toBeVisible();
  await noHorizontalScroll(page);
});

// R7-P4 (bewusst geändert): Seit Runde 2 leitet die Shell EN/FR/IT-Ezarri-URLs per 308 auf die
// deutsche Seite (?lang=…) statt 404.
// Team Grün 30.10.2026 (begründet angepasst): Seit Welle 2 (Inhaber-Entscheidung 13) ist /en/ezarri
// eine eigene englische Seite (200, lang="en", siehe r7-p6-release.spec.js). Die Umleitungsprüfung
// gilt daher für FR und IT; EN wird ausdrücklich als eigene Seite geprüft.
// Sprach-Integration 01.11.2026 (bewusst geändert): die Welt gibt es auch FR/IT (eigene
// Seite, 200, lang); nur Custom Mix und Anfrage leiten FR/IT per 308 auf /en (deOnlyRedirects.cjs).
// Hinweis: next.config.js redirects() lädt die Liste erst nach einem Neustart des Servers.
test("EN/FR/IT eigene Seite; Custom Mix FR/IT → 308 auf Englisch", async ({ request }) => {
  for (const loc of ["en", "fr", "it"]) {
    const res = await request.get(`/${loc}/ezarri`, { maxRedirects: 0 });
    expect(res.status(), `/${loc}/ezarri`).toBe(200);
    expect(await res.text()).toMatch(new RegExp(`<html[^>]*\\blang="${loc}"`));
  }
  const mix = await request.get("/fr/ezarri/custom-mix", { maxRedirects: 0 });
  expect(mix.status()).toBe(308);
  expect(mix.headers().location || "").toMatch(/\/en\/ezarri\/custom-mix\?lang=fr/);
});

test("Mosaik-Übersicht: Filter schreibt die URL, Trefferzahl ändert sich, Vergleich bis zur Tabelle", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike");
  await page.evaluate(() => localStorage.removeItem("ezarri-vergleich"));
  await page.reload();
  await dismissCookieBanner(page); // erscheint nach der Hydration: zugleich Signal, dass die Inseln bereit sind
  const count = page.locator('p[aria-live="polite"]').first();
  const before = await count.textContent();
  await page.getByRole("group", { name: "Wasserwirkung" }).getByText("Türkisblau").click();
  await expect(page).toHaveURL(/wasser=tuerkisblau/);
  await expect(count).not.toHaveText(before);
  const n = Number((await count.textContent()).match(/\d+/)[0]);
  expect(n).toBeGreaterThan(5);
  expect(n).toBeLessThan(60);

  const compare = page.getByRole("button", { name: /^Vergleichen/ });
  await compare.nth(0).click();
  await compare.nth(0).click(); // der erste ist jetzt „Im Vergleich“, also wieder der nächste freie
  const bar = page.getByRole("region", { name: "Vergleich (2)" });
  await expect(bar).toBeVisible();
  await bar.getByRole("link", { name: "Vergleich ansehen" }).click();
  // Dev-Server kompiliert die Vergleichsseite beim ersten Aufruf → großzügige Frist.
  await expect(page).toHaveURL(/\/de\/ezarri\/mosaike\/vergleich\?ids=[^,]+,[^,]+$/, { timeout: 120_000 });
  await expect(page.locator("table thead th")).toHaveCount(2);
  // Desktop: Tabelle; die Merkmal-Zeilen für Handys (unter sm) sind hier ausgeblendet.
  await expect(page.locator("table").getByText("Wasserwirkung").first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("Mosaik-Übersicht ohne JS-Zustand: Server rendert Filter aus der URL, „Weitere laden“ ist ein echter Link", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike?bild=pool-privat&format=25mm");
  await expect(page.getByRole("group", { name: "Projektbild aus" }).getByRole("checkbox", { name: /Privatpool/ })).toBeChecked();
  const more = page.getByRole("link", { name: /^Weitere \d+ laden$/ });
  await expect(more).toHaveAttribute("href", /seite=2/);
  await more.click();
  await expect(page.locator("main article")).toHaveCount(48);
});

test("Merken legt das Mosaik in die bestehende Merkliste (CartContext, localStorage)", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike/dune");
  await page.evaluate(() => localStorage.removeItem("cart"));
  await page.reload();
  await dismissCookieBanner(page); // erscheint nach der Hydration: zugleich Signal, dass die Inseln bereit sind
  const merken = page.getByRole("button", { name: "Merken", exact: true });
  await merken.click();
  await expect(page.getByRole("button", { name: "Gemerkt" })).toHaveAttribute("aria-pressed", "true");
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]"));
  expect(cart.some((x) => x.id === "ezarri-dune" && x.href === "/ezarri/mosaike/dune")).toBe(true);
});

test("Detailseite: H1, Preis auf Anfrage, Ausführungen, Musteranfrage-Link, canonical der Safe-Variante", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike/dune");
  // R4 seo P1-2 (bewusst geändert): H1 nennt Marke, Art und Kollektion (mosaikHeading in src/lib/ezarri/indexierung.js)
  await expect(page.locator("h1")).toHaveText("Ezarri Mosaik Dune 25 · Kollektion Gea");
  await expect(page.getByText("Preis auf Anfrage")).toBeVisible();
  await expect(page.getByRole("link", { name: /^50\s?mm$/ }).first()).toHaveAttribute("href", "/de/ezarri/mosaike/dune-50");
  // Der erste „Muster anfragen“ ist der allgemeine in der lokalen Navigation; der Knopf der Detailseite trägt ref=dune.
  await expect(page.locator('main a[href^="/de/ezarri/anfrage?art=muster&ref=dune"]').first()).toHaveText(/Muster anfragen/);
  await expect(page.getByRole("img", { name: /Mosaikblatt .* Steinen/ })).toBeVisible();
  await page.goto("/de/ezarri/mosaike/2502-a-safe");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://platzhirsch.studio/de/ezarri/mosaike/2502-a");
});

test("Galerie: Filter per URL, Lightbox öffnet, Pfeiltaste blättert, Esc schließt", async ({ page }) => {
  await page.goto("/de/ezarri/galerie?einsatz=wellness");
  await dismissCookieBanner(page);
  await expect(page.getByRole("checkbox", { name: "Wellness und Spa" })).toBeChecked();
  const first = page.getByRole("button", { name: /^Bild groß ansehen/ }).first();
  await first.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/^1 \/ \d+$/)).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByText(/^2 \/ \d+$/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(first).toBeFocused();
  const next = page.getByRole("link", { name: "Nächste Seite" });
  await expect(next).toHaveAttribute("href", /seite=2/);
});

test("Technik: Verlegung schaltet den Beckentyp ohne JS-Insel um, Downloads liefern PDFs", async ({ page, request }) => {
  await page.goto("/de/ezarri/technik/verlegung");
  await expect(page.getByRole("heading", { name: "Beton", level: 2 })).toBeVisible();
  await page.getByRole("radio", { name: /Polyester/ }).check();
  await expect(page.getByRole("heading", { name: "Polyester", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Beton", level: 2 })).toBeHidden();
  await page.goto("/de/ezarri/technik/downloads");
  const hrefs = await page.locator('a[type="application/pdf"]').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThanOrEqual(19);
  const res = await request.head(hrefs[0]);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("pdf");
});

// ---------------------------------------------------------------------------
// QM Runde 1 (qa-screenshots/ezarri/welt/feedback-1.md)

test("Übersicht: fünf verschiedene Kachelbilder, keine leere Kachel, Zahlen getrennt nach Eignung und Projektbild (QM P1-2, P1-3)", async ({ page }) => {
  await page.goto("/de/ezarri");
  const tiles = page.locator('section[aria-labelledby="ez-weiche"] li');
  await expect(tiles).toHaveCount(5);
  const srcs = await tiles.locator("img").evaluateAll((imgs) => imgs.map((i) => i.currentSrc || i.getAttribute("src")));
  expect(srcs.length).toBe(5);
  expect(new Set(srcs).size).toBe(5);
  expect(srcs.some((src) => /celestite/.test(src))).toBe(false);
  const alts = await tiles.locator("img").evaluateAll((imgs) => imgs.map((i) => i.alt));
  expect(new Set(alts).size).toBe(5);
  await expect(tiles.filter({ hasText: "Bad" }).first()).toContainText(/\d{3} Mosaike geeignet(?: · |\s*)\d+ mit Projektbild/); // QM r1: Teile als eigene Zeilen ohne Trennpunkt (bewusst geändert)
  await expect(page.locator("header").getByText(/281 Mosaike in 17 Kollektionen/)).toBeVisible();
});

test("Einsatz-Welt Bad: ehrliche Zahlen, Link auf alle geeigneten und auf die mit Projektbild (QM P1-3)", async ({ page }) => {
  await page.goto("/de/ezarri/bad");
  const all = page.getByRole("link", { name: /^Alle \d+ geeigneten Mosaike/ });
  await expect(all).toHaveAttribute("href", /einsatz=bad/);
  expect(Number((await all.textContent()).match(/\d+/)[0])).toBeGreaterThan(200);
  await expect(page.getByRole("link", { name: /^\d+ davon mit Ezarri-Projektbild$/ })).toHaveAttribute("href", /bild=bad/);
});

test("Mosaik-Übersicht: erste Karte im ersten Bildschirm, Standard „Empfohlen“ ohne Code-Namen vorn, ?sort im URL-Zustand (QM P2-1, P2-2, P2-5)", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike");
  await dismissCookieBanner(page);
  const first = page.locator("main article").first();
  expect(await first.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(900);
  await expect(page.locator('p[aria-live="polite"]').first()).toContainText(/^281 Mosaike · 121 Safe-Steps und Formstücke/);
  const names = await page.locator("main article h3").allTextContents();
  expect(names.slice(0, 8).every((n) => !/^\d/.test(n.trim()))).toBe(true);
  await page.getByLabel("Sortierung").selectOption("name");
  await expect(page).toHaveURL(/sort=name/);
});

test("Detail und Karte: Format der Referenz selbst, Einsatz ohne Dopplung (QM P2-4, P1-3)", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike/basalt-50");
  const facts = page.locator("dl").filter({ hasText: "Format" }).first();
  await expect(facts.locator("dt", { hasText: /^Format$/ }).locator("xpath=following-sibling::dd[1]")).toHaveText("50 mm");
  await page.goto("/de/ezarri/mosaike/dune");
  const einsatz = page.locator("dt", { hasText: /^Einsatz$/ }).locator("xpath=following-sibling::dd[1]");
  await expect(einsatz).not.toContainText("Wand innen,");
});

for (const width of [834, 1024]) {
  test(`Lokale Navigation bei ${width} px: jeder Punkt erreichbar, nichts verdeckt (QM P2-7)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/de/ezarri/galerie");
    const nav = page.getByRole("navigation", { name: "Ezarri-Glasmosaik" });
    const links = nav.getByRole("listitem").getByRole("link");
    const n = await links.count();
    expect(n).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < n; i++) {
      const link = links.nth(i);
      await link.scrollIntoViewIfNeeded();
      const free = await link.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      });
      expect(free, await link.textContent()).toBe(true);
    }
  });
}

// ---------------------------------------------------------------------------
// QM Runde 2 (qa-screenshots/ezarri/welt/feedback-2.md)

test("QM2 P2-1: Karte zeigt Mosaikfarbe und sichtbar „Im Wasser“", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike?q=daikiri");
  const card = page.locator("main article").filter({ has: page.getByRole("link", { name: "Daikiri 25", exact: true }) }).first();
  await expect(card).toContainText("Rosa");
  await expect(card.getByText(/^Im Wasser:/)).toBeVisible();
});

test("QM2 P2-2: Detailseite Daikiri zeigt die Mischung laut Ezarri mit Links und Konfigurator-Knopf", async ({ page }) => {
  await page.goto("/de/ezarri/mosaike/daikiri");
  const mix = page.locator('section[aria-labelledby="ez-mischung"]');
  await expect(mix.getByRole("heading", { name: "Mischung laut Ezarri" })).toBeVisible();
  await expect(mix).toContainText(/Kilauea[\s\S]*50\s%/);
  await expect(mix.getByRole("link", { name: "Perla 25" })).toHaveAttribute("href", /\/ezarri\/mosaike\/perla$/);
  await expect(mix.getByRole("img", { name: /Kilauea 50\s%, Perla 40\s%, Oxido 10\s%/ })).toBeVisible();
  await expect(mix.getByRole("link", { name: /Mischung im Konfigurator/ })).toHaveAttribute("href", /\/ezarri\/konfigurator\?/);
  await expect(page.locator("dd", { hasText: "Im Konfigurator nur als fertige Mischung wählbar" })).toHaveCount(1);
  await expect(page.getByText("nur allein darstellbar")).toHaveCount(0);
  // Rezept, dessen Einzelfarben alle mischbar sind → Konfigurator startet mit den Anteilen
  await page.goto("/de/ezarri/mosaike/blue-lagoon");
  await expect(page.locator('section[aria-labelledby="ez-mischung"]').getByRole("link", { name: "Diese Mischung im Konfigurator" })).toHaveAttribute("href", /m?k=/);
});

test("QM2 P2-3: Übersicht nennt genau eine Kollektionszahl", async ({ page }) => {
  await page.goto("/de/ezarri");
  const text = await page.locator("main").innerText();
  // QM-Endabnahme 02.11.2026 (bewusst geändert): geschütztes Leerzeichen zwischen Zahl und Wort.
  const zahlen = [...text.matchAll(/(\d+)[   ]Kollektionen/g)].map((m) => m[1]);
  expect(zahlen.length).toBeGreaterThanOrEqual(2);
  expect(new Set(zahlen).size).toBe(1);
  await expect(page.getByRole("heading", { name: "17 Kollektionen und 4 Sonderanfertigungen" })).toBeVisible();
});

test("QM2 P2-4: Galerie – Bild im ersten Bildschirm, Chip wirkt sofort, Küche ohne Videos, kurze Bildunterschrift", async ({ page }) => {
  await page.goto("/de/ezarri/galerie");
  await dismissCookieBanner(page);
  const firstImg = page.getByRole("button", { name: /^Bild groß ansehen/ }).first();
  expect(await firstImg.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(await page.evaluate(() => window.innerHeight));
  await expect(page.getByRole("button", { name: "Filter anwenden" })).toHaveCount(0);
  await page.getByRole("group", { name: "Einsatz" }).getByText("Küche").click();
  await expect(page).toHaveURL(/einsatz=kueche/);
  await expect(page.getByRole("checkbox", { name: /Küche/ })).toBeChecked();
  await expect(page.locator('main a[href*="youtube"]')).toHaveCount(0);
  await expect(page.locator("#ez-videos")).toHaveCount(0);
  const caption = page.locator("main ul li p").filter({ hasText: /^Mosaik: / }).first();
  await expect(caption).toBeVisible();
  await expect(page.getByText("Projekt mit Ezarri-Mosaik · Bild: Ezarri")).toHaveCount(0);
  // ohne Einsatz-Filter: Videos in eigenem Abschnitt
  await page.goto("/de/ezarri/galerie");
  await expect(page.locator("#ez-videos")).toContainText("Produktvideos von Ezarri");
});
