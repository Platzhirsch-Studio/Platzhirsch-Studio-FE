#!/usr/bin/env node
// tools/arbeitsweise/import.mjs – Haralds Material in Stunden statt Tagen live
// (Rat 9,5, Maßnahme A14, Team T4).
//
// Liest einen Lieferordner mit Bildern und einer Beschreibung `material.json`,
// schneidet jedes Bild auf das Seitenverhältnis seines Slots (Bibel §6:
// 3:2, 4:5, 1:1, 21:9; das Rendering zusätzlich 4:5 für mobil), entfernt
// EXIF/GPS (sharp schreibt ohne Metadaten), speichert AVIF unter
// public/arbeitsweise/ und schreibt die Slot-Objekte nach
// src/lib/arbeitsweise/media-import.js. media.js übernimmt sie von dort –
// keine Komponente kennt einen Bildpfad.
//
// Nichts wird erfunden: alt, credit, einwilligung, kiStufe und typ MÜSSEN in
// material.json stehen. Fehlt etwas, bricht das Skript ab und schreibt nichts
// (alles oder nichts). Bei Skizze und Modell gilt kiStufe "keine".
//
// Aufruf
//   node tools/arbeitsweise/import.mjs --in <lieferordner>
//        [--trocken]                 nur prüfen, nichts schreiben
//        [--probe]                   Probelauf: jedes Slot-Objekt bekommt
//                                    `probelauf: true` (validateMedia lehnt es
//                                    für die Seite ab) – nur mit --out/--modul
//                                    außerhalb des Repos
//        [--out <public-ordner>]     Standard: public/ des Repos
//        [--modul <datei.js>]        Standard: src/lib/arbeitsweise/media-import.js
//        [--neu]                     vorhandene Import-Einträge verwerfen statt ergänzen
//   node tools/arbeitsweise/import.mjs --selbsttest [--out <ordner>]
//                                    erzeugt einen Testordner mit neutralen
//                                    Flächen (kein Bildinhalt) und führt einen
//                                    Probelauf aus (Abnahme T4)
//
// material.json
//   {
//     "eintraege": [
//       {
//         "datei": "skizze-wohnraum.jpg",          // im Lieferordner
//         "ziel": "handzeichnung",                 // Slot aus MEDIA oder "kette.<vorher|skizze|modell|rendering|umsetzung>"
//         "alt": "Handzeichnung eines Wohnraums …",
//         "credit": "Handzeichnung: Harald Menghin",
//         "datum": "10/2026",                      // MM/JJJJ, optional
//         "projekt": "P-2026-014",                 // optional, wird nicht angezeigt
//         "einwilligung": "BR-2026-031",           // Verweis ins Bildregister
//         "kiStufe": "keine",
//         "typ": "skizze",                         // skizze | modell | rendering | foto | screenshot
//         "caption": "…",                          // optional
//         // Schritt „Rechte eintragen“ (Bilder-SEO, 31.10.2026) – optional, aber
//         // nur mit "rechteinhaber" kommt das Bild ins Urheber-Register
//         // (src/lib/seo/imageRights.js → ImageObject mit creditText, XMP in der AVIF):
//         "rechteinhaber": "Platzhirsch Home Living", // wer die Nutzungsrechte hält
//         "urheber": "Harald Menghin",             // NUR wenn belegt, sonst weglassen
//         "bearbeitung": false,                    // Wasserzeichen/Zuschnitt von der Freigabe gedeckt?
//         "rechteStand": "2026-11-02",             // Datum der Rechteprüfung (JJJJ-MM-TT)
//         "fotograf": "…",                         // optional: Fotograf/Studio laut Vertrag
//         "exklusiveRechteBestaetigt": false,      // Nr. 31: exklusive Rechte inkl. Bearbeitung bestätigt → „©“
//         "fotografSichtbarNennen": true,          // optional: sichtbare Nennung laut Vertrag (weglassen = offen)
//         "fokus": "attention",                    // optional: sharp-Position (centre, top, attention, entropy …)
//         "dateiMobil": "rendering-hochformat.jpg" // optional, nur Rendering: eigene 4:5-Fassung derselben Kamera
//       }
//     ],
//     "ketteFakten": { "region": "…", "typologie": "…", "flaeche": "…", "dauer": "…" }  // optional, nur echte Daten
//   }
//
// Das Team-Porträt von Harald ist der Slot "portrait" (4:5); die Team-Seite
// und das Autorprofil lesen ihn aus media.js.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import { xmpPacket } from "../images/lib.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_MODULE = path.join(ROOT, "src/lib/arbeitsweise/media-import.js");
const DEFAULT_PUBLIC = path.join(ROOT, "public");
const SUBDIR = "arbeitsweise";

/** Slot → Seitenverhältnis (muss zu RATIO in media.js passen, Test prüft das). */
export const SLOT_RATIO = {
  hero: "4/5",
  kennenlernen: "3/2",
  vorOrt: "3/2",
  handzeichnung: "3/2",
  modell: "1/1",
  planung3d: "3/2",
  rendering: "21/9",
  umsetzung: "3/2",
  portrait: "4/5",
};
export const KETTE_KEYS = ["vorher", "skizze", "modell", "rendering", "umsetzung"];

/** Erwarteter `typ` je Ziel (Schutz vor Verwechslung, z. B. Rendering als Skizze). */
export const SLOT_TYP = {
  hero: ["foto"],
  kennenlernen: ["foto"],
  vorOrt: ["foto"],
  handzeichnung: ["skizze"],
  modell: ["modell"],
  planung3d: ["screenshot"],
  rendering: ["rendering"],
  umsetzung: ["foto"],
  portrait: ["foto"],
  "kette.vorher": ["foto"],
  "kette.skizze": ["skizze"],
  "kette.modell": ["modell"],
  "kette.rendering": ["rendering"],
  "kette.umsetzung": ["foto"],
};
const HAND = new Set(["handzeichnung", "modell", "kette.skizze", "kette.modell"]);
const TYPEN = ["skizze", "modell", "rendering", "foto", "screenshot"];
const KI_RE = /\b(ai|ki)[-_ ]?(generated|generiert)|midjourney|dall-?e|stable-?diffusion|firefly|flux\b/i;

/** Zielmaße (lange Kante) je Verhältnis – groß genug für 2× Retina, next/image skaliert. */
export const TARGET = {
  "3/2": [2400, 1600],
  "4/5": [1600, 2000],
  "1/1": [1800, 1800],
  "21/9": [2520, 1080],
};
const MIN_WIDTH = 1200; // darunter: Warnung (unscharf auf Desktop)

export function ratioOf(ziel) {
  if (ziel.startsWith("kette.")) return "3/2";
  return SLOT_RATIO[ziel];
}

/**
 * Prüft einen Eintrag aus material.json. Gibt Fehlermeldungen zurück (leer = gut).
 * @param {object} e
 * @param {(f: string) => boolean} exists  Datei im Lieferordner vorhanden?
 */
export function checkEntry(e, exists = () => true) {
  const errs = [];
  const id = e?.ziel || e?.datei || "?";
  const ziel = e?.ziel;
  const known = ziel && (ziel in SLOT_RATIO || (ziel.startsWith("kette.") && KETTE_KEYS.includes(ziel.slice(6))));
  if (!known) errs.push(`${id}: unbekanntes Ziel „${ziel}“ (erlaubt: ${Object.keys(SLOT_RATIO).join(", ")}, kette.${KETTE_KEYS.join("|kette.")})`);
  for (const f of ["datei", "alt", "credit", "einwilligung", "kiStufe", "typ"]) {
    if (typeof e?.[f] !== "string" || !e[f].trim()) errs.push(`${id}: Feld „${f}“ fehlt`);
  }
  if (e?.typ && !TYPEN.includes(e.typ)) errs.push(`${id}: typ „${e.typ}“ unbekannt (${TYPEN.join(", ")})`);
  if (known && e?.typ && SLOT_TYP[ziel] && !SLOT_TYP[ziel].includes(e.typ)) errs.push(`${id}: typ „${e.typ}“ passt nicht zum Ziel (${SLOT_TYP[ziel].join("/")})`);
  if (known && HAND.has(ziel) && e?.kiStufe !== "keine") errs.push(`${id}: Haralds Handwerk muss kiStufe "keine" haben`);
  if (KI_RE.test(`${e?.datei || ""} ${e?.credit || ""} ${e?.caption || ""}`)) errs.push(`${id}: KI-generiertes Material ist verboten`);
  if (e?.datum != null && !/^(0[1-9]|1[0-2])\/\d{4}$/.test(String(e.datum))) errs.push(`${id}: datum als MM/JJJJ`);
  if (typeof e?.alt === "string" && e.alt.trim().length < 15) errs.push(`${id}: alt zu kurz – beschreiben, was zu sehen ist`);
  if (e?.datei && !exists(e.datei)) errs.push(`${id}: Datei „${e.datei}“ fehlt im Lieferordner`);
  // Schritt „Rechte eintragen“ (optional): Typen prüfen, nichts erfinden.
  if (e?.rechteinhaber != null && (typeof e.rechteinhaber !== "string" || !e.rechteinhaber.trim())) errs.push(`${id}: rechteinhaber als Text`);
  if (e?.urheber != null && (typeof e.urheber !== "string" || !e.urheber.trim())) errs.push(`${id}: urheber als Text (oder weglassen, wenn nicht belegt)`);
  if (e?.bearbeitung != null && typeof e.bearbeitung !== "boolean") errs.push(`${id}: bearbeitung als true/false`);
  if (e?.rechteStand != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(e.rechteStand))) errs.push(`${id}: rechteStand als JJJJ-MM-TT`);
  if (e?.fotograf != null && (typeof e.fotograf !== "string" || !e.fotograf.trim())) errs.push(`${id}: fotograf als Text (oder weglassen)`);
  if (e?.exklusiveRechteBestaetigt != null && typeof e.exklusiveRechteBestaetigt !== "boolean") errs.push(`${id}: exklusiveRechteBestaetigt als true/false`);
  if (e?.exklusiveRechteBestaetigt === true && e?.bearbeitung !== true) errs.push(`${id}: exklusiveRechteBestaetigt nur mit bearbeitung: true (Nr. 31: Rechte inkl. Bearbeitung)`);
  if (e?.fotografSichtbarNennen != null && typeof e.fotografSichtbarNennen !== "boolean") errs.push(`${id}: fotografSichtbarNennen als true/false (oder weglassen = offen)`);
  if ((e?.urheber || e?.bearbeitung != null || e?.fotograf || e?.exklusiveRechteBestaetigt != null) && !e?.rechteinhaber) errs.push(`${id}: urheber/fotograf/bearbeitung/exklusiveRechteBestaetigt nur zusammen mit rechteinhaber`);
  if (e?.dateiMobil != null) {
    if (ziel !== "rendering" && ziel !== "kette.rendering") errs.push(`${id}: dateiMobil nur beim Rendering`);
    else if (!exists(e.dateiMobil)) errs.push(`${id}: Datei „${e.dateiMobil}“ fehlt im Lieferordner`);
  }
  return errs;
}

/** Prüft die ganze Lieferung (inkl. doppelter Ziele). */
export function checkManifest(m, exists = () => true) {
  const errs = [];
  if (!m || !Array.isArray(m.eintraege) || m.eintraege.length === 0) return ["material.json: „eintraege“ fehlt oder ist leer"];
  const seen = new Set();
  for (const e of m.eintraege) {
    errs.push(...checkEntry(e, exists));
    if (e?.ziel) {
      if (seen.has(e.ziel)) errs.push(`${e.ziel}: Ziel doppelt belegt`);
      seen.add(e.ziel);
    }
  }
  if (m.ketteFakten != null) {
    const ok = typeof m.ketteFakten === "object" && Object.values(m.ketteFakten).every((v) => typeof v === "string" && v.trim());
    if (!ok) errs.push("ketteFakten: nur Textfelder mit echten Angaben (region, typologie, flaeche, dauer)");
  }
  return errs;
}

/** Größtes Ausgabemaß im Verhältnis, ohne das Original zu vergrößern. */
export function outputSize(ratio, srcW, srcH) {
  const [tw, th] = TARGET[ratio];
  const r = tw / th;
  // größter Ausschnitt im Original mit diesem Verhältnis
  const cropW = Math.min(srcW, Math.floor(srcH * r));
  const w = Math.min(tw, cropW);
  return [w, Math.round(w / r)];
}

const slug = (ziel) => ziel.replace(/^kette\./, "kette-").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

async function render(file, ratio, fokus, outDir, base, isHand, xmp = null) {
  const img = sharp(file, { failOn: "error" }).rotate(); // EXIF-Drehung anwenden, danach ohne Metadaten
  const meta = await img.metadata();
  const sw = meta.autoOrient?.width ?? meta.width;
  const sh = meta.autoOrient?.height ?? meta.height;
  const [w, h] = outputSize(ratio, sw, sh);
  let pipe = img
    .resize({ width: w, height: h, fit: "cover", position: fokus || "attention" })
    .avif({ quality: isHand ? 66 : 60, effort: 4, chromaSubsampling: isHand ? "4:4:4" : "4:2:0" });
  // Bilder-SEO: nur XMP (Credit/Copyright) – kein EXIF/GPS. Ohne Rechte-Angabe nichts.
  if (xmp) pipe = pipe.withXmp(xmp);
  const buf = await pipe.toBuffer();
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 8);
  const name = `${base}-${hash}.avif`;
  return { buf, name, width: w, height: h, small: w < MIN_WIDTH };
}

/** XMP (Credit, Copyright, ggf. Urheber) für einen Eintrag mit rechteinhaber, sonst null. */
export function rightsXmp(e) {
  if (!e?.rechteinhaber) return null;
  // „© <Rechteinhaber>“ und plus:CopyrightOwner nur mit exklusiveRechteBestaetigt (Inhaber-Entscheidung Nr. 31)
  return xmpPacket({
    creditText: e.rechteinhaber.trim(),
    rechteinhaber: e.rechteinhaber.trim(),
    urheber: e.urheber?.trim() || "",
    fotograf: e.fotograf?.trim() || null,
    exklusiveRechteBestaetigt: e.exklusiveRechteBestaetigt === true,
    lizenzSeite: null,
  });
}

/** Slot-Objekt im Format von media.js. */
export function slotObject(e, out, mobile, probe) {
  const o = {
    src: `/${SUBDIR}/${out.name}`,
    ...(mobile ? { srcMobile: `/${SUBDIR}/${mobile.name}` } : {}),
    alt: e.alt.trim(),
    width: out.width,
    height: out.height,
    credit: e.credit.trim(),
    ...(e.datum ? { datum: e.datum } : {}),
    ...(e.projekt ? { projekt: e.projekt } : {}),
    einwilligung: e.einwilligung.trim(),
    kiStufe: e.kiStufe.trim(),
    typ: e.typ,
    ...(e.caption ? { caption: e.caption.trim() } : {}),
    ...(e.rechteinhaber ? { rechteinhaber: e.rechteinhaber.trim() } : {}),
    ...(e.rechteinhaber && e.urheber ? { urheber: e.urheber.trim() } : {}),
    ...(e.rechteinhaber && typeof e.bearbeitung === "boolean" ? { bearbeitung: e.bearbeitung } : {}),
    ...(e.rechteinhaber && e.rechteStand ? { rechteStand: e.rechteStand } : {}),
    ...(e.rechteinhaber && e.fotograf ? { fotograf: e.fotograf.trim() } : {}),
    ...(e.rechteinhaber && e.exklusiveRechteBestaetigt === true ? { exklusiveRechteBestaetigt: true } : {}),
    ...(e.rechteinhaber && typeof e.fotografSichtbarNennen === "boolean" ? { fotografSichtbarNennen: e.fotografSichtbarNennen } : {}),
  };
  if (probe) o.probelauf = true;
  return o;
}

async function readExisting(modulePath) {
  if (!fs.existsSync(modulePath)) return { media: {}, kette: {} };
  const mod = await import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`);
  return { media: { ...(mod.IMPORT_MEDIA || {}) }, kette: { ...(mod.IMPORT_KETTE || {}) } };
}

export function moduleSource({ media, kette, stand, quelle }) {
  const order = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k]).map((k) => [k, obj[k]]));
  const m = order(media, Object.keys(SLOT_RATIO));
  const k = order(kette, [...KETTE_KEYS, "fakten"]);
  return [
    "// src/lib/arbeitsweise/media-import.js – AUTOMATISCH ERZEUGT von",
    "// tools/arbeitsweise/import.mjs. Nicht von Hand ändern: neu importieren.",
    "// media.js übernimmt diese Slots (nur echtes Material von Harald Menghin",
    "// bzw. aus echten Projekten, mit Einwilligung, ohne KI).",
    "",
    `export const IMPORT_STAND = ${JSON.stringify(stand)};`,
    `export const IMPORT_QUELLE = ${JSON.stringify(quelle)};`,
    "",
    `export const IMPORT_MEDIA = ${JSON.stringify(m, null, 2)};`,
    "",
    `export const IMPORT_KETTE = ${JSON.stringify(k, null, 2)};`,
    "",
  ].join("\n");
}

function parseArgs(argv) {
  const a = { flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (["--in", "--out", "--modul"].includes(t)) a[t.slice(2)] = argv[++i];
    else if (t.startsWith("--")) a.flags.add(t.slice(2));
    else throw new Error(`unbekanntes Argument ${t}`);
  }
  return a;
}

const inside = (p, dir) => {
  const rel = path.relative(dir, path.resolve(p));
  return !rel.startsWith("..") && !path.isAbsolute(rel);
};

/**
 * Führt den Import aus. Gibt einen Bericht zurück; wirft bei Fehlern (nichts geschrieben).
 */
export async function runImport({ inDir, outPublic = DEFAULT_PUBLIC, modulePath = DEFAULT_MODULE, probe = false, dry = false, fresh = false, log = console.log }) {
  if (!inDir || !fs.existsSync(inDir)) throw new Error(`Lieferordner fehlt: ${inDir}`);
  if (probe && (inside(outPublic, ROOT) || inside(modulePath, ROOT))) {
    throw new Error("--probe schreibt nie ins Repo: --out und --modul außerhalb angeben (z. B. Scratch-Ordner)");
  }
  const manifestPath = path.join(inDir, "material.json");
  if (!fs.existsSync(manifestPath)) throw new Error(`material.json fehlt in ${inDir}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const exists = (f) => !f.includes("..") && fs.existsSync(path.join(inDir, f));
  const errs = checkManifest(manifest, exists);
  if (errs.length) throw Object.assign(new Error(`Lieferung unvollständig:\n  - ${errs.join("\n  - ")}`), { errors: errs });

  // 1. alles rendern (im Speicher) – erst wenn alles klappt, wird geschrieben
  const files = [];
  const media = {};
  const kette = {};
  const warnings = [];
  for (const e of manifest.eintraege) {
    const ratio = ratioOf(e.ziel);
    const hand = HAND.has(e.ziel);
    const base = slug(e.ziel);
    const xmp = rightsXmp(e);
    const out = await render(path.join(inDir, e.datei), ratio, e.fokus, outPublic, base, hand, xmp);
    files.push(out);
    let mobile = null;
    if (e.ziel === "rendering" || e.ziel === "kette.rendering") {
      mobile = await render(path.join(inDir, e.dateiMobil || e.datei), "4/5", e.fokus, outPublic, `${base}-4x5`, false, xmp);
      files.push(mobile);
    }
    if (out.small) warnings.push(`${e.ziel}: nur ${out.width} px breit (empfohlen ≥ ${MIN_WIDTH})`);
    const obj = slotObject(e, out, mobile, probe);
    if (e.ziel.startsWith("kette.")) kette[e.ziel.slice(6)] = obj;
    else media[e.ziel] = obj;
  }
  if (manifest.ketteFakten) kette.fakten = manifest.ketteFakten;

  // 2. gegen dieselbe Prüfung wie die Seite (media.js validateMedia)
  const { validateMedia } = await import(pathToFileURL(path.join(ROOT, "src/lib/arbeitsweise/media.js")).href);
  const verr = validateMedia(media, kette, { allowProbe: probe });
  if (verr.length) throw Object.assign(new Error(`Slot-Objekte ungültig:\n  - ${verr.join("\n  - ")}`), { errors: verr });

  const report = { slots: Object.keys(media), kette: Object.keys(kette), dateien: files.map((f) => f.name), warnungen: warnings, probe, trocken: dry };
  if (dry) return report;

  // 3. schreiben
  const prev = fresh ? { media: {}, kette: {} } : await readExisting(modulePath);
  const dir = path.join(outPublic, SUBDIR);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of files) fs.writeFileSync(path.join(dir, f.name), f.buf);
  fs.mkdirSync(path.dirname(modulePath), { recursive: true });
  const stand = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    modulePath,
    moduleSource({ media: { ...prev.media, ...media }, kette: { ...prev.kette, ...kette }, stand, quelle: path.basename(path.resolve(inDir)) })
  );
  log(`✓ ${files.length} AVIF nach ${dir}`);
  log(`✓ Slots ${[...report.slots, ...report.kette.map((k) => `kette.${k}`)].join(", ")} → ${modulePath}`);
  for (const w of warnings) log(`! ${w}`);
  return report;
}

/** Testordner mit neutralen Flächen (kein Bildinhalt, kein „Material“). */
export async function makeTestFolder(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const flat = (w, h, c) => sharp({ create: { width: w, height: h, channels: 3, background: c } }).jpeg().toFile(path.join(dir, `${w}x${h}.jpg`));
  await flat(3000, 2000, "#e8e2d6");
  await flat(2000, 3000, "#d9d1c3");
  await flat(1000, 1000, "#cfc6b6");
  const e = (datei, ziel, typ, extra = {}) => ({
    datei,
    ziel,
    alt: `Probelauf: neutrale Fläche für den Slot ${ziel}`,
    credit: "Probelauf (kein echtes Material)",
    datum: "10/2026",
    einwilligung: "PROBE",
    kiStufe: "keine",
    typ,
    ...extra,
  });
  const manifest = {
    eintraege: [
      e("3000x2000.jpg", "handzeichnung", "skizze"),
      e("1000x1000.jpg", "modell", "modell"),
      e("3000x2000.jpg", "rendering", "rendering", { dateiMobil: "2000x3000.jpg" }),
      e("2000x3000.jpg", "portrait", "foto", { fokus: "top" }),
      e("3000x2000.jpg", "kette.skizze", "skizze"),
    ],
  };
  fs.writeFileSync(path.join(dir, "material.json"), JSON.stringify(manifest, null, 2));
  return dir;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.flags.has("selbsttest")) {
    const base = a.out || fs.mkdtempSync(path.join(os.tmpdir(), "ph-import-"));
    const inDir = await makeTestFolder(path.join(base, "lieferung"));
    const report = await runImport({ inDir, outPublic: path.join(base, "public"), modulePath: path.join(base, "media-import.js"), probe: true, fresh: true });
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  if (!a.in) {
    console.error("Aufruf: node tools/arbeitsweise/import.mjs --in <lieferordner> [--trocken] [--probe --out <ordner> --modul <datei.js>] [--neu]");
    process.exit(2);
  }
  const report = await runImport({
    inDir: a.in,
    outPublic: a.out || DEFAULT_PUBLIC,
    modulePath: a.modul || DEFAULT_MODULE,
    probe: a.flags.has("probe"),
    dry: a.flags.has("trocken"),
    fresh: a.flags.has("neu"),
  });
  if (report.trocken) console.log(`✓ Prüfung bestanden (nichts geschrieben): ${[...report.slots, ...report.kette].join(", ")}`);
  if (!report.probe && !report.trocken) {
    console.log("Nächste Schritte: npm run lint, node --test tests/unit/arbeitsweise.test.mjs tests/unit/rat95-t4-import.test.mjs,");
    console.log("Sichtprüfung /de/arbeitsweise und /de/ueber-uns/team; Bildregister (Marktresearch/recht/bildrechte.csv) ergänzen.");
    console.log("Rechte eintragen: Slots mit rechteinhaber stehen automatisch im Urheber-Register (src/lib/seo/imageRights.js) –");
    console.log("prüfen mit node --test tests/unit/bilder-seo.test.mjs; ohne rechteinhaber kein Bildnachweis.");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  });
}
