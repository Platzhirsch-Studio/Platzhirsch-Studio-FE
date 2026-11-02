#!/usr/bin/env node
// tools/images/watermark.mjs – Wasserzeichen NUR für EIGENE Fotos
// (Inhaber-Entscheidungen Nr. 30 und Nr. 31, 31.10.2026). Herstellerbilder NIE –
// sie müssen unverändert bleiben; das Skript verweigert jede Datei, die nicht
// im Urheber-Register (src/lib/seo/imageRights.js) als eigen steht.
//
// Motive:
//   logo       (Nr. 30) Platzhirsch-Logo (public/Images/Navbar/Logo.png, Hirsch +
//              Schriftzug), unten rechts in der Ecke, Deckkraft ca. 18 %,
//              Breite 7 % der Bildbreite, Abstand 3 % zum Rand.
//   kopf       (Nr. 30) nur der Hirschkopf (head.png), sonst wie logo (Breite 3,5 %).
//   copyright  (Nr. 31) „© PLATZHIRSCH“ mit Hirschkopf: Kopf aus head.png,
//              Schriftzug in Bodoni Moda 500 (Schrift des Auftritts,
//              src/lib/stilfinder/fonts/, gesperrt wie im Logo), UNTEN im Bild –
//              horizontal mittig (--position mitte) oder leicht rechts
//              (--position rechtsmitte, Mitte bei 64 % der Bildbreite), Unterkante
//              7 % über dem unteren Rand, damit ein Abschneiden das Motiv
//              beschädigt. Deckkraft 25 %, Breite 20 % der Bildbreite.
// Alle Motive einfarbig, hell oder dunkel je nach Helligkeit der Fläche unter
// dem Zeichen (Mittelwert, Schwelle 140/255).
//
//   node tools/images/watermark.mjs                       Vorschau aller eigenen Fotos
//   node tools/images/watermark.mjs --datei /Images/Home/aboutHome.jpg
//        [--motiv logo|kopf|copyright] [--position mitte|rechtsmitte]
//        [--variante auto|hell|dunkel] [--deckkraft 0.25] [--breite 0.20] [--unten 0.07]
//        [--out <ordner>]          Standard: qa-screenshots/bilder-seo/wasserzeichen/
//   node tools/images/watermark.mjs --umstellen --datei …  ausgelieferte Datei ersetzen
//
// Vorschau (Standard): schreibt vorher/nachher und einen vergrößerten
// Ausschnitt um das Zeichen – NICHT nach public/. Umstellung (--umstellen):
//   - logo/kopf: nur mit Register-Eintrag `bearbeitung: true`.
//   - copyright: nur mit `exklusiveRechteBestaetigt: true` (exklusive,
//     uneingeschränkte Rechte inkl. Bearbeitung vom Fotografen bestätigt,
//     Nr. 31) – ohne dieses Häkchen kein „©“ auf ausgelieferten Bildern.
// Dann wird das Original nach assets-originals/<pfad> (außerhalb von public/,
// nie ausgeliefert) kopiert und die Web-Fassung mit Zeichen unter DEMSELBEN
// Pfad gespeichert – Referenzen bleiben unverändert. Vorhandene Metadaten
// (EXIF/IPTC/XMP, z. B. Urheber und Copyright des Fotografen) bleiben in der
// Web-Fassung erhalten (keepMetadata, § 90c UrhG).
//
// Hinweis Git Bash: Pfade mit führendem „/“ werden umgeschrieben →
// MSYS_NO_PATHCONV=1 voranstellen.
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { ROOT, PUBLIC, ORIGINALS, requireOwn, imageRights, fs } from "./lib.mjs";
import { copyrightZeichenErlaubt } from "../../src/lib/seo/imageRights.js";

export const DEFAULTS = Object.freeze({ motiv: "logo", variante: "auto", deckkraft: 0.18, breite: null, rand: 0.03 });
/** Standardwerte des ©-Zeichens (Nr. 31). */
export const COPYRIGHT_DEFAULTS = Object.freeze({ variante: "auto", deckkraft: 0.25, breite: 0.2, unten: 0.07, position: "mitte" });
/** Horizontale Mitte des ©-Zeichens relativ zur Bildbreite. */
export const POSITION = Object.freeze({ mitte: 0.5, rechtsmitte: 0.64 });
/** Breite relativ zur Bildbreite je Motiv (Kopf ist hochformatig → schmaler). */
export const BREITE = Object.freeze({ logo: 0.07, kopf: 0.035, copyright: COPYRIGHT_DEFAULTS.breite });
export const COPYRIGHT_TEXT = "© PLATZHIRSCH";
const MOTIV = { logo: path.join(PUBLIC, "Images/Navbar/Logo.png"), kopf: path.join(PUBLIC, "Images/Navbar/head.png") };
const FONT = path.join(ROOT, "src/lib/stilfinder/fonts/bodoni-moda-latin-500-normal.ttf");
const FARBE = { hell: [255, 255, 255], dunkel: [28, 26, 24] };
/** Fläche heller als dieser Wert (0–255) → dunkles Zeichen. */
export const HELL_SCHWELLE = 140;

/**
 * Prüft, dass die Datei ein eigenes Foto ist (wirft sonst). Für die
 * Umstellung zusätzlich: logo/kopf brauchen `bearbeitung: true`, das
 * ©-Zeichen braucht `exklusiveRechteBestaetigt: true` (Nr. 31).
 */
export function planWatermark(src, { umstellen = false, motiv = DEFAULTS.motiv, register = imageRights() } = {}) {
  const own = requireOwn(src, register);
  if (umstellen && motiv === "copyright" && !copyrightZeichenErlaubt(own.entry)) {
    throw new Error(`${own.rel}: „© PLATZHIRSCH“ nur mit bestätigten exklusiven Rechten des Fotografen (imageRights.js: exklusiveRechteBestaetigt: false${own.entry.fotograf ? `, Fotograf ${own.entry.fotograf}` : ""}) – nur Vorschau möglich`);
  }
  if (umstellen && own.entry.bearbeitung !== true) {
    throw new Error(`${own.rel}: Bearbeitung (Wasserzeichen) ist von der Freigabe nicht gedeckt (imageRights.js: bearbeitung: false, Umfang „${own.entry.umfang}“) – nur Vorschau möglich`);
  }
  return own;
}

/** Einfarbiges RGBA-Zeichen aus einer Alpha-Maske, Deckkraft eingerechnet. */
function colorize(alpha, width, height, variante, deckkraft) {
  const [r, g, b] = FARBE[variante];
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = Math.round(alpha[i] * deckkraft);
  }
  return { input: out, raw: { width, height, channels: 4 }, width, height };
}

const alphaOf = async (pipe) => {
  const { data, info } = await pipe.ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
};

/** Logo/Kopf: Alpha-Maske in Zielbreite. */
async function logoMask(width, motiv) {
  return alphaOf(sharp(MOTIV[motiv]).resize({ width }));
}

let copyrightMaster = null;
/**
 * „© PLATZHIRSCH“ mit Hirschkopf als Alpha-Maske in hoher Auflösung (einmal
 * gebaut): Kopf links, 1,7 × Schrifthöhe, Schriftzug vertikal mittig daneben.
 */
async function copyrightMasterMask() {
  if (copyrightMaster) return copyrightMaster;
  // letter_spacing in 1/1024 pt – weit gesperrt wie der Logo-Schriftzug
  const text = await alphaOf(sharp({ text: { text: `<span letter_spacing="6000">${COPYRIGHT_TEXT}</span>`, fontfile: FONT, font: "Bodoni Moda Medium", dpi: 600, rgba: true } }));
  const headH = Math.round(text.height * 1.7);
  const head = await alphaOf(sharp(MOTIV.kopf).resize({ height: headH }));
  const gap = Math.round(text.height * 0.45);
  const width = head.width + gap + text.width;
  const height = head.height;
  const mask = Buffer.alloc(width * height);
  for (let y = 0; y < head.height; y++) head.data.copy(mask, y * width, y * head.width, (y + 1) * head.width);
  const top = Math.round((height - text.height) / 2);
  const left = head.width + gap;
  for (let y = 0; y < text.height; y++) {
    for (let x = 0; x < text.width; x++) mask[(top + y) * width + left + x] = Math.max(mask[(top + y) * width + left + x], text.data[y * text.width + x]);
  }
  copyrightMaster = { data: mask, width, height };
  return copyrightMaster;
}

/** ©-Zeichen: Alpha-Maske in Zielbreite. */
async function copyrightMask(width) {
  const m = await copyrightMasterMask();
  const { data, info } = await sharp(m.data, { raw: { width: m.width, height: m.height, channels: 1 } }).resize({ width, kernel: "lanczos3" }).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

const luminance = (stats) => Math.round(0.2126 * stats.channels[0].mean + 0.7152 * stats.channels[1].mean + 0.0722 * stats.channels[2].mean);

/**
 * Rechnet das Zeichen ein. Gibt { buf, variante, box, helligkeit, format } zurück.
 * @param {Buffer} buf Originaldatei
 */
export async function renderWatermark(buf, opts = {}) {
  const motiv = opts.motiv || DEFAULTS.motiv;
  const o = motiv === "copyright" ? { ...COPYRIGHT_DEFAULTS, ...opts, motiv } : { ...DEFAULTS, ...opts, motiv };
  const meta = await sharp(buf).metadata();
  const W = meta.autoOrient?.width ?? meta.width;
  const H = meta.autoOrient?.height ?? meta.height;
  const markW = Math.max(48, Math.round(W * (o.breite || BREITE[motiv])));
  const mask = motiv === "copyright" ? await copyrightMask(markW) : await logoMask(markW, motiv);
  let box;
  if (motiv === "copyright") {
    if (!(o.position in POSITION)) throw new Error(`--position ${o.position}: erlaubt sind ${Object.keys(POSITION).join(", ")}`);
    const left = Math.round(W * POSITION[o.position] - mask.width / 2);
    const top = Math.round(H * (1 - o.unten) - mask.height);
    box = { left: Math.min(Math.max(0, left), W - mask.width), top: Math.max(0, top), width: mask.width, height: mask.height };
  } else {
    const rand = Math.round(Math.min(W, H) * o.rand);
    box = { left: W - rand - mask.width, top: H - rand - mask.height, width: mask.width, height: mask.height };
  }
  // Achtung: sharp 0.35 stats() ignoriert extract() in derselben Pipeline –
  // darum den Ausschnitt erst als Puffer erzeugen, dann messen.
  const helligkeit = luminance(await sharp(await sharp(buf).rotate().extract(box).png().toBuffer()).stats());
  const variante = o.variante === "auto" ? (helligkeit > HELL_SCHWELLE ? "dunkel" : "hell") : o.variante;
  const mark = colorize(mask.data, mask.width, mask.height, variante, o.deckkraft);
  let pipe = sharp(buf).rotate().composite([{ input: mark.input, raw: mark.raw, left: box.left, top: box.top }]).keepMetadata();
  if (meta.format === "jpeg") pipe = pipe.jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" });
  else if (meta.format === "png") pipe = pipe.png({ compressionLevel: 9 });
  else if (meta.format === "webp") pipe = pipe.webp({ quality: 88 });
  else if (meta.format === "heif") pipe = pipe.avif({ quality: 66 });
  return { buf: await pipe.toBuffer(), variante, box, helligkeit, format: meta.format, motiv, position: motiv === "copyright" ? o.position : "ecke" };
}

/** Ausschnitt um das Zeichen, vorher | nachher nebeneinander (zur Ansicht). */
async function eckVergleich(before, after, box) {
  const gross = box.width >= 200;
  const pad = Math.round(gross ? box.height * 1.2 : box.width * 0.8);
  const meta = await sharp(before).metadata();
  const region = { left: Math.max(0, box.left - pad), top: Math.max(0, box.top - pad), width: 0, height: 0 };
  region.width = Math.min(meta.width - region.left, box.width + 2 * pad);
  region.height = Math.min(meta.height - region.top, box.height + 2 * pad);
  const scale = region.width * 2 > 1400 ? 1.5 : 2;
  const w = Math.round(region.width * scale);
  const crop = (b) => sharp(b).rotate().extract(region).resize({ width: w }).png().toBuffer({ resolveWithObject: true });
  const [a, b] = await Promise.all([crop(before), crop(after)]);
  const h = a.info.height;
  // nebeneinander, bei breiten Ausschnitten untereinander
  const stack = w > 1000;
  return sharp({ create: { width: stack ? w : w * 2 + 16, height: stack ? h * 2 + 16 : h, channels: 3, background: "#ffffff" } })
    .composite([
      { input: a.data, left: 0, top: 0 },
      { input: b.data, left: stack ? 0 : w + 16, top: stack ? h + 16 : 0 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}

function parseArgs(argv) {
  const a = { dateien: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--datei") a.dateien.push(argv[++i]);
    else if (["--motiv", "--variante", "--out", "--position"].includes(t)) a[t.slice(2)] = argv[++i];
    else if (["--deckkraft", "--breite", "--unten"].includes(t)) a[t.slice(2)] = Number(argv[++i]);
    else if (t === "--umstellen") a.umstellen = true;
    else throw new Error(`unbekanntes Argument ${t}`);
  }
  if (a.motiv && !["logo", "kopf", "copyright"].includes(a.motiv)) throw new Error(`--motiv ${a.motiv}: erlaubt sind logo, kopf, copyright`);
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const out = path.resolve(a.out || path.join(ROOT, "qa-screenshots/bilder-seo/wasserzeichen"));
  const list = a.dateien.length ? a.dateien : imageRights().map((e) => e.datei);
  const opts = Object.fromEntries(Object.entries({ motiv: a.motiv, variante: a.variante, deckkraft: a.deckkraft, breite: a.breite, unten: a.unten, position: a.position }).filter(([, v]) => v != null && !Number.isNaN(v)));
  let fehler = 0;
  for (const src of list) {
    try {
      const { rel, file } = planWatermark(src, { umstellen: a.umstellen, motiv: opts.motiv || DEFAULTS.motiv });
      const before = fs.readFileSync(file);
      const res = await renderWatermark(before, opts);
      if (a.umstellen) {
        const backup = path.join(ORIGINALS, rel.replace(/^\//, ""));
        if (fs.existsSync(backup)) throw new Error(`${rel}: Original liegt schon in assets-originals/ – Datei in public/ hat vermutlich schon ein Zeichen, abgebrochen`);
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        fs.copyFileSync(file, backup);
        fs.writeFileSync(file, res.buf);
        console.log(`✓ ${rel}: Web-Fassung mit Zeichen (${res.motiv}, ${res.variante}); Original: ${path.relative(ROOT, backup)}`);
        continue;
      }
      fs.mkdirSync(out, { recursive: true });
      const base = path.basename(rel).replace(/\.[^.]+$/, "");
      const ext = path.extname(rel);
      const deck = res.motiv === "copyright" ? `-${Math.round((opts.deckkraft ?? COPYRIGHT_DEFAULTS.deckkraft) * 100)}` : "";
      const suffix = res.motiv === "copyright" ? `copyright${deck}-${res.position}-${res.variante}` : `${res.motiv}-${res.variante}`;
      fs.writeFileSync(path.join(out, `${base}-vorher${ext}`), before);
      fs.writeFileSync(path.join(out, `${base}-nachher-${suffix}${ext}`), res.buf);
      fs.writeFileSync(path.join(out, `${base}-ecke-${suffix}.jpg`), await eckVergleich(before, res.buf, res.box));
      console.log(`✓ Vorschau ${rel}: Fläche ${res.helligkeit}/255 → ${res.variante}, Zeichen ${res.box.width}×${res.box.height} px bei ${res.box.left},${res.box.top} → ${path.relative(ROOT, out)}`);
    } catch (err) {
      console.error(`✗ ${err.message}`);
      fehler++;
    }
  }
  if (fehler) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  });
}
