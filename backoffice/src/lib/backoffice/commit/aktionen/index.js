// Register der Commit-Aktionen (G-03). Setzt die Teildateien zusammen – nie von Bereichen geändert.
// Jeder Bereich trägt nur in aktionen/<slug>.js ein (Name beginnt mit "<slug>."); das Fundament in fundament.js.
// Statisch importiert, damit auch POST /api/undo-commit und der Nachlauf jede Aktion kennen,
// ohne dass vorher eine Bereichsseite geladen wurde.

import fundament from "./fundament.js";
import zentrale from "./zentrale.js";
import crm from "./crm.js";
import projekte from "./projekte.js";
import faktura from "./faktura.js";
import shop from "./shop.js";
import sortiment from "./sortiment.js";
import logistik from "./logistik.js";
import service from "./service.js";
import kundenkarte from "./kundenkarte.js";
import marketing from "./marketing.js";
import personal from "./personal.js";
import kassa from "./kassa.js";
import ablage from "./ablage.js";
import posteingang from "./posteingang.js";

/**
 * @typedef {object} CommitKontext
 * @property {object} session        Sitzung des planenden Benutzers (im Nachlauf aus dem Store wiederhergestellt)
 * @property {object} client         backoffice(session) – Mock oder Frappe
 * @property {any} args              JSON-Kopie der geplanten Argumente
 * @property {{doctype:string, name:string, titel?:string}|null} objekt
 * @property {"client"|"beacon"|"nachlauf"} quelle
 * @property {(pfad:string)=>void} revalidiere  revalidatePath, außerhalb einer Anfrage still ohne Wirkung
 */

export const TEILE = { fundament, zentrale, crm, projekte, faktura, shop, sortiment, logistik, service, kundenkarte, marketing, personal, kassa, ablage, posteingang };

/** Prüft das Register: Name passt zur Teildatei, Funktion, keine Doppelungen. @returns {string[]} Befunde */
export function pruefeAktionen(teile = TEILE) {
  const befunde = [];
  const gesehen = new Map();
  for (const [teil, eintraege] of Object.entries(teile)) {
    if (!eintraege || typeof eintraege !== "object") {
      befunde.push(`${teil}: kein Objekt exportiert`);
      continue;
    }
    for (const [name, fn] of Object.entries(eintraege)) {
      if (!name.startsWith(`${teil}.`)) befunde.push(`${teil}: „${name}“ muss mit „${teil}.“ beginnen`);
      if (typeof fn !== "function") befunde.push(`${teil}: „${name}“ ist keine Funktion`);
      if (gesehen.has(name)) befunde.push(`„${name}“ doppelt (${gesehen.get(name)} und ${teil})`);
      gesehen.set(name, teil);
    }
  }
  return befunde;
}

/** Alle Aktionen als Map name → Funktion. */
export const AKTIONEN = new Map(Object.values(TEILE).flatMap((t) => Object.entries(t || {})));

export function commitAktion(name) {
  return AKTIONEN.get(name);
}
