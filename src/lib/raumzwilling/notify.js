// src/lib/raumzwilling/notify.js — Benachrichtigungen ans Team (server-only).
// Bewusst OHNE Mailversand: Jede Meldung (neues Raumvideo, Kommentar,
// Wiederholungsbitte) landet im Postausgang .data/raumzwilling/postausgang.json
// und wird im Team-Werkzeug angezeigt. Ein echter Versand (Backoffice/Frappe)
// wird erst nach Freigabe angeschlossen – Formulare und Mails gehen in dieser
// Ausbaustufe nie hinaus (Backoffice ist produktiv). Tests prüfen das.
import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./store.js";

const DATEI = path.join(/*turbopackIgnore: true*/ ROOT, "postausgang.json");
let kette = Promise.resolve();

export function melde(projektId, art, text) {
  const eintrag = { projektId, art, text: String(text).slice(0, 500), am: new Date().toISOString(), versendet: false };
  kette = kette
    .catch(() => {})
    .then(async () => {
      let liste = [];
      try {
        liste = JSON.parse(await readFile(DATEI, "utf8"));
      } catch {}
      liste.push(eintrag);
      await mkdir(ROOT, { recursive: true });
      await writeFile(DATEI, JSON.stringify(liste.slice(-300), null, 2));
    });
  return kette.then(() => eintrag);
}

export async function postausgang(projektId) {
  try {
    const liste = JSON.parse(await readFile(DATEI, "utf8"));
    return liste.filter((e) => !projektId || e.projektId === projektId).reverse().slice(0, 30);
  } catch {
    return [];
  }
}
