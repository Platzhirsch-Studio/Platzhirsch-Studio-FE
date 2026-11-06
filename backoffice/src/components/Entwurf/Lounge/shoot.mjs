// Screenshots des Entwurfs „Lounge“: node src/components/Entwurf/Lounge/shoot.mjs [filter]
// Desktop 1440×900 Vollseite, Kassa/Packtisch zusätzlich iPad quer 1180×820. Hell + dunkel.
// Prüft: Konsolenfehler, abgeschnittener Text (Ellipsen), Bild-Dubletten, waagrechtes Überlaufen.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve("qa-screenshots/entwurf-lounge");
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3100/entwurf/lounge";
const JOBS = [
  { id: "1-zentrale", url: "", w: 1440, h: 900, full: true },
  { id: "2-anfragen", url: "/anfragen", w: 1440, h: 900, full: true },
  { id: "3-kundenakte", url: "/kundenakte", w: 1440, h: 900, full: true },
  { id: "4-kassa", url: "/kassa", w: 1180, h: 820, full: false, tag: "ipad" },
  { id: "4-kassa", url: "/kassa", w: 1180, h: 820, full: false, tag: "ipad--bezahlt", act: async (p) => { await p.getByRole("button", { name: /^Bezahlen/ }).click(); await p.waitForTimeout(700); } },
  { id: "5-packtisch", url: "/packtisch", w: 1180, h: 820, full: false, tag: "ipad" },
  { id: "5-packtisch", url: "/packtisch", w: 1440, h: 900, full: true, tag: "desktop" },
  { id: "5-packtisch", url: "/packtisch", w: 1180, h: 820, full: false, tag: "ipad--fehler", act: async (p) => { await p.getByRole("button", { name: "Falschen Artikel scannen (Demo)" }).click(); await p.waitForTimeout(500); } },
  ...["ruhe", "einkauf", "bezahlen", "danke"].flatMap((z, i) => [
    { id: `6-kundendisplay-${i + 1}-${z}`, url: `/kundendisplay?zustand=${z}`, w: 1920, h: 1080, full: false, tag: "1920" },
    { id: `6-kundendisplay-${i + 1}-${z}`, url: `/kundendisplay?zustand=${z}`, w: 820, h: 1180, full: false, tag: "ipad-hoch" },
  ]),
  { id: "6-kundendisplay-3-bezahlen", url: "/kundendisplay?zustand=bezahlen&zahlart=bar", w: 1920, h: 1080, full: false, tag: "1920--bar" },
  { id: "6-kundendisplay-4-danke", url: "/kundendisplay?zustand=danke&zahlart=bar", w: 1920, h: 1080, full: false, tag: "1920--bar" },
];
const filter = process.argv[2] || "";
const browser = await chromium.launch();
const errors = [];
const befund = [];

for (const j of JOBS) {
  for (const scheme of ["light", "dark"]) {
    const name = `${j.id}--${j.tag || "desktop"}--${scheme === "light" ? "hell" : "dunkel"}`;
    if (filter && !name.includes(filter)) continue;
    const ctx = await browser.newContext({ viewport: { width: j.w, height: j.h }, colorScheme: scheme, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`${name}: ${m.text().slice(0, 300)}`); });
    await page.goto(BASE + j.url, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    if (j.act) await j.act(page);
    const r = await page.evaluate(() => {
      const cut = [];
      for (const el of document.querySelectorAll(".lg *")) {
        const cs = getComputedStyle(el);
        if (cs.textOverflow === "ellipsis" && el.scrollWidth > el.clientWidth + 1 && el.offsetParent) cut.push(el.textContent.trim().slice(0, 40));
      }
      const imgs = [...document.querySelectorAll(".lg img")].map((i) => decodeURIComponent(i.currentSrc || i.src).match(/lounge\/([^&?]+)/)?.[1]).filter(Boolean);
      const seen = {}; for (const i of imgs) seen[i] = (seen[i] || 0) + 1;
      return { cut, dup: Object.entries(seen).filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`), over: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    if (r.cut.length) befund.push(`${name}: Ellipse → ${r.cut.join(" | ")}`);
    if (r.dup.length) befund.push(`${name}: Bild mehrfach → ${r.dup.join(", ")}`);
    if (r.over) befund.push(`${name}: waagrechter Überlauf`);
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: j.full });
    await ctx.close();
  }
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "keine Fehler");
console.log(befund.length ? befund.join("\n") : "keine Befunde");
