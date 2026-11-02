// tools/raumzwilling/lib.mjs – Helfer des Job-Runners (N2 „Ihr Raum als Zwilling“).
// Programme (ffmpeg, COLMAP, Brush, splat-transform) und run() kommen aus der
// N1-Kette tools/splat/lib.mjs – eine Quelle für Pfade und Aufrufe.
// Kein Python, keine fremde Cloud: alles läuft lokal auf der RTX 4060.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { BIN, GPU_TOOLS, REPO, ensureDir, parseArgs, run } from "../splat/lib.mjs";

export { BIN, GPU_TOOLS, REPO, ensureDir, parseArgs, run };

// Windows ohne VC++-Redistributable (gpu-pipeline.md, Schritt 4): COLMAP und
// Brush finden die Laufzeit-DLLs im Python-venv der GPU-Werkzeuge. Nur der PATH
// des Kindprozesses wird ergänzt, nichts wird kopiert.
export const PROG_ENV = {
  PATH: [path.join(GPU_TOOLS, ".venv"), path.join(GPU_TOOLS, ".venv", "Scripts"), path.dirname(BIN.colmap), process.env.PATH].join(path.delimiter),
  QT_PLUGIN_PATH: path.join(path.dirname(path.dirname(BIN.colmap)), "plugins"),
};

/** Ablage der Räume (wie src/lib/raumzwilling/store.js, ohne server-only). */
export const RAUM_ROOT = process.env.RAUMZWILLING_DIR ? path.resolve(process.env.RAUMZWILLING_DIR) : path.join(REPO, ".data", "raumzwilling");
/** Arbeitsordner der Rohdaten (Frames, COLMAP, Training) – nie im Repo. */
export const ARBEIT_ROOT = path.join(GPU_TOOLS, "raumzwilling");
export const PROJEKT_ID = /^[A-Z]{2,5}-[0-9]{4}-[0-9]{2,6}$/;

export function raumDir(projekt) {
  if (!PROJEKT_ID.test(projekt)) throw new Error(`ungültige Projekt-ID: ${projekt}`);
  return path.join(RAUM_ROOT, projekt);
}

export function leseRaum(projekt) {
  try {
    return JSON.parse(fs.readFileSync(path.join(raumDir(projekt), "raum.json"), "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

/** Liest frisch, wendet fn an, schreibt atomar (kurzes Fenster, wie der Server). */
export function aendereRaum(projekt, fn) {
  const file = path.join(raumDir(projekt), "raum.json");
  const raum = leseRaum(projekt);
  if (!raum) throw new Error(`Raum ${projekt} fehlt`);
  fn(raum);
  raum.aktualisiert = new Date().toISOString();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(raum, null, 2));
  fs.renameSync(tmp, file);
  return raum;
}

export function melde(projekt, art, text) {
  const file = path.join(RAUM_ROOT, "postausgang.json");
  let liste = [];
  try {
    liste = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  liste.push({ projektId: projekt, art, text: String(text).slice(0, 500), am: new Date().toISOString(), versendet: false });
  ensureDir(RAUM_ROOT);
  fs.writeFileSync(file, JSON.stringify(liste.slice(-300), null, 2));
}

/** Dauer in Sekunden (ffprobe). */
export async function videoDauer(video) {
  const { execFile } = await import("node:child_process");
  return new Promise((resolve) =>
    execFile(BIN.ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", video], (err, out) => resolve(err ? null : Number(String(out).trim()) || null))
  );
}

/** Grauwert-Laplace-Varianz (Schärfe) und Mittelwert (Helligkeit) eines Bildes. */
export async function messeBild(file) {
  const { data, info } = await sharp(file).greyscale().resize({ width: 480, height: 480, fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let summe = 0;
  for (let i = 0; i < data.length; i++) summe += data[i];
  let s = 0;
  let sq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = data[i - 1] + data[i + 1] + data[i - w] + data[i + w] - 4 * data[i];
      s += l;
      sq += l * l;
      n++;
    }
  }
  const mini = await sharp(file).greyscale().resize(64, 36, { fit: "fill" }).raw().toBuffer();
  return { helligkeit: summe / data.length, schaerfe: sq / n - (s / n) ** 2, mini };
}

/** Misst alle Frames eines Ordners; bewegung = mittlere |Δ| zum Vorgänger (64×36). */
export async function messeFrames(dir) {
  const dateien = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();
  const frames = [];
  let vorher = null;
  for (const f of dateien) {
    const m = await messeBild(path.join(dir, f));
    let bewegung;
    if (vorher) {
      let d = 0;
      for (let i = 0; i < m.mini.length; i++) d += Math.abs(m.mini[i] - vorher[i]);
      bewegung = d / m.mini.length;
    }
    vorher = m.mini;
    frames.push({ datei: f, helligkeit: m.helligkeit, schaerfe: m.schaerfe, bewegung });
  }
  return frames;
}

export const minuten = (ms) => Math.round((ms / 60000) * 10) / 10;

export function ordnerGroesse(dir) {
  return fs.readdirSync(dir).reduce((s, f) => s + fs.statSync(path.join(dir, f)).size, 0);
}
