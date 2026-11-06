// Bezugs-Registry (G-14, 05-Informationsarchitektur § 5.3, Team P0-5a).
//
// Tabelle aller Verknüpfungen zwischen den PH-DocTypes, erzeugt aus den Metadaten (Mock: DocType-JSONs
// aus Backend-Import inkl. Custom Fields und `links`-Abschnitten; Frappe-Modus: dieselbe Meta über
// getdoctype). Jede Akte (T5) baut daraus die Bezüge in drei Gruppen:
//   vorher       – Quelle (Link-Felder des Datensatzes auf andere Vorgänge, Dynamic Links)
//   gleichzeitig – wozu er gehört (Kunde, Projekt, Kundenkarte)
//   nachher      – Folgedokumente (DocTypes, die auf ihn zeigen) mit Zähler und „+ anlegen“ nach Recht
// Q-A11: Fremddaten nur mit explizitem Bezugsfilter; fehlt ein Filterfeld → „nicht verknüpft“.
// Q-L3: höchstens `maxAbfragen` Zähl-Aufrufe je Akte (Standard 6), der Rest ohne Zähler als Link.

import { doctypeSlug } from "./format.js";
import { doctypeLabel } from "./labels.js";
import { kanonischeRoute } from "./bereiche/index.js";
import { darfDoc } from "./auth/rechte.js";
import { TEXTE } from "./akte/texte.js";

/** Ziele, die einen Vorgang einordnen statt ihm vorauszugehen („Gehört zu“). */
export const GLEICHZEITIG = Object.freeze(["PH Kontakt", "PH Projekt", "PH Kundenkarte"]);

export const MAX_ZAEHLER = 6;

/** Icon (Name aus components/Backoffice/icons.js) je Bereich – rein darstellend. */
const BEREICH_ICON = Object.freeze({
  crm: "Contact", projekte: "FolderKanban", faktura: "Receipt", shop: "ShoppingBag", sortiment: "Tag",
  logistik: "Truck", service: "Wrench", kundenkarte: "IdCard", marketing: "Megaphone", personal: "Users",
  kassa: "Banknote", zentrale: "LayoutDashboard", ablage: "FileText", posteingang: "Inbox",
});
const DOCTYPE_ICON = Object.freeze({
  "PH Kontakt": "Contact", "PH Projekt": "FolderKanban", "PH Kundenkarte": "IdCard", "PH Anfrage": "Inbox",
  "PH Termin": "CalendarDays", "PH Beratungsgespraech": "MessageSquare", "PH Angebot": "FileText",
  "PH Auftragsbestaetigung": "BadgeCheck", "PH Rechnung": "Receipt", "PH Gutschrift": "Receipt",
  "PH Zahlung": "Wallet", "PH Lieferschein": "Truck", "PH Sendung": "Package", "PH Planung": "Ruler",
  "PH Aufgabe": "CheckSquare", "PH Servicefall": "Wrench", "PH Montageauftrag": "Hammer",
});

export function iconFuer(doctype, bereich) {
  return DOCTYPE_ICON[doctype] || BEREICH_ICON[bereich] || "FileText";
}

const istPh = (dt) => typeof dt === "string" && dt.startsWith("PH ");

const cache = new WeakMap();

/**
 * Bezugstabelle aus einem Meta-Index (`metaIndex()`): `{ doctype, feld, zielDoctype, richtung, titel,
 * bereich, dynamisch?, typFeld?, gruppe? }`. Nur PH-DocTypes, keine Kindtabellen/Singles. Je Index gecacht.
 * @param {{doctypes: Map<string, object>}} index
 */
export function bezugsTabelle(index) {
  if (!index?.doctypes) return [];
  if (cache.has(index)) return cache.get(index);
  const out = [];
  const gruppeVon = new Map(); // "Ziel|Quelle|feld" → Gruppe aus links-Abschnitt
  for (const [name, m] of index.doctypes) {
    for (const l of m.links || []) if (l?.link_doctype && l?.link_fieldname) gruppeVon.set(`${name}|${l.link_doctype}|${l.link_fieldname}`, l.group || null);
  }
  for (const [name, m] of index.doctypes) {
    if (!istPh(name) || m.istable || m.issingle) continue;
    for (const f of m.fields || []) {
      if (f.fieldtype === "Link" && istPh(f.options) && index.doctypes.has(f.options)) {
        const ziel = index.doctypes.get(f.options);
        if (ziel.istable || ziel.issingle) continue;
        out.push({ doctype: name, feld: f.fieldname, zielDoctype: f.options, richtung: "zeigt_auf", titel: f.label || doctypeLabel(f.options), bereich: m.bereich || null });
        out.push({ doctype: f.options, feld: f.fieldname, zielDoctype: name, richtung: "wird_gezeigt_von", titel: doctypeLabel(name), bereich: m.bereich || null, gruppe: gruppeVon.get(`${f.options}|${name}|${f.fieldname}`) ?? null });
      } else if (f.fieldtype === "Dynamic Link" && f.options) {
        out.push({ doctype: name, feld: f.fieldname, zielDoctype: null, typFeld: f.options, richtung: "zeigt_auf", titel: f.label || f.fieldname, bereich: m.bereich || null, dynamisch: true });
      }
    }
  }
  cache.set(index, out);
  return out;
}

/**
 * Bezüge eines DocTypes: `zeigtAuf` (Felder des Datensatzes) und `wirdGezeigtVon` (Folgedokumente),
 * letztere in der Reihenfolge des `links`-Abschnitts der DocType (dort gepflegt), danach der Rest.
 */
export function bezuegeVon(doctype, index) {
  const tabelle = bezugsTabelle(index);
  const zeigtAuf = tabelle.filter((b) => b.doctype === doctype && b.richtung === "zeigt_auf");
  const rueck = tabelle.filter((b) => b.doctype === doctype && b.richtung === "wird_gezeigt_von");
  const reihe = (index?.doctypes?.get(doctype)?.links || []).map((l) => `${l.link_doctype}|${l.link_fieldname}`);
  const rang = (b) => {
    const i = reihe.indexOf(`${b.zielDoctype}|${b.feld}`);
    return i >= 0 ? i : reihe.length + 1;
  };
  const wirdGezeigtVon = [...rueck].sort((a, b) => rang(a) - rang(b) || a.zielDoctype.localeCompare(b.zielDoctype) || a.feld.localeCompare(b.feld));
  return { zeigtAuf, wirdGezeigtVon };
}

/** Adresse eines Datensatzes: kanonische Route des Bereichs, sonst die generische Seite. */
export function datensatzHref(doctype, name) {
  return kanonischeRoute(doctype, name) || `/d/${doctypeSlug(doctype)}/${encodeURIComponent(name)}`;
}

/** Gefilterte Liste der Folgedokumente (`f_<feld>=<name>`, siehe listen.js). */
export function listeHref(doctype, feld, name) {
  const basis = kanonischeRoute(doctype) || `/d/${doctypeSlug(doctype)}`;
  return `${basis}${basis.includes("?") ? "&" : "?"}f_${feld}=${encodeURIComponent(name)}`;
}

/** „+ anlegen“ mit vorbelegtem Bezugsfeld (generisches Formular; Bereiche können `anlegenHref` ersetzen). */
export function anlegenHref(doctype, feld, name) {
  return `/d/${doctypeSlug(doctype)}/neu?${encodeURIComponent(feld)}=${encodeURIComponent(name)}`;
}

/**
 * Gruppen ohne Server-Aufruf aus einem geladenen Datensatz (vorher/gleichzeitig) und der Tabelle
 * (nachher, noch ohne Zähler). `nachher` als Liste erlaubter DocTypes schränkt ein; ein erlaubter
 * DocType ohne Filterfeld erscheint als „nicht verknüpft“ (Q-A11).
 * @param {{doctype:string, doc:object, index:object, session?:object, nachher?:string[],
 *   darf?:(meta:object, aktion:string)=>boolean}} p
 */
export function gruppiereBezuege({ doctype, doc = {}, index, session, nachher, darf }) {
  const pruefe = darf || ((meta, aktion) => (session ? darfDoc(session, meta, aktion) : aktion === "read"));
  const metaVon = (dt) => index?.doctypes?.get(dt) || null;
  const { zeigtAuf, wirdGezeigtVon } = bezuegeVon(doctype, index);
  const name = doc?.name;
  const vorher = [];
  const gleichzeitig = [];

  for (const b of zeigtAuf) {
    const wert = doc?.[b.feld];
    if (!wert) continue;
    const ziel = b.dynamisch ? doc?.[b.typFeld] : b.zielDoctype;
    if (!istPh(ziel)) continue;
    const meta = metaVon(ziel);
    const lesen = meta ? pruefe(meta, "read") : false;
    const eintrag = {
      id: `${b.feld}:${wert}`,
      doctype: ziel,
      name: String(wert),
      feld: b.feld,
      titel: doctypeLabel(ziel),
      info: String(wert),
      icon: iconFuer(ziel, meta?.bereich),
      href: lesen ? datensatzHref(ziel, wert) : null,
      keinZugriff: !lesen,
    };
    (GLEICHZEITIG.includes(ziel) && !b.dynamisch ? gleichzeitig : vorher).push(eintrag);
  }

  const erlaubt = Array.isArray(nachher) ? nachher : null;
  const folge = [];
  const gesehen = new Set();
  for (const b of wirdGezeigtVon) {
    if (erlaubt && !erlaubt.includes(b.zielDoctype)) continue;
    const meta = metaVon(b.zielDoctype);
    if (!meta || !pruefe(meta, "read")) continue; // fehlendes Recht: ausgeblendet (Q-B11)
    gesehen.add(b.zielDoctype);
    folge.push({
      id: `${b.zielDoctype}:${b.feld}`,
      doctype: b.zielDoctype,
      feld: b.feld,
      titel: doctypeLabel(b.zielDoctype),
      gruppe: b.gruppe || null,
      icon: iconFuer(b.zielDoctype, meta.bereich),
      anzahl: null,
      href: name ? listeHref(b.zielDoctype, b.feld, name) : null,
      anlegenHref: name && pruefe(meta, "create") ? anlegenHref(b.zielDoctype, b.feld, name) : null,
    });
  }
  for (const dt of erlaubt || []) {
    if (gesehen.has(dt)) continue;
    const meta = metaVon(dt);
    if (meta && !pruefe(meta, "read")) continue;
    folge.push({ id: `${dt}:-`, doctype: dt, feld: null, titel: doctypeLabel(dt), icon: iconFuer(dt, meta?.bereich), anzahl: null, href: null, anlegenHref: null, nichtVerknuepft: true, info: TEXTE.bezuege.nichtVerknuepft });
  }
  return { vorher, gleichzeitig, nachher: folge };
}

/**
 * Bezüge einer Akte laden: Gruppen wie `gruppiereBezuege`, dazu Zähler der ersten `maxAbfragen`
 * Folgedokument-Arten (parallel, ein Fehler betrifft nur seinen Eintrag). Wirft nie.
 * @param {{client:{count:Function}, doctype:string, doc:object, index:object, session?:object,
 *   nachher?:string[], maxAbfragen?:number, darf?:Function, ohneLeere?:boolean}} p
 * @returns {Promise<{vorher:object[], gleichzeitig:object[], nachher:object[], abfragen:number}>}
 */
export async function ladeBezuege({ client, doctype, doc, index, session, nachher, maxAbfragen = MAX_ZAEHLER, darf, ohneLeere = false }) {
  const g = gruppiereBezuege({ doctype, doc, index, session, nachher, darf });
  const zaehlbar = g.nachher.filter((e) => !e.nichtVerknuepft && e.feld && doc?.name);
  const ziele = zaehlbar.slice(0, Math.max(0, maxAbfragen));
  const ergebnisse = await Promise.allSettled(ziele.map((e) => client.count(e.doctype, { filters: [[e.feld, "=", doc.name]] })));
  ziele.forEach((e, i) => {
    const r = ergebnisse[i];
    if (r.status === "fulfilled" && Number.isFinite(Number(r.value))) e.anzahl = Number(r.value);
    else e.zaehlerFehlt = true;
  });
  if (ohneLeere) g.nachher = g.nachher.filter((e) => e.anzahl !== 0 || e.anlegenHref);
  return { ...g, abfragen: ziele.length };
}

/** Summe der Einträge (für Reiter-Zähler „Bezüge 7“). Unbekannte Zähler zählen nicht. */
export function bezuegeAnzahl(g) {
  if (!g) return 0;
  return (g.vorher?.length || 0) + (g.gleichzeitig?.length || 0) + (g.nachher || []).reduce((s, e) => s + (Number.isFinite(e.anzahl) ? e.anzahl : 0), 0);
}
