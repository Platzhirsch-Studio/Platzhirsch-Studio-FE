// tools/raumzwilling/run.mjs – interner Job-Runner „Ihr Raum als Zwilling“ (N2).
//
//   node tools/raumzwilling/run.mjs <PROJEKT> [--video <datei>] [--nur-pruefen]
//        [--schritte 15000] [--max 1500000] [--fps 3] [--behalte-video]
//   node tools/raumzwilling/run.mjs --frist        Räume nach Ablauf der Löschfrist löschen
//
// Läuft lokal auf der RTX 4060 (nie in einer fremden Cloud) mit der N1-Kette
// (tools/splat: ffmpeg/NVDEC → COLMAP CUDA → Brush → splat-transform):
//   1. Frames ziehen (ffmpeg, Metadaten verworfen: -map_metadata -1)
//   2. Qualität prüfen (Helligkeit, Schärfe, Bewegung) → sonst Wiederholungsbitte
//      mit Grund im Portal (Fallback 1) und das Video wird gelöscht
//   3. drei Standbilder (Fallback ohne WebGL2 / „nur Fotos“)
//   4. Kameraposen (COLMAP), Training (Brush), Packen als SOG (meta.json + WebP)
//      ≤ 30 MB, notfalls ausgedünnt
//   5. Splat unbrauchbar (zu wenig Bilder registriert) → Status „nur Fotos“ (Fallback 2)
//   6. Originalvideo löschen (Datenminimierung), Team im Postausgang informieren:
//      Maßstab, Boden, Wand und Stücke setzt das Team im Werkzeug, dann Freigabe.
// Rohdaten: $GPU_TOOLS/raumzwilling/<projekt>/<zeitstempel>/ (nie im Repo, nach
// Erfolg gelöscht, mit --behalte-rohdaten nicht).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ARBEIT_ROOT, BIN, PROG_ENV, RAUM_ROOT, aendereRaum, ensureDir, leseRaum, melde, messeFrames, minuten, ordnerGroesse, parseArgs, raumDir, run, videoDauer } from "./lib.mjs";
import { QUALITAET, RAUM_CONFIG } from "../../src/lib/raumzwilling/config.js";
import { bewerteVideo, waehleStandbilder } from "../../src/lib/raumzwilling/qualitaet.js";
import { fristAbgelaufen } from "../../src/lib/raumzwilling/modell.js";

const args = parseArgs();
const t0 = Date.now();
const schritte = [];
const schritt = (name, extra = {}) => {
  const e = { name, minute: minuten(Date.now() - t0), ...extra };
  schritte.push(e);
  console.log(`[${e.minute} min] ${name}${Object.keys(extra).length ? " " + JSON.stringify(extra) : ""}`);
};

if (args.frist) {
  const ids = fs.existsSync(RAUM_ROOT) ? fs.readdirSync(RAUM_ROOT).filter((d) => /^[A-Z]{2,5}-\d{4}-\d{2,6}$/.test(d)) : [];
  let n = 0;
  for (const id of ids) {
    const r = leseRaum(id);
    if (r && fristAbgelaufen(r)) {
      fs.rmSync(raumDir(id), { recursive: true, force: true });
      melde(id, "frist", `Raum ${id} nach Ablauf der Löschfrist gelöscht.`);
      n++;
    }
  }
  console.log(`Löschfrist: ${n} von ${ids.length} Räumen gelöscht.`);
  process.exit(0);
}

const projekt = args._[0];
if (!projekt) {
  console.error("usage: node tools/raumzwilling/run.mjs <PROJEKT> [--video <datei>] [--nur-pruefen] [--schritte 15000] | --frist");
  process.exit(1);
}
const raum = leseRaum(projekt);
if (!raum) {
  console.error(`Kein Raum ${projekt} in ${RAUM_ROOT}. Erst ein Raumvideo im Portal senden (oder Raum anlegen).`);
  process.exit(1);
}
const dir = raumDir(projekt);
const video = args.video ? path.resolve(args.video) : raum.video?.datei ? path.join(dir, "video", raum.video.datei) : null;
if (!video || !fs.existsSync(video)) {
  console.error("Kein Video gefunden (--video <datei> oder Raumvideo im Portal).");
  process.exit(1);
}

const stempel = new Date().toISOString().replace(/[:.]/g, "-");
const arbeit = ensureDir(path.join(ARBEIT_ROOT, projekt, stempel));
const kandidaten = ensureDir(path.join(arbeit, "kandidaten"));
const images = ensureDir(path.join(arbeit, "images"));
const fps = Number(args.fps || 3);

aendereRaum(projekt, (r) => {
  r.status = "in-arbeit";
  r.job = { status: "laeuft", gestartet: new Date().toISOString(), schritte: [] };
});

function abschluss(patch, meldung) {
  const r = aendereRaum(projekt, (x) => {
    Object.assign(x, patch);
    x.job = { ...(x.job || {}), ...(patch.job || {}), beendet: new Date().toISOString(), minuten: minuten(Date.now() - t0), schritte };
  });
  if (meldung) melde(projekt, "job", meldung);
  const loeschen = RAUM_CONFIG.deleteVideoAfterJob && !args["behalte-video"] && !args.video;
  if (loeschen && fs.existsSync(video)) {
    fs.rmSync(video, { force: true });
    aendereRaum(projekt, (x) => {
      if (x.video) x.video.geloescht = true;
    });
  }
  if (!args["behalte-rohdaten"]) fs.rmSync(arbeit, { recursive: true, force: true });
  return r;
}

try {
  // 1. Frames
  const dauer = await videoDauer(video);
  schritt("video", { sekunden: dauer && Math.round(dauer) });
  const scale = "scale='if(gt(iw,ih),1600,-2)':'if(gt(iw,ih),-2,1600)'";
  const ffArgs = ["-hide_banner", "-loglevel", "error", "-i", video, "-map_metadata", "-1", "-vf", `fps=${fps},${scale}`, "-q:v", "2", path.join(kandidaten, "f_%05d.jpg")];
  try {
    await run(BIN.ffmpeg, ["-hwaccel", "cuda", ...ffArgs], { quiet: true });
  } catch {
    await run(BIN.ffmpeg, ffArgs, { quiet: true }); // ohne NVDEC
  }
  const frames = await messeFrames(kandidaten);
  schritt("frames", { anzahl: frames.length });

  // 2. Qualität (Bewegung je Frame auf 2 fps normiert)
  const norm = frames.map((f) => ({ ...f, bewegung: f.bewegung === undefined ? undefined : (f.bewegung * fps) / QUALITAET.framesProSekunde }));
  const urteil = bewerteVideo({ dauer: dauer || frames.length / fps, frames: norm });
  schritt("qualitaet", urteil.werte);
  if (!urteil.ok) {
    abschluss({ status: "bitte-wiederholen", qualitaet: { ok: false, gruende: urteil.gruende, werte: urteil.werte }, job: { status: "abgelehnt" } }, `Raumvideo ${projekt}: Wiederholungsbitte (${urteil.gruende.map((g) => g.code).join(", ")}).`);
    console.log("Wiederholungsbitte:", urteil.gruende.map((g) => g.text).join(" | "));
    process.exit(0);
  }

  // 3. Standbilder
  const sbDir = ensureDir(path.join(dir, "standbild"));
  const auswahl = waehleStandbilder(frames, 3);
  const standbilder = [];
  for (const [k, i] of auswahl.entries()) {
    const ziel = path.join(sbDir, `${k + 1}.webp`);
    const info = await sharp(path.join(kandidaten, frames[i].datei)).resize({ width: 1280, height: 1280, fit: "inside" }).webp({ quality: 80 }).toFile(ziel);
    standbilder.push({ id: String(k + 1), breite: info.width, hoehe: info.height, alt: `Standbild ${k + 1} aus Ihrem Raumvideo`, bytes: info.size });
  }
  schritt("standbilder", { anzahl: standbilder.length });
  if (args["nur-pruefen"]) {
    abschluss({ status: "nur-fotos", qualitaet: { ok: true, gruende: [], werte: urteil.werte }, standbilder, job: { status: "nur-pruefen" } }, `Raum ${projekt}: geprüft, Standbilder bereit (ohne Splat).`);
    process.exit(0);
  }

  // Scharfe Bilder für COLMAP: aus je 2 Nachbarn das schärfere, dann die besten 80 %.
  const fenster = [];
  for (let i = 0; i < frames.length; i += 2) fenster.push(frames.slice(i, i + 2).sort((a, b) => b.schaerfe - a.schaerfe)[0]);
  const grenze = [...fenster].sort((a, b) => b.schaerfe - a.schaerfe)[Math.max(0, Math.floor(fenster.length * 0.8) - 1)]?.schaerfe ?? 0;
  const gut = fenster.filter((f) => f.schaerfe >= grenze && f.helligkeit >= QUALITAET.minHelligkeit);
  for (const f of gut) fs.copyFileSync(path.join(kandidaten, f.datei), path.join(images, f.datei));
  schritt("bilder-fuer-posen", { anzahl: gut.length });

  // 4a. COLMAP (wie tools/splat/poses.mjs)
  const colmap = ensureDir(path.join(arbeit, "colmap"));
  const db = path.join(colmap, "database.db");
  const sparse = ensureDir(path.join(colmap, "sparse"));
  const dataset = path.join(arbeit, "dataset");
  let registriert = 0;
  try {
    await run(BIN.colmap, ["feature_extractor", "--database_path", db, "--image_path", images, "--ImageReader.single_camera", "1", "--ImageReader.camera_model", "OPENCV", "--FeatureExtraction.use_gpu", "1"], { quiet: true, env: PROG_ENV });
    await run(BIN.colmap, [gut.length < 300 ? "exhaustive_matcher" : "sequential_matcher", "--database_path", db, "--FeatureMatching.use_gpu", "1"], { quiet: true, env: PROG_ENV });
    await run(BIN.colmap, ["mapper", "--database_path", db, "--image_path", images, "--output_path", sparse], { quiet: true, env: PROG_ENV });
    // größtes Teilmodell nehmen
    const modelle = fs.readdirSync(sparse).filter((d) => fs.existsSync(path.join(sparse, d, "images.bin")));
    const groesstes = modelle.sort((a, b) => fs.statSync(path.join(sparse, b, "images.bin")).size - fs.statSync(path.join(sparse, a, "images.bin")).size)[0];
    if (!groesstes) throw new Error("kein Modell");
    await run(BIN.colmap, ["image_undistorter", "--image_path", images, "--input_path", path.join(sparse, groesstes), "--output_path", dataset, "--output_type", "COLMAP"], { quiet: true, env: PROG_ENV });
    const ds = path.join(dataset, "sparse");
    if (fs.existsSync(ds) && !fs.existsSync(path.join(ds, "0"))) {
      const tmp = path.join(dataset, "sparse0");
      fs.renameSync(ds, tmp);
      ensureDir(ds);
      fs.renameSync(tmp, path.join(ds, "0"));
    }
    registriert = fs.readdirSync(path.join(dataset, "images")).length;
  } catch (e) {
    schritt("posen-fehler", { fehler: e.message });
  }
  schritt("posen", { registriert, von: gut.length });
  if (registriert < Math.max(20, gut.length * 0.6)) {
    abschluss(
      { status: "nur-fotos", qualitaet: { ok: true, gruende: [], werte: urteil.werte }, standbilder, job: { status: "splat-unbrauchbar" } },
      `Raum ${projekt}: Splat unbrauchbar (${registriert}/${gut.length} Bilder registriert). Kunde sieht Standbilder; Team: Grundriss aus Aufmaß/Fotos.`
    );
    process.exit(0);
  }

  // 4b. Brush (wie tools/splat/train.mjs)
  const train = ensureDir(path.join(arbeit, "train"));
  const steps = String(args.schritte || 15000);
  await run(BIN.brush, [dataset, "--total-steps", steps, "--max-splats", String(args.max || 1_500_000), "--max-resolution", "1280", "--sh-degree", "1", "--export-every", steps, "--export-path", train, "--export-name", "raum_{iter}.ply"], { quiet: !args.laut, env: PROG_ENV });
  const ply = path.join(train, `raum_${steps}.ply`);
  if (!fs.existsSync(ply)) throw new Error("Brush hat kein PLY geschrieben");
  schritt("training", { schritte: Number(steps) });

  // 4c. splat-transform → SOG (meta.json + WebP), ≤ 30 MB
  const splatDir = path.join(dir, "splat");
  const neu = path.join(dir, "splat-neu");
  fs.rmSync(neu, { recursive: true, force: true });
  ensureDir(neu);
  const st = (eingabe, aktionen, ausgabe) => run(process.execPath, [BIN.splatTransform, "-w", "--no-tty", "-q", eingabe, ...aktionen, ausgabe], { quiet: true });
  const sauber = path.join(arbeit, "sauber.ply");
  await st(ply, ["-N", "-F", "-H", "0", "-m"], sauber);
  await st(sauber, [], path.join(neu, "meta.json"));
  let bytes = ordnerGroesse(neu);
  for (const anteil of ["70%", "50%", "35%"]) {
    if (bytes <= RAUM_CONFIG.splatMaxBytes) break;
    const klein = path.join(arbeit, `klein-${anteil.replace("%", "")}.ply`);
    await st(sauber, ["--decimate-adaptive", anteil], klein);
    fs.rmSync(neu, { recursive: true, force: true });
    ensureDir(neu);
    await st(klein, ["-m"], path.join(neu, "meta.json"));
    bytes = ordnerGroesse(neu);
  }
  const meta = JSON.parse(fs.readFileSync(path.join(neu, "meta.json"), "utf8"));
  fs.rmSync(splatDir, { recursive: true, force: true });
  fs.renameSync(neu, splatDir);
  schritt("sog", { count: meta.count, mb: Math.round((bytes / 1048576) * 10) / 10 });

  abschluss(
    {
      status: "in-arbeit",
      qualitaet: { ok: true, gruende: [], werte: urteil.werte },
      standbilder,
      splat: { format: "sog", version: meta.version, count: meta.count, bytes, dateien: fs.readdirSync(splatDir) },
      transform: null,
      massstab: null,
      grundriss: null,
      standpunkte: [],
      job: { status: "fertig" },
    },
    `Raum ${projekt} berechnet (${minuten(Date.now() - t0)} min, ${Math.round(bytes / 1048576)} MB). Bitte im Werkzeug Boden, Wand und Maßstab setzen und freigeben.`
  );
  console.log(`Fertig in ${minuten(Date.now() - t0)} min → ${splatDir}`);
} catch (e) {
  console.error("Job fehlgeschlagen:", e.message);
  aendereRaum(projekt, (r) => {
    r.job = { ...(r.job || {}), status: "fehler", fehler: e.message.slice(0, 300), beendet: new Date().toISOString(), schritte };
  });
  melde(projekt, "job", `Raum ${projekt}: Job fehlgeschlagen (${e.message.slice(0, 120)}). Rohdaten: ${arbeit}`);
  process.exit(1);
}
