// Mock-Seed – Bereich Zentrale (G-01, MASTER § 3.5). Schreibt: Team B-ZEN.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.

import { isoDatum, isoDatumZeit } from "../../format.js";
import { DEMO_BENUTZER } from "../../auth/mockUsers.js";
import { tage } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Aufgabe": 18,
  "PH API Protokoll": 40,
  "PH Firma": 1,
  "PH Betriebsruhe": 3,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Aufgabe": (doc, { i, r }) => {
    doc.status = i < 3 ? "Offen" : r.pick(["Offen", "Offen", "In Arbeit", "Erledigt", "Erledigt", "Verworfen"]);
    doc.faellig = isoDatum(tage(i < 3 ? i : r.int(-5, 14)));
    doc.prioritaet = r.pick(["Normal", "Normal", "Hoch", "Niedrig"]);
    doc.zugewiesen_an = i < 6 ? "gf@demo.local" : r.pick(DEMO_BENUTZER).email;
    doc.titel = r.pick([
      "Rückruf Beratungsanfrage",
      "Angebot nachfassen",
      "Lieferwoche mit Hersteller klären",
      "Muster an Kunde senden",
      "Montagetermin bestätigen",
      "Rechnung prüfen und stellen",
      "Servicefall: Ersatzteil bestellen",
      "Newsletter-Entwurf freigeben",
    ]);
    doc.referenz_doctype = r.pick(["PH Anfrage", "PH Projekt", "PH Servicefall", ""]);
    doc.quelle = "manuell";
    if (doc.status === "Erledigt") doc.erledigt_am = isoDatumZeit(tage(-r.int(0, 5), r));
  },
  "PH API Protokoll": (doc, { i, r }) => {
    doc.methode = r.pick(["ph_crm.api.create_anfrage", "ph_crm.api.book_termin", "ph_shop.api.create_order", "ph_shop.api.stripe_webhook", "ph_marketing.api.subscribe", "ph_personal.api.apply", "ph_service.api.create_servicefall"]);
    doc.benutzer = "website@platzhirsch.studio";
    doc.status = r.pick(["OK", "OK", "OK", "OK", "OK", "Fehler", "Abgelehnt", "Wiederholt", "Rate-Limit"]);
    doc.http_status = { OK: 200, Fehler: 500, Abgelehnt: 403, Wiederholt: 200, "Rate-Limit": 429 }[doc.status];
    doc.zeitpunkt = isoDatumZeit(tage(-Math.floor(i / 6), r));
    doc.dauer_ms = r.int(40, 900);
    doc.ip_hash = `${r.int(10000000, 99999999).toString(16)}…`;
    doc.fehler = doc.status === "Fehler" ? "ValidationError: Pflichtfeld fehlt (Beispiel)" : "";
    doc.referenz_doctype = doc.methode.includes("anfrage") ? "PH Anfrage" : doc.methode.includes("order") ? "PH Bestellung" : "";
    doc.anfrage_json = "";
    doc.antwort_json = "";
  },
  "PH Firma": (doc) => {
    doc.firmenname = "Platzhirsch Home Living GmbH (Beispiel)";
    doc.name = doc.firmenname;
    doc.marke = "Platzhirsch";
    doc.standard = 1;
    for (const [k, v] of Object.entries({ strasse: "Musterstraße 1", plz: "6911", ort: "Lochau", land: "AT", email: "info@beispiel.invalid", telefon: "+43 5574 00000", uid: "ATU00000000 (Beispiel)" })) {
      if (k in doc) doc[k] = v;
    }
  },
  "PH Betriebsruhe": (doc, { i }) => {
    const b = [
      ["Weihnachten 2026", "2026-12-24", "2027-01-06"],
      ["Betriebsausflug", "2026-11-20", "2026-11-20"],
      ["Inventur", "2027-01-07", "2027-01-08"],
    ][i] || [`Betriebsruhe ${i}`, "2027-03-01", "2027-03-01"];
    for (const [k, v] of Object.entries({ titel: b[0], bezeichnung: b[0], grund: b[0], von: b[1], bis: b[2], start: b[1], ende: b[2] })) if (k in doc) doc[k] = v;
  },
};

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const aufgaben = db.get("PH Aufgabe");
  if (!aufgaben) return;
  const r = hilfe.rng;
  const namenVon = (dt) => [...(db.get(dt)?.keys() || [])];
  const liste = [...aufgaben.values()];
  // Bezüge: jede Aufgabe mit referenz_doctype zeigt auf einen vorhandenen Datensatz (Bezug-Chip, Akte-Slot).
  for (const a of liste) {
    if (!a.referenz_doctype) continue;
    const kandidaten = namenVon(a.referenz_doctype);
    if (kandidaten.length) a.referenz_name = r.pick(kandidaten);
    else a.referenz_doctype = "";
  }
  // Jeder Status- und Leerfall der Zentrale (B-ZEN): überfällig, heute, automatisch angelegt, ohne Zuständigkeit,
  // Admin mit eigener Aufgabe, eine Projekt-Aufgabe für den Akte-Slot.
  const setze = (i, werte) => liste[i] && Object.assign(liste[i], werte);
  const projekte = namenVon("PH Projekt");
  setze(3, { status: "Offen", faellig: isoDatum(tage(-3)), zugewiesen_an: "gf@demo.local", titel: "Angebot nachfassen", prioritaet: "Hoch" });
  setze(4, { status: "In Arbeit", faellig: isoDatum(tage(0)), zugewiesen_an: "admin@demo.local", titel: "Kassa-iPad einrichten", referenz_doctype: "", referenz_name: "" });
  setze(5, { status: "Offen", faellig: isoDatum(tage(-1)), zugewiesen_an: "admin@demo.local", quelle: "scheduler", titel: "Kalkulation rot: Budget überschritten", referenz_doctype: projekte.length ? "PH Projekt" : "", referenz_name: projekte[0] || "" });
  setze(6, { status: "Offen", faellig: isoDatum(tage(2)), zugewiesen_an: "", titel: "Rückruf Ausstellungsstück klären" });
  setze(7, { status: "Offen", faellig: isoDatum(tage(1)), zugewiesen_an: "crm@demo.local", titel: "Muster an Kunde senden" });
  for (const a of liste) if (a.status === "Erledigt" && !a.erledigt_von) a.erledigt_von = a.zugewiesen_an || "gf@demo.local";
}
