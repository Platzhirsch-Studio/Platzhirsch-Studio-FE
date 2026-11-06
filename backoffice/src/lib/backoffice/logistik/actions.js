"use server";
// Server Actions Logistik (10-konzept-logistik § 14.3). Jede Action: Sitzung, Recht (darfDoc) und Rolle erneut prüfen,
// Eingaben prüfen, Belegsperre vor jedem `save`, Rückgabe { ok, … } | { ok:false, code, message, fehler? } – nie werfen.
// Mock-Pfad über dienst.js (MASTER § 5.3 Nr. 5). Verzögerte Commits (Gepackt, Übergeben, Freigabe) über planeCommit.

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/backoffice/auth/dal";
import { darfDoc } from "@/lib/backoffice/auth/rechte";
import { ladeMeta } from "@/lib/backoffice/frappe";
import { logistikClient } from "./client.js";
import { istBackofficeError } from "@/lib/backoffice/frappe/errors";
import { planeCommit } from "@/lib/backoffice/commit/server";
import * as D from "./dienst.js";
import { pruefeAenderung, stornoMoeglich } from "./belegsperre.js";
import { pruefeMengen, restJePosition } from "./rest.js";
import { pruefeOverride, zahlungsSperre } from "./zahlung.js";
import { darfFaktura, darfTourMobil, istLeitung, istLogistik } from "./rechte.js";
import { schalter } from "./schalter.js";
import { freigabePruefen } from "./inventur.js";
import { inventurAkte } from "./daten.js";
import { FEHLER } from "./texte.js";

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message, fehler: err.detail?.fehler };
  console.error("[logistik] Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: FEHLER.allgemein };
}

const VERBOTEN = { ok: false, code: "forbidden", message: "Keine Berechtigung für diese Aktion." };
const NUR_LEITUNG = { ok: false, code: "forbidden", message: FEHLER.nurLeitung };
const UNGUELTIG = (message = "Unvollständige Angaben.", f) => ({ ok: false, code: "invalid", message, fehler: f });
const NAME = /^[A-Za-z0-9 ÄÖÜäöüß.:/_()-]{1,100}$/;

function gueltig(...namen) {
  return namen.every((n) => typeof n === "string" && NAME.test(n));
}

function neuLaden(...pfade) {
  for (const p of pfade.filter(Boolean)) {
    try {
      revalidatePath(p);
    } catch {
      /* außerhalb einer Anfrage */
    }
  }
}

/**
 * Gemeinsamer Ablauf: Sitzung, Rolle, DocType-Recht, Ausführung, Fehlerabbildung.
 * @param {{doctype?:string, recht?:string, leitung?:boolean, montage?:boolean}} opts
 */
async function lauf(opts, fn) {
  const session = await requireSession();
  try {
    if (!istLogistik(session) && !(opts.montage && session.roles?.includes("PH Montage"))) return VERBOTEN;
    if (opts.leitung && !istLeitung(session)) return NUR_LEITUNG;
    const client = logistikClient(session);
    if (opts.doctype) {
      const meta = await ladeMeta(client, opts.doctype);
      if (!darfDoc(session, meta, opts.recht || "write")) return VERBOTEN;
    }
    const r = await fn({ session, client, leitung: istLeitung(session) });
    if (r && r.ok === false) return r;
    return { ok: true, ...(r || {}) };
  } catch (err) {
    return fehler(err);
  }
}

// ================================================================ Packtisch ==

export async function vorgangScannenAction({ code, packplatz }) {
  if (typeof code !== "string" || !code.trim() || code.length > 200) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein", recht: "read" }, async ({ client }) => {
    const r = await D.vorgangScannen(client, { code: code.trim(), packplatz });
    return { lieferschein: r.lieferschein, art: r.art, kandidaten: r.kandidaten || [] };
  });
}

export async function bestellungOeffnenAction({ bestellung }) {
  if (!gueltig(bestellung)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein", recht: "create" }, async ({ client }) => ({ lieferschein: await D.lieferscheinAusBestellung(client, { bestellung }) }));
}

export async function scanAction({ lieferschein, code, anzahl = 1, bestaetigt = false, packplatz }) {
  if (!gueltig(lieferschein) || typeof code !== "string" || !code.trim()) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => D.scanMenge(client, { lieferschein, code: code.trim(), anzahl: Number(anzahl) || 1, bestaetigt: !!bestaetigt, packplatz }));
}

export async function handBestaetigenAction({ lieferschein, position, anzahl = null }) {
  if (!gueltig(lieferschein, position)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => D.handBestaetigen(client, { lieferschein, position, anzahl }));
}

/** Absoluter Stand (Undo „Abgehakt“, Offline-Puffer). */
export async function positionStandAction({ lieferschein, stand, idempotency }) {
  if (!gueltig(lieferschein) || !stand || typeof stand !== "object") return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    await D.positionenSetzen(client, { lieferschein, stand, idempotency });
    neuLaden(`/packtisch/${lieferschein}`);
    return {};
  });
}

export async function positionMinusAction({ lieferschein, position }) {
  if (!gueltig(lieferschein, position)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => D.positionMinus(client, { lieferschein, position }));
}

export async function entnahmeAction({ lieferschein, position, lagerbestand }) {
  if (!gueltig(lieferschein, position, lagerbestand)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    const b = await client.getDoc("PH Lagerbestand", lagerbestand);
    if (Number(b.gesperrt) || b.status === "Gesperrt") return UNGUELTIG("Gesperrter Bestand kann nicht entnommen werden.");
    await D.entnahmeSetzen(client, { lieferschein, position, lagerbestand });
    return {};
  });
}

export async function paketeSpeichernAction({ lieferschein, pakete, versichern, versicherungswertCent, packplatz }) {
  if (!gueltig(lieferschein) || !Array.isArray(pakete) || pakete.length > 30) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => D.paketeSpeichern(client, { lieferschein, pakete, versichern, versicherungswertCent, packplatz }));
}

export async function paketeVorschlagenAction({ lieferschein }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => D.paketeVorschlagen(client, { lieferschein }));
}

export async function hinweiseBestaetigenAction({ lieferschein }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    await D.packhinweiseBestaetigen(client, { lieferschein });
    return {};
  });
}

export async function tarifeAction({ lieferschein, neu = false }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein", recht: "read" }, async ({ client }) => ({ ergebnis: await D.tarife(client, { lieferschein, neu }) }));
}

/**
 * Abschluss „Paket abschließen“ (Versand): Etikett + Gepackt + Bestand. Live nur mit Bestätigung.
 * Vorher aktive Sendung prüfen (nie doppelt buchen).
 */
export async function verpackenAction({ lieferschein, tarifId, bestaetigt = false, packplatz, teillieferung = false }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    const einst = await client.getDoc("PH Logistik Einstellungen", "PH Logistik Einstellungen").catch(() => ({}));
    const live = !Number(einst.letmeship_testmodus) && !!Number(einst.letmeship_konfiguriert);
    if (live && !bestaetigt) return { ok: false, code: "invalid", message: "Kostenpflichtige Buchung bitte bestätigen.", bestaetigen: true };
    const r = await D.verpacken(client, { lieferschein, tarifId, packplatz, teillieferung });
    neuLaden("/packtisch", `/logistik/lieferscheine/${lieferschein}`);
    return { ergebnis: r };
  });
}

/** Etikett einzeln (Akte „Etikett“, Packtisch F4). */
export async function etikettAction({ lieferschein, tarifId, bestaetigt = false }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Sendung", recht: "create" }, async ({ client }) => {
    const einst = await client.getDoc("PH Logistik Einstellungen", "PH Logistik Einstellungen").catch(() => ({}));
    const live = !Number(einst.letmeship_testmodus) && !!Number(einst.letmeship_konfiguriert);
    if (live && !bestaetigt) return { ok: false, code: "invalid", message: "Kostenpflichtige Buchung bitte bestätigen.", bestaetigen: true };
    const s = await D.etikettErzeugen(client, { lieferschein, tarifId });
    neuLaden(`/logistik/lieferscheine/${lieferschein}`, "/logistik/sendungen");
    return { sendung: s };
  });
}

/**
 * Gepackt / Abholbereit als verzögerter Commit (E1). Abholung ohne E-Mail → Aufgabe kommt im Commit.
 * @returns {{ok:true, token:string, ms:number, objekt:object, ohneMail?:boolean}}
 */
export async function gepacktPlanenAction({ lieferschein }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ session, client }) => {
    const ls = await client.getDoc("PH Lieferschein", lieferschein);
    if (ls.status !== "Entwurf") return UNGUELTIG("Bereits gepackt.");
    const offen = (ls.positionen || []).some((p) => Number(p.menge_gepackt || 0) < Number(p.menge || 0));
    if (offen) return UNGUELTIG("Noch nicht alle Positionen gepackt.");
    const r = await planeCommit(session, { action: "logistik.gepackt", args: { lieferschein }, schluessel: `gepackt:${lieferschein}`, objekt: { doctype: "PH Lieferschein", name: lieferschein, titel: ls.kunde_name }, titel: `Gepackt ${lieferschein}` });
    return { token: r.token, ms: r.ms, frist: r.frist, objekt: r.objekt, ohneMail: ls.lieferart === "Abholung" && !ls.kunde_email, kunde: ls.kunde_name };
  });
}

export async function zurueckstellenAction({ lieferschein, grund, text = "" }) {
  const gruende = ["Fehlt", "Beschaedigt", "Falscher Artikel", "Kunde Rueckfrage", "Sonstiges"];
  if (!gueltig(lieferschein) || !gruende.includes(grund) || String(text).length > 500) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    await D.zurueckstellen(client, { lieferschein, grund, text });
    neuLaden("/packtisch", `/logistik/lieferscheine/${lieferschein}`);
    return {};
  });
}

export async function fortsetzenAction({ lieferschein }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    await D.fortsetzen(client, { lieferschein });
    return {};
  });
}

export async function problemAction({ lieferschein, grund, text = "" }) {
  const gruende = ["Beschaedigt", "Fehlt", "Falscher Artikel", "Adresse unklar", "Sonstiges"];
  if (!gueltig(lieferschein) || !gruende.includes(grund) || String(text).length > 500) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    const r = await D.problemMelden(client, { lieferschein, grund, text });
    neuLaden(`/logistik/lieferscheine/${lieferschein}`);
    return r;
  });
}

export async function teillieferungAction({ lieferschein }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein", recht: "create" }, async ({ client }) => D.teillieferung(client, { lieferschein }));
}

/**
 * Abholung ausgeben: Zahlung (Shop `bezahlt_am`, AB offen) + Anzahlung, Abholcode (Pflicht laut Einstellung; ohne Code nur
 * Leitung), Unterschrift oder Alternative „Name bestätigt“. Override nur Leitung mit Grund.
 */
export async function ausgebenAction({ lieferschein, empfaengerName, unterschrift = null, alternative = null, abholcode = "", override = "" }) {
  if (!gueltig(lieferschein) || typeof empfaengerName !== "string" || !empfaengerName.trim()) return UNGUELTIG("Bitte den Namen der abholenden Person eintragen.", { empfaengerName: "Name fehlt" });
  if (!unterschrift && alternative !== "Name bestätigt") return UNGUELTIG("Bitte unterschreiben lassen oder Alternative wählen", { unterschrift: "fehlt" });
  return lauf({ doctype: "PH Lieferschein" }, async ({ client, leitung }) => {
    const ls = await client.getDoc("PH Lieferschein", lieferschein);
    if (ls.lieferart !== "Abholung" || ls.status !== "Gepackt") return UNGUELTIG("Ausgeben geht nur bei gepackten Abholungen.");
    const [ab, bestellung, einst] = await Promise.all([
      ls.auftrag ? client.getDoc("PH Auftragsbestaetigung", ls.auftrag).catch(() => null) : null,
      ls.bestellung ? client.getDoc("PH Bestellung", ls.bestellung).catch(() => null) : null,
      client.getDoc("PH Logistik Einstellungen", "PH Logistik Einstellungen").catch(() => ({})),
    ]);
    const sp = zahlungsSperre({ ab, bestellung, aktion: "ausgeben", schalter: schalter() });
    if (sp.gesperrt) {
      const o = pruefeOverride({ leitung, grund: override });
      if (!o.ok) return { ...o, message: sp.text, sperre: sp };
    }
    if (Number(einst.abholcode_pflicht) && ls.abholcode && !abholcode && !leitung) return UNGUELTIG("Abholcode fehlt – ohne Code gibt nur die Leitung aus.", { abholcode: "Abholcode fehlt" });
    if (override) await client.kommentar("PH Lieferschein", lieferschein, `Zahlungs-Sperre überschrieben: ${String(override).slice(0, 300)}`);
    if (alternative) await client.kommentar("PH Lieferschein", lieferschein, `Übergabe ohne Unterschrift: ${alternative} (${empfaengerName.trim()})`);
    await D.alsZugestellt(client, { lieferschein, empfaengerName: empfaengerName.trim(), unterschrift, abholcode: abholcode || undefined });
    neuLaden("/packtisch", `/logistik/lieferscheine/${lieferschein}`);
    return { kunde: ls.kunde_name };
  });
}

/** Lager-Scan (Kopf-Taste): Platz-QR oder Bestand. */
export async function lagerScanAction({ code }) {
  if (typeof code !== "string" || !code.trim()) return UNGUELTIG();
  return lauf({ doctype: "PH Lagerbestand", recht: "read" }, async ({ client }) => {
    const c = code.trim();
    if (c.includes("/")) return { art: "platz", ...(await D.platzScan(client, { code: c })) };
    const t = await client.getList("PH Lagerbestand", { fields: ["*"], orFilters: [["name", "=", c], ["seriennummer", "=", c], ["ean", "=", c]], limit: 10 });
    if (!t.length) return { ok: false, code: "not_found", message: "Unbekannter Code" };
    return { art: "bestand", bestaende: t };
  });
}

export async function umlagernScanAction({ lagerbestand, platzCode, menge }) {
  if (!gueltig(lagerbestand) || typeof platzCode !== "string" || !platzCode.includes("/")) return UNGUELTIG();
  return lauf({ doctype: "PH Lagerbestand" }, async ({ client }) => {
    const r = await D.umlagernScan(client, { lagerbestand, platzCode, menge });
    neuLaden("/logistik/bestand");
    return r;
  });
}

// ============================================================ Lieferschein ==

export async function lieferscheinSpeichernAction({ name, werte, modified }) {
  if (!gueltig(name) || !werte || typeof werte !== "object") return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    const doc = await client.getDoc("PH Lieferschein", name);
    const p = pruefeAenderung(doc, werte);
    if (!p.ok) return p;
    await D.lieferscheinSpeichern(client, { name, werte, modified: modified || doc.modified });
    neuLaden(`/logistik/lieferscheine/${name}`);
    return {};
  });
}

/** Übergeben (einzeln/Masse) als verzögerter Commit; Anzahlung → Sperre, Override nur Leitung mit Grund. */
export async function uebergebenPlanenAction({ namen, an = "Dienstleister", override = "" }) {
  if (!Array.isArray(namen) || !namen.length || namen.length > 50 || !gueltig(...namen) || !["Dienstleister", "Spedition"].includes(an)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ session, client, leitung }) => {
    const docs = await Promise.all(namen.map((n) => client.getDoc("PH Lieferschein", n)));
    const nichtGepackt = docs.filter((d) => d.status !== "Gepackt").map((d) => d.name);
    if (nichtGepackt.length) return UNGUELTIG(`Nur gepackte Lieferscheine: ${nichtGepackt.join(", ")}`);
    for (const d of docs) {
      const ab = d.auftrag ? await client.getDoc("PH Auftragsbestaetigung", d.auftrag).catch(() => null) : null;
      const sp = zahlungsSperre({ ab, schalter: schalter() });
      if (sp.gesperrt) {
        const o = pruefeOverride({ leitung, grund: override });
        if (!o.ok) return { ...o, message: `${d.name}: ${sp.text}`, sperre: sp };
      }
    }
    const r = await planeCommit(session, { action: "logistik.uebergeben", args: { namen, an, override: override || "" }, schluessel: `uebergeben:${namen.join(",")}`, objekt: namen.length === 1 ? { doctype: "PH Lieferschein", name: namen[0] } : null, titel: `Übergeben ${namen.length}` });
    return { token: r.token, ms: r.ms, objekt: r.objekt, anzahl: namen.length };
  });
}

/** Zustellung bestätigen (Desktop); AB über Tour → Aufgabe an Faktura (E7), Ausfuhr → Aufgabe Faktura. */
export async function zustellungAction({ name, empfaengerName = "", notiz = "" }) {
  if (!gueltig(name) || String(empfaengerName).length > 120 || String(notiz).length > 500) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ client }) => {
    const ls = await client.getDoc("PH Lieferschein", name);
    if (ls.lieferart === "Abholung") return UNGUELTIG("Abholungen werden ausgegeben, nicht zugestellt.");
    await D.alsZugestellt(client, { lieferschein: name, empfaengerName });
    if (notiz) await client.kommentar("PH Lieferschein", name, notiz);
    if (ls.auftrag) {
      const ab = await client.getDoc("PH Auftragsbestaetigung", ls.auftrag).catch(() => null);
      if (ls.tour) await D.aufgabe(client, { titel: `Liefermenge an ${ls.auftrag} melden (${name})`, beschreibung: "Tour-Lieferung – die App meldet die Menge nicht automatisch (Anfrage A1).", referenz_doctype: "PH Lieferschein", referenz_name: name });
      if (ab && /ausfuhr|innergemeinschaft|steuerfrei/i.test(String(ab.ust_fall || ""))) await D.aufgabe(client, { titel: `Steuernachweis zu ${name} beilegen`, beschreibung: "Empfangsbestätigung mit Ort, Datum, Menge für Faktura.", referenz_doctype: "PH Lieferschein", referenz_name: name });
    }
    neuLaden(`/logistik/lieferscheine/${name}`, "/logistik/lieferscheine");
    return {};
  });
}

export async function stornoAction({ name, grund }) {
  if (!gueltig(name) || String(grund || "").trim().length < 5) return UNGUELTIG(FEHLER.grundFehlt, { grund: FEHLER.grundFehlt });
  return lauf({ doctype: "PH Lieferschein" }, async ({ client, leitung }) => {
    const ls = await client.getDoc("PH Lieferschein", name);
    const s = stornoMoeglich(ls, { leitung });
    if (!s.moeglich) return { ok: false, code: "forbidden", message: s.grund };
    await D.stornieren(client, { lieferschein: name, grund: grund.trim() });
    neuLaden(`/logistik/lieferscheine/${name}`, "/logistik/lieferscheine", "/logistik/touren");
    return {};
  });
}

export async function zurueckAufEntwurfAction({ name }) {
  if (!gueltig(name)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein", leitung: true }, async ({ client }) => {
    const ls = await client.getDoc("PH Lieferschein", name);
    if (ls.status !== "Gepackt") return UNGUELTIG("Nur gepackte Lieferscheine.");
    await D.zurueckAufEntwurf(client, { lieferschein: name });
    neuLaden(`/logistik/lieferscheine/${name}`);
    return {};
  });
}

/** Dokumentmethoden am Lieferschein (Lieferbestätigung, Abholbereit erneut, Spedition/Rücknahme anlegen, Teilrechnung). */
export async function lsMethodeAction({ namen, methode }) {
  const liste = Array.isArray(namen) ? namen : [namen];
  if (!liste.length || liste.length > 50 || !gueltig(...liste)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein" }, async ({ session, client }) => {
    if (methode === "teilrechnung_erstellen" && !darfFaktura(session)) return VERBOTEN;
    const ergebnisse = [];
    const ohneMail = [];
    for (const n of liste) {
      const ls = await client.getDoc("PH Lieferschein", n);
      if (methode === "lieferbestaetigung_senden" && (!ls.kunde_email || ls.status !== "Zugestellt")) {
        ohneMail.push(n);
        continue;
      }
      ergebnisse.push({ name: n, ergebnis: await D.lsMethode(client, { lieferschein: n, methode }) });
    }
    neuLaden("/logistik/lieferscheine", ...liste.map((n) => `/logistik/lieferscheine/${n}`));
    return { ergebnisse, ohneMail, gesendet: ergebnisse.length };
  });
}

/** Lieferschein aus AB/Bestellung/Kommission (§ 5.1) mit Restprüfung (E8) und Dezimal-Sperre (E9). */
export async function lieferscheinErzeugenAction({ quelle, name, mengen = {}, lieferart, wunschtermin = "", idempotency }) {
  if (!["auftrag", "bestellung", "kommission"].includes(quelle) || !gueltig(name)) return UNGUELTIG();
  if (lieferart && !["Versand", "Abholung", "Eigenlieferung", "Spedition"].includes(lieferart)) return UNGUELTIG();
  return lauf({ doctype: "PH Lieferschein", recht: "create" }, async ({ client }) => {
    let positionen = [];
    if (quelle === "auftrag") {
      const ab = await client.getDoc("PH Auftragsbestaetigung", name);
      const offene = await client.getList("PH Lieferschein", { fields: ["name", "status"], filters: [["auftrag", "=", name], ["status", "not in", ["Storniert", "Zugestellt"]]], limit: 50 });
      const voll = await Promise.all(offene.map((l) => client.getDoc("PH Lieferschein", l.name)));
      const rest = restJePosition({ beleg: name, positionen: ab.positionen || [], offeneLieferscheine: voll });
      const p = pruefeMengen(rest, mengen);
      if (!p.ok) return { ok: false, code: "invalid", message: p.fehler[0]?.text || "Mengen prüfen.", fehler: Object.fromEntries(p.fehler.map((f) => [f.schluessel || "_", f.text])) };
      positionen = p.positionen;
    }
    const r = await D.lieferscheinErzeugen(client, { quelle, name, positionen, lieferart, wunschtermin, idempotency });
    neuLaden("/logistik/lieferscheine");
    return { name: r.name };
  });
}

/** Kanban: Ziehen ruft Dokumentmethoden statt Statussetzen (§ 4.2). */
export async function lieferscheinKanbanAction({ name, von, nach }) {
  if (!gueltig(name)) return UNGUELTIG();
  if (von === "Entwurf" && nach === "Gepackt") return gepacktPlanenAction({ lieferschein: name });
  if (von === "Gepackt" && nach === "Uebergeben") return uebergebenPlanenAction({ namen: [name], an: "Dienstleister" });
  if (nach === "Zugestellt" && von === "Uebergeben") return zustellungAction({ name });
  if (von === "Gepackt" && nach === "Entwurf") return zurueckAufEntwurfAction({ name });
  return { ok: false, code: "invalid", message: "Dieser Schritt geht nur in der Akte." };
}

// ===================================================================== Tour ==

/** Lieferscheine einer Tour zuordnen (prüft Lieferart, Status, andere aktive Tour je Zeile). */
export async function zurTourAction({ tour, lieferscheine }) {
  if (!gueltig(tour) || !Array.isArray(lieferscheine) || !lieferscheine.length || !gueltig(...lieferscheine)) return UNGUELTIG();
  return lauf({ doctype: "PH Tour" }, async ({ client }) => {
    const t = await client.getDoc("PH Tour", tour);
    if (!["Geplant", "Freigegeben"].includes(t.status)) return UNGUELTIG(FEHLER.tourStatus);
    const fehlerJe = {};
    const ok = [];
    for (const n of lieferscheine) {
      const ls = await client.getDoc("PH Lieferschein", n);
      if (!["Eigenlieferung", "Spedition"].includes(ls.lieferart)) fehlerJe[n] = FEHLER.versandTour;
      else if (!["Entwurf", "Gepackt"].includes(ls.status)) fehlerJe[n] = FEHLER.statusTour;
      else if (ls.tour && ls.tour !== tour) fehlerJe[n] = FEHLER.bereitsTour(ls.tour);
      else ok.push(n);
    }
    if (ok.length) await D.stoppsHinzufuegen(client, { tour, lieferscheine: ok });
    neuLaden("/logistik/touren", `/logistik/touren/${tour}`);
    if (!ok.length) return { ok: false, code: "invalid", message: Object.values(fehlerJe)[0], fehler: fehlerJe };
    return { zugeordnet: ok, fehler: fehlerJe };
  });
}

export async function ausTourAction({ tour, stopp }) {
  if (!gueltig(tour, String(stopp))) return UNGUELTIG();
  return lauf({ doctype: "PH Tour" }, async ({ client }) => {
    await D.stoppEntfernen(client, { tour, stopp: String(stopp) });
    neuLaden("/logistik/touren", `/logistik/touren/${tour}`);
    return {};
  });
}

export async function tourAnlegenAction({ datum, fahrzeug = "", fahrer = "", startZeit = "", lieferschein = "" }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(datum))) return UNGUELTIG("Datum fehlt.", { datum: "Datum fehlt" });
  return lauf({ doctype: "PH Tour", recht: "create" }, async ({ client }) => {
    const t = await D.tourAnlegen(client, { datum, fahrzeug, fahrer, startZeit: startZeit ? `${startZeit}${startZeit.length === 5 ? ":00" : ""}` : undefined });
    if (lieferschein && gueltig(lieferschein)) await D.stoppsHinzufuegen(client, { tour: t.name, lieferscheine: [lieferschein] });
    neuLaden("/logistik/touren");
    return { name: t.name };
  });
}

/** Tour freigeben (Leitung) als verzögerter Commit – Fahrer, Stopps, gepackt, Anzahlung (Override mit Grund). */
export async function tourFreigebenPlanenAction({ name, override = "" }) {
  if (!gueltig(name)) return UNGUELTIG();
  return lauf({ doctype: "PH Tour", leitung: true }, async ({ session, client, leitung }) => {
    const t = await client.getDoc("PH Tour", name);
    if (t.status !== "Geplant") return UNGUELTIG("Nur geplante Touren werden freigegeben.");
    if (!t.fahrer) return UNGUELTIG("Kein Fahrer");
    if (!(t.stopps || []).length) return UNGUELTIG("Keine Stopps");
    const ls = await Promise.all((t.stopps || []).filter((s) => s.lieferschein).map((s) => client.getDoc("PH Lieferschein", s.lieferschein)));
    if (ls.some((l) => l.status === "Entwurf")) return UNGUELTIG("Lieferschein noch nicht gepackt");
    for (const l of ls) {
      const ab = l.auftrag ? await client.getDoc("PH Auftragsbestaetigung", l.auftrag).catch(() => null) : null;
      if (zahlungsSperre({ ab, schalter: schalter() }).gesperrt) {
        const o = pruefeOverride({ leitung, grund: override });
        if (!o.ok) return { ...o, message: `Anzahlung offen (${l.name}) – Grund angeben`, sperre: { art: "anzahlung" } };
      }
    }
    const r = await planeCommit(session, { action: "logistik.tour-freigeben", args: { name, override: override || "" }, schluessel: `freigeben:${name}`, objekt: { doctype: "PH Tour", name }, titel: `Freigabe ${name}` });
    return { token: r.token, ms: r.ms, objekt: r.objekt };
  });
}

/** Starten nur aus „Freigegeben“ (auch bei manipuliertem Aufruf, QA 22). */
export async function tourStartenAction({ name, kmStart = null }) {
  if (!gueltig(name)) return UNGUELTIG();
  return lauf({ doctype: "PH Tour", montage: true }, async ({ session, client }) => {
    const t = await client.getDoc("PH Tour", name);
    if (!darfTourMobil(session, t)) return VERBOTEN;
    if (t.status !== "Freigegeben") return UNGUELTIG("Starten geht nur bei freigegebenen Touren.");
    await D.tourMethode(client, { name, methode: "starten", args: { km_start: kmStart } });
    neuLaden(`/logistik/touren/${name}`, "/logistik/touren");
    return {};
  });
}

export async function tourAbschliessenAction({ name, kmEnde = null }) {
  if (!gueltig(name)) return UNGUELTIG();
  return lauf({ doctype: "PH Tour", montage: true }, async ({ session, client }) => {
    const t = await client.getDoc("PH Tour", name);
    if (!darfTourMobil(session, t)) return VERBOTEN;
    const offen = (t.stopps || []).filter((s) => ["offen", "unterwegs"].includes(s.status));
    if (offen.length) return { ok: false, code: "invalid", message: "Es sind noch Stopps offen.", ersterOffen: offen[0].name };
    await D.tourMethode(client, { name, methode: "abschliessen", args: { km_ende: kmEnde } });
    neuLaden(`/logistik/touren/${name}`);
    return {};
  });
}

export async function tourAbbrechenAction({ name, grund }) {
  if (!gueltig(name) || String(grund || "").trim().length < 5) return UNGUELTIG(FEHLER.grundFehlt, { grund: FEHLER.grundFehlt });
  return lauf({ doctype: "PH Tour", leitung: true }, async ({ client }) => {
    const t = await client.getDoc("PH Tour", name);
    if (["Abgeschlossen", "Abgebrochen"].includes(t.status)) return UNGUELTIG(FEHLER.tourStatus);
    const uebergeben = [];
    for (const s of t.stopps || []) {
      if (!s.lieferschein) continue;
      const ls = await client.getDoc("PH Lieferschein", s.lieferschein);
      if (ls.status === "Uebergeben") uebergeben.push(ls.name);
    }
    await D.tourMethode(client, { name, methode: "abbrechen", args: { grund: grund.trim() } });
    if (uebergeben.length) await D.aufgabe(client, { titel: `Tour ${name} abgebrochen – ${uebergeben.length} Lieferscheine im Fahrzeug`, beschreibung: uebergeben.join(", "), referenz_doctype: "PH Tour", referenz_name: name, prioritaet: "Hoch" });
    neuLaden(`/logistik/touren/${name}`, "/logistik/touren");
    return { uebergeben };
  });
}

export async function reihenfolgeAction({ tour, reihenfolge = [], plz = false }) {
  if (!gueltig(tour) || (!plz && (!Array.isArray(reihenfolge) || !reihenfolge.length))) return UNGUELTIG();
  return lauf({ doctype: "PH Tour" }, async ({ client }) => {
    const t = await client.getDoc("PH Tour", tour);
    if (!["Geplant", "Freigegeben"].includes(t.status)) return UNGUELTIG(FEHLER.tourStatus);
    const vorher = (t.stopps || []).map((s) => s.name);
    await D.reihenfolge(client, { tour, reihenfolge, plz });
    neuLaden(`/logistik/touren/${tour}`);
    return { vorher };
  });
}

export async function avisAction({ tour, kanal = "mail", stopps = null }) {
  if (!gueltig(tour) || !["mail", "sms", "beide"].includes(kanal)) return UNGUELTIG();
  return lauf({ doctype: "PH Tour" }, async ({ client }) => {
    const r = await D.tourMethode(client, { name: tour, methode: "avis_senden", args: { kanal, stopps } });
    neuLaden(`/logistik/touren/${tour}`);
    return { gesendet: r?.gesendet ?? null, ohne: r?.ohne || [] };
  });
}

/** Verschieben: Geplant sofort (Undo), Freigegeben nur Leitung – Freigabe neu (bis A8). */
export async function tourVerschiebenAction({ name, datum, fahrzeug }) {
  if (!gueltig(name) || !/^\d{4}-\d{2}-\d{2}$/.test(String(datum))) return UNGUELTIG();
  return lauf({ doctype: "PH Tour" }, async ({ client, leitung }) => {
    const t = await client.getDoc("PH Tour", name);
    if (t.status === "Freigegeben" && !leitung) return { ok: false, code: "forbidden", message: "Freigegebene Touren verschiebt die Leitung" };
    if (!["Geplant", "Freigegeben"].includes(t.status)) return UNGUELTIG(FEHLER.tourStatus);
    await D.tourVerschieben(client, { name, datum, fahrzeug });
    if (t.status === "Freigegeben") await D.tourMethode(client, { name, methode: "freigeben" });
    neuLaden("/logistik/touren", `/logistik/touren/${name}`);
    return { vorher: { datum: t.datum, fahrzeug: t.fahrzeug } };
  });
}

export async function tourDuplizierenAction({ name, datum }) {
  if (!gueltig(name) || !/^\d{4}-\d{2}-\d{2}$/.test(String(datum))) return UNGUELTIG();
  return lauf({ doctype: "PH Tour", recht: "create" }, async ({ client }) => {
    const t = await client.getDoc("PH Tour", name);
    const n = await D.tourAnlegen(client, { datum, fahrzeug: t.fahrzeug, fahrer: t.fahrer, startZeit: t.start_zeit });
    if ((t.team || []).length) await client.save("PH Tour", { name: n.name, team: t.team.map(({ user, rolle }) => ({ user, rolle })) }, {});
    return { name: n.name };
  });
}

export async function tourSpeichernAction({ name, werte, modified }) {
  const erlaubt = ["fahrer", "fahrzeug", "start_zeit", "start_lagerort", "notiz_fahrer", "notiz_intern", "team", "region"];
  if (!gueltig(name) || !werte || Object.keys(werte).some((k) => !erlaubt.includes(k))) return UNGUELTIG();
  return lauf({ doctype: "PH Tour" }, async ({ client }) => {
    const t = await client.getDoc("PH Tour", name);
    if (!["Geplant", "Freigegeben"].includes(t.status)) return UNGUELTIG(FEHLER.tourStatus);
    await D.tourSpeichern(client, { name, werte, modified: modified || t.modified });
    neuLaden(`/logistik/touren/${name}`);
    return {};
  });
}

/** Stopp-Status (Akte und Montage mobil) – nur Fahrer/Team oder Logistik (QA 27). Teilzustellung → Übergangsweg. */
export async function stoppStatusAction({ tour, stopp, status, notiz = "", unterschriftName = "", unterschrift = null, alternative = null, teilweise = false, idempotency }) {
  if (!gueltig(tour, String(stopp)) || !["unterwegs", "erledigt", "nicht angetroffen", "verschoben"].includes(status)) return UNGUELTIG();
  return lauf({ doctype: "PH Tour", montage: true }, async ({ session, client }) => {
    const t = await client.getDoc("PH Tour", tour);
    if (!darfTourMobil(session, t)) return VERBOTEN;
    const s = (t.stopps || []).find((x) => x.name === String(stopp) || String(x.reihenfolge) === String(stopp));
    if (!s) return { ok: false, code: "not_found", message: "Stopp nicht gefunden." };
    if (status === "erledigt" && s.art !== "Montage" && !unterschrift && !alternative && !teilweise) return UNGUELTIG("Bitte unterschreiben lassen oder Alternative wählen", { unterschrift: "fehlt" });
    const echt = teilweise && !schalter().teilzustellung ? "verschoben" : status;
    const text = teilweise ? `Teilzustellung: ${notiz}` : alternative ? `${alternative}: ${notiz}`.trim() : notiz;
    await D.stoppStatus(client, { tour, stopp: s.name, status: echt, notiz: text, unterschrift, unterschriftName, idempotency });
    if (teilweise || ["nicht angetroffen", "verschoben"].includes(echt)) await D.aufgabe(client, { titel: `${teilweise ? "Teilzustellung nachbuchen" : `Stopp ${echt}`}: ${s.kunde_name || s.lieferschein}`, beschreibung: text, referenz_doctype: s.lieferschein ? "PH Lieferschein" : "PH Tour", referenz_name: s.lieferschein || tour });
    if (echt === "erledigt" && s.lieferschein) {
      const ls = await client.getDoc("PH Lieferschein", s.lieferschein);
      if (ls.auftrag) await D.aufgabe(client, { titel: `Liefermenge an ${ls.auftrag} melden (${ls.name})`, beschreibung: "Tour-Lieferung – Anfrage A1 offen.", referenz_doctype: "PH Lieferschein", referenz_name: ls.name });
    }
    neuLaden(`/logistik/touren/${tour}`);
    return { status: echt };
  });
}

// ================================================================== Sendung ==

export async function sendungAction({ name, methode, args = {}, bestaetigt = false }) {
  if (!gueltig(name) || !D.SENDUNG_METHODEN.includes(methode)) return UNGUELTIG();
  return lauf({ doctype: "PH Sendung" }, async ({ client, leitung }) => {
    const s = await client.getDoc("PH Sendung", name);
    if (methode === "stornieren" && s.status !== "Angelegt" && !leitung) return NUR_LEITUNG;
    if (methode === "manuell_zugestellt" && s.status === "Problem" && !leitung) return NUR_LEITUNG;
    if (methode === "buchen" && s.env === "live" && !bestaetigt) return { ok: false, code: "invalid", message: "Kostenpflichtige Buchung bitte bestätigen.", bestaetigen: true };
    const r = await D.sendungMethode(client, { name, methode, args });
    if (methode === "problem_melden" && args.neu) await D.aufgabe(client, { titel: `Ersatzlieferung zu ${name} anlegen`, referenz_doctype: "PH Sendung", referenz_name: name, prioritaet: "Hoch" });
    neuLaden(`/logistik/sendungen/${name}`, "/logistik/sendungen");
    return { ergebnis: r?.name ? { name: r.name, status: r.status } : null };
  });
}

/** Problem klären (Sheet): Wege abwarten · Kunde hat Ware · Ware kommt zurück · Neu senden. */
export async function sendungKlaerenAction({ name, weg, notiz = "" }) {
  if (!gueltig(name) || !["abwarten", "zugestellt", "zurueck", "neu"].includes(weg)) return UNGUELTIG();
  return lauf({ doctype: "PH Sendung" }, async ({ client, leitung }) => {
    if (weg === "abwarten") {
      await client.kommentar("PH Sendung", name, `Carrier informiert – abwarten. ${notiz}`.trim());
      await D.aufgabe(client, { titel: `Sendung ${name} nachfassen`, referenz_doctype: "PH Sendung", referenz_name: name, faelligTage: 2 });
    } else if (weg === "zugestellt") {
      if (!leitung) return NUR_LEITUNG;
      await D.sendungMethode(client, { name, methode: "manuell_zugestellt" });
    } else if (weg === "zurueck") await D.sendungMethode(client, { name, methode: "retourenlabel" });
    else await D.aufgabe(client, { titel: `Ersatzlieferung zu ${name} anlegen`, beschreibung: notiz, referenz_doctype: "PH Sendung", referenz_name: name, prioritaet: "Hoch" });
    neuLaden(`/logistik/sendungen/${name}`);
    return {};
  });
}

export async function trackingAlleAction() {
  return lauf({ doctype: "PH Sendung", recht: "read" }, async ({ client }) => {
    const r = await D.trackingAlle(client);
    neuLaden("/logistik/sendungen");
    return { abgeglichen: r?.abgeglichen ?? r?.anzahl ?? null };
  });
}

// ==================================================== Spedition, Rücknahme ==

export async function speditionAction({ name, methode, args = {} }) {
  if (!gueltig(name) || !D.SPEDITION_METHODEN.includes(methode)) return UNGUELTIG();
  return lauf({ doctype: "PH Speditionsauftrag" }, async ({ client, leitung }) => {
    const s = await client.getDoc("PH Speditionsauftrag", name);
    if (methode === "stornieren") {
      if (s.status !== "Entwurf" && !leitung) return NUR_LEITUNG;
      if (String(args.grund || "").trim().length < 5) return UNGUELTIG(FEHLER.grundFehlt, { grund: FEHLER.grundFehlt });
    }
    if (methode === "per_email_senden" && !(s.packstuecke || []).length) return UNGUELTIG("Ohne Packstücke nicht sendbar");
    if (methode === "zugestellt" && !String(args.empfaenger_name || "").trim()) return UNGUELTIG("Empfänger fehlt.", { empfaenger_name: "Pflicht" });
    await D.speditionMethode(client, { name, methode, args });
    neuLaden(`/logistik/speditionen/${name}`, "/logistik/speditionen");
    return {};
  });
}

export async function speditionAnlegenAction({ lieferschein }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Speditionsauftrag", recht: "create" }, async ({ client }) => {
    const r = await D.lsMethode(client, { lieferschein, methode: "speditionsauftrag_anlegen" });
    return { name: typeof r === "string" ? r : r?.name || r?.speditionsauftrag || null };
  });
}

export async function ruecknahmeAction({ name, methode, args = {} }) {
  if (!gueltig(name) || !D.RUECKNAHME_METHODEN.includes(methode)) return UNGUELTIG();
  return lauf({ doctype: "PH Warenruecknahme" }, async ({ client, leitung }) => {
    if (methode === "abschliessen" && !leitung) return NUR_LEITUNG;
    if (methode === "stornieren" && String(args.grund || "").trim().length < 5) return UNGUELTIG(FEHLER.grundFehlt, { grund: FEHLER.grundFehlt });
    if (methode === "pruefung_buchen") {
      const fehlt = (args.positionen || []).map((p, i) => (!p.zustand || !p.entscheidung || (p.entscheidung === "Wiedereinlagern" && !p.platz) ? i + 1 : null)).filter(Boolean);
      if (fehlt.length) return UNGUELTIG(`Position ${fehlt.join(", ")}: Zustand, Entscheidung und Platz (bei Einlagerung) sind Pflicht.`);
    }
    await D.ruecknahmeMethode(client, { name, methode, args });
    neuLaden(`/logistik/ruecknahmen/${name}`, "/logistik/ruecknahmen");
    return {};
  });
}

export async function ruecknahmeAnlegenAction({ lieferschein }) {
  if (!gueltig(lieferschein)) return UNGUELTIG();
  return lauf({ doctype: "PH Warenruecknahme", recht: "create" }, async ({ client }) => {
    const ls = await client.getDoc("PH Lieferschein", lieferschein);
    if (ls.status !== "Zugestellt") return UNGUELTIG("Rücknahmen entstehen am zugestellten Lieferschein.");
    const r = await D.lsMethode(client, { lieferschein, methode: "warenruecknahme_anlegen" });
    return { name: typeof r === "string" ? r : r?.name || null };
  });
}

// ================================================================== Bestand ==

/** Umlagern · Reservieren · Freigeben · Sperren · Entsperren (Leitung) · Ausbuchen (Leitung, Menge ≤ verfügbar). */
export async function bestandAction({ name, methode, args = {} }) {
  if (!gueltig(name) || !D.BESTAND_METHODEN.includes(methode)) return UNGUELTIG();
  return lauf({ doctype: "PH Lagerbestand" }, async ({ client, leitung }) => {
    if ((methode === "entsperren" || methode === "ausbuchen") && !leitung) return NUR_LEITUNG;
    if ((methode === "sperren" || methode === "ausbuchen") && String(args.grund || "").trim().length < 3) return UNGUELTIG(FEHLER.grundFehlt, { grund: FEHLER.grundFehlt });
    const b = await client.getDoc("PH Lagerbestand", name);
    const a = { ...args };
    if (methode === "ausbuchen") a.menge = Math.min(Math.max(1, Math.trunc(Number(args.menge || b.verfuegbar))), Number(b.verfuegbar || 0));
    if (methode === "umlagern" || methode === "reservieren") {
      const m = Number(a.menge || (methode === "umlagern" ? b.menge : 1));
      if (!Number.isInteger(m) || m <= 0) return UNGUELTIG("Menge ganzzahlig > 0.", { menge: "ungültig" });
      a.menge = m;
    }
    const r = await D.bestandMethode(client, { name, methode, args: a });
    neuLaden("/logistik/bestand", `/logistik/bestand/${name}`, "/logistik/ausstellung");
    return { vorher: { lagerort: b.lagerort, platz: b.platz, reserviert: b.reserviert }, ergebnis: r && typeof r === "object" && !r.doctype ? r : null };
  });
}

export async function bewegungBuchenAction({ art, lagerbestand, menge, lagerortVon = "", platzVon = "", lagerortNach = "", platzNach = "", grund }) {
  const arten = ["Wareneingang", "Umlagerung", "Ausbuchung", "Retoure"];
  if (!arten.includes(art) || !gueltig(lagerbestand) || !Number.isInteger(Number(menge)) || Number(menge) <= 0) return UNGUELTIG("Art, Bestand und ganzzahlige Menge sind Pflicht.");
  if (String(grund || "").trim().length < 3) return UNGUELTIG(FEHLER.grundFehlt, { grund: FEHLER.grundFehlt });
  if ((art === "Umlagerung" || art === "Ausbuchung") && !lagerortVon) return UNGUELTIG("„Von“ ist Pflicht.", { lagerortVon: "Pflicht" });
  if ((art === "Umlagerung" || art === "Wareneingang" || art === "Retoure") && !lagerortNach) return UNGUELTIG("„Nach“ ist Pflicht.", { lagerortNach: "Pflicht" });
  return lauf({ doctype: "PH Lagerbewegung", recht: "create", leitung: art === "Ausbuchung" }, async ({ client }) => {
    const b = await client.getDoc("PH Lagerbestand", lagerbestand);
    const r = await D.bewegungBuchen(client, { werte: { art, lagerbestand, produkt: b.produkt, produkt_name: b.produkt_name, menge: art === "Ausbuchung" ? -Number(menge) : Number(menge), lagerort_von: lagerortVon, platz_von: platzVon, lagerort_nach: lagerortNach, platz_nach: platzNach, grund: grund.trim() } });
    neuLaden("/logistik/bewegungen", "/logistik/bestand");
    return { name: r.name };
  });
}

export async function bewegungStornierenAction({ name }) {
  if (!gueltig(name)) return UNGUELTIG();
  return lauf({ doctype: "PH Lagerbewegung", leitung: true }, async ({ client }) => {
    const r = await D.bewegungStornieren(client, { name });
    neuLaden("/logistik/bewegungen");
    return { gegen: r?.name || null };
  });
}

export async function kommissionLieferscheinAction({ kommission, lieferart = "Eigenlieferung", wunschtermin = "", idempotency }) {
  return lieferscheinErzeugenAction({ quelle: "kommission", name: kommission, lieferart, wunschtermin, idempotency });
}

// ================================================================= Inventur ==

export async function inventurAnlegenAction({ lagerort, datum, nurAusstellung = false, art = "Stichtag", plaetze = "", anlass = "" }) {
  if (!gueltig(lagerort) || !/^\d{4}-\d{2}-\d{2}$/.test(String(datum)) || !["Stichtag", "Teilinventur", "Anlass"].includes(art)) return UNGUELTIG("Lagerort und Stichtag sind Pflicht.");
  return lauf({ doctype: "PH Inventur", recht: "create" }, async ({ client }) => {
    const r = await D.inventurAnlegen(client, { lagerort, datum, nurAusstellung, art, plaetze, anlass });
    neuLaden("/logistik/inventur");
    return { name: r.name };
  });
}

export async function teilinventurAction({ lagerort, anzahl = 8 }) {
  if (!gueltig(lagerort)) return UNGUELTIG();
  return lauf({ doctype: "PH Inventur", recht: "create" }, async ({ client }) => {
    const r = await D.teilinventurAnlegen(client, { lagerort, anzahl: Math.min(Math.max(Number(anzahl) || 8, 1), 200) });
    neuLaden("/logistik/inventur");
    return { name: r.inventur || r.name, plaetze: r.plaetze || [] };
  });
}

/** Zählen, Fund, Starten, Zählliste, Verwerfen (Laufend: Leitung). Freigabe über inventurFreigebenAction. */
export async function inventurAction({ name, methode, args = {} }) {
  if (!gueltig(name) || !D.INVENTUR_METHODEN.includes(methode) || methode === "freigeben") return UNGUELTIG();
  return lauf({ doctype: "PH Inventur" }, async ({ client, leitung }) => {
    const inv = await client.getDoc("PH Inventur", name);
    if (methode === "verwerfen" && inv.status === "Laufend" && !leitung) return NUR_LEITUNG;
    if (methode === "zaehlen" && (!Number.isInteger(Number(args.ist)) || Number(args.ist) < 0)) return UNGUELTIG("Ganzzahl ≥ 0.", { ist: "ungültig" });
    const r = await D.inventurMethode(client, { name, methode, args });
    neuLaden(`/logistik/inventur/${name}`);
    return { ergebnis: r && !r.doctype ? r : null };
  });
}

export async function inventurGrundAction({ name, lagerbestand, grund, bemerkung }) {
  const gruende = ["", "Schwund", "Verkauf nicht gebucht", "Umlagerung nicht gebucht", "Beschaedigt", "Zaehlfehler", "Sonstiges"];
  if (!gueltig(name, lagerbestand) || !gruende.includes(grund ?? "")) return UNGUELTIG();
  return lauf({ doctype: "PH Inventur" }, async ({ client }) => {
    await D.inventurGrund(client, { name, lagerbestand, grund, bemerkung });
    neuLaden(`/logistik/inventur/${name}`);
    return {};
  });
}

/** Freigabe mit Vier-Augen, Grund-Pflicht und Bewegungs-Prüfung (§ 5.12, QA 25). */
export async function inventurFreigebenAction({ name }) {
  if (!gueltig(name)) return UNGUELTIG();
  return lauf({ doctype: "PH Inventur", leitung: true }, async ({ session, client, leitung }) => {
    const akte = await inventurAkte(client, name, { session, leitung });
    const p = freigabePruefen({ inventur: akte.doc, benutzer: session.user, leitung, bewegungenSeitStart: akte.bewegungenSeitStart });
    if (!p.darf) return { ok: false, code: "invalid", message: p.gruende.map((g) => g.text).join(" "), gruende: p.gruende };
    const r = await D.inventurMethode(client, { name, methode: "freigeben" });
    neuLaden(`/logistik/inventur/${name}`, "/logistik/inventur", "/logistik/bestand");
    return { bewegungen: r?.bewegungen ?? null };
  });
}

// =========================================================== Bewertung, Nachbestellung, Stammdaten ==

export async function bewertungAnlegenAction({ stichtag, lagerort = "", methode = "" }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(stichtag))) return UNGUELTIG("Stichtag fehlt.", { stichtag: "Pflicht" });
  return lauf({ doctype: "PH Inventurbewertung", recht: "create", leitung: true }, async ({ client }) => {
    const r = await D.bewertungAnlegen(client, { stichtag, lagerort, methode });
    neuLaden("/logistik/inventur/bewertung");
    return { name: r.name };
  });
}

export async function bewertungAction({ name, methode }) {
  if (!gueltig(name) || !D.BEWERTUNG_METHODEN.includes(methode)) return UNGUELTIG();
  return lauf({ doctype: "PH Inventurbewertung", leitung: true }, async ({ client }) => {
    await D.bewertungMethode(client, { name, methode });
    neuLaden(`/logistik/inventur/bewertung/${name}`, "/logistik/inventur/bewertung");
    return {};
  });
}

export async function nachbestellenAction({ namen, idempotency }) {
  if (!Array.isArray(namen) || !namen.length || !gueltig(...namen)) return UNGUELTIG();
  return lauf({ doctype: "PH Bestellvorschlag", leitung: true }, async ({ client }) => {
    const r = await D.nachbestellen(client, { namen, idempotency });
    neuLaden("/logistik/nachbestellung");
    return { bestellt: r?.bestellt || [] };
  });
}

export async function stammdatenAction({ doctype, werte, modified, neu = false }) {
  if (!D.STAMMDATEN_DOCTYPES.includes(doctype) || !werte || typeof werte !== "object") return UNGUELTIG();
  return lauf({ doctype, recht: neu ? "create" : "write", leitung: true }, async ({ client }) => {
    const r = await D.stammdatenSpeichern(client, { doctype, werte, modified, neu });
    neuLaden("/logistik/stammdaten");
    return { name: r?.name || null };
  });
}

/** Touren-Kanban: nur Geplant → Freigegeben (Leitung, verzögert); sonst Akte (§ 4.6). */
export async function tourKanbanAction({ name, von, nach }) {
  if (von === "Geplant" && nach === "Freigegeben") return tourFreigebenPlanenAction({ name });
  return { ok: false, code: "invalid", message: "Dieser Schritt geht nur in der Tour-Akte." };
}

/** Speditions-Kanban: Gesendet → Abgeholt, Bestätigt → Abgeholt (Lieferschein übergeben); Rest in der Akte. */
export async function speditionKanbanAction({ name, von, nach }) {
  if (nach === "Abgeholt" && ["Gesendet", "Bestaetigt"].includes(von)) return speditionAction({ name, methode: "abgeholt" });
  return { ok: false, code: "invalid", message: "Dieser Schritt geht nur in der Akte." };
}
