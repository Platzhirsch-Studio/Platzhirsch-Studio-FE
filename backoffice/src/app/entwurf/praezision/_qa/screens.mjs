// Screenshots des Entwurfs „Präzision“ (hell + dunkel; 1440, 1180, 1024).
// Aufnahme erst, wenn alle endlichen Animationen beendet sind (keine
// Zwischenbilder von Einblendungen).
// Aufruf: node backoffice/src/app/entwurf/praezision/_qa/screens.mjs [filter]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const hier = path.dirname(fileURLToPath(import.meta.url));
const ziel = path.resolve(hier, "../../../../../qa-screenshots/entwurf-praezision");
mkdirSync(ziel, { recursive: true });
const BASIS = "http://localhost:3100/entwurf/praezision";
const filter = process.argv[2] || "";

const SCREENS = [
  { name: "1-zentrale", url: "/", vp: [1440, 900], voll: true },
  { name: "1-zentrale--ipad", url: "/", vp: [1180, 820], voll: true },
  { name: "1-zentrale--1024", url: "/", vp: [1024, 768], voll: true },
  { name: "1b-befehlspalette", url: "/?palette=1", vp: [1440, 900] },
  { name: "2-anfragen", url: "/anfragen", vp: [1440, 900] },
  { name: "2-anfragen--ipad", url: "/anfragen", vp: [1180, 820] },
  { name: "2-anfragen--1024", url: "/anfragen", vp: [1024, 768] },
  { name: "2b-anfragen-board", url: "/anfragen?ansicht=board", vp: [1440, 900] },
  { name: "3-kunde", url: "/kunde", vp: [1440, 900], voll: true },
  { name: "3-kunde--ipad", url: "/kunde", vp: [1180, 820], voll: true },
  { name: "3-kunde--1024", url: "/kunde", vp: [1024, 768], voll: true },
  { name: "4-kassa--ipad", url: "/kassa", vp: [1180, 820] },
  { name: "4-kassa--1024", url: "/kassa", vp: [1024, 768] },
  { name: "4b-kassa-abschluss", url: "/kassa?abschluss=1", vp: [1180, 820] },
];

const browser = await chromium.launch();
for (const schema of ["light", "dark"]) {
  const ctx = await browser.newContext({ colorScheme: schema, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const s of SCREENS) {
    if (filter && !s.name.includes(filter)) continue;
    await page.setViewportSize({ width: s.vp[0], height: s.vp[1] });
    await page.goto(BASIS + s.url, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    // auf das Ende aller endlichen Animationen warten (animationend), Endlos-Pulse ausgenommen
    await page.evaluate(() =>
      Promise.race([
        Promise.all(
          document.getAnimations()
            .filter((a) => a.effect?.getComputedTiming?.().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        ),
        new Promise((r) => setTimeout(r, 4000)),
      ]),
    );
    await page.waitForTimeout(100);
    const datei = path.join(ziel, `${s.name}--${schema === "light" ? "hell" : "dunkel"}.png`);
    await page.screenshot({ path: datei, fullPage: !!s.voll, animations: "allow" });
    console.log(datei);
  }
  await ctx.close();
}
await browser.close();
