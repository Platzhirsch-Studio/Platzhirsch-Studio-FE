// src/lib/raumzwilling/store.js — Dateiablage der Raum-Zwillinge.
// Alles liegt in RAUMZWILLING_DIR oder <repo>/.data/raumzwilling (gitignored,
// außerhalb von public/, nie direkt von Next.js ausgeliefert):
//   <projekt>/raum.json            Datensatz (Status, Maßstab, Volumen, Kommentare …)
//   <projekt>/splat/meta.json      SOG-Bündel (meta.json + *.webp)
//   <projekt>/standbild/<n>.webp   drei Standbilder (Fallback ohne WebGL2)
//   <projekt>/skizze/<id>.webp     Haralds echte Skizzen (Scan/Foto)
//   <projekt>/audio/<id>.<ext>     Sprachnachrichten an Raumpunkten
//   <projekt>/video/…              eingehendes Raumvideo (nach dem Job gelöscht)
// Ausgeliefert wird nur über /api/portal/raum/<projekt>/datei/… mit Portal-Session.
import "server-only";
import { mkdir, readFile, rename, rm, stat, unlink, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

export const ROOT = process.env.RAUMZWILLING_DIR ? path.resolve(/*turbopackIgnore: true*/ process.env.RAUMZWILLING_DIR) : path.join(/*turbopackIgnore: true*/ process.cwd(), ".data", "raumzwilling");

// Projekt-IDs wie im Portal (PRJ-2026-014) – nichts anderes wird zu einem Pfad.
export const PROJEKT_ID = /^[A-Z]{2,5}-[0-9]{4}-[0-9]{2,6}$/;

const queues = globalThis.__phRaumQueues || (globalThis.__phRaumQueues = new Map());
const RETRY = new Set(["EPERM", "EBUSY", "EACCES"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function projektDir(projektId) {
  if (!PROJEKT_ID.test(String(projektId))) throw new Error("ungültige Projekt-ID");
  return path.join(/*turbopackIgnore: true*/ ROOT, projektId);
}

// Erlaubte Dateien je Bereich. Alles andere ist 404.
const BEREICHE = {
  splat: /^(meta\.json|means_l\.webp|means_u\.webp|quats\.webp|scales\.webp|sh0\.webp)$/,
  standbild: /^[1-6]\.webp$/,
  skizze: /^s-[a-z0-9]{6,24}\.webp$/,
  grundriss: /^grundriss\.svg$/,
  audio: /^a-[a-z0-9]{6,24}\.(webm|ogg|m4a|mp3|wav)$/,
};

/**
 * Ausgelieferte URLs tragen KEINE Dateiendung (…/datei/splat/means_l): Die
 * Header-Regeln in next.config.js setzen für *.webp/*.webm „public, max-age=1 Jahr“
 * und würden private Raumdaten in geteilte Caches lassen. Die Endung wird hier
 * aus der Allowlist ergänzt. @returns {string|null} Dateiname mit Endung
 */
export function dateiMitEndung(projektId, bereich, basis) {
  if (!/^[a-z0-9_-]{1,40}$/i.test(String(basis))) return null;
  const endungen = { splat: ["json", "webp"], standbild: ["webp"], skizze: ["webp"], grundriss: ["svg"], audio: ["webm", "ogg", "m4a", "mp3", "wav"] }[bereich] || [];
  for (const ext of endungen) {
    const name = `${basis}.${ext}`;
    const p = dateiPfad(projektId, bereich, name);
    if (p && existsSync(/*turbopackIgnore: true*/ p)) return name;
  }
  return null;
}

/** URL-Teil ohne Endung (Gegenstück zu dateiMitEndung). */
export const ohneEndung = (name) => String(name).replace(/\.[a-z0-9]{2,4}$/i, "");

/** Pfad einer ausgelieferten Datei oder null (strikte Allowlist, kein „..“). */
export function dateiPfad(projektId, bereich, name) {
  const re = BEREICHE[bereich];
  if (!re || !re.test(String(name))) return null;
  return path.join(/*turbopackIgnore: true*/ projektDir(projektId), bereich, name);
}

async function lies(file) {
  for (let i = 0; ; i++) {
    try {
      return await readFile(file, "utf8");
    } catch (err) {
      if (!RETRY.has(err.code) || i > 4) throw err;
      await sleep(30 * (i + 1));
    }
  }
}

export async function leseRaum(projektId) {
  try {
    return JSON.parse(await lies(path.join(/*turbopackIgnore: true*/ projektDir(projektId), "raum.json")));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function schreibeAtomar(file, text) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(tmp, text, "utf8");
  for (let i = 0; ; i++) {
    try {
      await rename(tmp, file);
      return;
    } catch (err) {
      if (!RETRY.has(err.code)) {
        await unlink(tmp).catch(() => {});
        throw err;
      }
      if (i > 5) {
        await writeFile(file, text, "utf8");
        await unlink(tmp).catch(() => {});
        return;
      }
      await sleep(25 * (i + 1));
    }
  }
}

/**
 * Lesen-Ändern-Schreiben unter einer Sperre je Projekt. `fn(raum)` gibt
 * { raum, ergebnis } zurück; raum=null löscht nichts, sondern lässt die
 * Datei unverändert.
 */
export function aendereRaum(projektId, fn) {
  const key = `raum:${projektId}`;
  const prev = queues.get(key) || Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(async () => {
      const aktuell = await leseRaum(projektId);
      const { raum, ergebnis } = await fn(aktuell);
      if (raum) {
        raum.aktualisiert = new Date().toISOString();
        await schreibeAtomar(path.join(/*turbopackIgnore: true*/ projektDir(projektId), "raum.json"), JSON.stringify(raum, null, 2));
      }
      return ergebnis;
    });
  queues.set(key, next);
  return next;
}

export async function schreibeDatei(projektId, bereich, name, daten) {
  const file = dateiPfad(projektId, bereich, name);
  if (!file) throw new Error("Dateiname nicht erlaubt");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, daten);
  return file;
}

export async function dateiGroesse(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return null;
  }
}

/** Löscht den ganzen Raum (Löschknopf im Portal, Löschfrist). */
export async function loescheRaum(projektId) {
  const dir = projektDir(projektId);
  await aendereRaum(projektId, async () => {
    await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    return { raum: null, ergebnis: null };
  });
}

/** Alle Projekt-IDs mit Raum (für die Löschfrist-Prüfung im Job-Runner). */
export async function alleRaeume() {
  try {
    return (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory() && PROJEKT_ID.test(d.name)).map((d) => d.name);
  } catch {
    return [];
  }
}

export const videoDir = (projektId) => path.join(/*turbopackIgnore: true*/ projektDir(projektId), "video");
