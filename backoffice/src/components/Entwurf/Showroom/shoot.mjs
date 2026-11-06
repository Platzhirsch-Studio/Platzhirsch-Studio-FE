// Screenshots des Entwurfs „Showroom“: node src/components/Entwurf/Showroom/shoot.mjs [filter]
// Prüft zusätzlich: abgeschnittener Text (Ellipsen) und Bild-Dubletten je Bildschirm.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve("qa-screenshots/entwurf-showroom");
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3100/entwurf/showroom";
const SCREENS = [
  { id: "1-zentrale", url: "", full: true },
  { id: "2-anfragen", url: "/anfragen", full: false },
  { id: "3-kundenakte", url: "/kundenakte", full: true },
  { id: "4-kassa", url: "/kassa", full: false },
];
const VIEWS = [
  { id: "desktop", w: 1440, h: 900 },
  { id: "ipad", w: 1180, h: 820 },
];
const filter = process.argv[2] || "";
const browser = await chromium.launch();
const errors = [];
const befund = [];

async function pruefen(page, name) {
  const r = await page.evaluate(() => {
    const cut = [];
    for (const el of document.querySelectorAll(".sr *")) {
      const cs = getComputedStyle(el);
      if (cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1 && el.offsetParent) cut.push(el.textContent.trim().slice(0, 40));
      if (cs.webkitLineClamp && cs.webkitLineClamp !== "none" && el.scrollHeight > el.clientHeight + 1) cut.push("[clamp] " + el.textContent.trim().slice(0, 40));
    }
    const imgs = [...document.querySelectorAll(".sr img")].filter((i) => !i.closest(".sr-cart")).map((i) => decodeURIComponent(i.currentSrc || i.src).match(/showroom\/([^&?]+)/)?.[1]).filter(Boolean);
    const seen = {}; for (const i of imgs) seen[i] = (seen[i] || 0) + 1;
    return { cut, dup: Object.entries(seen).filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`) };
  });
  if (r.cut.length) befund.push(`${name}: Ellipse → ${r.cut.join(" | ")}`);
  if (r.dup.length) befund.push(`${name}: Bild doppelt → ${r.dup.join(", ")}`);
}

for (const s of SCREENS) {
  for (const v of VIEWS) {
    for (const scheme of ["light", "dark"]) {
      const name = `${s.id}--${v.id}--${scheme === "light" ? "hell" : "dunkel"}`;
      if (filter && !name.includes(filter)) continue;
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, colorScheme: scheme, deviceScaleFactor: 1, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error") errors.push(`${name}: ${m.text()}`); });
      await page.goto(BASE + s.url, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      await pruefen(page, name);
      await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: s.full });
      if (s.id === "2-anfragen" && v.id === "desktop") {
        await page.getByRole("button", { name: "Tafel" }).click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, `${name}--tafel.png`) });
      }
      if (s.id === "3-kundenakte" && v.id === "desktop" && scheme === "light") {
        await page.goto(BASE + s.url + "?display=sans", { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, `${name}--kopf-sans.png`), clip: { x: 0, y: 0, width: v.w, height: 560 } });
        await page.goto(BASE + s.url, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, `${name}--kopf-serif.png`), clip: { x: 0, y: 0, width: v.w, height: 560 } });
      }
      if (s.id === "4-kassa") {
        await page.getByRole("button", { name: "Bezahlen", exact: true }).click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, `${name}--bezahlen.png`) });
        if (v.id === "ipad") {
          await page.getByRole("radio", { name: /Bar/ }).click();
          await page.waitForTimeout(200);
          await page.screenshot({ path: path.join(OUT, `${name}--bezahlen-bar.png`) });
        }
      }
      await ctx.close();
    }
  }
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "keine Fehler");
console.log(befund.length ? befund.join("\n") : "keine Ellipsen, keine Bild-Dubletten");
