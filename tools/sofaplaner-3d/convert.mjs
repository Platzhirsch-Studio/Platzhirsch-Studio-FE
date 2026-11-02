#!/usr/bin/env node
// Sofaplaner 3D – Original-3D-Modelle von Minotti für den Sofaplaner aufbereiten.
//
//   npm run sofaplaner:3d                      (Standard-Ordner, Freigabe bleibt wie sie ist)
//   npm run sofaplaner:3d -- --freigabe        (schriftliche Freigabe von Minotti liegt vor)
//
// Optionen: --in <ordner>  (Standard Herstellermaterial/Minotti/3d)
//           --out <ordner> (Standard public/labs/sofaplaner/modelle)
//           --blender <pfad/zu/blender.exe> (sonst SOFAPLANER_BLENDER, PATH, Programme)
//           --freigabe | --keine-freigabe   --nur-pruefen (nichts schreiben)
//
// Ablage: pro Modellfamilie ein Unterordner (Name wie im Planer, z. B.
// "andersen-slim-103" oder "Andersen Slim 103"), darin die Dateien aus dem
// Minotti-Händlerbereich (FBX, OBJ, 3DS, DAE, GLB … auch als ZIP). Dateien, die
// nicht eindeutig einem Element zugeordnet werden können, trägt man in
// <in>/zuordnung.json ein: { "andersen-slim-103/datei.fbx": "AS103-SOFA-227" }
// oder { "…": { "code": "AS103-EL1ARM-186-SX", "side": "SX" } } oder { "…": { "ignorieren": true } }.
// Anleitung: docs/sofaplaner-3d-modelle.md
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { FORMATS, baseCode, convertOne, createIO, loadFamilies, matchElement, matchFamily, sideHint } from "./lib.mjs";
import { LICENCE_NOTE } from "../../src/lib/sofaplaner/modelle3d.js";

const ROOT = path.resolve(import.meta.dirname, "../..");

function args(argv) {
  const o = {
    in: path.join(ROOT, "Herstellermaterial/Minotti/3d"),
    out: path.join(ROOT, "public/labs/sofaplaner/modelle"),
    data: path.join(ROOT, "src/lib/sofaplaner/minotti"),
    blender: null,
    freigabe: null,
    dry: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--in") o.in = path.resolve(argv[++i]);
    else if (a === "--out") o.out = path.resolve(argv[++i]);
    else if (a === "--data") o.data = path.resolve(argv[++i]);
    else if (a === "--blender") o.blender = argv[++i];
    else if (a === "--freigabe") o.freigabe = true;
    else if (a === "--keine-freigabe") o.freigabe = false;
    else if (a === "--nur-pruefen") o.dry = true;
  }
  return o;
}

function walk(dir, base = dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p, base));
    else
      out.push({
        abs: p,
        rel: path.relative(base, p).split(path.sep).join("/"),
      });
  }
  return out;
}

function findBlender(explicit) {
  const cands = [explicit, process.env.SOFAPLANER_BLENDER].filter(Boolean);
  try {
    const w = execFileSync(process.platform === "win32" ? "where" : "which", ["blender"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    cands.push(...w.split(/\r?\n/).filter(Boolean));
  } catch {
    /* not on PATH */
  }
  for (const pf of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean)) {
    const dir = path.join(pf, "Blender Foundation");
    if (existsSync(dir)) {
      for (const v of readdirSync(dir).sort().reverse()) cands.push(path.join(dir, v, "blender.exe"));
    }
  }
  return cands.find((c) => existsSync(c)) || null;
}

function otherBlenderRunning() {
  if (process.platform !== "win32") return false;
  try {
    return /blender\.exe/i.test(
      execFileSync("tasklist", ["/FI", "IMAGENAME eq blender.exe"], {
        encoding: "utf8",
      })
    );
  } catch {
    return false;
  }
}

function runBlender(blender, src, dst) {
  const script = path.join(import.meta.dirname, "blender_export.py");
  // headless, factory settings, CPU only – the import/export never touches the GPU
  const r = spawnSync(blender, ["-b", "--factory-startup", "-noaudio", "-P", script, "--", src, dst], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 15 * 60 * 1000 });
  const line = (r.stdout || "")
    .split(/\r?\n/)
    .reverse()
    .find((l) => l.startsWith("SOFAPLANER_RESULT "));
  if (!line)
    return {
      ok: false,
      error: `Blender ohne Ergebnis (Exit ${r.status}): ${(r.stderr || "").slice(-400)}`,
    };
  return JSON.parse(line.slice("SOFAPLANER_RESULT ".length));
}

/** ZIP archives (Minotti delivers some models zipped) → extracted into the temp dir; Windows 10+ tar reads zip. */
function expandZips(files, tmp) {
  const out = [];
  for (const f of files) {
    if (!/\.zip$/i.test(f.abs)) {
      out.push(f);
      continue;
    }
    const dir = path.join(tmp, "zip", f.rel.replace(/[^\w.-]+/g, "_"));
    mkdirSync(dir, { recursive: true });
    const r = spawnSync("tar", ["-xf", f.abs, "-C", dir], { encoding: "utf8" });
    if (r.status !== 0) {
      out.push({
        ...f,
        error: `ZIP konnte nicht entpackt werden: ${r.stderr?.slice(0, 200)}`,
      });
      continue;
    }
    const prefix = f.rel.replace(/\.zip$/i, "");
    for (const inner of walk(dir))
      out.push({
        abs: inner.abs,
        rel: `${prefix}/${inner.rel}`,
        fromZip: f.rel,
      });
  }
  return out;
}

async function main() {
  const o = args(process.argv.slice(2));
  const families = loadFamilies(o.data);
  const manifestPath = path.join(o.out, "manifest.json");
  let previous = null;
  try {
    previous = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    /* first run */
  }
  let overrides = {};
  try {
    overrides = JSON.parse(readFileSync(path.join(o.in, "zuordnung.json"), "utf8"));
  } catch {
    /* optional */
  }
  const tmp = mkdtempSync(path.join(os.tmpdir(), "sofaplaner-3d-"));
  const io = createIO();
  const models = [];
  const skipped = [];
  let blender;
  try {
    const files = expandZips(
      walk(o.in).filter((f) => !/^(zuordnung\.json|konvertierung-bericht\.json|liesmich.*|readme.*)$/i.test(path.basename(f.rel))),
      tmp
    );
    if (!files.length) console.log(`Keine Dateien in ${o.in} – Manifest wird leer geschrieben.`);
    for (const f of files) {
      if (f.error) {
        skipped.push({ source: f.rel, reason: f.error });
        continue;
      }
      const ext = path.extname(f.abs).toLowerCase();
      if (FORMATS.skip[ext]) {
        skipped.push({ source: f.rel, reason: FORMATS.skip[ext] });
        continue;
      }
      if (![...FORMATS.direct, ...FORMATS.blender].includes(ext)) {
        if (![".bin", ".png", ".jpg", ".jpeg", ".tga", ".tif", ".tiff", ".mtl", ".bmp", ".webp"].includes(ext))
          skipped.push({
            source: f.rel,
            reason: `Dateityp ${ext || "?"} wird nicht konvertiert`,
          });
        continue;
      }
      // family + element: zuordnung.json first
      const ov = overrides[f.rel] ?? (f.fromZip ? overrides[f.fromZip] : undefined);
      const ovObj = typeof ov === "string" ? { code: ov } : ov || null;
      if (ovObj?.ignorieren) {
        skipped.push({
          source: f.rel,
          reason: "laut zuordnung.json ignoriert",
        });
        continue;
      }
      const segs = f.rel.split("/");
      const family = ovObj?.family || matchFamily(segs[0], families) || matchFamily(path.basename(f.rel), families);
      if (!family) {
        skipped.push({
          source: f.rel,
          reason: "Familie nicht erkannt – Datei in einen Unterordner mit dem Modellnamen legen (z. B. andersen-slim-103/)",
        });
        continue;
      }
      const { fam, raw } = families.get(family);
      let group = null;
      if (ovObj?.code) {
        const key = baseCode(ovObj.code);
        const els = fam.elements.filter((e) => baseCode(e.srcCode ?? e.code) === key);
        if (els.length)
          group = {
            key,
            els,
            codes: [...new Set(els.map((e) => e.srcCode ?? e.code))],
          };
      } else {
        const m = matchElement(path.basename(f.rel, ext), fam);
        if (m && !m.ambiguous) group = m.group;
        else if (m?.ambiguous) {
          skipped.push({
            source: f.rel,
            reason: `mehrdeutig (${m.group.key} u. a.) – bitte in zuordnung.json eintragen`,
          });
          continue;
        }
      }
      if (!group) {
        skipped.push({
          source: f.rel,
          reason: `kein Element von ${fam.name} erkannt – bitte in zuordnung.json eintragen`,
        });
        continue;
      }
      if (o.dry) {
        console.log(`✓ ${f.rel} → ${family} / ${group.key}`);
        continue;
      }
      let input = f.abs;
      if (FORMATS.blender.includes(ext)) {
        blender ??= findBlender(o.blender) || false;
        if (!blender) {
          skipped.push({
            source: f.rel,
            reason: "Blender nicht gefunden (--blender <pfad> oder SOFAPLANER_BLENDER setzen)",
          });
          continue;
        }
        if (otherBlenderRunning()) console.log("Hinweis: ein anderes Blender läuft – die Umwandlung nutzt nur die CPU und läuft trotzdem.");
        input = path.join(tmp, `${models.length}-${path.basename(f.rel, ext)}.glb`);
        const r = runBlender(blender, f.abs, input);
        if (!r.ok) {
          skipped.push({ source: f.rel, reason: `Blender: ${r.error}` });
          continue;
        }
      }
      try {
        const entries = await convertOne({
          io,
          inputPath: input,
          family,
          fam,
          raw,
          group,
          side: ovObj?.side || sideHint(path.basename(f.rel)),
          outDir: o.out,
          source: `Herstellermaterial/Minotti/3d/${f.rel}`,
          writeFile: async (p, bytes) => {
            await mkdir(path.dirname(p), { recursive: true });
            await writeFile(p, bytes);
          },
        });
        models.push(...entries);
        const e = entries[0];
        console.log(
          `${e.ok ? "✓" : "⚠"} ${f.rel} → ${e.file.replace(/\.desktop\.glb$/, "")}${e.side ? ` (${e.side})` : ""}  ${e.bbox.w}×${e.bbox.d}×${e.bbox.h} cm (Soll ${e.expected.w}×${e.expected.d}×${e.expected.h ?? "?"}), ${entries.map((x) => `${x.lod} ${x.tris} Dreiecke`).join(", ")}${e.ok ? "" : "  → Maße weichen ab, wird NICHT angezeigt"}`
        );
      } catch (err) {
        skipped.push({
          source: f.rel,
          reason: `Konvertierung fehlgeschlagen: ${err.message}`,
        });
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  if (o.dry) return;
  const freigabe = o.freigabe ?? previous?.freigabe === true;
  const manifest = {
    version: 1,
    generated: new Date().toISOString(),
    freigabe,
    licence: LICENCE_NOTE,
    hinweis: "Originalmodelle Minotti S.p.A. – öffentliche Anzeige nur mit schriftlicher Freigabe von Minotti (freigabe: true). Siehe docs/sofaplaner-3d-modelle.md.",
    konvention: "GLB in Metern; Ursprung = Mitte der Grundfläche auf Bodenhöhe; Breite X, Front +Z, Rücken −Z; SX = Armlehne links (−X). bbox/expected/deviation in cm.",
    models,
    skipped,
  };
  await mkdir(o.out, { recursive: true });
  // stale models of earlier runs
  for (const f of walk(o.out).filter((x) => x.rel.endsWith(".glb") && !models.some((m) => m.file === x.rel))) rmSync(f.abs);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  if (existsSync(o.in))
    await writeFile(path.join(o.in, "konvertierung-bericht.json"), `${JSON.stringify({ generated: manifest.generated, models: models.filter((m) => m.lod === "desktop"), skipped }, null, 2)}\n`);
  const ok = models.filter((m) => m.lod === "desktop" && m.ok).length;
  const bad = models.filter((m) => m.lod === "desktop" && !m.ok).length;
  console.log(`\n${ok} Modell(e) übernommen, ${bad} mit abweichenden Maßen (nicht angezeigt), ${skipped.length} übersprungen.`);
  for (const s of skipped) console.log(`  – ${s.source}: ${s.reason}`);
  console.log(
    freigabe ? "Freigabe: ja – die Modelle erscheinen im Sofaplaner." : "Freigabe: nein – die Modelle erscheinen erst nach `npm run sofaplaner:3d -- --freigabe` (schriftliche Freigabe von Minotti)."
  );
  console.log(`Manifest: ${path.relative(ROOT, manifestPath)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
