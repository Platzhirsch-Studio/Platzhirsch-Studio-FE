// Fähigkeiten-Register (G-04, Q-A7, K-19): Was das Backend (noch) nicht kann, zeigt die Oberfläche ehrlich –
// fachlich erwartet → Knopf sichtbar, deaktiviert, darunter „Noch nicht verfügbar – {Ersatzweg}“; nicht
// erwartet oder ohne Recht → ausgeblendet. Nie ein Knopf, der mit Fehler endet.
//
// Kern hier, Bereiche definieren ihre Fähigkeiten in lib/backoffice/<bereich>/faehigkeiten.js:
//   export const KASSA = definiereFaehigkeiten("kassa", {
//     retoure: { titel: "Retoure buchen", probe: { methode: "ph_kassa.dienste.retoure" },
//                ersatz: { titel: "Zurücknahme im Frappe-Desk", href: "/kassa/verwaltung" } },
//   });
//   const s = await faehigkeit(session, "kassa.retoure", { katalog: KASSA });
//
// Quelle der Wahrheit:
//   Mock   – Schalter BACKOFFICE_MOCK_FAEHIGKEITEN („alle“, „keine“, „alle,-kassa.retoure“, „+shop.x“), sonst
//            Probe gegen die echten Dateien in Backend-Import (DocType-JSON, Feld, @frappe.whitelist-Funktion).
//   Frappe – Probe über getMeta (DocType/Feld, Cache 5 min); Methoden nur mit `get: true` (lesend, GET-fähig)
//            per Probeaufruf, sonst nur, wenn der Betrieb sie in BACKOFFICE_FAEHIGKEITEN freigibt.
// Reines Modul (keine "@/"-Importe); Dateizugriffe nur per dynamischem Import im Mock-Pfad.

import { ENV, backofficeMode } from "./config.js";
import { darf } from "./auth/rechte.js";

export const FAEHIGKEIT_TEXTE = Object.freeze({
  nichtVerfuegbar: "Noch nicht verfügbar",
  keinRecht: "Kein Recht für diese Aktion",
  unbekannt: "Unbekannte Fähigkeit",
});

const CACHE_MS = 5 * 60_000;
const G = globalThis;

/**
 * @typedef {{doctype?:string, feld?:string, methode?:string, docmethode?:string, get?:boolean}} Probe
 * @typedef {{titel:string, erwartet?:boolean, grund?:string, ersatz?:{titel:string, href?:string},
 *   probe?:Probe|Probe[], recht?:{bereich:string, aktion:string}}} FaehigkeitDefinition
 * @typedef {{id:string, an:boolean, erwartet:boolean, grund:string|null, ersatz:{titel:string, href?:string}|null,
 *   titel:string, quelle:"schalter"|"probe"|"recht"|"unbekannt"|"ohne-probe"}} FaehigkeitStatus
 */

function register() {
  if (!G.__phBoFaehigkeiten) G.__phBoFaehigkeiten = new Map();
  return G.__phBoFaehigkeiten;
}

function cache() {
  if (!G.__phBoFaehigkeitenCache) G.__phBoFaehigkeitenCache = new Map();
  return G.__phBoFaehigkeitenCache;
}

/** Cache leeren (Tests, nach Backend-Update). */
export function leereFaehigkeitenCache() {
  cache().clear();
}

/**
 * Fähigkeiten eines Bereichs definieren. Schlüssel ohne Präfix; IDs werden „<bereich>.<schluessel>“.
 * Doppelte IDs werfen sofort (gleiche ID, andere Definition).
 * @param {string} bereich
 * @param {Record<string, FaehigkeitDefinition>} eintraege
 * @returns {Record<string, FaehigkeitDefinition & {id:string, bereich:string}>} Katalog (Schlüssel = volle ID)
 */
export function definiereFaehigkeiten(bereich, eintraege) {
  if (!/^[a-z]+$/.test(bereich)) throw new Error(`Fähigkeiten: ungültiger Bereich ${bereich}`);
  const katalog = {};
  for (const [schluessel, def] of Object.entries(eintraege)) {
    if (!/^[a-z0-9_-]+$/.test(schluessel)) throw new Error(`Fähigkeiten: ungültiger Schlüssel ${bereich}.${schluessel}`);
    if (!def?.titel) throw new Error(`Fähigkeiten: ${bereich}.${schluessel} ohne Titel`);
    const id = `${bereich}.${schluessel}`;
    const eintrag = Object.freeze({ ...def, id, bereich, erwartet: def.erwartet !== false });
    const alt = register().get(id);
    if (alt && JSON.stringify(alt) !== JSON.stringify(eintrag)) throw new Error(`Fähigkeit doppelt definiert: ${id}`);
    register().set(id, eintrag);
    katalog[id] = eintrag;
  }
  return Object.freeze(katalog);
}

/** Alle bisher definierten Fähigkeiten (Übersicht für L0/Demo). */
export function alleFaehigkeiten() {
  return [...register().values()];
}

/** Kern-Fähigkeiten des Fundaments (ph_core). */
export const KERN_FAEHIGKEITEN = definiereFaehigkeiten("kern", {
  suche: { titel: "Suche über alle Bereiche", erwartet: false, probe: { methode: "ph_core.api.suche.global_search", get: true } },
  aktivitaet: { titel: "Aktivitätsstrom", erwartet: false, probe: { methode: "ph_core.api.aktivitaet.recent_activity", get: true } },
  geraete: { titel: "Geräte verwalten", probe: [{ doctype: "PH Geraet" }, { methode: "ph_core.api.geraete.list_devices", get: true }], ersatz: { titel: "Gerät im Frappe-Desk pflegen" } },
});

// ---------------------------------------------------------------- Schalter --

/**
 * Schalter-Text → { alle: true|false|null, an:Set, aus:Set }. „alle“/„keine“ setzen den Grundwert,
 * „-id“ schaltet aus, „+id“ oder „id“ an. Leerzeichen und Groß-/Kleinschreibung egal.
 */
export function parseSchalter(text) {
  const out = { alle: null, an: new Set(), aus: new Set() };
  for (const roh of String(text || "").split(",")) {
    const t = roh.trim().toLowerCase();
    if (!t) continue;
    if (t === "alle" || t === "*") out.alle = true;
    else if (t === "keine" || t === "-*") out.alle = false;
    else if (t.startsWith("-")) out.aus.add(t.slice(1));
    else out.an.add(t.replace(/^\+/, ""));
  }
  return out;
}

/** Entscheidung des Schalters für eine ID: true / false / null (= Probe entscheidet). */
export function schalterSagt(schalter, id, { alleErlaubt = true } = {}) {
  const s = typeof schalter === "string" ? parseSchalter(schalter) : schalter;
  if (!s) return null;
  const klein = id.toLowerCase();
  const bereichAlle = `${klein.split(".")[0]}.*`;
  if (s.aus.has(klein) || s.aus.has(bereichAlle)) return false;
  if (s.an.has(klein) || s.an.has(bereichAlle)) return true;
  if (s.alle === false) return false;
  if (s.alle === true && alleErlaubt) return true;
  return null;
}

// ------------------------------------------------------------------ Probe --

async function pythonQuellen(app) {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { aufgeloesterMetaDir } = await import("./frappe/meta.js");
  const wurzel = join(aufgeloesterMetaDir(), app, app);
  const dateien = [];
  const laufe = (dir, tiefe) => {
    if (tiefe > 8) return;
    let eintraege = [];
    try {
      eintraege = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of eintraege) {
      if (e === "__pycache__" || e === "node_modules" || e.startsWith(".")) continue;
      const p = join(dir, e);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) laufe(p, tiefe + 1);
      else if (e.endsWith(".py")) dateien.push({ pfad: p.replace(/\\/g, "/"), text: () => readFileSync(p, "utf8") });
    }
  };
  laufe(wurzel, 0);
  return { wurzel: wurzel.replace(/\\/g, "/"), dateien };
}

/** @frappe.whitelist()-Funktion `fn` in `text` (weitere Dekoratoren dazwischen erlaubt)? */
export function hatWhitelistFunktion(text, fn) {
  const re = new RegExp(String.raw`@frappe\.whitelist\([^)]*\)\s*(?:@[^\n]*\n\s*)*def\s+${fn.replace(/[^a-zA-Z0-9_]/g, "")}\s*\(`);
  return re.test(text);
}

/** Mock: Methode „ph_kassa.dienste.retoure“ in Backend-Import whitelisted vorhanden? */
async function mockMethodeDa(methode) {
  const teile = String(methode).split(".");
  if (teile.length < 2) return false;
  const fn = teile.pop();
  const app = teile[0];
  const { wurzel, dateien } = await pythonQuellen(app);
  const modul = teile.slice(1).join("/");
  const kandidaten = new Set([`${wurzel}/${modul}.py`, `${wurzel}/${modul}/__init__.py`]);
  return dateien.some((d) => kandidaten.has(d.pfad) && hatWhitelistFunktion(d.text(), fn));
}

/** Mock: Dokumentmethode (run_doc_method) im Controller der DocType whitelisted vorhanden? */
async function mockDocMethodeDa(doctype, methode) {
  const app = await appVonDoctype(doctype);
  if (!app) return false;
  const datei = doctype.toLowerCase().replace(/\s+/g, "_");
  const { dateien } = await pythonQuellen(app);
  return dateien.some((d) => d.pfad.endsWith(`/doctype/${datei}/${datei}.py`) && hatWhitelistFunktion(d.text(), methode));
}

async function appVonDoctype(doctype) {
  const { metaFuer } = await import("./frappe/meta.js");
  // Modul „PH Kundenkarte“ → App „ph_kundenkarte“ (eine Frappe-App = ein Modul, CONVENTIONS.md).
  const modul = String(metaFuer(doctype)?.module || "").toLowerCase().replace(/^ph\s+/, "ph_").replace(/\s+/g, "_");
  return /^ph_[a-z_]+$/.test(modul) ? modul : null;
}

async function mockMeta(doctype) {
  const { metaFuer } = await import("./frappe/meta.js");
  return metaFuer(doctype) || null;
}

async function frappeMeta(client, doctype) {
  const { ladeMeta } = await import("./frappe/index.js");
  try {
    return await ladeMeta(client, doctype);
  } catch {
    return null;
  }
}

/**
 * Eine Probe auswerten → true (vorhanden) | false (fehlt) | null (im Frappe-Modus nicht gefahrlos prüfbar).
 * @param {Probe} probe
 * @param {{modus:"mock"|"frappe", client?:any}} ctx
 */
export async function pruefeProbe(probe, { modus, client }) {
  if (probe.doctype && !probe.docmethode) {
    const meta = modus === "frappe" ? await frappeMeta(client, probe.doctype) : await mockMeta(probe.doctype);
    if (!meta) return false;
    if (probe.feld) return (meta.fields || []).some((f) => f.fieldname === probe.feld);
    return true;
  }
  if (probe.docmethode) {
    if (modus === "frappe") return null;
    return mockDocMethodeDa(probe.doctype, probe.docmethode);
  }
  if (probe.methode) {
    if (modus !== "frappe") return mockMethodeDa(probe.methode);
    if (!probe.get || !client?.methodGet) return null;
    try {
      await client.methodGet(probe.methode, {});
      return true;
    } catch (err) {
      // Methode fehlt (not_found) → aus; Pflichtparameter/Recht fehlt → die Methode existiert.
      return err?.code === "not_found" ? false : err?.code === "invalid" || err?.code === "forbidden" ? true : null;
    }
  }
  return null;
}

// ---------------------------------------------------------------- Abfrage --

/**
 * Status einer Fähigkeit.
 * @param {object} session
 * @param {string} id z. B. "kassa.retoure"
 * @param {{katalog?:Record<string, any>, client?:any, modus?:"mock"|"frappe", env?:Record<string,string|undefined>,
 *   ueberschreibung?:string|null, jetzt?:number}} [opts]
 * @returns {Promise<FaehigkeitStatus>}
 */
export async function faehigkeit(session, id, opts = {}) {
  const def = opts.katalog?.[id] || register().get(id);
  if (!def) return { id, an: false, erwartet: false, grund: FAEHIGKEIT_TEXTE.unbekannt, ersatz: null, titel: id, quelle: "unbekannt" };
  const basis = { id, titel: def.titel, erwartet: def.erwartet !== false, ersatz: def.ersatz || null };
  if (def.recht && !darf(session, def.recht.bereich, def.recht.aktion)) return { ...basis, an: false, erwartet: false, grund: FAEHIGKEIT_TEXTE.keinRecht, quelle: "recht" };

  const env = opts.env || process.env;
  const modus = opts.modus || opts.client?.modus || backofficeMode(env);
  const schalterText = opts.ueberschreibung ?? (modus === "frappe" ? env[ENV.FAEHIGKEITEN] : env[ENV.MOCK_FAEHIGKEITEN]);
  // Im Frappe-Modus darf „alle“ keine Probe überstimmen (sonst Knöpfe, die mit Fehler enden).
  const schalter = schalterSagt(parseSchalter(schalterText), id, { alleErlaubt: modus !== "frappe" });
  if (schalter !== null) return { ...basis, an: schalter, grund: schalter ? null : def.grund || FAEHIGKEIT_TEXTE.nichtVerfuegbar, quelle: "schalter" };

  const proben = def.probe ? (Array.isArray(def.probe) ? def.probe : [def.probe]) : [];
  if (!proben.length) return { ...basis, an: false, grund: def.grund || FAEHIGKEIT_TEXTE.nichtVerfuegbar, quelle: "ohne-probe" };

  const jetzt = opts.jetzt ?? Date.now();
  const schluessel = `${modus}::${id}`;
  const alt = cache().get(schluessel);
  let an;
  if (alt && jetzt - alt.t < CACHE_MS) an = alt.an;
  else {
    an = true;
    for (const p of proben) {
      const r = await pruefeProbe(p, { modus, client: opts.client });
      if (r !== true) {
        an = false;
        break;
      }
    }
    cache().set(schluessel, { an, t: jetzt });
  }
  return { ...basis, an, grund: an ? null : def.grund || FAEHIGKEIT_TEXTE.nichtVerfuegbar, quelle: "probe" };
}

/** Mehrere Fähigkeiten auf einmal → { id: status }. */
export async function faehigkeiten(session, ids, opts = {}) {
  const liste = await Promise.all(ids.map((id) => faehigkeit(session, id, opts)));
  return Object.fromEntries(liste.map((s) => [s.id, s]));
}

/** Sichtbarkeit nach Q-A7: "an" (Kind normal), "deaktiviert" (Kind + Hinweis) oder "aus" (nichts). */
export function darstellung(status) {
  if (!status) return "aus";
  if (status.an) return "an";
  return status.erwartet ? "deaktiviert" : "aus";
}

/** Hinweistext unter einem deaktivierten Knopf: „Noch nicht verfügbar – {Ersatzweg}“ (Link separat). */
export function hinweisText(status) {
  if (!status || status.an) return "";
  const kopf = status.grund && status.grund !== FAEHIGKEIT_TEXTE.nichtVerfuegbar ? status.grund : FAEHIGKEIT_TEXTE.nichtVerfuegbar;
  return status.ersatz?.titel ? `${kopf} – ${status.ersatz.titel}` : kopf;
}
