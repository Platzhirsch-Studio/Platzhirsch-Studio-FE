// tests/e2e/pinterest-ideenboard.spec.js – „Merken auf Pinterest“ (Link ohne
// Skript, nur freigegebene Bilder) und Ideenboard (Sammeln, Notiz, Sortieren
// per Knopf, Teilen/Widerrufen, Termin-Übergabe, Pinterest-Export).
// Inhaber-Entscheidung Nr. 14. Projekt `desktop`; ein Block mit iPhone-Viewport.
// Teilen schreibt nur in den Dev-Speicher .data/ideenboard (nie ins Backoffice).
import { test, expect, devices } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { collectConsoleErrors, dismissCookieBanner, measureOverflow, robotsDirectives } from "./helpers.js";

const GALERIE = "/de/ezarri/galerie";
const BOARD = "/de/ideenboard";
const STIL = "/de/stil-finder/ergebnis/italienische-ruhe";

/** Alle Anfragen zu Pinterest mitschreiben (vor dem Klick darf keine kommen). */
function watchPinterest(page) {
  const hits = [];
  page.on("request", (r) => {
    if (/pinterest\.com|pinimg\.com/.test(r.url())) hits.push(r.url());
  });
  return hits;
}

test.describe("Pinterest – Merken-Link", () => {
  test("Ezarri-Galerie: Link mit url/media/description, neuer Tab, kein Pinterest-Request vor dem Klick", async ({ page }) => {
    const hits = watchPinterest(page);
    await page.goto(GALERIE);
    await dismissCookieBanner(page);
    const link = page.locator("a[data-pinterest-save]").first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    const u = new URL(href);
    expect(`${u.origin}${u.pathname}`).toBe("https://www.pinterest.com/pin/create/button/");
    expect(u.searchParams.get("media")).toMatch(/^https:\/\/platzhirsch\.studio\/ezarri\/.+-1600\.webp$/);
    expect(u.searchParams.get("url")).toMatch(/^https:\/\/platzhirsch\.studio\/de\/ezarri\//);
    // QA Technik P1-2: Anwendungsbild von Ezarri, Quelle immer am Ende
    expect(u.searchParams.get("description")).toMatch(/Anwendungsbild.* – Platzhirsch Lochau · Bild: Ezarri$/);
    expect(u.searchParams.get("description")).not.toMatch(/^Projekt mit/);
    expect(await link.getAttribute("target")).toBe("_blank");
    expect(await link.getAttribute("rel")).toContain("noopener");
    expect(await link.getAttribute("aria-label")).toMatch(/auf Pinterest merken/);
    await page.waitForTimeout(1000);
    expect(hits).toEqual([]);
    const scripts = await page.locator("script[src*='pinterest'], script[src*='pinit']").count();
    expect(scripts).toBe(0);
  });

  test("Stil-Finder: Pin-Bild ist die eigene Palettenkarte (2:3 PNG)", async ({ page, request }) => {
    await page.goto(STIL);
    const href = await page.locator("a[data-pinterest-save]").first().getAttribute("href");
    const media = new URL(href).searchParams.get("media");
    expect(media).toBe("https://platzhirsch.studio/stil-palette/italienische-ruhe.png");
    const png = await request.get("/stil-palette/italienische-ruhe.png", { timeout: 120_000 });
    expect(png.status()).toBe(200);
    expect(png.headers()["content-type"]).toBe("image/png");
  });

  test("Herstellerbilder: kein Merken-Link (Startseite Räume, Merkliste-Möbel)", async ({ page }) => {
    await page.goto("/de");
    await expect(page.locator("[data-room] a[data-pinterest-save]")).toHaveCount(0);
  });
});

test.describe("Ideenboard", () => {
  // Eigene Test-IP je Lauf: das Rate-Limit (10 Teilen-Links/Std. je IP, service.js)
  // soll wiederholte Läufe gegen denselben Dev-Server nicht ausbremsen.
  test.use({ extraHTTPHeaders: { "x-forwarded-for": `10.77.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` } });
  test("Seite noindex, leerer Zustand, axe ohne serious/critical", async ({ page, request }) => {
    const res = await request.get(BOARD, { timeout: 120_000 });
    expect(res.status()).toBe(200);
    const robots = robotsDirectives({ text: await res.text(), headers: res.headers() });
    expect(robots).toContain("noindex");
    await page.goto(BOARD);
    await dismissCookieBanner(page);
    await expect(page.locator("[data-ideenboard-empty]")).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => v.id)).toEqual([]);
  });

  test("Sammeln aus Galerie und Stil-Finder, Notiz, Sortieren per Knopf, Entfernen + Rückgängig", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto(GALERIE);
    await dismissCookieBanner(page);
    const add = page.locator("[data-ideenboard-add] button").first();
    await add.click();
    await expect(add).toHaveAttribute("aria-pressed", "true");
    await page.goto(STIL);
    await page.locator("[data-ideenboard-add] button").first().click();
    await page.goto(BOARD);
    const cards = page.locator("[data-ideenboard-cards] > li");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toHaveAttribute("data-card-type", "ezarri");
    await expect(cards.nth(1)).toHaveAttribute("data-card-type", "stil");
    // Ziehen nur am Griff (QA Technik P1-4): die Karte selbst ist nicht ziehbar
    expect(await cards.nth(0).getAttribute("draggable")).toBeNull();
    await expect(cards.nth(0).locator("[data-drag-handle]")).toHaveAttribute("draggable", "true");

    // Notiz wird beim Verlassen gespeichert und bleibt nach Neuladen
    const note = cards.nth(0).getByLabel("Notiz zur Karte");
    await note.fill("Für den Pool im Garten");
    await note.blur();
    await page.reload();
    await expect(page.locator("[data-ideenboard-cards] > li").nth(0).getByLabel("Notiz zur Karte")).toHaveValue("Für den Pool im Garten");

    // Tastatur-Alternative zum Ziehen (QA Technik P1-1): Stil-Karte nach vorn.
    // Sie landet am Anfang, „Nach vorn“ ist dann deaktiviert → Fokus auf
    // „Nach hinten“ derselben Karte, nie auf <body>.
    const focused = () => page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, move: el?.getAttribute("data-move") || null, remove: el?.hasAttribute("data-card-remove") || false, undo: el?.hasAttribute("data-ideenboard-undo") || false, card: el?.closest("[data-card-id]")?.getAttribute("data-card-type") || null };
    });
    const up = page.locator("[data-ideenboard-cards] > li").nth(1).locator("[data-move='up']");
    await up.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-ideenboard-cards] > li").nth(0)).toHaveAttribute("data-card-type", "stil");
    await expect(page.locator("[data-ideenboard-status]")).toContainText("Position 1 von 2");
    await expect.poll(focused).toEqual({ tag: "BUTTON", move: "down", remove: false, undo: false, card: "stil" });
    // und zurück ans Ende: Fokus auf „Nach vorn“
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-ideenboard-cards] > li").nth(1)).toHaveAttribute("data-card-type", "stil");
    await expect.poll(focused).toEqual({ tag: "BUTTON", move: "up", remove: false, undo: false, card: "stil" });
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-ideenboard-cards] > li").nth(0)).toHaveAttribute("data-card-type", "stil");

    // Entfernen per Tastatur → Fokus auf „Rückgängig“; Rückgängig → Fokus auf der Karte
    await page.locator("[data-ideenboard-cards] > li").nth(0).locator("[data-card-remove]").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-ideenboard-cards] > li")).toHaveCount(1);
    await expect.poll(focused).toMatchObject({ undo: true });
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-ideenboard-cards] > li")).toHaveCount(2);
    await expect.poll(focused).toMatchObject({ remove: true, card: "stil" });
    // Schließen-Knopf der Leiste ist übersetzt (kein „OK“)
    await expect(page.locator("button[aria-label='OK']")).toHaveCount(0);

    // Pinterest-Übernahme: Zähler, CSV-Download
    await expect(page.locator("[data-ideenboard-export]")).toContainText("2 von 2 Karten");
    const [download] = await Promise.all([page.waitForEvent("download"), page.locator("[data-ideenboard-csv]").click()]);
    expect(download.suggestedFilename()).toBe("ideenboard-pinterest.csv");
    await expect(page.locator("[data-ideenboard-rights]")).toContainText("Bitte Link und Quelle");
    expect(errors.filter((e) => !/Failed to load resource|favicon/.test(e))).toEqual([]);
  });

  test("Merkliste holen: Möbel-Karte mit Herstellerbild ohne Pinterest-Link", async ({ page }) => {
    await page.goto(BOARD);
    await dismissCookieBanner(page);
    await page.evaluate(() =>
      localStorage.setItem("cart", JSON.stringify([{ id: "x1", name: "Andersen Sofa", category: "Minotti", href: "/produkte/sofas-couches/andersen", image: "/cmx/files/minotti-andersen.webp", quantity: 1 }]))
    );
    await page.reload();
    await page.locator("[data-ideenboard-import]").click();
    const card = page.locator("[data-ideenboard-cards] > li[data-card-type='moebel']");
    await expect(card).toHaveCount(1);
    await expect(card.locator("a[data-pinterest-save]")).toHaveCount(0);
    await expect(card.locator("[data-card-nopin]")).toBeVisible();
    await expect(card.getByRole("link", { name: "Andersen Sofa" })).toHaveAttribute("href", "/de/produkte/sofas-couches/andersen");
  });

  test("Teilen, fremd ansehen, Termin ohne falsches Versprechen, Widerrufen → 404", async ({ page, browser }) => {
    await page.goto(GALERIE);
    await dismissCookieBanner(page);
    await page.locator("[data-ideenboard-add] button").first().click();
    await page.goto(BOARD);
    await page.locator("[data-ideenboard-share-create]").click();
    const urlField = page.locator("[data-ideenboard-share-url]");
    await expect(urlField).toHaveValue(/\/de\/ideenboard\/[A-Za-z0-9_-]{32}$/);
    const shareUrl = await urlField.inputValue();
    const sharePath = new URL(shareUrl).pathname;

    const other = await browser.newContext();
    const p2 = await other.newPage();
    const res = await p2.goto(sharePath);
    expect(res.status()).toBe(200);
    await expect(p2.locator("[data-ideenboard-shared] li")).toHaveCount(1);
    expect(await p2.locator("meta[name='referrer']").getAttribute("content")).toBe("no-referrer");
    expect(robotsDirectives({ text: await p2.content(), headers: res.headers() })).toContain("noindex");
    const api = await p2.request.get(`/api/ideenboard/shared/${sharePath.split("/").pop()}`);
    expect(api.status()).toBe(200);
    const body = await api.json();
    expect(JSON.stringify(body)).not.toMatch(/shareHash|adminHash|boardId/);

    // Rat 9,5 B2 (bewusst umgedreht, Auftrag T1 → T5): /termin und /beratung lesen
    // ?ideenboard= jetzt → „Termin mit Ideenboard“ statt „Link kopieren“ (im Dev ist
    // Teilen verfügbar). Der Klick erzeugt einen Teilen-Link, deshalb hier nur sichtbar.
    await expect(page.locator("[data-ideenboard-termin-cta]")).toHaveCount(1);
    await expect(page.locator("[data-ideenboard-termin-cta]")).toBeVisible();
    await expect(page.locator("[data-ideenboard-termin-link]")).toHaveCount(0);

    // Widerrufen → geteilte Seite 404
    await page.goto(BOARD);
    await page.locator("[data-ideenboard-revoke]").click();
    await expect(page.locator("[data-ideenboard-share-create]")).toBeVisible();
    const gone = await p2.goto(sharePath);
    expect(gone.status()).toBe(404);
    await other.close();
  });

  test("API: fremde Herkunft abgewiesen, leeres Board abgewiesen", async ({ request }) => {
    const cross = await request.post("/api/ideenboard", { data: { board: { cards: [{ type: "notiz", note: "x" }] } }, headers: { origin: "https://evil.example" } });
    expect(cross.status()).toBe(403);
    const empty = await request.post("/api/ideenboard", { data: { board: { cards: [] } } });
    expect(empty.status()).toBe(400);
    const bad = await request.post("/api/ideenboard/manage", { data: { token: "x", action: "delete" } });
    expect(bad.status()).toBe(404);
  });
});

test.describe("Ideenboard – Wege dorthin", () => {
  test("Kopfzeile (Desktop) und Merkliste verlinken das Ideenboard", async ({ page }) => {
    await page.goto("/de/merkliste");
    await dismissCookieBanner(page);
    await expect(page.locator("header [data-ideenboard-nav]")).toBeVisible();
    await expect(page.locator("header [data-ideenboard-nav]")).toHaveAttribute("href", "/de/ideenboard");
    await expect(page.locator("main [data-ideenboard-nav]")).toHaveAttribute("href", "/de/ideenboard");
  });
});

test.describe("Ideenboard – iPhone", () => {
  test.use({ viewport: devices["iPhone 15 Pro"].viewport, isMobile: true, hasTouch: true, userAgent: devices["iPhone 15 Pro"].userAgent });
  test("kein Überlauf, Knöpfe ≥ 44 px", async ({ page }) => {
    await page.goto(GALERIE);
    await dismissCookieBanner(page);
    await page.locator("[data-ideenboard-add] button").first().click();
    await page.goto(BOARD);
    await expect(page.locator("[data-ideenboard-cards] > li")).toHaveCount(1);
    const overflow = await measureOverflow(page);
    expect(overflow.sw).toBeLessThanOrEqual(overflow.vw + 1);
    expect(overflow.wide).toEqual([]);
    for (const sel of ["[data-move='up']", "[data-move='down']", "[data-card-remove]"]) {
      const box = await page.locator(sel).first().boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
