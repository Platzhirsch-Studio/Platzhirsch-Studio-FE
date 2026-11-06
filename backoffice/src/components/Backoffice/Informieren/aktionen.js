"use server";
// Server Actions für „Kunden informieren“ (G-18) und „Leitung bitten“ (G-05) – Team P0-5c.
// Jede Aktion prüft Sitzung und Recht erneut, validiert und gibt { ok, code, message, fehler?, … } zurück – nie werfen (Q-A2).
// Mock-Pfad: derselbe Client (MockClient) – Aufgaben landen in der Mock-Datenbank, Mails werden nie versendet.

import { requireSession } from "@/lib/backoffice/auth/dal";
import { backoffice, ladeMeta } from "@/lib/backoffice/frappe";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { bereich as bereichDef, kanonischeRoute } from "@/lib/backoffice/bereiche/index";
import { planeCommit } from "@/lib/backoffice/commit/server";
import { darfLeitungBitten, informierenVersand, leitungFinden, MAIL_AKTION } from "./server";
import { pruefeInformieren, pruefeObjekt, tagIso } from "./logik";
import { INFORMIEREN_TEXTE as T, LEITUNG_TEXTE as L } from "./texte";

const METHODE = /^[a-z][a-z0-9_]{2,60}$/;
const AKTION = /^[a-z0-9][a-z0-9-]{0,40}$/;
const PFAD = /^\/[\w\-/.%?=&]{0,200}$/;

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message };
  console.error("[backoffice] P0-5c-Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: "Gerade nicht erreichbar. Bitte erneut versuchen." };
}

const UNGUELTIG = { ok: false, code: "invalid", message: "Unvollständige Angaben." };
const KEIN_RECHT = { ok: false, code: "forbidden", message: "Dafür fehlt das Recht." };

/** Methode des Bereichs aus der Vorlage (serialisiert vom Client) prüfen und Argumente belegen. */
function bereichsMethode(methode, wert) {
  if (!methode || typeof methode !== "object" || !METHODE.test(String(methode.name || ""))) return null;
  const args = {};
  for (const [k, v] of Object.entries(methode.args && typeof methode.args === "object" ? methode.args : {})) {
    if (!/^[a-z_]{1,40}$/.test(k)) return null;
    if (v !== null && !["string", "number", "boolean"].includes(typeof v)) return null;
    args[k] = v;
  }
  const felder = methode.felder && typeof methode.felder === "object" ? methode.felder : {};
  for (const quelle of ["an", "betreff", "nachricht"]) {
    const ziel = felder[quelle];
    if (ziel === undefined) continue;
    if (!/^[a-z_]{1,40}$/.test(String(ziel))) return null;
    args[ziel] = wert[quelle];
  }
  return { name: methode.name, args, textFrei: !!felder.nachricht };
}

/**
 * Senden planen (verzögerter Commit 8 s, Q-C3). Der Client zeigt „Rückgängig“ und führt danach aus.
 * @param {{objekt:{doctype,name,titel?}, kanal:"email", an:string, betreff:string, nachricht:string,
 *          methode?:{name:string, args?:object, felder?:{an?,betreff?,nachricht?}}, pfad?:string, empfaengerName?:string}} e
 * @returns {Promise<{ok:true, token:string, ms:number, objekt:object, weg:"exchange"|"bereich"} | {ok:false, code, message, fehler?}>}
 */
export async function informierenPlanenAction(e = {}) {
  const session = await requireSession();
  const objekt = pruefeObjekt(e.objekt);
  if (!objekt) return UNGUELTIG;
  const p = pruefeInformieren({ ...e, kanal: "email" }, T);
  if (!p.ok) return { ok: false, code: "invalid", message: Object.values(p.fehler)[0], fehler: p.fehler };
  const pfad = typeof e.pfad === "string" && PFAD.test(e.pfad) ? e.pfad : undefined;
  try {
    const client = backoffice(session);
    const meta = await ladeMeta(client, objekt.doctype);
    if (!darfDoc(session, meta, "write")) return KEIN_RECHT;
    const versand = await informierenVersand(session);
    const titel = T.fehlerText(String(e.empfaengerName || p.wert.an).slice(0, 80));
    const plan = { objekt, titel, schluessel: `informieren:${objekt.doctype}:${objekt.name}:${Date.now()}` };
    if (versand.exchange) {
      const r = await planeCommit(session, { ...plan, action: MAIL_AKTION, args: { an: p.wert.an, betreff: p.wert.betreff, nachricht: p.wert.nachricht, pfad } });
      return r?.ok === false ? r : { ...r, ok: true, weg: "exchange" };
    }
    const m = bereichsMethode(e.methode, p.wert);
    if (!m) return { ok: false, code: "unavailable", message: T.versandNichtVerfuegbar };
    const r = await planeCommit(session, { ...plan, action: "fundament.methode", args: { doctype: objekt.doctype, name: objekt.name, methode: m.name, args: m.args, pfad } });
    return r?.ok === false ? r : { ...r, ok: true, weg: "bereich" };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Telefon/Brief erfassen oder „Nicht nötig“ vermerken – Zeitleisteneintrag am Objekt, sofort (keine Außenwirkung).
 * @param {{objekt:object, kanal:"telefon"|"brief"|"keiner", nachricht?:string}} e
 */
export async function informierenErfassenAction(e = {}) {
  const session = await requireSession();
  const objekt = pruefeObjekt(e.objekt);
  if (!objekt) return UNGUELTIG;
  const kanal = e.kanal === "keiner" ? "keiner" : e.kanal;
  let notiz = T.nichtNoetigNotiz;
  if (kanal !== "keiner") {
    const p = pruefeInformieren({ kanal, nachricht: e.nachricht }, T);
    if (!p.ok || kanal === "email") return { ok: false, code: "invalid", message: p.ok ? UNGUELTIG.message : Object.values(p.fehler)[0], fehler: p.ok ? undefined : p.fehler };
    notiz = `${kanal === "telefon" ? "Kunde telefonisch informiert" : "Kunde per Brief informiert"}: ${p.wert.nachricht}`;
  }
  try {
    const client = backoffice(session);
    const meta = await ladeMeta(client, objekt.doctype);
    if (!darfDoc(session, meta, "write")) return KEIN_RECHT;
    await client.kommentar(objekt.doctype, objekt.name, notiz, "Comment");
    return { ok: true, kanal, zeit: new Date().toISOString() };
  } catch (err) {
    return fehler(err);
  }
}

function pruefeBitte(e) {
  const objekt = pruefeObjekt(e?.objekt);
  const b = bereichDef(String(e?.bereich || ""));
  const aktion = String(e?.aktion || "");
  const aktionTitel = String(e?.aktionTitel || "").trim().slice(0, 120);
  if (!objekt || !b || !AKTION.test(aktion) || !aktionTitel) return null;
  return { objekt, b, aktion, aktionTitel, titel: L.aufgabenTitel(aktionTitel, objekt.titel).slice(0, 140) };
}

async function vorhandeneBitte(client, { objekt, titel }) {
  const zeilen = await client.getList("PH Aufgabe", {
    fields: ["name", "creation", "status"],
    filters: [["referenz_doctype", "=", objekt.doctype], ["referenz_name", "=", objekt.name], ["titel", "=", titel], ["creation", ">=", `${tagIso()} 00:00:00`]],
    orderBy: "creation desc",
    limit: 1,
  });
  return zeilen[0] || null;
}

function aufgabeHref(name) {
  return kanonischeRoute("PH Aufgabe", name) || `/d/ph-aufgabe/${encodeURIComponent(name)}`;
}

/**
 * Stand einer Bitte heute (für den Anfangszustand des Knopfs).
 * @returns {Promise<{ok:true, angefragt:null|{aufgabe:string, zeit:string, href:string}} | {ok:false, …}>}
 */
export async function leitungStatusAction(e = {}) {
  const session = await requireSession();
  const b = pruefeBitte(e);
  if (!b) return UNGUELTIG;
  try {
    const client = backoffice(session);
    if (!(await darfLeitungBitten(session, client))) return KEIN_RECHT;
    const v = await vorhandeneBitte(client, b);
    return { ok: true, angefragt: v ? { aufgabe: v.name, zeit: v.creation, href: aufgabeHref(v.name) } : null };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Leitung bitten: legt genau eine PH Aufgabe je Objekt/Aktion/Tag an (Q-C11) – zugewiesen an die Bereichsleitung,
 * mit Bezug zum Objekt. Zweiter Versuch am selben Tag → { bereits:true } mit der vorhandenen Aufgabe.
 * @param {{bereich:string, aktion:string, aktionTitel:string, objekt:{doctype,name,titel?}, kommentar?:string}} e
 */
export async function leitungBittenAction(e = {}) {
  const session = await requireSession();
  const b = pruefeBitte(e);
  if (!b) return UNGUELTIG;
  const kommentar = String(e.kommentar || "").trim().slice(0, 2000);
  try {
    const client = backoffice(session);
    if (!(await darfLeitungBitten(session, client))) return KEIN_RECHT;
    const v = await vorhandeneBitte(client, b);
    if (v) return { ok: true, bereits: true, aufgabe: v.name, zeit: v.creation, href: aufgabeHref(v.name) };
    const leitung = await leitungFinden(client, b.b.rollenName);
    const maske = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const beschreibung = [
      `<p>${maske(L.vorbelegt(b.aktionTitel, b.objekt.titel))}</p>`,
      kommentar ? `<p>${maske(kommentar).replace(/\n/g, "<br>")}</p>` : "",
      `<p>Angefragt von ${maske(String(session.name || session.user))}.</p>`,
    ].join("");
    const doc = await client.insert("PH Aufgabe", {
      naming_series: "PH-AUF-.YYYY.-.#####",
      titel: b.titel,
      status: "Offen",
      prioritaet: "Normal",
      faellig: tagIso(),
      zugewiesen_an: leitung || "",
      referenz_doctype: b.objekt.doctype,
      referenz_name: b.objekt.name,
      quelle: "manuell",
      beschreibung,
    });
    return { ok: true, bereits: false, aufgabe: doc.name, zeit: doc.creation || new Date().toISOString(), href: aufgabeHref(doc.name), zugewiesen: !!leitung };
  } catch (err) {
    return fehler(err);
  }
}
