// src/lib/portal/tagebuch/dateiAdapter.js — Dev-Adapter (Dateiablage, gitignored /.data/).
//   .data/tagebuch/<PRJ-…>/tagebuch.json            Fotos je Phase (Metadaten)
//   .data/tagebuch/<PRJ-…>/bilder/<f-…>-<w>.<fmt>   AVIF/WebP, privat
//   .data/projekte-freigaben/<fg-…>/freigabe.json   Einwilligung, Auswahl, Studio-Prüfung, Status
//   .data/projekte-freigaben/<fg-…>/bilder/…        Kopien der ausgewählten Bilder
// Nichts davon liegt in public/. Ausgeliefert wird nur über /api/portal/tagebuch/**.
// Frappe-Gegenstück: platzhirsch-frappe-service/tagebuch/README.md (Doctypes
// „Projekt Tagebuch Foto“ und „Projekt Referenz“).
import "server-only";
import { copyFile, mkdir, readFile, readdir, rename, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PROJEKT_ID } from "@/lib/raumzwilling/store";
import { FOTO_ID, FREIGABE_ID } from "./schemas.js";

const BASIS = process.env.TAGEBUCH_DIR ? path.resolve(/*turbopackIgnore: true*/ process.env.TAGEBUCH_DIR) : path.join(/*turbopackIgnore: true*/ process.cwd(), ".data");
const TAGEBUCH_ROOT = path.join(/*turbopackIgnore: true*/ BASIS, "tagebuch");
const FREIGABE_ROOT = path.join(/*turbopackIgnore: true*/ BASIS, "projekte-freigaben");

export const BILD_NAME = /^(f-[a-z0-9]{10})-(\d{3,4})\.(avif|webp)$/;

const queues = globalThis.__phTagebuchQueues || (globalThis.__phTagebuchQueues = new Map());
const RETRY = new Set(["EPERM", "EBUSY", "EACCES"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function tagebuchDir(projektId) {
  if (!PROJEKT_ID.test(String(projektId))) throw new Error("ungültige Projekt-ID");
  return path.join(/*turbopackIgnore: true*/ TAGEBUCH_ROOT, projektId);
}
function freigabeDir(id) {
  if (!FREIGABE_ID.test(String(id))) throw new Error("ungültige Freigabe-ID");
  return path.join(/*turbopackIgnore: true*/ FREIGABE_ROOT, id);
}

async function lies(file) {
  for (let i = 0; ; i++) {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (err) {
      if (err.code === "ENOENT") return null;
      if (!(RETRY.has(err.code) || err instanceof SyntaxError) || i > 4) throw err;
      await sleep(30 * (i + 1));
    }
  }
}

async function schreibeAtomar(file, obj) {
  await mkdir(path.dirname(file), { recursive: true });
  const text = JSON.stringify(obj, null, 2);
  const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`;
  await writeFile(tmp, text, "utf8");
  for (let i = 0; ; i++) {
    try {
      await rename(tmp, file);
      return;
    } catch (err) {
      if (!RETRY.has(err.code) || i > 5) {
        await writeFile(file, text, "utf8");
        await unlink(tmp).catch(() => {});
        return;
      }
      await sleep(25 * (i + 1));
    }
  }
}

function gesperrt(key, fn) {
  const prev = queues.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  queues.set(key, next);
  return next;
}

async function ordner(root, re) {
  try {
    return (await readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory() && re.test(d.name)).map((d) => d.name);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

export const dateiAdapter = {
  name: "datei",
  verbunden: true,

  leseTagebuch: (projektId) => lies(path.join(/*turbopackIgnore: true*/ tagebuchDir(projektId), "tagebuch.json")),

  /** fn(tagebuch|null) → { tagebuch, ergebnis }; tagebuch=null schreibt nichts. */
  aendereTagebuch(projektId, fn) {
    const file = path.join(/*turbopackIgnore: true*/ tagebuchDir(projektId), "tagebuch.json");
    return gesperrt(`tb:${projektId}`, async () => {
      const { tagebuch, ergebnis } = await fn(await lies(file));
      if (tagebuch) {
        tagebuch.aktualisiert = new Date().toISOString();
        await schreibeAtomar(file, tagebuch);
      }
      return ergebnis;
    });
  },

  listeTagebuecher: () => ordner(TAGEBUCH_ROOT, PROJEKT_ID),

  async schreibeBild(projektId, name, daten) {
    if (!BILD_NAME.test(name)) throw new Error("Dateiname nicht erlaubt");
    const file = path.join(/*turbopackIgnore: true*/ tagebuchDir(projektId), "bilder", name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, daten);
  },

  async leseBild(projektId, name) {
    if (!BILD_NAME.test(name)) return null;
    try {
      return await readFile(path.join(/*turbopackIgnore: true*/ tagebuchDir(projektId), "bilder", name));
    } catch {
      return null;
    }
  },

  async loescheBilder(projektId, fotoId) {
    if (!FOTO_ID.test(fotoId)) return;
    const dir = path.join(/*turbopackIgnore: true*/ tagebuchDir(projektId), "bilder");
    let namen = [];
    try {
      namen = await readdir(dir);
    } catch {
      return;
    }
    await Promise.all(namen.filter((n) => n.startsWith(`${fotoId}-`)).map((n) => rm(path.join(/*turbopackIgnore: true*/ dir, n), { force: true })));
  },

  /** Legt die Freigabe an und kopiert die Bilddateien der Auswahl. */
  async legeFreigabeAn(freigabe) {
    const dir = freigabeDir(freigabe.id);
    await mkdir(path.join(/*turbopackIgnore: true*/ dir, "bilder"), { recursive: true });
    for (const b of freigabe.bilder) {
      for (const v of b.varianten) {
        for (const fmt of ["avif", "webp"]) {
          const name = `${b.id}-${v.w}.${fmt}`;
          await copyFile(path.join(/*turbopackIgnore: true*/ tagebuchDir(freigabe.projektId), "bilder", name), path.join(/*turbopackIgnore: true*/ dir, "bilder", name));
        }
      }
    }
    await schreibeAtomar(path.join(/*turbopackIgnore: true*/ dir, "freigabe.json"), freigabe);
    return freigabe;
  },

  leseFreigabe: (id) => (FREIGABE_ID.test(String(id)) ? lies(path.join(/*turbopackIgnore: true*/ freigabeDir(id), "freigabe.json")) : Promise.resolve(null)),

  /** fn(freigabe|null) → { freigabe, ergebnis }. */
  aendereFreigabe(id, fn) {
    const file = path.join(/*turbopackIgnore: true*/ freigabeDir(id), "freigabe.json");
    return gesperrt(`fg:${id}`, async () => {
      const { freigabe, ergebnis } = await fn(await lies(file));
      if (freigabe) {
        freigabe.aktualisiert = new Date().toISOString();
        await schreibeAtomar(file, freigabe);
      }
      return ergebnis;
    });
  },

  async listeFreigaben({ projektId, status } = {}) {
    const ids = await ordner(FREIGABE_ROOT, FREIGABE_ID);
    const alle = (await Promise.all(ids.map((id) => lies(path.join(/*turbopackIgnore: true*/ FREIGABE_ROOT, id, "freigabe.json"))))).filter(Boolean);
    return alle
      .filter((f) => (!projektId || f.projektId === projektId) && (!status || [].concat(status).includes(f.status)))
      .sort((a, b) => String(b.erstellt).localeCompare(String(a.erstellt)));
  },

  async leseReferenzBild(id, name) {
    if (!FREIGABE_ID.test(String(id)) || !BILD_NAME.test(name)) return null;
    try {
      return await readFile(path.join(/*turbopackIgnore: true*/ freigabeDir(id), "bilder", name));
    } catch {
      return null;
    }
  },

  /** Widerruf: Bildkopien löschen (der Datensatz bleibt als Nachweis, Art. 7 Abs. 1 DSGVO). */
  loescheReferenzBilder: (id) => rm(path.join(/*turbopackIgnore: true*/ freigabeDir(id), "bilder"), { recursive: true, force: true }),
};
