#!/usr/bin/env node
// scripts/make-review-qr.mjs — QR cards for Google reviews (R5-release, AP6 Nr. 4).
//
//   node scripts/make-review-qr.mjs            write all files, then self-test
//   node scripts/make-review-qr.mjs --check    only self-test the files on disk
//   options: --url=<target> (default https://platzhirsch.studio/de/bewerten)
//            --out=<dir>    (default Marktresearch/marketing/qr)
//
// Output (print data, nothing is sent or published):
//   qr-bewerten.svg / .png                  bare code, quiet zone 4 modules
//   karte-bewerten-rueckseite.svg / .png    A6 landscape 148 × 105 mm, code 45 mm
//   karte-bewerten-vorderseite.svg / .png   A6 landscape, thank-you side
//   manifest.json                           URL, version, ECC, sha256, self-test
//
// Rules from Marktresearch/marketing/qr-karte-bewertung.md and masterplan AP6:
// the code points at /de/bewerten (never straight at Google, so the target can
// change without a reprint), error correction M, ≥ 2 × 2 cm with quiet zone.
// The same card for every customer: no question "were you satisfied?" before
// it (no review gating), no incentive. Business facts come from src/lib/site.js
// (one source; address as in the Firmenbuch).
//
// Self-test: every PNG is decoded from its pixels and every SVG from its module
// path with scripts/lib/qr-decode.mjs (own decoder, not the encoder of the
// `qrcode` package). Exit code 1 if any file does not decode to the URL.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { decodeOwnSvg, decodePng } from "./lib/qr-decode.mjs";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");
const sharp = require("sharp");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => {
      const i = a.indexOf("=");
      return i < 0 ? [a.slice(2), true] : [a.slice(2, i), a.slice(i + 1)];
    }),
);
const URL_TARGET = String(args.url || "https://platzhirsch.studio/de/bewerten");
const OUT = path.resolve(ROOT, String(args.out || "Marktresearch/marketing/qr"));
const ECL = "M";
const QUIET = 4;
const DPI = 300;

// Design-Bibel colours (paper, ink, ink-deep, ink-soft, brass-700, pebble).
const C = { paper: "#faf8f4", ink: "#30373e", inkDeep: "#1f252b", inkSoft: "#5c636a", accent: "#7a5f17", line: "#8a8174" };
const FONT_DISPLAY = "'Bodoni Moda', 'Bodoni 72', Georgia, 'Times New Roman', serif";
const FONT_TEXT = "'Instrument Sans', 'Segoe UI', Arial, Helvetica, sans-serif";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const mmToPx = (mm) => Math.round((mm * DPI) / 25.4);

async function siteFacts() {
  const site = await import(pathToFileURL(path.join(ROOT, "src", "lib", "site.js")).href);
  return { name: site.SITE_NAME, email: site.EMAIL, phone: site.PHONE_DISPLAY, address: site.ADDRESS };
}

/** QR matrix → <path> with one rectangle per dark run (units = modules, quiet zone included). */
function modulePath(qr, fill) {
  const { size, data } = qr.modules;
  let d = "";
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) {
        x++;
        continue;
      }
      let n = 0;
      while (x + n < size && data[y * size + x + n]) n++;
      d += `M${x + QUIET} ${y + QUIET}h${n}v1h-${n}z`;
      x += n;
    }
  }
  return `<path data-qr="modules" data-size="${size}" data-quiet="${QUIET}" fill="${fill}" shape-rendering="crispEdges" d="${d}"/>`;
}

function bareSvg(qr) {
  const units = qr.modules.size + 2 * QUIET;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${units} ${units}" width="40mm" height="40mm" role="img" aria-label="QR-Code: ${esc(URL_TARGET)}">
  <title>QR-Code ${esc(URL_TARGET)}</title>
  <rect width="${units}" height="${units}" fill="#ffffff"/>
  ${modulePath(qr, "#000000")}
</svg>
`;
}

// A6 landscape, units = mm. The code box (with quiet zone) sits right.
const CARD = { w: 148, h: 105, qr: { x: 93, y: 22, size: 45 } };

function backSvg(qr, f) {
  const units = qr.modules.size + 2 * QUIET;
  const s = CARD.qr.size / units;
  const short = URL_TARGET.replace(/^https?:\/\//, "");
  const t = (x, y, size, text, extra = "") =>
    `<text x="${x}" y="${y}" font-size="${size}" ${extra}>${esc(text)}</text>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD.w} ${CARD.h}" width="${CARD.w}mm" height="${CARD.h}mm" role="img" aria-label="Bewertungskarte, Rückseite mit QR-Code zu ${esc(short)}">
  <title>Bewertungskarte Rückseite – ${esc(f.name)}</title>
  <rect width="${CARD.w}" height="${CARD.h}" fill="${C.paper}"/>
  <g font-family="${FONT_TEXT}" fill="${C.ink}">
    ${t(10, 17, 2.5, `${f.name.toUpperCase()} · ${f.address.city.toUpperCase()}`, `fill="${C.accent}" letter-spacing="0.35"`)}
    ${t(10, 31, 7.2, "Wie war es mit uns?", `font-family="${FONT_DISPLAY}" fill="${C.inkDeep}"`)}
    ${t(10, 41, 3.2, "Von der Beratung bis zur Lieferung:")}
    ${t(10, 45.6, 3.2, "Ihre ehrliche Meinung hilft anderen bei der")}
    ${t(10, 50.2, 3.2, "Entscheidung und uns dabei, besser zu werden.")}
    ${t(10, 61, 3.6, short, `font-weight="600" fill="${C.inkDeep}"`)}
    ${t(10, 71, 2.8, "Lieber direkt an uns?", `fill="${C.inkSoft}"`)}
    ${t(10, 75.4, 2.8, `${f.email} · ${f.phone}`, `fill="${C.inkSoft}"`)}
    ${t(10, 88, 3.2, "Herzlich,")}
    <line x1="25" y1="88.6" x2="80" y2="88.6" stroke="${C.line}" stroke-width="0.2"/>
    ${t(10, 99, 2.4, `${f.name} · ${f.address.street} · ${f.address.postalCode} ${f.address.city}`, `fill="${C.inkSoft}"`)}
    ${t(CARD.qr.x + CARD.qr.size / 2, CARD.qr.y + CARD.qr.size + 5, 2.6, "Code mit der Handykamera scannen", `text-anchor="middle" fill="${C.inkSoft}"`)}
  </g>
  <g transform="translate(${CARD.qr.x} ${CARD.qr.y}) scale(${s})">
    <rect width="${units}" height="${units}" fill="#ffffff"/>
    ${modulePath(qr, C.inkDeep)}
  </g>
</svg>
`;
}

function frontSvg(f) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD.w} ${CARD.h}" width="${CARD.w}mm" height="${CARD.h}mm" role="img" aria-label="Bewertungskarte, Vorderseite: Danke, dass wir bei Ihnen einrichten durften.">
  <title>Bewertungskarte Vorderseite – ${esc(f.name)}</title>
  <rect width="${CARD.w}" height="${CARD.h}" fill="${C.paper}"/>
  <g font-family="${FONT_TEXT}" fill="${C.ink}" text-anchor="middle">
    <text x="74" y="30" font-size="2.6" fill="${C.accent}" letter-spacing="0.35">${esc(f.name.toUpperCase())}</text>
    <text x="74" y="47" font-size="8.4" font-family="${FONT_DISPLAY}" fill="${C.inkDeep}">Danke, dass wir bei Ihnen</text>
    <text x="74" y="58" font-size="8.4" font-family="${FONT_DISPLAY}" fill="${C.inkDeep}">einrichten durften.</text>
    <line x1="64" y1="66" x2="84" y2="66" stroke="${C.line}" stroke-width="0.25"/>
    <text x="74" y="74" font-size="3.2">${esc(`${f.name} · ${f.address.city}`)}</text>
  </g>
  <g font-family="${FONT_TEXT}" fill="${C.inkSoft}">
    <text x="10" y="96" font-size="2.6">Ihre Ansprechperson:</text>
    <line x1="38" y1="96.6" x2="90" y2="96.6" stroke="${C.line}" stroke-width="0.2"/>
  </g>
</svg>
`;
}

const FILES = {
  bareSvg: "qr-bewerten.svg",
  barePng: "qr-bewerten.png",
  backSvg: "karte-bewerten-rueckseite.svg",
  backPng: "karte-bewerten-rueckseite.png",
  frontSvg: "karte-bewerten-vorderseite.svg",
  frontPng: "karte-bewerten-vorderseite.png",
};
// sharp/librsvg scales mm units by its own density factor (density 300 gave
// 7 283 px instead of 1 748), so render at a fixed density and resize to the
// exact print size; the PNG carries 300 dpi as metadata.
const renderPng = (svg) =>
  sharp(Buffer.from(svg), { density: 96 })
    .resize(mmToPx(CARD.w), mmToPx(CARD.h), { fit: "fill", kernel: "lanczos3" })
    .withMetadata({ density: DPI })
    .png()
    .toBuffer();
const backRegion = () => ({ x: mmToPx(CARD.qr.x), y: mmToPx(CARD.qr.y), w: mmToPx(CARD.qr.size), h: mmToPx(CARD.qr.size) });

async function write() {
  const f = await siteFacts();
  const qr = QRCode.create(URL_TARGET, { errorCorrectionLevel: ECL });
  fs.mkdirSync(OUT, { recursive: true });
  const put = (name, data) => fs.writeFileSync(path.join(OUT, name), data);
  put(FILES.bareSvg, bareSvg(qr));
  // Bare PNG through the package's own PNG renderer (a second, independent path).
  put(FILES.barePng, await QRCode.toBuffer(URL_TARGET, { errorCorrectionLevel: ECL, margin: QUIET, width: 1200, color: { dark: "#000000", light: "#ffffff" } }));
  const back = backSvg(qr, f);
  const front = frontSvg(f);
  put(FILES.backSvg, back);
  put(FILES.frontSvg, front);
  put(FILES.backPng, await renderPng(back));
  put(FILES.frontPng, await renderPng(front));
  return { version: qr.version, size: qr.modules.size, mask: qr.maskPattern, moduleMmOnCard: +(CARD.qr.size / (qr.modules.size + 2 * QUIET)).toFixed(3) };
}

async function selfTest() {
  const read = (n) => fs.readFileSync(path.join(OUT, n));
  const cases = [
    [FILES.bareSvg, () => decodeOwnSvg(read(FILES.bareSvg).toString("utf8"))],
    [FILES.barePng, () => decodePng(read(FILES.barePng))],
    [FILES.backSvg, () => decodeOwnSvg(read(FILES.backSvg).toString("utf8"))],
    [FILES.backPng, () => decodePng(read(FILES.backPng), backRegion())],
  ];
  const results = [];
  for (const [file, fn] of cases) {
    try {
      const r = fn();
      results.push({ file, ok: r.text === URL_TARGET, decoded: r.text, version: r.version, ecl: r.ecl, mask: r.mask, modes: r.modes });
    } catch (err) {
      results.push({ file, ok: false, error: err.message });
    }
  }
  // Negative control: a code for a different URL must not pass as ours.
  const other = decodeOwnSvg(bareSvg(QRCode.create("https://platzhirsch.studio/de/kontakt", { errorCorrectionLevel: ECL })));
  results.push({ file: "(Gegenprobe /de/kontakt)", ok: other.text !== URL_TARGET && other.text.endsWith("/de/kontakt"), decoded: other.text });
  const png = await sharp(read(FILES.backPng)).metadata();
  const sizeOk = png.width === mmToPx(CARD.w) && png.height === mmToPx(CARD.h);
  results.push({ file: `${FILES.backPng} (Format)`, ok: sizeOk, decoded: `${png.width} × ${png.height} px = A6 quer bei ${DPI} dpi` });
  return results;
}

const meta = args.check ? null : await write();
const results = await selfTest();
const files = Object.fromEntries(Object.values(FILES).map((n) => [n, fs.existsSync(path.join(OUT, n)) ? sha256(fs.readFileSync(path.join(OUT, n))) : null]));
const allOk = results.every((r) => r.ok);
if (meta) {
  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(
      {
        url: URL_TARGET,
        errorCorrection: ECL,
        quietZoneModules: QUIET,
        ...meta,
        card: { format: "A6 quer", mm: [CARD.w, CARD.h], qrBoxMm: CARD.qr.size, dpi: DPI },
        generator: "scripts/make-review-qr.mjs",
        qrcode: require("qrcode/package.json").version,
        selfTest: { ok: allOk, results },
        sha256: files,
      },
      null,
      2,
    ) + "\n",
  );
}
for (const r of results) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.file}: ${r.decoded ?? r.error}${r.version ? ` (v${r.version}-${r.ecl}, Maske ${r.mask}, ${r.modes.join("+")})` : ""}`);
console.log(allOk ? `Selbsttest grün, Dateien in ${path.relative(ROOT, OUT)}` : "Selbsttest ROT");
process.exitCode = allOk ? 0 : 1;
