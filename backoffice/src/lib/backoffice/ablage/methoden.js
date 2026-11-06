// Aufrufe der Frappe-App ph_ablage (README „Schnittstelle für das Backoffice“) – mit Mock-Pfad (MASTER Q-A3).
// Frappe-Modus: client.call("ph_ablage.api.<methode>", args) mit exakt den Parametern der App.
// Mock-Modus: dieselben Regeln gegen die Mock-Datenbank (Rechte-Modus, Sperre, Aufbewahrung, Papierkorb,
// Freigabelinks mit Token-Hash, Upload in Teilen mit Prüfsumme) – Oberfläche und E2E sehen echtes Verhalten.
// Reines Modul mit relativen Importen (läuft im Commit-Register, in Route-Handlern und unter node --test).

import { BackofficeError } from "../frappe/errors.js";
import { neuerName } from "../mock/engine.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { AUFBEWAHRUNG, DT, ERLAUBTE_BEZUEGE, KLASSEN, MB, MODI } from "./labels.js";
import {
  aufbewahrenBis, chunkPruefen, darfOrdner, dateinameBereinigen, endung, endungErlaubt, endungenListe, freigabeZustand, groesseText,
  istLeitung, loeschenErlaubt, mimeFuer, neuesToken, papierkorbBis, sperreAktiv, suchbegriffe, tagsNormalisieren, tagsText, vorschauArt,
} from "./regeln.js";
import { mockPasswortHash, sha256Hex } from "./sha256.js";
import * as speicher from "./speicher.js";

export const API = "ph_ablage.api.";

/** Alle Methoden der App (Fähigkeiten-Probe, Tests). */
export const METHODEN = Object.freeze([
  "einstellungen_info", "ordner_baum", "ordner_anlegen", "ordner_verschieben", "ordner_umbenennen", "ordner_einstellen", "ordner_loeschen",
  "dateien", "datei", "suche", "upload_start", "upload_chunk", "upload_abschliessen", "neue_version", "download_link", "vorschau_link",
  "umbenennen", "verschieben", "tags_setzen", "aufbewahrung_setzen", "sperren", "entsperren", "versionen", "version_wiederherstellen",
  "loeschen", "wiederherstellen", "endgueltig_loeschen", "freigabelink_erstellen", "freigabelinks", "freigabelink_widerrufen",
  "freigabe_aufloesen", "portal_freigeben", "bestand_uebernehmen", "speicher_umziehen",
]);

const istMock = (client) => client?.modus !== "frappe";

/**
 * Methode der Ablage aufrufen (Frappe oder Mock). Fehler kommen als BackofficeError mit `code`
 * (invalid, forbidden, not_found, conflict, locked, too_large, blocked_type, checksum_mismatch, expired,
 * password_required, invalid_token, unavailable) und ggf. `daten` (z. B. {gesperrt_von, gesperrt_bis}).
 */
export async function ablage(client, methode, args = {}) {
  if (!METHODEN.includes(methode)) throw new BackofficeError("not_found", "Diese Funktion gibt es in der Ablage nicht.");
  const sauber = Object.fromEntries(Object.entries(args || {}).filter(([, v]) => v !== undefined));
  if (!istMock(client)) return client.call(API + methode, sauber);
  const fn = MOCK[methode];
  if (!fn) throw new BackofficeError("not_found", "Diese Funktion ist im Testmodus nicht hinterlegt.");
  return fn(client, sauber);
}

// ================================================================= Mock-Kern ==

/** App-Fehlercode → HTTP-Status (wie ph_core ApiFehler) und allgemeiner Backoffice-Code. */
const APP_CODES = {
  invalid: [400, "invalid"], password_required: [401, "forbidden"], forbidden: [403, "forbidden"], not_found: [404, "not_found"],
  invalid_token: [404, "not_found"], conflict: [409, "conflict"], expired: [410, "not_found"], too_large: [413, "invalid"],
  blocked_type: [415, "invalid"], checksum_mismatch: [422, "invalid"], locked: [423, "conflict"], rate_limited: [429, "rate_limited"],
  unavailable: [503, "unavailable"],
};
const STATUS_CODES = { 401: "password_required", 410: "expired", 413: "too_large", 415: "blocked_type", 422: "checksum_mismatch", 423: "locked" };

function fehler(code, message, daten) {
  const [status, allgemein] = APP_CODES[code] || [503, "unavailable"];
  const e = new BackofficeError(allgemein, message, { status });
  e.ablage = code;
  if (daten) e.daten = daten;
  return e;
}

/** Fachlicher Fehlercode der Ablage aus Mock- oder Frappe-Fehler (Status 401/410/413/415/422/423). */
export function ablageCode(err) {
  if (!err) return null;
  if (err.ablage) return err.ablage;
  return STATUS_CODES[err.status] || err.code || "unavailable";
}

const jetzt = (client) => (client.jetzt ? client.jetzt() : new Date());
const benutzer = (client) => client.session?.user || "Administrator";
const rollen = (client) => client.session?.roles || [];
const tab = (client, dt) => client.tabelle(dt);
const ganz = (v) => Math.trunc(Number(v) || 0);
const text = (v, max = 140) => String(v ?? "").trim().slice(0, max);

function pruefeRolle(client, aktion = "read") {
  client.pruefe(client.meta(DT.datei), aktion);
}

function einstellungenDoc(client) {
  const t = tab(client, DT.einstellungen);
  return t.get(DT.einstellungen) || {};
}

function einst(client) {
  const e = einstellungenDoc(client);
  return {
    adapter: e.speicher_adapter || "lokal",
    chunk: (ganz(e.chunk_mb) || 8) * MB,
    max: (ganz(e.max_groesse_mb) || 2048) * MB,
    erlaubt: [...endungenListe(e.erlaubte_endungen)],
    gesperrt: e.gesperrte_endungen ? [...endungenListe(e.gesperrte_endungen)] : null,
    papierkorbTage: ganz(e.papierkorb_tage) || 30,
    sperreStunden: ganz(e.sperre_stunden) || 8,
    freigabeTage: ganz(e.freigabe_standard_tage) || 7,
    freigabeMax: ganz(e.freigabe_max_tage) || 90,
    passwortPflicht: ganz(e.freigabe_passwort_pflicht),
    basis: e.freigabe_basis_url || "",
    office: Boolean(ganz(e.office_vorschau) && e.soffice_pfad),
    duplikat: e.duplikat_verhalten || "melden",
  };
}

function ordnerDoc(client, name) {
  const o = tab(client, DT.ordner).get(name);
  if (!o) throw fehler("not_found", "Ordner nicht gefunden.");
  return o;
}

function zugriffOrdner(client, o) {
  return darfOrdner(o.effektiver_modus || "intern", rollen(client), o.bezug_doctype || null);
}

function pruefeOrdner(client, name, aktion = "read") {
  const o = ordnerDoc(client, name);
  pruefeRolle(client, aktion);
  if (!zugriffOrdner(client, o)) throw fehler("forbidden", "Keine Berechtigung für diesen Ordner.");
  return o;
}

function dateiDoc(client, name) {
  const d = tab(client, DT.datei).get(name);
  if (!d || d.status === "Hochladen" && !d._upload) throw fehler("not_found", "Datei nicht gefunden.");
  return d;
}

function pruefeDatei(client, name, aktion = "read") {
  const d = dateiDoc(client, name);
  pruefeRolle(client, aktion);
  const o = tab(client, DT.ordner).get(d.ordner);
  if (o && !zugriffOrdner(client, o)) throw fehler("forbidden", "Keine Berechtigung für diese Datei.");
  return d;
}

function anfassen(client, d) {
  d.modified = isoDatumZeit(jetzt(client));
  d.modified_by = benutzer(client);
}

function protokoll(client, art, { datei, ordner, version, freigabelink, hinweis, bezug_doctype, bezug_name, automatisch = 0 } = {}) {
  const t = tab(client, DT.ereignis);
  const name = `abl-ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const zeit = isoDatumZeit(jetzt(client));
  t.set(name, {
    name, doctype: DT.ereignis, titel: `${art}${datei ? ` · ${datei}` : ""}`, art, zeitpunkt: zeit, benutzer: benutzer(client),
    datei: datei || "", ordner: ordner || "", version: version || 0, freigabelink: freigabelink || "", bezug_doctype: bezug_doctype || "",
    bezug_name: bezug_name || "", hinweis: hinweis || "", automatisch, owner: benutzer(client), creation: zeit, modified: zeit, docstatus: 0,
  });
}

// ------------------------------------------------------------------ Payloads --

function anzahlDateien(client) {
  const m = new Map();
  for (const d of tab(client, DT.datei).values()) if (d.status === "Aktiv") m.set(d.ordner, (m.get(d.ordner) || 0) + 1);
  return m;
}

export function ordnerPayload(o, anzahl = null) {
  return {
    ordner: o.name, titel: o.titel, eltern: o.parent_ph_ordner || null, pfad: o.pfad,
    bezug_doctype: o.bezug_doctype || null, bezug_name: o.bezug_name || null, bezug_titel: o.bezug_titel || null,
    rechte_modus: o.rechte_modus || null, effektiver_modus: o.effektiver_modus || "intern",
    farbe: o.farbe || null, icon: o.icon || null, geschuetzt: ganz(o.geschuetzt), ist_bezugswurzel: ganz(o.ist_bezugswurzel),
    aufbewahrungsklasse: o.aufbewahrungsklasse || null, anzahl_dateien: anzahl,
  };
}

function sperreJetzt(client, d) {
  return sperreAktiv(d, jetzt(client));
}

export function dateiPayload(client, d, mitVersionen = false) {
  const aktiv = sperreJetzt(client, d);
  const p = {
    datei: d.name, dateiname: d.dateiname, ordner: d.ordner, status: d.status, endung: d.endung, mime: d.mime,
    groesse: ganz(d.groesse), groesse_text: groesseText(d.groesse), version: ganz(d.aktuelle_version), sha256: d.sha256 || null,
    tags: tagsNormalisieren(d.tags), beschreibung: d.beschreibung || null,
    vorschau_art: d.vorschau_art, vorschau_status: d.vorschau_status,
    gesperrt_von: aktiv ? d.gesperrt_von : null, gesperrt_bis: aktiv ? d.gesperrt_bis : null,
    portal_freigabe: ganz(d.portal_freigabe), portal_ablauf: d.portal_ablauf || null,
    freigabelinks_aktiv: ganz(d.freigabelinks_aktiv),
    aufbewahrungsklasse: d.aufbewahrungsklasse, aufbewahren_bis: d.aufbewahren_bis || null, loeschsperre: ganz(d.loeschsperre),
    geloescht_am: d.geloescht_am || null, papierkorb_bis: d.papierkorb_bis || null,
    bezug_doctype: d.bezug_doctype || null, bezug_name: d.bezug_name || null, bezug_titel: d.bezug_titel || null,
    hochgeladen_von: d.hochgeladen_von, erstellt: d.creation, geaendert: d.modified,
  };
  if (mitVersionen) p.versionen = [...(d.versionen || [])].sort((a, b) => ganz(b.version) - ganz(a.version)).map(versionPayload);
  return p;
}

function versionPayload(v) {
  return {
    version: ganz(v.version), groesse: ganz(v.groesse), sha256: v.sha256, geprueft: ganz(v.geprueft), hochgeladen_von: v.hochgeladen_von,
    hochgeladen_am: v.hochgeladen_am, kommentar: v.kommentar || null, dateiname: v.dateiname_damals, wiederhergestellt_aus: ganz(v.wiederhergestellt_aus) || null,
  };
}

export function linkPayload(l) {
  return {
    freigabelink: l.name, datei: l.datei, version: ganz(l.version) || null, status: l.status, ablauf: l.ablauf || null,
    passwort: ganz(l.passwort_gesetzt), max_downloads: ganz(l.max_downloads) || null, downloads: ganz(l.download_zaehler),
    letzter_download: l.letzter_download || null, empfaenger_hinweis: l.empfaenger_hinweis || null, erstellt_von: l.erstellt_von, erstellt: l.creation,
  };
}

function freigabenZaehlen(client, datei) {
  const d = tab(client, DT.datei).get(datei);
  if (!d) return;
  d.freigabelinks_aktiv = [...tab(client, DT.link).values()].filter((l) => l.datei === datei && l.status === "Aktiv").length;
}

// ------------------------------------------------------------------ Baum --

function baum(client, wurzeln, tiefe) {
  const alle = [...tab(client, DT.ordner).values()];
  const kinderVon = new Map();
  for (const o of alle) {
    const e = o.parent_ph_ordner || "";
    if (!kinderVon.has(e)) kinderVon.set(e, []);
    kinderVon.get(e).push(o);
  }
  const anzahl = anzahlDateien(client);
  const knoten = (o, t) => ({
    ...ordnerPayload(o, anzahl.get(o.name) || 0),
    kinder: t < tiefe ? (kinderVon.get(o.name) || []).filter((k) => zugriffOrdner(client, k)).sort((a, b) => a.titel.localeCompare(b.titel, "de")).map((k) => knoten(k, t + 1)) : [],
    hat_kinder: (kinderVon.get(o.name) || []).some((k) => zugriffOrdner(client, k)) ? 1 : 0,
  });
  return wurzeln.filter((o) => zugriffOrdner(client, o)).map((o) => knoten(o, 0));
}

function vorlage(dt) {
  return {
    "PH Projekt": [["01 Aufmaß"], ["02 Planung & Handzeichnung"], ["03 Renderings"], ["04 Angebote & Verträge", "Beleg"], ["05 Herstellerunterlagen"], ["06 Montage & Abnahme"], ["07 Fotos"], ["08 Service"]],
    "PH Kontakt": [["01 Korrespondenz"], ["02 Angebote & Verträge", "Beleg"], ["03 Pläne & Fotos"]],
    "PH Lieferant": [["01 Verträge & Konditionen", "Beleg"], ["02 Preislisten & Kataloge"], ["03 Datenblätter & Zertifikate"], ["04 Korrespondenz"]],
    "PH Mitarbeiter": [["01 Vertrag", "Personal"], ["02 Lohn & Abrechnung", "Personal"], ["03 Zeugnisse & Nachweise", "Personal"], ["04 Schulungen", "Personal"]],
    "PH Servicefall": [["01 Fotos & Videos"], ["02 Herstellerkorrespondenz"], ["03 Berichte"]],
  }[dt] || [];
}

const BEREICHSORDNER = { "PH Kontakt": "Kontakte", "PH Projekt": "Projekte", "PH Lieferant": "Lieferanten", "PH Mitarbeiter": "Mitarbeiter", "PH Servicefall": "Servicefälle" };

function neuerOrdner(client, titel, eltern, werte = {}) {
  const meta = client.meta(DT.ordner);
  const zeit = isoDatumZeit(jetzt(client));
  const modus = werte.rechte_modus || "";
  const doc = {
    doctype: DT.ordner, naming_series: "PH-ORD-.######", titel, parent_ph_ordner: eltern?.name || "", is_group: 1,
    bezug_doctype: eltern?.bezug_doctype || "", bezug_name: eltern?.bezug_name || "", bezug_titel: eltern?.bezug_titel || "", ist_bezugswurzel: 0,
    rechte_modus: modus, mitglieder: [], farbe: "", icon: "", aufbewahrungsklasse: "", geschuetzt: 0, vorlage: "", beschreibung: "", quelle: "backoffice",
    owner: benutzer(client), modified_by: benutzer(client), creation: zeit, modified: zeit, docstatus: 0, idx: 0,
    ...werte,
  };
  doc.effektiver_modus = eltern ? effektiv(eltern.effektiver_modus, modus) : modus || "intern";
  doc.pfad = eltern ? `${eltern.pfad} / ${titel}` : titel;
  doc.name = neuerName(meta, doc, (p) => client.naechsteNummer(p), jetzt(client));
  tab(client, DT.ordner).set(doc.name, doc);
  return doc;
}

function effektiv(elternModus, eigener) {
  const s = { intern: 0, team: 1, leitung: 2 };
  const a = elternModus || "intern";
  const b = eigener || a;
  return s[b] >= s[a] ? b : a;
}

function wurzelFuerBezug(client, dt, name, anlegen) {
  const t = tab(client, DT.ordner);
  const da = [...t.values()].find((o) => o.bezug_doctype === dt && o.bezug_name === name && ganz(o.ist_bezugswurzel));
  if (da || !anlegen) return da || null;
  const bereichTitel = BEREICHSORDNER[dt];
  let bereich = [...t.values()].find((o) => !o.parent_ph_ordner && (o.vorlage === `bereich:${dt}` || o.titel === bereichTitel));
  if (!bereich) bereich = neuerOrdner(client, bereichTitel, null, { geschuetzt: 1, quelle: "vorlage", vorlage: `bereich:${dt}`, bezug_doctype: dt, rechte_modus: dt === "PH Mitarbeiter" ? "leitung" : "" });
  const bezug = tab(client, dt).get(name);
  const titel = bezug?.titel || bezug?.projektname || bezug?.kontaktname || bezug?.vollstaendiger_name || name;
  const w = neuerOrdner(client, `${name} · ${titel}`, bereich, { bezug_doctype: dt, bezug_name: name, bezug_titel: titel, ist_bezugswurzel: 1, geschuetzt: 1, quelle: "vorlage", vorlage: dt.replace("PH ", "") });
  for (const [titelV, klasse] of vorlage(dt)) neuerOrdner(client, titelV, w, { aufbewahrungsklasse: klasse || "", geschuetzt: 1, quelle: "vorlage", vorlage: w.vorlage });
  protokoll(client, "Ordner angelegt", { ordner: w.name, bezug_doctype: dt, bezug_name: name, automatisch: 1 });
  return w;
}

function unterbaum(client, name) {
  const out = [];
  const stapel = [name];
  const alle = [...tab(client, DT.ordner).values()];
  while (stapel.length) {
    const n = stapel.pop();
    for (const o of alle) if (o.parent_ph_ordner === n) {
      out.push(o);
      stapel.push(o.name);
    }
  }
  return out;
}

function unterbaumAktualisieren(client, o) {
  const karte = tab(client, DT.ordner);
  const neu = (x) => {
    const e = x.parent_ph_ordner ? karte.get(x.parent_ph_ordner) : null;
    x.pfad = e ? `${e.pfad} / ${x.titel}` : x.titel;
    x.effektiver_modus = e ? effektiv(e.effektiver_modus, x.rechte_modus) : x.rechte_modus || "intern";
    if (e && !ganz(x.ist_bezugswurzel)) Object.assign(x, { bezug_doctype: e.bezug_doctype || "", bezug_name: e.bezug_name || "", bezug_titel: e.bezug_titel || "" });
  };
  neu(o);
  const kette = [o, ...unterbaum(client, o.name)];
  // Reihenfolge Eltern vor Kindern (unterbaum ist Tiefensuche von oben)
  for (const x of kette.slice(1)) neu(x);
  const namen = new Set(kette.map((x) => x.name));
  for (const d of tab(client, DT.datei).values()) {
    if (!namen.has(d.ordner)) continue;
    const x = karte.get(d.ordner);
    Object.assign(d, { effektiver_modus: x.effektiver_modus, bezug_doctype: x.bezug_doctype, bezug_name: x.bezug_name, bezug_titel: x.bezug_titel });
  }
}

function geschwisterTitel(client, elternName, titel, ausser) {
  return [...tab(client, DT.ordner).values()].some((o) => (o.parent_ph_ordner || "") === (elternName || "") && o.name !== ausser && o.titel.toLowerCase() === titel.toLowerCase());
}

// ------------------------------------------------------------- Dateiliste --

const SORT = {
  name: (a, b) => a.dateiname.localeCompare(b.dateiname, "de"),
  "-name": (a, b) => b.dateiname.localeCompare(a.dateiname, "de"),
  groesse: (a, b) => ganz(a.groesse) - ganz(b.groesse),
  "-groesse": (a, b) => ganz(b.groesse) - ganz(a.groesse),
  geaendert: (a, b) => String(a.modified).localeCompare(String(b.modified)),
  "-geaendert": (a, b) => String(b.modified).localeCompare(String(a.modified)),
  erstellt: (a, b) => String(a.creation).localeCompare(String(b.creation)),
  "-erstellt": (a, b) => String(b.creation).localeCompare(String(a.creation)),
  endung: (a, b) => String(a.endung).localeCompare(String(b.endung)) || a.dateiname.localeCompare(b.dateiname, "de"),
};

function seiteGroesse(seite, groesse) {
  const s = Math.max(ganz(seite) || 1, 1);
  const g = Math.min(Math.max(ganz(groesse) || 50, 1), 200);
  return { seite: s, groesse: g, start: (s - 1) * g };
}

function duplikate(client, sha, ausser) {
  if (!/^[0-9a-f]{64}$/.test(String(sha || "").toLowerCase())) return [];
  return [...tab(client, DT.datei).values()]
    .filter((d) => d.sha256 === String(sha).toLowerCase() && ["Aktiv", "Papierkorb"].includes(d.status) && d.name !== ausser)
    .slice(0, 5)
    .map((d) => ({ datei: d.name, dateiname: d.dateiname, ordner: d.ordner, status: d.status, ordner_titel: tab(client, DT.ordner).get(d.ordner)?.titel || null }));
}

// ---------------------------------------------------------------- Sperren --

function sperrePruefen(client, d, erzwingen = false) {
  if (sperreJetzt(client, d) && d.gesperrt_von !== benutzer(client)) {
    if (erzwingen && istLeitung(rollen(client), d.bezug_doctype)) return;
    throw fehler("locked", "Die Datei ist von einer anderen Person ausgecheckt.", { gesperrt_von: d.gesperrt_von, gesperrt_bis: d.gesperrt_bis });
  }
}

function schreiben(client, name) {
  const d = pruefeDatei(client, name, "write");
  if (d.status !== "Aktiv") throw fehler("conflict", "Die Datei liegt im Papierkorb.");
  sperrePruefen(client, d);
  return d;
}

function loeschenPruefen(client, d, endgueltig = false) {
  const leitung = istLeitung(rollen(client), d.bezug_doctype);
  const r = loeschenErlaubt(d.aufbewahrungsklasse, d.aufbewahren_bis, jetzt(client), leitung);
  if (!r.ok && r.grund === "aufbewahrung") throw fehler("locked", `Aufbewahrungspflicht bis ${d.aufbewahren_bis} – Löschen nicht möglich.`, { grund: "aufbewahrung", aufbewahren_bis: d.aufbewahren_bis });
  if (!r.ok) throw fehler("forbidden", `Nur die Leitung darf Dateien der Klasse ${d.aufbewahrungsklasse} löschen.`, { grund: r.grund });
  if (endgueltig && !leitung) throw fehler("forbidden", "Endgültig löschen darf nur die Leitung.");
}

// ------------------------------------------------------------------ Upload --

function uploadStart(client, { d, ordner, dateiname, groesse, mime, sha256, kommentar, einchecken = 1, neu }) {
  const e = einst(client);
  const g = ganz(groesse);
  if (g < 0) throw fehler("invalid", "Größe ungültig.");
  if (g > e.max) throw fehler("too_large", `Die Datei ist größer als ${groesseText(e.max)}.`);
  const end = endung(dateiname);
  const ok = endungErlaubt(end, e.erlaubt.length ? e.erlaubt : null, e.gesperrt);
  if (!ok.ok) throw fehler("blocked_type", `.${end || "?"} ist nicht erlaubt.`);
  const version = neu ? 1 : ganz(d.aktuelle_version) + 1;
  const token = neuesToken(32);
  speicher.uploadSetzen(token, { datei: d.name, version, groesse: g, dateiname, mime: mimeFuer(dateiname, mime), sha256: sha256 ? String(sha256).toLowerCase() : null, kommentar: kommentar || "", einchecken: ganz(einchecken), user: benutzer(client), neu, modus: "teile" });
  const ablauf = new Date(jetzt(client).getTime() + 24 * 3600_000);
  return { token, datei: d.name, version, ablauf: isoDatumZeit(ablauf), ziel: { art: "teile", methode: `${API}upload_chunk`, chunk_bytes: e.chunk }, duplikate: sha256 ? duplikate(client, sha256, d.name) : [] };
}

function base64Bytes(daten) {
  try {
    if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(String(daten), "base64"));
    const bin = atob(String(daten));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

// =============================================================== Mock-API ==

const MOCK = {
  einstellungen_info(client) {
    pruefeRolle(client, "read");
    const e = einst(client);
    return {
      adapter: e.adapter, max_bytes: e.max, chunk_bytes: e.chunk, erlaubte_endungen: e.erlaubt, gesperrte_endungen: e.gesperrt || [],
      papierkorb_tage: e.papierkorbTage, sperre_stunden: e.sperreStunden, freigabe_standard_tage: e.freigabeTage, freigabe_max_tage: e.freigabeMax,
      freigabe_passwort_pflicht: e.passwortPflicht, direkt_upload: e.adapter === "s3", office_vorschau: e.office, portal: true,
      aufbewahrungsklassen: KLASSEN.map((k) => ({ klasse: k, jahre: AUFBEWAHRUNG[k].jahre, sperre: AUFBEWAHRUNG[k].sperre, hinweis: AUFBEWAHRUNG[k].hinweis })),
      modi: [...MODI], bezuege: [...ERLAUBTE_BEZUEGE],
      konfig_status: einstellungenDoc(client).konfig_status || "",
      freigabe_basis_url: e.basis || null,
    };
  },

  ordner_baum(client, { bezug_doctype, bezug_name, ordner, tiefe }) {
    pruefeRolle(client, "read");
    if (bezug_doctype || bezug_name) {
      if (!bezug_doctype || !bezug_name) throw fehler("invalid", "Bezug unvollständig.");
      if (!ERLAUBTE_BEZUEGE.includes(bezug_doctype)) throw fehler("invalid", "Bezugsart nicht vorgesehen.");
      let darfAnlegen = true;
      try {
        client.pruefe(client.meta(DT.ordner), "create");
      } catch {
        darfAnlegen = false;
      }
      const w = wurzelFuerBezug(client, bezug_doctype, bezug_name, darfAnlegen && tab(client, bezug_doctype).has(bezug_name));
      return { wurzeln: w ? baum(client, [w], tiefe != null ? ganz(tiefe) : 10) : [] };
    }
    if (ordner) {
      const o = pruefeOrdner(client, ordner);
      return { wurzeln: baum(client, [o], tiefe != null ? ganz(tiefe) : 10) };
    }
    const wurzeln = [...tab(client, DT.ordner).values()].filter((o) => !o.parent_ph_ordner).sort((a, b) => a.titel.localeCompare(b.titel, "de"));
    return { wurzeln: baum(client, wurzeln, tiefe != null ? ganz(tiefe) : 1) };
  },

  ordner_anlegen(client, { titel, eltern, bezug_doctype, bezug_name, rechte_modus, farbe, icon, aufbewahrungsklasse }) {
    const t = text(titel, 140).replace(/[/\\]/g, "-");
    if (!t) throw fehler("invalid", "Name fehlt.");
    pruefeRolle(client, "create");
    let e = null;
    if (eltern) e = pruefeOrdner(client, eltern, "create");
    else if (bezug_doctype && bezug_name) e = wurzelFuerBezug(client, bezug_doctype, bezug_name, true);
    if (rechte_modus && !MODI.includes(rechte_modus)) throw fehler("invalid", "Zugriff ungültig.");
    if (geschwisterTitel(client, e?.name || "", t)) {
      const da = [...tab(client, DT.ordner).values()].find((o) => (o.parent_ph_ordner || "") === (e?.name || "") && o.titel.toLowerCase() === t.toLowerCase());
      return ordnerPayload(da, 0); // idempotent wie in der App
    }
    const o = neuerOrdner(client, t, e, { rechte_modus: rechte_modus || "", farbe: farbe || "", icon: icon || "", aufbewahrungsklasse: aufbewahrungsklasse || "" });
    protokoll(client, "Ordner angelegt", { ordner: o.name, bezug_doctype: o.bezug_doctype, bezug_name: o.bezug_name });
    return ordnerPayload(o, 0);
  },

  ordner_verschieben(client, { ordner, eltern }) {
    const o = pruefeOrdner(client, ordner, "write");
    if (ganz(o.geschuetzt)) throw fehler("conflict", "Vorlagenordner lassen sich nicht verschieben.");
    const e = eltern ? pruefeOrdner(client, eltern, "write") : null;
    if (e && (e.name === o.name || unterbaum(client, o.name).some((x) => x.name === e.name))) throw fehler("invalid", "Ein Ordner kann nicht in sich selbst liegen.");
    if (geschwisterTitel(client, e?.name || "", o.titel, o.name)) throw fehler("conflict", "Im Zielordner gibt es schon einen Ordner mit diesem Namen.");
    o.parent_ph_ordner = e?.name || "";
    unterbaumAktualisieren(client, o);
    anfassen(client, o);
    protokoll(client, "Ordner verschoben", { ordner: o.name });
    return ordnerPayload(o);
  },

  ordner_umbenennen(client, { ordner, titel }) {
    const o = pruefeOrdner(client, ordner, "write");
    const t = text(titel, 140).replace(/[/\\]/g, "-");
    if (!t) throw fehler("invalid", "Name fehlt.");
    if (ganz(o.geschuetzt) && !istLeitung(rollen(client), o.bezug_doctype)) throw fehler("forbidden", "Vorlagenordner benennt nur die Leitung um.");
    if (geschwisterTitel(client, o.parent_ph_ordner, t, o.name)) throw fehler("conflict", "Es gibt schon einen Ordner mit diesem Namen.");
    o.titel = t;
    unterbaumAktualisieren(client, o);
    anfassen(client, o);
    protokoll(client, "Ordner umbenannt", { ordner: o.name });
    return ordnerPayload(o);
  },

  ordner_einstellen(client, { ordner, rechte_modus, farbe, icon, aufbewahrungsklasse, beschreibung }) {
    const o = pruefeOrdner(client, ordner, "write");
    if (rechte_modus !== undefined) {
      const m = rechte_modus || "";
      if (m && !MODI.includes(m)) throw fehler("invalid", "Zugriff ungültig.");
      const s = { "": -1, intern: 0, team: 1, leitung: 2 };
      if (s[m] < s[o.rechte_modus || ""] && !istLeitung(rollen(client), o.bezug_doctype)) throw fehler("forbidden", "Lockern darf nur die Leitung.");
      o.rechte_modus = m;
    }
    if (farbe !== undefined) o.farbe = farbe || "";
    if (icon !== undefined) o.icon = icon || "";
    if (aufbewahrungsklasse !== undefined) {
      if (aufbewahrungsklasse && !KLASSEN.includes(aufbewahrungsklasse)) throw fehler("invalid", "Klasse ungültig.");
      o.aufbewahrungsklasse = aufbewahrungsklasse || "";
    }
    if (beschreibung !== undefined) o.beschreibung = text(beschreibung, 1000);
    unterbaumAktualisieren(client, o);
    anfassen(client, o);
    return ordnerPayload(o);
  },

  ordner_loeschen(client, { ordner }) {
    const o = pruefeOrdner(client, ordner, "write");
    if (ganz(o.geschuetzt)) throw fehler("conflict", "Vorlagenordner lassen sich nicht löschen.");
    if (unterbaum(client, o.name).length || [...tab(client, DT.datei).values()].some((d) => d.ordner === o.name && d.status !== "Hochladen")) throw fehler("conflict", "Der Ordner ist nicht leer.");
    tab(client, DT.ordner).delete(o.name);
    protokoll(client, "Ordner geloescht", { ordner: o.name, hinweis: o.titel });
    return { ordner: o.name, geloescht: true };
  },

  dateien(client, { ordner, suche, tags, sort, seite, groesse, papierkorb, endung: end }) {
    const { seite: s, groesse: g, start } = seiteGroesse(seite, groesse);
    const korb = ganz(papierkorb);
    let info = null;
    if (ordner) {
      info = ordnerPayload(pruefeOrdner(client, ordner));
    } else if (!korb) {
      throw fehler("invalid", "Ordner fehlt.");
    } else pruefeRolle(client, "read");
    const ordnerKarte = tab(client, DT.ordner);
    let rows = [...tab(client, DT.datei).values()].filter((d) => d.status === (korb ? "Papierkorb" : "Aktiv"));
    if (ordner) rows = rows.filter((d) => d.ordner === ordner);
    else rows = rows.filter((d) => {
      const o = ordnerKarte.get(d.ordner);
      return !o || zugriffOrdner(client, o);
    });
    if (end) {
      const liste = String(end).toLowerCase().split(",").map((x) => x.trim().replace(/^\./, "")).filter(Boolean);
      rows = rows.filter((d) => liste.includes(String(d.endung).toLowerCase()));
    }
    if (suche) {
      const q = text(suche, 100).toLowerCase();
      rows = rows.filter((d) => [d.dateiname, d.tags, d.beschreibung].some((x) => String(x || "").toLowerCase().includes(q)));
    }
    const tl = tagsNormalisieren(tags || []);
    if (tl.length) {
      const gesucht = tl.map((t) => t.toLowerCase());
      rows = rows.filter((d) => {
        const hatT = tagsNormalisieren(d.tags).map((t) => t.toLowerCase());
        return gesucht.every((t) => hatT.includes(t));
      });
    }
    rows.sort(korb && !ordner ? (a, b) => String(b.geloescht_am).localeCompare(String(a.geloescht_am)) : SORT[sort] || SORT.name);
    return { items: rows.slice(start, start + g).map((d) => dateiPayload(client, d)), seite: s, groesse: g, gesamt: rows.length, ordner: info };
  },

  datei(client, { datei }) {
    const d = pruefeDatei(client, datei);
    const p = dateiPayload(client, d, true);
    p.metadaten = d.metadaten_json ? safeJson(d.metadaten_json) : null;
    p.freigabelinks = [...tab(client, DT.link).values()].filter((l) => l.datei === d.name && l.status === "Aktiv").map(linkPayload);
    p.ordner_pfad = tab(client, DT.ordner).get(d.ordner)?.pfad || null;
    return p;
  },

  suche(client, { q, bezug_doctype, bezug_name, endung: end, limit }) {
    pruefeRolle(client, "read");
    const begriffe = suchbegriffe(q);
    if (!begriffe.length) throw fehler("invalid", "Mindestens 2 Zeichen.");
    const ordnerKarte = tab(client, DT.ordner);
    const max = Math.min(Math.max(ganz(limit) || 50, 1), 200);
    const out = [];
    for (const d of tab(client, DT.datei).values()) {
      if (d.status !== "Aktiv") continue;
      if (bezug_doctype && d.bezug_doctype !== bezug_doctype) continue;
      if (bezug_name && d.bezug_name !== bezug_name) continue;
      if (end && String(d.endung) !== String(end).toLowerCase()) continue;
      const o = ordnerKarte.get(d.ordner);
      if (o && !zugriffOrdner(client, o)) continue;
      const felder = { name: d.dateiname, tags: d.tags, beschreibung: d.beschreibung, bezug: d.bezug_titel, inhalt: d.volltext };
      const treffer = [];
      let alle = true;
      for (const b of begriffe) {
        const bl = b.toLowerCase();
        const in_ = Object.entries(felder).filter(([, v]) => String(v || "").toLowerCase().includes(bl)).map(([k]) => k);
        if (!in_.length) alle = false;
        treffer.push(...in_);
      }
      if (!alle) continue;
      const p = dateiPayload(client, d);
      p.treffer_in = [...new Set(treffer)];
      p.ordner_pfad = o?.pfad || null;
      p.schnipsel = p.treffer_in.includes("inhalt") ? schnipsel(d.volltext, begriffe[0]) : null;
      out.push(p);
      if (out.length >= max) break;
    }
    return out;
  },

  upload_start(client, { ordner, dateiname, groesse, mime, sha256, kommentar }) {
    if (!ordner || !dateiname || groesse == null) throw fehler("invalid", "Ordner, Name und Größe sind Pflicht.");
    const o = pruefeOrdner(client, ordner, "create");
    const name = dateinameBereinigen(dateiname);
    if (!name) throw fehler("invalid", "Dateiname fehlt.");
    const meta = client.meta(DT.datei);
    const zeit = isoDatumZeit(jetzt(client));
    const end = endung(name);
    const klasse = o.aufbewahrungsklasse || ([...kette(client, o)].reverse().find((x) => x.aufbewahrungsklasse)?.aufbewahrungsklasse) || "Allgemein";
    const d = {
      doctype: DT.datei, naming_series: "PH-DAT-.YYYY.-.######", dateiname: name, ordner: o.name, status: "Hochladen", _upload: 1,
      bezug_doctype: o.bezug_doctype || "", bezug_name: o.bezug_name || "", bezug_titel: o.bezug_titel || "", endung: end, mime: mimeFuer(name, mime),
      groesse: ganz(groesse), groesse_text: groesseText(groesse), aktuelle_version: 0, sha256: "", vorschau_art: vorschauArt(end), vorschau_status: "Keine",
      tags: "", beschreibung: "", versionen: [], portal_freigabe: 0, freigabelinks_aktiv: 0, gesperrt_von: "", gesperrt_bis: "", gesperrt_hinweis: "",
      aufbewahrungsklasse: klasse, belegdatum: klasse === "Beleg" ? isoDatum(jetzt(client)) : "", aufbewahren_bis: "", loeschsperre: 0, geloescht: 0,
      effektiver_modus: o.effektiver_modus, hochgeladen_von: benutzer(client), hochgeladen_am: zeit, quelle: "backoffice",
      owner: benutzer(client), modified_by: benutzer(client), creation: zeit, modified: zeit, docstatus: 0, idx: 0,
    };
    if (klasse === "Beleg") {
      d.aufbewahren_bis = aufbewahrenBis(klasse, d.belegdatum) || "";
      d.loeschsperre = 1;
    }
    d.name = neuerName(meta, d, (p) => client.naechsteNummer(p), jetzt(client));
    const r = uploadStart(client, { d, ordner: o.name, dateiname: name, groesse, mime, sha256, kommentar, neu: true });
    tab(client, DT.datei).set(d.name, d);
    return r;
  },

  upload_chunk(client, { token, offset = 0, daten }) {
    const u = speicher.uploadHolen(token);
    if (!u || u.user !== benutzer(client)) throw fehler("invalid_token", "Upload nicht gefunden oder abgelaufen.");
    const teil = base64Bytes(daten);
    if (!teil || !teil.byteLength) throw fehler("invalid", "Teil fehlt.");
    const o = ganz(offset);
    if (o < u.erhalten && o + teil.byteLength <= u.erhalten) return { erhalten: u.erhalten, groesse: u.groesse, fertig: u.erhalten === u.groesse };
    const r = chunkPruefen(o, teil.byteLength, u.erhalten, u.groesse, einst(client).chunk);
    if (!r.ok) throw fehler(r.code === "offset" ? "conflict" : "invalid", `Teil passt nicht (${r.code}).`, { erhalten: u.erhalten, grund: r.code });
    const neu = speicher.uploadTeil(token, teil);
    return { erhalten: neu.erhalten, groesse: neu.groesse, fertig: neu.erhalten === neu.groesse };
  },

  upload_abschliessen(client, { token, sha256, bei_duplikat }) {
    const u = speicher.uploadHolen(token);
    if (!u || u.user !== benutzer(client)) throw fehler("invalid_token", "Upload nicht gefunden oder abgelaufen.");
    const d = tab(client, DT.datei).get(u.datei);
    if (!d) throw fehler("invalid_token", "Upload nicht gefunden.");
    if (u.erhalten !== u.groesse) throw fehler("conflict", "Upload unvollständig.", { erhalten: u.erhalten, groesse: u.groesse });
    const bytes = speicher.uploadBytes(token);
    const ist = sha256Hex(bytes);
    const soll = String(sha256 || "").toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(soll) || ist !== soll) throw fehler("checksum_mismatch", "Die Prüfsumme stimmt nicht – bitte erneut hochladen.");
    const dups = duplikate(client, ist, d.name);
    const verhalten = bei_duplikat || einst(client).duplikat;
    if (dups.length && u.neu && verhalten === "verwerfen") {
      tab(client, DT.datei).delete(d.name);
      speicher.uploadEntfernen(token);
      return { datei: dups[0].datei, duplikat: true, verworfen: true, duplikate: dups };
    }
    const zeit = isoDatumZeit(jetzt(client));
    speicher.legeAb(speicher.schluessel(d.name, u.version), bytes, u.mime);
    d.versionen = [...(d.versionen || []), { version: u.version, hochgeladen_am: zeit, hochgeladen_von: benutzer(client), groesse: u.groesse, kommentar: u.kommentar || "", dateiname_damals: u.dateiname, endung: endung(u.dateiname), mime: u.mime, sha256: ist, geprueft: 1, wiederhergestellt_aus: 0, speicher: "lokal", schluessel: `${new Date().getFullYear()}/${d.name}/${u.version}-${ist.slice(0, 8)}.${endung(u.dateiname) || "bin"}` }];
    Object.assign(d, { status: "Aktiv", aktuelle_version: u.version, sha256: ist, groesse: u.groesse, groesse_text: groesseText(u.groesse), mime: u.mime, vorschau_status: ["bild", "pdf", "video", "audio", "text"].includes(d.vorschau_art) ? "Browser" : d.vorschau_art === "office" ? "Nicht moeglich" : "Keine" });
    delete d._upload;
    if (!u.neu && u.einchecken && d.gesperrt_von === benutzer(client)) Object.assign(d, { gesperrt_von: "", gesperrt_bis: "", gesperrt_hinweis: "" });
    anfassen(client, d);
    speicher.uploadEntfernen(token);
    protokoll(client, u.neu ? "Upload" : "Neue Version", { datei: d.name, version: u.version, ordner: d.ordner, bezug_doctype: d.bezug_doctype, bezug_name: d.bezug_name });
    return { ...dateiPayload(client, d), duplikat: dups.length > 0, verworfen: false, duplikate: dups };
  },

  neue_version(client, { datei, groesse, dateiname, mime, sha256, kommentar, einchecken = 1 }) {
    const d = schreiben(client, datei);
    const name = dateiname ? dateinameBereinigen(dateiname) : d.dateiname;
    if (!name) throw fehler("invalid", "Dateiname fehlt.");
    if (endung(name) !== d.endung) throw fehler("conflict", `Neue Version muss wieder .${d.endung} sein.`);
    return uploadStart(client, { d, ordner: d.ordner, dateiname: name, groesse, mime, sha256, kommentar, einchecken, neu: false });
  },

  download_link(client, { datei, version, inline = 0 }) {
    const d = pruefeDatei(client, datei);
    if (d.status === "Papierkorb") throw fehler("conflict", "Die Datei liegt im Papierkorb.");
    const v = versionZeile(d, version);
    protokoll(client, "Download", { datei: d.name, version: v.version, bezug_doctype: d.bezug_doctype, bezug_name: d.bezug_name });
    const ablauf = new Date(jetzt(client).getTime() + 300_000);
    return { datei: d.name, url: `mock:${speicher.schluessel(d.name, v.version)}`, art: "proxy", ablauf: isoDatumZeit(ablauf), dateiname: d.dateiname, groesse: ganz(v.groesse || d.groesse), mime: v.mime || d.mime, version: v.version, inline: ganz(inline) };
  },

  vorschau_link(client, { datei, version }) {
    const d = pruefeDatei(client, datei);
    const v = versionZeile(d, version);
    return { datei: d.name, vorschau_status: d.vorschau_status, url: ["Fertig", "Browser"].includes(d.vorschau_status) ? `mock:${speicher.schluessel(d.name, v.version)}` : null, mime: d.mime, version: v.version };
  },

  umbenennen(client, { datei, dateiname }) {
    const d = schreiben(client, datei);
    const b = dateinameBereinigen(dateiname);
    if (!b) throw fehler("invalid", "Name fehlt.");
    const neu = endung(b) === d.endung ? b : `${b}.${d.endung}`;
    const alt = d.dateiname;
    d.dateiname = neu;
    anfassen(client, d);
    protokoll(client, "Umbenannt", { datei: d.name, hinweis: `${alt} → ${neu}` });
    return dateiPayload(client, d);
  },

  verschieben(client, { datei, ordner }) {
    const d = schreiben(client, datei);
    const ziel = pruefeOrdner(client, ordner, "write");
    if (d.aufbewahrungsklasse === "Personal" && ziel.bezug_doctype !== "PH Mitarbeiter") throw fehler("forbidden", "Personalunterlagen bleiben in Personalordnern.");
    const von = d.ordner;
    Object.assign(d, { ordner: ziel.name, bezug_doctype: ziel.bezug_doctype || "", bezug_name: ziel.bezug_name || "", bezug_titel: ziel.bezug_titel || "", effektiver_modus: ziel.effektiver_modus });
    anfassen(client, d);
    protokoll(client, "Verschoben", { datei: d.name, ordner: ziel.name, hinweis: `${von} → ${ziel.name}` });
    return dateiPayload(client, d);
  },

  tags_setzen(client, { datei, tags, beschreibung }) {
    const d = pruefeDatei(client, datei, "write");
    if (tags !== undefined) d.tags = tagsText(Array.isArray(tags) ? tags : String(tags || ""));
    if (beschreibung !== undefined) d.beschreibung = text(beschreibung, 2000);
    anfassen(client, d);
    protokoll(client, "Tags", { datei: d.name });
    return dateiPayload(client, d);
  },

  aufbewahrung_setzen(client, { datei, aufbewahrungsklasse, belegdatum }) {
    const d = schreiben(client, datei);
    if (!KLASSEN.includes(aufbewahrungsklasse)) throw fehler("invalid", "Klasse ungültig.");
    const leitung = istLeitung(rollen(client), d.bezug_doctype);
    if ((d.aufbewahrungsklasse === "Beleg" || AUFBEWAHRUNG[aufbewahrungsklasse].nurLeitung && aufbewahrungsklasse !== "Beleg") && !leitung && aufbewahrungsklasse !== d.aufbewahrungsklasse) {
      throw fehler("forbidden", "Diese Änderung darf nur die Leitung.");
    }
    d.aufbewahrungsklasse = aufbewahrungsklasse;
    d.belegdatum = belegdatum || d.belegdatum || (aufbewahrungsklasse === "Beleg" ? isoDatum(jetzt(client)) : "");
    d.aufbewahren_bis = aufbewahrenBis(aufbewahrungsklasse, d.belegdatum || d.creation) || "";
    d.loeschsperre = AUFBEWAHRUNG[aufbewahrungsklasse].sperre ? 1 : 0;
    anfassen(client, d);
    return dateiPayload(client, d);
  },

  sperren(client, { datei, stunden, hinweis }) {
    const d = pruefeDatei(client, datei, "write");
    if (d.status !== "Aktiv") throw fehler("conflict", "Die Datei liegt im Papierkorb.");
    sperrePruefen(client, d);
    const h = Math.min(Math.max(ganz(stunden) || einst(client).sperreStunden, 1), 168);
    const bis = new Date(jetzt(client).getTime() + h * 3600_000);
    Object.assign(d, { gesperrt_von: benutzer(client), gesperrt_bis: isoDatumZeit(bis), gesperrt_hinweis: text(hinweis, 200) });
    protokoll(client, "Gesperrt", { datei: d.name, hinweis: `bis ${isoDatumZeit(bis)}` });
    return dateiPayload(client, d);
  },

  entsperren(client, { datei, erzwingen = 0 }) {
    const d = pruefeDatei(client, datei, "write");
    if (sperreJetzt(client, d)) sperrePruefen(client, d, Boolean(ganz(erzwingen)));
    if (d.gesperrt_von) {
      Object.assign(d, { gesperrt_von: "", gesperrt_bis: "", gesperrt_hinweis: "" });
      protokoll(client, "Entsperrt", { datei: d.name, hinweis: ganz(erzwingen) ? "erzwungen" : "" });
    }
    return dateiPayload(client, d);
  },

  versionen(client, { datei }) {
    const d = pruefeDatei(client, datei);
    return { datei: d.name, aktuell: ganz(d.aktuelle_version), versionen: dateiPayload(client, d, true).versionen };
  },

  version_wiederherstellen(client, { datei, version, kommentar }) {
    const d = schreiben(client, datei);
    const v = versionZeile(d, version);
    if (ganz(v.version) === ganz(d.aktuelle_version)) throw fehler("conflict", "Das ist schon die aktuelle Version.");
    const neu = ganz(d.aktuelle_version) + 1;
    const zeit = isoDatumZeit(jetzt(client));
    const alt = speicher.hole(speicher.schluessel(d.name, v.version));
    if (alt) speicher.legeAb(speicher.schluessel(d.name, neu), alt.bytes, alt.mime);
    d.versionen = [...(d.versionen || []), { ...v, version: neu, hochgeladen_am: zeit, hochgeladen_von: benutzer(client), kommentar: kommentar || `Wiederhergestellt aus Version ${v.version}`, wiederhergestellt_aus: v.version }];
    Object.assign(d, { aktuelle_version: neu, groesse: v.groesse, groesse_text: groesseText(v.groesse), sha256: v.sha256 || d.sha256 });
    anfassen(client, d);
    protokoll(client, "Version wiederhergestellt", { datei: d.name, version: neu, hinweis: `aus ${v.version}` });
    return dateiPayload(client, d, true);
  },

  loeschen(client, { datei }) {
    const d = pruefeDatei(client, datei, "write");
    if (d.status === "Papierkorb") return dateiPayload(client, d);
    sperrePruefen(client, d);
    loeschenPruefen(client, d);
    const zeit = jetzt(client);
    Object.assign(d, { status: "Papierkorb", geloescht: 1, geloescht_am: isoDatumZeit(zeit), geloescht_von: benutzer(client), papierkorb_bis: papierkorbBis(zeit, einst(client).papierkorbTage) });
    for (const l of tab(client, DT.link).values()) if (l.datei === d.name && l.status === "Aktiv") Object.assign(l, { status: "Widerrufen", widerrufen_am: isoDatumZeit(zeit), widerrufen_von: benutzer(client) });
    freigabenZaehlen(client, d.name);
    anfassen(client, d);
    protokoll(client, "Geloescht", { datei: d.name, bezug_doctype: d.bezug_doctype, bezug_name: d.bezug_name });
    return dateiPayload(client, d);
  },

  wiederherstellen(client, { datei }) {
    const d = pruefeDatei(client, datei, "write");
    if (d.status !== "Papierkorb") return dateiPayload(client, d);
    if (!tab(client, DT.ordner).has(d.ordner)) throw fehler("conflict", "Der Ordner gibt es nicht mehr – bitte zuerst einen Zielordner wählen.");
    Object.assign(d, { status: "Aktiv", geloescht: 0, geloescht_am: "", geloescht_von: "", papierkorb_bis: "" });
    anfassen(client, d);
    protokoll(client, "Wiederhergestellt", { datei: d.name });
    return dateiPayload(client, d);
  },

  endgueltig_loeschen(client, { datei }) {
    const d = pruefeDatei(client, datei, "delete");
    if (d.status !== "Papierkorb") throw fehler("conflict", "Nur Dateien im Papierkorb lassen sich endgültig löschen.");
    loeschenPruefen(client, d, true);
    tab(client, DT.datei).delete(d.name);
    speicher.entferne(d.name);
    for (const [k, l] of tab(client, DT.link)) if (l.datei === d.name) tab(client, DT.link).delete(k);
    protokoll(client, "Endgueltig geloescht", { datei: d.name, hinweis: d.dateiname });
    return { datei: d.name, geloescht: true };
  },

  freigabelink_erstellen(client, { datei, tage, passwort, max_downloads, version, empfaenger_hinweis }) {
    const d = schreiben(client, datei);
    const e = einst(client);
    const t = Math.min(Math.max(ganz(tage) || e.freigabeTage, 1), e.freigabeMax);
    if (passwort && String(passwort).length < 6) throw fehler("invalid", "Passwort mit mindestens 6 Zeichen.");
    if (e.passwortPflicht && !passwort) throw fehler("invalid", "Passwort ist vorgeschrieben.");
    if (version) versionZeile(d, version);
    if (empfaenger_hinweis && /@/.test(String(empfaenger_hinweis))) throw fehler("invalid", "Bitte keine E-Mail-Adresse im Hinweis.");
    const token = neuesToken(32);
    const zeit = jetzt(client);
    const ablauf = new Date(zeit.getTime() + t * 86_400_000);
    const name = `fl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    tab(client, DT.link).set(name, {
      name, doctype: DT.link, titel: d.dateiname, datei: d.name, version: ganz(version) || 0, status: "Aktiv", ablauf: isoDatumZeit(ablauf), nur_lesen: 1,
      passwort_gesetzt: passwort ? 1 : 0, passwort_hash: passwort ? mockPasswortHash(passwort) : "", max_downloads: ganz(max_downloads) || 0, download_zaehler: 0,
      letzter_download: "", empfaenger_hinweis: text(empfaenger_hinweis, 140), erstellt_von: benutzer(client), token_hash: sha256Hex(token),
      owner: benutzer(client), creation: isoDatumZeit(zeit), modified: isoDatumZeit(zeit), docstatus: 0,
    });
    freigabenZaehlen(client, d.name);
    protokoll(client, "Freigabe erstellt", { datei: d.name, freigabelink: name, hinweis: `${t} Tage` });
    return { datei: d.name, freigabelink: name, token, url: e.basis ? `${e.basis.replace(/\/$/, "")}/${token}` : null, ablauf: isoDatumZeit(ablauf), passwort: Boolean(passwort), max_downloads: ganz(max_downloads) || null, version: ganz(version) || null };
  },

  freigabelinks(client, { datei, alle = 0 }) {
    const d = pruefeDatei(client, datei);
    const items = [...tab(client, DT.link).values()]
      .filter((l) => l.datei === d.name && (ganz(alle) || l.status === "Aktiv"))
      .sort((a, b) => String(b.creation).localeCompare(String(a.creation)))
      .map(linkPayload);
    return { datei: d.name, items };
  },

  freigabelink_widerrufen(client, { freigabelink }) {
    if (!freigabelink) throw fehler("invalid", "Freigabelink fehlt.");
    const l = tab(client, DT.link).get(freigabelink);
    if (!l) throw fehler("not_found", "Freigabelink nicht gefunden.");
    pruefeDatei(client, l.datei, "write");
    if (l.status === "Aktiv") Object.assign(l, { status: "Widerrufen", widerrufen_am: isoDatumZeit(jetzt(client)), widerrufen_von: benutzer(client) });
    freigabenZaehlen(client, l.datei);
    protokoll(client, "Freigabe widerrufen", { datei: l.datei, freigabelink: l.name });
    return { freigabelink: l.name, status: l.status };
  },

  freigabe_aufloesen(client, { token, passwort, nur_info = 0 }) {
    const r = rollen(client);
    if (!r.some((x) => ["PH Website Integration", "PH Backoffice-Admin", "System Manager"].includes(x))) throw fehler("forbidden", "Keine Berechtigung.");
    if (!token) throw fehler("invalid", "Token fehlt.");
    const hash = sha256Hex(String(token));
    const l = [...tab(client, DT.link).values()].find((x) => x.token_hash === hash);
    if (!l) throw fehler("invalid_token", "Link ungültig.");
    const z = freigabeZustand(l.status, l.ablauf, jetzt(client), l.download_zaehler, l.max_downloads);
    if (z === "widerrufen") throw fehler("invalid_token", "Link ungültig.");
    if (z !== "ok") {
      if (l.status === "Aktiv") l.status = z === "abgelaufen" ? "Abgelaufen" : "Aufgebraucht";
      throw fehler("expired", "Der Link ist abgelaufen.");
    }
    if (l.passwort_hash) {
      if (!passwort) throw fehler("password_required", "Passwort erforderlich.", { passwort_noetig: true });
      if (mockPasswortHash(passwort) !== l.passwort_hash) {
        protokoll(client, "Abgelehnt", { datei: l.datei, freigabelink: l.name, hinweis: "falsches Passwort" });
        throw fehler("forbidden", "Passwort falsch.");
      }
    }
    const d = tab(client, DT.datei).get(l.datei);
    if (!d || d.status !== "Aktiv") throw fehler("expired", "Die Datei ist nicht mehr verfügbar.");
    const v = versionZeile(d, ganz(l.version) || null);
    const basis = { dateiname: d.dateiname, groesse: ganz(v.groesse || d.groesse), mime: v.mime || d.mime, ablauf: l.ablauf, passwort_noetig: false, version: ganz(v.version), endung: d.endung, vorschau_art: d.vorschau_art };
    if (ganz(nur_info)) return basis;
    l.download_zaehler = ganz(l.download_zaehler) + 1;
    l.letzter_download = isoDatumZeit(jetzt(client));
    protokoll(client, "Freigabe genutzt", { datei: d.name, freigabelink: l.name, version: v.version, automatisch: 1 });
    return { ...basis, url: `mock:${speicher.schluessel(d.name, v.version)}`, art: "proxy", url_ablauf: isoDatumZeit(new Date(jetzt(client).getTime() + 300_000)), datei: d.name };
  },

  portal_freigeben(client, { datei, freigeben = 1, projekt, kategorie, titel, bis }) {
    const d = schreiben(client, datei);
    const an = ganz(freigeben);
    const p = projekt || (d.bezug_doctype === "PH Projekt" ? d.bezug_name : null);
    if (an && !p) throw fehler("invalid", "Kein Projekt für das Portal.");
    if (an && ganz(d.groesse) > 25 * MB) throw fehler("too_large", "Für das Portal höchstens 25 MB.");
    Object.assign(d, { portal_freigabe: an, portal_ablauf: an ? bis || "" : "", portal_dokument: an ? `PD-${d.name}` : "", portal_version: an ? d.aktuelle_version : 0 });
    if (an && (kategorie || titel)) d.portal_titel = text(titel || d.dateiname, 140);
    anfassen(client, d);
    protokoll(client, an ? "Portal freigegeben" : "Portal zurueckgezogen", { datei: d.name, bezug_doctype: "PH Projekt", bezug_name: p || "" });
    return { datei: d.name, portal_freigabe: an, portal_dokument: d.portal_dokument || null, portal_ablauf: d.portal_ablauf || null };
  },

  bestand_uebernehmen(client) {
    if (!istLeitung(rollen(client))) throw fehler("forbidden", "Nur Leitung.");
    return { eingereiht: 0 };
  },

  speicher_umziehen(client) {
    if (!rollen(client).some((r) => ["System Manager", "PH Backoffice-Admin"].includes(r))) throw fehler("forbidden", "Nur Admin.");
    return { eingereiht: 0, ziel: einst(client).adapter };
  },
};

function versionZeile(d, version) {
  const v = ganz(version) || ganz(d.aktuelle_version);
  const z = (d.versionen || []).find((x) => ganz(x.version) === v);
  if (z) return z;
  if (!version) return { version: ganz(d.aktuelle_version) || 1, groesse: d.groesse, mime: d.mime, sha256: d.sha256 };
  throw fehler("not_found", `Version ${v} nicht gefunden.`);
}

function* kette(client, o) {
  const karte = tab(client, DT.ordner);
  let x = o;
  const gesehen = new Set();
  while (x && !gesehen.has(x.name)) {
    gesehen.add(x.name);
    yield x;
    x = x.parent_ph_ordner ? karte.get(x.parent_ph_ordner) : null;
  }
}

function safeJson(s) {
  try {
    return typeof s === "string" ? JSON.parse(s) : s;
  } catch {
    return null;
  }
}

function schnipsel(volltext, begriff, breite = 60) {
  const t = String(volltext || "");
  const i = t.toLowerCase().indexOf(String(begriff).toLowerCase());
  if (i < 0) return null;
  return `${i > breite ? "…" : ""}${t.slice(Math.max(0, i - breite), i + begriff.length + breite).trim()}${i + breite < t.length ? "…" : ""}`;
}

export { mockPasswortHash };

/** Hat der Mock die Methode? (Tests) */
export function mockHat(methode) {
  return Boolean(MOCK[methode]);
}
