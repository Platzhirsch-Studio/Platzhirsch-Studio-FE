import { chromium, devices } from "file:///C:/Users/admin.local/Documents/Platzhirsch-Studio-Website/node_modules/@playwright/test/index.mjs";
import zlib from "node:zlib";
import fs from "node:fs";
const [out, ...paths] = process.argv.slice(2);
const to = (p, ms=3000) => Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),ms))]);
const browser = await chromium.launch();
const results = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out,"utf8")) : [];
const typeOf = (r) => { const t = r.request().resourceType(); const ct = (r.headers()["content-type"]||""); if (t==="script"||ct.includes("javascript")) return "js"; if (t==="document") return "html"; if (t==="stylesheet") return "css"; if (t==="image") return "img"; if (t==="font") return "font"; if (t==="media") return "media"; if (t==="fetch"||t==="xhr") return "fetch"; return "other"; };
for (const p of paths) {
  const url = "http://localhost:3000/" + p;
  const runs = [];
  for (let run = 0; run < 2; run++) {
    console.error("start", p, run);
    const ctx = await browser.newContext({ ...devices["Pixel 7"] });
    const page = await ctx.newPage();
    const errs = [], resp = [], failed = [], navs = [];
    page.on("console", m => m.type()==="error" && errs.push(m.text().slice(0,250)));
    page.on("pageerror", e => errs.push("pageerror: "+String(e).slice(0,250)));
    page.on("requestfailed", r => failed.push((r.failure()?.errorText||"")+" "+r.url().slice(0,150)));
    page.on("response", r => resp.push(r));
    page.on("framenavigated", f => f === page.mainFrame() && navs.push(f.url()));
    await page.addInitScript(() => { window.__lcp = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch {} });
    const t0 = Date.now(); let status = null;
    try { const r = await page.goto(url, { waitUntil: "load", timeout: 90000 }); status = r?.status(); } catch (e) { errs.push("goto: "+e.message.slice(0,100)); }
    const tLoad = Date.now() - t0;
    try { await page.waitForLoadState("networkidle", { timeout: 15000 }); } catch {}
    try { await to(page.mouse.wheel(0, 4000)); } catch {}
    await page.waitForTimeout(1500);
    let nav = {};
    for (let i=0;i<3;i++) { try { nav = await to(page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; return { ttfb: n?.responseStart, dcl: n?.domContentLoadedEventEnd, load: n?.loadEventEnd, lcp: window.__lcp }; }), 5000); break; } catch { await page.waitForTimeout(1000); } }
    const by = {}; let n = 0, jsGz = 0, htmlGz = 0; const bigJs = [];
    for (const r of resp) {
      if (r.url().startsWith("data:")) continue;
      n++; const t = typeOf(r); let enc = 0, dec = 0, body = null;
      try { enc = (await to(r.request().sizes())).responseBodySize; } catch {}
      try { body = await to(r.body()); dec = body.length; } catch {}
      by[t] = by[t] || { n: 0, enc: 0, dec: 0 }; by[t].n++; by[t].enc += enc; by[t].dec += dec;
      if (body && t==="js") { const g = zlib.gzipSync(body).length; jsGz += g; bigJs.push([g, dec, r.url().replace("http://localhost:3000","").slice(0,140)]); }
      if (body && t==="html") htmlGz += zlib.gzipSync(body).length;
    }
    bigJs.sort((a,b)=>b[0]-a[0]);
    runs.push({ path: p, status, tLoad, nav, navs: [...new Set(navs)], requests: n, by, jsGz, htmlGz, topJs: bigJs.slice(0,8), errs: [...new Set(errs)].slice(0,8), failed: [...new Set(failed)].slice(0,6) });
    await to(ctx.close(), 5000).catch(()=>{});
  }
  const r = runs[1]; r.coldLoad = runs[0].tLoad; r.coldErrs = runs[0].errs;
  results.push(r); fs.writeFileSync(out, JSON.stringify(results, null, 1));
  console.log(p, JSON.stringify({ st: r.status, load: r.nav.load|0, lcp: r.nav.lcp|0, n: r.requests, jsGz: r.jsGz, errs: r.errs.length, navs: r.navs.length }));
}
await browser.close();
