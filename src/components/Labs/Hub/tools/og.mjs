// og:image der Werkzeugseiten (Fix-Runde 1, F2): public/labs/og/<id>.jpg, 1200 × 630.
// Quellen nur eigene Ansichten: Kartenbilder der Übersicht (public/bilder/leistungen,
// Bildschirmfotos der eigenen Oberflächen bzw. CC0-Beispielmodell), eine
// gezeichnete Farbpaletten-Grafik (Stil-Finder) und ein Bildschirmfoto der
// eigenen 3D-Lichtszene (Bodensee-Licht, braucht den laufenden Dev-Server).
// Kein Herstellerbild.
//
//   node src/components/Labs/Hub/tools/og.mjs
import { chromium } from "@playwright/test";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const HUB = path.resolve("public/bilder/leistungen");
const OUT = path.resolve("public/labs/og");
fs.mkdirSync(OUT, { recursive: true });
const W = 1200,
  H = 630;
const jpg = (img, id) => img.jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(OUT, `${id}.jpg`));

// 1) Aus den Kartenbildern (3:2 → 1200 × 630, Mitte)
for (const [id, src] of [
  ["kuechenplaner", "kuechenplaner.webp"],
  ["sofaplaner", "sofaplaner.webp"],
  ["dreilaender-rechner", "dreilaender.webp"],
  ["concierge", "concierge.webp"],
  ["3d-ansicht", "3d-ansicht.webp"],
]) {
  await jpg(sharp(path.join(HUB, src)).resize(W, H, { fit: "cover", position: "centre" }), id);
}

// 2) Übersicht: drei Werkzeuge nebeneinander auf Stein
const tiles = await Promise.all(
  ["kuechenplaner.webp", "sofaplaner.webp", "3d-ansicht.webp"].map((f) => sharp(path.join(HUB, f)).resize(360, 240, { fit: "cover" }).toBuffer())
);
await jpg(
  sharp({ create: { width: W, height: H, channels: 3, background: "#ece8e1" } }).composite(
    tiles.map((input, i) => ({ input, left: 48 + i * 376, top: (H - 240) / 2 }))
  ),
  "leistungen"
);

// 3) Stil-Finder: gezeichnete Farbpaletten (wie FeatureVisual „palette“)
const PALETTES = [
  ["#ece8e1", "#d8d2c8", "#8a8174", "#3f3129"],
  ["#f7f5f1", "#c9d6d1", "#4f6b68", "#1f252b"],
  ["#e6e1d8", "#d1b250", "#7a5f17", "#30373e"],
  ["#faf8f4", "#b9a48f", "#6b4f3f", "#2b2420"],
];
const rects = PALETTES.flatMap((p, row) => p.map((c, i) => `<rect x="${120 + i * 240}" y="${60 + row * 132}" width="240" height="112" fill="${c}"/>`));
await jpg(sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#faf8f4"/>${rects.join("")}</svg>`)), "stil-finder");

// 4) Bodensee-Licht: Bildschirmfoto der eigenen 3D-Szene
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.context().addCookies([{ name: "cookieConsent", value: encodeURIComponent(JSON.stringify({ essential: true })), url: BASE }]);
  await page.goto(`${BASE}/de/bodensee-licht?t=2026-06-21&m=1080`);
  await page.waitForTimeout(12000);
  const el = page.locator("[data-licht-buehne]");
  const shot = await el.screenshot();
  await jpg(sharp(shot).resize(W, H, { fit: "cover", position: "centre" }), "bodensee-licht");
} finally {
  await browser.close();
}
console.log("og-Bilder in", OUT);
