// src/lib/ezarri/konfigurator/tools/poster.mjs – rendert das Vorschaubild (Poster) der
// 3D-Szene für den Startentwurf (QM Runde 1, P1-3). Mobil startet die Bühne in 2D; das
// Poster steht hinter „In 3D ansehen“, damit der erste Eindruck nicht nach Bauplan aussieht.
// Am Desktop überbrückt es die Ladezeit der 3D-Bühne.
//
//   node src/lib/ezarri/konfigurator/tools/poster.mjs [baseURL]
//
// Ablauf: Startseite des Konfigurators (Dev-Server, Standard http://localhost:3000) in
// Chromium, „Bewegung reduzieren“ (Wasser steht still, reproduzierbar), Bühne auf
// 960 × 840 px, Bedienelemente ausgeblendet, Bildschirmfoto der Canvas → WebP (sharp).
// Ergebnis: public/ezarri/texturen/poster-start-960.webp (Ziel ≤ 80 KB) und der Schlüssel
// des Entwurfs in src/lib/ezarri/konfigurator/poster.json. Ändert sich der Startentwurf
// oder die Szene, Werkzeug neu laufen lassen (Unit-Test prüft den Schlüssel).
//
// Dazu zwei Masken-Aufnahmen (QM R2 P2-1) in 720 × 630 px: alle Mosaik-/Fugenfarben schwarz
// (poster-basis-720.webp) und die Differenz weiß − schwarz (poster-gain-720.webp). Daraus
// färbt PosterVorschau.js das Poster im Browser mit der aktuellen Palette ein
// (Ergebnis ≈ Basis + Gain × Farbe), wenn 3D nicht läuft oder noch lädt.
//
// Eigene Arbeit (Rendering unserer Szene), keine Fremdbilder. Sendet nichts.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const require = createRequire(path.join(ROOT, "package.json"));
const { chromium } = require("@playwright/test");
const sharp = require("sharp");
const base = process.argv[2] || "http://localhost:3000";
const OUT = path.join(ROOT, "public/ezarri/texturen/poster-start-960.webp");
const W = 960;
const H = 840;

const { encodeState, sanitizeState, DEFAULT_STATE } = await import(pathToFileURL(path.join(ROOT, "src/lib/ezarri/konfigurator/state.js")).href);
const k = encodeState(sanitizeState(DEFAULT_STATE));

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" });
await ctx.addCookies([{ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: base }]);
async function aufnahme(maske) {
  const page = await ctx.newPage();
  if (maske != null) await page.addInitScript((v) => (window.__ezkPosterMaske = v), maske);
  await page.goto(`${base}/de/ezarri/konfigurator`, { waitUntil: "domcontentloaded", timeout: 180_000 });
  await page.locator("[data-ezk-ready]").waitFor({ state: "attached", timeout: 180_000 });
  await page.locator("[data-ezk-stage]").scrollIntoViewIfNeeded();
  await page.locator('[data-ezk-stage][data-mode="3d"]').waitFor({ timeout: 180_000 });
  await page.addStyleTag({ content: `header, nav, [data-concierge-launcher], [data-consent-bar] { visibility: hidden !important; } [data-ezk-stage] > :not(:has(canvas[data-engine])), [data-ezk-poster] { visibility: hidden !important; } [data-ezk-stage] > :has(canvas[data-engine]) { opacity: 1 !important; }` });
  await page.evaluate(([w, h]) => {
    const el = document.querySelector("[data-ezk-stage]");
    Object.assign(el.style, { position: "fixed", left: "0", top: "0", width: `${w}px`, height: `${h}px`, flex: "none", zIndex: "9999" });
  }, [W, H]);
  await page.waitForTimeout(3000);
  const png = await page.locator("[data-ezk-stage] canvas[data-engine]").screenshot();
  await page.close();
  return png;
}
const png = await aufnahme(null);
const weiss = await aufnahme(1);
const schwarz = await aufnahme(0);
await browser.close();

// Masken: Basis = schwarz, Gain = weiß − schwarz (je Kanal, ≥ 0)
const MW = 720;
const MH = 630;
const roh = async (b) => sharp(b).resize(MW, MH, { fit: "cover" }).removeAlpha().raw().toBuffer();
const [rw, rs] = await Promise.all([roh(weiss), roh(schwarz)]);
const gain = Buffer.alloc(rw.length);
for (let i = 0; i < rw.length; i++) gain[i] = Math.max(0, rw[i] - rs[i]);
const OUT_B = path.join(ROOT, "public/ezarri/texturen/poster-basis-720.webp");
const OUT_G = path.join(ROOT, "public/ezarri/texturen/poster-gain-720.webp");
fs.writeFileSync(OUT_B, await sharp(rs, { raw: { width: MW, height: MH, channels: 3 } }).webp({ quality: 72, effort: 6 }).toBuffer());
fs.writeFileSync(OUT_G, await sharp(gain, { raw: { width: MW, height: MH, channels: 3 } }).webp({ quality: 80, effort: 6 }).toBuffer());

fs.mkdirSync(path.dirname(OUT), { recursive: true });
let q = 74;
let buf;
do {
  buf = await sharp(png).resize(W, H, { fit: "cover" }).webp({ quality: q, effort: 6 }).toBuffer();
  q -= 4;
} while (buf.length > 80 * 1024 && q > 40);
fs.writeFileSync(OUT, buf);
fs.writeFileSync(path.join(ROOT, "src/lib/ezarri/konfigurator/poster.json"), `${JSON.stringify({ k, bild: "/ezarri/texturen/poster-start-960.webp", breite: W, hoehe: H, basis: "/ezarri/texturen/poster-basis-720.webp", gain: "/ezarri/texturen/poster-gain-720.webp", maskeBreite: MW, maskeHoehe: MH, stand: new Date().toISOString().slice(0, 10), quelle: "eigenes Rendering der 3D-Szene (tools/poster.mjs)" }, null, 2)}\n`);
console.log(`Masken ${Math.round(fs.statSync(OUT_B).size / 1024)} + ${Math.round(fs.statSync(OUT_G).size / 1024)} KB`);
console.log(`Poster ${OUT} – ${Math.round(buf.length / 1024)} KB (WebP q${q + 4})`);
