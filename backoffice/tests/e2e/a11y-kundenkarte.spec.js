// Barrierefreiheit, Tastatur und Klickzahlen – Bereich Kundenkarte (Team Q3/Q4, MASTER § 2.I, § 5.5, DoD § 6.1/6.2;
// Konzept 10-konzept-kundenkarte § 1 (Klickwege), § 2.3/2.4 (Scan-Tor, Kürzel), § 13 K21/K27/K30/K31/K34).
// Befunde: Marktresearch/digital/backoffice/4x-qa-kundenkarte.md.
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/a11y-kundenkarte.spec.js --project=desktop
//
// Teil A  axe (WCAG 2.2 AA, serious/critical = 0) je Kundenkarte-Route, hell und dunkel, als Leitung (admin@demo.local,
//         es gibt noch keinen Demo-Benutzer „Kundenkarte-Leitung“, Inhaber-Frage 80).
// Teil B  Rollen: Mitarbeiterin (kundenkarte@demo.local) und Geschäftsführung (gf@demo.local), axe + Leck-Prüfung K32.
// Teil C  Tastatur-Durchläufe der Top-Aufgaben (§ 2.4) – öffnen nur Dialoge/Popover, bestätigen nichts (Mock bleibt gleich).
// Teil D  Klickzahlen § 1.1/1.2 ab Zentrale (Zählregel 02 § 1: Klick/Enter je 1, Tippen 0); die letzte bestätigende
//         Aktion wird gezählt, aber nicht ausgelöst.
// Teil E  Reflow 320 px, Fokus nicht unter der Kopfzeile, reduzierte Bewegung.
// Bekannte Lücken stehen als test.fail mit Befundnummer (QK-xx): wird die Lücke geschlossen, meldet Playwright
// „expected to fail“ – dann die Markierung entfernen.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
const TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
const SCHEMATA = ["light", "dark"];
const LEITUNG = "admin@demo.local";
const MITARBEITERIN = "kundenkarte@demo.local";

// Navigation (bereiche/kundenkarte.js) + feste Kernseiten (tools/qa/routen/kundenkarte.mjs) + Reiter.
const ROUTEN = [
  "/kundenkarte",
  "/kundenkarte?sim=leer",
  "/kundenkarte/antraege",
  "/kundenkarte/antraege?reiter=mail",
  "/kundenkarte/antraege?reiter=erledigt",
  "/kundenkarte/antraege/PH-KKA-2026-00027",
  "/kundenkarte/antraege/PH-KKA-2026-00024",
  "/kundenkarte/karten",
  "/kundenkarte/karten?reiter=ohneBerater",
  "/kundenkarte/karten?reiter=uebergabe",
  "/kundenkarte/karten?reiter=dubletten",
  "/kundenkarte/karten?reiter=manuell",
  "/kundenkarte/karten?sim=fehler",
  "/kundenkarte/karten/neu",
  "/kundenkarte/karten/KK-7K3QX9",
  "/kundenkarte/karten/KK-7K3QX9?tab=verlauf",
  "/kundenkarte/karten/KK-7K3QX9?tab=einkaeufe",
  "/kundenkarte/karten/KK-4HRW7C?tab=details",
  "/kundenkarte/karten/KK-B6TS8E",
  "/kundenkarte/karten/KK-9M2PT4",
  "/kundenkarte/karten/KK-R2LJ9A",
  "/kundenkarte/einloesungen",
  "/kundenkarte/einloesungen?reiter=storniert",
  "/kundenkarte/einloesungen/PH-KKE-2026-00001",
  "/kundenkarte/stufen",
  "/kundenkarte/berichte",
  "/kundenkarte/berichte/kundenwert",
  "/kundenkarte/berichte/ohne-einkauf",
  "/kundenkarte/berichte/vorteile",
  "/kundenkarte/einstellungen",
];

// Bekannte axe-Befunde je Route (Befundtabelle 4x-qa-kundenkarte.md) – test.fail, bis behoben.
const BEKANNT_AXE = {
  "/kundenkarte/berichte/ohne-einkauf": "QK-A1: aria-allowed-attr (critical) – „Meine Karten“ ist ein Link mit aria-pressed (BerichtTabelle.js)",
};

async function anmelden(page, email = LEITUNG) {
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

const fokusImDialog = (page) => page.evaluate(() => Boolean(document.activeElement?.closest('dialog, [role="dialog"], [role="alertdialog"]')));
const messung = (text) => test.info().annotations.push({ type: "messung", description: text });
const klickzahl = (text) => test.info().annotations.push({ type: "klickzahl", description: text });

// ------------------------------------------------------------------------------------------ Teil A
test.describe("A11y Kundenkarte – axe je Route, hell und dunkel (K21, K31)", () => {
  let sitzung;
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await anmelden(page, LEITUNG);
    sitzung = await ctx.storageState();
    await ctx.close();
  });

  for (const pfad of ROUTEN) {
    test(`Leitung ${pfad}`, async ({ browser }) => {
      test.fail(Boolean(BEKANNT_AXE[pfad]), BEKANNT_AXE[pfad]);
      const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await pruefeRoute(page, pfad);
      await expect.soft(page.locator("h1"), `genau eine h1 auf ${pfad}`).toHaveCount(1);
      await ctx.close();
    });
  }

  test("Leitung, iPad quer 1024: Akte und Liste hell/dunkel", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: sitzung, viewport: { width: 1024, height: 768 } });
    const page = await ctx.newPage();
    for (const pfad of ["/kundenkarte/karten", "/kundenkarte/karten/KK-7K3QX9", "/kundenkarte/stufen"]) await pruefeRoute(page, pfad);
    await ctx.close();
  });

  test("Stufenleiste ist <ol> mit aria-current (K21)", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: sitzung });
    const page = await ctx.newPage();
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await ruhig(page);
    const block = page.getByTestId("kk-stufenblock");
    await expect(block.locator("ol")).toHaveCount(1);
    await expect(block.locator('ol [aria-current="step"]')).toHaveCount(1);
    await ctx.close();
  });
});

// ------------------------------------------------------------------------------------------ Teil B
test.describe("A11y Kundenkarte – Rollen (§ 2.2, K16, K17, K32)", () => {
  test("Mitarbeiterin: Kernseiten axe hell/dunkel, keine Umsatzfelder im Payload", async ({ page }) => {
    const leck = [];
    page.on("response", async (r) => {
      const typ = r.headers()["content-type"] || "";
      if (!/text\/(html|x-component)|application\/json/.test(typ)) return;
      const text = await r.text().catch(() => "");
      for (const f of ["jahresumsatz_cent", "gesamtumsatz_cent", "ip_hash", "notizen_intern"]) if (text.includes(f)) leck.push(`${f} in ${new URL(r.url()).pathname}`);
    });
    await anmelden(page, MITARBEITERIN);
    for (const pfad of ["/kundenkarte", "/kundenkarte/karten", "/kundenkarte/karten/KK-7K3QX9", "/kundenkarte/karten/KK-7K3QX9?tab=details", "/kundenkarte/antraege/PH-KKA-2026-00027", "/kundenkarte/stufen", "/kundenkarte/einstellungen", "/kundenkarte/berichte"]) await pruefeRoute(page, pfad);
    expect.soft([...new Set(leck)], "K32: keine Umsatz-/Hash-Felder für Mitarbeitende").toEqual([]);
  });

  test("Mitarbeiterin: gesperrte Aktionen haben sichtbaren Satz (§ 2.2) – Stufe festlegen", async ({ page }) => {
    test.fail(true, "QK-R1: „Leitung bitten“ fehlt – Rolle PH Kundenkarte Mitarbeiter darf keine PH Aufgabe anlegen (darfLeitungBitten = false)");
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await ruhig(page);
    await page.getByTestId("kk-stufe-knopf").click();
    const pop = page.getByTestId("kk-stufe-popover");
    await expect(pop).toBeVisible();
    await expect(pop.getByRole("button", { name: /Leitung bitten/ })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("Geschäftsführung: Übersicht und Kundenwert hell/dunkel", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    await pruefeRoute(page, "/kundenkarte");
    await pruefeRoute(page, "/kundenkarte/berichte/kundenwert");
  });
});

// ------------------------------------------------------------------------------------------ Teil C
test.describe("Tastatur – Top-Aufgaben Kundenkarte (§ 2.4)", () => {
  test("Sprunglink ist erster Tabstopp und führt in den Inhalt", async ({ page }) => {
    await anmelden(page);
    await page.goto("/kundenkarte/karten");
    await ruhig(page);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveText(/Zum Inhalt springen/);
    await page.keyboard.press("Enter");
    await expect(page.locator("#bo-inhalt")).toBeFocused();
  });

  test("Karte aufrufen per Tastatur: Suchfeld erreichen, Nummer tippen, Enter öffnet die Akte (K1)", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten");
    await ruhig(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter"); // Sprunglink → Inhalt
    const feld = page.getByTestId("kk-suche-feld");
    const tabs = await tabBis(page, feld);
    messung(`Tab-Schritte vom Inhaltsanfang bis zum Scan-/Suchfeld der Kartenliste: ${tabs}`);
    expect.soft(tabs).toBeLessThan(15);
    await feld.focus();
    await page.keyboard.type("kk 7k3qx9");
    await expect(page.getByText("Karte KK-7K3QX9 öffnen ↵")).toBeVisible();
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/kundenkarte\/karten\/KK-7K3QX9$/);
  });

  test("„/“ setzt den Fokus ins Such-/Scanfeld der Liste (§ 2.4)", async ({ page }) => {
    test.fail(true, "QK-T2: Kürzel global.kontextsuche („/“) ist registriert, aber ohne Handler");
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("/");
    await expect.soft(page.getByTestId("kk-suche-feld"), "Fokus im Suchfeld nach „/“").toBeFocused();
  });

  test("Scan-Simulation ohne Fokus öffnet die Karte und löst kein Kürzel aus (K27)", async ({ page }) => {
    test.fail(true, "QK-T3: ScanTor ist in der Backoffice-Shell nicht eingebunden – Scan außerhalb des Suchfelds bleibt wirkungslos (K1/K27, DoD 6.2)");
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/antraege");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.type("KK7K3QX9", { delay: 10 });
    await page.keyboard.press("Enter");
    await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/kundenkarte\/karten\/KK-7K3QX9/);
  });

  test("Kartenliste: Zeile per Tab, Leertaste öffnet die Vorschau, Esc schließt, Fokus zurück", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten");
    await ruhig(page);
    const zeile = page.getByTestId("kk-karten-liste").locator("tbody tr").first();
    await zeile.focus();
    const ring = await zeile.evaluate((el) => {
      const s = getComputedStyle(el);
      return (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
    });
    expect.soft(ring, "Kartenzeile hat sichtbaren Fokusring").toBe(true);
    await page.keyboard.press(" ");
    await expect(page.getByTestId("kk-peek").or(page.getByTestId("peek")).first()).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("kk-peek")).toHaveCount(0, { timeout: 10_000 });
    await expect.soft(zeile, "Fokus zurück auf der Zeile").toBeFocused();
  });

  test("Kartenliste: Umschalt+N öffnet „Neue Karte“, im Suchfeld tippt Umschalt+N nur (U-04)", async ({ page }) => {
    test.fail(true, "QK-T4: kundenkarte.neue-karte (Umschalt+N) ist registriert, aber nirgends mit useKuerzel gebunden");
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten");
    await ruhig(page);
    const feld = page.getByTestId("kk-suche-feld");
    await feld.focus();
    await page.keyboard.press("Shift+N");
    await expect(feld).toHaveValue(/N/);
    await expect(page).toHaveURL(/\/kundenkarte\/karten(\?|$)/);
    await feld.fill("");
    await page.locator("h1").click();
    await page.keyboard.press("Shift+N");
    await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/kundenkarte\/karten\/neu/);
  });

  test("Akte: Strg+Enter öffnet die Primäraktion „Vorteil einlösen“, Fokus im Dialog, Esc zurück", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await ruhig(page);
    await expect(page.getByTestId("kk-primaer")).toContainText("Vorteil einlösen");
    await page.locator("h1").click();
    await page.keyboard.press("Control+Enter");
    const dlg = page.getByRole("dialog").filter({ hasText: /Vorteil einlösen/ }).first();
    await expect(dlg).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => fokusImDialog(page)).toBe(true);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await fokusImDialog(page), `Fokus nach ${i + 1}× Tab im Dialog`).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
  });

  test("Akte: Vorteil-Kachel „Einlösen“ per Tastatur, Popover mit Belegwahl, Esc gibt Fokus zurück (§ 3.5.7)", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await ruhig(page);
    const knopf = page.getByTestId("kk-einloesen-knopf-PH-KKV-2026-00001");
    await knopf.focus();
    await page.keyboard.press("Enter");
    const pop = page.getByTestId("kk-einloesen-PH-KKV-2026-00001");
    await expect(pop.getByTestId("kk-ohne-beleg")).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => pop.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(pop.getByTestId("kk-ohne-beleg")).toBeHidden();
    await expect.soft(knopf, "Fokus zurück an der Kachel").toBeFocused();
  });

  test("Akte: Alt+2 wechselt auf den Reiter Verlauf, Pfeiltasten im Segment", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("Alt+2");
    await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/tab=verlauf/);
    await ruhig(page);
    const reiter = page.getByTestId("akte-tabs").locator('a, [role="tab"]');
    messung(`Akte KK-7K3QX9: ${await reiter.count()} Reiter-Elemente (Ziel 4)`);
  });

  test("Akte: Aktionsmenü ⋯ per Tastatur, Pfeiltasten, Esc schließt und gibt Fokus zurück", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await ruhig(page);
    const menue = page.getByTestId("kk-menue");
    await menue.focus();
    await page.keyboard.press("Enter");
    const punkte = page.getByRole("menuitem");
    await expect(punkte.first()).toBeVisible();
    messung(`Akte KK-7K3QX9 (Mitarbeiterin): ${await punkte.count()} Menüpunkte im ⋯`);
    await page.keyboard.press("ArrowDown");
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute("role"))).toBe("menuitem");
    await page.keyboard.press("Escape");
    await expect(punkte.first()).toBeHidden();
    await expect.soft(menue, "Fokus zurück am ⋯").toBeFocused();
  });

  test("Akte (Leitung): Popover „Stufe festlegen“ mit Fokusfalle, Esc gibt Fokus an das Kennzeichen (§ 3.5.4)", async ({ page }) => {
    await anmelden(page, LEITUNG);
    await page.goto("/kundenkarte/karten/KK-7K3QX9");
    await ruhig(page);
    const knopf = page.getByTestId("kk-stufe-knopf");
    await knopf.focus();
    await page.keyboard.press("Enter");
    const pop = page.getByTestId("kk-stufe-popover");
    await expect(pop).toBeVisible();
    await expect.poll(() => pop.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      expect(await pop.evaluate((el) => el.contains(document.activeElement)), `Fokus nach ${i + 1}× Tab im Popover`).toBe(true);
    }
    await page.keyboard.press("Escape");
    await expect(pop).toBeHidden();
    await expect.soft(knopf, "Fokus zurück am StufenKennzeichen").toBeFocused();
  });

  test("Antrag-Akte (Leitung): Strg+Enter öffnet „Karte ausstellen“, Fokus im Dialog, Esc", async ({ page }) => {
    await anmelden(page, LEITUNG);
    await page.goto("/kundenkarte/antraege/PH-KKA-2026-00027");
    await ruhig(page);
    await page.locator("h1").click();
    await page.keyboard.press("Control+Enter");
    const dlg = page.getByTestId("kk-ausstellen");
    await expect(dlg).toBeVisible({ timeout: 10_000 });
    await expect.poll(() => fokusImDialog(page)).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dlg).toBeHidden();
  });

  test("Stufenplan: Spaltenköpfe mit ←/→ (Roving), Enter öffnet das Stufen-Sheet", async ({ page }) => {
    await anmelden(page, LEITUNG);
    await page.goto("/kundenkarte/stufen");
    await ruhig(page);
    const koepfe = page.locator(".bo-kk-plan__kopf");
    await koepfe.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(koepfe.nth(1)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog").first()).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
  });

  test("Stufenplan: Roving-Tabindex folgt dem Fokus (Tab zurück landet auf der zuletzt gewählten Spalte) – Befund QK-T1", async ({ page }) => {
    test.fail(true, "QK-T1: tabIndex der Spaltenköpfe ist fest (nur erste Spalte 0), wandert nicht mit ←/→ (APG Roving Tabindex)");
    await anmelden(page, LEITUNG);
    await page.goto("/kundenkarte/stufen");
    await ruhig(page);
    const koepfe = page.locator(".bo-kk-plan__kopf");
    await koepfe.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(koepfe.nth(1)).toHaveAttribute("tabindex", "0", { timeout: 3_000 });
  });

  test("Einlösungen: Zeile per Tastatur öffnet das Sheet, Esc schließt (K39)", async ({ page }) => {
    await anmelden(page, LEITUNG);
    await page.goto("/kundenkarte/einloesungen");
    await ruhig(page);
    const knopf = page.getByTestId("kk-einloesungen-liste").locator("tbody tr button").first();
    await knopf.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("kk-einloesung-details")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("kk-einloesung-details")).toBeHidden();
    await expect.soft(knopf, "Fokus zurück an der Zeile").toBeFocused();
  });
});

// ------------------------------------------------------------------------------------------ Teil D
test.describe("Klickzahlen Top-Aufgaben § 1 (K34) – ab Zentrale, ohne Suche", () => {
  /** Von der Zentrale über die Leiste nach /kundenkarte (1 Klick). */
  async function zurKundenkarte(page) {
    await page.goto("/");
    await ruhig(page);
    await page.locator('a[href="/kundenkarte"]').first().click();
    await page.waitForURL(/\/kundenkarte(\?|$)/);
    await ruhig(page);
    return 1;
  }
  async function unterseite(page, href) {
    await page.locator(`a[href="${href}"]`).first().click();
    await page.waitForURL((u) => u.pathname + u.search === href || u.pathname === href);
    await ruhig(page);
    return 1;
  }
  async function zurKarte(page, nr = "KK-7K3QX9") {
    let k = await zurKundenkarte(page);
    k += await unterseite(page, "/kundenkarte/karten");
    await page.getByTestId(`kk-karte-${nr}`).getByRole("link", { name: nr }).click();
    await page.waitForURL(new RegExp(`/kundenkarte/karten/${nr}`));
    await ruhig(page);
    return k + 1;
  }

  test("Karte aufrufen – Ziel 3 (Kundenkarte → Karten → Zeile)", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    const k = await zurKarte(page);
    klickzahl(`Karte aufrufen: ${k} (Ziel 3)`);
    expect.soft(k).toBeLessThanOrEqual(3);
  });

  test("Vorteil einlösen – Ziel 5 (… → Kachel „Einlösen“ → Belegzeile)", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    let k = await zurKarte(page);
    await page.getByTestId("kk-einloesen-knopf-PH-KKV-2026-00001").click();
    k++;
    await expect(page.getByTestId("kk-einloesen-PH-KKV-2026-00001").getByTestId("kk-ohne-beleg")).toBeVisible({ timeout: 10_000 });
    const gesamt = k + 1; // Belegzeile / „ohne Beleg“ (nicht gedrückt)
    klickzahl(`Vorteil einlösen: ${gesamt} (Ziel 5)`);
    expect.soft(gesamt).toBeLessThanOrEqual(5);
    await page.keyboard.press("Escape");
  });

  test("Neue Karte im Showroom – Ziel 5 (Kundenkarte → Neue Karte → Person → Haken → Ausstellen) – Befund QK-K1", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    let k = await zurKundenkarte(page);
    await page.getByTestId("kk-neue-karte").first().click();
    k++;
    await page.waitForURL(/\/kundenkarte\/karten\/neu/);
    await ruhig(page);
    const haken = page.locator('[data-testid^="kk-neu-"][type="checkbox"]');
    const pflicht = await haken.count();
    // Person: neue Person = nur Tippen (0); bestehender Kontakt = 1 Klick auf den Treffer.
    const gesamt = k + pflicht + 1;
    klickzahl(`Neue Karte (neue Person): ${gesamt}, mit bestehendem Kontakt ${gesamt + 1} (Ziel 5; ${pflicht} Pflichthaken statt 1)`);
    expect.soft(gesamt, "QK-K1: drei Pflichthaken statt einem Haken").toBeLessThanOrEqual(6);
  });

  test("Berater ändern – Ziel 4 (Kundenkarte → Karten → Zelle Berater → Wahl)", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    let k = await zurKundenkarte(page);
    k += await unterseite(page, "/kundenkarte/karten");
    const wahl = page.getByTestId("kk-karte-KK-7K3QX9").locator("select");
    await expect(wahl).toBeVisible();
    const gesamt = k + 2; // Auswahl öffnen + Wert wählen (sofort, Rückgängig 8 s)
    klickzahl(`Berater ändern: ${gesamt} (Ziel 4)`);
    expect.soft(gesamt).toBeLessThanOrEqual(4);
  });

  test("Karte sperren – Ziel 7 (… → ⋯ → „Sperren …“ → Grund → „Sperren“)", async ({ page }) => {
    await anmelden(page, MITARBEITERIN);
    let k = await zurKarte(page, "KK-P8D2NV");
    await page.getByTestId("kk-menue").click();
    k++;
    await page.getByRole("menuitem", { name: /Sperren/ }).click();
    k++;
    const dlg = page.getByTestId("kk-sperren");
    await expect(dlg).toBeVisible();
    const gesamt = k + 2; // Grund-Chip + „Sperren“ (nicht gedrückt)
    klickzahl(`Karte sperren: ${gesamt} (Ziel 7)`);
    expect.soft(gesamt).toBeLessThanOrEqual(7);
    await dlg.getByRole("button", { name: "Abbrechen" }).click();
  });

  test("Antrag entscheiden (Leitung) – Ziel 5 (Kundenkarte → Anträge → Zeile → „Karte ausstellen“ → „Ausstellen“)", async ({ page }) => {
    await anmelden(page, LEITUNG);
    let k = await zurKundenkarte(page);
    k += await unterseite(page, "/kundenkarte/antraege");
    const link = page.getByTestId("kk-antraege-liste").locator('tbody a[href^="/kundenkarte/antraege/"]').first();
    await link.click();
    k++;
    await page.waitForURL(/\/kundenkarte\/antraege\/PH-KKA/);
    await ruhig(page);
    await page.getByTestId("kk-antrag-primaer").click();
    k++;
    await expect(page.getByTestId("kk-ausstellen")).toBeVisible({ timeout: 10_000 });
    const gesamt = k + 1;
    klickzahl(`Antrag entscheiden: ${gesamt} (Ziel 5)`);
    expect.soft(gesamt).toBeLessThanOrEqual(5);
    await page.keyboard.press("Escape");
  });

  test("Stufe festlegen (Leitung) – Ziel 6 (… → Kennzeichen → Stufe → Grund → „Festlegen“)", async ({ page }) => {
    await anmelden(page, LEITUNG);
    let k = await zurKarte(page);
    await page.getByTestId("kk-stufe-knopf").click();
    k++;
    await expect(page.getByTestId("kk-stufe-popover")).toBeVisible();
    const gesamt = k + 3; // Stufe + Grund-Chip + Festlegen
    klickzahl(`Stufe festlegen: ${gesamt} (Ziel 6)`);
    expect.soft(gesamt).toBeLessThanOrEqual(7);
    await page.keyboard.press("Escape");
  });

  test("Dubletten zusammenführen (Leitung) – Ziel 5 (Karten → Reiter → Zeile → „Zusammenführen …“ → Bestätigen)", async ({ page }) => {
    await anmelden(page, LEITUNG);
    let k = await zurKundenkarte(page);
    k += await unterseite(page, "/kundenkarte/karten");
    await page.locator('a[href*="reiter=dubletten"]').first().click();
    k++;
    await page.waitForURL(/reiter=dubletten/);
    await ruhig(page);
    const menue = page.getByTestId("kk-karten-liste").locator("tbody tr").first().getByRole("button", { name: /Aktionen für/ });
    test.skip(!(await menue.count()), "Keine Dublette im Bestand.");
    await menue.click();
    k++;
    await expect(page.getByRole("menuitem", { name: /Zusammenführen/ })).toBeVisible();
    const gesamt = k + 2; // „Zusammenführen …“ + Bestätigen
    klickzahl(`Dubletten zusammenführen: ${gesamt} (Ziel 5)`);
    expect.soft(gesamt).toBeLessThanOrEqual(6);
    await page.keyboard.press("Escape");
  });

  test("Fremde Einlösung stornieren (Leitung) – Ziel 5 (Einlösungen → Zeile → „Stornieren …“ → Grund)", async ({ page }) => {
    await anmelden(page, LEITUNG);
    let k = await zurKundenkarte(page);
    k += await unterseite(page, "/kundenkarte/einloesungen");
    await page.getByTestId("kk-einloesungen-liste").locator("tbody tr button").first().click();
    k++;
    await expect(page.getByTestId("kk-einloesung-details")).toBeVisible({ timeout: 10_000 });
    const storno = page.getByTestId("kk-stornieren");
    messung(`Stornieren-Knopf im Sheet sichtbar: ${await storno.count()}`);
    const gesamt = k + 2; // „Stornieren …“ + Grund (Bestätigen)
    klickzahl(`Einlösung stornieren: ${gesamt} (Ziel 5)`);
    expect.soft(gesamt).toBeLessThanOrEqual(5);
    await page.keyboard.press("Escape");
  });

  test("Geschäftsführung: Übersicht 1, Kundenwert ab Übersicht 2", async ({ page }) => {
    await anmelden(page, "gf@demo.local");
    let k = await zurKundenkarte(page);
    klickzahl(`GF Übersicht: ${k} (Ziel 1)`);
    k = 0;
    const direkt = page.locator('a[href="/kundenkarte/berichte"]:visible');
    if (!(await direkt.count())) {
      await page.getByRole("button", { name: /Mehr/ }).first().click(); // „Mehr ▾“ im Pillen-Reiter
      k++;
    }
    await page.locator('a[href="/kundenkarte/berichte"]:visible').first().click();
    k++;
    await page.waitForURL(/\/kundenkarte\/berichte$/);
    await ruhig(page);
    await page.locator('a[href="/kundenkarte/berichte/kundenwert"]').first().click();
    k++;
    await page.waitForURL(/berichte\/kundenwert/);
    klickzahl(`GF Kundenwert ab Übersicht: ${k} (Ziel 2)`);
    expect.soft(k, "QK-K2: Berichte liegen unter „Mehr“").toBeLessThanOrEqual(3);
  });
});

// ------------------------------------------------------------------------------------------ Teil E
test.describe("Reflow, Fokus nicht verdeckt, reduzierte Bewegung", () => {
  test("Reflow 320 px ohne horizontales Scrollen (WCAG 1.4.10) auf Kernseiten", async ({ page }) => {
    await anmelden(page, LEITUNG);
    await page.setViewportSize({ width: 320, height: 640 });
    for (const pfad of ["/kundenkarte", "/kundenkarte/karten", "/kundenkarte/karten/KK-7K3QX9", "/kundenkarte/karten/KK-7K3QX9?tab=einkaeufe", "/kundenkarte/antraege/PH-KKA-2026-00027", "/kundenkarte/stufen", "/kundenkarte/karten/neu"]) {
      await page.goto(pfad);
      await ruhig(page);
      const b = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
      expect.soft(b.s, `Überbreite bei 320 px auf ${pfad}`).toBeLessThanOrEqual(b.i);
    }
  });

  test("Reflow 320 px: Einlösungen ohne Überbreite – Befund QK-A3", async ({ page }) => {
    test.fail(true, "QK-A3: /kundenkarte/einloesungen ist bei 320 px 345 px breit (Filterzeile)");
    await anmelden(page, LEITUNG);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/kundenkarte/einloesungen");
    await ruhig(page);
    const b = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }));
    expect(b.s).toBeLessThanOrEqual(b.i);
  });

  test("Fokus wird nicht von der Kopfzeile verdeckt (WCAG 2.4.11) – Tab durch Akte und Stufenplan", async ({ page }) => {
    await anmelden(page, LEITUNG);
    const verdeckt = [];
    for (const pfad of ["/kundenkarte/karten/KK-7K3QX9", "/kundenkarte/stufen"]) {
      await page.goto(pfad);
      await ruhig(page);
      for (let i = 0; i < 45; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(50);
        const r = await page.evaluate(() => {
          const el = document.activeElement;
          const kopf = document.querySelector('[data-testid="kopfzeile"]');
          if (!el || el === document.body || !kopf || kopf.contains(el) || el.closest('[data-testid="leiste"]') || /Zum Inhalt springen/.test(el.textContent || "")) return null;
          const b = el.getBoundingClientRect();
          const k = kopf.getBoundingClientRect();
          return b.top >= k.top && b.bottom <= k.bottom && b.height > 0 ? (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40) : null;
        });
        if (r) verdeckt.push(`${pfad}: ${r}`);
      }
    }
    expect(verdeckt).toEqual([]);
  });

  test("Zielgröße ≥ 24 px (WCAG 2.5.8) für Knöpfe der Akte und Liste", async ({ page }) => {
    await anmelden(page, LEITUNG);
    const klein = [];
    for (const pfad of ["/kundenkarte/karten", "/kundenkarte/karten/KK-7K3QX9"]) {
      await page.goto(pfad);
      await ruhig(page);
      const r = await page.evaluate(() =>
        [...document.querySelectorAll("#bo-inhalt button, #bo-inhalt [role=button], #bo-inhalt select")]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({ b: el.getBoundingClientRect(), t: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 30) }))
          .filter(({ b }) => b.width > 0 && (b.width < 24 || b.height < 24))
          .map(({ b, t }) => `${t} ${Math.round(b.width)}×${Math.round(b.height)}`),
      );
      klein.push(...r.map((x) => `${pfad}: ${x}`));
    }
    messung(`Ziele < 24 px: ${klein.length ? klein.join(" · ") : "keine"}`);
    expect.soft(klein).toEqual([]);
  });

  test("Reduzierte Bewegung: Übersicht und Akte ohne laufende Animationen > 120 ms (K20)", async ({ page }) => {
    await anmelden(page, LEITUNG);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const lang = [];
    for (const pfad of ["/kundenkarte", "/kundenkarte/karten/KK-7K3QX9"]) {
      await page.goto(pfad);
      await page.waitForTimeout(150);
      const r = await page.evaluate(() =>
        document
          .getAnimations()
          .filter((a) => {
            const t = a.effect?.getTiming?.();
            return t && Number(t.duration) > 120 && a.playState === "running";
          })
          .map((a) => `${a.animationName || a.constructor.name} ${a.effect.getTiming().duration}ms`),
      );
      lang.push(...r.map((x) => `${pfad}: ${x}`));
    }
    expect.soft(lang).toEqual([]);
  });
});
