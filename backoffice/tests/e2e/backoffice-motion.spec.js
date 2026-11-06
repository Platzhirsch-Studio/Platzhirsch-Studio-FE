// E2E Bewegung (Team Q2, MASTER G-31, Maßstab art-direction/lounge.md § 8) gegen den laufenden
// Dev-Server (:3100, Mock).
//   PW_WORKERS=1 npx playwright test -c playwright.config.js tests/e2e/backoffice-motion.spec.js --project=desktop
// Prüft Endzustände (04 § 2.4): Dialog ≤ 200 ms sichtbar, Toast weg ≤ 8,5 s, Kanban-Karte ≤ 400 ms
// in der Zielspalte; dazu Token, Lounge-Bausteine (Druck-Feder, Kachel-Hover, Staffel, Panel,
// Sheet, Häkchen, Kiosk) an eingesetzten Proben, Reduzierung und die Demo-Proben.
import { test, expect } from "@playwright/test";

const PASSWORT = process.env.BACKOFFICE_MOCK_PASSWORD || "demo";
// Ein Bild (16,7 ms) Messtoleranz für das Abfragen per requestAnimationFrame.
const BILD = 17;
// Aus src/app/entwurf/lounge/lounge.css (--spring / --spring-soft), ohne Leerzeichen.
const LOUNGE_FEDER = "linear(0,0.058,0.193,0.358,0.523,0.67,0.791,0.884,0.951,0.995,1.021,1.034,1.038,1.037,1.032,1.025,1.019,1.013,1.008,1.005,1.002,1,0.999,1)";
const LOUNGE_FEDER_SANFT = "linear(0,0.077,0.237,0.412,0.57,0.699,0.797,0.868,0.918,0.951,0.973,0.986,0.994,0.998,1,1.001,1.002,1.001,1)";

/** CSS-Zeit („.16s“, „160ms“, „0s“) → ms; der CSS-Minifier schreibt Token um. */
const ms = (wert) => {
  const m = /^(-?[\d.]+)(ms|s)$/.exec(String(wert).trim());
  return m ? Math.round(Number(m[1]) * (m[2] === "s" ? 1000 : 1)) : NaN;
};
/** „0.5“ und „.5“ gleich behandeln (Minifier). */
const norm = (t) => String(t).replace(/\s+/g, "").replace(/(^|[(,])0\./g, "$1.");

async function anmelden(page, email = "admin@demo.local") {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORT);
  await page.getByTestId("login-senden").click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60_000 });
}

/** Probe-Elemente in eine geladene Backoffice-Seite einsetzen (bo-motion.css hängt am Wurzel-Layout). */
async function probe(page, html) {
  await page.goto("/login");
  await page.evaluate((h) => {
    const box = document.createElement("div");
    box.id = "q2-probe";
    box.style.cssText = "position:fixed;left:40px;top:40px;z-index:9999;display:flex;gap:24px;align-items:flex-start;padding:24px;background:var(--color-bo-bg)";
    box.innerHTML = h;
    document.body.append(box);
  }, html);
}
const stil = (loc, eig) => loc.evaluate((el, e) => getComputedStyle(el)[e], eig);

/**
 * Misst im Browser das Öffnen des ersten <dialog>: `ende` = Laufzeit der längsten Opazitäts-
 * Animation/Transition am Dialog laut Web Animations (Dauer + Verzögerung, deterministisch) –
 * die Form (scale/translate) federt danach aus und zählt für „sichtbar“ nicht; `sichtbar` =
 * Wanduhrzeit bis Opazität 1 (enthält Bildtakt und Dev-Modus, daher nur grobe Obergrenze).
 */
async function messeDialogOeffnen(page) {
  await page.evaluate(() => {
    window.__boDialog = null;
    const mo = new MutationObserver((liste) => {
      for (const m of liste) {
        if (!(m.target instanceof HTMLDialogElement) || !m.target.open) continue;
        mo.disconnect();
        const d = m.target;
        const t0 = performance.now();
        let ende = null;
        let letztes = t0;
        let bildMax = 0;
        const lauf = (jetzt) => {
          bildMax = Math.max(bildMax, jetzt - letztes);
          letztes = jetzt;
          if (ende === null) {
            const anims = d.getAnimations().filter((x) => !x.transitionProperty || x.transitionProperty === "opacity");
            if (anims.length) ende = Math.max(...anims.map((x) => Number(x.effect.getComputedTiming().endTime) || 0));
          }
          if (getComputedStyle(d).opacity === "1") window.__boDialog = { ende: ende ?? 0, sichtbar: performance.now() - t0, bild: bildMax };
          else requestAnimationFrame(lauf);
        };
        requestAnimationFrame(lauf);
        return;
      }
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  });
}

/** Erste Anfrage aus der Liste direkt öffnen (Link-Ziel lesen statt klicken: robust auf Touch-Geräten). */
async function oeffneErsteAnfrage(page) {
  if (!/\/d\/ph-anfrage(\?|$)/.test(page.url())) await page.goto("/d/ph-anfrage");
  const link = page.locator('a[href^="/d/ph-anfrage/PH-ANF-"]').first();
  await expect(link).toBeAttached();
  await page.goto(await link.getAttribute("href"));
  await expect(page.getByTestId("workflow-leiste")).toBeVisible();
}

/** Klick, bis der Dialog offen ist (ein Klick vor der Hydration verpufft im Dev-Modus). */
async function oeffneDialog(page, knopf) {
  await expect(async () => {
    if ((await page.locator("dialog.bo-dialog[open]").count()) === 0) await knopf.click();
    await expect(page.locator("dialog.bo-dialog[open]")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

async function dialogMessung(page) {
  await expect.poll(() => page.evaluate(() => window.__boDialog), { timeout: 2_000 }).not.toBeNull();
  return page.evaluate(() => window.__boDialog);
}

// Titel ohne das Wort „Bewegung“: das Projekt reducedMotion (P0-9) greift nur den mit @bewegung
// markierten Block; die Normalmodus-Tests laufen in desktop/ipad.
test.describe("Motion (G-31)", () => {
  test("Token, View-Transition-Regeln und Kopfzeilen-Anker sind geladen", async ({ page }) => {
    await anmelden(page);
    await page.goto("/");
    const werte = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const regeln = [];
      for (const s of document.styleSheets) {
        try {
          for (const r of s.cssRules) regeln.push(r.cssText);
        } catch {
          // fremde Stylesheets ohne Zugriff
        }
      }
      const kopf = document.querySelector("header:has(+ main#bo-inhalt)");
      const v = (n) => cs.getPropertyValue(n).trim();
      return {
        ack: v("--bo-dur-ack"),
        base: v("--bo-dur-base"),
        spring: v("--bo-dur-spring"),
        draw: v("--bo-dur-draw"),
        easeOut: v("--bo-ease-out"),
        easeSpring: v("--bo-ease-spring"),
        feder: v("--bo-feder"),
        federSanft: v("--bo-feder-sanft"),
        durFeder: v("--bo-dur-feder"),
        durFederKurz: v("--bo-dur-feder-kurz"),
        durDruck: v("--bo-dur-druck"),
        staffel: v("--bo-staffel"),
        vtKlickbar: regeln.some((t) => /^::view-transition\s*\{[^}]*pointer-events:\s*none/.test(t)),
        vtSeite: regeln.some((t) => /::view-transition-new\(\*?\.bo-seite\)/.test(t)),
        kopfName: kopf ? getComputedStyle(kopf).viewTransitionName : null,
      };
    });
    expect(ms(werte.ack)).toBe(50);
    expect(ms(werte.base)).toBe(160);
    expect(ms(werte.spring)).toBe(420);
    expect(ms(werte.draw)).toBe(520);
    expect(norm(werte.easeOut)).toBe("cubic-bezier(.22,1,.36,1)");
    // Lounge § 8: zwei Federn als linear(), Werte identisch mit dem freigegebenen Entwurf.
    expect(norm(werte.feder)).toBe(norm(LOUNGE_FEDER));
    expect(norm(werte.federSanft)).toBe(norm(LOUNGE_FEDER_SANFT));
    expect(norm(werte.easeSpring)).toMatch(/^(linear\(|var\(--bo-feder\))/);
    expect(ms(werte.durFeder)).toBe(620);
    expect(ms(werte.durFederKurz)).toBe(420);
    expect(ms(werte.durDruck)).toBe(80);
    expect(ms(werte.staffel)).toBe(30);
    expect(werte.vtKlickbar, "::view-transition { pointer-events: none }").toBe(true);
    expect(werte.vtSeite).toBe(true);
    expect(werte.kopfName).toBe("bo-kopf");
  });

  test("Dialog ist ≤ 200 ms nach dem Öffnen voll sichtbar, federt aus und schließt ohne Rest", async ({ page }) => {
    await anmelden(page, "crm-leitung@demo.local");
    await oeffneErsteAnfrage(page);
    // „Löschen“ fragt immer nach; „Abbrechen“ lässt den Datensatz unverändert.
    const knopf = page.getByTestId("workflow-leiste").getByRole("button", { name: "Löschen", exact: true });
    await expect(knopf).toBeVisible();
    await messeDialogOeffnen(page);
    await oeffneDialog(page, knopf);
    const dialog = page.locator("dialog.bo-dialog[open]");
    await expect(dialog).toBeVisible();
    const m = await dialogMessung(page);
    expect(m.ende, "Öffnen-Blende (Dauer + Verzögerung)").toBeGreaterThan(0);
    expect(m.ende, "Öffnen-Blende (Dauer + Verzögerung)").toBeLessThanOrEqual(200);
    // Wanduhr nur grob: der Bildtakt des Prüfbrowsers (headless, Geräte-Emulation, Dev-Modus) liegt
    // oft bei 50–100 ms je Bild; erlaubt sind drei Bilder über der festgelegten Dauer.
    const toleranz = Math.max(6 * BILD, 3 * m.bild);
    expect(m.sichtbar, `Dialog nach ${Math.round(m.sichtbar)} ms voll sichtbar (Bildtakt bis ${Math.round(m.bild)} ms)`).toBeLessThanOrEqual(200 + toleranz);
    expect(await dialog.evaluate((d) => getComputedStyle(d).transitionTimingFunction)).toContain("linear(");
    await expect.poll(() => dialog.evaluate((d) => getComputedStyle(d).scale), { timeout: 1_500 }).toMatch(/^(1|none)$/);
    // Gefährliche Rückfrage: Fokus liegt auf „Abbrechen“ – Abbrechen ändert nichts.
    await dialog.getByRole("button", { name: "Abbrechen" }).click();
    await expect(page.locator("dialog.bo-dialog[open]")).toHaveCount(0);
    await expect.poll(() => page.locator("dialog.bo-dialog").first().evaluate((d) => getComputedStyle(d).display), { timeout: 1_000 }).toBe("none");
  });

  test("Kanban: Karte steht ≤ 400 ms in der Zielspalte, Toast ist nach ≤ 8,5 s weg", async ({ page }) => {
    await anmelden(page, "crm-leitung@demo.local");
    await page.goto("/d/ph-aufgabe?ansicht=kanban");
    const board = page.getByTestId("kanban");
    await expect(board).toBeVisible();
    const offen = board.locator('section[data-spalte="Offen"]');
    const inArbeit = board.locator('section[data-spalte="In Arbeit"]');
    // Vorbedingung im langlebigen Mock-Speicher: eine Karte in „Offen“.
    if ((await offen.getByTestId("kanban-karte").count()) === 0) {
      const z = inArbeit.getByTestId("kanban-karte").first();
      const zName = await z.getAttribute("data-karte");
      await z.focus();
      await page.keyboard.press("ArrowLeft");
      await expect(offen.locator(`[data-karte="${zName}"]`)).toHaveCount(1, { timeout: 20_000 });
      await expect(page.locator('[role="status"]').filter({ hasText: "→" })).toHaveCount(0, { timeout: 10_000 });
    }
    const karte = offen.getByTestId("kanban-karte").first();
    const name = await karte.getAttribute("data-karte");
    await karte.focus();
    const t0 = Date.now();
    await page.keyboard.press("ArrowRight");
    await expect(inArbeit.locator(`[data-karte="${name}"]`)).toHaveCount(1, { timeout: 2_000 });
    const msSpalte = Date.now() - t0;
    expect(msSpalte, `Karte nach ${msSpalte} ms in der Zielspalte`).toBeLessThanOrEqual(400);

    const toast = page.locator('[role="status"]').filter({ hasText: `${name} →` });
    await expect(toast).toBeVisible({ timeout: 10_000 });
    const t1 = Date.now();
    await page.mouse.move(5, 5); // Zeiger nicht über dem Toast (Pause bei Hover)
    await expect(toast).toHaveCount(0, { timeout: 8_500 });
    expect(Date.now() - t1).toBeLessThanOrEqual(8_500);

    // Ausgangszustand wiederherstellen.
    const zurueck = inArbeit.locator(`[data-karte="${name}"]`);
    await zurueck.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(offen.locator(`[data-karte="${name}"]`)).toHaveCount(1, { timeout: 20_000 });
  });

  test("Lounge: Druck-Feder federt zurück, Kachel hebt sich, Pfeil dreht mit Feder", async ({ page }) => {
    // .bo-druck = Druck-Feder für Ziele ohne eigenen Baustein (bo-motion.css);
    // .bo-kachel--lift / .bo-pfeil = Lounge-Bausteine aus globals.css (P0-2) mit denselben Federn.
    await probe(
      page,
      `<button type="button" class="bo-druck" id="q2-knopf" style="height:44px;padding:0 20px;border-radius:999px">Probe</button>
       <section class="bo-kachel bo-kachel--lift" id="q2-kachel" style="width:240px;height:160px">
         <span class="bo-pfeil" id="q2-pfeil" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 15 15 5" stroke="currentColor"/></svg></span>
       </section>`
    );
    const knopf = page.locator("#q2-knopf");
    expect(await stil(knopf, "transitionTimingFunction")).toContain("linear(");
    const b = await knopf.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    // Eindrücken in 80 ms: nach ≤ 100 ms (+ Bildtakt) am Ziel.
    await expect.poll(() => stil(knopf, "scale"), { timeout: 100 + 6 * BILD, intervals: [10] }).toBe("0.97");
    await page.mouse.up();
    await expect.poll(() => stil(knopf, "scale"), { timeout: 1_000 }).toMatch(/^(none|1)$/);

    // Kachel-Hover nur mit echtem Zeiger (Desktop); auf Touch-Profilen entfällt er bewusst.
    const kachel = page.locator("#q2-kachel");
    expect(await stil(kachel, "transitionTimingFunction")).toContain("linear(");
    const zeiger = await page.evaluate(() => matchMedia("(hover: hover)").matches);
    if (zeiger) {
      await kachel.hover({ position: { x: 40, y: 40 } });
      // translateY(-2px) → matrix(1, 0, 0, 1, 0, -2)
      await expect.poll(() => stil(kachel, "transform"), { timeout: 1_500 }).toBe("matrix(1, 0, 0, 1, 0, -2)");
      // rotate(45deg) → cos 45° ≈ 0,7071
      await expect.poll(async () => (await stil(page.locator("#q2-pfeil svg"), "transform")).startsWith("matrix(0.707"), { timeout: 1_500 }).toBe(true);
    }
  });

  test("Lounge: Staffel 30 ms mit sanfter Feder, Panel und Sheet federn, Häkchen zeichnet sich", async ({ page }) => {
    await probe(
      page,
      `<div class="bo-staffel" id="q2-staffel"><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div><div>7</div><div>8</div><div>9</div></div>
       <div class="bo-erscheinen" id="q2-einzeln" style="--i: 4">einzeln</div>
       <aside class="bo-panel" id="q2-panel" style="width:200px;height:80px;background:var(--color-bo-surface)">Panel</aside>
       <span class="bo-gleiter" id="q2-gleiter" data-bo-bereit=""></span>
       <dialog class="bo-sheet" data-seite="unten" id="q2-sheet"><p>Sheet</p></dialog>`
    );
    const kinder = page.locator("#q2-staffel > div");
    expect(await stil(kinder.nth(0), "animationName")).toBe("bo-erscheinen");
    expect(await stil(kinder.nth(0), "animationTimingFunction")).toContain("linear(");
    expect(ms(await stil(kinder.nth(0), "animationDuration"))).toBe(700);
    expect(ms(await stil(kinder.nth(2), "animationDelay"))).toBe(60);
    // Deckel: ab dem 8. Kind dieselbe Verzögerung (7 × 30 ms).
    expect(ms(await stil(kinder.nth(8), "animationDelay"))).toBe(210);
    expect(ms(await stil(page.locator("#q2-einzeln"), "animationDelay"))).toBe(120);
    expect(await stil(page.locator("#q2-panel"), "animationName")).toBe("bo-panel-ein");
    expect(ms(await stil(page.locator("#q2-panel"), "animationDuration"))).toBe(620);
    expect(await stil(page.locator("#q2-gleiter"), "transitionProperty")).toContain("width");
    // Alles steht am Ende ruhig an seinem Platz (Raster vor Inhalt, kein Springen).
    await expect.poll(() => stil(kinder.nth(8), "opacity"), { timeout: 2_000 }).toBe("1");
    await expect.poll(() => stil(page.locator("#q2-panel"), "translate"), { timeout: 2_000 }).toMatch(/^(none|0px)$/);

    // Sheet von unten: voll sichtbar ≤ 200 ms (Opazität), Lage federt mit linear().
    await messeDialogOeffnen(page);
    await page.locator("#q2-sheet").evaluate((d) => d.showModal());
    const m = await dialogMessung(page);
    expect(m.ende).toBeLessThanOrEqual(200);
    expect(await stil(page.locator("#q2-sheet"), "transitionTimingFunction")).toContain("linear(");
    await expect.poll(() => stil(page.locator("#q2-sheet"), "translate"), { timeout: 1_500 }).toMatch(/^(none|0px)$/);
    await page.locator("#q2-sheet").evaluate((d) => d.close());

    // Häkchen: startet ungezeichnet, wartet 220 ms, zeichnet in 520 ms.
    await page.evaluate(() => {
      document
        .getElementById("q2-probe")
        .insertAdjacentHTML("beforeend", '<svg class="bo-tick" id="q2-tick" viewBox="0 0 24 24" width="48" height="48" fill="none"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.5"/></svg>');
    });
    const pfad = page.locator("#q2-tick path");
    expect(ms(await stil(pfad, "transitionDelay"))).toBe(220);
    expect(ms(await stil(pfad, "transitionDuration"))).toBe(520);
    await expect.poll(() => stil(pfad, "strokeDashoffset"), { timeout: 1_500 }).toMatch(/^0(px)?$/);
  });

  test.describe("reduziert", { tag: "@bewegung" }, () => {
    test.use({ reducedMotion: "reduce" });

    test("Ortswechsel-Dauern sind 0, Blenden ≤ 120 ms, Dialog ohne Skalierung", async ({ page }) => {
      await anmelden(page, "crm-leitung@demo.local");
      await page.goto("/d/ph-anfrage");
      const t = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        return [
          "--bo-dur-ack",
          "--bo-dur-fast",
          "--bo-dur-base",
          "--bo-dur-move",
          "--bo-dur-slow",
          "--bo-dur-spring",
          "--bo-dur-draw",
          "--bo-staffel",
          "--bo-dur-feder",
          "--bo-dur-feder-kurz",
          "--bo-dur-druck",
          "--bo-dur-erscheinen",
          "--bo-dur-haken",
          "--bo-dur-zaehlen",
        ].map((n) => cs.getPropertyValue(n).trim());
      });
      expect(t.map(ms)).toEqual([0, 120, 120, 0, 0, 0, 0, 0, 0, 0, 0, 120, 0, 0]);
      await oeffneErsteAnfrage(page);
      const knopf = page.getByTestId("workflow-leiste").getByRole("button", { name: "Löschen", exact: true });
      await expect(knopf).toBeVisible();
      await messeDialogOeffnen(page);
      await oeffneDialog(page, knopf);
      const dialog = page.locator("dialog.bo-dialog[open]");
      await expect(dialog).toBeVisible();
      const m = await dialogMessung(page);
      expect(m.ende, "Blende bei reduzierter Bewegung").toBeLessThanOrEqual(120);
      expect(await dialog.evaluate((d) => getComputedStyle(d).scale)).toBe("none");
      await dialog.getByRole("button", { name: "Abbrechen" }).click();
      await expect(page.locator("dialog.bo-dialog[open]")).toHaveCount(0);
    });

    test("Lounge-Bausteine: kein Eindrücken, keine Staffel, nur Blende, Häkchen sofort gezeichnet", async ({ page }) => {
      await probe(
        page,
        `<button type="button" class="bo-druck" id="q2-knopf" style="height:44px;padding:0 20px">Probe</button>
         <div class="bo-staffel" id="q2-staffel"><div>1</div><div>2</div><div>3</div></div>
         <aside class="bo-panel" id="q2-panel">Panel</aside>
         <svg class="bo-tick" id="q2-tick" viewBox="0 0 24 24" width="48" height="48" fill="none"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor"/></svg>`
      );
      const knopf = page.locator("#q2-knopf");
      const b = await knopf.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(150);
      expect(await stil(knopf, "scale")).toBe("none");
      await page.mouse.up();
      const kind = page.locator("#q2-staffel > div").nth(2);
      expect(await stil(kind, "animationName")).toBe("bo-fade");
      expect(ms(await stil(kind, "animationDelay"))).toBe(0);
      expect(ms(await stil(kind, "animationDuration"))).toBeLessThanOrEqual(120);
      expect(await stil(page.locator("#q2-panel"), "animationName")).toBe("bo-fade");
      expect(await stil(page.locator("#q2-tick path"), "strokeDashoffset")).toMatch(/^0(px)?$/);
    });
  });

  test.describe("Demo-Proben (/einstellungen?tab=system&baustein=motion)", () => {
    test.beforeEach(async ({ page }) => {
      // Zähler für document.startViewTransition (Seitenwechsel-Probe).
      await page.addInitScript(() => {
        window.__boVT = 0;
        const orig = document.startViewTransition?.bind(document);
        if (orig) {
          document.startViewTransition = (...a) => {
            window.__boVT++;
            return orig(...a);
          };
        }
      });
      await anmelden(page);
      await page.goto("/einstellungen?tab=system&baustein=motion");
      const da = await page.getByTestId("demo-motion").waitFor({ state: "attached", timeout: 30_000 }).then(() => true, () => false);
      test.skip(!da, "Demo-Register ist in /einstellungen noch nicht eingebunden (Besitzer Team Zentrale/L0).");
    });

    test("Liste, Dialog, Scan, Ablage, Zahl, Segment, Sheet, Seitenwechsel, Erfolgsmoment", async ({ page }) => {
      await expect(page.getByTestId("demo-reduziert")).toHaveAttribute("data-reduziert", "nein");

      // Liste: neuer Eintrag ist ≤ 400 ms voll sichtbar und markiert; Entfernen nimmt genau einen weg.
      const eintraege = page.getByTestId("demo-liste-eintrag");
      const vorher = await eintraege.count();
      await page.getByTestId("demo-liste-anlegen").click();
      await expect(eintraege).toHaveCount(vorher + 1);
      await expect.poll(() => eintraege.first().evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 400 + 6 * BILD }).toBeGreaterThanOrEqual(0.99); // Feder läuft asymptotisch aus; Toleranz für den Bildtakt headless (WebKit ~110 ms)
      await expect(eintraege.first()).toHaveAttribute("data-markiert", "true");
      await page.getByTestId("demo-liste-entfernen").click();
      await expect(eintraege).toHaveCount(vorher, { timeout: 1_000 });

      // Dialog
      await messeDialogOeffnen(page);
      await oeffneDialog(page, page.getByTestId("demo-dialog-oeffnen"));
      expect((await dialogMessung(page)).ende).toBeLessThanOrEqual(200);
      await page.locator("dialog.bo-dialog[open]").getByRole("button", { name: "Abbrechen" }).click();
      await expect(page.locator("dialog.bo-dialog[open]")).toHaveCount(0);

      // Scan: Fehler hat Ring + Text + Symbol (nie Farbe allein).
      await page.getByTestId("demo-scan-unbekannt").click();
      const scan = page.getByTestId("demo-scan");
      await expect(scan).toHaveAttribute("data-ergebnis", "unbekannt");
      await expect(scan).toContainText("Unbekannter Code");
      await expect(scan).not.toHaveAttribute("data-ergebnis", /./, { timeout: 2_500 });

      // Ablage: Karte steht nach der Feder ruhig in der Zielspalte.
      await page.getByTestId("demo-kanban-umsetzen").click();
      await expect(page.getByTestId("demo-kanban")).toHaveAttribute("data-seite", "rechts");
      await page.waitForTimeout(500);
      expect(await page.getByTestId("demo-kanban-karte").evaluate((el) => el.getAnimations().length)).toBe(0);

      // Zahl: zählt bei Änderung und endet genau auf dem Zielwert.
      const zahl = page.getByTestId("demo-zahl");
      await expect.poll(async () => Number((await zahl.innerText()).replace(/\D/g, "")), { timeout: 2_000 }).toBe(1240);
      await page.getByTestId("demo-zahl-plus").click();
      await expect(zahl).toHaveText((1265).toLocaleString("de-DE"), { timeout: 1_500 });

      // Segment (Baustein P0-2) und Pillen-Reiter (useGleiter): Indikator gleitet unter die Wahl.
      const gleitetUnter = async (ind, ziel) => {
        await expect
          .poll(
            async () => {
              const a = await ind.boundingBox();
              const z = await ziel.boundingBox();
              return Math.abs(a.x - z.x) < 1.5 && Math.abs(a.width - z.width) < 1.5;
            },
            { timeout: 1_500 }
          )
          .toBe(true);
      };
      const seg = page.getByTestId("demo-segment");
      await seg.getByRole("radio", { name: "Angebot" }).click();
      await gleitetUnter(seg.locator(".bo-seg__ind"), seg.getByRole("radio", { name: "Angebot" }));
      const reiter = page.getByTestId("demo-reiter");
      await reiter.getByRole("tab", { name: "Belege" }).click();
      await gleitetUnter(page.getByTestId("demo-reiter-indikator"), reiter.getByRole("tab", { name: "Belege" }));
      expect(await page.getByTestId("demo-reiter-indikator").evaluate((el) => getComputedStyle(el).transitionTimingFunction)).toContain("linear(");

      // Sheet mit Häkchen: öffnet ≤ 200 ms, Häkchen ist am Ende gezeichnet.
      await messeDialogOeffnen(page);
      await page.getByTestId("demo-sheet-oeffnen").click();
      expect((await dialogMessung(page)).ende).toBeLessThanOrEqual(200);
      await expect.poll(() => page.getByTestId("demo-sheet").locator(".bo-tick path").evaluate((p) => getComputedStyle(p).strokeDashoffset), { timeout: 1_500 }).toMatch(/^0(px)?$/);
      await page.getByTestId("demo-sheet").getByRole("button", { name: "Schließen" }).click();
      await expect(page.getByTestId("demo-sheet")).not.toBeVisible();

      // Seitenwechsel: läuft über document.startViewTransition, Inhalt wechselt.
      const vt = await page.evaluate(() => window.__boVT);
      await page.getByTestId("demo-seite-wechseln").click();
      await expect(page.getByTestId("demo-seite")).toHaveAttribute("data-ansicht", "b");
      const hatVT = await page.evaluate(() => typeof document.startViewTransition === "function");
      if (hatVT) expect(await page.evaluate(() => window.__boVT)).toBeGreaterThan(vt);

      // Erfolgsmoment: Status-Region, Fokus auf dem nächsten Schritt.
      await page.getByTestId("demo-erfolg-abschliessen").click();
      await expect(page.getByTestId("demo-erfolg")).toBeVisible();
      await expect(page.getByRole("button", { name: "Nächster Schritt" })).toBeFocused({ timeout: 1_000 });
    });

    test("Toast: Balken pausiert bei Zeiger, Rückgängig stellt wieder her", async ({ page }) => {
      await page.getByTestId("demo-toast-zeigen").click();
      const toast = page.getByTestId("demo-toast");
      await expect(toast).toBeVisible();
      const balken = toast.locator(".bo-toast-balken");
      await toast.hover();
      await expect.poll(() => balken.evaluate((el) => el.getAnimations()[0]?.playState)).toBe("paused");
      await toast.getByRole("button", { name: "Rückgängig" }).click();
      await expect(toast).toContainText("Wiederhergestellt");
      await expect(toast).toHaveCount(0, { timeout: 3_000 });
    });
  });
});
