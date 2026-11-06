"use server";
// Server Actions der Zentrale (10-konzept-zentrale § 14.3). Jede Action: requireSession → Recht (darf/darfDoc) →
// Aufruf über backoffice(session) → { ok:true, … , undo? } | { ok:false, code, message } – wirft nie (Q-A2).
// Mock-Pfad: der Mock-Client trägt dieselben Aufrufe (getDoc/save/setValue); Frappe-Methoden ohne Mock-Gegenstück
// (ToDo, Kalkulation, Microsoft-Status) laufen über mock.js bzw. dienste.js.
// Undo nach Q-C3 Variante B (sofort + Gegenwert) für Status, Fälligkeit, Zuständigkeit; Rückfrage statt Undo für
// Testmodus, Website-API und Standardfirma (Q-C6, Außenwirkung).

import { refresh } from "next/cache";
import { requireSession } from "../auth/dal.js";
import { darfDoc, istAdmin } from "../auth/rechte.js";
import { backoffice, ladeMeta } from "../frappe/index.js";
import { istBackofficeError } from "../frappe/errors.js";
import { AUFGABE_STATUS, addTage, todoStatus } from "./aufgaben.js";
import { setzeMockTodo } from "./mock.js";
import { darfKalkulation, kalkulationSpeichern } from "./dienste.js";
import { tagIso } from "./fristen.js";

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message };
  console.error("[zentrale] Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: "Das hat nicht geklappt. Bitte erneut versuchen." };
}

function aktualisiere() {
  try {
    refresh();
  } catch {
    // außerhalb einer Server Action (Tests) ohne Wirkung
  }
}

async function metaRecht(client, session, doctype, aktion) {
  const meta = await ladeMeta(client, doctype);
  return darfDoc(session, meta, aktion);
}

const NAME = /^[A-Za-z0-9 _.\-@:/]{1,140}$/;

// ------------------------------------------------------------------------------------------------ Aufgaben

/**
 * Status einer Aufgabe setzen (Erledigen, Wieder öffnen, In Arbeit, Verwerfen).
 * quelle "aufgabe": PH Aufgabe.status_setzen(status, ergebnis) · quelle "todo": ToDo.status Open|Closed|Cancelled
 * @returns {Promise<{ok:true, status:string, undo:{status:string}}|{ok:false, code:string, message:string}>}
 */
export async function aufgabeStatusAction({ quelle = "aufgabe", name, status, ergebnis } = {}) {
  const session = await requireSession();
  if (!NAME.test(String(name || ""))) return { ok: false, code: "invalid", message: "Unbekannte Aufgabe." };
  if (!AUFGABE_STATUS.includes(status)) return { ok: false, code: "invalid", message: "Unbekannter Status." };
  try {
    const client = backoffice(session);
    if (quelle === "todo") {
      if (client.modus !== "frappe") {
        const r = setzeMockTodo(name, todoStatus(status), session);
        if (!r.ok) return r;
        aktualisiere();
        return { ok: true, status, undo: { status: r.alt === "Closed" ? "Erledigt" : r.alt === "Cancelled" ? "Verworfen" : "Offen" } };
      }
      const alt = await client.getDoc("ToDo", name);
      await client.setValue("ToDo", name, "status", todoStatus(status));
      aktualisiere();
      return { ok: true, status, undo: { status: alt.status === "Closed" ? "Erledigt" : alt.status === "Cancelled" ? "Verworfen" : "Offen" } };
    }
    if (!(await metaRecht(client, session, "PH Aufgabe", "write"))) return { ok: false, code: "forbidden", message: "Du darfst diese Aufgabe nicht ändern." };
    const alt = await client.getDoc("PH Aufgabe", name);
    if (client.modus === "frappe") {
      await client.runDocMethod("PH Aufgabe", name, "status_setzen", ergebnis ? { status, ergebnis: String(ergebnis).slice(0, 1000) } : { status });
    } else {
      const werte = { status };
      if (status === "Erledigt") Object.assign(werte, { erledigt_am: new Date().toISOString().slice(0, 19).replace("T", " "), erledigt_von: session.user });
      if (ergebnis) werte.ergebnis = String(ergebnis).slice(0, 1000);
      await client.setValue("PH Aufgabe", name, werte);
    }
    aktualisiere();
    return { ok: true, status, undo: { status: alt.status } };
  } catch (err) {
    return fehler(err);
  }
}

/** Fälligkeit verschieben: tage (PH Aufgabe.verschieben, rechnet ab max(fällig, heute)) oder freies Datum. */
export async function aufgabeVerschiebenAction({ name, tage, datum } = {}) {
  const session = await requireSession();
  if (!NAME.test(String(name || ""))) return { ok: false, code: "invalid", message: "Unbekannte Aufgabe." };
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Aufgabe", "write"))) return { ok: false, code: "forbidden", message: "Du darfst diese Aufgabe nicht ändern." };
    const alt = await client.getDoc("PH Aufgabe", name);
    let neu;
    if (datum) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(datum))) return { ok: false, code: "invalid", message: "Datum im Format TT.MM.JJJJ" };
      await client.setValue("PH Aufgabe", name, "faellig", datum);
      neu = datum;
    } else {
      const n = Math.max(1, Math.min(365, Number(tage) || 1));
      if (client.modus === "frappe") neu = await client.runDocMethod("PH Aufgabe", name, "verschieben", { tage: n });
      else {
        const heute = tagIso();
        const basis = alt.faellig && String(alt.faellig) > heute ? String(alt.faellig).slice(0, 10) : heute;
        neu = addTage(basis, n);
        await client.setValue("PH Aufgabe", name, "faellig", neu);
      }
    }
    aktualisiere();
    return { ok: true, faellig: typeof neu === "string" ? neu : neu?.message || null, undo: { datum: alt.faellig || null } };
  } catch (err) {
    return fehler(err);
  }
}

/** Zuständigkeit setzen (Server spiegelt die Zuweisung). */
export async function aufgabeZuweisenAction({ name, user } = {}) {
  const session = await requireSession();
  if (!NAME.test(String(name || "")) || !NAME.test(String(user || ""))) return { ok: false, code: "invalid", message: "Unbekannte Aufgabe oder Person." };
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Aufgabe", "write"))) return { ok: false, code: "forbidden", message: "Du darfst diese Aufgabe nicht ändern." };
    const alt = await client.getDoc("PH Aufgabe", name);
    await client.setValue("PH Aufgabe", name, "zugewiesen_an", user);
    aktualisiere();
    return { ok: true, undo: { user: alt.zugewiesen_an || null } };
  } catch (err) {
    return fehler(err);
  }
}

/** Feld einer Aufgabe (Priorität, Beschreibung, Ergebnis, Erinnerung) – sofort, mit Gegenwert. */
export async function aufgabeFeldAction({ name, feld, wert } = {}) {
  const session = await requireSession();
  const FELDER = { prioritaet: ["Normal", "Hoch", "Niedrig"], beschreibung: null, ergebnis: null, erinnerung: [0, 1, "0", "1"] };
  if (!NAME.test(String(name || "")) || !(feld in FELDER)) return { ok: false, code: "invalid", message: "Dieses Feld kann hier nicht geändert werden." };
  if (FELDER[feld] && !FELDER[feld].includes(wert)) return { ok: false, code: "invalid", message: "Ungültiger Wert." };
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Aufgabe", "write"))) return { ok: false, code: "forbidden", message: "Du darfst diese Aufgabe nicht ändern." };
    const alt = await client.getDoc("PH Aufgabe", name);
    await client.setValue("PH Aufgabe", name, feld, typeof wert === "string" ? wert.slice(0, 4000) : Number(wert));
    aktualisiere();
    return { ok: true, undo: { wert: alt[feld] ?? null } };
  } catch (err) {
    return fehler(err);
  }
}

/** Schnellanlage (§ 3.7): nur mit create auf PH Aufgabe. Fällig ist Pflicht (Standard morgen). */
export async function aufgabeAnlegenAction({ titel, faellig, zugewiesen_an, prioritaet = "Normal", referenz_doctype, referenz_name, beschreibung, erinnerung = 1 } = {}) {
  const session = await requireSession();
  const t = String(titel || "").trim();
  if (!t) return { ok: false, code: "invalid", message: "Bitte einen Titel eingeben.", fehler: { titel: "Bitte einen Titel eingeben." } };
  if (t.length > 140) return { ok: false, code: "invalid", message: "Höchstens 140 Zeichen.", fehler: { titel: "Höchstens 140 Zeichen." } };
  const f = faellig && /^\d{4}-\d{2}-\d{2}$/.test(String(faellig)) ? String(faellig) : addTage(tagIso(), 1);
  if (!["Normal", "Hoch", "Niedrig"].includes(prioritaet)) return { ok: false, code: "invalid", message: "Ungültige Priorität." };
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Aufgabe", "create"))) return { ok: false, code: "forbidden", message: "Du darfst keine Aufgaben anlegen." };
    const werte = { titel: t, status: "Offen", faellig: f, prioritaet, zugewiesen_an: zugewiesen_an || session.user, erinnerung: erinnerung ? 1 : 0, quelle: "manuell" };
    if (referenz_doctype && referenz_name && NAME.test(String(referenz_name))) Object.assign(werte, { referenz_doctype, referenz_name });
    if (beschreibung) werte.beschreibung = String(beschreibung).slice(0, 4000);
    const doc = await client.insert("PH Aufgabe", werte);
    aktualisiere();
    return { ok: true, name: doc.name, titel: doc.titel || t };
  } catch (err) {
    return fehler(err);
  }
}

/** Massenaktion Erledigen (§ 5.2): je Zeile, Ergebnisliste mit Undo-Daten; übersprungen = bereits erledigt/ohne Recht. */
export async function aufgabenErledigenAction({ zeilen = [] } = {}) {
  const ergebnisse = [];
  for (const z of zeilen.slice(0, 200)) {
    const r = await aufgabeStatusAction({ quelle: z.quelle, name: z.name, status: "Erledigt" });
    ergebnisse.push({ id: `${z.quelle}:${z.name}`, quelle: z.quelle, name: z.name, ok: r.ok, undo: r.undo || null, message: r.ok ? null : r.message });
  }
  return { ok: true, ergebnisse, erledigt: ergebnisse.filter((e) => e.ok).length, uebersprungen: ergebnisse.filter((e) => !e.ok).length };
}

// ------------------------------------------------------------------------------------------------ Einstellungen

const EINSTELLUNGEN_FELDER = {
  allgemein: ["standard_firma", "website_url", "team_email", "fehler_email"],
  website: ["api_rate_limit_pro_minute", "api_rate_limit_gast_pro_minute", "api_rate_limit_gesamt_pro_minute", "api_idempotenz_tage", "api_protokoll_aufbewahrung_tage", "api_protokoll_nutzdaten", "website_revalidate_aktiv", "website_revalidate_drossel_sekunden", "website_revalidate_secret_name"],
  kalender: ["feiertage_bundesland", "betriebsruhe"],
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Prüfregeln wie ph_einstellungen.py validate (Auszug) → { feld: Text } */
export async function pruefeEinstellungen(werte) {
  const f = {};
  for (const k of ["team_email", "fehler_email"]) if (werte[k] && !EMAIL.test(String(werte[k]))) f[k] = "Bitte eine gültige E-Mail-Adresse eingeben.";
  if ("website_url" in werte && werte.website_url && !/^https:\/\/[^\s]+$/.test(String(werte.website_url))) f.website_url = "Adresse beginnt mit https://";
  for (const k of ["api_rate_limit_pro_minute", "api_rate_limit_gast_pro_minute", "api_rate_limit_gesamt_pro_minute", "api_idempotenz_tage", "website_revalidate_drossel_sekunden"]) {
    if (k in werte && (!Number.isInteger(Number(werte[k])) || Number(werte[k]) < 1)) f[k] = "Mindestens 1.";
  }
  if ("api_protokoll_aufbewahrung_tage" in werte && Number(werte.api_protokoll_aufbewahrung_tage) < 7) f.api_protokoll_aufbewahrung_tage = "Mindestens 7 Tage.";
  if ("website_revalidate_secret_name" in werte && werte.website_revalidate_secret_name && !/^ph_[a-z0-9_]+$/.test(String(werte.website_revalidate_secret_name))) f.website_revalidate_secret_name = "Nur der Name, beginnt mit ph_ (Kleinbuchstaben, Unterstrich).";
  if (Array.isArray(werte.betriebsruhe)) {
    const gesehen = new Set();
    werte.betriebsruhe.forEach((z, i) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(z.datum || ""))) f[`betriebsruhe.${i}`] = "Datum im Format TT.MM.JJJJ";
      else if (gesehen.has(z.datum)) f[`betriebsruhe.${i}`] = "Datum bereits eingetragen.";
      gesehen.add(z.datum);
    });
  }
  return f;
}

/** PH Einstellungen speichern (Reiter Allgemein/Website/Kalender) – nur Admin; Konflikt über modified. */
export async function einstellungenSpeichernAction({ reiter, werte = {}, modified } = {}) {
  const session = await requireSession();
  const erlaubt = EINSTELLUNGEN_FELDER[reiter];
  if (!erlaubt) return { ok: false, code: "invalid", message: "Unbekannter Bereich der Einstellungen." };
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Einstellungen", "write"))) return { ok: false, code: "forbidden", message: "Einstellungen ändert die Backoffice-Administration." };
    const sauber = Object.fromEntries(Object.entries(werte).filter(([k]) => erlaubt.includes(k)));
    if (Array.isArray(sauber.betriebsruhe)) sauber.betriebsruhe = sauber.betriebsruhe.map((z) => ({ doctype: "PH Betriebsruhe", datum: String(z.datum || "").slice(0, 10), bezeichnung: String(z.bezeichnung || "Betriebsruhe").slice(0, 140) }));
    const f = await pruefeEinstellungen(sauber);
    if (Object.keys(f).length) return { ok: false, code: "invalid", message: "Bitte die markierten Felder prüfen.", fehler: f };
    const doc = await client.save("PH Einstellungen", sauber, { modified });
    aktualisiere();
    return { ok: true, modified: doc.modified };
  } catch (err) {
    return fehler(err);
  }
}

/** Testmodus schalten (§ 3.9.1): eigene Aktion nach Rückfrage, sofort gespeichert. */
export async function testmodusSchaltenAction({ an } = {}) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Einstellungen", "write"))) return { ok: false, code: "forbidden", message: "Den Testmodus schaltet die Backoffice-Administration." };
    await client.save("PH Einstellungen", { testmodus: an ? 1 : 0 });
    aktualisiere();
    return { ok: true, an: !!an };
  } catch (err) {
    return fehler(err);
  }
}

/** Website-API schalten (Rückfrage im Client, Band auf der Seite). */
export async function apiSchaltenAction({ an } = {}) {
  const session = await requireSession();
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Einstellungen", "write"))) return { ok: false, code: "forbidden", message: "Die Website-API schaltet die Backoffice-Administration." };
    await client.save("PH Einstellungen", { api_aktiv: an ? 1 : 0 });
    aktualisiere();
    return { ok: true, an: !!an };
  } catch (err) {
    return fehler(err);
  }
}

const FIRMA_FELDER = ["firmenname", "marke", "kurzname", "rechtsform", "geschaeftsfuehrung", "strasse", "plz", "ort", "land", "telefon", "email", "website", "uid", "firmenbuchnummer", "firmenbuchgericht", "steuernummer", "bank", "iban", "bic", "zahlungsziel_tage", "fusszeile"];

/** Prüfregeln Firma: UID (Österreich ATU + 8 Ziffern), IBAN (Prüfziffer mod 97), E-Mail. */
export async function pruefeFirma(w) {
  const f = {};
  if ("firmenname" in w && !String(w.firmenname || "").trim()) f.firmenname = "Pflichtfeld.";
  if (w.uid && String(w.land || "Österreich") === "Österreich" && !/^ATU\d{8}$/.test(String(w.uid).replace(/\s+/g, ""))) f.uid = "UID für Österreich: ATU und 8 Ziffern.";
  if (w.iban) {
    const i = String(w.iban).replace(/\s+/g, "").toUpperCase();
    const umgestellt = (i.slice(4) + i.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
    let rest = 0;
    for (const z of umgestellt) rest = (rest * 10 + Number(z)) % 97;
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(i) || rest !== 1) f.iban = "IBAN ist ungültig (Prüfziffer).";
  }
  if (w.email && !EMAIL.test(String(w.email))) f.email = "Bitte eine gültige E-Mail-Adresse eingeben.";
  if ("zahlungsziel_tage" in w && w.zahlungsziel_tage !== "" && (!Number.isInteger(Number(w.zahlungsziel_tage)) || Number(w.zahlungsziel_tage) < 0)) f.zahlungsziel_tage = "Ganze Zahl ab 0.";
  return f;
}

/** PH Firma speichern (Admin, GF). steuernummer nur GF/Admin/Faktura-Leitung (UI blendet aus). */
export async function firmaSpeichernAction({ name, werte = {}, modified } = {}) {
  const session = await requireSession();
  if (typeof name !== "string" || !name.trim() || name.length > 140 || [...name].some((c) => c.charCodeAt(0) < 32))return { ok: false, code: "invalid", message: "Unbekannte Firma." };
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Firma", "write"))) return { ok: false, code: "forbidden", message: "Firmendaten ändern Geschäftsführung und Administration." };
    const sauber = Object.fromEntries(Object.entries(werte).filter(([k]) => FIRMA_FELDER.includes(k)));
    if (sauber.iban) sauber.iban = String(sauber.iban).replace(/\s+/g, "").toUpperCase();
    if (sauber.uid) sauber.uid = String(sauber.uid).replace(/\s+/g, "").toUpperCase();
    const f = await pruefeFirma(sauber);
    if (Object.keys(f).length) return { ok: false, code: "invalid", message: "Bitte die markierten Felder prüfen.", fehler: f };
    const doc = await client.save("PH Firma", { ...sauber, name }, { modified });
    aktualisiere();
    return { ok: true, modified: doc.modified };
  } catch (err) {
    return fehler(err);
  }
}

/** Als Standardfirma setzen (Rückfrage im Client, kein Undo – Rechtsträger der Belege). */
export async function firmaStandardAction({ name } = {}) {
  const session = await requireSession();
  if (typeof name !== "string" || !name.trim() || name.length > 140) return { ok: false, code: "invalid", message: "Unbekannte Firma." };
  try {
    const client = backoffice(session);
    if (!(await metaRecht(client, session, "PH Firma", "write"))) return { ok: false, code: "forbidden", message: "Die Standardfirma setzen Geschäftsführung und Administration." };
    const alle = await client.getList("PH Firma", { fields: ["name", "standard", "modified"], limit: 50 });
    for (const f of alle) if (f.name !== name && Number(f.standard)) await client.save("PH Firma", { name: f.name, standard: 0 });
    await client.save("PH Firma", { name, standard: 1 });
    if (await metaRecht(client, session, "PH Einstellungen", "write")) await client.save("PH Einstellungen", { standard_firma: name });
    aktualisiere();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Kalkulation (ph_projekte) speichern – nur Projekte-Leitung, GF, Admin. */
export async function kalkulationSpeichernAction(daten = {}) {
  const session = await requireSession();
  if (!darfKalkulation(session)) return { ok: false, code: "forbidden", message: "Kalkulation pflegen nur Projekte-Leitung, Geschäftsführung und Administration." };
  try {
    const r = await kalkulationSpeichern(backoffice(session), daten);
    aktualisiere();
    return { ok: true, daten: r };
  } catch (err) {
    return fehler(err);
  }
}

const MS_FELDER = ["sso_aktiv", "tenant_id", "backoffice_client_id", "toleranz_sekunden", "sso_rate_limit_pro_minute", "auto_benutzer_anlegen", "rollen_aus_gruppen", "webhook_basis_url", "interne_domains", "mail_sync_aktiv", "anhaenge_uebernehmen", "anhang_max_mb", "unzugeordnet_tage", "kundenmails_ueber_exchange", "kalender_sync_aktiv", "kalender_termin", "kalender_montage", "kalender_service", "teams_fuer_video", "belegt_als_event", "aufgabe_bei_verschiebung", "sync_tage_vergangenheit", "sync_tage_zukunft", "kontakte_sync_aktiv", "kontakte_postfach", "kontakte_ordner", "protokoll_aufbewahrung_tage"];
const ABLAGE_FELDER = ["speicher_adapter", "speicher_praefix", "presign_sekunden", "upload_token_stunden", "chunk_mb", "max_groesse_mb", "s3_pruefsumme_nachrechnen", "erlaubte_endungen", "gesperrte_endungen", "duplikat_verhalten", "automatische_ordner", "papierkorb_tage", "sperre_stunden", "vorschau_aktiv", "vorschau_px", "office_vorschau", "soffice_pfad", "video_poster", "volltext_aktiv", "volltext_max_mb", "freigabe_basis_url", "freigabe_standard_tage", "freigabe_max_tage", "freigabe_passwort_pflicht"];

/** Single einer Fach-App speichern (Microsoft, Ablage) – Feldliste exakt aus dem DocType, nur Admin. */
export async function singleSpeichernAction({ doctype, werte = {}, modified } = {}) {
  const session = await requireSession();
  const felder = doctype === "PH Microsoft Einstellungen" ? MS_FELDER : doctype === "PH Ablage Einstellungen" ? ABLAGE_FELDER : null;
  if (!felder) return { ok: false, code: "invalid", message: "Unbekannte Einstellungen." };
  if (!istAdmin(session)) return { ok: false, code: "forbidden", message: "Diese Einstellungen ändert die Backoffice-Administration." };
  const sauber = Object.fromEntries(Object.entries(werte).filter(([k]) => felder.includes(k)));
  const f = {};
  for (const [k, v] of Object.entries(sauber)) {
    if (/_(sekunden|tage|mb|px|stunden|minute)$/.test(k) && v !== "" && (!Number.isInteger(Number(v)) || Number(v) < 0)) f[k] = "Ganze Zahl ab 0.";
    if (/_url$/.test(k) && v && !/^https:\/\//.test(String(v))) f[k] = "Adresse beginnt mit https://";
  }
  if (doctype === "PH Ablage Einstellungen" && sauber.freigabe_standard_tage && sauber.freigabe_max_tage && Number(sauber.freigabe_standard_tage) > Number(sauber.freigabe_max_tage)) f.freigabe_standard_tage = "Darf die höchste Gültigkeit nicht überschreiten.";
  if (Object.keys(f).length) return { ok: false, code: "invalid", message: "Bitte die markierten Felder prüfen.", fehler: f };
  try {
    const client = backoffice(session);
    const doc = await client.save(doctype, sauber, { modified });
    aktualisiere();
    return { ok: true, modified: doc.modified };
  } catch (err) {
    return fehler(err);
  }
}
