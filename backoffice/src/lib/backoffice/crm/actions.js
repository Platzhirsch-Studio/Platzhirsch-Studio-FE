"use server";
// Server Actions des CRM (10-konzept-crm § 17.3). Jede Action: Sitzung + Recht erneut prüfen, Eingaben prüfen,
// Rückgabe { ok:true, … } | { ok:false, code, message } – nie werfen, keine Personendaten im Log.
//
// Rückgängig (Q-C3, § 2.4): Workflow-Übergänge, Mails und Außenwirkung laufen im Frappe-Modus als verzögerter
// Commit (`planeCommit` mit fundament.methode / fundament.workflow → { token, ms }); der Client zeigt 8 s (Mail 10 s)
// „Rückgängig“. Im Mock-Pfad wirkt die Aktion sofort und liefert ein `undoToken`; `rueckgaengigAction` stellt den
// vorherigen Stand wieder her (nur Mock, Datensatz-Schnappschuss).

import { revalidatePath } from "next/cache";
import { requireSession } from "../auth/dal.js";
import { darfDoc } from "../auth/rechte.js";
import { backoffice } from "../frappe/index.js";
import { metaIndex } from "../frappe/meta.js";
import { istBackofficeError } from "../frappe/errors.js";
import { planeCommit } from "../commit/server.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { adresseSperren, docMethode, findeDubletten, freieSlots, istMock, kontaktAnlegen, kontaktAusMail, mailSenden, mailZuordnen } from "./backend.js";
import { crmSeedSicherstellen, istLeitung } from "./daten.js";
import { CRM_TEXTE as T, fehlerText } from "./texte.js";

const G = globalThis;
const MAIL_MS = 10_000;

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: fehlerText(err.code, err.message), detail: err.detail };
  console.error("[crm] Aktion fehlgeschlagen", err?.name || "Fehler");
  return { ok: false, code: "unavailable", message: T.fehler.unavailable };
}

const ungueltig = (message = T.fehler.invalid) => ({ ok: false, code: "invalid", message });
const verboten = () => ({ ok: false, code: "forbidden", message: T.fehler.forbidden });
const NAME = /^[\w .:/@+-]{1,140}$/u;
const gueltigerName = (n) => typeof n === "string" && NAME.test(n);
const text = (v, max = 2000) => String(v ?? "").trim().slice(0, max);

async function kontext(doctype, aktion = "write") {
  const session = await requireSession();
  const client = backoffice(session);
  crmSeedSicherstellen(client);
  const meta = metaIndex().doctypes.get(doctype);
  if (!meta || !darfDoc(session, meta, aktion)) return { session, client, verboten: true };
  return { session, client, verboten: false };
}

function pfade(...p) {
  for (const x of p) if (x) revalidatePath(x);
}

// --------------------------------------------------------- Rückgängig (Mock) --

function undoSpeicher() {
  if (!G.__phBoCrmUndo) G.__phBoCrmUndo = new Map();
  return G.__phBoCrmUndo;
}

async function mockMitUndo(client, session, objekte, fn) {
  const vorher = objekte.map(({ doctype, name }) => ({ doctype, name, doc: JSON.parse(JSON.stringify(client.tabelle(doctype).get(name) || null)) }));
  const ergebnis = await fn();
  const undoToken = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  undoSpeicher().set(undoToken, { user: session.user, vorher, bis: Date.now() + 60_000 });
  return { ergebnis, undoToken };
}

/** Mock: vorherigen Stand wiederherstellen (Frappe: Rückgängig läuft über den verzögerten Commit). */
export async function rueckgaengigAction({ undoToken } = {}) {
  const session = await requireSession();
  const client = backoffice(session);
  if (!istMock(client)) return { ok: false, code: "invalid", message: T.fehler.invalid };
  const e = undoSpeicher().get(String(undoToken || ""));
  if (!e || e.user !== session.user || e.bis < Date.now()) return { ok: false, code: "conflict", message: "Zu spät – bitte von Hand zurücksetzen." };
  undoSpeicher().delete(undoToken);
  for (const v of e.vorher) if (v.doc) client.tabelle(v.doctype).set(v.name, v.doc);
  pfade("/crm", "/crm/anfragen", "/crm/termine", "/crm/gespraeche");
  return { ok: true };
}

/**
 * Verzögert (Frappe) bzw. sofort mit Rückgängig (Mock): Dokumentmethode oder Workflow.
 * @param {{doctype:string, name:string, methode?:string, args?:object, workflow?:string, titel:string, ms?:number, pfad?:string}} a
 */
async function verzoegert(session, client, a) {
  if (!istMock(client)) {
    const action = a.methode ? "fundament.methode" : "fundament.workflow";
    const args = a.methode ? { doctype: a.doctype, name: a.name, methode: a.methode, args: a.args || {}, pfad: a.pfad } : { doctype: a.doctype, name: a.name, aktion: a.workflow, pfad: a.pfad };
    const r = await planeCommit(session, { action, args, schluessel: `${a.methode || a.workflow}:${a.name}`, objekt: { doctype: a.doctype, name: a.name }, titel: a.titel, ms: a.ms });
    if (!r?.ok) return { ok: false, code: r?.code || "unavailable", message: fehlerText(r?.code, r?.message) };
    return { ok: true, token: r.token, ms: r.ms, objekt: r.objekt };
  }
  const { undoToken } = await mockMitUndo(client, session, [{ doctype: a.doctype, name: a.name }], async () => {
    if (a.methode) return docMethode(client, a.doctype, a.name, a.methode, a.args || {});
    return client.workflowAction(a.doctype, a.name, a.workflow);
  });
  pfade(a.pfad);
  return { ok: true, undoToken, sofort: true };
}

// --------------------------------------------------------------- Anfragen --

/** Annehmen = Workflow „Qualifizieren“ (Wort nie sichtbar). */
export async function annehmenAction({ namen } = {}) {
  const liste = (Array.isArray(namen) ? namen : [namen]).filter(gueltigerName).slice(0, 100);
  if (!liste.length) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Anfrage");
    if (v) return verboten();
    const out = [];
    for (const name of liste) out.push({ name, ...(await verzoegert(session, client, { doctype: "PH Anfrage", name, workflow: "Qualifizieren", titel: `Annehmen von ${name}`, pfad: "/crm/anfragen" })) });
    pfade("/crm");
    return { ok: out.every((x) => x.ok), ergebnisse: out };
  } catch (err) {
    return fehler(err);
  }
}

export async function spamAction({ namen } = {}) {
  const liste = (Array.isArray(namen) ? namen : [namen]).filter(gueltigerName).slice(0, 100);
  if (!liste.length) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Anfrage");
    if (v) return verboten();
    const out = [];
    for (const name of liste) out.push({ name, ...(await verzoegert(session, client, { doctype: "PH Anfrage", name, methode: "als_spam", titel: `Spam: ${name}`, pfad: "/crm/anfragen" })) });
    pfade("/crm");
    return { ok: out.every((x) => x.ok), ergebnisse: out };
  } catch (err) {
    return fehler(err);
  }
}

export async function verlorenAction({ name, grund, details, mitbewerber } = {}) {
  if (!gueltigerName(name)) return ungueltig();
  if (!T.verlorenGruende.includes(grund)) return { ok: false, code: "invalid", message: T.dialog.grundPflicht, fehler: { grund: T.dialog.grundPflicht } };
  try {
    const { session, client, verboten: v } = await kontext("PH Anfrage");
    if (v) return verboten();
    const r = await verzoegert(session, client, { doctype: "PH Anfrage", name, methode: "als_verloren", args: { grund, details: text(details, 1000), mitbewerber: text(mitbewerber, 140) }, titel: `Verloren: ${name}`, pfad: `/crm/anfragen/${name}` });
    pfade("/crm/anfragen", "/crm");
    return r;
  } catch (err) {
    return fehler(err);
  }
}

export async function gewonnenAction({ name, wertCent } = {}) {
  if (!gueltigerName(name)) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Anfrage");
    if (v) return verboten();
    await docMethode(client, "PH Anfrage", name, "als_gewonnen", wertCent != null ? { wert_cent: Math.max(0, Math.round(Number(wertCent) || 0)) } : {});
    pfade(`/crm/anfragen/${name}`, "/crm/anfragen", "/crm");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Zurück auf Neu (Leitung) – Workflow „Zurück auf Neu“. */
export async function zurueckAufNeuAction({ name } = {}) {
  if (!gueltigerName(name)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Anfrage");
    if (v || !istLeitung(session)) return verboten();
    await client.workflowAction("PH Anfrage", name, "Zurück auf Neu");
    pfade(`/crm/anfragen/${name}`, "/crm/anfragen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Zuweisen (Anfrage: zugewiesen_an; Termin/Kontakt/Gespräch: berater) – sofort, Toast mit Gegenaktion. */
export async function zuweisenAction({ doctype, namen, user } = {}) {
  const feld = { "PH Anfrage": "zugewiesen_an", "PH Termin": "berater", "PH Kontakt": "berater", "PH Beratungsgespraech": "berater", "PH Aufgabe": "zugewiesen_an", "PH Datenschutzanfrage": "zugewiesen_an" }[doctype];
  const liste = (Array.isArray(namen) ? namen : [namen]).filter(gueltigerName).slice(0, 100);
  if (!feld || !liste.length || (user && !/^[\w.@+-]{1,140}$/.test(user))) return ungueltig();
  try {
    const { client, verboten: v } = await kontext(doctype);
    if (v) return verboten();
    const alt = {};
    for (const name of liste) {
      const d = await client.getDoc(doctype, name);
      alt[name] = d[feld] || "";
      await client.setValue(doctype, name, feld, user || "");
    }
    pfade("/crm/anfragen", "/crm/termine", "/crm");
    return { ok: true, alt };
  } catch (err) {
    return fehler(err);
  }
}

/** Nachfassen am (E2): früheste offene Nachfass-Aufgabe verschieben, sonst anlegen. */
export async function nachfassenAction({ anfrage, datum, titel } = {}) {
  if (!gueltigerName(anfrage) || !/^\d{4}-\d{2}-\d{2}$/.test(String(datum || ""))) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Anfrage");
    if (v) return verboten();
    const offen = await client.getList("PH Aufgabe", { fields: ["name", "faellig"], filters: [["referenz_doctype", "=", "PH Anfrage"], ["referenz_name", "=", anfrage], ["status", "in", ["Offen", "In Arbeit"]]], orderBy: "faellig asc", limit: 1 });
    let aufgabe;
    if (offen[0]) {
      aufgabe = offen[0].name;
      await client.setValue("PH Aufgabe", aufgabe, "faellig", datum);
    } else {
      aufgabe = await docMethode(client, "PH Anfrage", anfrage, "aufgabe_anlegen", { titel: text(titel, 140) || `Anfrage ${anfrage} nachfassen`, faellig: datum });
    }
    pfade(`/crm/anfragen/${anfrage}`, "/crm/anfragen", "/crm");
    return { ok: true, aufgabe, alt: offen[0]?.faellig || null };
  } catch (err) {
    return fehler(err);
  }
}

/** Aufgabe anlegen (Shift+A). */
export async function aufgabeAnlegenAction({ titel, faellig, zugewiesen, bezug, kontakt } = {}) {
  const t = text(titel, 140);
  if (!t) return ungueltig(T.dialog.aufgabeTitelFeld);
  try {
    const { session, client, verboten: v } = await kontext("PH Aufgabe", "create");
    if (v) return verboten();
    const werte = { titel: t, status: "Offen", prioritaet: "Normal", quelle: "manuell", faellig: /^\d{4}-\d{2}-\d{2}$/.test(String(faellig || "")) ? faellig : isoDatum(new Date(Date.now() + 86400000)), zugewiesen_an: zugewiesen || session.user };
    if (bezug?.doctype && gueltigerName(bezug?.name)) Object.assign(werte, { referenz_doctype: bezug.doctype, referenz_name: bezug.name });
    if (gueltigerName(kontakt)) werte.kontakt = kontakt;
    const doc = await client.insert("PH Aufgabe", werte);
    pfade("/crm");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

/** Aufgabe erledigen (Haken) bzw. zurück auf Offen (Rückgängig). PH Aufgabe hat keinen Workflow. */
export async function aufgabeStatusAction({ name, status = "Erledigt" } = {}) {
  if (!gueltigerName(name) || !["Offen", "Erledigt", "Verworfen", "In Arbeit"].includes(status)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Aufgabe");
    if (v) return verboten();
    await client.setValue("PH Aufgabe", name, { status, erledigt_am: status === "Erledigt" ? isoDatumZeit(new Date()) : "", erledigt_von: status === "Erledigt" ? session.user : "" });
    pfade("/crm");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Kunde zuordnen: vorhandenen Kontakt verknüpfen oder aus der Anfrage neu anlegen (kontakt_anlegen). */
export async function kundeZuordnenAction({ anfrage, kontakt, neu } = {}) {
  if (!gueltigerName(anfrage) || (!neu && !gueltigerName(kontakt))) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Anfrage");
    if (v) return verboten();
    let name = kontakt;
    if (neu) name = await docMethode(client, "PH Anfrage", anfrage, "kontakt_anlegen");
    else await client.setValue("PH Anfrage", anfrage, "kontakt", kontakt);
    pfade(`/crm/anfragen/${anfrage}`);
    return { ok: true, kontakt: name };
  } catch (err) {
    return fehler(err);
  }
}

/** Neue Anfrage (Schnellanlage § 3.3). */
export async function anfrageAnlegenAction(w = {}) {
  const fehlerFelder = {};
  if (!text(w.nachname)) fehlerFelder.nachname = T.dialog.nachnameFehlt;
  if (!text(w.email) && !text(w.telefon)) fehlerFelder.email = T.dialog.kontaktwegFehlt;
  if (text(w.email) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text(w.email))) fehlerFelder.email = "Bitte eine gültige E-Mail-Adresse angeben.";
  if (!text(w.anliegen)) fehlerFelder.anliegen = T.dialog.anliegenFehlt;
  if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: T.fehler.invalid, fehler: fehlerFelder };
  try {
    const { session, client, verboten: v } = await kontext("PH Anfrage", "create");
    if (v) return verboten();
    const art = Object.keys(T.art).includes(w.art) ? w.art : "Kontakt";
    const quelle = Object.keys(T.quelle).includes(w.quelle) ? w.quelle : "telefon";
    const doc = await client.insert("PH Anfrage", {
      art, quelle, status: "Neu", prioritaet: "Normal", eingang: isoDatumZeit(new Date()),
      anrede: ["", "Frau", "Herr", "Divers", "Firma"].includes(w.anrede) ? w.anrede : "",
      vorname: text(w.vorname, 140), nachname: text(w.nachname, 140), firma: text(w.firma, 140), email: text(w.email, 140), telefon: text(w.telefon, 40), plz_ort: text(w.plz_ort, 140),
      anliegen: text(w.anliegen, 5000), kontakt: gueltigerName(w.kontakt) ? w.kontakt : "", zugewiesen_an: session.user, sprache: "de",
    });
    if (quelle !== "website" && w.datenschutzhinweis) {
      await client.kommentar("PH Anfrage", doc.name, `Datenschutzhinweis: ${text(w.datenschutzhinweis, 60)}`, "Comment");
      if (w.datenschutzhinweis === "per Mail nachsenden") await docMethode(client, "PH Anfrage", doc.name, "aufgabe_anlegen", { titel: "Datenschutzhinweis senden", faellig: isoDatum(new Date(Date.now() + 86400000)) });
    }
    pfade("/crm/anfragen", "/crm");
    return { ok: true, name: doc.name, person: [doc.vorname, doc.nachname].filter(Boolean).join(" ") };
  } catch (err) {
    return fehler(err);
  }
}

/** Live-Prüfung auf bestehende Kontakte (find_duplicates). Fehler → leer + Hinweis. */
export async function dublettenAction({ email, telefon, nachname, plz } = {}) {
  try {
    const { client, verboten: v } = await kontext("PH Kontakt", "read");
    if (v) return { ok: true, treffer: [] };
    return { ok: true, treffer: await findeDubletten(client, { email: text(email, 140), telefon: text(telefon, 40), nachname: text(nachname, 140), plz: text(plz, 10) }) };
  } catch {
    return { ok: false, code: "unavailable", message: "Prüfung auf bestehende Kontakte nicht möglich", treffer: [] };
  }
}

/** Kontakt suchen (Link-Suche). */
export async function kontaktSuchenAction({ q } = {}) {
  try {
    const { client, verboten: v } = await kontext("PH Kontakt", "read");
    if (v) return { ok: true, treffer: [] };
    const t = await client.searchLink("PH Kontakt", text(q, 80), 8);
    return { ok: true, treffer: t.map((x) => ({ name: x.value, titel: x.description?.split(" · ")[0] || x.value, unter: x.description || "" })) };
  } catch (err) {
    return fehler(err);
  }
}

// ---------------------------------------------------------------- Termine --

/** Freie Zeiten einer Woche (A1, Verschieben). */
export async function slotsAction({ von, bis, berater, modus, terminart, ausser } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(von)) || !/^\d{4}-\d{2}-\d{2}$/.test(String(bis))) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Termin", "read");
    if (v) return verboten();
    const slots = await freieSlots(client, { von, bis, berater: berater || undefined, modus, terminart: terminart || undefined, ausser: gueltigerName(ausser) ? ausser : undefined });
    return { ok: true, slots: slots.map((s) => ({ start: s.start || s, berater: s.berater || "" })) };
  } catch (err) {
    return fehler(err);
  }
}

/** Assistent A1: Termin aus Anfrage (termin_vorschlagen) oder ohne Anfrage (insert + bestaetigen). */
export async function terminAnlegenAction(w = {}) {
  const start = String(w.start || "");
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(start)) return ungueltig("Bitte eine Zeit wählen.");
  const modus = Object.keys(T.modus).includes(w.modus) ? w.modus : "Showroom";
  const dauer = Math.min(Math.max(Number(w.dauer) || 60, 15), 480);
  const s = start.length === 16 ? `${start}:00` : start;
  try {
    const { session, client, verboten: v } = await kontext("PH Termin", "create");
    if (v) return verboten();
    const freie = await freieSlots(client, { von: s.slice(0, 10), bis: s.slice(0, 10), berater: w.berater || undefined, modus, terminart: w.terminart || undefined });
    if (!freie.some((x) => String(x.start || x).slice(0, 16) === s.slice(0, 16))) {
      const naechste = freie.find((x) => String(x.start || x) > s);
      return { ok: false, code: "conflict", message: T.fehler.slot, naechste: naechste ? String(naechste.start || naechste) : null };
    }
    let name;
    if (gueltigerName(w.anfrage)) {
      name = await docMethode(client, "PH Anfrage", w.anfrage, "termin_vorschlagen", { start: s, dauer_min: dauer, modus, terminart: w.terminart || undefined, berater: w.berater || undefined, thema: text(w.thema, 140), mail: w.mail ? 1 : 0 });
    } else {
      if (!gueltigerName(w.kontakt)) return ungueltig(T.a1.keinKunde);
      const k = await client.getDoc("PH Kontakt", w.kontakt);
      const terminart = w.terminart || (await client.getList("PH Terminart", { fields: ["name"], limit: 1 }))[0]?.name;
      const doc = await client.insert("PH Termin", {
        terminart, modus, start: s, dauer_min: dauer, ende: isoDatumZeit(new Date(new Date(s.replace(" ", "T")).getTime() + dauer * 60000)), status: "Unbestaetigt", quelle: "backoffice", kundenmail: "backoffice", email_verifiziert: 1,
        kontakt: k.name, vorname: k.vorname || "", nachname: k.nachname || k.titel || "Kunde", email: k.email || "", telefon: k.telefon || k.mobil || "", berater: w.berater || session.user, thema: text(w.thema, 140), idempotency_key: `a1:${k.name}:${s}`,
      });
      name = doc.name;
      await docMethode(client, "PH Termin", name, "bestaetigen", { mail: w.mail && k.email ? 1 : 0 });
    }
    pfade("/crm/termine", "/crm", gueltigerName(w.anfrage) ? `/crm/anfragen/${w.anfrage}` : null, gueltigerName(w.kontakt) ? `/kunden/${w.kontakt}` : null);
    return { ok: true, name };
  } catch (err) {
    return fehler(err);
  }
}

export async function terminBestaetigenAction({ name, mail = true } = {}) {
  if (!gueltigerName(name)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Termin");
    if (v) return verboten();
    const doc = await client.getDoc("PH Termin", name);
    const mitMail = !!mail && !!doc.email && doc.kundenmail !== "website";
    const r = await verzoegert(session, client, { doctype: "PH Termin", name, methode: "bestaetigen", args: { mail: mitMail ? 1 : 0 }, titel: `Bestätigen von ${name}`, ms: mitMail ? MAIL_MS : undefined, pfad: `/crm/termine/${name}` });
    pfade("/crm/termine", "/crm");
    return { ...r, mail: mitMail, an: mitMail ? maskiere(doc.email) : null, ohneMail: !doc.email };
  } catch (err) {
    return fehler(err);
  }
}

export async function terminAbsagenAction({ name, grund, mail, ablehnen } = {}) {
  if (!gueltigerName(name)) return ungueltig();
  if (!text(grund)) return { ok: false, code: "invalid", message: "Bitte einen Grund angeben.", fehler: { grund: "Bitte einen Grund angeben." } };
  try {
    const { session, client, verboten: v } = await kontext("PH Termin");
    if (v || (ablehnen && !istLeitung(session))) return verboten();
    await docMethode(client, "PH Termin", name, "absagen", { grund: text(grund, 500), mail: mail ? 1 : 0, abgelehnt: ablehnen ? 1 : 0 });
    pfade(`/crm/termine/${name}`, "/crm/termine", "/crm");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function terminVerschiebenAction({ name, start, berater } = {}) {
  if (!gueltigerName(name) || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(String(start || ""))) return ungueltig();
  const s = String(start).length === 16 ? `${start}:00` : String(start);
  try {
    const { session, client, verboten: v } = await kontext("PH Termin");
    if (v) return verboten();
    const doc = await client.getDoc("PH Termin", name);
    const r = await verzoegert(session, client, { doctype: "PH Termin", name, methode: "umbuchen", args: { neuer_start: s, berater: berater || doc.berater || undefined }, titel: `Verschieben von ${name}`, ms: doc.email ? MAIL_MS : undefined, pfad: `/crm/termine/${name}` });
    pfade("/crm/termine", "/crm");
    return { ...r, website: doc.kundenmail === "website" };
  } catch (err) {
    return fehler(err);
  }
}

/** Protokoll schreiben: Termin erledigt + Gesprächsprotokoll angelegt → Name des Protokolls. */
export async function protokollSchreibenAction({ termin } = {}) {
  if (!gueltigerName(termin)) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Termin");
    if (v) return verboten();
    const doc = await client.getDoc("PH Termin", termin);
    if (doc.beratungsgespraech) return { ok: true, name: doc.beratungsgespraech };
    if (doc.status === "Erledigt") {
      const k = doc.kontakt || (await docMethode(client, "PH Termin", termin, "kontakt_anlegen").catch(() => ""));
      const bg = await client.insert("PH Beratungsgespraech", { kontakt: k, termin, datum: String(doc.start || "").slice(0, 10), berater: doc.berater, status: "Offen", ort: doc.modus });
      await client.setValue("PH Termin", termin, "beratungsgespraech", bg.name).catch(() => null);
      return { ok: true, name: bg.name };
    }
    const name = await docMethode(client, "PH Termin", termin, "erledigt_mit_protokoll", { protokoll: 1 });
    pfade(`/crm/termine/${termin}`, "/crm/termine", "/crm", "/crm/gespraeche");
    return { ok: true, name };
  } catch (err) {
    return fehler(err);
  }
}

export async function terminAbschliessenAction({ termin, art = "ohne-protokoll", grund } = {}) {
  if (!gueltigerName(termin)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Termin");
    if (v) return verboten();
    const a = art === "nicht-erschienen"
      ? { methode: "nicht_erschienen", args: { grund: text(grund, 200) || undefined }, titel: `Nicht erschienen: ${termin}` }
      : { methode: "erledigt_mit_protokoll", args: { protokoll: 0 }, titel: `Abschließen von ${termin}` };
    const r = await verzoegert(session, client, { doctype: "PH Termin", name: termin, ...a, pfad: `/crm/termine/${termin}` });
    pfade("/crm/termine", "/crm");
    return r;
  } catch (err) {
    return fehler(err);
  }
}

export async function wiederBestaetigenAction({ termin, grund } = {}) {
  if (!gueltigerName(termin)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Termin");
    if (v || !istLeitung(session)) return verboten();
    await docMethode(client, "PH Termin", termin, "wieder_bestaetigen", { grund: text(grund, 200) });
    pfade(`/crm/termine/${termin}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function meetAction({ termin } = {}) {
  if (!gueltigerName(termin)) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Termin");
    if (v) return verboten();
    const url = await docMethode(client, "PH Termin", termin, "meet_link_erzeugen");
    pfade(`/crm/termine/${termin}`);
    return url ? { ok: true, url } : { ok: false, code: "unavailable", message: "Kein Videoraum möglich – Kunde bitte anrufen." };
  } catch (err) {
    return fehler(err);
  }
}

// -------------------------------------------------------------- Gespräche --

const GESPRAECH_FELDER = ["datum", "berater", "ort", "dauer_min", "stil", "zeitrahmen", "objektart", "adresse_objekt", "entscheider", "zusammenfassung", "naechster_schritt", "naechster_schritt_bis", "raeume", "fragen", "notiz_intern"];

/** Autosave des Gesprächsprotokolls (Konflikt über modified). */
export async function gespraechSpeichernAction({ name, werte, modified } = {}) {
  if (!gueltigerName(name) || !werte || typeof werte !== "object") return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Beratungsgespraech");
    if (v) return verboten();
    const sauber = { name };
    for (const f of GESPRAECH_FELDER) if (f in werte) sauber[f] = werte[f];
    if ("notiz_intern" in sauber && !istLeitung(session)) delete sauber.notiz_intern;
    if (Array.isArray(sauber.raeume)) {
      sauber.raeume = sauber.raeume.slice(0, 20).map((r) => ({ raum: String(r.raum || "Sonstiges"), wunsch: text(r.wunsch, 2000), budget_cent: Math.max(0, Math.round(Number(r.budget_cent) || 0)), prioritaet: ["Hoch", "Normal", "Niedrig"].includes(r.prioritaet) ? r.prioritaet : "Normal", marken: text(r.marken, 140), masse: text(r.masse, 140) }));
      sauber.budget_gesamt_cent = sauber.raeume.reduce((s2, r) => s2 + r.budget_cent, 0);
    }
    const doc = await client.save("PH Beratungsgespraech", sauber, { modified });
    let aufgabe = null;
    if (("naechster_schritt" in sauber || "naechster_schritt_bis" in sauber) && doc.naechster_schritt && doc.naechster_schritt_bis) aufgabe = await docMethode(client, "PH Beratungsgespraech", name, "aufgabe_anlegen").catch(() => null);
    return { ok: true, modified: doc.modified, budget_gesamt_cent: doc.budget_gesamt_cent, aufgabe };
  } catch (err) {
    return fehler(err);
  }
}

/** „Wie geht es weiter?“ (§ 5.6): planung · angebot · nur. */
export async function wieWeiterAction({ gespraech, wahl, planer, kosten, vertragsort } = {}) {
  if (!gueltigerName(gespraech) || !["planung", "angebot", "nur"].includes(wahl)) return ungueltig();
  if (wahl === "planung" && !["kostenlos", "pauschal", "aufwand"].includes(kosten)) return { ok: false, code: "invalid", message: T.gespraeche.kostenFehlt, fehler: { kosten: T.gespraeche.kostenFehlt } };
  try {
    const { session, client, verboten: v } = await kontext("PH Beratungsgespraech");
    if (v) return verboten();
    if (wahl === "nur") return { ...(await verzoegert(session, client, { doctype: "PH Beratungsgespraech", name: gespraech, methode: "status_setzen", args: { status: "Abgeschlossen" }, titel: `Abschließen von ${gespraech}`, pfad: `/crm/gespraeche/${gespraech}` })) };
    if (wahl === "planung") {
      await docMethode(client, "PH Beratungsgespraech", gespraech, "planung_beauftragen", { planer: planer || undefined });
      const k = { kostenlos: "kostenlos", pauschal: "Planungspauschale laut Angebot", aufwand: "nach Aufwand" }[kosten];
      await client.kommentar("PH Beratungsgespraech", gespraech, `Planung: ${k}${vertragsort ? ` · Vertragsort ${text(vertragsort, 40)}` : ""}`, "Comment");
      pfade(`/crm/gespraeche/${gespraech}`, "/crm/gespraeche");
      return { ok: true, weiter: kosten !== "kostenlos" ? "angebot" : null };
    }
    pfade(`/crm/gespraeche/${gespraech}`);
    return { ok: true, weiter: "angebot" };
  } catch (err) {
    return fehler(err);
  }
}

// ---------------------------------------------------------------- Kontakte --

export async function kontaktAnlegenAction(w = {}) {
  if (!text(w.nachname)) return { ok: false, code: "invalid", message: T.dialog.nachnameFehlt, fehler: { nachname: T.dialog.nachnameFehlt } };
  try {
    const { client, verboten: v } = await kontext("PH Kontakt", "create");
    if (v) return verboten();
    const r = await kontaktAnlegen(client, { kontaktart: w.kontaktart, anrede: w.anrede, vorname: text(w.vorname, 140), nachname: text(w.nachname, 140), firma: text(w.firma, 140), email: text(w.email, 140), telefon: text(w.telefon, 40), strasse: text(w.strasse, 140), plz: text(w.plz, 10), ort: text(w.ort, 140), trotzdem: w.trotzdem ? 1 : 0, quelle: "showroom" });
    if (r?.bestehend?.length) return { ok: false, code: "conflict", message: T.dialog.duplikat(r.bestehend[0].titel), bestehend: r.bestehend };
    pfade("/crm/kontakte");
    return { ok: true, name: r?.name || r };
  } catch (err) {
    return fehler(err);
  }
}

const KONTAKT_FELDER = new Set(["anrede", "titel_akad", "vorname", "nachname", "firma", "funktion", "berater", "sprache", "kommunikation_bevorzugt", "email", "telefon", "mobil", "strasse", "plz", "ort", "uid", "kontaktart", "notizen"]);

/** Details-Panel der Kundenakte: ein Feld speichern (notizen = permlevel 1, nur Leitung/GF). */
export async function kontaktFeldAction({ name, feld, wert } = {}) {
  if (!gueltigerName(name) || !KONTAKT_FELDER.has(feld)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Kontakt");
    if (v || (feld === "notizen" && !istLeitung(session))) return verboten();
    const doc = await client.setValue("PH Kontakt", name, feld, text(wert, feld === "notizen" ? 5000 : 200));
    pfade(`/kunden/${name}`);
    return { ok: true, modified: doc?.modified };
  } catch (err) {
    return fehler(err);
  }
}

export async function kontaktStatusAction({ name, aktion, grund } = {}) {
  if (!gueltigerName(name) || !["kunde", "widerspruch"].includes(aktion)) return ungueltig();
  if (aktion === "widerspruch" && !T.dialog.widerspruchQuellen.includes(grund)) return { ok: false, code: "invalid", message: "Bitte die Quelle wählen.", fehler: { quelle: "Bitte die Quelle wählen." } };
  try {
    const { client, verboten: v } = await kontext("PH Kontakt");
    if (v) return verboten();
    if (aktion === "kunde") await docMethode(client, "PH Kontakt", name, "als_kunde_markieren", { grund: text(grund, 200) || undefined });
    else await docMethode(client, "PH Kontakt", name, "widerspruch_erfassen", { quelle: grund });
    pfade(`/kunden/${name}`, "/crm/kontakte");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function kommentarAction({ doctype, name, inhalt } = {}) {
  const t = text(inhalt, 4000);
  if (!["PH Kontakt", "PH Anfrage", "PH Termin", "PH Beratungsgespraech", "PH Datenschutzanfrage"].includes(doctype) || !gueltigerName(name) || !t) return ungueltig();
  try {
    const { client, verboten: v } = await kontext(doctype);
    if (v) return verboten();
    const k = await client.kommentar(doctype, name, t, "Comment");
    return { ok: true, kommentar: k };
  } catch (err) {
    return fehler(err);
  }
}

/** E-Mail aus dem eigenen Postfach (ph_microsoft.mail_senden); bei Widerspruch nur vertragsbezogen (PH Kontakt.mail_senden erzwingt es). */
export async function mailSendenAction({ an, betreff, nachricht, bezug, vertragsbezogen } = {}) {
  const adr = text(an, 200);
  const b = text(betreff, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(adr) || !b) return { ok: false, code: "invalid", message: T.mails.senden.pflicht };
  try {
    const { client, verboten: v } = await kontext(bezug?.doctype || "PH Kontakt");
    if (v) return verboten();
    if (bezug?.doctype === "PH Kontakt" && gueltigerName(bezug?.name)) {
      const k = await client.getDoc("PH Kontakt", bezug.name);
      if (Number(k.nicht_kontaktieren) && !vertragsbezogen) return { ok: false, code: "invalid", message: T.mails.senden.vertragsbezogenPflicht };
    }
    const html = text(nachricht, 20000).split(/\n{2,}/).map((p) => `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`).join("");
    const r = await mailSenden(client, { an: adr, betreff: b, html, bezug_doctype: bezug?.doctype, bezug_name: bezug?.name });
    if (bezug?.doctype === "PH Kontakt") pfade(`/kunden/${bezug.name}`);
    return { ok: true, testmodus: !!r?.testmodus };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------- Datenschutz --

export async function datenschutzErfassenAction({ kontakt, art, eingang, kanal, beschreibung } = {}) {
  if (!gueltigerName(kontakt) || !Object.keys(T.dsaArt).includes(art)) return ungueltig(T.dialog.dsaArt);
  try {
    const { client, verboten: v } = await kontext("PH Datenschutzanfrage", "create");
    if (v) return verboten();
    const e = /^\d{4}-\d{2}-\d{2}$/.test(String(eingang || "")) ? eingang : isoDatum(new Date());
    const frist = new Date(`${e}T00:00:00`);
    frist.setMonth(frist.getMonth() + 1);
    const doc = await client.insert("PH Datenschutzanfrage", { kontakt, art, eingang: e, frist: isoDatum(frist), kanal: ["E-Mail", "Brief", "Telefon", "Showroom", "Portal", "Website"].includes(kanal) ? kanal : "E-Mail", beschreibung: text(beschreibung, 2000), status: "Offen" });
    if (art === "Widerspruch") await docMethode(client, "PH Kontakt", kontakt, "widerspruch_erfassen", { quelle: kanal || "E-Mail" }).catch(() => null);
    pfade("/crm/datenschutz", `/kunden/${kontakt}`);
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function datenschutzSchrittAction({ name, schritt, ergebnis, grund } = {}) {
  if (!gueltigerName(name) || !["identitaet", "bearbeiten", "abschliessen", "ablehnen"].includes(schritt)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Datenschutzanfrage");
    if (v || !istLeitung(session)) return { ok: false, code: "forbidden", message: T.datenschutz.nurLeitung };
    if (schritt === "identitaet") await client.setValue("PH Datenschutzanfrage", name, "identitaet_geprueft", 1);
    else if (schritt === "bearbeiten") await docMethode(client, "PH Datenschutzanfrage", name, "bearbeiten");
    else if (schritt === "abschliessen") await docMethode(client, "PH Datenschutzanfrage", name, "abschliessen", { ergebnis: text(ergebnis, 2000) });
    else {
      if (text(grund).length < 5) return { ok: false, code: "invalid", message: "Bitte einen Grund angeben (mind. 5 Zeichen).", fehler: { grund: "Bitte einen Grund angeben." } };
      await docMethode(client, "PH Datenschutzanfrage", name, "ablehnen", { grund: text(grund, 2000) });
    }
    pfade(`/crm/datenschutz/${name}`, "/crm/datenschutz");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ---------------------------------------------------------------- E-Mails --

const MID = /^[\w\-.=+/:@]{1,400}$/;

export async function mailZuordnenAction({ messageId, postfach, doctype, name, merken, adresse, betreff } = {}) {
  if (!MID.test(String(messageId || "")) || !["PH Kontakt", "PH Anfrage", "PH Termin", "PH Beratungsgespraech"].includes(doctype) || !gueltigerName(name)) return ungueltig();
  try {
    const { client, verboten: v } = await kontext(doctype);
    if (v) return verboten();
    const r = await mailZuordnen(client, { message_id: messageId, postfach: text(postfach, 200), bezug_doctype: doctype, bezug_name: name, adresse_merken: merken ? 1 : 0, adresse: text(adresse, 200), betreff: text(betreff, 200) });
    pfade("/posteingang", doctype === "PH Kontakt" ? `/kunden/${name}` : null);
    return { ok: true, gemerkt: !!r?.adresse_gemerkt };
  } catch (err) {
    return fehler(err);
  }
}

export async function adresseSperrenAction({ adresse, notiz } = {}) {
  const a = text(adresse, 200).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+$/.test(a)) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Mail Adresse", "create");
    if (v) return verboten();
    await adresseSperren(client, { adresse: a, notiz: text(notiz, 500) });
    pfade("/posteingang");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function kontaktAusMailAction({ messageId, postfach, adresse, name } = {}) {
  if (!MID.test(String(messageId || ""))) return ungueltig();
  try {
    const { client, verboten: v } = await kontext("PH Kontakt", "create");
    if (v) return verboten();
    const r = await kontaktAusMail(client, { message_id: messageId, postfach: text(postfach, 200), adresse: text(adresse, 200), name: text(name, 200) });
    pfade("/posteingang", "/crm/kontakte");
    return { ok: true, kontakt: r?.kontakt };
  } catch (err) {
    if (err?.code === "conflict") return { ok: false, code: "conflict", message: T.mails.bekannt, vorschlaege: err?.detail?.vorschlaege || [] };
    return fehler(err);
  }
}

function maskiere(email) {
  const [lokal, domain] = String(email || "").split("@");
  if (!domain) return "";
  return `${lokal.slice(0, 1)}***@${domain}`;
}

const ANFRAGE_FELDER = new Set(["zugewiesen_an", "prioritaet", "naechster_schritt", "ort_der_beratung", "budget_hinweis", "wert_cent", "erwarteter_abschluss", "projektart", "objektart"]);

/** Details-Panel der Anfrage-Akte (Autosave je Feld). In Gewonnen/Verloren/Spam nur Leitung. */
export async function anfrageFeldAction({ name, feld, wert } = {}) {
  if (!gueltigerName(name) || !ANFRAGE_FELDER.has(feld)) return ungueltig();
  try {
    const { session, client, verboten: v } = await kontext("PH Anfrage");
    if (v) return verboten();
    const doc = await client.getDoc("PH Anfrage", name);
    if (["Gewonnen", "Verloren", "Spam"].includes(doc.status) && !istLeitung(session)) return { ok: false, code: "forbidden", message: T.anfrageAkte.gesperrt };
    const w = feld === "wert_cent" ? Math.max(0, Math.round(Number(wert) || 0)) : text(wert, 200);
    const neu = await client.setValue("PH Anfrage", name, feld, w);
    pfade(`/crm/anfragen/${name}`);
    return { ok: true, modified: neu?.modified };
  } catch (err) {
    return fehler(err);
  }
}
