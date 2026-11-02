// tools/qa/perf.mjs
// Lab measurement of TTFB (R4), LCP, CLS and TBT (long tasks) for a few pages, mobile
// throttled and desktop. Meant for a production server (`next start`), see
// tools/qa/prod-check.mjs; against the dev server the numbers are meaningless.
//
//   node tools/qa/perf.mjs [--base=http://localhost:3100] [--runs=3] [--json=out.json] [path …]
//
// Profiles (same as redesign/00-integration.md §5):
//   mobile  – Pixel 7, 4× CPU slowdown, 1.6 Mbit/s down, 750 kbit/s up, 150 ms RTT
//   desktop – 1440 × 900, 10 Mbit/s down, 5 Mbit/s up, 40 ms RTT
// Every page is loaded once unmeasured first (warms the server and the image
// optimizer cache), then `runs` times in a fresh context (cold browser cache,
// first visit with the cookie banner), and the median is reported.
// Budgets (Digital-Masterplan, Budget-Tor): LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms.
import { chromium, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_PATHS = [
  "/de",
  "/de/produkte",
  "/de/ueber-uns/marken/minotti",
  "/de/produkte/lamps/lamps-2097-18",
  "/de/kontakt",
  // R5-release: catalogue with the gallery tiles (TBT 379 ms in R4, R5-produkt)
  "/de/produkte/lamps",
];

export const BUDGET = { lcp: 2500, cls: 0.1, tbt: 200 };

const PROFILES = {
  mobile: {
    context: { ...devices["Pixel 7"] },
    network: { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
    cpu: 4,
  },
  desktop: {
    context: { viewport: { width: 1440, height: 900 } },
    network: { offline: false, latency: 40, downloadThroughput: (10 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 },
    cpu: 1,
  },
};

// Installed before any page script: collects LCP, layout shifts and long tasks.
const OBSERVER = () => {
  const m = { lcp: 0, lcpEl: "", cls: 0, tbt: 0, longTasks: 0, tasks: [] };
  window.__perf = m;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        m.lcp = e.startTime;
        const el = e.element;
        m.lcpEl = el ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${e.url ? " " + e.url.slice(0, 120) : ""}` : e.url || "";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) m.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        m.longTasks += 1;
        m.tbt += Math.max(0, e.duration - 50);
        m.tasks.push([e.startTime, e.duration]);
      }
    }).observe({ type: "longtask", buffered: true });
  } catch {
    /* observer type not supported */
  }
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};

async function measureOnce(browser, profile, url) {
  const ctx = await browser.newContext({ ...profile.context, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text().slice(0, 200)));
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.addInitScript(OBSERVER);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", profile.network);
  if (profile.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
  const t0 = Date.now();
  const res = await page.goto(url, { waitUntil: "load", timeout: 180_000 });
  const loadMs = Date.now() - t0;
  // LCP candidates stop at the first input; give late images and fonts time.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2_500);
  const m = await page.evaluate(() => {
    // TTFB: navigation responseStart (server time + throttled network RTT).
    const nav = performance.getEntriesByType("navigation")[0];
    // R6-release fix: also TBT in the Lighthouse sense (long tasks from FCP on),
    // for information only; the gate stays "all long tasks" (tbt).
    const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    const tbtFcp = window.__perf.tasks.filter(([s]) => s >= fcp).reduce((a, [, d]) => a + Math.max(0, d - 50), 0);
    return { ...window.__perf, tasks: undefined, fcp, tbtFcp, ttfb: nav ? nav.responseStart : 0 };
  });
  await ctx.close();
  return { status: res?.status() ?? null, loadMs, ...m, ttfb: Math.round(m.ttfb), lcp: Math.round(m.lcp), tbt: Math.round(m.tbt), tbtFcp: Math.round(m.tbtFcp), fcp: Math.round(m.fcp), cls: Number(m.cls.toFixed(4)), errors };
}

export async function measure({ base = "http://localhost:3100", paths = DEFAULT_PATHS, runs = 3, log = console.log } = {}) {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const [name, profile] of Object.entries(PROFILES)) {
      for (const p of paths) {
        const url = new URL(p, base).toString();
        await measureOnce(browser, profile, url).catch(() => null); // warm-up, not counted
        const samples = [];
        for (let i = 0; i < runs; i += 1) {
          try {
            samples.push(await measureOnce(browser, profile, url));
          } catch (err) {
            samples.push({ error: String(err).slice(0, 200) });
          }
        }
        const ok = samples.filter((s) => !s.error);
        const row = {
          profile: name,
          path: p,
          status: ok[0]?.status ?? null,
          ttfb: median(ok.map((s) => s.ttfb)),
          lcp: median(ok.map((s) => s.lcp)),
          cls: median(ok.map((s) => s.cls)),
          tbt: median(ok.map((s) => s.tbt)),
          tbtFcp: median(ok.map((s) => s.tbtFcp)),
          lcpElement: ok.find((s) => s.lcpEl)?.lcpEl || "",
          samples,
        };
        row.withinBudget = row.lcp !== null && row.lcp <= BUDGET.lcp && row.cls <= BUDGET.cls && row.tbt <= BUDGET.tbt;
        results.push(row);
        log(
          `${name.padEnd(7)} ${String(row.status).padEnd(4)} ${p.padEnd(36)} TTFB ${row.ttfb} ms  LCP ${row.lcp} ms  CLS ${row.cls}  TBT ${row.tbt} ms (ab FCP ${row.tbtFcp})  ${row.withinBudget ? "ok" : "ÜBER BUDGET"}  ${row.lcpElement}`,
        );
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .filter((a) => a.startsWith("--"))
      .map((a) => {
        const [k, v] = a.slice(2).split("=");
        return [k, v ?? true];
      }),
  );
  const paths = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const results = await measure({
    base: args.base || "http://localhost:3100",
    runs: Number(args.runs) || 3,
    paths: paths.length ? paths : DEFAULT_PATHS,
  });
  if (args.json) {
    const out = path.resolve(String(args.json));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify({ budget: BUDGET, results }, null, 2));
  }
}
