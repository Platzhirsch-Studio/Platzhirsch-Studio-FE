// Barrierefreiheit und Tastatur – Bereich Service (Team Q3/Q4, MASTER § 2.I, § 5.5; 10-konzept-service § 1, § 10 Q-36;
// Befunde in Marktresearch/digital/backoffice/4x-qa-service.md). Läuft gegen den Dev-Server im Mock-Modus.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/a11y-service.spec.js --project=desktop
//
// Teil A  axe (WCAG 2.2 AA, serious/critical = 0, Q-I1) je Service-Route, hell und dunkel (Admin, Service, Technik).
// Teil B  axe in geöffneten Sheets/Dialogen (S1-Schnell, S2 Prüfen, Telefonat, A14 Schritt 2, Technik-Abschluss).
// Teil C  Tastatur-Durchläufe der Top-Aufgaben (Konzept § 1) mit Klick-/Tastenzählung. Nichts wird endgültig
//         gebucht: jede Aufgabe endet vor dem letzten Bestätigen (Mock-Daten des laufenden Servers bleiben).
// Teil D  Reflow 320 px (1.4.10), Fokus nicht verdeckt (2.4.11), Zielgröße (2.5.8), reduzierte Bewegung.
// Bekannte Lücken stehen als test.fail mit Befundnummer QS-xx: wird die Lücke geschlossen, meldet Playwright
// „expected to fail“ – dann die Markierung entfernen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SCHEMATA = ["light", "dark"];

// Routen aus tools/qa/routen/service.mjs + Navigation src/lib/backoffice/bereiche/service.js (Seed 04.11.2026).
const ROUTEN_ADMIN = [
  "/service",
  "/service/faelle",
  "/service/faelle?reiter=reaktion",
  "/service/faelle?ansicht=kanban",
  "/service/faelle/neu",
  "/service/faelle/PH-SRV-2026-00013",
  "/service/faelle/PH-SRV-2026-00018",
  "/service/faelle/PH-SRV-2026-00018?tab=mangel",
  "/service/faelle/PH-SRV-2026-00023",
  "/service/einsaetze",
  "/service/einsaetze?ansicht=kanban",
  "/service/einsaetze?ansicht=liste",
  "/service/einsaetze/neu?fall=PH-SRV-2026-00020",
  "/service/einsaetze/PH-SRE-2026-00007",
  "/service/ersatzteile",
  "/service/ersatzteile?ansicht=bestellungen",
  "/service/ersatzteile/PH-ET-00008",
  "/service/ersatzteile/bestellungen/PH-ETB-2026-00008",
  "/service/regress",
  "/service/regress/PH-REG-2026-00009",
  "/service/vertraege",
  "/service/vertraege?art=auftraege",
  "/service/vertraege/pflege/PFL-2026-00007",
  "/service/vertraege/auftraege/PH-SA-2026-00009",
  "/service/fehlerkatalog",
  "/service/berichte/quote",
  "/service/berichte/fristen",
  "/service/einstellungen",
];

// Bekannte axe-Verstöße (4x-qa-service.md). Wird die Lücke geschlossen, meldet Playwright „expected to fail“.
const BEKANNT_AXE = {
  "/service/einsaetze": "QS-02: Wochenraster role=grid ohne role=row um die Spaltenköpfe (aria-required-children/-parent, critical)",
  "/service/einsaetze/neu?fall=PH-SRV-2026-00020": "QS-03: A14 Dauer-Chips sind Links mit aria-pressed (aria-allowed-attr, critical)",
};

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 120_000 });
}

async function axeSchwer(page, bereich) {
  let b = new AxeBuilder({ page }).withTags(TAGS).exclude("nextjs-portal");
  if (bereich) b = b.include(bereich);
  const r = await b.analyze();
  return r.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

async function ruhig(page) {
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  // Hochzählende Zahlen und Einblendungen (≤ 600 ms) abwarten, damit axe Endfarben misst.
  await page.waitForTimeout(800);
}

async function pruefeRoute(page, pfad) {
  for (const schema of SCHEMATA) {
    await page.emulateMedia({ colorScheme: schema });
    const antwort = await page.goto(pfad);
    expect.soft(antwort?.status() ?? 0, `HTTP ${pfad}`).toBeLessThan(400);
    await ruhig(page);
    expect.soft(await axeSchwer(page), `axe ${pfad} · ${schema}`).toEqual([]);
  }
}

/** Tab drücken, bis `ziel` fokussiert ist; liefert die Anzahl Tab-Schritte (max. `grenze`). */
async function tabBis(page, ziel, grenze = 120) {
  let n = 0;
  for (; n < grenze; n++) {
    if (await ziel.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)).catch(() => false)) break;
    await page.keyboard.press("Tab");
  }
  return n;
}

async function hatRing(loc) {
  return loc.evaluate((el) => {
    const s = getComputedStyle(el);
    return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (!!s.boxShadow && s.boxShadow !== "none");
  });
}

function messung(text) {
  test.info().annotations.push({ type: "messung", description: text });
}

// ------------------------------------------------------------------------------------------ Teil A
test.describe("A11y Service – axe je Route, hell und dunkel (Q-36, Q-I1)", () => {
  test.setTimeout(240_000);
  let sitzung;
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await anmelden(page, "admin@demo.local");
    sitzung = await ctx.storageState();
    await ctx.close();
  });

  for (const pfad of ROUTEN_ADMIN) {
    test(`Admin ${pfad}`, async ({ browser }) => {
      if (BEKANNT_AXE[pfad]) test.fail(true, BEKANNT_AXE[pfad]);
      const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await pruefeRoute(page, pfad);
      await ctx.close();
    });
  }

  test("Service-Mitarbeiter: /service und /service/faelle", async ({ page }) => {
    await anmelden(page, "service@demo.local");
    await pruefeRoute(page, "/service");
    await expect(page.locator("h1")).toHaveCount(1);
    await pruefeRoute(page, "/service/faelle");
  });

  test("Techniker (iPhone 390): /technik und Einsatz-Karte", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await anmelden(page, "techniker@demo.local");
    await pruefeRoute(page, "/technik");
    await pruefeRoute(page, "/technik/einsatz/PH-SRE-2026-00010");
  });
});

// ------------------------------------------------------------------------------------------ Teil B
test.describe("A11y Service – geöffnete Sheets und Dialoge", () => {
  test.setTimeout(180_000);

  test("S1-Schnell (?melden=1): Sheet hell/dunkel, Fokus im Sheet, Esc schließt", async ({ page }) => {
    await anmelden(page);
    for (const schema of SCHEMATA) {
      await page.emulateMedia({ colorScheme: schema });
      await page.goto("/service/faelle?melden=1");
      const sheet = page.getByTestId("melden-sheet");
      await expect(sheet).toBeVisible();
      await ruhig(page);
      expect.soft(await axeSchwer(page), `axe S1 · ${schema}`).toEqual([]);
      const imSheet = await sheet.evaluate((el) => el.contains(document.activeElement));
      expect.soft(imSheet, "Fokus liegt nach dem Öffnen im Sheet (2.4.3)").toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("melden-sheet")).toBeHidden();
  });

  test("S2 Prüfen & entscheiden (?aktion=pruefen): hell/dunkel", async ({ page }) => {
    await anmelden(page);
    for (const schema of SCHEMATA) {
      await page.emulateMedia({ colorScheme: schema });
      await page.goto("/service/faelle/PH-SRV-2026-00017?aktion=pruefen");
      await expect(page.getByTestId("sheet-pruefen")).toBeVisible();
      await ruhig(page);
      expect.soft(await axeSchwer(page), `axe S2 · ${schema}`).toEqual([]);
    }
  });

  test("Telefonat erfassen (Dialog aus „Jetzt dran“): hell/dunkel, Esc gibt Fokus zurück", async ({ page }) => {
    await anmelden(page);
    await page.goto("/service");
    await ruhig(page);
    const knopf = page.getByTestId("jetzt-dran").getByRole("button", { name: /Telefonat/ }).first();
    test.skip((await knopf.count()) === 0, "Seed zeigt keine Zeile mit „Telefonat erfassen“");
    for (const schema of SCHEMATA) {
      await page.emulateMedia({ colorScheme: schema });
      await knopf.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.waitForTimeout(500);
      expect.soft(await axeSchwer(page), `axe Telefonat · ${schema}`).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect.soft(knopf, "Fokus kehrt zum Zeilenknopf zurück (2.4.3)").toBeFocused();
    }
  });

  test("A14 Einsatz planen, Schritt 2 (Mitnehmen): hell/dunkel", async ({ page }) => {
    await anmelden(page);
    for (const schema of SCHEMATA) {
      await page.emulateMedia({ colorScheme: schema });
      await page.goto("/service/einsaetze/neu?fall=PH-SRV-2026-00022");
      await page.getByTestId("a14-zeit").locator(".bo-svc-fenster button").first().click();
      await page.getByTestId("a14-weiter").click();
      await expect(page.getByTestId("a14-mitnehmen")).toBeVisible();
      await ruhig(page);
      expect.soft(await axeSchwer(page), `axe A14 Schritt 2 · ${schema}`).toEqual([]);
    }
  });
});

// ------------------------------------------------------------------------------------------ Teil C
test.describe("Tastatur – Top-Aufgaben Service (Konzept § 1, Q-19)", () => {
  test.setTimeout(180_000);

  test("Sprunglink ist erster Tabstopp auf /service und führt in den Inhalt", async ({ page }) => {
    await anmelden(page, "service@demo.local");
    await page.goto("/service");
    await ruhig(page);
    await page.keyboard.press("Tab");
    const erster = page.locator(":focus");
    await expect(erster).toHaveText(/Zum Inhalt springen/);
    await page.keyboard.press("Enter");
    await expect(page.locator("#bo-inhalt")).toBeFocused();
  });

  test("Heute fällige Dinge sehen – 1 Klick ab Zentrale: Heute-Leiste und „Jetzt dran“ im ersten Bildschirm", async ({ page }) => {
    await anmelden(page, "service@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.locator('a[href="/service"]').first().click();
    await expect(page).toHaveURL(/\/service$/, { timeout: 90_000 });
    await ruhig(page);
    await expect(page.getByTestId("heute-leiste")).toBeInViewport({ timeout: 30_000 });
    const erste = page.getByTestId("jetzt-dran").locator("li").first();
    await expect(erste).toBeVisible();
    const box = await erste.boundingBox();
    messung(`Erste „Jetzt dran“-Zeile oben bei ${Math.round(box.y)} px (Bildschirm 900 px)`);
    expect.soft(box.y, "erste Zeile im ersten Bildschirm").toBeLessThan(900);
    test.info().annotations.push({ type: "klickzahl", description: "Heute fällige Dinge sehen: 1 (Ziel 1)" });
  });

  test("„Was ist mit meiner Reklamation?“ – Strg+K, Nummer, Enter (Ziel 2) – Befund QS-10", async ({ page }) => {
    test.fail(true, "QS-10: Palette setzt den Serviceeinsatz zur Fallnummer vor den Fall selbst; Enter öffnet /d/ph-serviceeinsatz/… statt der Fall-Akte");
    await anmelden(page, "service@demo.local");
    await page.goto("/");
    await ruhig(page);
    await page.keyboard.press("Control+k");
    const eingabe = page.getByTestId("palette-eingabe");
    await expect(eingabe).toBeFocused();
    await eingabe.fill("PH-SRV-2026-00013");
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 90_000 });
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/service\/faelle\/PH-SRV-2026-00013/, { timeout: 30_000 });
    test.info().annotations.push({ type: "klickzahl", description: "Reklamation über Strg+K: 1 Enter (Ziel 2)" });
  });

  test("„Was ist mit meiner Reklamation?“ – Liste: Suche + Enter, Zeile per Tastatur öffnen", async ({ page }) => {
    await anmelden(page, "service@demo.local");
    await page.goto("/service/faelle");
    await ruhig(page);
    const suche = page.getByTestId("faelle-suche");
    await suche.focus();
    await suche.fill("Ledersessel");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/q=Ledersessel/);
    await ruhig(page);
    const link = page.getByTestId("faelle-tabelle").locator('a[href*="/service/faelle/PH-SRV"]').first();
    await expect(link).toBeVisible();
    const tabs = await tabBis(page, link, 60);
    messung(`Tab-Schritte von der Suche bis zum ersten Fall-Link: ${tabs}`);
    expect(tabs).toBeLessThan(60);
    expect.soft(await hatRing(link), "Fall-Link mit sichtbarem Fokusring").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/service\/faelle\/PH-SRV-\d{4}-\d+/, { timeout: 30_000 });
  });

  test("Reklamation aufnehmen (S1-Schnell) – Umschalt+M auf der Fall-Liste öffnet das Melden-Sheet (QS-01)", async ({ page }) => {
    test.fail(true, "QS-01: Kürzel service.melden (Umschalt+M, Register) ist an keine Seite gebunden");
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/faelle");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("Shift+M");
    await expect(page.getByTestId("melden-sheet")).toBeVisible({ timeout: 8_000 });
  });

  test("Reklamation aufnehmen (S1-Schnell) – Weg per Tastatur ohne Speichern, Klickzahl", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/faelle");
    await ruhig(page);
    let klicks = 0;
    const melden = page.getByTestId("melden-knopf").first();
    await melden.focus();
    await page.keyboard.press("Enter");
    klicks++;
    const sheet = page.getByTestId("melden-sheet");
    await expect(sheet).toBeVisible();
    await sheet.getByTestId("kontakt-suche").focus();
    await page.keyboard.type("Muster");
    await expect(sheet.locator('[role="option"]').first()).toBeVisible({ timeout: 60_000 });
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    klicks++;
    await expect.soft(sheet.getByTestId("kontakt-gewaehlt"), "Kontakt per Pfeil+Enter gewählt").toBeVisible({ timeout: 10_000 });
    await sheet.getByTestId("fehler-combobox").focus();
    await page.keyboard.type("naht");
    await expect(sheet.locator('[role="option"]').first()).toBeVisible({ timeout: 20_000 });
    const erster = (await sheet.locator('[role="option"]').first().innerText()).trim();
    messung(`Fehler-Combobox „naht“ → erster Treffer: ${erster.replace(/\s+/g, " ").slice(0, 60)}`);
    // Konzept Q-1 nennt POL-01; laut install.py/katalog.js ist „Naht offen“ POL-03 (Konzept-Tippfehler, 4x-qa-service).
    expect.soft(erster, "Q-1: „naht“ findet „Naht offen“ zuerst").toMatch(/POL-03/);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    klicks++;
    // Letzter Schritt wäre Strg+Enter (anlegen) – hier bewusst nicht ausgelöst.
    const gesamt = klicks + 1;
    test.info().annotations.push({ type: "klickzahl", description: `S1-Schnell ab Fall-Liste: ${gesamt} (Konzept ab Zentrale 5 inkl. Navigation)` });
    expect.soft(gesamt + 1, "S1-Schnell ab Zentrale (Ziel 5)").toBeLessThanOrEqual(5);
    await page.keyboard.press("Escape");
  });

  test("Prüfen und entscheiden (S2) – Zeilenknopf per Tastatur öffnet das Sheet", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/service");
    await ruhig(page);
    const knopf = page.getByTestId("jetzt-dran").locator('a[href*="aktion=pruefen"]').first();
    test.skip((await knopf.count()) === 0, "Seed ohne Zeile „Prüfen“");
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    const tabs = await tabBis(page, knopf, 120);
    messung(`Tab-Schritte ab Seitenanfang bis zum ersten „Prüfen“-Zeilenknopf: ${tabs}`);
    expect(tabs).toBeLessThan(120);
    expect.soft(await hatRing(knopf), "Zeilenknopf mit sichtbarem Fokusring").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("sheet-pruefen")).toBeVisible({ timeout: 30_000 });
    const radios = page.getByTestId("sheet-pruefen").getByRole("radio");
    expect.soft(await radios.count(), "Entscheidung als Radiogruppe").toBeGreaterThan(1);
    test.info().annotations.push({ type: "klickzahl", description: "S2 bis Sheet offen: Service (1) + Zeilenknopf (1); Rest laut Konzept 4 → 6" });
    await page.keyboard.press("Escape");
  });

  test("Einsatz planen (A14) – freies Fenster per Tastatur, Weiter erst danach aktiv", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/einsaetze/neu?fall=PH-SRV-2026-00022");
    await ruhig(page);
    const fenster = page.getByTestId("a14-zeit").locator(".bo-svc-fenster button").first();
    await expect(fenster).toBeVisible();
    await expect(page.getByTestId("a14-weiter")).toBeDisabled();
    const tabs = await tabBis(page, fenster, 100);
    messung(`Tab-Schritte bis zum ersten freien Fenster in A14: ${tabs}`);
    expect(tabs).toBeLessThan(100);
    expect.soft(await hatRing(fenster), "Fenster-Knopf mit Fokusring").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("a14-weiter")).toBeEnabled();
    const gewaehlt = await fenster.evaluate((el) => el.getAttribute("aria-pressed") ?? el.getAttribute("aria-checked") ?? el.getAttribute("aria-selected"));
    messung(`Gewähltes Fenster meldet Zustand per ARIA: ${gewaehlt ?? "nein"}`);
    expect.soft(gewaehlt, "Auswahl des Fensters per aria-pressed/checked/selected (4.1.2)").toBe("true");
  });

  test("Ersatzteil-Wareneingang – Klickzahl bis zum Buchen-Dialog (Ziel 4)", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/service");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/service/ersatzteile"]').first().click({ timeout: 60_000 });
    klicks++;
    await ruhig(page);
    const erwartet = page.getByRole("link", { name: /Erwartet/ }).or(page.getByRole("tab", { name: /Erwartet/ })).first();
    if (await erwartet.isVisible().catch(() => false)) {
      await erwartet.click();
      klicks++;
      await ruhig(page);
    }
    // Kein Zeilenknopf in der Liste (Konzept § 1.1): Weg führt über die Bestellungs-Akte.
    const zeile = page.locator('a[href*="/service/ersatzteile/bestellungen/PH-ETB"]').first();
    await expect(zeile).toBeVisible({ timeout: 60_000 });
    await zeile.click();
    klicks++;
    const knopf = page.getByTestId("wareneingang-knopf").first();
    await expect(knopf).toBeVisible({ timeout: 60_000 });
    await knopf.click();
    klicks++;
    await expect(page.getByTestId("dialog-wareneingang")).toBeVisible();
    const gesamt = klicks + 1 + 1; // + Seitenleiste ab Zentrale + Buchen
    test.info().annotations.push({ type: "klickzahl", description: `Ersatzteil-Wareneingang ab Zentrale: ${gesamt} (Ziel 4, Konzept-Weg 5) – QS-11` });
    expect.soft(gesamt, "Wareneingang ab Zentrale (Konzept nennt selbst 5)").toBeLessThanOrEqual(5);
    await page.keyboard.press("Escape");
  });

  test("Eskalierte Fälle – Klickzahl (Ziel 3): Service → Servicefälle → Reiter „Eskaliert“", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/service"]').first().click();
    klicks++;
    await expect(page).toHaveURL(/\/service$/, { timeout: 90_000 });
    await ruhig(page);
    await page.locator('a[href="/service/faelle"]').first().click({ timeout: 60_000 });
    klicks++;
    await ruhig(page);
    const reiter = page.getByRole("link", { name: /Eskaliert/ }).or(page.getByRole("tab", { name: /Eskaliert/ })).first();
    await expect(reiter).toBeVisible();
    await ruhig(page);
    await reiter.click();
    klicks++;
    await expect(page).toHaveURL(/eskal/i, { timeout: 60_000 });
    test.info().annotations.push({ type: "klickzahl", description: `Eskalierte Fälle: ${klicks} (Ziel 3)` });
    expect.soft(klicks).toBeLessThanOrEqual(3);
  });

  test("Akte: Reiter als Navigation mit Links, aktiver Reiter mit aria-current, per Tab und Enter", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/faelle/PH-SRV-2026-00018");
    await ruhig(page);
    const nav = page.getByRole("navigation", { name: "Bereiche der Akte" });
    await expect(nav).toBeVisible();
    expect(await nav.getByRole("link").count(), "fünf Reiter").toBe(5);
    await expect.soft(nav.locator('a[aria-current="page"], a[aria-current="true"]'), "aktiver Reiter mit aria-current (4.1.2)").toHaveCount(1);
    const mangel = nav.getByRole("link", { name: "Mangel & Fristen" });
    const tabs = await tabBis(page, mangel, 80);
    messung(`Tab-Schritte bis Reiter „Mangel & Fristen“: ${tabs}`);
    expect.soft(await hatRing(mangel), "Reiter mit Fokusring").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/tab=mangel/, { timeout: 30_000 });
  });

  test("Akte: Phasenpunkte sind Knöpfe mit Popover (Konzept § 3.1, Q-11) – Befund QS-05", async ({ page }) => {
    test.fail(true, "QS-05: Phasenleiste ist eine Liste ohne Knöpfe; kein Popover „Geprüft am … von …“ per Tastatur");
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/faelle/PH-SRV-2026-00018");
    await ruhig(page);
    await expect(page.getByTestId("phasenleiste").locator("button")).toHaveCount(6, { timeout: 5_000 });
  });

  test("Fehlerkatalog: Baum mit Pfeiltasten (role=tree)", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/fehlerkatalog");
    await ruhig(page);
    const baum = page.getByTestId("katalog-baum");
    await expect(baum).toBeVisible();
    await expect(page.getByRole("tree")).toHaveCount(1);
    const erster = page.getByRole("treeitem").first();
    await erster.focus();
    const vorher = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40));
    await page.keyboard.press("ArrowDown");
    const nachher = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40));
    expect(nachher, "Pfeil unten bewegt den Fokus im Baum").not.toBe(vorher);
  });

  test("Fehlerkatalog: Baum hat genau einen Tabstopp (roving tabindex, APG Tree) – Befund QS-06", async ({ page }) => {
    test.fail(true, "QS-06: alle 12 Bereichsknoten tabindex=0 – Tab läuft durch jeden Knoten statt einmal in den Baum");
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/fehlerkatalog");
    await ruhig(page);
    await expect(page.locator('[role="treeitem"][tabindex="0"]')).toHaveCount(1, { timeout: 5_000 });
  });

  test("S1 Kontakt-Combobox meldet die aktive Option (aria-activedescendant) – Befund QS-07", async ({ page }) => {
    test.fail(true, "QS-07: Kontakt- und Fehler-Combobox ohne aria-activedescendant – Screenreader hört die Pfeilauswahl nicht");
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/faelle?melden=1");
    const feld = page.getByTestId("melden-sheet").getByTestId("kontakt-suche");
    await feld.fill("Muster");
    await expect(page.getByTestId("melden-sheet").locator('[role="option"]').first()).toBeVisible({ timeout: 30_000 });
    await feld.press("ArrowDown");
    await expect(feld).toHaveAttribute("aria-activedescendant", /.+/, { timeout: 3_000 });
  });

  test("Technik (iPhone): genau ein Primärknopf, Ziel ≥ 44 px, per Tastatur erreichbar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await anmelden(page, "techniker@demo.local");
    await page.goto("/technik/einsatz/PH-SRE-2026-00010");
    await ruhig(page);
    const primaer = page.getByTestId("technik-primaer");
    await expect(primaer).toHaveCount(1);
    const box = await primaer.boundingBox();
    messung(`Technik-Primärknopf ${Math.round(box.width)}×${Math.round(box.height)} px`);
    expect.soft(box.height, "Primärknopf ≥ 44 px hoch").toBeGreaterThanOrEqual(44);
    const tabs = await tabBis(page, primaer, 60);
    messung(`Tab-Schritte bis zum Technik-Primärknopf: ${tabs}`);
    expect(tabs).toBeLessThan(60);
  });
});

// ------------------------------------------------------------------------------------------ Teil D
test.describe("Service – Reflow, Fokus nicht verdeckt, Zielgröße, reduzierte Bewegung", () => {
  test.setTimeout(240_000);

  async function reflow(page, pfade) {
    await anmelden(page, "admin@demo.local");
    await page.setViewportSize({ width: 320, height: 640 });
    for (const pfad of pfade) {
      await page.goto(pfad);
      await ruhig(page);
      const breite = await page.evaluate(() => {
        const i = window.innerWidth;
        const zu = [...document.querySelectorAll("#bo-inhalt *")]
          .filter((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().right > i + 1)
          .slice(0, 4)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} → ${Math.round(el.getBoundingClientRect().right)}`);
        return { s: document.documentElement.scrollWidth, i, zu };
      });
      if (breite.s > breite.i) messung(`${pfad}: ${breite.s} px breit · ${breite.zu.join(" | ")}`);
      expect.soft(breite.s, `Überbreite bei 320 px auf ${pfad}`).toBeLessThanOrEqual(breite.i);
    }
  }

  test("Reflow 320 px ohne horizontales Scrollen (WCAG 1.4.10)", async ({ page }) => {
    await reflow(page, ["/service/faelle", "/service/faelle/PH-SRV-2026-00018", "/service/einsaetze", "/service/einsaetze/neu?fall=PH-SRV-2026-00020", "/service/ersatzteile", "/service/regress/PH-REG-2026-00009", "/service/einstellungen", "/technik"]);
  });

  test("Reflow 320 px auf /service und /service/fehlerkatalog – Befund QS-04", async ({ page }) => {
    test.fail(true, "QS-04: /service 332 px und /service/fehlerkatalog 334 px breit bei 320 px Fenster");
    await reflow(page, ["/service", "/service/fehlerkatalog"]);
  });

  test("Fokus wird nicht von der Kopfzeile verdeckt (WCAG 2.4.11) – Tab durch die Akte", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.goto("/service/faelle/PH-SRV-2026-00018");
    await ruhig(page);
    const verdeckt = [];
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        const kopf = document.querySelector('[data-testid="kopfzeile"]');
        if (!el || el === document.body || !kopf || kopf.contains(el) || el.closest('[data-testid="leiste"]')) return null;
        if (/Zum Inhalt springen/.test(el.textContent || "")) return null; // Sprunglink liegt absichtlich obenauf
        const b = el.getBoundingClientRect();
        const k = kopf.getBoundingClientRect();
        const ganzDarunter = b.top >= k.top && b.bottom <= k.bottom && b.height > 0;
        return ganzDarunter ? (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40) : null;
      });
      if (r) verdeckt.push(r);
    }
    expect(verdeckt, "Fokussierte Elemente vollständig unter der Kopfzeile").toEqual([]);
  });

  test("Zielgröße ≥ 24 px (WCAG 2.5.8) für Knöpfe und Links im Inhalt von /service und /service/faelle", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    const zuKlein = [];
    for (const pfad of ["/service", "/service/faelle", "/service/faelle/PH-SRV-2026-00018"]) {
      await page.goto(pfad);
      await ruhig(page);
      const r = await page.evaluate(() => {
        const wurzel = document.querySelector("#bo-inhalt") || document.body;
        const aus = [];
        const ziele = [...wurzel.querySelectorAll('a[href], button, [role="button"], [role="tab"], [role="radio"], input[type="checkbox"]')]
          .map((el) => ({ el, b: el.getBoundingClientRect() }))
          .filter((z) => z.b.width > 0 && z.b.height > 0);
        // Ausnahme „Abstand“ (2.5.8): ein 24-px-Kreis um die Mitte des kleinen Ziels schneidet kein anderes Ziel.
        const schneidet = (z, o) => {
          const cx = z.b.left + z.b.width / 2;
          const cy = z.b.top + z.b.height / 2;
          const nx = Math.max(o.b.left, Math.min(cx, o.b.right));
          const ny = Math.max(o.b.top, Math.min(cy, o.b.bottom));
          return Math.hypot(nx - cx, ny - cy) < 12;
        };
        for (const z of ziele) {
          if (z.b.width >= 24 && z.b.height >= 24) continue;
          if (z.el.tagName === "A" && z.el.closest("p")) continue; // Ausnahme „im Satz“
          if (!ziele.some((o) => o !== z && !o.el.contains(z.el) && !z.el.contains(o.el) && schneidet(z, o))) continue;
          aus.push(`${(z.el.getAttribute("aria-label") || z.el.textContent || z.el.tagName).trim().slice(0, 30)} ${Math.round(z.b.width)}×${Math.round(z.b.height)}`);
        }
        return aus;
      });
      for (const x of r) zuKlein.push(`${pfad}: ${x}`);
    }
    messung(`Ziele < 24 px: ${zuKlein.length}${zuKlein.length ? " – " + zuKlein.slice(0, 6).join(" · ") : ""}`);
    expect.soft(zuKlein).toEqual([]);
  });

  test("Reduzierte Bewegung: keine laufenden Animationen länger als 120 ms auf /service", async ({ page }) => {
    await anmelden(page, "admin@demo.local");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/service");
    await ruhig(page);
    const lang = await page.evaluate(() =>
      document.getAnimations()
        .filter((a) => {
          const t = a.effect?.getTiming?.();
          return t && (t.iterations === Infinity || Number(t.duration) > 120);
        })
        .map((a) => `${a.animationName || a.constructor.name} ${a.effect?.target?.className?.toString().slice(0, 40) || ""}`),
    );
    expect.soft(lang, "Animationen trotz prefers-reduced-motion").toEqual([]);
  });
});
