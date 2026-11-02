// tools/splat/media.mjs – Poster (AVIF/WebP) und Kamerafahrt-Video (NVENC: AV1 + H.264)
// aus dem laufenden Rundgang aufnehmen (N1, Fallback-Video und LCP-Bild).
//
//   node tools/splat/media.mjs [--base http://localhost:3000] [--test] [--nur poster|video]
//        [--fps 30] [--fahrt 3.2] [--halt 1.6] [--breite 1280] [--hoehe 720]
//
// Ablauf:
//   1. Chromium (Playwright, GPU über ANGLE/D3D11) öffnet /de/showroom?aufnahme=1.
//      Die Seite startet den Viewer sofort und gibt window.__showroomCapture frei
//      (ShowroomStage.js; ohne ?aufnahme=1 gibt es diese Schnittstelle nicht).
//   2. Poster je Zone (Stimmung tag) an der ersten Station der Zone:
//      breit 1920×1080 und mobil 960×1200 → AVIF (sharp, Qualität sinkt bis
//      ≤ 120 KB) + WebP. Ablage public/showroom/<zone>/tag/poster-{breit,mobil}.*
//   3. Video: Kamerafahrt durch alle Stationen (Fahrt + Halt je Station, gleiche
//      Kurve wie im Viewer), Einzelbilder als PNG in den Rohdaten-Ordner,
//      dann ffmpeg auf der RTX 4060: av1_nvenc (AV1) und h264_nvenc (H.264),
//      faststart, ohne Ton. Ablage public/showroom/<zone>/tag/fahrt-{av1,h264}.mp4
//   4. Manifest: poster/video-Einträge mit Bytes, Maßen, Dauer.
//
// Braucht den Dev-Server (oder BASE auf platzhirsch-prodtest) mit dem Rundgang
// im Modus preview/public. Keine Formulare, keine Fremd-Hosts.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "@playwright/test";
import { BIN, GPU_TOOLS, ensureDir, kb, mb, parseArgs, publicUrl, readManifest, run, webDir, writeManifest } from "./lib.mjs";
import TESTSZENE from "../../src/lib/showroom/testszene.json" with { type: "json" };
import HOTSPOTS from "../../src/lib/showroom/hotspots.json" with { type: "json" };

const args = parseArgs();
const BASE = args.base || process.env.BASE_URL || "http://localhost:3000";
const FPS = Number(args.fps || 30);
const FAHRT = Number(args.fahrt || 3.2); // s je Fahrt
const HALT = Number(args.halt || 1.6); // s je Halt
const W = Number(args.breite || 1280), H = Number(args.hoehe || 720);
const POSTER_MAX = 120 * 1024;
const data = args.test ? TESTSZENE : HOTSPOTS;

const stations = data.stationen.filter((s) => s.kamera && (s.typ !== "haralds-tisch" || s.material?.length));
if (!stations.length) {
  console.error("Keine Stationen mit Kamera – erst hotspots.json füllen (oder --test).");
  process.exit(1);
}

const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.error("Seite:", String(e).slice(0, 300)));
await page.goto(`${BASE}/de/showroom?aufnahme=1`, { waitUntil: "load", timeout: 180_000 });
await page.waitForFunction(() => document.documentElement.dataset.showroomCapture === "ready", null, { timeout: 120_000 });
// Entwicklungs-Overlay von Next.js („Compiling …“) und alles über dem Canvas ausblenden.
await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast], [data-nextjs-dev-tools-button] { display: none !important; }" });

const frames = (n) => page.evaluate((k) => new Promise((r) => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const setCam = async (k, settle = 45) => {
  await page.evaluate((c) => window.__showroomCapture.setCamera(c.pos, c.ziel, c.fov), k);
  await frames(settle);
};
const canvas = page.locator("canvas").first();

/** AVIF mit sinkender Qualität bis ≤ 120 KB, dazu WebP. */
async function encodePoster(png, base) {
  let q = 62, avif;
  for (; q >= 30; q -= 4) {
    avif = await sharp(png).avif({ quality: q, effort: 6, chromaSubsampling: "4:2:0" }).toBuffer();
    if (avif.length <= POSTER_MAX) break;
  }
  const webp = await sharp(png).webp({ quality: 74, effort: 6 }).toBuffer();
  fs.writeFileSync(`${base}.avif`, avif);
  fs.writeFileSync(`${base}.webp`, webp);
  const meta = await sharp(png).metadata();
  console.log(`  ${path.basename(base)}: AVIF ${kb(avif.length)} (q${q}), WebP ${kb(webp.length)}`);
  return { avif: publicUrl(`${base}.avif`), webp: publicUrl(`${base}.webp`), width: meta.width, height: meta.height, bytes: { avif: avif.length, webp: webp.length } };
}

const manifest = readManifest();
const zoneEntry = (id) => (args.test ? manifest.testszene : manifest.zonen.find((z) => z.id === id));
const zoneIds = [...new Set(stations.map((s) => s.zone))];

if (!args.nur || args.nur === "poster") {
  for (const zid of zoneIds) {
    const z = zoneEntry(zid);
    if (!z?.stimmungen?.tag) continue;
    const st = stations.find((s) => s.zone === zid);
    const dir = ensureDir(webDir(zid, "tag"));
    console.log(`Poster ${zid}:`);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await setCam(st.kamera, 60);
    const breit = await canvas.screenshot({ type: "png" });
    await page.setViewportSize({ width: 960, height: 1200 });
    await setCam(st.kamera, 60);
    const mobil = await canvas.screenshot({ type: "png" });
    const p = await encodePoster(breit, path.join(dir, "poster-breit"));
    p.tall = await encodePoster(mobil, path.join(dir, "poster-mobil"));
    z.stimmungen.tag.poster = p;
  }
  writeManifest(manifest);
}

if (!args.nur || args.nur === "video") {
  const zid = zoneIds[0];
  const z = zoneEntry(zid);
  const rawFrames = ensureDir(path.join(GPU_TOOLS, "showroom", "video-frames", zid));
  for (const f of fs.readdirSync(rawFrames)) fs.rmSync(path.join(rawFrames, f));
  await page.setViewportSize({ width: W, height: H });
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const path3 = [];
  for (let i = 0; i < stations.length; i++) {
    const k = stations[i].kamera;
    for (let f = 0; f < Math.round(HALT * FPS); f++) path3.push(k);
    const n = stations[i + 1]?.kamera;
    if (!n) break;
    const steps = Math.round(FAHRT * FPS);
    for (let f = 1; f <= steps; f++) {
      const e = ease(f / steps);
      path3.push({ pos: lerp(k.pos, n.pos, e), ziel: lerp(k.ziel, n.ziel, e), fov: (k.fov || 60) + ((n.fov || 60) - (k.fov || 60)) * e });
    }
  }
  console.log(`Video: ${path3.length} Bilder (${(path3.length / FPS).toFixed(1)} s) …`);
  await setCam(path3[0], 60);
  for (let i = 0; i < path3.length; i++) {
    await setCam(path3[i], i === 0 ? 60 : 3);
    await canvas.screenshot({ type: "png", path: path.join(rawFrames, `f${String(i).padStart(5, "0")}.png`) });
    if (i % 60 === 0) process.stdout.write(`  ${i}/${path3.length}\r`);
  }
  const dir = ensureDir(webDir(zid, "tag"));
  const input = ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(rawFrames, "f%05d.png"), "-an", "-pix_fmt", "yuv420p"];
  const av1 = path.join(dir, "fahrt-av1.mp4"), h264 = path.join(dir, "fahrt-h264.mp4");
  await run(BIN.ffmpeg, [...input, "-c:v", "av1_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "34", "-b:v", "0", "-movflags", "+faststart", av1]);
  await run(BIN.ffmpeg, [...input, "-c:v", "h264_nvenc", "-preset", "p7", "-rc", "vbr", "-cq", "27", "-b:v", "0", "-profile:v", "high", "-movflags", "+faststart", h264]);
  const vposter = await encodePoster(fs.readFileSync(path.join(rawFrames, "f00000.png")), path.join(dir, "fahrt-poster"));
  const dauer = Math.round((path3.length / FPS) * 10) / 10;
  z.stimmungen.tag.video = {
    av1: publicUrl(av1),
    h264: publicUrl(h264),
    poster: vposter.webp,
    width: W,
    height: H,
    dauer,
    datum: new Date().toISOString().slice(0, 10),
    bytes: { av1: fs.statSync(av1).size, h264: fs.statSync(h264).size },
  };
  console.log(`  AV1 ${mb(fs.statSync(av1).size)}, H.264 ${mb(fs.statSync(h264).size)}, ${dauer} s`);
  writeManifest(manifest);
}

await browser.close();
console.log("Manifest aktualisiert.");
