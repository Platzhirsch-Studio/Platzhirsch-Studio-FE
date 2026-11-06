"use server";
// Server Actions des Bereichs Service (10-konzept-service §14.3). Jede Action prüft Sitzung und DocType-Recht neu,
// validiert die Eingaben und gibt { ok:true, … } | { ok:false, code, message, fehler? } zurück – nie werfen.
// Mock-Pfad: dienst.methode() führt im Mock die nachgebauten App-Methoden aus (mock.js).
// Verzögerter Commit (8 s „Rückgängig“): planeOderSofort() – mit registrierten Service-Commits über planeCommit,
// sonst sofort (siehe commit-aktionen.js).

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/dal.js";
import { darfDoc } from "../auth/rechte.js";
import { backoffice, ladeMeta } from "../frappe/index.js";
import { istBackofficeError } from "../frappe/errors.js";
import { isoDatum, isoDatumZeit, datum as datumText } from "../format.js";
import { planeCommit } from "../commit/server.js";
import { TEILE } from "../commit/aktionen/index.js";
import { methode, istMock, akte as akteLaden, sichereServiceSeed } from "./dienst.js";
import { sicht, ladeEinstellungen } from "./daten.js";
import { reaktionsfrist } from "./fristen.js";
import { mitteilungsKommentar, schliessbar } from "./regeln.js";
import { ABLEHNUNGSGRUENDE, ARTEN, BEWEGUNGSARTEN, EINSATZ_ARTEN, EINSATZ_ERGEBNISSE, ENTSCHEIDUNGEN, KANAELE, KOSTENTRAEGER, PRIORITAETEN, URSACHEN, UNTERSCHRIFT_ARTEN } from "./labels.js";
import { T } from "./texte.js";

const FALL = "PH Servicefall";
const EINSATZ = "PH Serviceeinsatz";

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message };
  if (err?.code === "not_found") return { ok: false, code: "not_found", message: err.message };
  console.error("[service] Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: "Unerwarteter Fehler. Bitte erneut versuchen." };
}

function pruefFehler(fehlerFelder, message = T.fehlerText.eingabe) {
  return { ok: false, code: "invalid", message, fehler: fehlerFelder };
}

const NAME = /^[A-Za-z0-9 ._@-]{1,80}$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const ZEIT = /^\d{2}:\d{2}(:\d{2})?$/;
const text = (v, max = 2000) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
const nameOk = (n) => typeof n === "string" && NAME.test(n);
const centOk = (c) => Number.isInteger(c) && c >= 0 && c <= 99_999_999_99;

/** Sitzung, Client und Recht am DocType. */
async function kontext(doctype, aktion = "write") {
  const session = await getSession();
  if (!session) return { antwort: { ok: false, code: "auth", message: "Bitte neu anmelden." } };
  const client = backoffice(session);
  sichereServiceSeed(client);
  const meta = await ladeMeta(client, doctype);
  if (!darfDoc(session, meta, aktion)) return { antwort: { ok: false, code: "forbidden", message: T.fehlerText.recht } };
  return { session, client, meta };
}

function revalidiere(...pfade) {
  for (const p of pfade.flat()) {
    try {
      revalidatePath(p);
    } catch {
      /* außerhalb einer Anfrage */
    }
  }
}

const fallPfade = (name) => ["/service", "/service/faelle", `/service/faelle/${name}`];

/** Verzögerter Commit, wenn die Service-Commit-Aktionen registriert sind; sonst sofort ausführen. */
async function planeOderSofort(session, client, { art, args, objekt, titel, schluessel }) {
  const action = `service.${art}`;
  if (TEILE?.service?.[action]) {
    const r = await planeCommit(session, { action, args, objekt, titel, schluessel });
    return { ok: true, verzoegert: true, token: r.token, ms: r.ms, frist: r.frist, objekt: r.objekt };
  }
  if (art === "methode") await methode(client, args.doctype, args.name, args.methode, args.args || {});
  else await client.workflowAction(args.doctype, args.name, args.aktion);
  revalidiere(args.pfad || []);
  return { ok: true, verzoegert: false };
}

// ============================================================ Servicefall ==

/**
 * S1 – Servicefall anlegen (Schnell und Vollständig).
 * @param {{kontakt:string, kunde_name?:string, art:string, beschreibung:string, fehlercode?:string, kanal?:string,
 *   kunde_email?:string, kunde_telefon?:string, kundentyp?:string, prioritaet?:string, kundenwunsch?:string,
 *   ort_am_stueck?:string, erstauftreten?:string, seriennummer?:string, produkt_name?:string, sachart?:string,
 *   bezug?:{doctype:string, name:string}, telefonat?:boolean, eingang?:boolean, uebergabe_datum?:string, kaufdatum?:string}} e
 */
export async function fallAnlegenAction(e) {
  const k = await kontext(FALL, "create");
  if (k.antwort) return k.antwort;
  const f = {};
  if (!text(e?.kontakt, 140)) f.kontakt = T.melden.pflicht;
  if (!ARTEN.includes(e?.art)) f.art = T.melden.pflicht;
  if (!text(e?.beschreibung)) f.beschreibung = T.melden.pflicht;
  if (e?.kanal && !KANAELE.includes(e.kanal)) f.kanal = T.melden.pflicht;
  if (Object.keys(f).length) return pruefFehler(f);
  try {
    const { client, session } = k;
    const einst = await ladeEinstellungen(client);
    let code = null;
    if (e.fehlercode) {
      try {
        code = await client.getDoc("PH Fehlercode", text(e.fehlercode, 40));
      } catch {
        return pruefFehler({ fehlercode: "Unbekannter Fehlercode." });
      }
    }
    let kontakt = null;
    try {
      kontakt = await client.getDoc("PH Kontakt", text(e.kontakt, 140));
    } catch {
      kontakt = null;
    }
    const jetzt = isoDatumZeit();
    const typ = e.kundentyp === "Unternehmer" ? "Unternehmer" : kontakt?.firma ? "Unternehmer" : "Verbraucher";
    const werte = {
      art: e.art,
      status: "Gemeldet",
      gemeldet_am: jetzt,
      kanal: e.kanal || "Telefon",
      quelle: "backoffice",
      prioritaet: PRIORITAETEN.includes(e.prioritaet) ? e.prioritaet : einst.standard_prioritaet || "Normal",
      kundenwunsch: e.kundenwunsch || "Offen",
      verantwortlich: session.user,
      kontakt: text(e.kontakt, 140),
      kunde_name: text(e.kunde_name || [kontakt?.vorname, kontakt?.nachname].filter(Boolean).join(" ") || kontakt?.firma || e.kontakt, 140),
      kundentyp: typ,
      kunde_email: text(e.kunde_email ?? kontakt?.email ?? "", 140),
      kunde_telefon: text(e.kunde_telefon ?? kontakt?.telefon ?? kontakt?.mobil ?? "", 40),
      einsatz_strasse: kontakt?.strasse || "",
      einsatz_plz: kontakt?.plz || "",
      einsatz_ort: kontakt?.ort || "",
      beschreibung: text(e.beschreibung, 5000),
      fehlercode: code?.name || "",
      fehlerbereich: code?.bereich || "",
      fehlercode_bezeichnung: code?.bezeichnung || "",
      lieferantenrelevant: code ? Number(code.lieferantenrelevant) || 0 : e.art === "Transportschaden" ? 1 : 0,
      standardloesung: code?.standardloesung || "",
      ort_am_stueck: text(e.ort_am_stueck, 140),
      erstauftreten: ISO.test(e.erstauftreten || "") ? e.erstauftreten : "",
      seriennummer: text(e.seriennummer, 80),
      produkt_name: text(e.produkt_name, 140),
      sachart: e.sachart === "Unbeweglich" ? "Unbeweglich" : "Beweglich",
      uebergabe_datum: ISO.test(e.uebergabe_datum || "") ? e.uebergabe_datum : "",
      kaufdatum: ISO.test(e.kaufdatum || "") ? e.kaufdatum : "",
      portal_sichtbar: 1,
    };
    if (e.bezug?.doctype && nameOk(e.bezug?.name)) {
      const feld = { "PH Lieferschein": "lieferschein", "PH Rechnung": "rechnung", "PH Projekt": "projekt", "PH Bestellung": "bestellung", "PH Produktpass": "produktpass", "PH Auftragsbestaetigung": "auftrag" }[e.bezug.doctype];
      if (feld) werte[feld] = e.bezug.name;
    }
    const telefonKanal = ["Telefon", "Showroom"].includes(werte.kanal);
    if (istMock(client)) {
      // Mock: was der Server in before_insert setzt (Reaktionsfrist, Erstreaktion bei Telefon/Showroom).
      werte.frist_reaktion = reaktionsfrist(jetzt, Number(einst.reaktion_werktage) || 2);
      if (telefonKanal && Number(einst.telefon_ist_erstreaktion)) Object.assign(werte, { erstreaktion_am: jetzt, erstreaktion_kanal: werte.kanal === "Showroom" ? "Vor Ort" : "Telefon" });
      werte.verlauf = [{ zeit: jetzt, ereignis: "Status", status: "Gemeldet", hinweis: `Gemeldet über ${werte.kanal}`, von: session.user }];
      werte.workflow_state = "PH Gemeldet";
    }
    const neu = await client.insert(FALL, werte);
    const schritte = [{ id: "anlegen", ok: true }];
    if (e.telefonat && !(telefonKanal && Number(einst.telefon_ist_erstreaktion))) {
      try {
        await methode(client, FALL, neu.name, "erstreaktion_erfassen", { kanal: "Telefon" });
        schritte.push({ id: "telefonat", ok: true });
      } catch (err) {
        schritte.push({ id: "telefonat", ok: false, message: fehler(err).message });
      }
    }
    let eingang = null;
    if (e.eingang && werte.kunde_email) {
      try {
        eingang = await planeOderSofort(session, client, { art: "methode", args: { doctype: FALL, name: neu.name, methode: "kunde_informieren", args: { vorlage: "eingang" }, pfad: fallPfade(neu.name) }, objekt: { doctype: FALL, name: neu.name }, titel: `Eingangsbestätigung ${neu.name}`, schluessel: `eingang:${neu.name}` });
        schritte.push({ id: "eingang", ok: true });
      } catch (err) {
        schritte.push({ id: "eingang", ok: false, message: fehler(err).message });
      }
    }
    revalidiere(fallPfade(neu.name));
    const frisch = await client.getDoc(FALL, neu.name);
    return { ok: true, name: neu.name, frist: frisch.frist_reaktion ? datumText(frisch.frist_reaktion) : null, schritte, eingang, email: werte.kunde_email };
  } catch (err) {
    return fehler(err);
  }
}

/** Kontakt für S1 (E-Mail, Telefon, Kundentyp, Ort) – nur lesend. */
export async function kontaktInfoAction({ name } = {}) {
  const k = await kontext(FALL, "create");
  if (k.antwort) return k.antwort;
  if (!text(name, 140)) return pruefFehler({});
  try {
    const c = await k.client.getDoc("PH Kontakt", text(name, 140));
    return { ok: true, kontakt: { name: c.name, anzeige: [c.vorname, c.nachname].filter(Boolean).join(" ") || c.firma || c.name, firma: c.firma || "", email: c.email || "", telefon: c.telefon || c.mobil || "", ort: [c.plz, c.ort].filter(Boolean).join(" "), unternehmer: !!c.firma } };
  } catch (err) {
    return fehler(err);
  }
}

/** Telefonat / Erstreaktion erfassen (sofort). */
export async function telefonatAction({ name, kanal = "Telefon", notiz = "" } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !["Telefon", "Vor Ort", "Rückruf"].includes(kanal)) return pruefFehler({ kanal: T.melden.pflicht });
  try {
    await methode(k.client, FALL, name, "erstreaktion_erfassen", { kanal, notiz: text(notiz, 140) });
    revalidiere(fallPfade(name));
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Eingangsbestätigung (Vorlagen-Mail, verzögert) für einen oder mehrere Fälle. */
export async function eingangAction({ names = [] } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  const liste = (Array.isArray(names) ? names : [names]).filter(nameOk).slice(0, 50);
  const ergebnisse = [];
  for (const name of liste) {
    try {
      const f = await k.client.getDoc(FALL, name);
      if (!f.kunde_email) {
        ergebnisse.push({ name, ok: false, code: "invalid", message: T.melden.keineEmail });
        continue;
      }
      const r = await planeOderSofort(k.session, k.client, { art: "methode", args: { doctype: FALL, name, methode: "kunde_informieren", args: { vorlage: "eingang" }, pfad: fallPfade(name) }, objekt: { doctype: FALL, name, titel: f.kunde_name }, titel: `Eingangsbestätigung ${name}`, schluessel: `eingang:${name}` });
      ergebnisse.push({ name, email: f.kunde_email, ...r });
    } catch (err) {
      ergebnisse.push({ name, ...fehler(err) });
    }
  }
  return { ok: ergebnisse.some((e) => e.ok), ergebnisse };
}

/** Kunde informieren (Kanalwahl §3.6): E-Mail = Vorlage; Brief/Telefon/Persönlich = Übergangs-Kommentar (A-S3). */
export async function informierenAction({ name, vorlage = "abschluss", kanal = "email", zusatz = "", notiz = "" } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !["eingang", "termin", "abschluss", "ablehnung", "frei"].includes(vorlage)) return pruefFehler({ vorlage: T.melden.pflicht });
  try {
    if (kanal === "email") {
      if (vorlage === "frei" && !text(zusatz)) return pruefFehler({ zusatz: "Nachricht eingeben." });
      await methode(k.client, FALL, name, "kunde_informieren", { vorlage, zusatz: text(zusatz, 4000) });
    } else {
      const kanalText = { brief: "Brief", telefon: "Telefon", persoenlich: "Persönlich" }[kanal];
      if (!kanalText) return pruefFehler({ kanal: T.melden.pflicht });
      if (kanal !== "brief" && !text(notiz)) return pruefFehler({ notiz: T.melden.pflicht });
      const vorlageText = T.dialog.informieren.vorlagen[vorlage] || vorlage;
      await k.client.kommentar(FALL, name, mitteilungsKommentar({ vorlage: vorlageText, kanal: kanalText, datum: datumText(isoDatum()), person: k.session.name || k.session.user, notiz: text(notiz, 500) }));
    }
    revalidiere(fallPfade(name));
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * S2 – Prüfen & entscheiden. modus: "pruefen" (nur Teil 1) · "entscheiden" (bis Entschieden) · "bearbeiten" (bis In Bearbeitung).
 */
export async function pruefenEntscheidenAction({ name, pruefung = {}, entscheidung = {}, modus = "bearbeiten" } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !["pruefen", "entscheiden", "bearbeiten"].includes(modus)) return pruefFehler({});
  const s = sicht(k.session);
  try {
    const { client } = k;
    const fall = await client.getDoc(FALL, name);
    const einst = await ladeEinstellungen(client);
    const f = {};
    const werte = {};
    if (fall.status === "Gemeldet") {
      if (!["Ja", "Teilweise", "Nein"].includes(pruefung.mangel_bestaetigt)) f.mangel_bestaetigt = T.melden.pflicht;
      if (!text(pruefung.fehlercode || fall.fehlercode, 40)) f.fehlercode = T.melden.pflicht;
      if (pruefung.ursache && !URSACHEN.includes(pruefung.ursache)) f.ursache = T.melden.pflicht;
      if (pruefung.fehlercode && pruefung.fehlercode !== fall.fehlercode) {
        const code = await client.getDoc("PH Fehlercode", text(pruefung.fehlercode, 40)).catch(() => null);
        if (!code) f.fehlercode = "Unbekannter Fehlercode.";
        else Object.assign(werte, { fehlercode: code.name, fehlerbereich: code.bereich, fehlercode_bezeichnung: code.bezeichnung, lieferantenrelevant: Number(code.lieferantenrelevant) || 0, standardloesung: code.standardloesung || "" });
      }
      Object.assign(werte, { mangel_bestaetigt: pruefung.mangel_bestaetigt, ursache: pruefung.ursache || "", pruefergebnis: text(pruefung.pruefergebnis, 2000) });
    }
    let betrag = 0;
    if (modus !== "pruefen") {
      const e = entscheidung.entscheidung;
      if (!ENTSCHEIDUNGEN.includes(e)) f.entscheidung = T.melden.pflicht;
      if (e === "Abgelehnt" && !s.leitung) f.entscheidung = T.dialog.pruefen.abgelehntNurLeitung;
      if (!text(entscheidung.begruendung)) f.begruendung = T.melden.pflicht;
      if (["Preisminderung", "Wandlung"].includes(e) && fall.kundentyp !== "Unternehmer" && (pruefung.mangel_bestaetigt || fall.mangel_bestaetigt) !== "Nein" && !entscheidung.vggBestaetigt) f.vgg = T.dialog.pruefen.vggPflicht;
      betrag = Math.round(Number(entscheidung.betrag_cent) || 0);
      if (["Preisminderung", "Kulanz"].includes(e) && !centOk(betrag)) f.betrag = "Betrag im Format 1.234,50";
      Object.assign(werte, { entscheidung: e, entscheidung_begruendung: text(entscheidung.begruendung, 4000), preisminderung_cent: e === "Preisminderung" ? betrag : 0, kulanz_cent: e === "Kulanz" ? betrag : 0, entschieden_von: k.session.user, entschieden_am: isoDatumZeit() });
      if (e === "Abgelehnt") Object.assign(werte, { abschlussbericht: fall.abschlussbericht || text(entscheidung.begruendung, 4000) });
    }
    if (Object.keys(f).length) return pruefFehler(f);
    const ueberSchwelle = modus !== "pruefen" && ["Preisminderung", "Kulanz"].includes(werte.entscheidung) && betrag > (Number(einst.kulanz_schwelle_cent) || 0);
    if (istMock(client) && modus !== "pruefen") {
      // Mock: was kulanz.py in validate setzt.
      Object.assign(werte, ueberSchwelle && !s.leitung ? { kulanz_freigabe_noetig: 1, kulanz_freigabe_status: "Angefordert", kulanz_angefordert_am: isoDatumZeit() } : { kulanz_freigabe_noetig: ueberSchwelle ? 1 : 0, kulanz_freigabe_status: ueberSchwelle ? "Freigegeben" : "Nicht noetig", kulanz_freigegeben_von: ueberSchwelle ? k.session.user : "" });
    }
    await client.setValue(FALL, name, werte);
    const erreicht = [];
    const ablauf = [];
    let st = fall.status;
    if (st === "Gemeldet") ablauf.push("Prüfung abschließen");
    if (modus !== "pruefen" && werte.entscheidung === "Abgelehnt") ablauf.push("Ablehnen");
    else {
      if (modus !== "pruefen" && ["Gemeldet", "Geprueft"].includes(st)) ablauf.push("Entscheidung treffen");
      if (modus === "bearbeiten" && !(ueberSchwelle && !s.leitung)) ablauf.push("In Bearbeitung nehmen");
    }
    for (const a of ablauf) {
      try {
        const r = await client.workflowAction(FALL, name, a);
        st = r?.status || st;
        erreicht.push(a);
      } catch (err) {
        revalidiere(fallPfade(name));
        return { ok: false, teil: true, erreicht, status: st, ...fehler(err) };
      }
    }
    const neu = await client.getDoc(FALL, name);
    revalidiere(fallPfade(name));
    return { ok: true, status: neu.status, freigabe: neu.kulanz_freigabe_status === "Angefordert", erreicht };
  } catch (err) {
    return fehler(err);
  }
}

export async function kulanzAction({ name, art, kommentar = "", grund = "", betrag_cent = null } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !["erneut", "freigeben", "ablehnen"].includes(art)) return pruefFehler({});
  if (art !== "erneut" && !sicht(k.session).leitung) return { ok: false, code: "forbidden", message: "Kulanz entscheidet die Service-Leitung." };
  if (art === "ablehnen" && text(grund).length < 5) return pruefFehler({ grund: "Bitte einen Grund mit mindestens 5 Zeichen angeben." });
  try {
    const m = { erneut: ["kulanz_anfordern", {}], freigeben: ["kulanz_freigeben", { kommentar: text(kommentar, 500), betrag_cent }], ablehnen: ["kulanz_ablehnen", { grund: text(grund, 500) }] }[art];
    await methode(k.client, FALL, name, m[0], m[1]);
    revalidiere(fallPfade(name), "/");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function ablehnenAction({ name, grund, begruendung, informieren = false } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!sicht(k.session).leitung) return { ok: false, code: "forbidden", message: T.dialog.pruefen.abgelehntNurLeitung };
  const f = {};
  if (!ABLEHNUNGSGRUENDE.includes(grund)) f.grund = T.melden.pflicht;
  if (!text(begruendung)) f.begruendung = T.melden.pflicht;
  if (Object.keys(f).length || !nameOk(name)) return pruefFehler(f);
  try {
    await methode(k.client, FALL, name, "ablehnen", { grund, begruendung: text(begruendung, 4000), kunde_informieren: informieren ? 1 : 0 });
    revalidiere(fallPfade(name));
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function wiederOeffnenAction({ name, grund } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!sicht(k.session).leitung) return { ok: false, code: "forbidden", message: "Wieder öffnen darf die Service-Leitung." };
  if (!nameOk(name) || text(grund).length < 5) return pruefFehler({ grund: "Bitte einen Grund mit mindestens 5 Zeichen angeben." });
  try {
    const fall = await k.client.getDoc(FALL, name);
    if (fall.status === "Abgelehnt") await k.client.workflowAction(FALL, name, "Wieder öffnen");
    else await methode(k.client, FALL, name, "neu_oeffnen", { grund: text(grund, 500) });
    await k.client.kommentar(FALL, name, `Wieder geöffnet: ${text(grund, 500)}`);
    revalidiere(fallPfade(name));
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Einzelne Felder ohne Folgewirkung (Mangel & Fristen, Zuweisen, Priorität, Notiz). */
const FREIE_FELDER = new Set(["ort_am_stueck", "erstauftreten", "reproduzierbar", "beschreibung", "kaufdatum", "uebergabe_datum", "sachart", "lieferung_an_haendler", "garantie_monate", "garantie_bedingungen", "verantwortlich", "prioritaet", "kundenwunsch", "seriennummer", "produkt_name", "menge", "notiz_intern"]);
export async function fallFelderAction({ names, werte = {} } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  const liste = (Array.isArray(names) ? names : [names]).filter(nameOk).slice(0, 100);
  const sauber = {};
  for (const [f, v] of Object.entries(werte || {})) {
    if (!FREIE_FELDER.has(f)) return pruefFehler({ [f]: "Dieses Feld wird über einen Assistenten gesetzt." });
    if (f === "notiz_intern" && !sicht(k.session).kosten) return { ok: false, code: "forbidden", message: T.fehlerText.recht };
    if (f === "prioritaet" && !PRIORITAETEN.includes(v)) return pruefFehler({ prioritaet: T.melden.pflicht });
    if (["erstauftreten", "kaufdatum", "uebergabe_datum", "lieferung_an_haendler"].includes(f) && v && !ISO.test(v)) return pruefFehler({ [f]: "Datum im Format TT.MM.JJJJ" });
    sauber[f] = typeof v === "string" ? text(v, 4000) : v;
  }
  if (!liste.length || !Object.keys(sauber).length) return pruefFehler({});
  try {
    const alt = [];
    for (const name of liste) {
      const vorher = await k.client.getDoc(FALL, name);
      alt.push({ name, werte: Object.fromEntries(Object.keys(sauber).map((f) => [f, vorher[f] ?? ""])) });
      await k.client.setValue(FALL, name, sauber);
    }
    revalidiere(liste.flatMap(fallPfade));
    return { ok: true, alt, zeit: isoDatumZeit().slice(11, 16) };
  } catch (err) {
    return fehler(err);
  }
}

/** Rückgängig für fallFelderAction (Gegenaufruf mit altem Wert, §4.2 „umkehrbar intern“). */
export async function fallFelderZurueckAction({ alt = [] } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  try {
    for (const a of (alt || []).slice(0, 100)) {
      if (!nameOk(a?.name)) continue;
      const w = Object.fromEntries(Object.entries(a.werte || {}).filter(([f]) => FREIE_FELDER.has(f)));
      await k.client.setValue(FALL, a.name, w);
    }
    revalidiere("/service", "/service/faelle");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function fotoAnLieferantAction({ name, idx, an } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  try {
    const f = await k.client.getDoc(FALL, name);
    const fotos = (f.fotos || []).map((x, i) => (i + 1 === Number(idx) ? { ...x, an_lieferant: an ? 1 : 0 } : x));
    await k.client.save(FALL, { name, fotos }, { modified: f.modified });
    revalidiere(fallPfade(name));
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Website-Meldung zuordnen (R-08, §3.8). */
export async function zuordnungAction({ name, kontakt = null } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name)) return pruefFehler({});
  try {
    if (kontakt) {
      await k.client.setValue(FALL, name, { kontakt: text(kontakt, 140), portal_sichtbar: 1 });
      await k.client.kommentar(FALL, name, `Anderem Kontakt zugeordnet: ${text(kontakt, 140)}`);
    } else {
      await k.client.setValue(FALL, name, { portal_sichtbar: 1 });
      await k.client.kommentar(FALL, name, "Zuordnung bestätigt");
    }
    revalidiere(fallPfade(name));
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** §3.5 Ersatzteil hinzufügen (Zeile PH Servicefall Ersatzteil). */
export async function ersatzteilHinzufuegenAction({ name, ersatzteil = null, bezeichnung = "", hersteller_nr = "", menge = 1, quelle = "bestellen", kostentraeger = "Gewaehrleistung" } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  const m = Math.trunc(Number(menge));
  const f = {};
  if (!Number.isInteger(m) || m < 1 || m > 999) f.menge = "Menge 1 bis 999";
  if (!ersatzteil && !text(bezeichnung)) f.ersatzteil = T.melden.pflicht;
  if (!KOSTENTRAEGER.includes(kostentraeger)) f.kostentraeger = T.melden.pflicht;
  if (Object.keys(f).length || !nameOk(name)) return pruefFehler(f);
  try {
    const { client } = k;
    let teil = null;
    if (ersatzteil) teil = await client.getDoc("PH Ersatzteil", text(ersatzteil, 40));
    if (quelle === "bestand") {
      if (!teil) return pruefFehler({ quelle: "Aus Bestand nur für Teile aus dem Katalog." });
      if ((Number(teil.verfuegbar) || 0) < m) return pruefFehler({ quelle: T.dialog.teil.zuWenig(Number(teil.verfuegbar) || 0) });
    }
    const fall = await client.getDoc(FALL, name);
    const zeilen = [...(fall.ersatzteile || [])];
    zeilen.push({ ersatzteil: teil?.name || "", bezeichnung: teil?.bezeichnung || text(bezeichnung, 140), hersteller_nr: teil?.hersteller_nr || text(hersteller_nr, 60), menge: m, status: quelle === "bestand" ? "Aus Bestand" : "Benoetigt", ek_cent: teil?.ek_cent || 0, kostentraeger, idx: zeilen.length + 1 });
    await client.save(FALL, { name, ersatzteile: zeilen }, { modified: fall.modified });
    if (quelle === "bestand" && istMock(client)) await client.setValue("PH Ersatzteil", teil.name, { reserviert: (Number(teil.reserviert) || 0) + m, verfuegbar: Math.max(0, (Number(teil.verfuegbar) || 0) - m) });
    revalidiere(fallPfade(name));
    return { ok: true, zeile: zeilen.length };
  } catch (err) {
    return fehler(err);
  }
}

/** S3 Ersatzteile bestellen (+ optional senden). */
export async function bestellenAction({ name, zeilen = null, lieferant = "", lieferadresse = "Lager", wunschtermin = "", empfaenger = "" } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name)) return pruefFehler({});
  if (empfaenger && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(empfaenger)) return pruefFehler({ empfaenger: "E-Mail-Adresse prüfen." });
  try {
    const best = await methode(k.client, FALL, name, "ersatzteile_bestellen", { lieferant: text(lieferant, 140) || null, zeilen, lieferadresse, wunschtermin: ISO.test(wunschtermin) ? wunschtermin : null });
    const schritte = [{ id: "bestellung", ok: true, name: best }];
    if (empfaenger) {
      try {
        await methode(k.client, "PH Ersatzteilbestellung", best, "senden", { empfaenger });
        schritte.push({ id: "senden", ok: true });
      } catch (err) {
        schritte.push({ id: "senden", ok: false, message: fehler(err).message });
      }
    }
    revalidiere(fallPfade(name), "/service/ersatzteile");
    return { ok: true, bestellung: best, schritte };
  } catch (err) {
    return fehler(err);
  }
}

/** S4a Mängelanzeige (Fotos vorab aus, nur gewählte an den Lieferanten). */
export async function maengelanzeigeAction({ name, empfaenger, zusatz = "", fotos = [] } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(empfaenger || ""))) return pruefFehler({ empfaenger: "E-Mail-Adresse prüfen." });
  try {
    const f = await k.client.getDoc(FALL, name);
    const gewaehlt = new Set((fotos || []).map(Number));
    await k.client.save(FALL, { name, fotos: (f.fotos || []).map((x, i) => ({ ...x, an_lieferant: gewaehlt.has(i + 1) ? 1 : 0 })) }, { modified: f.modified });
    const regress = await methode(k.client, FALL, name, "lieferant_informieren", { empfaenger, zusatz: text(zusatz, 4000) });
    revalidiere(fallPfade(name), "/service/regress");
    return { ok: true, regress };
  } catch (err) {
    return fehler(err);
  }
}

/** S4b Forderung stellen. */
export async function forderungAction({ name, betrag_cent, empfaenger = "", zusatz = "" } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  const b = Math.round(Number(betrag_cent));
  if (!nameOk(name) || !centOk(b) || b === 0) return pruefFehler({ betrag: "Betrag im Format 1.234,50" });
  try {
    const regresse = await k.client.getList("PH Lieferantenregress", { fields: ["name", "status"], filters: [["servicefall", "=", name], ["status", "not in", ["Abgelehnt", "Verrechnet"]]], limit: 1 });
    let regress = regresse[0]?.name;
    if (regress) {
      await k.client.setValue("PH Lieferantenregress", regress, { betrag_gefordert_cent: b });
      await methode(k.client, "PH Lieferantenregress", regress, "erinnern", { empfaenger: empfaenger || null });
    } else {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(empfaenger))) return pruefFehler({ empfaenger: "E-Mail-Adresse prüfen." });
      regress = await methode(k.client, FALL, name, "lieferant_informieren", { empfaenger, zusatz: text(zusatz, 4000) });
      if (regress) await k.client.setValue("PH Lieferantenregress", regress, { betrag_gefordert_cent: b });
    }
    revalidiere(fallPfade(name), "/service/regress");
    return { ok: true, regress };
  } catch (err) {
    return fehler(err);
  }
}

/** S5 Erledigt melden (+ Abnahme, Information, Schließen). */
export async function erledigtAction({ name, bericht, bestaetigung = "ohne", abnahmeName = "", informieren = "keine", schliessen = false } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !text(bericht)) return pruefFehler({ bericht: T.melden.pflicht });
  const schritte = [];
  try {
    const { client, session } = k;
    await methode(client, FALL, name, "erledigt_melden", { abschlussbericht: text(bericht, 8000) });
    schritte.push({ id: "erledigt", ok: true });
    if (bestaetigung === "unterschrift" || bestaetigung === "liegt-vor") {
      try {
        await methode(client, FALL, name, "abnahme_erfassen", { name: text(abnahmeName, 140) || null });
        schritte.push({ id: "abnahme", ok: true });
      } catch (err) {
        schritte.push({ id: "abnahme", ok: false, message: fehler(err).message });
      }
    }
    if (informieren === "email") {
      try {
        await methode(client, FALL, name, "kunde_informieren", { vorlage: "abschluss" });
        schritte.push({ id: "informieren", ok: true });
      } catch (err) {
        schritte.push({ id: "informieren", ok: false, message: fehler(err).message });
      }
    }
    if (schliessen) {
      const daten = await akteLaden(client, name, {});
      const info = client.docinfo ? await client.docinfo(FALL, name).catch(() => ({})) : {};
      const r = schliessbar(daten.fall, { leitung: sicht(session).leitung, regresse: daten.regresse, kommentare: info.comments || [] });
      if (r.ok) {
        try {
          await client.workflowAction(FALL, name, "Schließen");
          schritte.push({ id: "schliessen", ok: true });
        } catch (err) {
          schritte.push({ id: "schliessen", ok: false, message: fehler(err).message });
        }
      } else schritte.push({ id: "schliessen", ok: null, message: r.grund });
    }
    const neu = await client.getDoc(FALL, name);
    revalidiere(fallPfade(name));
    return { ok: true, schritte, dauer: neu.dauer_tage || null, status: neu.status };
  } catch (err) {
    revalidiere(fallPfade(name));
    return { ...fehler(err), schritte };
  }
}

/** Schließen (einzeln/Masse, verzögert 8 s) mit Regel D-3 für Mitarbeiter. */
export async function schliessenAction({ names = [] } = {}) {
  const k = await kontext(FALL);
  if (k.antwort) return k.antwort;
  const s = sicht(k.session);
  const ergebnisse = [];
  for (const name of (Array.isArray(names) ? names : [names]).filter(nameOk).slice(0, 50)) {
    try {
      const daten = await akteLaden(k.client, name, {});
      const info = k.client.docinfo ? await k.client.docinfo(FALL, name).catch(() => ({})) : {};
      const r = schliessbar(daten.fall, { leitung: s.leitung, regresse: daten.regresse, kommentare: info.comments || [] });
      if (!r.ok) {
        ergebnisse.push({ name, ok: false, code: "invalid", message: r.grund });
        continue;
      }
      const p = await planeOderSofort(k.session, k.client, { art: "workflow", args: { doctype: FALL, name, aktion: "Schließen", pfad: fallPfade(name) }, objekt: { doctype: FALL, name, titel: daten.fall.kunde_name }, titel: `Schließen ${name}`, schluessel: `schliessen:${name}` });
      ergebnisse.push({ name, ...p });
    } catch (err) {
      ergebnisse.push({ name, ...fehler(err) });
    }
  }
  return { ok: ergebnisse.some((e) => e.ok), ergebnisse };
}

// ================================================================ Einsätze ==

/** A14 – Einsatz planen (Fall oder Pflegevertrag), Teilschritte mit eigenem Ergebnis. */
export async function einsatzPlanenAction({ fall = null, pflege = null, datum, von, bis, techniker, art = "Reparatur", mitzubringen = "", hinweis = "", terminvorschlag = false, kostenhinweis = null } = {}) {
  const k = await kontext(EINSATZ, "create");
  if (k.antwort) return k.antwort;
  const f = {};
  if (!ISO.test(datum || "")) f.datum = T.einsaetze.a14.ohneWahl;
  if (!ZEIT.test(von || "") || !ZEIT.test(bis || "")) f.zeit = T.einsaetze.a14.ohneWahl;
  if (!nameOk(techniker || "")) f.techniker = T.einsaetze.a14.ohneWahl;
  if (!EINSATZ_ARTEN.includes(art)) f.art = T.melden.pflicht;
  if (!fall && !pflege) f.fall = T.melden.pflicht;
  if (Object.keys(f).length) return pruefFehler(f);
  const schritte = [];
  try {
    const { client } = k;
    let einsatz;
    if (fall) einsatz = await methode(client, FALL, fall, "einsatz_anlegen", { datum, zeit_von: von, zeit_bis: bis, techniker, hinweis: text(hinweis, 1000), art });
    else einsatz = await methode(client, "PH Pflege Abo", pflege, "einsatz_planen", { datum, zeit_von: von, zeit_bis: bis, techniker });
    schritte.push({ id: "anlegen", ok: true, name: einsatz });
    if (text(mitzubringen) || (pflege && text(hinweis))) {
      try {
        await client.setValue(EINSATZ, einsatz, { mitzubringen: text(mitzubringen, 1000), ...(pflege ? { hinweis_intern: text(hinweis, 1000) } : {}) });
        schritte.push({ id: "mitnehmen", ok: true });
      } catch (err) {
        schritte.push({ id: "mitnehmen", ok: false, message: fehler(err).message });
      }
    }
    if (terminvorschlag && fall) {
      try {
        await methode(client, FALL, fall, "kunde_informieren", { vorlage: "termin" });
        schritte.push({ id: "termin", ok: true });
      } catch (err) {
        schritte.push({ id: "termin", ok: false, message: fehler(err).message });
      }
    }
    if (kostenhinweis?.kanal && fall) {
      await client.kommentar(FALL, fall, `Kostenhinweis: ${text(kostenhinweis.kanal, 40)} ${datumText(isoDatum())} (${k.session.name || k.session.user})`);
      schritte.push({ id: "kosten", ok: true });
    }
    revalidiere("/service", "/service/einsaetze", fall ? fallPfade(fall) : [], pflege ? [`/service/vertraege/pflege/${pflege}`] : []);
    return { ok: true, einsatz, schritte };
  } catch (err) {
    return { ...fehler(err), schritte };
  }
}

const EINSATZ_METHODEN = new Set(["bestaetigen", "unterwegs", "starten", "bericht_senden", "termin_anlegen"]);
/** Statusknöpfe (Kunde hat bestätigt, Unterwegs, Starten …); Technik: verzögert. */
export async function einsatzStatusAction({ name, methode: m, verzoegert = false, imNamen = null } = {}) {
  const k = await kontext(EINSATZ);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !EINSATZ_METHODEN.has(m)) return pruefFehler({});
  try {
    if (imNamen) await k.client.kommentar(EINSATZ, name, `Status gesetzt von ${k.session.name || k.session.user} im Namen von ${text(imNamen, 140)}`);
    const pfade = ["/service/einsaetze", `/service/einsaetze/${name}`, "/technik", `/technik/einsatz/${name}`, "/service"];
    if (verzoegert) return await planeOderSofort(k.session, k.client, { art: "methode", args: { doctype: EINSATZ, name, methode: m, args: {}, pfad: pfade }, objekt: { doctype: EINSATZ, name }, titel: `${m} ${name}`, schluessel: `${m}:${name}` });
    await methode(k.client, EINSATZ, name, m, {});
    revalidiere(pfade);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function einsatzUmplanenAction({ name, datum, von, bis, techniker, grund = "" } = {}) {
  const k = await kontext(EINSATZ);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !ISO.test(datum || "") || (von && !ZEIT.test(von)) || (bis && !ZEIT.test(bis))) return pruefFehler({ datum: "Datum und Zeit prüfen." });
  try {
    const e = await k.client.getDoc(EINSATZ, name);
    if (!["Geplant", "Bestaetigt"].includes(e.status)) return { ok: false, code: "invalid", message: T.einsaetze.laeuft };
    return await planeOderSofort(k.session, k.client, { art: "methode", args: { doctype: EINSATZ, name, methode: "umplanen", args: { datum, zeit_von: von || null, zeit_bis: bis || null, techniker: techniker || null, grund: text(grund, 140) || null }, pfad: ["/service/einsaetze", `/service/einsaetze/${name}`, "/service"] }, objekt: { doctype: EINSATZ, name, titel: e.kunde_name }, titel: `Umplanen ${name}`, schluessel: `umplanen:${name}` });
  } catch (err) {
    return fehler(err);
  }
}

export async function einsatzAbsagenAction({ name, grund } = {}) {
  const k = await kontext(EINSATZ);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || text(grund).length < 3) return pruefFehler({ grund: T.melden.pflicht });
  try {
    await methode(k.client, EINSATZ, name, "abbrechen", { grund: text(grund, 500) });
    revalidiere("/service/einsaetze", `/service/einsaetze/${name}`, "/service", "/technik");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function nichtAngetroffenAction({ name, hinweis } = {}) {
  const k = await kontext(EINSATZ);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !text(hinweis)) return pruefFehler({ hinweis: T.melden.pflicht });
  try {
    await methode(k.client, EINSATZ, name, "nicht_angetroffen", { hinweis: text(hinweis, 500) });
    revalidiere("/service/einsaetze", `/service/einsaetze/${name}`, "/technik", `/technik/einsatz/${name}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Technik: Einsatz abschließen (idempotent). */
export async function einsatzAbschliessenAction({ name, ergebnis, bericht = "", unterschrift = null, unterschrift_name = "", zufriedenheit = null, pause_min = 0, unterschrift_art = "Name bestätigt", bericht_senden = false, verbraucht = [] } = {}) {
  const k = await kontext(EINSATZ);
  if (k.antwort) return k.antwort;
  const f = {};
  if (!EINSATZ_ERGEBNISSE.includes(ergebnis)) f.ergebnis = T.melden.pflicht;
  if (!UNTERSCHRIFT_ARTEN.includes(unterschrift_art)) f.unterschrift_art = T.melden.pflicht;
  if (unterschrift_art === "Verweigert" && !text(bericht)) f.bericht = T.melden.pflicht;
  if (![0, 15, 30, 45, 60].includes(Number(pause_min))) f.pause = T.melden.pflicht;
  if (Object.keys(f).length || !nameOk(name)) return pruefFehler(f);
  try {
    const e = await k.client.getDoc(EINSATZ, name);
    if (Array.isArray(verbraucht) && verbraucht.length) {
      const zeilen = verbraucht.slice(0, 30).map((v, i) => ({ idx: i + 1, ersatzteil: text(v.ersatzteil, 40), bezeichnung: text(v.bezeichnung, 140), menge: Math.max(1, Math.trunc(Number(v.menge) || 1)), aus_bestand: v.aus_bestand ? 1 : 0 }));
      await k.client.save(EINSATZ, { name, ersatzteile: zeilen }, { modified: e.modified }).catch(() => null);
    }
    await methode(k.client, EINSATZ, name, "abschliessen", { ergebnis, bericht: text(bericht, 8000), unterschrift: typeof unterschrift === "string" && unterschrift.startsWith("data:image/png") ? unterschrift.slice(0, 400_000) : null, unterschrift_name: text(unterschrift_name, 140), zufriedenheit, pause_min: Number(pause_min), unterschrift_art, bericht_senden: bericht_senden ? 1 : 0 });
    revalidiere("/technik", `/technik/einsatz/${name}`, "/service/einsaetze", `/service/einsaetze/${name}`, "/service");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Bedarf ans Büro (Technik kassiert nicht, R-12): Kommentar am Fall. */
export async function bedarfAction({ name, text: t } = {}) {
  const k = await kontext(EINSATZ);
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !text(t)) return pruefFehler({ text: T.melden.pflicht });
  try {
    const e = await k.client.getDoc(EINSATZ, name);
    await k.client.kommentar(e.servicefall ? FALL : EINSATZ, e.servicefall || name, `Bedarf aus dem Einsatz ${name}: ${text(t, 1000)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ============================================================ Ersatzteile ==

export async function bewegungAction({ teil, art, menge, hinweis = "" } = {}) {
  const k = await kontext("PH Ersatzteil");
  if (k.antwort) return k.antwort;
  if (!nameOk(teil) || !BEWEGUNGSARTEN.includes(art)) return pruefFehler({ art: T.melden.pflicht });
  const m = Math.trunc(Number(menge));
  if (!Number.isInteger(m) || m < 0 || m > 99999 || (art !== "Inventur" && m === 0)) return pruefFehler({ menge: "Menge prüfen." });
  try {
    const r = await methode(k.client, "PH Ersatzteil", teil, "bewegung_buchen", { art, menge: m, hinweis: text(hinweis, 140) });
    revalidiere("/service/ersatzteile", `/service/ersatzteile/${teil}`);
    return { ok: true, bestand: r };
  } catch (err) {
    const f = fehler(err);
    return /negativ/i.test(f.message || "") ? pruefFehler({ menge: f.message }) : f;
  }
}

const BESTELL_METHODEN = new Set(["senden", "als_gesendet", "bestaetigen", "wareneingang", "stornieren"]);
export async function bestellungAction({ name, methode: m, args = {} } = {}) {
  const k = await kontext("PH Ersatzteilbestellung");
  if (k.antwort) return k.antwort;
  if (!nameOk(name) || !BESTELL_METHODEN.has(m)) return pruefFehler({});
  if (m === "stornieren" && text(args.grund).length < 3) return pruefFehler({ grund: T.melden.pflicht });
  if (m === "senden" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(args.empfaenger || ""))) return pruefFehler({ empfaenger: "E-Mail-Adresse prüfen." });
  if (m === "bestaetigen" && args.erwartet_am && !ISO.test(args.erwartet_am)) return pruefFehler({ erwartet_am: "Datum im Format TT.MM.JJJJ" });
  try {
    const sauber = { senden: { empfaenger: args.empfaenger, text: text(args.text, 4000) || null }, als_gesendet: { bestellweg: ["E-Mail", "Portal", "Telefon", "IWOfurn", "Fax"].includes(args.bestellweg) ? args.bestellweg : "Portal", referenz: text(args.referenz, 80) || null }, bestaetigen: { referenz: text(args.referenz, 80) || null, erwartet_am: args.erwartet_am || null }, wareneingang: { mengen: args.mengen && typeof args.mengen === "object" ? Object.fromEntries(Object.entries(args.mengen).map(([a, b]) => [a, Math.max(0, Math.trunc(Number(b) || 0))])) : null, alles: args.alles ? 1 : 0 }, stornieren: { grund: text(args.grund, 500) } }[m];
    const r = await methode(k.client, "PH Ersatzteilbestellung", name, m, sauber);
    revalidiere("/service/ersatzteile", `/service/ersatzteile/bestellungen/${name}`, "/service");
    return { ok: true, ergebnis: r };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================ Regress ==

export async function regressAction({ name, art, betrag_cent = null, nummer = "", datum = "", grund = "", werte = {} } = {}) {
  const k = await kontext("PH Lieferantenregress");
  if (k.antwort) return k.antwort;
  if (!nameOk(name)) return pruefFehler({});
  const s = sicht(k.session);
  try {
    const { client } = k;
    if (art === "gutschrift") {
      const b = Math.round(Number(betrag_cent));
      if (!centOk(b) || b === 0) return pruefFehler({ betrag: "Betrag im Format 1.234,50" });
      if (datum && !ISO.test(datum)) return pruefFehler({ datum: "Datum im Format TT.MM.JJJJ" });
      await methode(client, "PH Lieferantenregress", name, "gutschrift_erfassen", { betrag_cent: b, nummer: text(nummer, 80) || null, datum: datum || null });
    } else if (art === "ausbuchen") {
      if (!s.leitung) return { ok: false, code: "forbidden", message: "Differenz ausbuchen darf die Service-Leitung." };
      if (text(grund).length < 5) return pruefFehler({ grund: "Bitte einen Grund mit mindestens 5 Zeichen angeben." });
      await methode(client, "PH Lieferantenregress", name, "differenz_ausbuchen", { grund: text(grund, 500) });
    } else if (art === "erinnern") {
      await methode(client, "PH Lieferantenregress", name, "erinnern", {});
    } else if (["Beim Lieferanten melden", "Regress anerkannt", "Regress abgelehnt", "Regress verrechnet", "Wieder öffnen"].includes(art)) {
      const erlaubt = { "Regress anerkannt": ["betrag_anerkannt_cent", "form", "antwort_lieferant"], "Regress abgelehnt": ["ablehnungsgrund", "antwort_lieferant"], "Beim Lieferanten melden": ["betrag_gefordert_cent", "beschreibung"], "Regress verrechnet": [], "Wieder öffnen": [] }[art];
      const w = Object.fromEntries(Object.entries(werte || {}).filter(([f]) => erlaubt.includes(f)).map(([f, v]) => [f, typeof v === "string" ? text(v, 2000) : Math.round(Number(v) || 0)]));
      if (art === "Regress anerkannt" && !centOk(w.betrag_anerkannt_cent) ) return pruefFehler({ betrag: "Betrag im Format 1.234,50" });
      if (art === "Regress abgelehnt" && !w.ablehnungsgrund) return pruefFehler({ ablehnungsgrund: T.melden.pflicht });
      if (Object.keys(w).length) await client.setValue("PH Lieferantenregress", name, w);
      await client.workflowAction("PH Lieferantenregress", name, art);
    } else return pruefFehler({});
    revalidiere("/service/regress", `/service/regress/${name}`, "/service");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ======================================================= Pflege, Aufträge ==

export async function pflegeAction({ name, art, werte = {} } = {}) {
  const k = await kontext("PH Pflege Abo");
  if (k.antwort) return k.antwort;
  if (!nameOk(name)) return pruefFehler({});
  const s = sicht(k.session);
  try {
    const { client } = k;
    if (art === "widerruf") {
      await client.setValue("PH Pflege Abo", name, { nachkauf_einwilligung: 0, ...(istMock(client) ? { nachkauf_widerrufen_am: isoDatumZeit() } : {}) });
      await client.kommentar("PH Pflege Abo", name, `Widerruf der Nachkauf-Erinnerung erfasst (${k.session.name || k.session.user}).`);
    } else if (art === "erinnerung") {
      await methode(client, "PH Pflege Abo", name, "erinnerung_senden", {});
    } else if (art === "protokoll") {
      if (!ISO.test(werte.datum || "") || !text(werte.leistungen)) return pruefFehler({ leistungen: T.melden.pflicht });
      await methode(client, "PH Pflege Abo", name, "protokoll_erfassen", { datum: werte.datum, leistungen: text(werte.leistungen, 4000), im_portal: werte.im_portal ? 1 : 0 });
    } else if (art === "aktivieren") {
      if (!["Geschäftsraum", "Fernabsatz", "Außerhalb Geschäftsraum"].includes(werte.abschlussweg)) return pruefFehler({ abschlussweg: T.melden.pflicht });
      if (werte.abschlussweg !== "Geschäftsraum" && !werte.belehrung) return pruefFehler({ belehrung: T.vertraege.belehrung });
      await client.kommentar("PH Pflege Abo", name, `Vertrag aktiviert · Abschlussweg ${werte.abschlussweg}${werte.belehrung ? " · Belehrung über das Rücktrittsrecht übergeben" : ""}${werte.vorzeitig ? " · Kunde verlangt Beginn vor Ablauf der Rücktrittsfrist" : ""}`);
      await client.workflowAction("PH Pflege Abo", name, "Aktivieren");
    } else if (["Anbieten", "Pausieren", "Fortsetzen", "Kündigen", "Beenden", "Wieder öffnen"].includes(art)) {
      if (["Kündigen", "Beenden", "Wieder öffnen"].includes(art) && !s.leitung && art !== "Beenden") return { ok: false, code: "forbidden", message: T.fehlerText.recht };
      if (art === "Kündigen") {
        if (!ISO.test(werte.kuendigung_zum || "")) return pruefFehler({ kuendigung_zum: "Datum im Format TT.MM.JJJJ" });
        await client.setValue("PH Pflege Abo", name, { kuendigung_zum: werte.kuendigung_zum });
      }
      await client.workflowAction("PH Pflege Abo", name, art);
    } else return pruefFehler({});
    revalidiere("/service/vertraege", `/service/vertraege/pflege/${name}`, "/service");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function auftragAction({ name, art, werte = {} } = {}) {
  const k = await kontext("PH Serviceauftrag");
  if (k.antwort) return k.antwort;
  if (!nameOk(name)) return pruefFehler({});
  try {
    const { client } = k;
    if (art === "uebernahme") await methode(client, "PH Serviceauftrag", name, "uebernahme_erfassen", { name_bestaetigt: text(werte.name, 140) || null, lagerort: text(werte.lagerort, 140) || null });
    else if (art === "rueckgabe") await methode(client, "PH Serviceauftrag", name, "rueckgabe_erfassen", { name_bestaetigt: text(werte.name, 140) || null });
    else if (["Anbieten", "Beauftragen", "In Arbeit nehmen", "Einlagern", "Stornieren"].includes(art)) {
      if (art === "Beauftragen" && werte.preis_cent !== undefined) await client.setValue("PH Serviceauftrag", name, { preis_cent: Math.max(0, Math.round(Number(werte.preis_cent) || 0)) });
      await client.workflowAction("PH Serviceauftrag", name, art);
    } else return pruefFehler({});
    revalidiere("/service/vertraege", `/service/vertraege/auftraege/${name}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================ Katalog, Einstellungen ==

const CODE_FELDER = new Set(["bezeichnung", "gruppe", "typische_ursache", "standardloesung", "pruefhinweis", "kundentext", "standard_entscheidung", "aktiv", "lieferantenrelevant"]);
export async function fehlercodeAction({ code, werte = {} } = {}) {
  const k = await kontext("PH Fehlercode", "write");
  if (k.antwort) return k.antwort;
  if (!sicht(k.session).leitung) return { ok: false, code: "forbidden", message: T.katalog.nurLeitung };
  if (!/^[A-Z]{2,4}-\d{2}$/.test(String(code || ""))) return pruefFehler({});
  const w = Object.fromEntries(Object.entries(werte).filter(([f]) => CODE_FELDER.has(f)).map(([f, v]) => [f, ["aktiv", "lieferantenrelevant"].includes(f) ? (v ? 1 : 0) : text(v, 2000)]));
  if ("bezeichnung" in w && !w.bezeichnung) return pruefFehler({ bezeichnung: T.melden.pflicht });
  try {
    await k.client.setValue("PH Fehlercode", code, w);
    revalidiere("/service/fehlerkatalog");
    return { ok: true, zeit: isoDatumZeit().slice(11, 16) };
  } catch (err) {
    return fehler(err);
  }
}

const EINST_FELDER = new Set(["gewaehrleistung_monate", "vermutung_verbraucher_monate", "vermutung_unternehmer_monate", "fristwarnung_tage", "reaktion_werktage", "sla_reaktion_niedrig", "sla_reaktion_normal", "sla_reaktion_hoch", "sla_reaktion_dringend", "sla_loesung_niedrig", "sla_loesung_normal", "sla_loesung_hoch", "sla_loesung_dringend", "sla_warn_werktage", "sla_gf_ab_stufe", "telefon_ist_erstreaktion", "eskalation_tage", "kulanz_schwelle_cent", "standard_prioritaet", "einsatz_takt_min", "einsatz_puffer_min", "techniker_tag_von", "techniker_tag_bis", "ersatzteil_bestand_fuehren", "mindestbestand_warnung", "ersatzteil_ueberfaellig_tage", "regress_toleranz_cent", "mail_automatisch", "erinnerung_tage_vorher", "wartung_karenz_tage", "nachkauf_tage_nach", "wartung_automatisch", "wartung_vorlauf_tage", "portal_sichtbar_standard", "portal_fotos_max", "portal_foto_max_mb", "portal_videos_max", "portal_video_max_mb"]);
export async function einstellungenAction({ werte = {} } = {}) {
  const k = await kontext("PH Service Einstellungen", "write");
  if (k.antwort) return k.antwort;
  if (!sicht(k.session).leitung) return { ok: false, code: "forbidden", message: T.einstellungen.nurLeitung };
  const f = {};
  const w = {};
  for (const [feld, v] of Object.entries(werte || {})) {
    if (!EINST_FELDER.has(feld)) continue;
    if (feld === "standard_prioritaet") {
      if (!PRIORITAETEN.includes(v)) f[feld] = T.melden.pflicht;
      w[feld] = v;
    } else if (feld.startsWith("techniker_tag_")) {
      if (!ZEIT.test(String(v))) f[feld] = "Zeit im Format HH:MM";
      w[feld] = String(v).length === 5 ? `${v}:00` : v;
    } else {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 99_999_999) f[feld] = "Zahl prüfen";
      w[feld] = Math.round(n);
    }
  }
  if (Object.keys(f).length) return pruefFehler(f);
  try {
    await k.client.setValue("PH Service Einstellungen", "PH Service Einstellungen", w);
    revalidiere("/service/einstellungen", "/service");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}


// ================================================================= Kanban ==

/**
 * Verschieben auf einem Service-Kanban: einfache Übergänge direkt (verzögert), Übergänge mit Pflichtangaben
 * öffnen den passenden Assistenten in der Akte (Antwort code "dialog" + href) – nie ein Übergang ohne Angaben.
 */
export async function kanbanAction({ art, name, von, nach } = {}) {
  if (!nameOk(name)) return pruefFehler({});
  const akte = { fall: `/service/faelle/${name}`, einsatz: `/service/einsaetze/${name}`, regress: `/service/regress/${name}`, bestellung: `/service/ersatzteile/bestellungen/${name}`, auftrag: `/service/vertraege/auftraege/${name}` }[art];
  if (!akte) return pruefFehler({});
  const dialog = (aktion) => ({ ok: false, code: "dialog", href: `${akte}?aktion=${aktion}`, message: T.faelle.kanbanKeinUebergang });
  if (art === "fall") {
    if (von === "Entscheidung" && nach === "In Bearbeitung") {
      const k = await kontext(FALL);
      if (k.antwort) return k.antwort;
      try {
        return await planeOderSofort(k.session, k.client, { art: "workflow", args: { doctype: FALL, name, aktion: "In Bearbeitung nehmen", pfad: fallPfade(name) }, objekt: { doctype: FALL, name }, titel: `In Bearbeitung ${name}`, schluessel: `bearbeiten:${name}` });
      } catch (err) {
        return fehler(err);
      }
    }
    if (nach === "Geschlossen") return schliessenAction({ names: [name] });
    return dialog({ Geprueft: "pruefen", Entscheidung: "pruefen", Erledigt: "erledigt", "In Bearbeitung": "pruefen" }[nach] || "pruefen");
  }
  if (art === "einsatz") {
    if (von === "Geplant" && nach === "Bestaetigt") return einsatzStatusAction({ name, methode: "bestaetigen" });
    if (nach === "Nicht angetroffen") return dialog("nicht-angetroffen");
    return { ok: false, code: "invalid", message: "Unterwegs und In Arbeit meldet der Techniker. Im Notfall: Einsatz öffnen → Weitere Aktionen." };
  }
  return dialog(nach === "Anerkannt" ? "anerkannt" : nach === "Gemeldet" ? "melden" : "status");
}
