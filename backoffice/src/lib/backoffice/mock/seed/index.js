// Beispieldaten des Mock (G-01, MASTER § 3.5): setzt die Teildateien mock/seed/<bereich>.js zusammen.
// Keine echten Personen, keine echten Preise: Namen aus einer Musterliste („Max Muster“), Beträge als runde
// Beispielwerte. Zwei Quellen: (1) generische Erzeugung aus den DocType-Metas (basis.js), (2) Fachwissen je
// DocType (`kern` der Bereichsdateien), dazu (3) Nachläufe je Bereich nach dem Grundaufbau.
// Deterministisch (eigener Zufallsgenerator mit festem Startwert), damit Tests und Screenshots stabil sind.
// Bereiche schreiben NUR in ihre eigene Teildatei, nie hier.

import { isoDatumZeit } from "../../format.js";
import { LAYOUT_FELDTYPEN } from "../../frappe/feldtypen.js";
import { neuerName } from "../engine.js";
import { DEMO_BENUTZER } from "../../auth/mockUsers.js";
import { NACHNAMEN, VORNAMEN, erzeugeDokument, rng, tage } from "./basis.js";
import * as zentrale from "./zentrale.js";
import * as crm from "./crm.js";
import * as projekte from "./projekte.js";
import * as faktura from "./faktura.js";
import * as shop from "./shop.js";
import * as sortiment from "./sortiment.js";
import * as logistik from "./logistik.js";
import * as service from "./service.js";
import * as kundenkarte from "./kundenkarte.js";
import * as marketing from "./marketing.js";
import * as personal from "./personal.js";
import * as kassa from "./kassa.js";
import * as ablage from "./ablage.js";
import * as posteingang from "./posteingang.js";

export { rng, erzeugeDokument };

/**
 * @typedef {{rng: ReturnType<typeof rng>, tage: typeof tage, index: any, tabelle: (doctype:string) => Map<string, object>,
 *   naechste: (prefix:string) => number, erzeugeDokument: typeof erzeugeDokument, neuerName: typeof neuerName,
 *   kontakte: object[]}} SeedHilfe
 * @typedef {{nach?: string[], anzahl?: Record<string, number>, kern?: Record<string, Function>,
 *   default?: (db: Map<string, Map<string, object>>, hilfe: SeedHilfe) => void}} SeedBereich
 */

/** Teildateien je Bereich (Schlüssel = Bereichs-Slug). */
export const SEED_BEREICHE = { zentrale, crm, projekte, faktura, shop, sortiment, logistik, service, kundenkarte, marketing, personal, kassa, ablage, posteingang };

/**
 * Erzeugungsreihenfolge der DocTypes vor P0-1 (Stand 04.11.2026). Der Zufallsgenerator läuft über alle DocTypes
 * hinweg; wer diese Liste umsortiert, verschiebt sämtliche Beispieldaten (Tests und Screenshots). Neue DocTypes der
 * Bereiche (anzahl ohne Eintrag hier) kommen danach in Bereichsreihenfolge.
 */
const REIHENFOLGE_V1 = [
  "PH Anfrage", "PH Kontakt", "PH Termin", "PH Aufgabe", "PH Produkt", "PH Marke", "PH Kategorie", "PH Projekt",
  "PH Montageauftrag", "PH Bestellung", "PH Zahlung", "PH Rechnung", "PH Angebot", "PH Lieferschein", "PH Bewerbung",
  "PH Stelle", "PH Mitarbeiter", "PH Newsletter Ausgabe", "PH Event", "PH Kassenbeleg", "PH Kasse", "PH Servicefall",
  "PH Serviceauftrag", "PH Kundenkarte Antrag", "PH Kundenkarte", "PH API Protokoll", "PH Firma", "PH Betriebsruhe",
  "PH Terminart", "PH Lieferant", "PH Fehlercode", "PH Lagerort", "PH Fahrzeug", "PH Terminal", "PH Zahlungsbedingung",
  "PH Bankkonto", "PH Mail Vorlage",
];

/** Anzahl generischer Datensätze je DocType (aus allen Bereichen); nicht gelistete bekommen 6. */
export const ANZAHL = (() => {
  const alle = {};
  for (const teil of Object.values(SEED_BEREICHE)) Object.assign(alle, teil.anzahl || {});
  const geordnet = {};
  for (const dt of REIHENFOLGE_V1) if (dt in alle) geordnet[dt] = alle[dt];
  for (const [dt, n] of Object.entries(alle)) if (!(dt in geordnet)) geordnet[dt] = n;
  return geordnet;
})();

/** Fachwissen je DocType (aus allen Bereichen). */
const KERN = Object.assign({}, ...Object.values(SEED_BEREICHE).map((t) => t.kern || {}));

/** DocTypes, für die der Mock Daten anlegt (Hauptobjekte aller Bereiche + Stammdaten). */
export function seedDoctypes(index) {
  const out = new Set(Object.keys(ANZAHL));
  // Alle nicht-Kind-DocTypes mit Status bekommen wenigstens ein paar Datensätze.
  for (const [name, m] of index.doctypes) {
    if (m.istable || m.issingle) continue;
    if (name === "User" || name === "Has Role") continue;
    if (m.statusOptionen.length) out.add(name);
  }
  return [...out].filter((n) => index.doctypes.has(n));
}

/** Nachbearbeitung mit Fachwissen je DocType: Verteilung, Bezüge, Titel (Signatur wie vor P0-1). */
export function kerndaten(name, doc, i, r, ctx) {
  const person = `${doc.vorname || ctx.vorname} ${doc.nachname || ctx.nachname}`;
  const fn = KERN[name];
  if (fn) fn(doc, { i, r, ctx, person });
  return doc;
}

// ---------------------------------------------------------- Einstellungen --

export function einstellungenSingle(meta) {
  const doc = { doctype: meta.name, name: meta.name };
  for (const f of meta.fields) {
    if (LAYOUT_FELDTYPEN.has(f.fieldtype) || f.fieldtype === "Table") continue;
    doc[f.fieldname] = f.default ?? (f.fieldtype === "Check" ? 0 : f.fieldtype === "Int" ? 0 : "");
  }
  for (const [k, v] of Object.entries({ testmodus: 1, standardfirma: "Platzhirsch Home Living GmbH (Beispiel)", standard_sprache: "de", zeitzone: "Europe/Vienna" })) {
    if (k in doc) doc[k] = v;
  }
  return doc;
}

/** Demo-Benutzer als Frappe-"User"-Dokumente. */
export function benutzerDokumente() {
  return DEMO_BENUTZER.map((u) => ({
    doctype: "User",
    name: u.email,
    email: u.email,
    full_name: u.name,
    first_name: u.name.split(" ")[0],
    last_name: u.name.split(" ").slice(1).join(" "),
    enabled: 1,
    user_type: "System User",
    roles: u.roles.map((role, idx) => ({ doctype: "Has Role", role, idx: idx + 1, parentfield: "roles", parenttype: "User" })),
  }));
}

// ------------------------------------------------------------ Nachläufe --

/** Bereichs-Slugs in Nachlauf-Reihenfolge (topologisch über `nach`, sonst Registerreihenfolge). Wirft bei Zyklus. */
export function nachlaufReihenfolge(teile = SEED_BEREICHE) {
  const slugs = Object.keys(teile);
  const fertig = [];
  const status = new Map();
  const besuche = (s, pfad) => {
    if (status.get(s) === "fertig") return;
    if (status.get(s) === "offen") throw new Error(`Seed-Abhängigkeit im Kreis: ${[...pfad, s].join(" → ")}`);
    status.set(s, "offen");
    for (const v of teile[s]?.nach || []) {
      if (!teile[v]) throw new Error(`Seed ${s}: unbekannte Abhängigkeit „${v}“`);
      besuche(v, [...pfad, s]);
    }
    status.set(s, "fertig");
    fertig.push(s);
  };
  for (const s of slugs) besuche(s, []);
  return fertig;
}

/** Fester Startwert je Bereich (unabhängig von der Reihenfolge), damit ein Nachlauf andere Daten nicht verschiebt. */
function startwert(slug) {
  let h = 20261104;
  for (const ch of slug) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Baut die komplette Mock-Datenbank: Map<doctype, Map<name, doc>>.
 * @param {ReturnType<import("../../frappe/meta").ladeMetaIndex>} index
 */
export function baueDatenbank(index) {
  const r = rng();
  const db = new Map();
  const zaehler = new Map();
  const naechste = (prefix) => {
    const n = (zaehler.get(prefix) || 0) + 1;
    zaehler.set(prefix, n);
    return n;
  };
  const kinderMeta = (name) => index.doctypes.get(name) || null;
  const tabelle = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };

  // Kontakte zuerst, damit andere DocTypes darauf verweisen können.
  const reihenfolge = seedDoctypes(index).sort((a, b) => (a === "PH Kontakt" ? -1 : b === "PH Kontakt" ? 1 : 0));
  const kontakte = [];

  for (const name of reihenfolge) {
    const meta = index.doctypes.get(name);
    const anzahl = ANZAHL[name] ?? 6;
    const t = tabelle(name);
    for (let i = 0; i < anzahl; i++) {
      const vorname = r.pick(VORNAMEN);
      const nachname = r.pick(NACHNAMEN);
      const kontakt = kontakte.length ? r.pick(kontakte) : null;
      const ctx = { vorname: kontakt?.vorname || vorname, nachname: kontakt?.nachname || nachname, kontakt: kontakt?.name || "" };
      let doc = erzeugeDokument(meta, r, ctx, kinderMeta);
      doc = kerndaten(name, doc, i, r, ctx);
      const datum = new Date(doc.eingang || doc.datum || doc.zeitpunkt || doc.angelegt || tage(-i));
      const n = doc.name || neuerName(meta, doc, naechste, Number.isNaN(datum.getTime()) ? tage(-i) : datum);
      if (t.has(n)) continue;
      const geaendert = isoDatumZeit(tage(-r.int(0, Math.min(30, anzahl)), r));
      Object.assign(doc, {
        name: n,
        owner: r.pick(DEMO_BENUTZER).email,
        creation: doc.eingang || doc.creation || geaendert,
        modified: geaendert,
        modified_by: r.pick(DEMO_BENUTZER).email,
        docstatus: doc.docstatus ?? 0,
        idx: 0,
      });
      t.set(n, doc);
      if (name === "PH Kontakt") kontakte.push(doc);
    }
  }

  // Singles
  for (const [name, meta] of index.doctypes) {
    if (!meta.issingle) continue;
    const doc = einstellungenSingle(meta);
    Object.assign(doc, { owner: "Administrator", creation: isoDatumZeit(tage(-100)), modified: isoDatumZeit(tage(-1)), modified_by: "Administrator", docstatus: 0 });
    tabelle(name).set(name, doc);
  }

  // Benutzer
  const users = tabelle("User");
  for (const u of benutzerDokumente()) {
    Object.assign(u, { owner: "Administrator", creation: isoDatumZeit(tage(-200)), modified: isoDatumZeit(tage(-3)), modified_by: "Administrator", docstatus: 0 });
    users.set(u.name, u);
  }

  // Nachläufe je Bereich (eigener Zufall je Bereich)
  for (const slug of nachlaufReihenfolge()) {
    const lauf = SEED_BEREICHE[slug].default;
    if (typeof lauf !== "function") continue;
    lauf(db, { rng: rng(startwert(slug)), tage, index, tabelle, naechste, erzeugeDokument, neuerName, kontakte });
  }

  return { db, zaehler, erzeugt: Date.now() };
}

/**
 * Konsistenz der Seed-Teildateien (Unit-Test): DocType in zwei Bereichen, Anzahl keine ganze Zahl ≥ 0,
 * kern ohne Funktion, unbekannte oder zyklische `nach`-Abhängigkeiten.
 */
export function pruefeSeed(teile = SEED_BEREICHE) {
  const befunde = [];
  const besitzer = new Map();
  for (const [slug, t] of Object.entries(teile)) {
    for (const dt of new Set([...Object.keys(t.anzahl || {}), ...Object.keys(t.kern || {})])) {
      if (besitzer.has(dt) && besitzer.get(dt) !== slug) befunde.push(`Seed: ${dt} in ${besitzer.get(dt)} und ${slug}`);
      besitzer.set(dt, slug);
    }
    for (const [dt, n] of Object.entries(t.anzahl || {})) if (!Number.isInteger(n) || n < 0) befunde.push(`Seed ${slug}: Anzahl für ${dt} ungültig (${n})`);
    for (const [dt, fn] of Object.entries(t.kern || {})) if (typeof fn !== "function") befunde.push(`Seed ${slug}: kern für ${dt} ist keine Funktion`);
  }
  try {
    nachlaufReihenfolge(teile);
  } catch (err) {
    befunde.push(err.message);
  }
  return befunde;
}
