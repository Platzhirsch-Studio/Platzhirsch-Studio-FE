// tools/splat/lib.mjs – gemeinsame Helfer der Showroom-Splat-Kette (N1).
//
// Kein Python: alles läuft in Node, die schweren Schritte rufen fertige
// Programme auf (ffmpeg, COLMAP, Brush, splat-transform). Pfade der Programme
// kommen aus Umgebungsvariablen oder liegen im GPU-Werkzeugordner außerhalb
// des Repos (Marktresearch/daten/gpu-pipeline.md):
//
//   GPU_TOOLS     ../platzhirsch-gpu-tools           (Standard)
//   FFMPEG_BIN    $GPU_TOOLS/bin/ffmpeg.exe
//   COLMAP_BIN    $GPU_TOOLS/bin/colmap/COLMAP.bat bzw. colmap.exe
//   BRUSH_BIN     $GPU_TOOLS/bin/brush/brush_app.exe
//
// Rohdaten (Video, Einzelbilder, COLMAP-Datenbank, PLY) liegen unter
// $GPU_TOOLS/showroom/<datum>/<zone>/<stimmung>/ – nie im Repo. Ins Repo
// kommen nur die fertigen Web-Dateien unter public/showroom/.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const GPU_TOOLS = path.resolve(process.env.GPU_TOOLS || path.join(REPO, "..", "platzhirsch-gpu-tools"));
export const PUBLIC_DIR = path.join(REPO, "public", "showroom");
export const MANIFEST_PATH = path.join(REPO, "src", "lib", "showroom", "manifest.json");

const firstExisting = (...candidates) => candidates.find((p) => p && fs.existsSync(p)) || candidates.filter(Boolean)[0];

export const BIN = {
  ffmpeg: firstExisting(process.env.FFMPEG_BIN, path.join(GPU_TOOLS, "bin", "ffmpeg.exe"), "ffmpeg"),
  ffprobe: firstExisting(process.env.FFPROBE_BIN, path.join(GPU_TOOLS, "bin", "ffprobe.exe"), "ffprobe"),
  colmap: firstExisting(
    process.env.COLMAP_BIN,
    path.join(GPU_TOOLS, "bin", "colmap", "bin", "colmap.exe"),
    path.join(GPU_TOOLS, "bin", "colmap", "COLMAP.bat"),
    "colmap",
  ),
  brush: firstExisting(process.env.BRUSH_BIN, path.join(GPU_TOOLS, "bin", "brush", "brush_app.exe"), "brush_app"),
  splatTransform: path.join(REPO, "node_modules", "@playcanvas", "splat-transform", "bin", "cli.mjs"),
};

/** Rohdaten-Ordner einer Aufnahme: $GPU_TOOLS/showroom/<datum>/<zone>/<stimmung>. */
export function rawDir(datum, zone, stimmung) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) throw new Error(`datum muss JJJJ-MM-TT sein, nicht "${datum}"`);
  return path.join(GPU_TOOLS, "showroom", datum, zone, stimmung);
}

/** Web-Ordner einer Zone/Stimmung: public/showroom/<zone>/<stimmung>. */
export function webDir(zone, stimmung) {
  return path.join(PUBLIC_DIR, zone, stimmung);
}

/** Öffentlicher URL-Pfad zu einer Datei unter public/. */
export function publicUrl(absFile) {
  return "/" + path.relative(path.join(REPO, "public"), absFile).split(path.sep).join("/");
}

/** Kommandozeilen-Argumente --name wert / --flag → { name: "wert", flag: true }, Rest in _. */
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/**
 * Programm starten, Ausgabe durchreichen, bei Fehler werfen.
 * Windows: .bat/.cmd brauchen eine Shell.
 */
export function run(cmd, args, { cwd, env, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const shell = /\.(bat|cmd)$/i.test(cmd);
    if (!quiet) console.log(`> ${path.basename(cmd)} ${args.join(" ")}`);
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: quiet ? "ignore" : "inherit", shell });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} endete mit Code ${code}`))));
  });
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

export function writeManifest(manifest) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
}

export const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
export const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// ---------------------------------------------------------------------------
// 3DGS-PLY schreiben (Format der INRIA-Referenz, das Brush, SuperSplat und
// splat-transform lesen). Wird von testszene.mjs genutzt.
// ---------------------------------------------------------------------------

const SH_C0 = 0.28209479177387814;
const PLY_PROPS = ["x", "y", "z", "f_dc_0", "f_dc_1", "f_dc_2", "opacity", "scale_0", "scale_1", "scale_2", "rot_0", "rot_1", "rot_2", "rot_3"];

/**
 * @param {string} file
 * @param {{x:number,y:number,z:number,r:number,g:number,b:number,a:number,sx:number,sy:number,sz:number,qw:number,qx:number,qy:number,qz:number}[]} splats
 *   Farbe 0..1 (sRGB-Wert wie im Bild), a 0..1, Skalen in Metern, Quaternion normiert.
 */
export function writePly(file, splats) {
  const header =
    `ply\nformat binary_little_endian 1.0\nelement vertex ${splats.length}\n` +
    PLY_PROPS.map((p) => `property float ${p}\n`).join("") +
    "end_header\n";
  const body = Buffer.alloc(splats.length * PLY_PROPS.length * 4);
  let o = 0;
  const logit = (p) => {
    const c = Math.min(Math.max(p, 1e-4), 1 - 1e-4);
    return Math.log(c / (1 - c));
  };
  for (const s of splats) {
    const vals = [
      s.x,
      s.y,
      s.z,
      (s.r - 0.5) / SH_C0,
      (s.g - 0.5) / SH_C0,
      (s.b - 0.5) / SH_C0,
      logit(s.a),
      Math.log(Math.max(s.sx, 1e-5)),
      Math.log(Math.max(s.sy, 1e-5)),
      Math.log(Math.max(s.sz, 1e-5)),
      s.qw,
      s.qx,
      s.qy,
      s.qz,
    ];
    for (const v of vals) {
      body.writeFloatLE(v, o);
      o += 4;
    }
  }
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, Buffer.concat([Buffer.from(header, "ascii"), body]));
}
