// tools/raumzwilling/pruefbild.mjs (SCROLL=<css-selector> scrollt vor dem Bild dorthin; TEAM=<cookie-wert>)
// tools/raumzwilling/pruefbild.mjs – QA-Helfer: Screenshot einer Raum-Seite mit Demo-Session (nur Dev-Server, Mock-Adapter).
//   node tools/raumzwilling/pruefbild.mjs <url> <out.png> [desktop|iphone] [warte-ms]   (FULL=1 für ganze Seite, TEAM=1 mit Team-Cookie)
import { chromium, webkit, devices } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
const [url, out, dev = "desktop", warte = "4000"] = process.argv.slice(2);
const SECRET = "dev-only-portal-secret-do-not-use-in-production-0000";
const now = Math.floor(Date.now() / 1000);
const body = Buffer.from(JSON.stringify({ v: 1, sub: "CUST-DEMO-0001", sid: randomUUID(), iat: now, exp: now + 3600 })).toString("base64url");
const val = `${body}.${createHmac("sha256", SECRET).update(`portal-session:${body}`).digest("base64url")}`;
const b = await (dev === "iphone" ? webkit : chromium).launch(dev === "desktop" ? { args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu"] } : {});
const ctx = await b.newContext(dev === "iphone" ? devices["iPhone 15 Pro"] : { viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: "ph_portal_session", value: val, url: "http://localhost:3000" }]);
if (process.env.TEAM) await ctx.addCookies([{ name: "ph_raum_team", value: process.env.TEAM, url: "http://localhost:3000" }]);
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 400)));
p.on("pageerror", (e) => errs.push(String(e).slice(0, 400)));
await p.goto(url, { waitUntil: "load", timeout: 120000 });
await p.waitForTimeout(Number(warte));
if (process.env.SCROLL) { await p.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: "center" }), process.env.SCROLL); await p.waitForTimeout(1200); }
await p.screenshot({ path: out, fullPage: process.env.FULL === "1" });
console.log(JSON.stringify([...new Set(errs)], null, 1));
await b.close();
