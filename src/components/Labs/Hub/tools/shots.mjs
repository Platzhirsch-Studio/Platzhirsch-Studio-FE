// Kartenbilder der Labs-Übersicht neu aufnehmen (Bildschirmfotos der eigenen
// Oberflächen, kein Herstellerbild). Braucht den laufenden Dev-Server.
//
//   node src/components/Labs/Hub/tools/shots.mjs            → public/bilder/leistungen/<id>.webp (1200 × 800)
//   node src/components/Labs/Hub/tools/shots.mjs --raw <dir> [id …] → ganze Seiten als PNG (zum Ausmessen)
//
// Es wird nichts gesendet: alle Nicht-GET-Anfragen an /api werden blockiert.
// Doku: Marktresearch/digital/features/labs-hub.md (Bilder)
import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = path.resolve("public/bilder/leistungen");
const args = process.argv.slice(2);
const raw = args[0] === "--raw" ? args[1] : null;
const only = raw ? args.slice(2) : args;

// clip: Ausschnitt der ganzen Seite (CSS-Pixel bei Breite 1200), wird auf 1200 × 800 skaliert.
const SHOTS = [
  { id: "kuechenplaner", path: "/de/kuechenplaner", wait: 12000, clip: { x: 95, y: 485, width: 525, height: 350 } },
  { id: "sofaplaner", path: "/de/sofaplaner?m=connery", wait: 8000, clip: { x: 30, y: 560, width: 672, height: 448 } },
  { id: "dreilaender", path: "/de/dreilaender-rechner", wait: 6000, clip: { x: 690, y: 330, width: 510, height: 340 } },
  // Runde 4 (ux P0-1): concierge.webp ist ein Beispielgespräch der echten
  // Oberfläche (Öffnungszeiten-Frage, ohne Mock-Plakette, unten als
  // „Beispielgespräch · KI-System“ beschriftet); upload.webp ohne die
  // Demo-Referenzzeile. Beide nicht mehr automatisch neu aufnehmen – die
  // Werkzeug-Seiten zeigen sonst Mock-/Demo-Zustände.
  { id: "portal", path: "/de/portal/login", wait: 4000, clip: { x: 376, y: 105, width: 448, height: 299 } },
  { id: "yacht", path: "/de/yacht-interior", wait: 5000, clip: { x: 120, y: 330, width: 960, height: 640 }, act: hideHeroText },
  // AR-Viewer, Stil-Finder und Outdoor: eigene Grafik im Code (FeatureVisual).
  // AR-Viewer: das Beispielsofa (CC0) passte nicht zur Marke (QA P2-1), die
  // Herstellermodelle haben noch keine Freigabe. Die Einstiegsfotos des
  // Stil-Finders sind Katalogbilder ohne Freigabe für diese Nutzung.
  // Ezarri: freigegebenes Ezarri-Bild direkt aus public/ezarri (features.js).
].filter((s) => !only.length || only.includes(s.id));

// Yacht: nur die gezeichnete Bühne, ohne Überschrift und Knöpfe des Heros.
async function hideHeroText(page) {
  await page.addStyleTag({
    content: "main section:first-of-type :is(h1,h2,p,a,nav,ol,ul,button,span):not(svg *){visibility:hidden!important}",
  });
}

if (raw) fs.mkdirSync(raw, { recursive: true });
else fs.mkdirSync(OUT, { recursive: true });

for (const s of SHOTS.filter((x) => x.file && !raw)) {
  await sharp(s.file).resize(1080, 720, { fit: "contain", background: "#f7f5f1" }).extend({ top: 40, bottom: 40, left: 60, right: 60, background: "#f7f5f1" }).flatten({ background: "#f7f5f1" }).webp({ quality: 78 }).toFile(path.join(OUT, `${s.id}.webp`));
  console.log(s.id, "ok (Datei)");
}

const browser = await chromium.launch();
for (const s of SHOTS.filter((x) => x.path)) {
  const context = await browser.newContext({ viewport: { width: 1200, height: 1300 }, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    try {
      localStorage.setItem("ph-concierge:v1", JSON.stringify({ dnd: "2099-01-01T00:00:00Z" }));
    } catch {}
  });
  const page = await context.newPage();
  await page.route("**/api/**", (route) =>
    ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.fulfill({ status: 503, body: "{}" })
  );
  try {
    await page.goto(BASE + s.path, { waitUntil: "domcontentloaded", timeout: 300_000 });
    await page.waitForTimeout(2500);
    const reject = page.getByRole("button", { name: /^Weiter ohne Einwilligung$/ });
    if (await reject.isVisible().catch(() => false)) await reject.click();
    if (s.act) await s.act(page);
    await page.waitForTimeout(s.wait);
    if (raw) {
      await page.screenshot({ path: path.join(raw, `${s.id}.png`), fullPage: true });
    } else if (s.clip) {
      const png = await page.screenshot({ fullPage: true, clip: s.clip });
      await sharp(png).resize(1200, 800, { fit: "cover", position: "top" }).webp({ quality: 74 }).toFile(path.join(OUT, `${s.id}.webp`));
    } else {
      console.log(s.id, "ohne clip – erst mit --raw ausmessen");
      continue;
    }
    console.log(s.id, "ok");
  } catch (e) {
    console.log(s.id, "Fehler", String(e.message).slice(0, 160));
  }
  await context.close();
}
await browser.close();
