#!/usr/bin/env node
// tools/images/optimize-katalog.mjs – Herstellerbilder des Katalogs vereinheitlichen.
//
// Umfang:  public/Images/Wellness/produkte/**   (Katalog, alle Marken)
//          public/Images/Kueche/**              (Küchengeräte-Seite)
//          public/Images/Wellness/*             (Bad & Wellness, Markenbilder)
//
// Regel (Stand 31.10.2026): höchstens 1600 px lange Kante (nur verkleinern, nie
// vergrößern), WebP Qualität 82, Transparenz bleibt (Alpha verlustfrei 100).
// Motiv unverändert: kein Beschnitt, kein Filter; EXIF-Orientierung wird
// angewendet (danach steht das Bild aufrecht, Orientierung 1). Farbprofil wird
// nach sRGB umgerechnet, sonstige Metadaten entfallen.
//
//   node tools/images/optimize-katalog.mjs --trocken        nur zählen/anzeigen
//   node tools/images/optimize-katalog.mjs                  umwandeln, Originale löschen
//   node tools/images/optimize-katalog.mjs --behalten       umwandeln, Originale behalten
//   node tools/images/optimize-katalog.mjs --manifest out.json   Zuordnung alt → neu
//                                                           (Pfade, Maße, Bytes) schreiben
//
// JPEG/PNG → <name>.webp. Gibt es <name>.webp schon (anderer Inhalt), heißt die
// neue Datei <name>-<endung>.webp (z. B. foo-png.webp) und steht unter
// „kollisionen“ im Manifest. Vorhandene WebP-Dateien über 1600 px werden an Ort
// und Stelle verkleinert; WebP bis 1600 px bleiben unangetastet.
//
// Danach die Verweise (src, Dateischlüssel, width/height) in
// src/lib/katalog/marken/*.js, src/lib/wellness/marken.js, src/lib/kueche/geraete.js
// und die Dateinamen in docs/bildquellen/QUELLEN.md bzw.
// docs/bildquellen/QUELLEN-kueche.md nachziehen – das Manifest liefert die Zuordnung.
// Prüfung: node --test tests/unit/wellness-produkte.test.mjs tests/unit/katalog-konfigurator.test.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

export const MAX_KANTE = 1600;
export const QUALITAET = 82;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BILD = /\.(jpe?g|png|webp)$/i;

const args = process.argv.slice(2);
const TROCKEN = args.includes("--trocken");
const BEHALTEN = args.includes("--behalten");
const mi = args.indexOf("--manifest");
const MANIFEST = mi >= 0 ? path.resolve(args[mi + 1]) : path.join(os.tmpdir(), "optimize-katalog-manifest.json");

function walk(dir, rekursiv = true) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (rekursiv) out.push(...walk(p)); }
    else if (BILD.test(e.name)) out.push(p);
  }
  return out;
}

export function dateien(root = ROOT) {
  const img = path.join(root, "public", "Images");
  return [
    ...walk(path.join(img, "Wellness", "produkte")),
    ...walk(path.join(img, "Kueche")),
    ...walk(path.join(img, "Wellness"), false),
  ].sort();
}

/** Maße nach Anwendung der EXIF-Orientierung. */
function aufrecht(meta) {
  const quer = (meta.orientation || 1) >= 5;
  return quer ? [meta.height, meta.width] : [meta.width, meta.height];
}

const rel = (p) => path.relative(path.join(ROOT, "public"), p).split(path.sep).join("/");

async function eine(datei, m) {
  const ext = path.extname(datei).toLowerCase();
  const stamm = datei.slice(0, -path.extname(datei).length);
  // Als Puffer lesen: unter Windows hält sharp sonst die Datei offen und das
  // Überschreiben einer WebP an Ort und Stelle scheitert (EPERM beim rename).
  const eingabe = fs.readFileSync(datei);
  const meta = await sharp(eingabe, { failOn: "none" }).metadata();
  const [w, h] = aufrecht(meta);
  const bytes = eingabe.length;
  const istWebp = ext === ".webp";
  if (istWebp && Math.max(w, h) <= MAX_KANTE) { m.unveraendert++; return; }
  if ((meta.pages || 1) > 1) m.hinweise.push(`${rel(datei)}: ${meta.pages} Seiten/Frames – nur das erste Bild übernommen`);

  let ziel = `${stamm}.webp`;
  if (!istWebp && fs.existsSync(ziel)) {
    ziel = `${stamm}-${ext.slice(1)}.webp`;
    m.kollisionen.push({ alt: rel(datei), neu: rel(ziel) });
  }
  const eintrag = { alt: rel(datei), neu: rel(ziel), typ: ext.slice(1).replace("jpeg", "jpg"), alpha: !!meta.hasAlpha, vorher: [w, h, bytes] };
  if (TROCKEN) { m.eintraege.push(eintrag); return; }

  const { data, info } = await sharp(eingabe, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_KANTE, height: MAX_KANTE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITAET, alphaQuality: 100, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  const tmp = `${ziel}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, ziel);
  if (!BEHALTEN && path.resolve(ziel) !== path.resolve(datei)) fs.unlinkSync(datei);
  eintrag.nachher = [info.width, info.height, data.length];
  if (data.length > bytes) m.hinweise.push(`${eintrag.neu}: größer als das Original (${bytes} → ${data.length} Bytes)`);
  m.eintraege.push(eintrag);
}

async function main() {
  const liste = dateien();
  const m = { stand: new Date().toISOString(), maxKante: MAX_KANTE, qualitaet: QUALITAET, trocken: TROCKEN, gesamt: liste.length, unveraendert: 0, eintraege: [], kollisionen: [], hinweise: [], fehler: [] };
  let i = 0;
  const worker = async () => {
    while (i < liste.length) {
      const d = liste[i++];
      try { await eine(d, m); } catch (err) { m.fehler.push(`${rel(d)}: ${err.message}`); }
    }
  };
  await Promise.all(Array.from({ length: Math.max(2, Math.min(8, os.cpus().length)) }, worker));
  m.eintraege.sort((a, b) => a.alt.localeCompare(b.alt));
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 1));

  const jeTyp = {};
  let vorher = 0, nachher = 0;
  for (const e of m.eintraege) {
    jeTyp[e.typ] = (jeTyp[e.typ] || 0) + 1;
    vorher += e.vorher[2];
    nachher += e.nachher ? e.nachher[2] : 0;
  }
  console.log(`${TROCKEN ? "Trockenlauf" : "Umgewandelt"}: ${m.eintraege.length} von ${liste.length} Dateien`, jeTyp, `unverändert: ${m.unveraendert}`);
  if (!TROCKEN) console.log(`Bytes der umgewandelten Dateien: ${vorher} → ${nachher}`);
  console.log(`Kollisionen: ${m.kollisionen.length}, Hinweise: ${m.hinweise.length}, Fehler: ${m.fehler.length}`);
  for (const k of m.kollisionen) console.log(`  Kollision: ${k.alt} → ${k.neu}`);
  for (const f of m.fehler) console.log(`  FEHLER ${f}`);
  console.log(`Manifest: ${MANIFEST}`);
  if (m.fehler.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
