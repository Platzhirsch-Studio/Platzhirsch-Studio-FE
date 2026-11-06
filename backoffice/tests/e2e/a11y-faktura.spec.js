// Barrierefreiheit, Tastatur und Klickzahlen – Bereich Faktura (Team Q3/Q4, MASTER § 2.I, § 5.5, DoD § 6.1/6.2;
// Konzept 10-konzept-faktura § 1.2, § 2.2, § 13.2 U-01/U-04/U-13). Befunde: Marktresearch/digital/backoffice/4x-qa-faktura.md.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/a11y-faktura.spec.js --project=desktop
//
// Teil A  axe (WCAG 2.2 AA, serious/critical = 0) je Faktura-Route, hell und dunkel, als Faktura-Leitung.
// Teil B  Rollen: Steuerberatung (Export-Start, Bank lesend), Geschäftsführung (Start).
// Teil C  Tastatur-Durchläufe der Top-Aufgaben (§ 2.2) – öffnen nur Dialoge, bestätigen nichts (Mock bleibt unverändert).
// Teil D  Klickzahlen § 1.2 ab Zentrale (Zählregel: Klick/Enter/„Weiter“ je 1, Feldeingaben 0); die letzte
//         bestätigende Aktion wird gezählt, aber nicht ausgelöst.
// Teil E  Reflow 320 px, Fokus nicht unter der Kopfzeile, Dialog: Fokus bleibt drin, Esc gibt Fokus zurück.
// Bekannte Lücken stehen als test.fail mit Befundnummer (QF-xx): wird die Lücke geschlossen, meldet Playwright
// „expected to fail“ – dann die Markierung entfernen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SCHEMATA = ["light", "dark"];

// Navigation (bereiche/faktura.js) + feste Kernseiten (tools/qa/routen/faktura.mjs).
const ROUTEN = [
  "/faktura",
  "/faktura?cockpit=vertrieb",
  "/faktura/angebote",
  "/faktura/angebote?ansicht=kanban",
  "/faktura/auftraege",
  "/faktura/rechnungen",
  "/faktura/rechnungen?r=offene-posten",
  "/faktura/rechnungen?r=entwuerfe",
  "/faktura/bank",
  "/faktura/bank/importe",
  "/faktura/eingangsrechnungen",
  "/faktura/eingangsrechnungen?ansicht=kanban",
  "/faktura/eingangsrechnungen?r=kosten",
  "/faktura/gutschriften",
  "/faktura/mahnungen",
  "/faktura/zahllauf",
  "/faktura/export",
  "/faktura/uva",
  "/faktura/abschluss",
  "/faktura/berichte/uebersicht",
  "/faktura/berichte/projektkosten",
  "/faktura/journal",
  "/faktura/stammdaten",
  "/faktura/stammdaten?tab=mahnwesen",
  "/faktura/rechnungen/RE-2026-00042",
  "/faktura/rechnungen/RE-2026-00042?tab=zahlung",
  "/faktura/rechnungen/ENTW-2026-00009",
  "/faktura/rechnungen/ENTW-2026-00006",
  "/faktura/rechnungen/RE-2026-00051",
  "/faktura/angebote/AN-2026-00088",
  "/faktura/angebote/AN-2026-00084?tab=positionen",
  "/faktura/auftraege/AB-2026-00017",
  "/faktura/auftraege/AB-2026-00012",
  "/faktura/auftraege/AB-2026-00015/abrechnen?art=schluss",
  "/faktura/auftraege/AB-2026-00016/abrechnen?art=teil",
  "/faktura/gutschriften/GU-2026-00003",
  "/faktura/mahnungen/MA-2026-00021",
  "/faktura/eingangsrechnungen/ER-2026-00021?tab=kosten",
  "/faktura/eingangsrechnungen/ER-2026-00026?tab=kosten",
  "/faktura/eingangsrechnungen/ER-2026-00023?tab=kosten",
  "/faktura/export/EX-2026-0010",
];

async function anmelden(page, email = "faktura@demo.local") {
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
  await page.waitForFunction(() => document.readyState === "complete");
  // Einblendungen und hochzählende Zahlen (≤ 600 ms) abwarten, damit axe Endfarben misst und Klicks hydriert landen.
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

/** Tab bis ein Element den Fokus hat; liefert die Zahl der Tab-Schritte (oder max). */
async function tabBis(page, locator, max = 80) {
  let n = 0;
  for (; n < max; n++) {
    if (await locator.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)).catch(() => false)) break;
    await page.keyboard.press("Tab");
  }
  return n;
}

const messung = (text) => test.info().annotations.push({ type: "messung", description: text });
const klickzahl = (text) => test.info().annotations.push({ type: "klickzahl", description: text });

// ------------------------------------------------------------------------------------------ Teil A
test.describe("A11y Faktura – axe je Route, hell und dunkel (U-13, Q-I1)", () => {
  let sitzung;
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await anmelden(page, "faktura@demo.local");
    sitzung = await ctx.storageState();
    await ctx.close();
  });

  for (const pfad of ROUTEN) {
    test(`Leitung ${pfad}`, async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await pruefeRoute(page, pfad);
      await expect.soft(page.locator("h1"), `genau eine h1 auf ${pfad}`).toHaveCount(1);
      await ctx.close();
    });
  }
});

// ------------------------------------------------------------------------------------------ Teil B
test.describe("A11y Faktura – Rollen (§ 1.1, U-18)", () => {
  test("Steuerberatung: Export-Start und Bank lesend, axe hell/dunkel", async ({ page }) => {
    await anmelden(page, "buchhaltung@demo.local");
    await page.goto("/faktura");
    await expect(page).toHaveURL(/\/faktura\/export/);
    await pruefeRoute(page, "/faktura/export");
    await pruefeRoute(page, "/faktura/bank");
    await expect(page.getByTestId("bank-liste").getByRole("button", { name: "Zuordnen" })).toHaveCount(0);
  });

  test("Geschäftsführung: /faktura hell/dunkel", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await pruefeRoute(page, "/faktura");
  });
});

// ------------------------------------------------------------------------------------------ Teil C
test.describe("Tastatur – Top-Aufgaben Faktura (§ 2.2, U-04)", () => {
  test("Sprunglink ist erster Tabstopp und führt in den Inhalt", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura");
    await ruhig(page);
    await page.keyboard.press("Tab");
    const erster = page.locator(":focus");
    await expect(erster).toHaveText(/Zum Inhalt springen/);
    await page.keyboard.press("Enter");
    await expect(page.locator("#bo-inhalt")).toBeFocused();
  });

  test("Zu tun: Zeile per Tab erreichbar, sichtbarer Fokusring, ⇧↵ löst die Zeilenaktion aus", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura");
    await ruhig(page);
    const zeile = page.getByTestId("faktura-zutun").locator("[data-zutun-zeile]").first();
    await expect(zeile).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter"); // Sprunglink → Inhalt
    const tabs = await tabBis(page, zeile);
    messung(`Tab-Schritte vom Inhaltsanfang bis zur ersten Zu-tun-Zeile: ${tabs}`);
    expect(tabs).toBeLessThan(80);
    await zeile.focus();
    const ring = await zeile.evaluate((el) => {
      const s = getComputedStyle(el);
      return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
    });
    expect.soft(ring, "Zu-tun-Zeile hat sichtbaren Fokusring").toBe(true);
    const vorher = page.url();
    await page.keyboard.press("Shift+Enter");
    // Wirkung: Dialog/Sheet geht auf oder die Seite wechselt zur Aktion
    await expect
      .poll(async () => (await page.locator('[role="dialog"], [role="alertdialog"]').count()) > 0 || page.url() !== vorher, { timeout: 15_000 })
      .toBe(true);
    await page.keyboard.press("Escape");
  });

  test("Bank: Enter auf der Zeile öffnet nur den Peek, Esc schließt, Fokus kehrt zur Zeile zurück (F-33)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/bank?r=offen");
    await ruhig(page);
    const zeile = page.getByTestId("bank-liste").locator("tbody tr").first();
    test.skip(!(await zeile.count()), "Keine offenen Bankumsätze im Bestand.");
    await zeile.focus();
    const id = await zeile.getAttribute("data-testid");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("peek")).toBeVisible();
    await expect(page.getByTestId(id)).toBeVisible(); // nichts gebucht
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("peek")).toBeHidden();
    await expect.soft(page.getByTestId(id), "Fokus zurück auf der Zeile").toBeFocused();
  });

  test("Liste: ⇧↵ auf einer Rechnungszeile öffnet die Zeilenaktion (Zahlung erfassen)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen?r=offen");
    await ruhig(page);
    const zeile = page.getByTestId("rechnungen-liste").locator("tbody tr").filter({ has: page.getByRole("button", { name: "Zahlung erfassen" }) }).first();
    test.skip(!(await zeile.count()), "Keine offene Rechnung im Bestand.");
    await zeile.focus();
    await page.keyboard.press("Shift+Enter");
    await expect(page.getByTestId("zahlung-dialog")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("zahlung-dialog")).toBeHidden();
  });

  test("Liste: Umschalt+Z auf einer Rechnungszeile öffnet „Zahlung erfassen“ (§ 2.2) – Befund QF-T1", async ({ page }) => {
    test.fail(true, "QF-T1: Register kennt faktura.zahlung (Umschalt+Z), die Liste bindet nur liste.primaer/auswaehlen");
    await anmelden(page);
    await page.goto("/faktura/rechnungen?r=offen");
    await ruhig(page);
    const zeile = page.getByTestId("rechnungen-liste").locator("tbody tr").filter({ has: page.getByRole("button", { name: "Zahlung erfassen" }) }).first();
    await zeile.focus();
    await page.keyboard.press("Shift+Z");
    await expect(page.getByTestId("zahlung-dialog")).toBeVisible({ timeout: 5_000 });
  });

  test("Dialog „Zahlung erfassen“: Fokus startet im Dialog, Tab bleibt im Dialog, Esc gibt Fokus an den Auslöser zurück", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen?r=offen");
    await ruhig(page);
    const knopf = page.getByTestId("rechnungen-liste").getByRole("button", { name: "Zahlung erfassen" }).first();
    test.skip(!(await knopf.count()), "Keine offene Rechnung im Bestand.");
    await knopf.focus();
    await page.keyboard.press("Enter");
    const dlg = page.getByTestId("zahlung-dialog");
    await expect(dlg).toBeVisible();
    await expect.poll(() => dlg.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    // Natives <dialog showModal>: nach dem letzten Element darf der Fokus kurz in die Browser-Oberfläche
    // (activeElement = body) – aber nie auf ein Element der Seite hinter dem Dialog.
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const ort = await dlg.evaluate((el) => (el.contains(document.activeElement) ? "dialog" : document.activeElement === document.body || !document.activeElement ? "browser" : `seite: ${document.activeElement.tagName} ${(document.activeElement.textContent || "").trim().slice(0, 30)}`));
      expect(ort, `Fokus nach ${i + 1}× Tab`).not.toMatch(/^seite/);
    }
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
    await expect.soft(knopf, "Fokus zurück am Auslöser").toBeFocused();
  });

  test("Dialog: Enter in den ersten 300 ms nach dem Öffnen bewirkt nichts (U-07)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen?r=offen");
    await ruhig(page);
    const knopf = page.getByTestId("rechnungen-liste").getByRole("button", { name: "Zahlung erfassen" }).first();
    test.skip(!(await knopf.count()), "Keine offene Rechnung im Bestand.");
    await knopf.focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter"); // sofort
    const dlg = page.getByTestId("zahlung-dialog");
    await expect(dlg).toBeVisible();
    await expect(dlg).not.toContainText(/gebucht/i);
    await page.keyboard.press("Escape");
  });

  test("Akte: ⌘↵ (Strg+Enter) löst die Primäraktion der Rechnung aus", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen/RE-2026-00042");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("Control+Enter");
    // Primäraktion RE-2026-00042 = „Mahnen (Stufe 2)“ → Mahnen-Sheet (versteckte Sitzungs-Dialoge ausgenommen)
    await expect(page.locator('[role="dialog"]:visible, [role="alertdialog"]:visible, [data-testid="mahnen-sheet"]:visible').first()).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
  });

  test("Akte: Aktionsmenü ⋯ per Tastatur öffnen und mit Pfeiltasten bewegen, Esc schließt", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen/RE-2026-00042");
    await ruhig(page);
    const menue = page.getByTestId("akte-menue");
    await menue.focus();
    await page.keyboard.press("Enter");
    const punkte = page.getByRole("menuitem");
    await expect(punkte.first()).toBeVisible();
    messung(`Akte RE-2026-00042: ${await punkte.count()} Menüpunkte im ⋯`);
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("role"))).toBe("menuitem");
    await page.keyboard.press("Escape");
    await expect(punkte.first()).toBeHidden();
  });

  test("Akte: Reiter sind eine Link-Gruppe (nav + aria-current), per Tab erreichbar, Enter wechselt", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen/RE-2026-00042");
    await ruhig(page);
    // Segment als Link-Gruppe (Segment.js): reines GET, aria-current="page" am aktiven Reiter
    const gruppe = page.locator("main nav, #bo-inhalt nav").filter({ has: page.getByRole("link", { name: /^Verlauf/ }) }).first();
    const reiter = gruppe.getByRole("link");
    const anzahl = await reiter.count();
    messung(`Akte RE-2026-00042: ${anzahl} Reiter (Ziel 5, U-16)`);
    expect.soft(anzahl).toBe(5);
    await expect(gruppe.locator('[aria-current="page"]')).toHaveCount(1);
    await reiter.nth(1).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/tab=/, { timeout: 15_000 });
  });

  test("Akte: Alt+2 wechselt den Reiter (§ 2.2) – Befund QF-T2", async ({ page }) => {
    test.fail(true, "QF-T2: Alt+1…5 für Akte-Reiter ist im Konzept verbindlich, aber nicht gebunden");
    await anmelden(page);
    await page.goto("/faktura/rechnungen/RE-2026-00042");
    await ruhig(page);
    const vorher = page.url();
    await page.locator("h1").click();
    await page.keyboard.press("Alt+2");
    await expect.poll(() => page.url(), { timeout: 5_000 }).not.toBe(vorher);
  });

  test("Kürzel wirken nicht im Eingabefeld (U-04): Umschalt+M im Suchfeld tippt nur", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/rechnungen");
    await ruhig(page);
    const feld = page.locator('#bo-inhalt input[placeholder*="Nummer"]:visible').first();
    test.skip(!(await feld.count()), "Kein Suchfeld auf der Liste.");
    await feld.focus();
    await page.keyboard.press("Shift+M");
    await expect(feld).toHaveValue(/M/);
    await expect(page.getByTestId("mahnen-sheet")).toHaveCount(0);
  });
});

// ------------------------------------------------------------------------------------------ Teil D
test.describe("Klickzahlen Top-Aufgaben § 1.2 (U-01) – ab Zentrale, ohne Suche", () => {
  /** Von der Zentrale über die Leiste nach /faktura (1 Klick). */
  async function zurFaktura(page) {
    await page.goto("/");
    await ruhig(page);
    await page.locator('a[href="/faktura"]').first().click();
    await page.waitForURL(/\/faktura(\?|$)/);
    await ruhig(page);
    return 1;
  }
  function zutunKnopf(page, satz) {
    return page.getByTestId("faktura-zutun").locator("[data-zutun-zeile]").filter({ hasText: satz }).first().locator("a.bo-knopf, button.bo-knopf, a[class*=bo-knopf], button[class*=bo-knopf]").first();
  }

  test("Anzahlung anfordern – Ziel 2 (Zu-tun-Zeile → Dialog „Rechnung stellen“)", async ({ page }) => {
    await anmelden(page);
    let k = await zurFaktura(page);
    // Anzahlungs-Zeilen stehen (je nach Bestand) im Cockpit Vertrieb; der Umschalter zählt als Klick.
    if (!(await zutunKnopf(page, /Anzahlung|noch nicht angefordert/).count())) {
      await page.getByTestId("cockpit").getByRole("link", { name: "Vertrieb" }).click();
      k++;
      await page.waitForURL(/cockpit=vertrieb/);
      await ruhig(page);
    }
    const knopf = zutunKnopf(page, /Anzahlung|noch nicht angefordert/);
    test.skip(!(await knopf.count()), "Keine Anzahlungs-Zeile im Zu tun.");
    await knopf.click();
    k++;
    const dlg = page.getByTestId("anzahlung-dialog").or(page.getByTestId("stellen-dialog"));
    await expect(dlg.first()).toBeVisible({ timeout: 15_000 });
    const gesamt = k + 1; // + Stellen
    klickzahl(`Anzahlung anfordern: ${gesamt} ab Zentrale (Ziel 2 ab Zu tun = ${gesamt - 1} ab /faktura)`);
    expect.soft(gesamt - 1, "Klicks ab Zu tun (Ziel 2)").toBeLessThanOrEqual(2);
    await page.keyboard.press("Escape");
  });

  test("Mahnen – Ziel 4 (Faktura → Zu tun „Mahnen“ → „n Mahnungen senden“ → Rückfrage)", async ({ page }) => {
    await anmelden(page);
    let k = await zurFaktura(page);
    const knopf = zutunKnopf(page, /mahnbar/);
    test.skip(!(await knopf.count()), "Keine Mahnen-Zeile im Zu tun.");
    await knopf.click();
    k++;
    const sheet = page.getByTestId("mahnen-sheet");
    await expect(sheet).toBeVisible({ timeout: 15_000 });
    const senden = sheet.getByTestId("mahnen-senden");
    await expect(senden).toBeVisible();
    const gesamt = k + 2; // „n Mahnungen senden“ + Rückfrage „Senden“
    klickzahl(`Mahnen: ${gesamt} (Ziel 4)`);
    expect.soft(gesamt).toBeLessThanOrEqual(4);
    await page.keyboard.press("Escape");
  });

  test("ER freigeben – Ziel 2 ab Zu tun (Zeile → „Freigeben“, Undo 8 s)", async ({ page }) => {
    await anmelden(page);
    let k = await zurFaktura(page);
    const knopf = page.getByTestId("faktura-zutun").getByRole("button", { name: "Freigeben" }).first();
    test.skip(!(await knopf.count()), "Keine freigabebereite Eingangsrechnung im Zu tun.");
    k++; // „Freigeben“ ist der Zeilenknopf selbst (verzögerter Commit, hier nicht gedrückt)
    klickzahl(`ER freigeben: ${k} ab Zentrale, ${k - 1} ab Zu tun (Ziel 2)`);
    expect.soft(k - 1).toBeLessThanOrEqual(2);
  });

  test("Monatsexport – Ziel 3 (Zu tun „Export“ → Sheet „Erzeugen“ → Rückfrage)", async ({ page }) => {
    await anmelden(page);
    let k = await zurFaktura(page);
    const knopf = zutunKnopf(page, /an Kanzlei/);
    test.skip(!(await knopf.count()), "Keine Export-Zeile im Zu tun (Vormonat schon exportiert).");
    await knopf.click();
    k++;
    await expect(page.getByTestId("export-sheet")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("export-erzeugen")).toBeVisible();
    const gesamt = k + 2 - 1; // + Erzeugen + Rückfrage, ab Zu tun gezählt
    klickzahl(`Monatsexport: ${gesamt} ab Zu tun (Ziel 3)`);
    expect.soft(gesamt).toBeLessThanOrEqual(3);
    await page.keyboard.press("Escape");
  });

  test("Bankumsatz zuordnen – Ziel 2 (Bank-Pille → Zeilenknopf „Zuordnen“)", async ({ page }) => {
    await anmelden(page);
    let k = await zurFaktura(page);
    await page.locator('a[href="/faktura/bank"]').first().click();
    k++;
    await page.waitForURL(/\/faktura\/bank/);
    await ruhig(page);
    const knopf = page.getByTestId("bank-liste").getByRole("button", { name: "Zuordnen", exact: true }).first();
    test.skip(!(await knopf.count()), "Kein sicherer Vorschlag offen.");
    await expect(knopf).toBeVisible();
    klickzahl(`Bank zuordnen: ${k + 1} ab Zentrale, ${k} ab /faktura (Ziel 2)`);
    expect.soft(k).toBeLessThanOrEqual(2);
  });

  test("Angebot → Auftrag – Ziel 3 (Angebot → „Als Auftrag übernehmen“ → „Auftrag anlegen“)", async ({ page }) => {
    await anmelden(page);
    await page.goto("/faktura/angebote/AN-2026-00088");
    await ruhig(page);
    let k = 1; // Angebot geöffnet
    const start = page.getByTestId("uebernehmen-start").or(page.getByTestId("akte-primaer")).first();
    await start.click();
    k++;
    const dlg = page.getByTestId("uebernehmen-dialog").or(page.getByTestId("annehmen-dialog"));
    await expect(dlg.first()).toBeVisible({ timeout: 15_000 });
    const art = (await page.getByTestId("uebernehmen-dialog").count()) ? "Übernehmen" : "Annehmen (vor Übernehmen)";
    const gesamt = k + 1;
    klickzahl(`Angebot → Auftrag ab Angebot: ${gesamt} (Ziel 3), erster Dialog: ${art}`);
    expect.soft(gesamt).toBeLessThanOrEqual(3);
    await page.keyboard.press("Escape");
  });

  test("Monatsabschluss – Ziel 3 (Faktura → Mehr „Monatsabschluss“ → „abschließen“ → Rückfrage) – Fähigkeit aus", async ({ page }) => {
    await anmelden(page);
    let k = await zurFaktura(page);
    await page.goto("/faktura/abschluss");
    k++;
    await ruhig(page);
    const knopf = page.getByTestId("monat-abschliessen");
    await expect(knopf).toBeVisible();
    messung(`Monatsabschluss-Knopf deaktiviert: ${await knopf.isDisabled()} (Fähigkeit monatsabschluss aus, Grund sichtbar)`);
    klickzahl(`Monatsabschluss: ${k + 2} (Ziel 3; „Mehr ▾“ als Zwischenklick nicht mitgezählt)`);
  });
});

// ------------------------------------------------------------------------------------------ Teil E
test.describe("Reflow, Fokus nicht verdeckt", () => {
  test("Reflow 320 px ohne horizontales Scrollen (WCAG 1.4.10) auf Kernseiten", async ({ page }) => {
    await anmelden(page);
    await page.setViewportSize({ width: 320, height: 640 });
    for (const pfad of ["/faktura", "/faktura/rechnungen?r=offene-posten", "/faktura/bank", "/faktura/rechnungen/RE-2026-00042", "/faktura/eingangsrechnungen/ER-2026-00026?tab=kosten", "/faktura/auftraege/AB-2026-00015/abrechnen?art=schluss", "/faktura/stammdaten"]) {
      await page.goto(pfad);
      await ruhig(page);
      const b = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
      expect.soft(b.s, `Überbreite bei 320 px auf ${pfad}`).toBeLessThanOrEqual(b.i);
    }
  });

  test("Fokus wird nicht von der Kopfzeile verdeckt (WCAG 2.4.11) – Tab durch Rechnungsakte und Kostenzuordnung", async ({ page }) => {
    await anmelden(page);
    const verdeckt = [];
    for (const pfad of ["/faktura/rechnungen/RE-2026-00042", "/faktura/eingangsrechnungen/ER-2026-00026?tab=kosten"]) {
      await page.goto(pfad);
      await ruhig(page);
      for (let i = 0; i < 45; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(50);
        const r = await page.evaluate(() => {
          const el = document.activeElement;
          const kopf = document.querySelector('[data-testid="kopfzeile"]');
          if (!el || el === document.body || !kopf || kopf.contains(el) || el.closest('[data-testid="leiste"]')) return null;
          const b = el.getBoundingClientRect();
          const k = kopf.getBoundingClientRect();
          return b.top >= k.top && b.bottom <= k.bottom && b.height > 0 ? (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40) : null;
        });
        if (r) verdeckt.push(`${pfad}: ${r}`);
      }
    }
    expect(verdeckt).toEqual([]);
  });
});
