import "server-only";
// Datenschicht des Bereichs Ablage (Konzept §9): lädt über backoffice(session) bzw. ph_ablage.api (methoden.js),
// liefert serialisierbare Objekte für Seiten und Client-Komponenten. Mock und Frappe laufen über dieselben Aufrufe.
// Simulation (nur Mock außerhalb Produktion): ?sim=leer | ?sim=fehler für Abnahmebilder der Leer-/Fehlerzustände.

import { backoffice } from "@/lib/backoffice/frappe";
import { BackofficeError, istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { darf, darfDoc } from "@/lib/backoffice/auth/rechte";
import { faehigkeiten } from "@/lib/backoffice/faehigkeiten";
import { neuerName } from "@/lib/backoffice/mock/engine";
import { tage } from "@/lib/backoffice/mock/seed/basis";
import nachsaat, { istGesaet } from "@/lib/backoffice/mock/seed/ablage";
import { DT } from "./labels";
import { ablage, ablageCode } from "./methoden";
import { ABLAGE } from "./faehigkeiten";
import { darfOrdner, groesseText, istAblageLeitung, sperreAktiv, tagsNormalisieren } from "./regeln";

export const SEITE_GROESSE = 60;

/** Kontext einer Seite/Action. */
export function kontext(session, sp = {}) {
  const client = backoffice(session);
  sichereMockSeed(client);
  const sim = client.modus !== "frappe" && process.env.NODE_ENV !== "production" && ["leer", "fehler"].includes(sp?.sim) ? sp.sim : null;
  let schreiben = false;
  let anlegen = false;
  try {
    const meta = client.index?.doctypes?.get(DT.datei);
    schreiben = meta ? darfDoc(session, meta, "write") : darf(session, "ablage", "write");
    anlegen = meta ? darfDoc(session, meta, "create") : darf(session, "ablage", "create");
  } catch {
    schreiben = darf(session, "ablage", "write");
  }
  return {
    client,
    session,
    user: session.user,
    rollen: session.roles || [],
    leitung: istAblageLeitung(session.roles || []),
    schreiben,
    anlegen,
    sim,
    modus: client.modus,
  };
}

/**
 * Mock: Läuft der Dev-Server mit einer Datenbank von vor dem B-ABL-Seed (prozessweit, kein Neustart erlaubt),
 * wird der Festbestand einmalig nachgesät – nur Ablage-Tabellen.
 */
export function sichereMockSeed(client) {
  if (client?.modus === "frappe" || !client?.db?.db || istGesaet(client.db.db)) return;
  const db = client.db.db;
  const tabelle = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };
  nachsaat(db, { tabelle, naechste: (p) => client.naechsteNummer(p), tage, index: client.index, neuerName, kontakte: [] });
}

function simuliere(ctx) {
  if (ctx.sim === "fehler") throw new BackofficeError("unavailable", "Daten gerade nicht erreichbar.");
}

/** Fehler in serialisierbare Form (`{code, message, ablage}`). */
export function alsFehler(err) {
  if (istBackofficeError(err)) return { code: err.code, message: err.message, ablage: ablageCode(err), daten: err.daten || null };
  console.error("[ablage]", err?.name || err, err?.message);
  return { code: "unavailable", message: "Daten gerade nicht erreichbar.", ablage: "unavailable" };
}

export async function sicher(fn) {
  try {
    return { ok: true, daten: await fn() };
  } catch (err) {
    return { ok: false, fehler: alsFehler(err) };
  }
}

export async function ladeFaehigkeiten(ctx) {
  return faehigkeiten(ctx.session, Object.keys(ABLAGE), { katalog: ABLAGE, client: ctx.client });
}

// ---------------------------------------------------------------- Allgemein --

export async function ladeInfo(ctx) {
  simuliere(ctx);
  return ablage(ctx.client, "einstellungen_info");
}

/** Info für den Client (nur was die Oberfläche braucht). */
export function infoFuerClient(info) {
  if (!info) return { max_bytes: 0, chunk_bytes: 8 * 1024 * 1024, erlaubte_endungen: [], gesperrte_endungen: [], direkt_upload: false, office_vorschau: false, portal: false, freigabe_standard_tage: 7, freigabe_max_tage: 90, freigabe_passwort_pflicht: 0, sperre_stunden: 8, papierkorb_tage: 30 };
  return {
    max_bytes: info.max_bytes,
    chunk_bytes: info.chunk_bytes,
    erlaubte_endungen: info.erlaubte_endungen || [],
    gesperrte_endungen: info.gesperrte_endungen || [],
    direkt_upload: Boolean(info.direkt_upload),
    office_vorschau: Boolean(info.office_vorschau),
    portal: Boolean(info.portal),
    freigabe_standard_tage: info.freigabe_standard_tage || 7,
    freigabe_max_tage: info.freigabe_max_tage || 90,
    freigabe_passwort_pflicht: info.freigabe_passwort_pflicht ? 1 : 0,
    sperre_stunden: info.sperre_stunden || 8,
    papierkorb_tage: info.papierkorb_tage || 30,
  };
}

// --------------------------------------------------------------------- Ordner --

/** Bereichsordner (oberste Ebene, ohne Kinder). */
export async function ladeWurzeln(ctx) {
  simuliere(ctx);
  if (ctx.sim === "leer") return [];
  const r = await ablage(ctx.client, "ordner_baum", { tiefe: 0 });
  return (r?.wurzeln || []).map(ohneKinder);
}

function ohneKinder(k) {
  return { ...k, kinder: [], hat_kinder: k.hat_kinder ?? 1 };
}

export async function ladeUnterbaum(ctx, ordner, tiefe = 10) {
  const r = await ablage(ctx.client, "ordner_baum", { ordner, tiefe });
  return r?.wurzeln?.[0] || null;
}

/**
 * Kette von der obersten Ebene bis zum Ordner: [{ordner, titel, eltern, …}].
 * Frappe: Nested Set (lft/rgt) in einem Aufruf; Mock: über die Elternfelder.
 */
export async function ladeKette(ctx, ordnerId) {
  const c = ctx.client;
  const felder = ["name", "titel", "parent_ph_ordner", "bezug_doctype", "bezug_name", "bezug_titel", "effektiver_modus", "ist_bezugswurzel", "aufbewahrungsklasse", "farbe", "geschuetzt", "lft", "rgt"];
  const alsKnoten = (o) => ({ ordner: o.name, titel: o.titel, eltern: o.parent_ph_ordner || null, bezug_doctype: o.bezug_doctype || null, bezug_name: o.bezug_name || null, bezug_titel: o.bezug_titel || null, effektiver_modus: o.effektiver_modus || "intern", ist_bezugswurzel: Number(o.ist_bezugswurzel) || 0, aufbewahrungsklasse: o.aufbewahrungsklasse || null, farbe: o.farbe || null, geschuetzt: Number(o.geschuetzt) || 0 });
  const o = await c.getDoc(DT.ordner, ordnerId);
  if (c.modus === "frappe" && o.lft && o.rgt) {
    const vorfahren = await c.getList(DT.ordner, { fields: felder, filters: [["lft", "<", o.lft], ["rgt", ">", o.rgt]], orderBy: "lft asc", limit: 20 });
    return [...vorfahren.map(alsKnoten), alsKnoten(o)];
  }
  const kette = [alsKnoten(o)];
  let eltern = o.parent_ph_ordner;
  const gesehen = new Set([o.name]);
  while (eltern && !gesehen.has(eltern) && kette.length < 20) {
    gesehen.add(eltern);
    const e = await c.getDoc(DT.ordner, eltern).catch(() => null);
    if (!e) break;
    kette.unshift(alsKnoten(e));
    eltern = e.parent_ph_ordner;
  }
  return kette;
}

/**
 * Alles für die Drive-Seite: Wurzeln, Kette, Baum des aktuellen Zweigs, Unterordner, Dateien.
 * @param {{ordner?: string, q?: string, sort?: string, endung?: string, seite?: number}} p
 */
export async function ladeDrive(ctx, { ordner, q, sort, endung, seite = 1 } = {}) {
  simuliere(ctx);
  const wurzeln = await ladeWurzeln(ctx);
  if (!ordner) {
    const zuletzt = ctx.sim === "leer" ? [] : await ladeZuletzt(ctx, { tage: 14, limit: 12 });
    return { wurzeln, kette: [], zweig: null, unterordner: wurzeln, dateien: { items: zuletzt, gesamt: zuletzt.length, seite: 1 }, aktuell: null, suche: null };
  }
  const kette = await ladeKette(ctx, ordner);
  const zweigWurzel = kette.length > 1 ? kette[1].ordner : kette[0].ordner;
  const [zweig, liste, treffer] = await Promise.all([
    ladeUnterbaum(ctx, zweigWurzel, 10),
    ablage(ctx.client, "dateien", { ordner, sort: sort || "name", seite, groesse: SEITE_GROESSE, endung: endung || undefined, suche: q || undefined }),
    q && q.length >= 2 ? sucheGlobal(ctx, q, { limit: 8 }).catch(() => []) : Promise.resolve(null),
  ]);
  const knoten = findeKnoten(zweig, ordner);
  let unterordner = knoten?.kinder || [];
  // Bereichsordner der Kette: Kinder (Stammordner aller Bezüge) für Baum und Kacheln, Zweig eingesetzt.
  const bereich = await ladeUnterbaum(ctx, kette[0].ordner, 1).catch(() => null);
  const bereichKinder = (bereich?.kinder || []).map((k) => (zweig && kette.length > 1 && k.ordner === zweig.ordner ? zweig : k));
  if (kette.length === 1) unterordner = bereichKinder;
  const baumWurzeln = wurzeln.map((w) => (w.ordner === kette[0].ordner ? { ...w, kinder: bereichKinder } : w));
  return {
    wurzeln: baumWurzeln,
    kette,
    zweig: kette.length > 1 ? zweig : null,
    unterordner: q ? [] : unterordner,
    dateien: { items: liste.items || [], gesamt: liste.gesamt || 0, seite: liste.seite || 1 },
    aktuell: { ...(liste.ordner || {}), ordner, titel: liste.ordner?.titel || kette[kette.length - 1]?.titel, anzahl_unterordner: unterordner.length },
    suche: treffer ? treffer.filter((t) => t.ordner !== ordner) : null,
  };
}

export function findeKnoten(k, id) {
  if (!k) return null;
  if (k.ordner === id) return k;
  for (const x of k.kinder || []) {
    const t = findeKnoten(x, id);
    if (t) return t;
  }
  return null;
}

export async function sucheGlobal(ctx, q, { limit = 50, bezug_doctype, bezug_name } = {}) {
  return ablage(ctx.client, "suche", { q, limit, bezug_doctype, bezug_name });
}

// --------------------------------------------------------------------- Dateien --

const DATEI_FELDER = [
  "name", "dateiname", "ordner", "status", "endung", "mime", "groesse", "aktuelle_version", "vorschau_art", "vorschau_status", "tags",
  "beschreibung", "gesperrt_von", "gesperrt_bis", "portal_freigabe", "portal_ablauf", "freigabelinks_aktiv", "aufbewahrungsklasse", "aufbewahren_bis",
  "loeschsperre", "geloescht_am", "papierkorb_bis", "bezug_doctype", "bezug_name", "bezug_titel", "hochgeladen_von", "creation", "modified",
];

/** Liste-Zeile (getList) → Datei-Antwort wie datei_payload. */
export function zeileZuDatei(d, jetzt = new Date()) {
  const aktiv = sperreAktiv(d, jetzt);
  return {
    datei: d.name, dateiname: d.dateiname, ordner: d.ordner, status: d.status, endung: d.endung, mime: d.mime, groesse: Number(d.groesse) || 0,
    groesse_text: groesseText(d.groesse), version: Number(d.aktuelle_version) || 1, tags: tagsNormalisieren(d.tags), beschreibung: d.beschreibung || null,
    vorschau_art: d.vorschau_art, vorschau_status: d.vorschau_status, gesperrt_von: aktiv ? d.gesperrt_von : null, gesperrt_bis: aktiv ? d.gesperrt_bis : null,
    portal_freigabe: Number(d.portal_freigabe) || 0, portal_ablauf: d.portal_ablauf || null, freigabelinks_aktiv: Number(d.freigabelinks_aktiv) || 0,
    aufbewahrungsklasse: d.aufbewahrungsklasse, aufbewahren_bis: d.aufbewahren_bis || null, loeschsperre: Number(d.loeschsperre) || 0,
    geloescht_am: d.geloescht_am || null, papierkorb_bis: d.papierkorb_bis || null, bezug_doctype: d.bezug_doctype || null, bezug_name: d.bezug_name || null,
    bezug_titel: d.bezug_titel || null, hochgeladen_von: d.hochgeladen_von, erstellt: d.creation, geaendert: d.modified,
  };
}

/** Mock: Frappe filtert Listen über permission_query_conditions – hier dieselbe Ordnerregel. */
function mockSichtbar(ctx, rows) {
  if (ctx.client.modus === "frappe") return rows;
  const ordner = ctx.client.tabelle(DT.ordner);
  return rows.filter((d) => {
    const o = ordner.get(d.ordner);
    return !o || darfOrdner(o.effektiver_modus, ctx.rollen, o.bezug_doctype);
  });
}

export async function ladeZuletzt(ctx, { tage: t = 30, limit = 60, bezug } = {}) {
  simuliere(ctx);
  if (ctx.sim === "leer") return [];
  const seit = new Date(Date.now() - t * 86_400_000);
  const p = (n) => String(n).padStart(2, "0");
  const grenze = `${seit.getFullYear()}-${p(seit.getMonth() + 1)}-${p(seit.getDate())} 00:00:00`;
  const filters = [["status", "=", "Aktiv"], ["modified", ">=", grenze]];
  if (bezug?.doctype) filters.push(["bezug_doctype", "=", bezug.doctype], ["bezug_name", "=", bezug.name]);
  const rows = await ctx.client.getList(DT.datei, { fields: DATEI_FELDER, filters, orderBy: "modified desc", limit: limit * 2 });
  return mockSichtbar(ctx, rows).slice(0, limit).map((d) => zeileZuDatei(d));
}

export async function ladePapierkorb(ctx) {
  simuliere(ctx);
  if (ctx.sim === "leer") return { items: [], gesamt: 0 };
  return ablage(ctx.client, "dateien", { papierkorb: 1, groesse: 200 });
}

export async function ladeDatei(ctx, name) {
  simuliere(ctx);
  const d = await ablage(ctx.client, "datei", { datei: name });
  const kette = d?.ordner ? await ladeKette(ctx, d.ordner).catch(() => []) : [];
  return { ...d, kette };
}

export async function ladeFreigabelinks(ctx, datei) {
  const r = await ablage(ctx.client, "freigabelinks", { datei, alle: 1 });
  return r?.items || [];
}

/** Ereignisse einer Datei (nur Leitung/GF/Admin laut DocType-Rechten; sonst leer). */
export async function ladeVerlauf(ctx, datei) {
  try {
    const meta = ctx.client.index?.doctypes?.get(DT.ereignis);
    if (meta && !darfDoc(ctx.session, meta, "read")) return null;
    return await ctx.client.getList(DT.ereignis, { fields: ["name", "art", "zeitpunkt", "benutzer", "version", "hinweis", "freigabelink"], filters: [["datei", "=", datei]], orderBy: "zeitpunkt desc", limit: 50 });
  } catch (err) {
    if (istBackofficeError(err) && err.code === "forbidden") return null;
    throw err;
  }
}

// ------------------------------------------------------------------ Freigaben --

const LINK_FELDER = ["name", "titel", "datei", "version", "status", "ablauf", "passwort_gesetzt", "max_downloads", "download_zaehler", "letzter_download", "empfaenger_hinweis", "erstellt_von", "creation", "widerrufen_am"];

export async function ladeFreigaben(ctx, { beendet = false } = {}) {
  simuliere(ctx);
  if (ctx.sim === "leer") return { links: [], portal: [] };
  const filters = beendet ? [["status", "in", ["Abgelaufen", "Aufgebraucht", "Widerrufen"]]] : [["status", "=", "Aktiv"]];
  const [links, portal] = await Promise.all([
    ctx.client.getList(DT.link, { fields: LINK_FELDER, filters, orderBy: beendet ? "modified desc" : "ablauf asc", limit: 200 }),
    beendet ? Promise.resolve([]) : ctx.client.getList(DT.datei, { fields: DATEI_FELDER, filters: [["portal_freigabe", "=", 1], ["status", "=", "Aktiv"]], orderBy: "modified desc", limit: 100 }),
  ]);
  const namen = [...new Set(links.map((l) => l.datei))];
  const dateien = namen.length ? await ctx.client.getList(DT.datei, { fields: DATEI_FELDER, filters: [["name", "in", namen]], limit: namen.length }) : [];
  const sichtbar = new Map(mockSichtbar(ctx, dateien).map((d) => [d.name, zeileZuDatei(d)]));
  return {
    links: links.filter((l) => sichtbar.has(l.datei)).map((l) => ({
      freigabelink: l.name, datei: l.datei, status: l.status, ablauf: l.ablauf, passwort: Number(l.passwort_gesetzt) || 0, max_downloads: Number(l.max_downloads) || null,
      downloads: Number(l.download_zaehler) || 0, letzter_download: l.letzter_download || null, empfaenger_hinweis: l.empfaenger_hinweis || null, erstellt_von: l.erstellt_von, erstellt: l.creation,
      dateiDaten: sichtbar.get(l.datei),
    })),
    portal: mockSichtbar(ctx, portal).map((d) => zeileZuDatei(d)),
  };
}

// --------------------------------------------------------------------- Bericht --

export async function ladeBericht(ctx) {
  simuliere(ctx);
  const c = ctx.client;
  const leer = ctx.sim === "leer";
  const [aktiv, korb, links] = await Promise.all([
    leer ? [] : c.getList(DT.datei, { fields: ["name", "groesse", "endung", "bezug_doctype", "creation", "aufbewahrungsklasse", "ordner"], filters: [["status", "=", "Aktiv"]], limit: 5000 }),
    leer ? 0 : c.count(DT.datei, { filters: [["status", "=", "Papierkorb"]] }),
    leer ? 0 : c.count(DT.link, { filters: [["status", "=", "Aktiv"]] }),
  ]);
  const sichtbar = mockSichtbar(ctx, aktiv);
  const summe = sichtbar.reduce((s, d) => s + (Number(d.groesse) || 0), 0);
  const jeBezug = new Map();
  const jeEndung = new Map();
  for (const d of sichtbar) {
    const b = d.bezug_doctype || "";
    jeBezug.set(b, (jeBezug.get(b) || 0) + (Number(d.groesse) || 0));
    const e = String(d.endung || "").toUpperCase() || "–";
    jeEndung.set(e, (jeEndung.get(e) || 0) + (Number(d.groesse) || 0));
  }
  // Uploads je Woche (letzte 8 Wochen, laufende zuletzt)
  const wochen = [];
  const heute = new Date();
  const montag = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - ((heute.getDay() + 6) % 7));
  for (let i = 7; i >= 0; i--) {
    const von = new Date(montag.getTime() - i * 7 * 86_400_000);
    const bis = new Date(von.getTime() + 7 * 86_400_000);
    const n = sichtbar.filter((d) => {
      const t = new Date(String(d.creation).replace(" ", "T"));
      return t >= von && t < bis;
    }).length;
    wochen.push({ von: von.toISOString().slice(0, 10), wert: n });
  }
  return {
    dateien: sichtbar.length,
    belegt: summe,
    belegtText: groesseText(summe),
    papierkorb: Number(korb) || 0,
    freigaben: Number(links) || 0,
    wochen,
    jeBezug: [...jeBezug.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ schluessel: k, wert: v })),
    jeEndung: [...jeEndung.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ schluessel: k, wert: v })),
  };
}

// ------------------------------------------------------------------- Zähler --

export async function ladeZaehler(ctx) {
  if (ctx.sim) return { papierkorb: 0, freigaben: 0 };
  const [korb, links] = await Promise.all([
    ctx.client.count(DT.datei, { filters: [["status", "=", "Papierkorb"]] }).catch(() => 0),
    ctx.client.count(DT.link, { filters: [["status", "=", "Aktiv"]] }).catch(() => 0),
  ]);
  return { papierkorb: Number(korb) || 0, freigaben: Number(links) || 0 };
}

// ------------------------------------------------------------- Bezug (Slots) --

/** Ablage eines Bezugs: Stammordner mit Unterordnern + letzte Dateien. */
export async function ladeBezug(ctx, doctype, name) {
  const r = await ablage(ctx.client, "ordner_baum", { bezug_doctype: doctype, bezug_name: name, tiefe: 2 });
  const wurzel = r?.wurzeln?.[0] || null;
  const zuletzt = wurzel ? await ladeZuletzt(ctx, { tage: 365, limit: 8, bezug: { doctype, name } }) : [];
  return { wurzel, zuletzt };
}

// ---------------------------------------------------------------- Personen --

/** Anzeigenamen für Benutzer-Mails (Avatar/Fakten): { mail → "Paul Schema" } ohne Rollenzusatz in Klammern. */
export async function ladeNamen(ctx, mails) {
  const liste = [...new Set((mails || []).filter((m) => m && m.includes("@")))].slice(0, 100);
  if (!liste.length) return {};
  try {
    const rows = await ctx.client.getList("User", { fields: ["name", "full_name"], filters: [["name", "in", liste]], limit: liste.length });
    return Object.fromEntries(rows.filter((u) => u.full_name).map((u) => [u.name, String(u.full_name).replace(/\s*\([^)]*\)\s*$/, "")]));
  } catch {
    return {};
  }
}
