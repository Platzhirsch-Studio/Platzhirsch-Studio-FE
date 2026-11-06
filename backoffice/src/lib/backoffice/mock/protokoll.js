// Änderungsprotokoll der Mock-Datenbank – Gegenstück zu tabVersion/tabComment, aus dem
// mock/core.js recentActivity speist (gleiches Antwortformat wie ph_core.api.aktivitaet).
// Fortgeschrieben von MockClient.version() (insert/save/setValue/submit/cancel/workflowAction)
// und MockClient.kommentar() (Kommentar/Workflow/Anhang). Beim Aufbau der Datenbank wird es
// einmal aus den Seed-Dokumenten (modified/modified_by) vorbelegt, damit die Zentrale nicht leer ist.
// Eintrag: {zeit, benutzer, doctype, name, art, felder?: string[], text?: string} – nie Feldwerte.
// Reines Modul.

import { isoDatumZeit } from "../format.js";

export const PROTOKOLL_MAX = 1000;
const SEED_MAX = 400;

/** Comment-Typen wie ph_core.api.aktivitaet.COMMENT_ARTEN (Info u. a. erscheinen nicht). */
export const KOMMENTAR_ARTEN = { Comment: "Kommentar", Workflow: "Workflow", Assigned: "Zugewiesen", Attachment: "Anhang", Created: "Angelegt", Deleted: "Geloescht" };

/**
 * Vorbelegung aus den Seed-Tabellen: je Dokument ein Eintrag „Angelegt“/„Geaendert“ zum Seed-Zeitpunkt.
 * Seed-Zeiten in der Zukunft (Demo-Termine des Tages) werden auf den Aufbauzeitpunkt gekappt, damit
 * echte Änderungen danach immer oben stehen.
 */
export function seedProtokoll(tabellen, jetzt = new Date()) {
  const grenze = isoDatumZeit(jetzt);
  const out = [];
  for (const [doctype, tabelle] of tabellen || []) {
    if (!String(doctype).startsWith("PH ")) continue;
    for (const doc of tabelle.values()) {
      if (!doc?.modified || !doc.name) continue;
      const zeit = String(doc.modified) > grenze ? grenze : doc.modified;
      out.push({ zeit, benutzer: doc.modified_by || doc.owner || "Administrator", doctype, name: doc.name, art: doc.creation && doc.creation === doc.modified ? "Angelegt" : "Geaendert", felder: [] });
    }
  }
  out.sort((a, b) => String(b.zeit).localeCompare(String(a.zeit)));
  return out.slice(0, SEED_MAX);
}

/** Protokoll der Datenbank (legt es bei Bedarf aus dem Seed an). */
export function protokollVon(db) {
  if (!db.protokoll) db.protokoll = seedProtokoll(db.db);
  return db.protokoll;
}

export function protokolliere(db, eintrag) {
  const p = protokollVon(db);
  p.unshift(eintrag);
  if (p.length > PROTOKOLL_MAX) p.length = PROTOKOLL_MAX;
}
