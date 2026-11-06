"use server";
// Server Actions des Bereichs Ablage (Konzept §4). Jede Action: Sitzung + Bereichsrecht prüfen, Eingaben prüfen,
// ph_ablage.api über methoden.js (Mock-Pfad inklusive), Ergebnis { ok, daten? } bzw. { ok:false, code, message,
// ablage? } – nie werfen, nie Rohfehler an den Client. Portal-Freigabe = Außenwirkung → verzögerter Commit
// (commit/aktionen/ablage.js). Teil-Uploads laufen nicht hier (Größe), sondern über POST /ablage/hochladen.

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { darf } from "@/lib/backoffice/auth/rechte";
import { planeCommit } from "@/lib/backoffice/commit/server";
import { DT, KLASSEN, MODI } from "./labels";
import { ablage } from "./methoden";
import { alsFehler, kontext, ladeFreigabelinks, ladeUnterbaum, ladeVerlauf, zeileZuDatei } from "./daten";
import { darfOrdner, istLeitung, tagsNormalisieren } from "./regeln";
import { T } from "./texte";

const UNGUELTIG = { ok: false, code: "invalid", message: T.fehler.unvollstaendig };
const KEIN_RECHT = { ok: false, code: "forbidden", message: "Keine Berechtigung." };

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,139}$/;
const istName = (x) => typeof x === "string" && NAME_RE.test(x);
const text = (x, max = 140) => String(x ?? "").trim().slice(0, max);

function fehler(err) {
  const f = alsFehler(err);
  return { ok: false, code: f.code, message: f.message, ablage: f.ablage, daten: f.daten || undefined };
}

async function sitzung({ schreiben = false, anlegen = false } = {}) {
  const session = await requireSession();
  if (!darf(session, "ablage", "read")) return { fehler: KEIN_RECHT };
  const ctx = kontext(session);
  if (schreiben && !ctx.schreiben) return { fehler: KEIN_RECHT };
  if (anlegen && !ctx.anlegen) return { fehler: KEIN_RECHT };
  return { ctx };
}

function neuLaden(...pfade) {
  revalidatePath("/ablage");
  for (const p of pfade) if (p) revalidatePath(p);
}

async function lauf(opts, fn) {
  const s = await sitzung(opts);
  if (s.fehler) return s.fehler;
  try {
    return { ok: true, daten: await fn(s.ctx) };
  } catch (err) {
    return fehler(err);
  }
}

// ----------------------------------------------------------------- Lesen --

/** Kinder eines Ordners für den Baum (Aufklappen). */
export async function ordnerKinderAction({ ordner } = {}) {
  if (!istName(ordner)) return UNGUELTIG;
  return lauf({}, async (ctx) => (await ladeUnterbaum(ctx, ordner, 1))?.kinder || []);
}

/** Ganzer Zweig eines Ordners (Verschieben-Dialog). */
export async function ordnerZweigAction({ ordner } = {}) {
  if (ordner && !istName(ordner)) return UNGUELTIG;
  return lauf({}, async (ctx) => {
    if (!ordner) return (await ablage(ctx.client, "ordner_baum", { tiefe: 1 }))?.wurzeln || [];
    return (await ladeUnterbaum(ctx, ordner, 3))?.kinder || [];
  });
}

/** Ordner nach Name suchen (Verschieben-Dialog). */
export async function ordnerSucheAction({ q } = {}) {
  const s = text(q, 60);
  if (s.length < 2) return { ok: true, daten: [] };
  return lauf({}, async (ctx) => {
    const rows = await ctx.client.getList(DT.ordner, {
      fields: ["name", "titel", "pfad", "effektiver_modus", "bezug_doctype", "geschuetzt"],
      orFilters: [["titel", "like", `%${s}%`], ["pfad", "like", `%${s}%`]],
      orderBy: "modified desc",
      limit: 40,
    });
    return rows
      .filter((o) => ctx.modus === "frappe" || darfOrdner(o.effektiver_modus, ctx.rollen, o.bezug_doctype))
      .slice(0, 20)
      .map((o) => ({ ordner: o.name, titel: o.titel, pfad: o.pfad }));
  });
}

/** Weitere Dateien eines Ordners (Seite n). */
export async function dateienAction({ ordner, seite = 1, sort, q, endung } = {}) {
  if (!istName(ordner)) return UNGUELTIG;
  return lauf({}, (ctx) => ablage(ctx.client, "dateien", { ordner, seite: Math.max(1, Number(seite) || 1), groesse: 60, sort: sort || "name", suche: q ? text(q, 100) : undefined, endung: endung || undefined }));
}

/** Detail für das Vorschau-Panel / Teilen-Dialog. */
export async function dateiDetailAction({ datei } = {}) {
  if (!istName(datei)) return UNGUELTIG;
  return lauf({}, async (ctx) => {
    const [d, links] = await Promise.all([ablage(ctx.client, "datei", { datei }), ladeFreigabelinks(ctx, datei).catch(() => [])]);
    return { ...d, alleLinks: links };
  });
}

export async function verlaufAction({ datei } = {}) {
  if (!istName(datei)) return UNGUELTIG;
  return lauf({}, (ctx) => ladeVerlauf(ctx, datei));
}

/** Suche über alle Ordner (Palette in der Ablage). */
export async function sucheAction({ q, bezug_doctype, bezug_name } = {}) {
  const s = text(q, 100);
  if (s.length < 2) return { ok: true, daten: [] };
  return lauf({}, (ctx) => ablage(ctx.client, "suche", { q: s, limit: 30, bezug_doctype: bezug_doctype || undefined, bezug_name: bezug_name || undefined }));
}

// ---------------------------------------------------------------- Upload --

/** Upload beginnen (neue Datei) bzw. neue Version (mit `datei`). */
export async function uploadStartAction({ ordner, datei, dateiname, groesse, mime, sha256, kommentar } = {}) {
  const g = Number(groesse);
  if (!Number.isFinite(g) || g < 0 || !text(dateiname, 255)) return UNGUELTIG;
  if (sha256 && !/^[0-9a-f]{64}$/.test(String(sha256))) return UNGUELTIG;
  if (datei) {
    if (!istName(datei)) return UNGUELTIG;
    return lauf({ schreiben: true }, (ctx) => ablage(ctx.client, "neue_version", { datei, groesse: g, dateiname: text(dateiname, 255), mime: text(mime, 120) || undefined, sha256: sha256 || undefined, kommentar: text(kommentar, 500) || undefined, einchecken: 1 }));
  }
  if (!istName(ordner)) return UNGUELTIG;
  return lauf({ anlegen: true }, (ctx) => ablage(ctx.client, "upload_start", { ordner, dateiname: text(dateiname, 255), groesse: g, mime: text(mime, 120) || undefined, sha256: sha256 || undefined, kommentar: text(kommentar, 500) || undefined }));
}

export async function uploadAbschliessenAction({ token, sha256, ordner } = {}) {
  if (typeof token !== "string" || token.length < 8 || token.length > 200 || !/^[0-9a-f]{64}$/.test(String(sha256 || ""))) return UNGUELTIG;
  const r = await lauf({}, (ctx) => ablage(ctx.client, "upload_abschliessen", { token, sha256 }));
  if (r.ok) neuLaden(ordner ? null : null, r.daten?.datei ? `/ablage/datei/${r.daten.datei}` : null);
  return r;
}

// ------------------------------------------------------------- Dateiaktionen --

function dateiAktion(methode, extra = () => ({}), { pruef, opts = { schreiben: true } } = {}) {
  return async (eingabe = {}) => {
    if (!istName(eingabe.datei)) return UNGUELTIG;
    if (pruef && !pruef(eingabe)) return UNGUELTIG;
    const r = await lauf(opts, (ctx) => ablage(ctx.client, methode, { datei: eingabe.datei, ...extra(eingabe) }));
    if (r.ok) neuLaden(`/ablage/datei/${eingabe.datei}`, "/ablage/papierkorb", "/ablage/freigaben", "/ablage/zuletzt");
    return r;
  };
}

const _umbenennen = dateiAktion("umbenennen", (e) => ({ dateiname: text(e.dateiname, 180) }), { pruef: (e) => text(e.dateiname, 180).length > 0 });
const _verschieben = dateiAktion("verschieben", (e) => ({ ordner: e.ordner }), { pruef: (e) => istName(e.ordner) });
const _tags = dateiAktion("tags_setzen", (e) => ({ tags: tagsNormalisieren(e.tags || []), beschreibung: e.beschreibung === undefined ? undefined : text(e.beschreibung, 2000) }));
const _aufbewahrung = dateiAktion("aufbewahrung_setzen", (e) => ({ aufbewahrungsklasse: e.klasse, belegdatum: /^\d{4}-\d{2}-\d{2}$/.test(String(e.belegdatum || "")) ? e.belegdatum : undefined }), { pruef: (e) => KLASSEN.includes(e.klasse) });
const _sperren = dateiAktion("sperren", (e) => ({ stunden: Math.min(Math.max(Number(e.stunden) || 0, 0), 168) || undefined, hinweis: text(e.hinweis, 200) || undefined }));
const _entsperren = dateiAktion("entsperren", (e) => ({ erzwingen: e.erzwingen ? 1 : 0 }));
const _loeschen = dateiAktion("loeschen");
const _wiederherstellen = dateiAktion("wiederherstellen");
const _endgueltig = dateiAktion("endgueltig_loeschen");
const _versionWiederherstellen = dateiAktion("version_wiederherstellen", (e) => ({ version: Number(e.version), kommentar: text(e.kommentar, 300) || undefined }), { pruef: (e) => Number(e.version) > 0 });
const _linkErstellen = dateiAktion(
  "freigabelink_erstellen",
  (e) => ({ tage: Math.max(1, Number(e.tage) || 0) || undefined, passwort: e.passwort ? String(e.passwort).slice(0, 128) : undefined, max_downloads: Number(e.maxDownloads) > 0 ? Math.min(Number(e.maxDownloads), 1000) : undefined, empfaenger_hinweis: text(e.hinweis, 140) || undefined }),
  { pruef: (e) => !e.passwort || String(e.passwort).length >= 6 }
);

export async function umbenennenAction(e) {
  return _umbenennen(e);
}
export async function verschiebenAction(e) {
  return _verschieben(e);
}
export async function tagsAction(e) {
  return _tags(e);
}
export async function aufbewahrungAction(e) {
  return _aufbewahrung(e);
}
export async function sperrenAction(e) {
  return _sperren(e);
}
export async function entsperrenAction(e) {
  if (e?.erzwingen) {
    const s = await sitzung({ schreiben: true });
    if (s.fehler) return s.fehler;
  }
  return _entsperren(e);
}
export async function loeschenAction(e) {
  return _loeschen(e);
}
export async function wiederherstellenAction(e) {
  return _wiederherstellen(e);
}
export async function endgueltigLoeschenAction(e) {
  return _endgueltig(e);
}
export async function versionWiederherstellenAction(e) {
  return _versionWiederherstellen(e);
}
export async function freigabelinkErstellenAction(e) {
  return _linkErstellen(e);
}

/** Mehrere Dateien in den Papierkorb (Massenaktion): Ergebnis je Datei, übersprungene mit Grund. */
export async function loeschenVieleAction({ dateien } = {}) {
  if (!Array.isArray(dateien) || !dateien.length || dateien.length > 200 || !dateien.every(istName)) return UNGUELTIG;
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const ok = [];
  const uebersprungen = [];
  for (const datei of dateien) {
    try {
      await ablage(s.ctx.client, "loeschen", { datei });
      ok.push(datei);
    } catch (err) {
      uebersprungen.push({ datei, message: alsFehler(err).message });
    }
  }
  neuLaden("/ablage/papierkorb");
  return { ok: true, daten: { ok, uebersprungen } };
}

export async function wiederherstellenVieleAction({ dateien } = {}) {
  if (!Array.isArray(dateien) || !dateien.length || dateien.length > 200 || !dateien.every(istName)) return UNGUELTIG;
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  const ok = [];
  for (const datei of dateien) {
    try {
      await ablage(s.ctx.client, "wiederherstellen", { datei });
      ok.push(datei);
    } catch {
      /* einzeln gemeldet über die Liste */
    }
  }
  neuLaden("/ablage/papierkorb");
  return { ok: true, daten: { ok } };
}

export async function freigabelinkWiderrufenAction({ freigabelink } = {}) {
  if (!istName(freigabelink)) return UNGUELTIG;
  const r = await lauf({ schreiben: true }, (ctx) => ablage(ctx.client, "freigabelink_widerrufen", { freigabelink }));
  if (r.ok) neuLaden("/ablage/freigaben");
  return r;
}

/** Portal-Freigabe = Außenwirkung beim Kunden → verzögerter Commit (8 s Rückgängig, Q-C3). */
export async function portalPlanenAction({ datei, freigeben = true, bis, titel } = {}) {
  if (!istName(datei)) return UNGUELTIG;
  if (bis && !/^\d{4}-\d{2}-\d{2}$/.test(String(bis))) return UNGUELTIG;
  const s = await sitzung({ schreiben: true });
  if (s.fehler) return s.fehler;
  try {
    const d = await ablage(s.ctx.client, "datei", { datei });
    if (freigeben && d.bezug_doctype !== "PH Projekt") return { ok: false, code: "invalid", message: "Nur Projektdateien kommen ins Kundenportal." };
    const r = await planeCommit(s.ctx.session, {
      action: "ablage.portal",
      args: { datei, freigeben: freigeben ? 1 : 0, bis: bis || null, titel: text(titel, 140) || null },
      schluessel: `portal:${datei}:${freigeben ? 1 : 0}`,
      objekt: { doctype: DT.datei, name: datei, titel: d.dateiname },
      titel: freigeben ? `Portal-Freigabe von ${d.dateiname}` : `Portal-Rücknahme von ${d.dateiname}`,
    });
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------------- Ordner --

export async function ordnerAnlegenAction({ titel, eltern, rechte_modus, farbe } = {}) {
  const t = text(titel, 140);
  if (!t || (eltern && !istName(eltern)) || (rechte_modus && !MODI.includes(rechte_modus))) return UNGUELTIG;
  const r = await lauf({ anlegen: true }, (ctx) => ablage(ctx.client, "ordner_anlegen", { titel: t, eltern: eltern || undefined, rechte_modus: rechte_modus || undefined, farbe: farbe || undefined }));
  if (r.ok) neuLaden();
  return r;
}

export async function ordnerUmbenennenAction({ ordner, titel } = {}) {
  const t = text(titel, 140);
  if (!istName(ordner) || !t) return UNGUELTIG;
  const r = await lauf({ schreiben: true }, (ctx) => ablage(ctx.client, "ordner_umbenennen", { ordner, titel: t }));
  if (r.ok) neuLaden();
  return r;
}

export async function ordnerVerschiebenAction({ ordner, eltern } = {}) {
  if (!istName(ordner) || (eltern && !istName(eltern))) return UNGUELTIG;
  const r = await lauf({ schreiben: true }, (ctx) => ablage(ctx.client, "ordner_verschieben", { ordner, eltern: eltern || undefined }));
  if (r.ok) neuLaden();
  return r;
}

export async function ordnerEinstellenAction({ ordner, rechte_modus, farbe, aufbewahrungsklasse } = {}) {
  if (!istName(ordner)) return UNGUELTIG;
  if (rechte_modus && !MODI.includes(rechte_modus)) return UNGUELTIG;
  if (aufbewahrungsklasse && !KLASSEN.includes(aufbewahrungsklasse)) return UNGUELTIG;
  const r = await lauf({ schreiben: true }, (ctx) => ablage(ctx.client, "ordner_einstellen", { ordner, rechte_modus: rechte_modus ?? undefined, farbe: farbe ?? undefined, aufbewahrungsklasse: aufbewahrungsklasse ?? undefined }));
  if (r.ok) neuLaden();
  return r;
}

export async function ordnerLoeschenAction({ ordner } = {}) {
  if (!istName(ordner)) return UNGUELTIG;
  const r = await lauf({ schreiben: true }, (ctx) => ablage(ctx.client, "ordner_loeschen", { ordner }));
  if (r.ok) neuLaden();
  return r;
}

// ------------------------------------------------------------------ Slots --

/** Letzte Dateien eines Bezugs neu laden (Slot nach Upload). */
export async function bezugDateienAction({ doctype, name } = {}) {
  if (!["PH Kontakt", "PH Projekt", "PH Lieferant", "PH Mitarbeiter", "PH Servicefall"].includes(doctype) || !istName(name)) return UNGUELTIG;
  return lauf({}, async (ctx) => {
    const rows = await ctx.client.getList(DT.datei, { fields: ["*"], filters: [["status", "=", "Aktiv"], ["bezug_doctype", "=", doctype], ["bezug_name", "=", name]], orderBy: "modified desc", limit: 8 });
    return rows.map((d) => zeileZuDatei(d));
  });
}

/** Leitung des Bezugs? (für Menüeinträge „Nur Leitung“ im Client) */
export async function leitungAction({ bezug_doctype } = {}) {
  const session = await requireSession();
  return { ok: true, daten: istLeitung(session.roles || [], bezug_doctype || null) };
}
