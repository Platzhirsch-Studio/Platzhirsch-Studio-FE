// tools/qa/shoot.mjs
// Visual QA: screenshots one or more pages on phone, tablet and desktop, plus a
// list of console errors and failed requests, for agents and people to review.
//
//   node tools/qa/shoot.mjs <out-dir> <url> [url …]
//
// Writes <out-dir>/<slug>--<device>.png (viewport) and …--full.png (full page,
// desktop only), and <out-dir>/report.json. Needs the dev server (default :3000).
//
// R5-release: SHOOT_PORTAL_SECRET=<PORTAL_SESSION_SECRET of that server> adds a
// signed demo session (customer CUST-DEMO-0001, 1 h) for URLs under /portal,
// as tests/e2e/r3-portal-voice.spec.js does – only for a mock-adapter server.
//
// R5-Fix P1 (Auftrag 9):
//  - file names include the query (?thema=yacht) and are unique per run, so no
//    screenshot overwrites another (tools/qa/shoot-lib.mjs slugOf/uniqueSlugs);
//  - report.json is written after EVERY URL (a crash keeps what was done);
//  - each URL has its own time limit (SHOOT_URL_TIMEOUT_MS, default 180 s):
//    a hanging page is recorded with "error": "timeout …" and the run goes on.

import { chromium, webkit, devices } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { uniqueSlugs, withTimeout } from "./shoot-lib.mjs";

const [outDir, ...urls] = process.argv.slice(2);
if (!outDir || !urls.length) {
  console.error("usage: node tools/qa/shoot.mjs <out-dir> <url> [url …]");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const DEVICES = [
  { name: "iphone", browser: webkit, options: devices["iPhone 15 Pro"] },
  { name: "android", browser: chromium, options: devices["Pixel 7"] },
  { name: "ipad", browser: webkit, options: devices["iPad Pro 11"] },
  { name: "desktop", browser: chromium, options: { viewport: { width: 1440, height: 900 } }, full: true },
];

// P6 Runde 2 (Dev-Server-Stabilität, release-check R2 P2-6): `next dev` baut
// eine Route beim ersten Aufruf. Kamen mehrere kalte Aufrufe gleichzeitig
// (Teams parallel, vier Geräte), antwortete er gelegentlich mit 500 oder
// einer leeren Antwort, einmal auch mit beschädigter
// .next/dev/prerender-manifest.json (paralleles Schreiben derselben Datei
// durch zwei Kompilierungen). Abhilfe hier, ohne Server-Neustart:
//  1. Warm-up: jede URL einmal nacheinander abrufen (bis zu 3 Versuche mit
//     Pause), bevor die Geräte starten – die Route ist dann kompiliert.
//  2. Seitenaufruf: bei 5xx oder Netzfehler ein zweiter Versuch nach 3 s
//     (im Bericht als "retried": true vermerkt, nie verschwiegen).
// SHOOT_NO_WARMUP=1 schaltet 1. ab (z. B. gegen einen Prod-Server).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function warmUp(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(180_000) });
      await res.arrayBuffer();
      if (res.status < 500) return res.status;
    } catch {
      /* next attempt */
    }
    await sleep(2000 * (i + 1));
  }
  return null;
}
if (!process.env.SHOOT_NO_WARMUP) for (const url of urls) await warmUp(url);

const SLUGS = uniqueSlugs(urls);
const URL_TIMEOUT_MS = Number(process.env.SHOOT_URL_TIMEOUT_MS) || 180_000;
const report = [];
const writeReport = () => fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));

async function shootOne(browser, device, url, slug, entry, state) {
  const context = await browser.newContext({ ...device.options, reducedMotion: "no-preference" });
  state.context = context;
  if (process.env.SHOOT_PORTAL_SECRET && /\/portal(\/|$)/.test(new URL(url).pathname)) {
    const now = Math.floor(Date.now() / 1000);
    const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
    const sig = createHmac("sha256", process.env.SHOOT_PORTAL_SECRET).update(`portal-session:${body}`).digest("base64url");
    await context.addCookies([{ name: "ph_portal_session", value: `${body}.${sig}`, url: new URL(url).origin, httpOnly: true, sameSite: "Lax" }]);
    entry.portalSession = true;
  }
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && entry.consoleErrors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => entry.consoleErrors.push(String(e).slice(0, 300)));
  page.on("requestfailed", (r) => entry.failedRequests.push(`${r.failure()?.errorText} ${r.url()}`.slice(0, 300)));
  let res = await page.goto(url, { waitUntil: "networkidle", timeout: 120000 }).catch((err) => ({ err }));
  if (res?.err || (res && res.status() >= 500)) {
    entry.retried = true;
    await sleep(3000);
    res = await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  }
  entry.status = res?.status() ?? null;
  await page.waitForTimeout(1500); // let entrance animations settle
  const base = path.join(outDir, `${slug}--${device.name}`);
  await page.screenshot({ path: `${base}.png` });
  if (device.full) await page.screenshot({ path: `${base}--full.png`, fullPage: true });
  entry.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  entry.screenshot = `${base}.png`;
}

for (const device of DEVICES) {
  let browser;
  try {
    browser = await device.browser.launch();
  } catch (err) {
    for (const url of urls) report.push({ url, device: device.name, consoleErrors: [], failedRequests: [], status: null, error: `launch: ${String(err).slice(0, 250)}` });
    writeReport();
    continue;
  }
  for (const [i, url] of urls.entries()) {
    const entry = { url, device: device.name, consoleErrors: [], failedRequests: [], status: null };
    const state = {};
    try {
      const r = await withTimeout(() => shootOne(browser, device, url, SLUGS[i], entry, state), URL_TIMEOUT_MS, () => state.context?.close());
      if (r.timedOut) entry.error = `timeout after ${URL_TIMEOUT_MS} ms`;
    } catch (err) {
      entry.error = String(err).slice(0, 300);
    }
    report.push(entry);
    writeReport();
    await state.context?.close().catch(() => {});
  }
  await browser.close().catch(() => {});
}

writeReport();
for (const e of report) {
  const issues = [e.error, e.horizontalOverflow && "horizontal overflow", e.consoleErrors.length && `${e.consoleErrors.length} console errors`]
    .filter(Boolean)
    .join(", ");
  console.log(`${e.status ?? "ERR"} ${e.device.padEnd(8)} ${e.url}${issues ? "  ⚠ " + issues : ""}`);
}
