// Barrierefreiheit, Tastatur und Klickzahlen – Bereich CRM (Team Q3/Q4, MASTER § 2.I, § 5.5; Befunde in
// Marktresearch/digital/backoffice/4x-qa-crm.md). Läuft gegen den Dev-Server im Mock-Modus.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/a11y-crm.spec.js --project=desktop
//
// Teil A  axe (WCAG 2.2 AA, serious/critical = 0, Q-I1, 10-konzept-crm § 17.8 Nr. 3) je CRM-Route, hell und dunkel.
// Teil B  Rollen (CRM-Mitarbeiterin, Faktura, Montage) auf Übersicht und Kundenakte; Glossar-Verbote im DOM (§ 17.8 Nr. 5).
// Teil C  Tastatur-Durchläufe der Top-Aufgaben (§ 1.2) mit Tab-/Klickzählung als Annotation.
// Teil D  Reflow 320 px (WCAG 1.4.10), Fokus nicht verdeckt (WCAG 2.4.11), Kalender als Raster (§ 17.8 Nr. 22).
// Bekannte Lücken stehen als test.fail mit Befundnummer (QC-xx): wird die Lücke geschlossen, meldet Playwright
// „expected to fail“ – dann die Markierung entfernen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SCHEMATA = ["light", "dark"];
const VERBOTEN = /Qualifizieren|Qualifiziert|Posteingang|Trichter|\bPeek\b|\bStudio\b|Folgedokument|Beratungsgespraech|Bestaetigt|Unbestaetigt|Wiedervorlage/;

// Feste Routen (tools/qa/routen/crm.mjs + Navigation aus bereiche/crm.js).
const ROUTEN = [
  "/crm",
  "/crm/anfragen",
  "/crm/anfragen?sicht=neu",
  "/crm/anfragen?ansicht=kanban",
  "/crm/anfragen?q=gibtesnicht",
  "/crm/kontakte",
  "/crm/termine",
  "/crm/termine?ansicht=liste",
  "/crm/termine?ansicht=liste&sicht=ohne-protokoll",
  "/crm/termine/neu",
  "/crm/gespraeche",
  "/crm/berichte",
  "/crm/datenschutz",
  "/crm/einstellungen",
  "/crm/einstellungen?tab=terminarten",
  "/crm/einstellungen?tab=automationen",
  "/posteingang",
];

// Akten: erster Datensatz aus der jeweiligen Liste (Link-Muster).
const AKTEN = [
  ["Anfrage-Akte", "/crm/anfragen?sicht=alle", /^\/crm\/anfragen\/PH-[^/?]+$/],
  ["Kundenakte", "/crm/kontakte", /^\/kunden\/[^/?]+$/],
  ["Termin-Akte", "/crm/termine?ansicht=liste", /^\/crm\/termine\/PH-[^/?]+$/],
  ["Gesprächsprotokoll", "/crm/gespraeche?sicht=alle", /^\/crm\/gespraeche\/[^/?]+$/],
  ["Datenschutzanfrage", "/crm/datenschutz", /^\/crm\/datenschutz\/[^/?]+$/],
];

async function anmelden(page, email = "crm-leitung@demo.local") {
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
    expect.soft(antwort?.status() ?? 0, `HTTP ${pfad}`).toBeLessThan(400);
    await ruhig(page);
    expect.soft(await axeSchwer(page), `axe ${pfad} · ${schema}`).toEqual([]);
  }
}

async function ersterLink(page, liste, muster) {
  await page.goto(liste, { timeout: 120_000 });
  await ruhig(page);
  const hrefs = await page.locator("main a[href]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  return hrefs.find((h) => muster.test(h || "")) || null;
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

// Bekannte axe-Befunde (4x-qa-crm.md). Schlüssel = Route bzw. Aktentitel.
const BEKANNT = {
  "/crm/einstellungen": "QC-02: Verfügbarkeit role=\"table\" ohne role=\"row\" (aria-required-children/-parent, critical)",
  "Anfrage-Akte": "QC-01: Details-Panel – Inline-Felder ohne zugängliche Bezeichnung (label/select-name, critical)",
  Kundenakte: "QC-01: Details-Panel – Inline-Felder ohne zugängliche Bezeichnung (label/select-name, critical)",
};

// ------------------------------------------------------------------------------------------ Teil A
test.describe("A11y CRM – axe je Route, hell und dunkel (Q-I1)", () => {
  let sitzung;
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await anmelden(page, "crm-leitung@demo.local");
    sitzung = await ctx.storageState();
    await ctx.close();
  });

  for (const pfad of ROUTEN) {
    test(`Leitung ${pfad}`, async ({ browser }) => {
      test.fail(!!BEKANNT[pfad], BEKANNT[pfad]);
      const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await pruefeRoute(page, pfad);
      await ctx.close();
    });
  }

  for (const [titel, liste, muster] of AKTEN) {
    test(`Leitung ${titel} (erster Datensatz)`, async ({ browser }) => {
      test.fail(!!BEKANNT[titel], BEKANNT[titel]);
      const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      const href = await ersterLink(page, liste, muster);
      test.skip(!href, `kein Datensatz in ${liste}`);
      messung(`${titel}: ${href}`);
      await pruefeRoute(page, href);
      await ctx.close();
    });
  }

  test("Kundenakte Reiter Aktivität und iPad-Breite (Details als Sheet)", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    const href = await ersterLink(page, "/crm/kontakte", /^\/kunden\/[^/?]+$/);
    test.skip(!href, "kein Kontakt");
    await pruefeRoute(page, `${href}?tab=aktivitaet`);
    await ctx.close();
  });
});

// ------------------------------------------------------------------------------------------ Teil B
test.describe("A11y CRM – Rollen und Glossar (§ 17.8 Nr. 5, Nr. 30)", () => {
  test("CRM-Mitarbeiterin: /crm, /crm/kontakte und Kundenakte hell/dunkel", async ({ page }) => {
    test.fail(true, BEKANNT.Kundenakte);
    test.setTimeout(600_000);
    await anmelden(page, "crm@demo.local");
    await page.setViewportSize({ width: 1440, height: 900 });
    await pruefeRoute(page, "/crm");
    await pruefeRoute(page, "/crm/kontakte");
    const href = await ersterLink(page, "/crm/kontakte", /^\/kunden\/[^/?]+$/);
    if (href) await pruefeRoute(page, href);
    await expect(page.locator("h1")).toHaveCount(1);
  });

  // Konzept § 1.1 / § 17.8 Nr. 30: Faktura und Montage lesen die Kundenakte (eingeschränkt). ph_kontakt.json gibt
  // diesen Rollen kein Leserecht – im Mock erscheint „Keine Berechtigung“ (Befund QC-08). Geprüft wird hier, dass
  // der Sperrzustand selbst barrierefrei ist (axe 0, genau eine Überschrift h1).
  for (const [rolle, email] of [
    ["Faktura", "faktura@demo.local"],
    ["Montage", "montage@demo.local"],
  ]) {
    test(`${rolle}: Kundenakte – Zugriff oder barrierefreier Sperrzustand`, async ({ page }) => {
      test.setTimeout(600_000);
      await anmelden(page, email);
      await page.setViewportSize({ width: 1440, height: 900 });
      await pruefeRoute(page, "/kunden/PH-KON-00001");
      const gesperrt = await page.getByText("Keine Berechtigung").first().isVisible().catch(() => false);
      messung(`${rolle} auf /kunden/PH-KON-00001: ${gesperrt ? "Keine Berechtigung (QC-08)" : "Kundenakte sichtbar"}`);
      expect.soft(await page.locator("h1").count(), `${rolle}: genau eine h1 (QC-09 bei Sperrzustand)`).toBe(1);
    });
  }

  test("Leitung: keine verbotenen Glossar-Wörter im sichtbaren Text aller CRM-Routen", async ({ page }) => {
    test.setTimeout(900_000);
    await anmelden(page);
    const treffer = [];
    for (const pfad of ROUTEN) {
      await page.goto(pfad, { timeout: 120_000 });
      await ruhig(page);
      const text = await page.locator("body").innerText();
      const m = text.match(VERBOTEN);
      if (m) treffer.push(`${pfad}: „${m[0]}“`);
    }
    for (const [titel, liste, muster] of AKTEN) {
      const href = await ersterLink(page, liste, muster);
      if (!href) continue;
      await page.goto(href, { timeout: 120_000 });
      await ruhig(page);
      const m = (await page.locator("body").innerText()).match(VERBOTEN);
      if (m) treffer.push(`${titel} ${href}: „${m[0]}“`);
    }
    expect(treffer).toEqual([]);
  });

  test("Genau eine Überschrift h1 je CRM-Route (Seitenkopf-Muster)", async ({ page }) => {
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
});

// ------------------------------------------------------------------------------------------ Teil C
test.describe("Tastatur und Klickzahlen – Top-Aufgaben CRM (§ 1.2, Q-F)", () => {
  test("T1 Annehmen per Tastatur in „Zu erledigen“ (/crm), Rückgängig erreichbar", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm");
    await ruhig(page);
    const knopf = page.getByTestId("crm-zu-erledigen").getByTestId("crm-zeile-annehmen").first();
    test.skip(!(await knopf.isVisible().catch(() => false)), "keine neue Anfrage in „Zu erledigen“ (Mock-Zustand)");
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    const tabs = await tabBis(page, knopf);
    messung(`/crm: Tab-Schritte bis zum ersten „Annehmen“: ${tabs}`);
    expect(tabs, "Annehmen per Tab erreichbar").toBeLessThan(120);
    expect.soft(await hatFokusring(knopf), "Annehmen hat sichtbaren Fokusring").toBe(true);
    await page.keyboard.press("Enter");
    await expect(page.getByText("Anfrage angenommen").first()).toBeVisible({ timeout: 60_000 });
    messung("T1 Annehmen ab /crm: 1 (Ziel 1)", "klickzahl");
    await expect(page.locator('[aria-live="polite"], [role="status"]').filter({ hasText: /angenommen/i }).first()).toBeAttached();
    const zurueck = page.getByRole("button", { name: "Rückgängig" }).first();
    if (await zurueck.isVisible().catch(() => false)) await zurueck.click();
  });

  test("Anfragen-Liste: Zeile per Tab, Pfeil ab, Leertaste Vorschau, Enter öffnet die Akte", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm/anfragen?sicht=alle");
    await ruhig(page);
    const zeilen = page.getByTestId("crm-anfrage-zeile");
    await expect(zeilen.first()).toBeVisible({ timeout: 30_000 });
    await page.locator("h1").click();
    const tabs = await tabBis(page, zeilen.first());
    messung(`/crm/anfragen: Tab-Schritte von h1 bis zur ersten Zeile: ${tabs}`);
    expect(tabs).toBeLessThan(120);
    expect.soft(await hatFokusring(zeilen.first()), "Tabellenzeile hat sichtbaren Fokusring").toBe(true);
    await page.keyboard.press("ArrowDown");
    await expect(zeilen.nth(1)).toBeFocused();
    await page.keyboard.press(" ");
    await expect(page.getByTestId("crm-vorschau")).toBeVisible();
    const name = await zeilen.nth(1).getAttribute("data-name");
    await zeilen.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/crm/anfragen/${name}`), { timeout: 60_000 });
  });

  test("Zeilenmenü ⋯ per Tastatur: öffnet mit Enter, Pfeile, Esc schließt und Fokus kehrt zurück", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm/anfragen?sicht=alle");
    await ruhig(page);
    const ausloeser = page.getByRole("button", { name: /^Aktionen für / }).first();
    await expect(ausloeser).toBeVisible({ timeout: 30_000 });
    await ausloeser.focus();
    await page.keyboard.press("Enter");
    const menue = page.getByRole("menu").first();
    await expect(menue).toBeVisible();
    await page.keyboard.press("ArrowDown");
    const aktiv = await page.evaluate(() => document.activeElement?.getAttribute("role"));
    expect.soft(aktiv, "Pfeiltaste setzt Fokus auf einen Menüpunkt").toBe("menuitem");
    await page.keyboard.press("Escape");
    await expect(menue).toBeHidden();
    await expect(ausloeser).toBeFocused();
  });

  test("T2 Spam – Klickweg ab /crm über Anfragen → ⋯ → Spam (ohne Ausführen)", async ({ page }) => {
    test.fail(true, "QC-04: „Zu erledigen“-Zeilen haben kein Menü ⋯ – Spam braucht 3 statt 2 Klicks");
    await anmelden(page);
    await page.goto("/crm");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/crm/anfragen"]').first().click();
    klicks++;
    await expect(page.getByTestId("crm-anfragen-liste").or(page.getByTestId("crm-anfragen-leer"))).toBeVisible({ timeout: 60_000 });
    const neu = page.getByTestId("crm-anfrage-zeile").filter({ has: page.getByTestId("crm-zeile-annehmen") }).first();
    test.skip(!(await neu.isVisible().catch(() => false)), "keine neue Anfrage");
    await neu.getByRole("button", { name: /^Aktionen für / }).click();
    klicks++;
    await expect(page.getByRole("menuitem", { name: /Spam/ })).toBeVisible();
    const gesamt = klicks + 1;
    messung(`T2 Spam: ${gesamt} ab /crm (Konzept 2 ab Zentrale „Zu erledigen“ → ⋯)`, "klickzahl");
    await page.keyboard.press("Escape");
    expect.soft(gesamt, "T2 Spam (Ziel 2)").toBeLessThanOrEqual(2);
  });

  test("Neue Anfrage: Dialog per Tastatur, Fokus im Dialog, Esc schließt, Fokus zurück", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm/anfragen");
    await ruhig(page);
    const knopf = page.getByTestId("crm-neue-anfrage-knopf");
    await knopf.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByTestId("crm-neue-anfrage");
    await expect(dialog).toBeVisible();
    const drin = await dialog.evaluate((d) => d.contains(document.activeElement));
    expect(drin, "Fokus liegt im Dialog").toBe(true);
    // Fokusfalle: 40 Tab-Schritte bleiben im Dialog. Nativer <dialog> (showModal) lässt Tab kurz in die
    // Browserleiste (activeElement = body) – das ist Plattformverhalten; gezählt wird nur Fokus auf Seiteninhalt.
    let raus = 0;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const ausserhalb = await dialog.evaluate((d) => {
        const a = document.activeElement;
        return !!a && a !== document.body && a !== document.documentElement && !d.contains(a);
      });
      if (ausserhalb) raus++;
    }
    expect.soft(raus, "Tab verlässt den Dialog nicht (Fokus auf Seiteninhalt außerhalb)").toBe(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(knopf).toBeFocused();
  });

  test("T3/A1 Termin anlegen aus der Kundenakte per Tastatur (Slot, Esc ohne Anlegen)", async ({ page }) => {
    test.fail(true, "QC-05: nach Esc im Assistenten A1 kehrt der Fokus nicht auf den Glas-Knopf „Termin“ zurück (WCAG 2.4.3)");
    await anmelden(page);
    const href = await ersterLink(page, "/crm/kontakte", /^\/kunden\/[^/?]+$/);
    test.skip(!href, "kein Kontakt");
    await page.goto(href, { timeout: 120_000 });
    await ruhig(page);
    const knopf = page.getByTestId("crm-akte-termin");
    await knopf.focus();
    await page.keyboard.press("Enter");
    const a1 = page.getByTestId("crm-a1");
    await expect(a1).toBeVisible();
    const slot = a1.getByTestId("crm-slots").locator("button[data-slot]").first();
    await expect(slot).toBeVisible({ timeout: 30_000 });
    const tabs = await tabBis(page, slot, 60);
    messung(`A1: Tab-Schritte vom Dialogstart bis zum ersten Slot: ${tabs}`);
    expect.soft(tabs, "Slot per Tab erreichbar").toBeLessThan(60);
    await page.keyboard.press("Enter");
    await expect(slot).toHaveAttribute("aria-pressed", "true").catch(() => {});
    await page.keyboard.press("Escape");
    await expect(a1).toBeHidden();
    await expect(knopf).toBeFocused();
  });

  test("Kundenakte: Reiter mit Alt+2 (Konzept § 4.3 Alt+1…6)", async ({ page }) => {
    await anmelden(page);
    const href = await ersterLink(page, "/crm/kontakte", /^\/kunden\/[^/?]+$/);
    test.skip(!href, "kein Kontakt");
    await page.goto(href, { timeout: 120_000 });
    await ruhig(page);
    await page.locator("h1").click();
    const vorher = page.url();
    await page.keyboard.press("Alt+2");
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toBe(vorher);
  });

  test("T8 „Wie steht es?“ – CRM → Kunden & Kontakte → Zeile: 3", async ({ page }) => {
    await anmelden(page);
    await page.goto("/");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/crm"]').first().click();
    klicks++;
    await page.waitForURL(/\/crm$/, { timeout: 60_000 });
    await page.locator('a[href="/crm/kontakte"]').first().click();
    klicks++;
    const zeile = page.getByTestId("crm-kontakt-zeile").first();
    await expect(zeile).toBeVisible({ timeout: 60_000 });
    await zeile.getByRole("link").first().click();
    klicks++;
    await expect(page.getByTestId("crm-kundenakte")).toBeVisible({ timeout: 120_000 });
    messung(`T8 Wie steht es: ${klicks} (Ziel 3)`, "klickzahl");
    expect.soft(klicks).toBeLessThanOrEqual(3);
  });

  test("T15 Wochenauswertung – CRM → Berichte: 2", async ({ page }) => {
    test.fail(true, "QC-06: Berichte liegt unter „Mehr“ – 3 statt 2 Klicks");
    await anmelden(page, "gf@demo.local");
    await page.goto("/");
    await ruhig(page);
    let klicks = 0;
    await page.locator('a[href="/crm"]').first().click();
    klicks++;
    await page.waitForURL(/\/crm$/, { timeout: 60_000 });
    const berichte = page.locator('a[href="/crm/berichte"]').first();
    if (!(await berichte.isVisible().catch(() => false))) {
      // Reiter „Mehr“ öffnen (max. sechs Reiter sichtbar)
      await page.getByRole("button", { name: /Mehr/ }).first().click();
      klicks++;
    }
    await page.locator('a[href="/crm/berichte"]').first().click();
    klicks++;
    await expect(page.getByTestId("crm-berichte")).toBeVisible({ timeout: 60_000 });
    messung(`T15 Wochenauswertung (GF): ${klicks} (Ziel 2)`, "klickzahl");
    expect.soft(klicks).toBeLessThanOrEqual(2);
  });

  test("T12 Verfügbarkeit – CRM → Einstellungen (Reiter Verfügbarkeit zuerst): Weg bis zur Tabelle", async ({ page }) => {
    test.fail(true, "QC-06: Einstellungen liegt unter „Mehr“ – 5 statt 4 Klicks");
    await anmelden(page);
    await page.goto("/crm");
    await ruhig(page);
    let klicks = 0;
    const einst = page.locator('a[href="/crm/einstellungen"]').first();
    if (!(await einst.isVisible().catch(() => false))) {
      await page.getByRole("button", { name: /Mehr/ }).first().click();
      klicks++;
    }
    await page.locator('a[href="/crm/einstellungen"]').first().click();
    klicks++;
    await expect(page.getByTestId("crm-verfuegbarkeit")).toBeVisible({ timeout: 60_000 });
    const gesamt = 1 + klicks + 2; // CRM + Navigation + Zelle + Speichern
    messung(`T12 Verfügbarkeit: ${gesamt} (Ziel 4; Bearbeiten über generisches Formular laut Übergabe B-CRM)`, "klickzahl");
    expect.soft(gesamt).toBeLessThanOrEqual(4);
  });

  test("T13 Widerspruch erfassen – Kundenakte → ⋯ → Widerspruch (Menüpunkt per Tastatur erreichbar)", async ({ page }) => {
    await anmelden(page);
    const href = await ersterLink(page, "/crm/kontakte", /^\/kunden\/[^/?]+$/);
    test.skip(!href, "kein Kontakt");
    await page.goto(href, { timeout: 120_000 });
    await ruhig(page);
    const menueKnopf = page.getByTestId("crm-kundenakte-menue");
    await menueKnopf.focus();
    await page.keyboard.press("Enter");
    const punkt = page.getByRole("menuitem", { name: /Widerspruch/ });
    await expect(punkt).toBeVisible();
    messung("T13 Widerspruch erfassen ab Akte: ⋯ → Punkt → Quelle → Erfassen = 4 (Ziel 4)", "klickzahl");
    await page.keyboard.press("Escape");
  });

  test("T16 Telefon-Anfrage über Kopfzeile [+ Anruf] – Befund QC-03", async ({ page }) => {
    test.fail(true, "QC-03: Telefonnotiz-Schnellanlage (Kopfzeile „+ Anruf“) noch nicht gebaut (Übergabe B-CRM § 4.7)");
    await anmelden(page);
    await page.goto("/crm");
    await ruhig(page);
    await expect(page.getByRole("button", { name: /Anruf/ }).first()).toBeVisible({ timeout: 8_000 });
  });

  test("Hilfe zur Seite: Taste ? auf /crm/anfragen öffnet das Hilfe-Panel", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm/anfragen");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("?");
    await expect(page.getByTestId("hilfe-panel")).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("hilfe-panel")).toBeHidden();
  });

  test("Kontakt-Suche: Strg+K, Name, Enter öffnet die Kundenakte (T8 mit ⌘K)", async ({ page }) => {
    await anmelden(page);
    const href = await ersterLink(page, "/crm/kontakte", /^\/kunden\/[^/?]+$/);
    test.skip(!href, "kein Kontakt");
    const name = "Muster"; // häufigster Nachname im Mock-Seed (Laura Muster)
    await page.goto("/");
    await ruhig(page);
    await page.keyboard.press("Control+k");
    const eingabe = page.getByTestId("palette-eingabe");
    await expect(eingabe).toBeFocused();
    await eingabe.fill(name);
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 20_000 });
    await page.keyboard.press("Enter");
    await expect.poll(() => page.url(), { timeout: 30_000 }).toMatch(/\/(kunden|crm|d)\//);
    messung(`T8 mit ⌘K: Tippen „${name}“ + Enter = 1`, "klickzahl");
  });
});

// ------------------------------------------------------------------------------------------ Teil D
test.describe("Reflow, Fokus nicht verdeckt, Kalender", () => {
  test("Reflow 320 px ohne horizontales Scrollen (WCAG 1.4.10) auf CRM-Kernseiten", async ({ page }) => {
    test.fail(true, "QC-10: /posteingang ist bei 320 px 650 px breit (Segment-Leiste bricht nicht um)");
    test.setTimeout(600_000);
    await anmelden(page);
    await page.setViewportSize({ width: 320, height: 640 });
    const pfade = ["/crm", "/crm/anfragen", "/crm/kontakte", "/crm/termine?ansicht=liste", "/crm/gespraeche", "/crm/datenschutz", "/posteingang"];
    const href = await ersterLink(page, "/crm/kontakte", /^\/kunden\/[^/?]+$/);
    if (href) pfade.push(href);
    for (const pfad of pfade) {
      await page.goto(pfad, { timeout: 120_000 });
      await ruhig(page);
      const b = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
      expect.soft(b.s, `Überbreite bei 320 px auf ${pfad}`).toBeLessThanOrEqual(b.i);
    }
  });

  test("Fokus wird nicht von der Kopfzeile verdeckt (WCAG 2.4.11) – Tab durch /crm/anfragen", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm/anfragen?sicht=alle");
    await ruhig(page);
    const verdeckt = [];
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(60);
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        const kopf = document.querySelector('[data-testid="kopfzeile"]');
        if (!el || el === document.body || !kopf || kopf.contains(el) || el.closest('[data-testid="leiste"]')) return null;
        // Sprunglink liegt beim Fokussieren absichtlich oben über der Kopfzeile (nicht verdeckt).
        if ((el.getAttribute("href") || "").startsWith("#")) return null;
        const b = el.getBoundingClientRect();
        const k = kopf.getBoundingClientRect();
        const ganzDarunter = b.top >= k.top && b.bottom <= k.bottom && b.height > 0;
        return ganzDarunter ? (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40) : null;
      });
      if (r) verdeckt.push(r);
    }
    expect(verdeckt, "Fokussierte Elemente vollständig unter der Kopfzeile").toEqual([]);
  });

  test("Kalender: role=grid, Ereignisse mit aria-label (§ 17.8 Nr. 22)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/crm/termine");
    await ruhig(page);
    await expect(page.getByTestId("crm-termine-kalender")).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[role="grid"]').first()).toBeAttached();
    const ohne = await page.getByTestId("crm-termine-kalender").locator("[data-ereignis], [data-termin]").evaluateAll((els) =>
      els.filter((e) => !(e.getAttribute("aria-label") || "").trim()).length,
    );
    expect.soft(ohne, "Kalender-Ereignisse ohne aria-label").toBe(0);
  });

  test("Touch: Zeilenaktionen nicht nur per Hover (§ 17.8 Nr. 14) – iPad quer", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    const page = await ctx.newPage();
    await anmelden(page);
    await page.goto("/crm/anfragen?sicht=alle");
    await ruhig(page);
    const zeile = page.getByTestId("crm-anfrage-zeile").first();
    await expect(zeile).toBeVisible({ timeout: 30_000 });
    const sichtbar = await zeile.getByRole("button").evaluateAll((bs) => bs.filter((b) => {
      const s = getComputedStyle(b);
      return s.visibility !== "hidden" && parseFloat(s.opacity) > 0.2 && b.getBoundingClientRect().width > 0;
    }).length);
    expect(sichtbar, "Zeile zeigt Knöpfe ohne Hover").toBeGreaterThan(0);
    await ctx.close();
  });
});
