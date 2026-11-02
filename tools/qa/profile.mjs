// tools/qa/profile.mjs — CPU profile of a page load (R6-release), for the
// team-lead decision when a page stays above the TBT budget.
//
//   node tools/qa/profile.mjs --base=http://localhost:3100 [--out=<dir>] [--runs=3] [path …]
//   (or as opt-in step "profile" of tools/qa/prod-check.mjs)
//
// Same mobile profile as perf.mjs (Pixel 7, 4x CPU, 1.6 Mbit/s, 150 ms RTT,
// cold context, cookie banner visible). Per run it records the V8 CPU profile
// (CDP Profiler) from navigation until 2.5 s after networkidle, plus every long
// task (> 50 ms) with its start and duration. Output per page:
//   <slug>.cpuprofile   (run with the median TBT; open in Chrome DevTools → Performance)
//   profile.json        TBT/long tasks per run, self time by script and by function
// Only reads pages; never sends a form.
import { chromium, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MOBILE = {
  context: { ...devices["Pixel 7"] },
  network: { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 },
  cpu: 4,
};

const OBSERVER = () => {
  const m = { tasks: [] };
  window.__lt = m;
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) m.tasks.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) });
    }).observe({ type: "longtask", buffered: true });
  } catch {
    /* not supported */
  }
};

/** Self time (ms) per script URL and per function from a V8 CPU profile. */
export function summarize(profile, top = 15) {
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas || [];
  (profile.samples || []).forEach((id, i) => self.set(id, (self.get(id) || 0) + (dt[i] || 0) / 1000));
  const byUrl = {};
  const byFn = {};
  for (const [id, ms] of self) {
    const cf = byId.get(id)?.callFrame || {};
    const url = cf.url ? cf.url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "") : `(${cf.functionName || "program"})`;
    byUrl[url] = (byUrl[url] || 0) + ms;
    const fn = `${cf.functionName || "(anonym)"} @ ${url}${cf.lineNumber >= 0 ? `:${cf.lineNumber + 1}` : ""}`;
    byFn[fn] = (byFn[fn] || 0) + ms;
  }
  const sorted = (o) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([k, v]) => ({ name: k, selfMs: Math.round(v) }));
  return { byUrl: sorted(byUrl), byFunction: sorted(byFn) };
}

async function profileOnce(browser, url) {
  const ctx = await browser.newContext({ ...MOBILE.context, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.addInitScript(OBSERVER);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", MOBILE.network);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: MOBILE.cpu });
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  await cdp.send("Profiler.start");
  const res = await page.goto(url, { waitUntil: "load", timeout: 180_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2_500);
  const { profile } = await cdp.send("Profiler.stop");
  const lt = await page.evaluate(() => window.__lt);
  await ctx.close();
  const tasks = lt?.tasks || [];
  return { status: res?.status() ?? null, tbt: tasks.reduce((s, t) => s + Math.max(0, t.dur - 50), 0), tasks, profile };
}

export async function profilePages({ base = "http://localhost:3100", paths, runs = 3, out, log = console.log }) {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const result = [];
  try {
    for (const p of paths) {
      const url = new URL(p, base).toString();
      await profileOnce(browser, url).catch(() => null); // warm-up
      const samples = [];
      for (let i = 0; i < runs; i += 1) samples.push(await profileOnce(browser, url));
      const sorted = [...samples].sort((a, b) => a.tbt - b.tbt);
      const med = sorted[Math.floor((sorted.length - 1) / 2)];
      const slug = p.replace(/^\//, "").replace(/[^\w-]+/g, "-") || "root";
      fs.writeFileSync(path.join(out, `${slug}.cpuprofile`), JSON.stringify(med.profile));
      const row = {
        path: p,
        status: med.status,
        tbtRuns: samples.map((s) => s.tbt),
        tbtMedian: med.tbt,
        longTasks: med.tasks,
        biggestTask: med.tasks.reduce((m, t) => (t.dur > (m?.dur || 0) ? t : m), null),
        ...summarize(med.profile),
        cpuprofile: `${slug}.cpuprofile`,
      };
      result.push(row);
      log(`profil  ${p.padEnd(36)} TBT ${row.tbtRuns.join("/")} ms (Median ${row.tbtMedian}), ${med.tasks.length} Long Tasks, größter ${row.biggestTask?.dur ?? 0} ms`);
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(out, "profile.json"), JSON.stringify(result, null, 2));
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .filter((a) => a.startsWith("--"))
      .map((a) => {
        const i = a.indexOf("=");
        return i < 0 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)];
      }),
  );
  const paths = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  await profilePages({
    base: String(args.base || "http://localhost:3100"),
    runs: Number(args.runs) || 3,
    out: path.resolve(String(args.out || "profile-out")),
    paths: paths.length ? paths : ["/de"],
  });
}
