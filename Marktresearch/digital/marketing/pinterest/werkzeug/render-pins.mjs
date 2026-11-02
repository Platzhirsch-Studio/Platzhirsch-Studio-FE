// Schritt 3 von 3: Pin-Vorlage (/de/preview/pinterest/vorlage?pin=<id>) abfotografieren
// → public/preview/pinterest/<id>.webp (1000 × 1500) und <id>-600.webp (600 × 900).
// Braucht den laufenden Dev-Server (BASE, Standard http://localhost:3000).
//   node render-pins.mjs            alle Pins aus data.js
//   node render-pins.mjs p01 s2     nur diese
// Nur Typo-Overlay auf freigegebene Basisbilder, keine generativen Inhalte.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const require = createRequire(path.join(ROOT, "package.json"));
const sharp = require("sharp");
const { chromium } = require("@playwright/test");
const { PINS } = await import(pathToFileURL(path.join(ROOT, "src/components/Preview/pinterest/data.js")).href);

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = path.join(ROOT, "public/preview/pinterest");
fs.mkdirSync(OUT, { recursive: true });
const want = process.argv.slice(2);
const list = want.length ? PINS.filter((p) => want.includes(p.id)) : PINS;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1700 }, deviceScaleFactor: 1 });
for (const pin of list) {
  const url = `${BASE}/de/preview/pinterest/vorlage?pin=${pin.id}`;
  let ok = false;
  for (let i = 0; i < 3 && !ok; i++) {
    const res = await page.goto(url, { waitUntil: "load", timeout: 180_000 }).catch(() => null);
    ok = res && res.status() === 200;
    if (!ok) await new Promise((r) => setTimeout(r, 3000));
  }
  if (!ok) { console.error("FEHLER", pin.id, url); continue; }
  const frame = page.locator(`[data-pin-frame="${pin.id}"]`);
  await frame.waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
  });
  const png = await frame.screenshot({ type: "png", animations: "disabled" });
  const meta = { IFD0: { ImageDescription: `Platzhirsch Pinterest-Entwurf ${pin.id}: ${pin.titel}. Quelle: ${pin.credit}. ${pin.bearbeitung || "Platzhalter"}`, Copyright: pin.credit } };
  await sharp(png).withExif(meta).webp({ quality: 86 }).toFile(path.join(OUT, `${pin.id}.webp`));
  await sharp(png).resize(600, 900).withExif(meta).webp({ quality: 80 }).toFile(path.join(OUT, `${pin.id}-600.webp`));
  const kb = (f) => Math.round(fs.statSync(path.join(OUT, f)).size / 1024);
  console.log(pin.id, `${kb(`${pin.id}.webp`)} KB / ${kb(`${pin.id}-600.webp`)} KB`);
}
await browser.close();
