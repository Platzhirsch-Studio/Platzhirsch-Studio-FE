// Barrierefreiheit und Tastatur – Bereich Zentrale (Team Q4, MASTER § 2.I, § 5.5; Befunde in
// Marktresearch/digital/backoffice/4x-qa-zentrale.md). Läuft gegen den Dev-Server im Mock-Modus.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/a11y-zentrale.spec.js --project=desktop
//
// Teil A  axe (WCAG 2.2 AA, serious/critical = 0, Q-I1) je Route der Zentrale, hell und dunkel.
// Teil B  Rollenvarianten der Startseite (GF, Mitarbeiterin, Kanzlei, Selbstservice) hell/dunkel.
// Teil C  Tastatur-Durchläufe der Top-Aufgaben (10-konzept-zentrale § 1) mit Klick-/Tastenzählung (Z-41).
// Teil D  Reflow 320 px (WCAG 1.4.10), Fokus nie unter der Kopfzeile (WCAG 2.4.11), reduzierte Bewegung.
// Bekannte Lücken stehen als test.fail mit Befundnummer: wird die Lücke geschlossen, meldet Playwright
// „expected to fail“ – dann die Markierung entfernen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SCHEMATA = ["light", "dark"];

// Routen der Zentrale (tools/qa/routen/zentrale.mjs ohne Bausteine-Demos des Fundaments).
const ROUTEN = [
  "/",
  "/arbeitsplatz",
  "/aufgaben",
  "/aufgaben?ansicht=karten",
  "/aufgaben/PH-AUF-2026-00001",
  "/benachrichtigungen",
  "/suche?q=muster",
  "/verwaltung",
  "/einstellungen",
  "/einstellungen?tab=allgemein",
  "/einstellungen?tab=website",
  "/einstellungen?tab=kalender",
  "/einstellungen?tab=kalkulation",
  "/einstellungen?tab=microsoft",
  "/einstellungen?tab=ablage",
  "/benutzer",
  "/protokoll",
  "/geraete",
  "/geraet",
  "/druck",
  "/druck?tab=formate",
  "/wechsel",
];

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

async function axeSchwer(page) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal").analyze();
  return r.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

async function ruhig(page) {
  // Kein „networkidle“: die Shell hält einen Ereignisstrom (SSE) offen, das Netz wird nie still.
  await page.waitForLoadState("load", { timeout: 30_000 }).catch(() => {});
  // Hochzählende Zahlen und Einblendungen (≤ 600 ms) abwarten, damit axe Endfarben misst.
  await page.waitForTimeout(800);
}

/** Pro Route hell und dunkel, Ergebnis gesammelt (soft), damit ein Lauf alle Verstöße zeigt. */
async function pruefeRoute(page, pfad) {
  for (const schema of SCHEMATA) {
    await page.emulateMedia({ colorScheme: schema });
    const antwort = await page.goto(pfad);
    expect.soft(antwort?.status() ?? 0, `HTTP ${pfad}`).toBeLessThan(400);
    await ruhig(page);
    expect.soft(await axeSchwer(page), `axe ${pfad} · ${schema}`).toEqual([]);
  }
}

// ------------------------------------------------------------------------------------------ Teil A
test.describe("A11y Zentrale – axe je Route, hell und dunkel (Q-I1)", () => {
  // Jede Route meldet sich selbst an (kein beforeAll): ein Fehlschlag startet sonst den Worker neu und
  // überspringt die übrigen Routen.
  test("Anmeldung ohne Sitzung", async ({ page }) => {
    await pruefeRoute(page, "/login");
  });

  for (const pfad of ROUTEN) {
    test(`Admin ${pfad}`, async ({ page }) => {
      await anmelden(page, "admin@demo.local");
      await pruefeRoute(page, pfad);
    });
  }
});

// ------------------------------------------------------------------------------------------ Teil B
test.describe("A11y Zentrale – Rollenvarianten der Startseite (DoD 6.2)", () => {
  for (const [rolle, email] of [
    ["GF", "gf@demo.local"],
    ["Mitarbeiterin Marketing", "marketing@demo.local"],
    ["Kanzlei extern", "buchhaltung@demo.local"],
    ["Selbstservice", "selbst@demo.local"],
  ]) {
    test(`${rolle}: / hell und dunkel`, async ({ page }) => {
      await anmelden(page, email);
      await pruefeRoute(page, "/");
      await expect(page.locator("h1")).toHaveCount(1);
    });
  }
});

// ------------------------------------------------------------------------------------------ Teil C
test.describe("Tastatur – Top-Aufgaben der Zentrale (Z-41, Q-F)", () => {
  test("Sprunglink ist erster Tabstopp und führt in den Inhalt", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.keyboard.press("Tab");
    const erster = page.locator(":focus");
    await expect(erster).toHaveText(/Zum Inhalt springen/);
    await expect(erster).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#bo-inhalt")).toBeFocused();
  });

  test("Was ist heute dran? – 0 Klicks: Heute-Leiste und Aufgaben im ersten Bildschirm (1440×900 und iPad hoch 820×1180)", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    for (const vp of [{ width: 1440, height: 900 }, { width: 820, height: 1180 }]) {
      await page.setViewportSize(vp);
      await page.goto("/");
      await ruhig(page);
      await expect(page.getByTestId("heute-leiste")).toBeInViewport();
      const aufgaben = page.locator('[data-kachel="aufgaben"]');
      await expect(aufgaben, `Aufgaben-Kachel sichtbar bei ${vp.width}×${vp.height}`).toBeVisible();
      const box = await aufgaben.boundingBox();
      test.info().annotations.push({ type: "messung", description: `Aufgaben-Kachel oben bei ${Math.round(box.y)} px (Bildschirm ${vp.height} px, ${vp.width} breit)` });
      expect.soft(box.y, `Aufgaben-Kachel beginnt im ersten Bildschirm bei ${vp.width}×${vp.height}`).toBeLessThan(vp.height);
    }
  });

  test("Datensatz öffnen – 1 K: Strg+K, Nummer, Enter", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.keyboard.press("Control+k");
    const eingabe = page.getByTestId("palette-eingabe");
    await expect(eingabe).toBeFocused();
    await eingabe.pressSequentially("PH-AUF-2026-00001", { delay: 30 });
    await expect(page.getByRole("option").filter({ hasText: "PH-AUF-2026-00001" }).first()).toBeVisible({ timeout: 30_000 });
    // Kurz warten: Enter direkt beim Erscheinen der Treffer öffnete im Lauf vom 04.11. nichts (Befund QZ-09, Enter-Puffer § 3.3).
    await page.waitForTimeout(600);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/PH-AUF-2026-00001/, { timeout: 30_000 });
  });

  test("Aufgabe erledigen – 1: Häkchen per Tastatur (Tab bis zur Zeile, Leertaste), Rückgängig per Knopf", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    const haken = page.locator('[data-kachel="aufgaben"] [data-testid="aufgabe-haken"]').first();
    await expect(haken).toBeVisible();
    // Tab-Weg ab Seitenanfang zählen (Information für die Befundtabelle, Ziel: erreichbar)
    let tabs = 0;
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    for (; tabs < 80; tabs++) {
      if (await haken.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    test.info().annotations.push({ type: "messung", description: `Tab-Schritte bis zum ersten Aufgaben-Häkchen: ${tabs}` });
    expect(tabs, "Häkchen per Tab erreichbar").toBeLessThan(80);
    // Fokusring sichtbar
    const ring = await haken.evaluate((el) => {
      const s = getComputedStyle(el);
      return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
    });
    expect(ring, "Häkchen hat sichtbaren Fokusring").toBe(true);
    const zeile = haken.locator('xpath=ancestor::*[@data-testid="aufgabe-zeile"][1]');
    const titel = (await zeile.innerText()).split("\n")[0].trim();
    await page.keyboard.press("Space");
    await expect(page.locator('[data-testid="aufgabe-zeile"][data-erledigt]').filter({ hasText: titel }).first()).toBeVisible();
    // Statusmeldung für Screenreader (Q-I6)
    await expect(page.locator('[aria-live="polite"], [role="status"]').filter({ hasText: /erledigt/i }).first()).toBeAttached();
    await page.getByRole("button", { name: "Rückgängig" }).first().click();
    await expect(page.locator('[data-testid="aufgabe-zeile"]:not([data-erledigt])').filter({ hasText: titel }).first()).toBeVisible({ timeout: 10_000 });
  });

  test("Aufgabe hinzufügen per Umschalt+A fokussiert die Schnellanlage (Zentrale-Kürzel) – Befund QZ-08", async ({ page }) => {
    test.fail(true, "QZ-08: Umschalt+A/Umschalt+L der Zentrale wirken nicht (Kontext „zentrale“ nicht aktiv)");
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("Shift+A");
    await expect(page.getByTestId("aufgabe-schnellanlage-feld").first()).toBeFocused();
    await page.keyboard.press("Escape");
  });

  test("Alle Kürzel – 1: Strg+/ öffnet den Dialog, Esc schließt, Fokus kehrt zurück", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("Control+/");
    const dialog = page.getByTestId("kuerzel-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Zentrale|Kacheln neu laden/).first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("Hilfe zur Seite – 1: Taste ? öffnet das Hilfe-Panel", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("?");
    await expect(page.getByTestId("hilfe-panel")).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("hilfe-panel")).toBeHidden();
  });

  test("Benachrichtigung lesen – 2: Glocke per Tastatur, Pfeil, Enter", async ({ page }) => {
    await anmelden(page, "crm@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.getByTestId("glocke").focus();
    await page.keyboard.press("Enter");
    const panel = page.getByTestId("glocke-panel");
    await expect(panel).toBeVisible();
    const eintraege = panel.locator('[role="listitem"] a');
    const anzahl = await eintraege.count();
    test.info().annotations.push({ type: "messung", description: `Glocke „Für mich“: ${anzahl} verlinkte Einträge` });
    if (anzahl > 0) {
      const vorher = page.url();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect.poll(() => page.url(), { timeout: 30_000 }).not.toBe(vorher);
    } else {
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    }
  });

  test("Hell/Dunkel – 2: Benutzermenü per Tastatur, Segment Dunkel", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.getByTestId("benutzer-menu").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("thema-dunkel").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByTestId("thema-system").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /./);
  });

  test("Testmodus schalten – 4: Verwaltung → Einstellungen → Schalter → Rückfrage (ohne Bestätigen)", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/verwaltung"]').first().click();
    klicks++;
    await page.waitForURL(/\/verwaltung/, { timeout: 60_000 });
    await page.getByTestId("verwaltung-hub").locator('a[href^="/einstellungen"]').first().click();
    klicks++;
    await page.waitForURL(/\/einstellungen/, { timeout: 60_000 });
    await expect(page.getByTestId("einstellungen-reiter")).toBeVisible({ timeout: 30_000 });
    // Konzept: Reiter „Allgemein“ vorausgewählt oder Schalter direkt erreichbar
    if (!(await page.getByTestId("schalter-testmodus-knopf").isVisible())) {
      await page.getByTestId("reiter-allgemein").click();
      await page.waitForURL(/tab=allgemein/, { timeout: 60_000 });
      klicks++;
    }
    await page.getByTestId("schalter-testmodus-knopf").click();
    klicks++;
    const frage = page.getByRole("alertdialog");
    await expect(frage).toBeVisible();
    await expect(frage.getByRole("button", { name: "Abbrechen" })).toBeVisible();
    const gesamt = klicks + 1; // + Bestätigen
    test.info().annotations.push({ type: "klickzahl", description: `Testmodus schalten: ${gesamt} (Ziel 4)` });
    await frage.getByRole("button", { name: "Abbrechen" }).click();
    expect.soft(gesamt, "Klickzahl Testmodus (Ziel 4)").toBeLessThanOrEqual(4);
  });

  test("Schließtag eintragen – 6: Verwaltung → Einstellungen → Kalender → + Tag → Datum → Speichern (ohne Speichern)", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/verwaltung"]').first().click();
    klicks++;
    await page.waitForURL(/\/verwaltung/, { timeout: 60_000 });
    await page.getByTestId("verwaltung-hub").locator('a[href^="/einstellungen"]').first().click();
    klicks++;
    await page.waitForURL(/\/einstellungen/, { timeout: 60_000 });
    await page.getByTestId("reiter-kalender").click();
    klicks++;
    await page.waitForURL(/tab=kalender/, { timeout: 60_000 });
    await page.getByTestId("schliesstag-neu").click();
    klicks++;
    await expect(page.getByLabel(/Datum Zeile/).last()).toBeVisible();
    const gesamt = klicks + 2; // Datum wählen + Speichern
    test.info().annotations.push({ type: "klickzahl", description: `Schließtag eintragen: ${gesamt} (Ziel 6)` });
    expect.soft(gesamt).toBeLessThanOrEqual(6);
  });

  test("Arbeitsplatz-Wahl mit Taste 1–5 (DoD 6.2 Zentrale) – Befund QZ-04", async ({ page }) => {
    test.fail(true, "QZ-04: /arbeitsplatz reagiert nicht auf Ziffern 1–5 (Register kennt die Kürzel, Seite bindet sie nicht)");
    await anmelden(page, "gf@demo.local");
    await page.goto("/arbeitsplatz");
    await ruhig(page);
    const vorher = page.url();
    await page.locator("h1").click();
    await page.keyboard.press("1");
    await expect.poll(() => page.url(), { timeout: 8_000 }).not.toBe(vorher);
  });
});

// ------------------------------------------------------------------------------------------ Teil D
test.describe("Reflow, Fokus nicht verdeckt, reduzierte Bewegung", () => {
  test("Reflow 320 px ohne horizontales Scrollen (WCAG 1.4.10) auf Kernseiten", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.setViewportSize({ width: 320, height: 640 });
    for (const pfad of ["/", "/aufgaben", "/aufgaben/PH-AUF-2026-00001", "/verwaltung", "/einstellungen?tab=kalkulation", "/benachrichtigungen", "/protokoll"]) {
      await page.goto(pfad);
      await ruhig(page);
      const breite = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
      expect.soft(breite.s, `Überbreite bei 320 px auf ${pfad}`).toBeLessThanOrEqual(breite.i);
    }
  });

  test("Fokus wird nicht von der Kopfzeile verdeckt (WCAG 2.4.11) – Tab durch /einstellungen?tab=kalkulation", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/einstellungen?tab=kalkulation");
    await ruhig(page);
    const verdeckt = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        const kopf = document.querySelector('[data-testid="kopfzeile"]');
        if (!el || el === document.body || !kopf || kopf.contains(el) || el.closest('[data-testid="leiste"]') || el.classList.contains("bo-schale-sprung")) return null;
        const b = el.getBoundingClientRect();
        const k = kopf.getBoundingClientRect();
        // vollständig verdeckt = liegt ganz im Band der Kopfzeile (sticky) und ist nicht Teil davon
        const ganzDarunter = b.top >= k.top && b.bottom <= k.bottom && b.height > 0;
        return ganzDarunter ? (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40) : null;
      });
      if (r) verdeckt.push(r);
    }
    expect(verdeckt, "Fokussierte Elemente vollständig unter der Kopfzeile").toEqual([]);
  });

  test("Reduzierte Bewegung: Kopfzahlen stehen sofort auf dem Endwert", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByTestId("kennzahlen").waitFor();
    const sofort = await page.getByTestId("kennzahlen").locator(".zb-zahl").allInnerTexts();
    await page.waitForTimeout(1500);
    const spaeter = await page.getByTestId("kennzahlen").locator(".zb-zahl").allInnerTexts();
    expect(sofort).toEqual(spaeter);
  });
});
