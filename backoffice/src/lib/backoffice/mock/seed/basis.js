// Mock-Seed – gemeinsame Grundlage aller Bereiche (Fundament, Team P0-1): Zufallsgenerator mit festem
// Startwert, Musterlisten (keine echten Personen), fester Datumsbezug 04.11.2026 und die generische
// Erzeugung aus den DocType-Metas (Feldtyp → plausibler Wert). Bereiche importieren von hier, schreiben
// aber nur in mock/seed/<bereich>.js.

import { isoDatum, isoDatumZeit } from "../../format.js";
import { LAYOUT_FELDTYPEN } from "../../frappe/feldtypen.js";
import { DEMO_BENUTZER } from "../../auth/mockUsers.js";

// ------------------------------------------------------------------ Zufall --

export function rng(seed = 20261104) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
  };
}

export const VORNAMEN = ["Max", "Erika", "Anna", "Lukas", "Maria", "Paul", "Lena", "Jonas", "Sophie", "Felix", "Laura", "David", "Julia", "Simon", "Clara", "Tobias"];
export const NACHNAMEN = ["Muster", "Musterfrau", "Beispiel", "Mustermann", "Probe", "Testner", "Demo", "Vorlage", "Platzhalter", "Schema"];
export const ORTE = ["6911 Lochau", "6900 Bregenz", "6850 Dornbirn", "6800 Feldkirch", "88131 Lindau", "9000 St. Gallen", "6971 Hard", "6890 Lustenau", "8280 Kreuzlingen", "6020 Innsbruck"];
export const FIRMEN = ["Beispiel GmbH", "Muster Architektur ZT", "Demo Hotel Betriebs GmbH", "Probe & Partner", "Vorlage Immobilien"];
export const MARKEN = ["Minotti", "ClassiCon", "Poliform", "Flexform", "Ezarri", "Vitra", "Cassina", "Walter Knoll"];
export const KATEGORIEN = ["Sofas", "Sessel", "Tische", "Leuchten", "Betten", "Regale", "Outdoor", "Mosaik"];
export const PRODUKTE = ["Sofa Modul 240", "Sessel Lounge", "Esstisch Eiche 220", "Pendelleuchte Glas", "Bett Polster 180", "Regal System 3", "Loungechair Outdoor", "Mosaik Mix 2,5"];
export const ANLIEGEN = [
  "Wir planen die Einrichtung unseres Wohnzimmers und wünschen eine Beratung im Showroom.",
  "Anfrage zu einem Sofa in Stoff, Maße ca. 280 cm, Lieferung nach Lindau.",
  "Bitte um Angebot für eine Küchenplanung (Neubau, Einzug Frühjahr).",
  "Interesse an Außenleuchten für eine Terrasse, gern Vor-Ort-Termin.",
  "Frage zur Pflege eines Ledersofas, Kauf vor zwei Jahren.",
  "Hotelprojekt: 24 Zimmer, Zeitplan und Budget zu besprechen.",
];

export function tage(offset, r) {
  const d = new Date(2026, 10, 4, 9, 0, 0); // fester Bezug: 04.11.2026
  d.setDate(d.getDate() + offset);
  if (r) d.setHours(r.int(8, 18), r.pick([0, 15, 30, 45]), 0, 0);
  return d;
}

// --------------------------------------------------- generische Erzeugung --

function wertFuerFeld(f, r, ctx) {
  const n = f.fieldname;
  if (f.fieldtype === "Table") return [];
  if (/^naming_series$/.test(n)) return f.default || f.auswahl?.[0] || "";
  if (n === "status") return r.pick((f.auswahl || []).filter(Boolean)) || f.default || "";
  if (/vorname/.test(n)) return ctx.vorname;
  if (/^nachname$|nachname$/.test(n)) return ctx.nachname;
  if (/kunde_name|kundenname|^name_kunde$/.test(n)) return `${ctx.vorname} ${ctx.nachname}`;
  if (/firma|firmenname/.test(n) && f.fieldtype === "Data") return r.chance(0.3) ? r.pick(FIRMEN) : "";
  if (/e-?mail/.test(n) || f.options === "Email") return `${ctx.vorname}.${ctx.nachname}@beispiel.invalid`.toLowerCase();
  if (/telefon|phone/.test(n) || f.options === "Phone") return `+43 5574 ${r.int(10000, 99999)}`;
  if (/plz_ort|^ort$/.test(n)) return r.pick(ORTE);
  if (/^land$/.test(n)) return r.pick(["AT", "AT", "DE", "CH"]);
  if (/sprache/.test(n) && f.fieldtype === "Select") return r.pick(["de", "de", "de", "en", "fr", "it"]);
  if (/waehrung|currency/.test(n)) return "EUR";
  if (/^titel$/.test(n)) return "";
  if (/^slug$/.test(n)) return `${ctx.vorname}-${ctx.nachname}-${r.int(1, 999)}`.toLowerCase();
  if (/_cent$/.test(n) && f.fieldtype === "Int") return r.pick([0, 4900, 12900, 24900, 89000, 149000, 329000, 580000, 1290000]);
  if (/anzahl|menge|stueck/.test(n) && (f.fieldtype === "Int" || f.fieldtype === "Float")) return r.int(1, 6);
  if (/prozent|percent/.test(n)) return r.pick([0, 10, 20]);
  if (/beschreibung|anliegen|notiz|nachricht|bemerkung|text/.test(n) && ["Text", "Small Text", "Long Text", "Text Editor", "Markdown Editor"].includes(f.fieldtype)) return r.pick(ANLIEGEN);
  switch (f.fieldtype) {
    case "Data":
    case "Barcode":
    case "Autocomplete":
      if (/kanal|quelle|art|typ/.test(n)) return f.default || "";
      if (/hash|token|key|id$|kennung|nummer/.test(n)) return `MUSTER-${r.int(1000, 9999)}`;
      return f.default || "";
    case "Select": {
      const opts = (f.auswahl || []).filter(Boolean);
      return f.default && r.chance(0.5) ? f.default : r.pick(opts) || "";
    }
    case "Link":
      if (f.options === "User") return r.pick(DEMO_BENUTZER).email;
      if (f.options === "PH Kontakt") return ctx.kontakt || "";
      if (f.options === "PH Marke") return r.pick(MARKEN);
      if (f.options === "PH Kategorie") return r.pick(KATEGORIEN);
      if (f.options === "Currency") return "EUR";
      if (f.options === "Country") return "Austria";
      return "";
    case "Dynamic Link":
      return "";
    case "Date":
      return isoDatum(tage(r.int(-60, 20)));
    case "Datetime":
      return isoDatumZeit(tage(r.int(-60, 10), r));
    case "Time":
      return `${String(r.int(8, 17)).padStart(2, "0")}:${r.pick(["00", "30"])}:00`;
    case "Check":
      return f.default === "1" || f.default === 1 ? 1 : r.chance(0.2) ? 1 : 0;
    case "Int":
      return f.default !== undefined ? Number(f.default) || 0 : r.int(0, 12);
    case "Float":
    case "Currency":
    case "Percent":
      return f.default !== undefined ? Number(f.default) || 0 : r.int(0, 200) / 4;
    case "Text":
    case "Small Text":
    case "Long Text":
    case "Text Editor":
    case "Markdown Editor":
    case "Code":
    case "JSON":
      return "";
    case "Attach":
    case "Attach Image":
      return "";
    case "Color":
      return "#8a7a66";
    case "Rating":
      return r.int(2, 5) / 5;
    case "Duration":
      return r.int(900, 14400);
    default:
      return f.default ?? "";
  }
}

/** Erzeugt ein Dokument aus der Meta (ohne Name). */
export function erzeugeDokument(meta, r, ctx = {}, kinderMeta = () => null) {
  const vorname = r.pick(VORNAMEN);
  const nachname = r.pick(NACHNAMEN);
  const c = { vorname, nachname, ...ctx };
  const doc = { doctype: meta.name };
  for (const f of meta.fields) {
    if (LAYOUT_FELDTYPEN.has(f.fieldtype) || ["Button", "HTML", "Heading", "Image", "Fold"].includes(f.fieldtype)) continue;
    if (f.fieldname === "amended_from") continue;
    if (f.fieldtype === "Table") {
      const km = kinderMeta(f.options);
      const zeilen = [];
      const n = f.reqd ? r.int(1, 3) : r.chance(0.6) ? r.int(1, 3) : 0;
      for (let i = 0; i < n; i++) {
        if (km) {
          const kind = erzeugeDokument(km, r, c, kinderMeta);
          kind.idx = i + 1;
          kind.parentfield = f.fieldname;
          kind.parenttype = meta.name;
          zeilen.push(kind);
        }
      }
      doc[f.fieldname] = zeilen;
      continue;
    }
    doc[f.fieldname] = wertFuerFeld(f, r, c);
  }
  if (meta.title_field && !doc[meta.title_field]) {
    doc[meta.title_field] = titelFuer(meta, doc, c);
  }
  return doc;
}

function titelFuer(meta, doc, c) {
  const kurz = meta.name.replace(/^PH /, "");
  const person = `${c.vorname} ${c.nachname}`;
  if (doc.art) return `${kurz}: ${doc.art} – ${person}`;
  if (doc.kunde_name) return `${kurz} ${doc.kunde_name}`;
  return `${kurz} ${person}`;
}
