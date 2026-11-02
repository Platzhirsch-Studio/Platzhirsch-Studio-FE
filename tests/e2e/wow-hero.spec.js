// tests/e2e/wow-hero.spec.js – acceptance of the "Pause" hero (push round 4)
// (Marktresearch/digital/features/wow-spezifikation.md §8.2) against the
// running server (dev: relative values; production scale: BASE_URL of an
// external build). Needs NEXT_PUBLIC_WOW_HERO on (dev default).
//   PW_WORKERS=1 npx playwright test wow-hero.spec.js --project=desktop
// Push r4: rest = the photo alone; "Die Linie zeigen" opens the comparison
// slider (56 px grip "Linie ↔ Raum"); a one-time invitation after the
// sequence; the comparison edge moves by transforms (WebKit video test).
// The production LCP watch is tests/e2e/wow-prod-lcp.spec.js.
import { test, expect, devices, webkit } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import { paperShares } from "./wow-paper.js";

const { defaultBrowserType: _p, ...PIXEL } = devices["Pixel 7"];
const { defaultBrowserType: _i, ...IPHONE } = devices["iPhone 15 Pro"];
const STAGE = "[data-wow-stage]";
const SHOW = `${STAGE} [data-wow-show]`;
const HERO = "section[aria-labelledby=home-hero-title]";
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
// Reference points in the photo (viewBox units): fireplace corners, wall
// edge, armchair edges.
const REF = [
  [1538, 561],
  [1871, 824],
  [1454, 680],
  [1024, 870],
  [1617, 894],
  [795, 1103],
];

async function open(page, url = "/de") {
  await page.addInitScript(() => {
    try {
      sessionStorage.clear();
    } catch {}
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(STAGE, { state: "attached", timeout: 150_000 });
}

// Dev pages hydrate slowly on first hit – wait generously for the island.
// Before hydration "Die Linie zeigen" stands as text with aria-disabled.
const hydrated = (page) =>
  page.waitForFunction((s) => document.querySelector(`${s}:not([aria-disabled])`), SHOW, { timeout: 150_000 });
const rest = (page) => page.waitForFunction((s) => document.querySelector(s)?.dataset.wow !== "play", STAGE, { timeout: 150_000 });

// Pause every animation of the stage at time t (ms from the pen start).
async function seek(page, t) {
  await page.evaluate(
    ([sel, t]) => {
      const f = document.querySelector(sel);
      delete f.dataset.wowWait;
      delete f.dataset.wowFade;
      delete f.dataset.wowInvite;
      delete f.dataset.wowPen; // the ink pen (dev usually starts with the compositor "wipe")
      if (f.dataset.wow !== "play") {
        f.dataset.wow = "still";
        void f.offsetWidth;
        f.dataset.wow = "play";
      }
      for (const a of f.getAnimations({ subtree: true })) {
        a.pause();
        a.currentTime = t;
      }
    },
    [STAGE, t],
  );
}
const opacity = (page, sel) =>
  page.$$eval(`${STAGE} ${sel}`, (els) => els.map((e) => Number(getComputedStyle(e).opacity)));
// horizontal offset of the paper's moving mask, in frames (−1.25 = paper over the frame, 0 = released)
const sweep = (page) =>
  page.$eval(`${STAGE} [data-wow-paper] > div`, (el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return m.m41 / el.parentElement.getBoundingClientRect().width;
  });
// comparison edge (push r4): % of the frame covered by the drawing, from the .cut transform
const edge = (page) =>
  page.$eval(`${STAGE} [data-wow-cut]`, (el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return Math.round((1 + m.m41 / el.getBoundingClientRect().width) * 100) || 0; // no −0
  });

test.describe("Wow-Hero „Pause“", () => {
  test("LCP-Element ist das Hero-Foto oder die H1 (Desktop und Pixel 7)", async ({ browser }) => {
    for (const opts of [{ viewport: { width: 1440, height: 900 } }, PIXEL]) {
      const ctx = await browser.newContext(opts);
      const page = await ctx.newPage();
      await open(page);
      await page.waitForFunction((s) => document.querySelector(`${s} img`)?.complete, STAGE, { timeout: 150_000 });
      await page.waitForTimeout(500);
      const lcp = await page.evaluate(
        () =>
          new Promise((resolve) => {
            new PerformanceObserver((l) => {
              const e = l.getEntries().at(-1);
              resolve({ tag: e.element?.tagName, inHero: !!e.element?.closest("section[aria-labelledby=home-hero-title]"), t: e.startTime });
            }).observe({ type: "largest-contentful-paint", buffered: true });
          }),
      );
      expect(["IMG", "H1", "SPAN"]).toContain(lcp.tag);
      expect(lcp.inHero).toBe(true);
      // The photo is never hidden: painted from frame 0 under the paper layer.
      const img = await page.$eval(`${STAGE} img`, (el) => {
        const s = getComputedStyle(el);
        return { o: s.opacity, v: s.visibility, d: s.display, fp: el.getAttribute("fetchpriority") };
      });
      expect(img).toEqual({ o: "1", v: "visible", d: "block", fp: "high" });
      await ctx.close();
    }
  });

  for (const vp of VIEWPORTS) {
    test(`CLS < 0,05 über 6 s und Deckung ≤ 2 px bei ${vp.width} px`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (window.__cls += e.value))).observe({
          type: "layout-shift",
          buffered: true,
        });
      });
      await open(page);
      await page.waitForTimeout(6000);
      expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.05);
      // Registration: the line SVG maps every reference point to the same CSS
      // pixel as object-fit: cover + object-position 50 % 100 % maps the photo pixel.
      const worst = await page.evaluate(
        ([sel, refs]) => {
          const img = document.querySelector(`${sel} img`);
          const svg = document.querySelector(`${sel} [data-wow-clock]`);
          const r = img.getBoundingClientRect();
          const k = Math.max(r.width / 2048, r.height / 1228);
          const ox = r.left + (r.width - 2048 * k) / 2;
          const oy = r.top + (r.height - 1228 * k);
          // .cut/.cutIn move by equal and opposite amounts, so the drawing stays registered at any edge
          const m = svg.getScreenCTM();
          let max = 0;
          for (const [x, y] of refs) {
            const p = new DOMPoint(x, y).matrixTransform(m);
            max = Math.max(max, Math.hypot(p.x - (ox + x * k), p.y - (oy + y * k)));
          }
          return max;
        },
        [STAGE, REF],
      );
      expect(worst).toBeLessThanOrEqual(2);
      await ctx.close();
    });
  }

  test("Choreografie: Vorzeichnung ab Bild 0, ein Strich zuerst, Freigabe per Transform, Höhepunkt 1,4 s, Ruhe ab 3,24 s, Text bewegt sich nie", async ({ page }) => {
    await open(page);
    await hydrated(page);
    const h1 = await page.locator("#home-hero-title").boundingBox();
    // R8: the layers are <use> clones of one <defs> path each (RSC payload, technik P1-1)
    const gesture = () => page.$eval(`${STAGE} [data-gesture] :is(path, use)`, (p) => parseFloat(getComputedStyle(p).strokeDashoffset));
    await seek(page, 0); // paper, construction lines and the pencil underdrawing stand, no pen yet
    expect((await opacity(page, "[data-wow-guides]"))[0]).toBe(1);
    // R5-fix P2 (technik P1-2, bewusst geändert): the underdrawing keeps to the
    // architecture (room, wall edge, fireplace) – no armchair line before the
    // Minotti image sign-off (src/lib/wow/strokes.js); was ≥ 11 with the chairs.
    expect(await page.locator(`${STAGE} [data-wow-under] :is(path, use)`).count()).toBeGreaterThanOrEqual(3); // luxus-cd r4 #2
    expect(await page.locator(`${STAGE} [data-wow-under] use[href*="chair"]`).count()).toBe(0);
    expect(await edge(page)).toBe(100); // the drawing covers the frame while it plays
    expect((await opacity(page, "[data-wow-paper]"))[0]).toBe(1);
    expect(await sweep(page)).toBeCloseTo(-1.25, 2);
    expect(await gesture()).toBeCloseTo(1, 2);
    await seek(page, 600); // line: the room is closed
    expect(await gesture()).toBeLessThan(0.01);
    expect((await opacity(page, "[data-wow-light]"))[0]).toBe(0);
    await seek(page, 950); // light: the warm wedge is in, the paper still covers the frame
    expect((await opacity(page, "[data-wow-light]"))[0]).toBeGreaterThan(0.9);
    expect(await sweep(page)).toBeCloseTo(-1.25, 2);
    await seek(page, 1250); // release: the edge travels from the window side
    const mid = await sweep(page);
    expect(mid).toBeGreaterThan(-1.2);
    expect(mid).toBeLessThan(-0.05);
    await seek(page, 2000); // registration: full photo, line with warm core, no construction lines
    expect(await sweep(page)).toBeCloseTo(0, 2);
    expect((await opacity(page, "[data-wow-clock]"))[0]).toBe(1);
    expect((await opacity(page, "[data-wow-lit]"))[0]).toBeGreaterThan(0.9);
    expect((await opacity(page, "[data-wow-guides]"))[0]).toBeLessThan(0.001);
    await seek(page, 2900); // Wächter r4 #4: the warm line still stands 1.36 s into the climax
    expect((await opacity(page, "[data-wow-lit]"))[0]).toBeGreaterThan(0.9);
    await seek(page, 3300); // after the outro: nothing over the photo
    expect((await opacity(page, "[data-wow-clock]"))[0]).toBeLessThan(0.001);
    expect((await opacity(page, "[data-wow-lit]"))[0]).toBeLessThan(0.001);
    expect(await page.locator("#home-hero-title").boundingBox()).toEqual(h1);
  });

  test("Start: wartet auf Papier (state line), Eingabe springt sofort zum Raum mit Überblendung", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await open(page);
    const s0 = await page.$eval(STAGE, (f) => ({ wait: f.hasAttribute("data-wow-wait"), state: f.dataset.wowState, wow: f.dataset.wow }));
    if (s0.wait) expect(s0.state).toBe("line"); // the paper is what is visible
    if (s0.wow === "play") {
      await page.mouse.wheel(0, 10);
      await expect(page.locator(STAGE)).toHaveAttribute("data-wow", "still");
      await expect(page.locator(STAGE)).toHaveAttribute("data-wow-state", "room");
      await expect(page.locator(STAGE)).toHaveAttribute("data-wow-fade", "");
      await expect(page.locator(STAGE)).not.toHaveAttribute("data-wow-invite", /.*/); // no invitation after a skip
    }
    await ctx.close();
  });

  test("iPhone 393 × 659 mit Cookie-Banner: Bühne (16:10), H1 und „Termin wählen“ enden über dem Banner (≤ 500 px)", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 393, height: 659 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await ctx.newPage();
    await page.goto("/de", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(STAGE, { state: "attached", timeout: 150_000 });
    const accept = page.getByRole("button", { name: /Alle akzeptieren/ });
    await accept.waitFor({ timeout: 150_000 });
    const geo = await page.evaluate((h) => {
      let b = [...document.querySelectorAll("button")].find((x) => /Alle akzeptieren/.test(x.textContent));
      while (b && getComputedStyle(b).position !== "fixed" && getComputedStyle(b).position !== "sticky") b = b.parentElement;
      const cta = document.querySelector(`${h} [data-wow-cta]`).getBoundingClientRect();
      const frame = document.querySelector("[data-wow-frame]").getBoundingClientRect();
      return { banner: b ? b.getBoundingClientRect().top : innerHeight, cta: cta.bottom, frameTop: frame.top, ratio: frame.width / frame.height };
    }, HERO);
    expect(geo.frameTop).toBeLessThan(80);
    expect(geo.ratio).toBeCloseTo(1.6, 1); // r4 awwwards #3: 16:10 instead of 2:1
    expect(geo.cta).toBeLessThanOrEqual(500);
    expect(geo.cta).toBeLessThanOrEqual(geo.banner);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
    await ctx.close();
  });

  test("Bühne zuerst: 390 × 844 – Bühne ganz im ersten Bild, Termin-Knopf und Schlusszeile sichtbar", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await open(page);
    const frame = await page.locator(`${STAGE} [data-wow-frame]`).boundingBox();
    const cta = await page.locator(`${HERO} [data-wow-cta]`).boundingBox();
    expect(frame.y).toBeLessThan(80);
    expect(frame.y + frame.height).toBeLessThanOrEqual(844);
    expect(cta.y + cta.height).toBeLessThanOrEqual(844);
    // Wächter #4: "Zur Planung" on phones, 44 px, after "Termin wählen"
    const plan = page.locator(`${HERO} p[data-wow-coda] a`);
    await expect(plan).toBeVisible();
    const pb = await plan.boundingBox();
    expect(pb.height).toBeGreaterThanOrEqual(44);
    expect(pb.y).toBeGreaterThan(cta.y);
    await expect(page.locator(`${STAGE} figcaption [data-wow-coda]`)).toBeHidden(); // shown once only
    // r4: the button lies on the photo (no bar under it)
    await hydrated(page);
    await rest(page);
    const sb = await page.locator(SHOW).boundingBox();
    expect(sb.y + sb.height).toBeLessThanOrEqual(frame.y + frame.height);
    expect(sb.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await ctx.close();
  });

  test("Desktop: Bühne randlos bis zum rechten Rand (≥ 60 % ab 1280 px), Foto nicht hochskaliert, kein horizontales Scrollen", async ({ browser }) => {
    for (const width of [1440, 1920]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();
      await open(page);
      const frame = await page.locator(`${STAGE} [data-wow-frame]`).boundingBox();
      expect(Math.round(frame.x + frame.width)).toBeGreaterThanOrEqual(width - 20); // scrollbar
      expect(frame.width / width).toBeGreaterThan(0.6); // r4: columns 5–12 from xl
      // 1× screen: the chosen file is at least as wide as the frame (or the 1920 w maximum)
      await page.waitForFunction((s) => document.querySelector(`${s} img`)?.complete, STAGE);
      const w = await page.$eval(`${STAGE} img`, (i) => Number(new URL(i.currentSrc).searchParams.get("w")));
      expect(w).toBeGreaterThanOrEqual(Math.min(1920, Math.floor(frame.width)));
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await ctx.close();
    }
  });

  test("Horizontlinie schneidet die H1 nicht (≥ 12 px Abstand) bei 1280, 1440 und 1920 px", async ({ browser }) => {
    for (const width of [1280, 1440, 1920]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      await open(page);
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const r = await page.evaluate((s) => {
        const hz = document.querySelector(`${s} [data-wow-reach] > span`).getBoundingClientRect();
        const rects = [];
        const walk = document.createTreeWalker(document.getElementById("home-hero-title"), NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(n);
          rects.push(...[...range.getClientRects()].filter((x) => x.width > 0).map((x) => ({ l: x.left, r: x.right, t: x.top, b: x.bottom })));
        }
        return { hz: { l: hz.left, r: hz.right, y: hz.top, w: hz.width }, rects };
      }, STAGE);
      for (const t of r.rects) {
        const overlapsX = r.hz.w > 0 && r.hz.l < t.r + 12 && r.hz.r > t.l;
        const nearY = r.hz.y > t.t - 12 && r.hz.y < t.b + 12;
        expect(overlapsX && nearY, `${width}: horizon ${JSON.stringify(r.hz)} vs line ${JSON.stringify(t)}`).toBe(false);
      }
      await ctx.close();
    }
  });

  // R5-USP (bewusst geändert, gesamtwerk P1-5): the line no longer vanishes –
// at rest the photo carries ONLY the resting line ([data-wow-rest]); no paper
// strip, no seam, no other layer (pixel test without the rest layer hidden).
test("Endzustand: Foto mit ruhender Linie (Pixeltest), „Die Linie zeigen“ öffnet den Regler, Zeiger und Tastatur", async ({ page }) => {
    await open(page);
    await hydrated(page);
    await rest(page);
    await page.waitForFunction((s) => !document.querySelector(s).hasAttribute("data-wow-invite"), STAGE, { timeout: 10_000 });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    const frame = page.locator(`${STAGE} [data-wow-frame]`);
    const box = await frame.boundingBox();
    expect(await edge(page)).toBe(0); // luxus-cd / Wächter r4: no paper strip at rest
    await expect(page.locator(`${STAGE} [data-wow-handle]`)).toBeHidden();
    // the whole frame is exactly photo + resting line (no strip, no seam, no other layer)
    expect(Number(await page.locator(`${STAGE} [data-wow-rest]`).evaluate((e) => getComputedStyle(e).opacity))).toBe(1);
    const all = { x: Math.ceil(box.x), y: Math.ceil(box.y), width: Math.floor(box.width) - 1, height: Math.floor(box.height) - 1 };
    const withLayers = await page.screenshot({ clip: all });
    const hide = await page.addStyleTag({ content: `${STAGE} [data-wow-frame] > :not(picture):not([data-wow-rest]), ${STAGE} [data-wow-handle]{visibility:hidden!important}` });
    const photoOnly = await page.screenshot({ clip: all });
    await hide.evaluate((el) => el.remove());
    expect(withLayers.equals(photoOnly)).toBe(true);
    // "Die Linie zeigen" → comparison at 50 %, labelled 56 px handle
    const show = page.locator(SHOW);
    await expect(show).toHaveText(/Die Linie zeigen/);
    await show.click();
    await expect(show).toHaveText(/Nur das Foto/);
    const handle = page.locator(`${STAGE} [data-wow-handle]`);
    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute("aria-valuenow", "50");
    await expect(handle).toContainText("Linie ↔ Raum");
    await page.waitForTimeout(700);
    expect(await edge(page)).toBe(50);
    expect((await handle.boundingBox()).width).toBe(56); // awwwards r4 #2
    // keyboard: 5 % steps, Home/End
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", "55");
    await page.keyboard.press("End");
    await expect(handle).toHaveAttribute("aria-valuenow", "100");
    await page.keyboard.press("Home");
    await expect(handle).toHaveAttribute("aria-valuenow", "0");
    // pointer: tap in the photo moves the edge there (single-pointer alternative, WCAG 2.5.7)
    const fb = await frame.boundingBox();
    await page.mouse.click(fb.x + fb.width * 0.5, fb.y + fb.height * 0.3);
    await expect(handle).toHaveAttribute("aria-valuenow", /^(49|50|51)$/);
    await page.waitForTimeout(700);
    const hb = await handle.boundingBox();
    await page.mouse.move(hb.x + hb.width / 2, fb.y + fb.height / 2);
    await page.mouse.down();
    await page.mouse.move(fb.x + fb.width * 0.3, fb.y + fb.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(handle).toHaveAttribute("aria-valuenow", /^(29|30|31)$/);
    // close again: the photo alone
    await show.click();
    await expect(handle).toBeHidden();
    await page.waitForTimeout(700);
    expect(await edge(page)).toBe(0);
  });

  test("Einladung: einmal nach dem Ende gleitet die Linie auf 35 % und zurück, ph:wow-done genau einmal", async ({ page }) => {
    await page.addInitScript(() => {
      window.__done = 0;
      window.__inv = [];
      window.addEventListener("ph:wow-done", () => window.__done++);
      const seek = new MutationObserver(() => {
        const f = document.querySelector("[data-wow-stage]");
        if (!f) return;
        seek.disconnect();
        new MutationObserver(() => window.__inv.push(f.hasAttribute("data-wow-invite"))).observe(f, { attributes: true, attributeFilter: ["data-wow-invite"] });
      });
      seek.observe(document, { childList: true, subtree: true });
    });
    await open(page);
    await rest(page);
    const natural = await page.$eval(STAGE, (f) => f.dataset.wow === "done");
    await page.waitForTimeout(1800);
    const r = await page.evaluate(() => ({ done: window.__done, flag: window.phWowDone, inv: window.__inv }));
    expect(r.done).toBe(1);
    expect(r.flag).toBe(true);
    if (natural) expect(r.inv).toEqual([true, false]); // once, then gone
    expect(await edge(page)).toBe(0);
  });

  // Team Grün (Konsolidierung 30.10.2026), Regression: WowControls wartete auf Foto + Leerlauf,
  // während die START_DEADLINE des Startskripts die Sequenz schon selbst startete (Wait weg) –
  // der Leerlauf-Rückruf brach dann ab, und data-wow blieb für immer "play" (2 Ausfälle im
  // Volllauf). Erzwungen wird die Reihenfolge Hydration → Deadline → Leerlauf: Deadline auf
  // 4 s, requestIdleCallback auf 7 s verschoben. Erwartet: die Sequenz endet trotzdem.
  test("Deadline startet die Sequenz, während WowControls auf Leerlauf wartet: endet trotzdem (kein ewiges play)", async ({ page }) => {
    await page.addInitScript(() => {
      const st = window.setTimeout;
      window.setTimeout = (fn, ms, ...a) => st(fn, ms === 850 ? 4000 : ms, ...a);
      window.requestIdleCallback = (fn) => st(() => fn({ didTimeout: true, timeRemaining: () => 0 }), 7000);
    });
    await open(page);
    await hydrated(page);
    // Hydration vor der (verschobenen) Deadline, sonst prüft der Test die Race nicht.
    expect(await page.$eval(STAGE, (f) => f.dataset.wow === "play" && f.hasAttribute("data-wow-wait"))).toBe(true);
    await page.waitForFunction((s) => !document.querySelector(s).hasAttribute("data-wow-wait"), STAGE, { timeout: 10_000 });
    await page.waitForFunction((s) => document.querySelector(s).dataset.wow === "done", STAGE, { timeout: 20_000 });
    expect(await page.evaluate(() => window.phWowDone)).toBe(true);
  });

  test("WebKit (Video): nach der Freigabe nie mehr Papier über dem Foto als die Einladung (≤ 38 %), am Ende ≤ 2 % (Wächter r4 #1)", async ({ baseURL }, info) => {
    info.setTimeout(300_000);
    const b = await webkit.launch();
    const ctx = await b.newContext({ ...IPHONE, baseURL, reducedMotion: "no-preference", recordVideo: { dir: info.outputPath("video"), size: IPHONE.viewport } });
    const page = await ctx.newPage();
    await page.goto("/de", { waitUntil: "commit", timeout: 150_000 });
    await page.waitForFunction(() => { const f = document.querySelector("[data-wow-stage]"); return f && f.dataset.wow !== "play"; }, null, { timeout: 150_000 });
    const played = await page.$eval(STAGE, (f) => f.dataset.wow === "done");
    await page.waitForTimeout(2600); // invitation (1.4 s) and rest
    const fr = await page.$eval(`${STAGE} [data-wow-frame]`, (e) => {
      const r = e.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    const video = await page.video().path();
    await ctx.close();
    await b.close();
    const shares = await paperShares(video, fr);
    fs.writeFileSync(info.outputPath("paper-shares.json"), JSON.stringify(shares));
    const first = shares.findIndex((x) => x.share > 0.5);
    const released = first < 0 ? 0 : shares.findIndex((x, i) => i > first && x.share <= 0.02);
    if (played) {
      expect(first, "the paper was seen").toBeGreaterThanOrEqual(0);
      expect(released, "the paper left").toBeGreaterThan(first);
    }
    const after = shares.slice(Math.max(0, released));
    expect(Math.max(...after.map((x) => x.share))).toBeLessThanOrEqual(0.38);
    expect(shares.at(-1).share).toBeLessThanOrEqual(0.02);
  });

  for (const mode of ["emulation", "attribute"]) {
    test(`Reduced Motion (${mode}): erster Frame = Endzustand (nur das Foto), Linie per Knopf, keine Einladung`, async ({ browser }) => {
      const ctx = await browser.newContext({ reducedMotion: mode === "emulation" ? "reduce" : "no-preference" });
      const page = await ctx.newPage();
      // "Ruhige Ansicht" is stored in localStorage; the start script reads it (push r3).
      if (mode === "attribute") await page.addInitScript(() => localStorage.setItem("ph-calm-view", "on"));
      await open(page);
      await expect(page.locator(STAGE)).toHaveAttribute("data-wow", "still");
      expect(await page.$eval(STAGE, (f) => f.getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.animationName).length)).toBe(0);
      expect(await edge(page)).toBe(0);
      await hydrated(page);
      expect(await page.evaluate(() => window.phWowDone)).toBe(true); // the banner may come at once
      await page.locator(SHOW).click();
      await page.waitForTimeout(700);
      expect(await edge(page)).toBe(50);
      await expect(page.locator(STAGE)).not.toHaveAttribute("data-wow-invite", /.*/);
      await ctx.close();
    });
  }

  test("Ohne JavaScript: Sequenz läuft, Knopf als Text sichtbar, Endzustand sauber", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/de", { waitUntil: "domcontentloaded" });
    await expect(page.locator(STAGE)).toHaveAttribute("data-wow", "play");
    await expect(page.locator(SHOW)).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator(`${STAGE} [data-wow-handle]`)).toBeHidden(); // the slider needs JS
    await page.waitForTimeout(4000);
    expect(await sweep(page)).toBeCloseTo(0, 2);
    expect((await opacity(page, "[data-wow-clock]"))[0]).toBeLessThan(0.001);
    await ctx.close();
  });

  test("Fokusreihenfolge: H1 → Termin wählen → Bühne (Spez. §8.2 Nr. 8)", async ({ browser }) => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const ctx = await browser.newContext({ viewport });
      const page = await ctx.newPage();
      await open(page);
      await hydrated(page);
      const order = await page.evaluate(
        ([s, h]) => {
          const f = document.querySelector(s);
          const t = document.querySelector("#home-hero-title");
          const c = document.querySelector(`${h} [data-wow-cta]`);
          const before = (a, b) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
          return before(t, c) && before(c, f);
        },
        [STAGE, HERO],
      );
      expect(order).toBe(true);
      await page.evaluate(() => document.activeElement?.blur());
      let seenStage = false;
      let reached = false;
      for (let i = 0; i < 40 && !reached; i++) {
        await page.keyboard.press("Tab");
        const where = await page.evaluate(
          ([s, h]) => {
            const a = document.activeElement;
            return { cta: !!a?.matches(`${h} [data-wow-cta]`), stage: !!a?.closest(s) };
          },
          [STAGE, HERO],
        );
        if (where.stage) seenStage = true;
        if (where.cta) reached = true;
      }
      expect(reached).toBe(true);
      expect(seenStage).toBe(false);
      if (viewport.width < 640) {
        const frame = await page.locator(`${STAGE} [data-wow-frame]`).boundingBox();
        const h1 = await page.locator("#home-hero-title").boundingBox();
        expect(frame.y).toBeLessThan(h1.y);
      }
      await ctx.close();
    }
  });

  test("Tastatur: „Die Linie zeigen“, dann der Regler, Treffer ≥ 44 px, Sessel nur bei Fokus", async ({ page }) => {
    await open(page);
    await hydrated(page);
    await rest(page);
    const show = page.locator(SHOW);
    const handle = page.locator(`${STAGE} [data-wow-handle]`);
    await show.focus();
    await page.keyboard.press("Enter");
    await expect(show).toHaveText(/Nur das Foto/);
    await page.keyboard.press("Tab");
    await expect(handle).toBeFocused(); // the slider follows the button
    await page.keyboard.press("ArrowLeft");
    await expect(handle).toHaveAttribute("aria-valuenow", "45");
    for (const b of await page.locator(`${STAGE} button, ${STAGE} [data-wow-handle], ${STAGE} figcaption a`).all()) {
      const box = await b.boundingBox();
      if (box) expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    }
    await show.click();
    await expect(handle).toBeHidden(); // closed: not in the tab order
    // armchair contour: never at rest, only on :focus-visible of "Termin wählen" (if the overlay is enabled)
    if (await page.locator(`${STAGE} [data-wow-chair]`).count()) {
      expect(await page.$eval(`${STAGE} [data-wow-chair]`, (p) => Number(getComputedStyle(p).opacity))).toBe(0);
      const cta = page.locator(`${HERO} [data-wow-cta]`);
      await cta.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(400);
      expect(await page.$eval(`${STAGE} [data-wow-chair]`, (p) => Number(getComputedStyle(p).opacity))).toBe(1);
    }
  });

  test("axe: 0 serious/critical im Hero (in der Sequenz, in Ruhe und mit offener Linie)", async ({ page }) => {
    await open(page);
    const tags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
    const early = await new AxeBuilder({ page }).include(HERO).withTags(tags).analyze();
    await rest(page);
    await page.waitForTimeout(1800);
    const late = await new AxeBuilder({ page }).include(HERO).withTags(tags).analyze();
    await page.locator(SHOW).click();
    await page.waitForTimeout(700);
    const opened = await new AxeBuilder({ page }).include(HERO).withTags(tags).analyze();
    for (const r of [early, late, opened]) {
      const severe = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(severe.map((v) => v.id)).toEqual([]);
    }
  });
});
