// Akte-Slots – Bereich Ablage (G-14, Slot-API v1). Schreibt: Team B-ABL.
// Auftragsmappe › Dateien und Kundenakte › Mehr: Ordner des Bezugs (Stammordner mit Vorlage 01–08 bzw. Kontakt-
// Vorlage) und die letzten Dateien mit Vorschaubild. Die Registerzeile in akte/slots/index.js trägt L0/P0-5 ein
// (`import ablage from "./ablage.js"`). Servicefall, Lieferant und Mitarbeiter folgen, sobald deren Akten
// Slot-Reiter haben (gleiche Komponente, nur `akte`/`tab` ergänzen).
// Der Stammordner wird über ordner_baum(bezug) bei Bedarf angelegt (Backend, idempotent) – nie eine
// ungefilterte Liste (Q-A11).

import AblageSlot from "../../../../components/Backoffice/Ablage/AblageSlot.js";
import { darf } from "../../auth/rechte.js";
import { ablage } from "../../ablage/methoden.js";
import { groesseText, sperreAktiv, tagsNormalisieren } from "../../ablage/regeln.js";

const FELDER = ["name", "dateiname", "ordner", "status", "endung", "groesse", "aktuelle_version", "vorschau_art", "vorschau_status", "modified", "gesperrt_von", "gesperrt_bis", "tags"];

async function lade(session, doctype, name, client) {
  const r = await ablage(client, "ordner_baum", { bezug_doctype: doctype, bezug_name: name, tiefe: 1 });
  const wurzel = r?.wurzeln?.[0] || null;
  if (!wurzel) return { wurzel: null, zuletzt: [], darfHochladen: false };
  const rows = await client.getList("PH Datei", { fields: FELDER, filters: [["status", "=", "Aktiv"], ["bezug_doctype", "=", doctype], ["bezug_name", "=", name]], orderBy: "modified desc", limit: 8 });
  // Rechte filtert Frappe (permission_query_conditions); der Mock kennt in Projekt/Kontakt keine Leitungsordner.
  const zuletzt = rows.map((d) => ({
    datei: d.name, dateiname: d.dateiname, ordner: d.ordner, endung: d.endung, groesse_text: groesseText(d.groesse), version: Number(d.aktuelle_version) || 1,
    vorschau_art: d.vorschau_art, vorschau_status: d.vorschau_status, geaendert: d.modified, gesperrt: sperreAktiv(d), tags: tagsNormalisieren(d.tags),
  }));
  return { wurzel, zuletzt, darfHochladen: darf(session, "ablage", "create") };
}

const slots = [
  {
    id: "ablage.projekt",
    bereich: "ablage",
    akte: "projekt",
    tab: "dateien",
    reihenfolge: 10,
    titel: "Ablage",
    breite: "voll",
    zeitlimitMs: 4000,
    recht: (session) => darf(session, "ablage", "read"),
    lade: (session, projekt, { client }) => lade(session, "PH Projekt", projekt, client),
    leer: (d) => !d?.wurzel,
    leerText: "Für dieses Projekt gibt es noch keine Ablage.",
    Komponente: AblageSlot,
  },
  {
    id: "ablage.kunde",
    bereich: "ablage",
    akte: "kunde",
    tab: "mehr",
    reihenfolge: 30,
    titel: "Ablage",
    breite: "voll",
    zeitlimitMs: 4000,
    recht: (session) => darf(session, "ablage", "read"),
    lade: (session, kontakt, { client }) => lade(session, "PH Kontakt", kontakt, client),
    leer: (d) => !d?.wurzel,
    leerText: "Für diesen Kontakt gibt es noch keine Ablage.",
    Komponente: AblageSlot,
  },
];

export default slots;
