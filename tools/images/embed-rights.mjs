#!/usr/bin/env node
// tools/images/embed-rights.mjs – Bildnachweis/Copyright als XMP in die
// Bilddateien der EIGENEN Fotos (Urheber-Register src/lib/seo/imageRights.js).
//
// Standard ist der TROCKENLAUF: zeigt je Register-Eintrag Datei, Format, die
// Rechte-Angaben, die schon in der Datei stehen, und was geschrieben würde.
//
//   node tools/images/embed-rights.mjs                      Trockenlauf (alle Einträge)
//   node tools/images/embed-rights.mjs --datei /Images/Home/aboutHome.jpg
//   node tools/images/embed-rights.mjs --kopie <ordner>     schreibt KOPIEN mit XMP
//                                                           nach <ordner> + Pixelvergleich
//   node tools/images/embed-rights.mjs --schreiben          schreibt in public/ – vorher
//                                                           Sicherung nach assets-originals/
//
// Wie: JPEG und PNG verlustfrei (XMP-Segment/-Chunk wird eingesetzt, Bilddaten
// unverändert, vorhandene EXIF/IPTC-Angaben – z. B. das Copyright des
// Fotografen – bleiben stehen). Nach dem Schreiben werden die dekodierten
// Pixel von vorher und nachher verglichen (SHA-256); weicht etwas ab, wird
// nichts geschrieben. WebP/AVIF: kein verlustfreier Weg mit den installierten
// Mitteln (sharp withXmp kodiert neu) → nur Trockenlauf, Anleitung im Bericht
// qa-screenshots/bilder-seo/bericht.md (exiftool/Lightroom).
//
// Wichtig: next/image (/_next/image) kodiert neu und entfernt ALLE Metadaten
// (node_modules/next/dist/server/image-optimizer/transform.js ruft sharp ohne
// withMetadata/keepMetadata). Google sieht die XMP-Angaben darum nur in der
// Originaldatei (/Images/…), die Bilder-Sitemap und ImageObject.contentUrl
// verlinken. Auf der Seite trägt das JSON-LD (OwnImageJsonLd) den Nachweis.
//
// Herstellerbilder und nicht eingetragene Dateien werden verweigert.
//
// Inhaber-Entscheidung Nr. 31: Rechteinhaber „© Platzhirsch Home Living“
// (dc:rights mit ©, plus:CopyrightOwner) NUR bei exklusiveRechteBestaetigt
// im Register. Urheber/Creator und vorhandene Copyright-Vermerke des
// Fotografen (EXIF, IPTC, fremdes XMP) werden NIE entfernt oder überschrieben:
// EXIF/IPTC bleiben Byte für Byte, fremdes XMP wird nur ergänzt, und embed()
// bricht ab, wenn sich eine vorhandene Angabe ändern würde.
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { ROOT, ORIGINALS, OWN_XMP_NS, requireOwn, xmpPacket, rightsFields, jpegWithXmp, pngWithXmp, formatOf, existingNotices, imageRights, fs } from "./lib.mjs";

const pixelHash = async (buf) => crypto.createHash("sha256").update(await sharp(buf).raw().toBuffer()).digest("hex");

/** Plan für einen Eintrag (ohne zu schreiben). */
export async function planEntry(src) {
  const { rel, entry, file } = requireOwn(src);
  if (!fs.existsSync(file)) throw new Error(`${rel}: Datei fehlt in public/`);
  return buildPlan(fs.readFileSync(file), entry, { rel, file });
}

/**
 * Plan aus Dateiinhalt + Register-Eintrag. Vorhandenes XMP (z. B. Urheber und
 * Copyright des Fotografen) wird übernommen und nur ergänzt (xmpPacket).
 * „© Platzhirsch Home Living“/Rechteinhaber nur bei exklusiveRechteBestaetigt.
 */
export async function buildPlan(buf, entry, { rel = entry?.datei, file = null } = {}) {
  const format = formatOf(buf);
  const meta = await sharp(buf).metadata();
  const vorhandenesXmp = meta.xmp ? meta.xmp.toString("utf8") : null;
  return {
    rel,
    file,
    format,
    verlustfrei: format === "jpeg" || format === "png",
    vorhanden: existingNotices(meta),
    hatXmp: Boolean(meta.xmp),
    schreiben: rightsFields(entry),
    xmp: xmpPacket(entry, vorhandenesXmp),
    buf,
  };
}

/** Neue Datei mit XMP (Buffer) – nur JPEG/PNG; prüft Pixelgleichheit. */
export async function embed(plan) {
  if (!plan.verlustfrei) throw new Error(`${plan.rel}: ${plan.format} – kein verlustfreies Schreiben möglich (exiftool/Lightroom, siehe Bericht)`);
  const out = plan.format === "jpeg" ? jpegWithXmp(plan.buf, plan.xmp) : pngWithXmp(plan.buf, plan.xmp);
  const [a, b] = await Promise.all([pixelHash(plan.buf), pixelHash(out)]);
  if (a !== b) throw new Error(`${plan.rel}: Pixel weichen ab – nichts geschrieben`);
  const after = await sharp(out).metadata();
  const xmp = after.xmp?.toString("utf8") || "";
  if (!xmp.includes(OWN_XMP_NS)) throw new Error(`${plan.rel}: XMP nach dem Schreiben nicht lesbar`);
  const lost = Object.entries(plan.vorhanden).filter(([k, v]) => existingNotices(after)[k] !== v);
  if (lost.length) throw new Error(`${plan.rel}: vorhandene Angabe verändert (${lost.map(([k]) => k).join(", ")}) – nichts geschrieben`);
  return { buf: out, pixelGleich: true, bytesVorher: plan.buf.length, bytesNachher: out.length };
}

function parseArgs(argv) {
  const a = { dateien: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--datei") a.dateien.push(argv[++i]);
    else if (t === "--kopie") a.kopie = argv[++i];
    else if (t === "--schreiben") a.schreiben = true;
    else throw new Error(`unbekanntes Argument ${t}`);
  }
  return a;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const list = a.dateien.length ? a.dateien : imageRights().map((e) => e.datei);
  if (!list.length) {
    console.log("Urheber-Register ist leer – nichts zu tun.");
    return;
  }
  let fehler = 0;
  for (const src of list) {
    let plan;
    try {
      plan = await planEntry(src);
    } catch (err) {
      console.error(`✗ ${err.message}`);
      fehler++;
      continue;
    }
    console.log(`\n${plan.rel}  (${plan.format}${plan.verlustfrei ? ", verlustfrei möglich" : ", NUR Trockenlauf"})`);
    for (const [k, v] of Object.entries(plan.vorhanden)) console.log(`  vorhanden  ${k}: ${v}  → bleibt unverändert`);
    if (plan.hatXmp) console.log("  vorhanden  XMP-Paket → bleibt, eigene Angaben werden nur ergänzt (vorhandene Eigenschaften nie überschrieben)");
    for (const [k, v] of Object.entries(plan.schreiben)) console.log(`  ${v ? "schreibt  " : "lässt weg "} ${k}${v ? `: ${v}` : " (nicht belegt)"}`);
    if (!a.kopie && !a.schreiben) continue;
    try {
      const res = await embed(plan);
      if (a.kopie) {
        const target = path.join(path.resolve(a.kopie), plan.rel.replace(/^\//, ""));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, res.buf);
        console.log(`  ✓ Kopie ${path.relative(ROOT, target)} (Pixel identisch, ${res.bytesVorher} → ${res.bytesNachher} Bytes)`);
      }
      if (a.schreiben) {
        const backup = path.join(ORIGINALS, plan.rel.replace(/^\//, ""));
        if (!fs.existsSync(backup)) {
          fs.mkdirSync(path.dirname(backup), { recursive: true });
          fs.copyFileSync(plan.file, backup);
          console.log(`  ✓ Original gesichert: ${path.relative(ROOT, backup)}`);
        }
        fs.writeFileSync(plan.file, res.buf);
        console.log(`  ✓ geschrieben: public${plan.rel} (Pixel identisch)`);
      }
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
      fehler++;
    }
  }
  if (!a.kopie && !a.schreiben) console.log("\nTrockenlauf – nichts geschrieben. --kopie <ordner> oder --schreiben zum Ausführen.");
  if (fehler) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  });
}
