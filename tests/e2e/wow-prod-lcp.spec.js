// tests/e2e/wow-prod-lcp.spec.js – production LCP watch for the "Pause" hero
// (push r4, Wächter #3). Runs ONLY against a production server with the wow
// hero switched on – set WOW_PROD_LCP=1 and BASE_URL (e.g. a build outside the
// repo, qa-screenshots/wow/push-r4-prod.mjs → http://localhost:3171):
//   WOW_PROD_LCP=1 BASE_URL=http://localhost:3171 PW_WORKERS=1 npx playwright test wow-prod-lcp.spec.js --project=desktop
// Profile = qa-screenshots/wow/push-r3-prodmeasure.mjs: Moto G4, 4× CPU,
// 150 ms RTT, 1.6 Mbit/s down, cold context per run, cookie banner open.
// Target p75 ≤ 1.8 s (hard limit 2.0 s): 200 ms buffer. A run that sees
// foreign load (FCP > 2 s – the HTML alone needs ≈ 0.5 s) is REPEATED, not
// dropped (max. 3 repeats), so a busy machine cannot hide a regression.
// Also: the phone photo is AVIF, ≤ 60 KB, fetchpriority high, and the LCP
// element is the hero photo or the H1.
import { test, expect, devices } from "@playwright/test";

// No trace/screenshot/video: the trace snapshotter costs main-thread time and
// fetches the desktop srcset candidate itself (seen as a 2nd, 93 KB image request).
test.use({ trace: "off", screenshot: "off", video: "off" });

const RUNS = Number(process.env.WOW_LCP_RUNS) || 5;
const { defaultBrowserType: _m, ...MOTO_DEVICE } = devices["Moto G4"];
// The descriptor has no screen: inside the desktop project the context would
// inherit screen 1920 × 1080 and Chromium then also fetched the desktop
// candidate (93 KB) – a real Moto G4 has a 360 × 640 screen.
const MOTO = { ...MOTO_DEVICE, screen: { width: 360, height: 640 } };
const NET = { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 };
const p75 = (a) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.ceil(a.length * 0.75) - 1)];

test.describe("Wow-Hero Produktion: LCP-Wache", () => {
  test.skip(!process.env.WOW_PROD_LCP, "nur gegen einen Produktions-Build (WOW_PROD_LCP=1, BASE_URL)");

  test(`LCP p75 ≤ 1,8 s auf dem Moto-Profil (${RUNS} kalte Läufe), Handy-Foto AVIF ≤ 60 KB`, async ({ browser, baseURL }, info) => {
    info.setTimeout(600_000);
    // warm the server and the image optimizer (not measured)
    {
      const c = await browser.newContext(MOTO);
      const p = await c.newPage();
      await p.goto(baseURL + "/de", { waitUntil: "load" });
      await c.close();
    }
    const runs = [];
    let repeats = 0;
    while (runs.length < RUNS) {
      const ctx = await browser.newContext({ ...MOTO, reducedMotion: "no-preference" });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", NET);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      const images = [];
      page.on("response", async (r) => {
        if (/\/_next\/image\?url=%2FImages%2FHome%2FaboutHome/.test(r.url()))
          images.push({ url: r.url().split("?")[1], type: r.headers()["content-type"], bytes: (await r.body().catch(() => Buffer.alloc(0))).length });
      });
      await page.addInitScript(() => {
        window.__m = { lcp: null, fcp: null, cls: 0 };
        new PerformanceObserver((l) => {
          const e = l.getEntries().at(-1);
          window.__m.lcp = { t: Math.round(e.startTime), tag: e.element?.tagName, hero: !!e.element?.closest("section[aria-labelledby=home-hero-title]") };
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => l.getEntries().forEach((e) => e.name === "first-contentful-paint" && (window.__m.fcp = Math.round(e.startTime)))).observe({ type: "paint", buffered: true });
        new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && (window.__m.cls += e.value))).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(baseURL + "/de", { waitUntil: "load", timeout: 120_000 });
      await page.waitForTimeout(1500);
      const m = await page.evaluate(() => window.__m);
      const fp = await page.$eval("[data-wow-stage] img", (i) => i.getAttribute("fetchpriority"));
      await ctx.close();
      if (m.fcp > 2000 && repeats < 3) {
        repeats++;
        continue; // foreign load – repeat this run
      }
      runs.push({ ...m, images, fp });
    }
    const lcp = p75(runs.map((r) => r.lcp?.t ?? 99_999));
    info.annotations.push({ type: "lcp-p75", description: `${lcp} ms (${runs.map((r) => r.lcp?.t).join(", ")}; repeats ${repeats})` });
    info.annotations.push({ type: "images", description: JSON.stringify(runs.map((r) => r.images)) });
    for (const r of runs) {
      expect(r.lcp.hero).toBe(true);
      expect(["IMG", "H1", "SPAN"]).toContain(r.lcp.tag);
      expect(r.cls).toBeLessThan(0.05);
      expect(r.fp).toBe("high");
      expect(r.images.length).toBeGreaterThan(0);
      for (const im of r.images) {
        expect(im.type).toBe("image/avif");
        expect(im.bytes).toBeLessThanOrEqual(60 * 1024);
      }
    }
    expect(lcp).toBeLessThanOrEqual(1800);
  });
});
