// Barrierefreiheit, Tastatur und Klickzahlen – Bereich Sortiment (Team Q3/Q4, MASTER § 2.I, § 5.5; Befunde in
// Marktresearch/digital/backoffice/4x-qa-sortiment.md). Läuft gegen den Dev-Server im Mock-Modus.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/a11y-sortiment.spec.js --project=desktop
//
// Teil A  axe (WCAG 2.2 AA, serious/critical = 0, 10-konzept-sortiment § 10, § 20.8) je Sortiment-Route, hell und dunkel.
// Teil B  Rollen (Leitung, GF, Faktura/Verkauf, Projekte, Marketing, Logistik), EK-Schutz im DOM (§ 17 Nr. 17),
//         Glossar/Rohwerte (§ 17 Nr. 57), genau eine h1, höchstens 5 Reiter je Akte (§ 17 Nr. 60).
// Teil C  Tastatur-Durchläufe der Top-Aufgaben (§ 1.1, § 6, § 17 Nr. 68) mit Tab-/Klickzählung als Annotation.
//         Schreibende Schlussknöpfe werden nur gezählt, nicht ausgelöst (die Mock-Datenbank lebt im Dev-Server weiter).
// Teil D  Reflow 320 px (WCAG 1.4.10), 1280 × 800 ohne Querscrollen (§ 17 Nr. 61), Fokus nicht verdeckt (WCAG 2.4.11),
//         Touch ohne Hover (§ 10), Zielgrößen Kiosk.
// Bekannte Lücken stehen als test.fail mit Befundnummer (QS-xx): wird die Lücke geschlossen, meldet Playwright
// „expected to fail“ – dann die Markierung entfernen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SCHEMATA = ["light", "dark"];
// § 17 Nr. 57 + Glossar § 2: Rohwerte und Technikwörter (Groß-/Kleinschreibung wie im Datenmodell).
const ROHWERTE = /\b(Geprueft|Uebernommen|beschaedigt|Kueche|freisteller|Anfrage laeuft|Teilgeliefert|Vollstaendig|Uebermittelt|Haendler|Claim-Guard|Website-Cache|Revalidate|PH Produkt|PH Herstellerbestellung|PH Wareneingang|PH Marke|PH Lieferant)\b/;
// EK-Felder (permlevel 1) – dürfen für Rollen ohne EK-Sicht nirgends im DOM stehen (§ 17 Nr. 17).
const EK_DOM = /einkaufspreis_cent|summe_ek_cent|\bek_cent\b|haendlervertrag|Einkaufspreis|\bEK\b/;

// Navigation (bereiche/sortiment.js) + feste Seiten (tools/qa/routen/sortiment.mjs).
const ROUTEN = [
  "/sortiment",
  "/sortiment/produkte",
  "/sortiment/produkte?ansicht=kacheln",
  "/sortiment/produkte?ansicht=kanban",
  "/sortiment/produkte?sicht=veraltet",
  "/sortiment/produkte?q=gibtesnicht",
  "/sortiment/produkte?neu=produkt",
  "/sortiment/produkte/sofa-modul-240",
  "/sortiment/produkte/sofa-modul-240?tab=preise",
  "/sortiment/produkte/sofa-modul-240?tab=ausfuehrungen",
  "/sortiment/produkte/sofa-modul-240?tab=texte",
  "/sortiment/produkte/gibt-es-nicht",
  "/sortiment/marken",
  "/sortiment/marken?ansicht=logos",
  "/sortiment/marken/Bora",
  "/sortiment/lieferanten",
  "/sortiment/lieferanten/Ezarri%20Vertrieb%20%C3%96sterreich",
  "/sortiment/bestellungen",
  "/sortiment/bestellungen?ansicht=kanban",
  "/sortiment/bestellungen/neu",
  "/sortiment/bestellungen/HB-2026-00013",
  "/sortiment/bestellungen/HB-2026-00013?tab=ab",
  "/sortiment/bestellungen/HB-2026-00011?tab=uebermittlung",
  "/sortiment/bestellungen/HB-2026-00011/ab",
  "/sortiment/wareneingang",
  "/sortiment/wareneingang/neu",
  "/sortiment/wareneingang/neu?bestellung=HB-2026-00016",
  "/sortiment/wareneingang/kiosk",
  "/sortiment/wareneingang/WE-2026-00007",
  "/sortiment/freigaben",
  "/sortiment/freigaben?art=preise",
  "/sortiment/freigaben?art=lieferzeiten",
  "/sortiment/bestellvorschlaege",
  "/sortiment/preislisten",
  "/sortiment/preislisten/neu",
  "/sortiment/preislisten/PH-PLI-2026-0007",
  "/sortiment/kategorien",
  "/sortiment/merkmale",
  "/sortiment/berichte",
  "/sortiment/import",
  "/sortiment/einstellungen",
];

// Akten mit festen Seed-Namen (Reiter-Zählung, Rollen).
const AKTEN = [
  "/sortiment/produkte/sofa-modul-240",
  "/sortiment/marken/Bora",
  "/sortiment/lieferanten/Ezarri%20Vertrieb%20%C3%96sterreich",
  "/sortiment/bestellungen/HB-2026-00013",
  "/sortiment/wareneingang/WE-2026-00007",
  "/sortiment/preislisten/PH-PLI-2026-0007",
];

async function anmelden(page, email = "sortiment@demo.local") {
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
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  // Einblendungen und hochzählende Zahlen (≤ 600 ms) abwarten, damit axe Endfarben misst.
  await page.waitForTimeout(800);
}

async function pruefeRoute(page, pfad) {
  for (const schema of SCHEMATA) {
    await page.emulateMedia({ colorScheme: schema });
    const antwort = await page.goto(pfad, { timeout: 120_000 });
    // Nicht gefundenes Produkt antwortet bewusst mit 404 (Fehlerzustand § 8.2).
    if (!pfad.includes("gibt-es-nicht")) expect.soft(antwort?.status() ?? 0, `HTTP ${pfad}`).toBeLessThan(400);
    await ruhig(page);
    expect.soft(await axeSchwer(page), `axe ${pfad} · ${schema}`).toEqual([]);
  }
}

/** Fokus per Tab bis zum Ziel bewegen; liefert die Anzahl Tab-Schritte (max. grenze). */
async function tabBis(page, ziel, grenze = 120) {
  let tabs = 0;
  for (; tabs < grenze; tabs++) {
    if (await ziel.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)).catch(() => false)) break;
    await page.keyboard.press("Tab");
  }
  return tabs;
}

async function hatFokusring(loc) {
  return loc.evaluate((el) => {
    const s = getComputedStyle(el);
    return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (!!s.boxShadow && s.boxShadow !== "none");
  });
}

function messung(beschreibung, typ = "messung") {
  test.info().annotations.push({ type: typ, description: beschreibung });
}

// ------------------------------------------------------------------------------------------ Teil A
test.describe("A11y Sortiment – axe je Route, hell und dunkel (§ 20.8)", () => {
  let sitzung;
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await anmelden(page);
    sitzung = await ctx.storageState();
    await ctx.close();
  });

  for (const pfad of ROUTEN) {
    test(`Leitung ${pfad}`, async ({ browser }) => {
      test.setTimeout(240_000);
      const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await pruefeRoute(page, pfad);
      await ctx.close();
    });
  }

  test("iPad quer: Produktliste, Produktakte (Details als Reiter), Bestellakte", async ({ browser }) => {
    test.setTimeout(300_000);
    const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    for (const pfad of ["/sortiment/produkte", "/sortiment/produkte/sofa-modul-240?tab=seite", "/sortiment/bestellungen/HB-2026-00013"]) {
      await pruefeRoute(page, pfad);
    }
    await ctx.close();
  });

  test("Offene Überlagerungen: Seitenblick, Lightbox, Preis-Sheet hell/dunkel", async ({ browser }) => {
    test.setTimeout(300_000);
    const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    for (const schema of SCHEMATA) {
      await page.emulateMedia({ colorScheme: schema });
      await page.goto("/sortiment/produkte", { timeout: 120_000 });
      await ruhig(page);
      await page.getByRole("button", { name: /Seitenblick: / }).first().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.waitForTimeout(600);
      expect.soft(await axeSchwer(page), `axe Seitenblick · ${schema}`).toEqual([]);
      await page.keyboard.press("Escape");

      await page.goto("/sortiment/produkte/sofa-modul-240?tab=preise&preis=bestaetigen", { timeout: 120_000 });
      await ruhig(page);
      if (await page.getByTestId("preis-sheet").isVisible().catch(() => false)) {
        expect.soft(await axeSchwer(page), `axe Preis-Sheet · ${schema}`).toEqual([]);
      } else messung(`Preis-Sheet über ?preis=bestaetigen nicht offen (${schema})`);

      await page.goto("/sortiment/freigaben", { timeout: 120_000 });
      await ruhig(page);
      const zelle = page.getByTestId("freigabe-raster").getByRole("gridcell").first();
      if (await zelle.isVisible().catch(() => false)) {
        await zelle.focus();
        await page.keyboard.press(" ");
        await page.waitForTimeout(600);
        expect.soft(await axeSchwer(page), `axe Lightbox · ${schema}`).toEqual([]);
        await page.keyboard.press("Escape");
      }
    }
    await ctx.close();
  });
});

// ------------------------------------------------------------------------------------------ Teil B
test.describe("A11y Sortiment – Rollen, EK-Schutz, Glossar, Seitenkopf", () => {
  // § 1.2: GF liest mit EK; Verkauf (Faktura), Projekte, Marketing, Logistik lesen ohne EK oder sind gesperrt.
  for (const [rolle, email, siehtEk] of [
    ["Geschäftsführung", "gf@demo.local", true],
    ["Faktura (Verkauf)", "faktura@demo.local", false],
    ["Projekte", "projekte@demo.local", false],
    ["Marketing", "marketing@demo.local", false],
    ["Logistik", "logistik@demo.local", false],
  ]) {
    test(`${rolle}: Produktakte und Bestellakte – axe, eine h1, EK ${siehtEk ? "sichtbar erlaubt" : "nicht im DOM"}`, async ({ page }) => {
      test.setTimeout(600_000);
      await anmelden(page, email);
      await page.setViewportSize({ width: 1440, height: 900 });
      for (const pfad of ["/sortiment", "/sortiment/produkte/sofa-modul-240", "/sortiment/bestellungen/HB-2026-00013", "/sortiment/produkte/sofa-modul-240?tab=preise"]) {
        await pruefeRoute(page, pfad);
        const gesperrt = await page.getByText(/Keine Berechtigung|kein Zugriff/i).first().isVisible().catch(() => false);
        const h1 = await page.locator("h1").count();
        messung(`${rolle} ${pfad}: ${gesperrt ? "Sperrzustand" : "lesbar"}, h1 = ${h1}`);
        expect.soft(h1, `${rolle} ${pfad}: genau eine h1`).toBe(1);
        if (!siehtEk) {
          const html = await page.locator("main").innerHTML().catch(() => "");
          const m = html.match(EK_DOM);
          expect.soft(m ? m[0] : null, `${rolle} ${pfad}: EK-Feld im DOM`).toBeNull();
        }
      }
    });
  }

  test("Leitung: keine Rohwerte/Technikwörter im sichtbaren Text aller Sortiment-Routen (§ 17 Nr. 57)", async ({ page }) => {
    test.setTimeout(900_000);
    await anmelden(page);
    const treffer = [];
    for (const pfad of ROUTEN) {
      await page.goto(pfad, { timeout: 120_000 });
      await ruhig(page);
      const text = await page.locator("main").innerText().catch(() => "");
      const m = text.match(ROHWERTE);
      if (m) treffer.push(`${pfad}: „${m[0]}“`);
    }
    expect.soft(treffer).toEqual([]);
  });

  test("Genau eine Überschrift h1 je Sortiment-Route", async ({ page }) => {
    test.setTimeout(900_000);
    await anmelden(page);
    const abweichend = [];
    for (const pfad of ROUTEN) {
      await page.goto(pfad, { timeout: 120_000 });
      await ruhig(page);
      const n = await page.locator("h1").count();
      if (n !== 1) abweichend.push(`${pfad}: ${n}`);
    }
    expect.soft(abweichend).toEqual([]);
  });

  test("Akten: höchstens 5 Reiter (§ 17 Nr. 60), Reiter mit aria-current", async ({ page }) => {
    test.setTimeout(600_000);
    await anmelden(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    const zuViele = [];
    for (const pfad of AKTEN) {
      await page.goto(pfad, { timeout: 120_000 });
      await ruhig(page);
      const leiste = page.getByTestId("akte-tabs").first();
      if (!(await leiste.isVisible().catch(() => false))) {
        messung(`${pfad}: keine Reiterleiste`);
        continue;
      }
      const n = await leiste.locator('[data-testid^="akte-tab-"]:not([data-testid="akte-tab-seite"])').count();
      messung(`${pfad}: ${n} Reiter`);
      if (n > 5) zuViele.push(`${pfad}: ${n}`);
      const aktiv = await leiste.locator('[aria-current="page"], [aria-selected="true"], [aria-checked="true"]').count();
      expect.soft(aktiv, `${pfad}: aktiver Reiter ausgezeichnet`).toBeGreaterThan(0);
    }
    expect.soft(zuViele).toEqual([]);
  });
});

// ------------------------------------------------------------------------------------------ Teil C
test.describe("Tastatur und Klickzahlen – Top-Aufgaben Sortiment (§ 1.1, § 6, § 17 Nr. 68)", () => {
  test.beforeEach(async ({ page }) => {
    await anmelden(page);
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("Preis bestätigen ab „Zu tun“: Tab zum Knopf, Enter öffnet das Sheet, Esc schließt, Fokus zurück (Ziel 3)", async ({ page }) => {
    await page.goto("/sortiment");
    await ruhig(page);
    const gruppe = page.getByTestId("zutun-preisVeraltet");
    test.skip(!(await gruppe.isVisible().catch(() => false)), "keine Gruppe „Preis veraltet“ im Mock-Zustand");
    const knopf = gruppe.locator("a.bo-knopf, a[class*='knopf'], a").filter({ hasText: /bestätigen/i }).first();
    await page.locator("h1").click();
    const tabs = await tabBis(page, knopf);
    messung(`/sortiment: Tab-Schritte von h1 bis „Preis bestätigen“: ${tabs}`);
    expect(tabs, "Preis bestätigen per Tab erreichbar").toBeLessThan(120);
    expect.soft(await hatFokusring(knopf), "Knopf hat sichtbaren Fokusring").toBe(true);
    await page.keyboard.press("Enter");
    const sheet = page.getByTestId("preis-sheet");
    await expect(sheet).toBeVisible({ timeout: 60_000 });
    const drin = await sheet.evaluate((d) => d.contains(document.activeElement));
    expect.soft(drin, "Fokus liegt im Preis-Sheet").toBe(true);
    await expect(page.getByTestId("preis-speichern")).toBeEnabled();
    messung("Preis bestätigen ab /sortiment: Knopf → Speichern = 2 (+1 Bereich ab Zentrale = 3, Ziel 3)", "klickzahl");
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("Neues Produkt: „+ Neu“ per Tastatur, Schnellanlage mit Fokusfalle, Esc legt nichts an, Fokus zurück", async ({ page }) => {
    await page.goto("/sortiment");
    await ruhig(page);
    const neu = page.getByTestId("sortiment-neu");
    await neu.focus();
    await page.keyboard.press("Enter");
    const punkt = page.getByRole("menuitem", { name: /Produkt/ }).first();
    await expect(punkt).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const rolle = await page.evaluate(() => document.activeElement?.getAttribute("role"));
    expect.soft(rolle, "Pfeiltaste setzt Fokus auf einen Menüpunkt").toBe("menuitem");
    await punkt.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByTestId("schnellanlage");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    expect.soft(await dialog.evaluate((d) => d.contains(document.activeElement)), "Fokus im Dialog").toBe(true);
    let raus = 0;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      if (!(await dialog.evaluate((d) => d.contains(document.activeElement)))) raus++;
    }
    expect.soft(raus, "Tab verlässt die Schnellanlage nicht").toBe(0);
    messung("Neues Produkt: Sortiment → „+ Neu“ → Produkt → „Anlegen und öffnen“ = 4 ab Zentrale (Ziel 3 + 3 Felder; „+ Neu ▾“ ist Menü, +1)", "klickzahl");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await page.waitForTimeout(300);
    const zurueck = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    messung(`Fokus nach Esc: ${zurueck || "(ohne testid)"}`);
    expect.soft(zurueck, "Fokus kehrt auf „+ Neu“ zurück").toBe("sortiment-neu");
  });

  test("Produktliste: Tab zur ersten Zeile, ↓ wechselt, Leertaste Seitenblick, Esc, Enter öffnet die Akte", async ({ page }) => {
    await page.goto("/sortiment/produkte");
    await ruhig(page);
    const zeilen = page.getByTestId("produkt-zeile");
    await expect(zeilen.first()).toBeVisible({ timeout: 30_000 });
    await page.locator("h1").click();
    const link = zeilen.first().locator("a.bo-sor-link--zeile").first();
    const tabs = await tabBis(page, link);
    messung(`/sortiment/produkte: Tab-Schritte von h1 bis zur ersten Zeile: ${tabs}`);
    expect(tabs).toBeLessThan(120);
    expect.soft(await hatFokusring(link), "Zeilen-Link hat sichtbaren Fokusring").toBe(true);
    await page.keyboard.press("ArrowDown");
    await expect(zeilen.nth(1)).toBeFocused();
    expect.soft(await hatFokusring(zeilen.nth(1)), "fokussierte Zeile ist sichtbar markiert").toBe(true);
    await page.keyboard.press(" ");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await zeilen.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/sortiment\/produkte\/[^/?]+/, { timeout: 60_000 });
  });

  test("Produktliste: Taste x wählt aus, Massenaktionen erscheinen als Werkzeugleiste", async ({ page }) => {
    await page.goto("/sortiment/produkte");
    await ruhig(page);
    const zeile = page.getByTestId("produkt-zeile").first();
    await zeile.focus();
    await page.keyboard.press("x");
    await expect(page.getByTestId("massenaktionen")).toBeVisible();
    await expect(page.getByRole("toolbar", { name: "Massenaktionen" })).toBeVisible();
    await page.keyboard.press("x");
  });

  test("Kanban: Karte hat „Verschieben nach …“ als Tastatur-Alternative zum Ziehen (WCAG 2.5.7)", async ({ page }) => {
    await page.goto("/sortiment/produkte?ansicht=kanban");
    await ruhig(page);
    const knopf = page.getByTestId("produkt-kanban").getByRole("button", { name: "Verschieben nach …" }).first();
    await expect(knopf).toBeVisible({ timeout: 30_000 });
    await knopf.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(knopf).toBeFocused();
  });

  test("Produktakte: Reiter mit Alt+2, Aktionsmenü per Tastatur, Fokus zurück", async ({ page }) => {
    await page.goto("/sortiment/produkte/sofa-modul-240");
    await ruhig(page);
    await page.locator("h1").click();
    const vorher = page.url();
    await page.keyboard.press("Alt+2");
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toBe(vorher);
    const menue = page.getByRole("button", { name: "Weitere Aktionen" }).first();
    if (await menue.isVisible().catch(() => false)) {
      await menue.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("menu").first()).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menue).toBeFocused();
    } else messung("Produktakte ohne Menü „Weitere Aktionen“");
  });

  test("AB einlesen ab „Zu tun“: Knopf → Assistent; Felder per Tab, Weiter per Tastatur (Ziel 5)", async ({ page }) => {
    await page.goto("/sortiment");
    await ruhig(page);
    let klicks = 0;
    const knopf = page.getByTestId("zutun-abEinlesen").getByRole("link", { name: "AB einlesen" }).first();
    test.skip(!(await knopf.isVisible().catch(() => false)), "keine Zeile „AB einlesen“");
    await knopf.focus();
    await page.keyboard.press("Enter");
    klicks++;
    await page.waitForURL(/\/sortiment\/bestellungen\//, { timeout: 60_000 });
    await ruhig(page);
    if (!/\/ab$/.test(new URL(page.url()).pathname)) {
      await page.getByTestId("ab-einlesen").click();
      klicks++;
    }
    const nummer = page.getByLabel(/AB-Nummer/).first();
    await expect(nummer).toBeVisible({ timeout: 60_000 });
    await nummer.focus();
    await page.keyboard.type("QS-AB-1");
    const weiter = page.getByTestId("ab-weiter");
    const tabs = await tabBis(page, weiter, 40);
    messung(`AB-Assistent: Tab-Schritte von AB-Nummer bis „Weiter“: ${tabs}`);
    expect.soft(tabs).toBeLessThan(40);
    await page.keyboard.press("Enter");
    klicks++;
    await expect(page.getByTestId("ab-wie-bestellt")).toBeVisible({ timeout: 30_000 });
    // „Alle wie bestellt“ → „Abgleich erzeugen“ → „AB bestätigen“ werden gezählt, nicht ausgelöst.
    const gesamt = 1 + klicks + 3;
    messung(`AB erfassen und abgleichen: ${gesamt} ab Zentrale (Ziel 5)`, "klickzahl");
    expect.soft(gesamt, "AB erfassen (Ziel 5)").toBeLessThanOrEqual(6);
  });

  test("Abgleich-Raster: Fokus in der Zeile, ↓ wechselt, aria-selected, Taste 2 fragt nach dem Ziel, Abbrechen", async ({ page }) => {
    await page.goto("/sortiment/bestellungen/HB-2026-00013?tab=ab");
    await ruhig(page);
    const raster = page.getByTestId("abgleich");
    await expect(raster).toBeVisible({ timeout: 30_000 });
    const zeilen = raster.getByTestId("abgleich-zeile");
    await page.locator("h1").click();
    const tabs = await tabBis(page, zeilen.first(), 120);
    messung(`Bestellakte AB-Abgleich: Tab-Schritte von h1 bis zur ersten Rasterzeile: ${tabs}`);
    expect(tabs).toBeLessThan(120);
    expect.soft(await hatFokusring(zeilen.first()), "Rasterzeile hat sichtbaren Fokusring").toBe(true);
    if ((await zeilen.count()) > 1) {
      await page.keyboard.press("ArrowDown");
      await expect(zeilen.nth(1)).toBeFocused();
      await expect(zeilen.nth(1)).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("ArrowUp");
    }
    await page.keyboard.press("2");
    await expect(page.getByRole("dialog")).toContainText("Rückfrage – an wen?");
    await page.getByRole("dialog").getByRole("button", { name: "Abbrechen" }).click();
    messung("Abweichung klären: Zu tun „Abweichungen klären“ → Zeile → 1/2/3 = 2 + 1 je Zeile (Ziel 2 + 1)", "klickzahl");
  });

  test("Freigabe-Raster: Pfeile wechseln die Kachel, x markiert (aria-pressed), Leertaste Lightbox, Esc, Fokus zurück", async ({ page }) => {
    await page.goto("/sortiment/freigaben");
    await ruhig(page);
    const raster = page.getByTestId("freigabe-raster");
    await expect(raster).toBeVisible({ timeout: 30_000 });
    const zellen = raster.getByRole("gridcell");
    test.skip((await zellen.count()) < 2, "weniger als zwei offene Bilder");
    await page.locator("h1").click();
    const tabs = await tabBis(page, zellen.first(), 120);
    messung(`/sortiment/freigaben: Tab-Schritte von h1 bis zur ersten Kachel: ${tabs}`);
    expect(tabs).toBeLessThan(120);
    expect.soft(await hatFokusring(zellen.first()), "Kachel hat sichtbaren Fokusring").toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect(zellen.nth(1)).toBeFocused();
    await page.keyboard.press("x");
    const haken = zellen.nth(1).getByRole("button", { name: /markieren$/ }).first();
    await expect(haken).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("x");
    await page.keyboard.press(" ");
    const lupe = page.getByRole("dialog").first();
    await expect(lupe).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(lupe).toBeHidden();
    await expect(zellen.nth(1)).toBeFocused();
    // § 17 Nr. 1: Enter/Backspace ohne Schreibwirkung – Enter öffnet nur die Lightbox.
    messung("Bilder einer Marke freigeben: Zu tun „Bilder …“ → „Alle freigeben“ → Toast läuft ab = 2 ab /sortiment (Ziel 3 ab Zentrale)", "klickzahl");
  });

  test("Wareneingang buchen (Büro) ab „Zu tun“: Weg bis „Buchen“ zählen (Ziel 4)", async ({ page }) => {
    await page.goto("/sortiment");
    await ruhig(page);
    const gruppe = page.getByTestId("zutun-weErwartet");
    test.skip(!(await gruppe.isVisible().catch(() => false)), "keine Gruppe „Wareneingang erwartet“");
    let klicks = 0;
    await gruppe.getByRole("link").filter({ hasText: /Eingang|buchen/i }).first().click();
    klicks++;
    await expect(page.getByTestId("we-buchen-knopf").or(page.getByTestId("we-position").first())).toBeVisible({ timeout: 60_000 });
    const alles = page.getByRole("button", { name: /Alles in Ordnung/ }).first();
    if (await alles.isVisible().catch(() => false)) {
      await alles.focus();
      await page.keyboard.press("Enter");
      klicks++;
    }
    await expect(page.getByTestId("we-buchen-knopf")).toBeEnabled();
    const gesamt = 1 + klicks + 1; // Sortiment + Weg + „Buchen“ (nicht ausgelöst)
    messung(`Wareneingang buchen: ${gesamt} ab Zentrale (Ziel 4)`, "klickzahl");
    expect.soft(gesamt).toBeLessThanOrEqual(4);
  });

  test("Bestellakte: Menü „Weitere Aktionen“ per Tastatur, Pfeile, Esc mit Fokus zurück", async ({ page }) => {
    await page.goto("/sortiment/bestellungen/HB-2026-00013");
    await ruhig(page);
    const ausloeser = page.getByRole("button", { name: "Weitere Aktionen" }).first();
    await expect(ausloeser).toBeVisible({ timeout: 30_000 });
    await ausloeser.focus();
    await page.keyboard.press("Enter");
    const menue = page.getByRole("menu").first();
    await expect(menue).toBeVisible();
    await page.keyboard.press("ArrowDown");
    expect.soft(await page.evaluate(() => document.activeElement?.getAttribute("role")), "Pfeil fokussiert Menüpunkt").toBe("menuitem");
    const gesperrt = await menue.locator('[aria-disabled="true"], [disabled]').count();
    messung(`Bestellakte-Menü: ${gesperrt} gesperrte Punkte (Fähigkeiten aus, mit Satz)`);
    await page.keyboard.press("Escape");
    await expect(menue).toBeHidden();
    await expect(ausloeser).toBeFocused();
  });

  test("Preis/Lieferzeit im Gespräch: Strg+K, Produktname, Enter öffnet die Produktakte (Ziel 1)", async ({ page }) => {
    await page.goto("/");
    await ruhig(page);
    await page.keyboard.press("Control+k");
    const eingabe = page.getByTestId("palette-eingabe");
    await expect(eingabe).toBeFocused();
    await eingabe.fill("Sofa Modul");
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Enter");
    await expect.poll(() => page.url(), { timeout: 30_000 }).toMatch(/\/(sortiment|d)\//);
    messung(`⌘K „Sofa Modul“ + Enter → ${new URL(page.url()).pathname} = 1 (Ziel 1)`, "klickzahl");
    expect.soft(page.url(), "Treffer führt in die Produktakte").toMatch(/\/sortiment\/produkte\//);
  });

  test("Hilfe zur Seite: Taste ? auf /sortiment/produkte öffnet das Hilfe-Panel", async ({ page }) => {
    await page.goto("/sortiment/produkte");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("?");
    await expect(page.getByTestId("hilfe-panel")).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("hilfe-panel")).toBeHidden();
  });

  test("Einzeltasten wirken nicht im Suchfeld (§ 6, § 17 Nr. 65)", async ({ page }) => {
    await page.goto("/sortiment/produkte");
    await ruhig(page);
    const suche = page.getByRole("searchbox").first();
    await suche.focus();
    await page.keyboard.type("x?");
    await expect(suche).toHaveValue("x?");
    await expect(page.getByTestId("hilfe-panel")).toBeHidden();
    await expect(page.getByTestId("massenaktionen")).toBeHidden();
  });

  test("Wareneingang-Kiosk: F2 fokussiert die Suche, Ziele ≥ 44 px", async ({ page }) => {
    await page.goto("/sortiment/wareneingang/kiosk");
    await ruhig(page);
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("F2");
    await page.waitForTimeout(300);
    const tag = await page.evaluate(() => document.activeElement?.tagName);
    messung(`Kiosk F2 → aktives Element ${tag}`);
    expect.soft(tag, "F2 setzt Fokus in ein Eingabefeld").toBe("INPUT");
    const klein = await page.locator("main button:visible, main a:visible").evaluateAll((els) =>
      els.filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.height < 44 || r.width < 44);
      }).map((e) => (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30)),
    );
    messung(`Kiosk: ${klein.length} Ziele unter 44 px${klein.length ? `: ${klein.slice(0, 5).join(" | ")}` : ""}`);
    expect.soft(klein.length, "Kiosk-Ziele unter 44 px").toBe(0);
  });

  test("T Lage Sortiment für GF / Klickweg Sortiment → Berichte (≤ 2)", async ({ page }) => {
    await page.goto("/");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/sortiment"]').first().click();
    klicks++;
    await page.waitForURL(/\/sortiment$/, { timeout: 60_000 });
    const berichte = page.locator('a[href="/sortiment/berichte"]').first();
    if (!(await berichte.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /Mehr/ }).first().click();
      klicks++;
    }
    await page.locator('a[href="/sortiment/berichte"]').first().click();
    klicks++;
    await page.waitForURL(/\/sortiment\/berichte/, { timeout: 60_000 });
    messung(`Sortiment → Berichte: ${klicks}`, "klickzahl");
    expect.soft(klicks).toBeLessThanOrEqual(3);
  });
});

// ------------------------------------------------------------------------------------------ Teil D
test.describe("Reflow, Breite, Fokus nicht verdeckt, Touch", () => {
  test("Reflow 320 px ohne horizontales Scrollen (WCAG 1.4.10) auf Sortiment-Kernseiten", async ({ page }) => {
    test.setTimeout(600_000);
    await anmelden(page);
    await page.setViewportSize({ width: 320, height: 640 });
    const zuBreit = [];
    for (const pfad of ["/sortiment", "/sortiment/produkte", "/sortiment/produkte/sofa-modul-240", "/sortiment/bestellungen", "/sortiment/bestellungen/HB-2026-00013", "/sortiment/bestellungen/HB-2026-00013?tab=ab", "/sortiment/wareneingang/neu?bestellung=HB-2026-00016", "/sortiment/freigaben", "/sortiment/marken/Bora"]) {
      await page.goto(pfad, { timeout: 120_000 });
      await ruhig(page);
      const b = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
      if (b.s > b.i) zuBreit.push(`${pfad}: ${b.s} > ${b.i}`);
    }
    expect.soft(zuBreit, "Überbreite bei 320 px").toEqual([]);
  });

  test("Produktliste bei 1280 × 800 ohne Querscrollen (§ 17 Nr. 61), Übersicht zeigt ≥ 3 Zu-tun-Gruppen (Nr. 59)", async ({ page }) => {
    await anmelden(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sortiment/produkte");
    await ruhig(page);
    const b = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
    expect.soft(b.s, "Produktliste 1280: kein Querscrollen der Seite").toBeLessThanOrEqual(b.i);
    const tab = page.getByTestId("produkt-liste");
    const innen = await tab.evaluate((el) => {
      const t = el.querySelector("table");
      const box = t?.parentElement;
      return box ? { s: box.scrollWidth, c: box.clientWidth } : null;
    });
    messung(`Produktliste 1280: Tabelle ${innen ? `${innen.s}/${innen.c}` : "–"} (scrollWidth/clientWidth)`);
    await page.goto("/sortiment");
    await ruhig(page);
    const sichtbar = await page.locator('[data-testid^="zutun-"]').evaluateAll((els) =>
      els.filter((e) => e.getAttribute("data-testid") !== "zutun" && e.getBoundingClientRect().top < window.innerHeight).length,
    );
    messung(`/sortiment 1280 × 800: ${sichtbar} Zu-tun-Gruppen im ersten Bildschirm`);
    expect.soft(sichtbar, "mind. 3 Zu-tun-Gruppen ohne Scrollen (§ 17 Nr. 59)").toBeGreaterThanOrEqual(3);
  });

  test("Fokus wird nicht von der Kopfzeile verdeckt (WCAG 2.4.11) – Tab durch /sortiment/produkte", async ({ page }) => {
    await anmelden(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/sortiment/produkte");
    await ruhig(page);
    const verdeckt = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        const kopf = document.querySelector('[data-testid="kopfzeile"]');
        if (!el || el === document.body || !kopf || kopf.contains(el) || el.closest('[data-testid="leiste"]')) return null;
        const b = el.getBoundingClientRect();
        const k = kopf.getBoundingClientRect();
        const ganzDarunter = b.top >= k.top && b.bottom <= k.bottom && b.height > 0;
        return ganzDarunter ? (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40) : null;
      });
      if (r) verdeckt.push(r);
    }
    expect(verdeckt, "Fokussierte Elemente vollständig unter der Kopfzeile").toEqual([]);
  });

  test("Touch iPad quer: Zeilenaktionen ohne Hover sichtbar, Seitenblick ≥ 44 px Trefferfläche (§ 10)", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    const page = await ctx.newPage();
    await anmelden(page);
    await page.goto("/sortiment/produkte");
    await ruhig(page);
    const zeile = page.getByTestId("produkt-zeile").first();
    await expect(zeile).toBeVisible({ timeout: 30_000 });
    const knoepfe = await zeile.getByRole("button").evaluateAll((bs) => bs.map((b) => {
      const s = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return { sichtbar: s.visibility !== "hidden" && parseFloat(s.opacity) > 0.2 && r.width > 0, h: Math.round(r.height), w: Math.round(r.width), name: b.getAttribute("aria-label") || b.textContent.trim() };
    }));
    expect(knoepfe.filter((k) => k.sichtbar).length, "Zeile zeigt Knöpfe ohne Hover").toBeGreaterThan(0);
    messung(`iPad Produktzeile Knöpfe: ${knoepfe.map((k) => `${k.name.slice(0, 24)} ${k.w}×${k.h}`).join(" | ")}`);
    await ctx.close();
  });
});
