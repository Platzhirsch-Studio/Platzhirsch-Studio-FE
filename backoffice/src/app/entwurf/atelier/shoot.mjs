// Screenshots Entwurf „Atelier“: node src/app/entwurf/atelier/shoot.mjs [filter]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve("qa-screenshots/entwurf-atelier");
mkdirSync(OUT, { recursive: true });
const B = "http://localhost:3100/entwurf/atelier";
const only = process.argv[2];
const jobs = [
  { n: "00-uebersicht", u: "/", vp: [1440, 1000], full: true },
  { n: "01-zentrale", u: "/zentrale", vp: [1440, 1000], full: true },
  { n: "02-anfragen", u: "/anfragen", vp: [1440, 1000], full: false },
  { n: "02b-anfragen-tafel", u: "/anfragen", vp: [1440, 1000], full: false, act: async (p) => { await p.getByRole("button", { name: "Tafel" }).click(); await p.waitForTimeout(400); } },
  { n: "03-kunde", u: "/kunde", vp: [1440, 1000], full: true },
  { n: "04-kassa", u: "/kassa", vp: [1180, 820], full: false },
  { n: "01-zentrale-ipad", u: "/zentrale", vp: [1180, 820], full: true },
  { n: "02-anfragen-ipad", u: "/anfragen", vp: [1180, 820], full: false },
  { n: "03-kunde-ipad", u: "/kunde", vp: [1180, 820], full: true },
];
const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ colorScheme: scheme, deviceScaleFactor: 1 });
  for (const j of jobs) {
    if (only && !j.n.includes(only)) continue;
    const p = await ctx.newPage();
    await p.setViewportSize({ width: j.vp[0], height: j.vp[1] });
    await p.goto(B + j.u, { waitUntil: "networkidle" });
    await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(500);
    if (j.act) await j.act(p);
    await p.screenshot({ path: path.join(OUT, `${j.n}--${scheme === "light" ? "hell" : "dunkel"}.png`), fullPage: j.full });
    await p.close();
  }
  await ctx.close();
}
await browser.close();
console.log("ok", OUT);
