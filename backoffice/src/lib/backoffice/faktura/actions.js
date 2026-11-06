"use server";
// Server Actions des Bereichs Faktura (10-konzept-faktura § 16.3). Für alle gilt: Sitzung + Recht erneut prüfen,
// Eingaben prüfen, Rückgabe { ok, code, message, fehler? } – nie werfen. Geldwirksame und mehrstufige Aktionen
// tragen einen Idempotenz-Schlüssel (Q-A10, U-07). Gestellte Belege nur über Methoden (B-03). Kein Betrag und
// kein Name im Log. Mock-Pfad über methoden.js (fachliche Nachbildung), Frappe-Pfad über ph_faktura-Methoden.

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/dal.js";
import { backoffice } from "../frappe/index.js";
import { istBackofficeError } from "../frappe/errors.js";
import { faehigkeiten } from "../faehigkeiten.js";
import { isoDatum, cent } from "../format.js";
import { planeCommit } from "../commit/server.js";
import { mockUeberschreibung } from "@/components/Backoffice/Faehigkeit";
import { FAKTURA, SCHALTER_IDS, schalterAn } from "./faehigkeiten.js";
import { fakturaRolle } from "./rolle.js";
import { methode, neuerBeleg, api } from "./methoden.js";
import { kanalErlaubt, pruefeRechnungsdatum, darfFeldSchreiben, KANAL } from "./regeln.js";
import { pruefePflichtangaben } from "./pflichtangaben.js";
import { belegSummen, zahlungsplanPruefen } from "./betraege.js";
import * as KZ from "./kostenzuordnung.js";
import { FEHLER, ZAHLUNG } from "./texte.js";
import { stelleMockBestandSicher } from "./mock-bestand.js";

// ------------------------------------------------------------------ Hilfen --

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message, detail: err.detail };
  console.error("[faktura] Aktion fehlgeschlagen", err?.name || "Fehler");
  return { ok: false, code: "unavailable", message: FEHLER.unavailable };
}

const nein = (code, message, extra = {}) => ({ ok: false, code, message, ...extra });
const NAME = /^[\w .:/-]{1,140}$/u;
const istName = (n) => typeof n === "string" && NAME.test(n);
const istDatum = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
const text = (t, max = 500) => String(t ?? "").replace(/[<>]/g, "").slice(0, max).trim();
const DOCTYPES = new Set(["PH Angebot", "PH Auftragsbestaetigung", "PH Rechnung", "PH Gutschrift", "PH Mahnung", "PH Eingangsrechnung", "PH Bankumsatz", "PH Export Lauf", "PH UVA Auswertung", "PH Zahlungsbedingung"]);

function neuLaden() {
  revalidatePath("/faktura", "layout");
}

/** Sitzung + Bereichsrecht; liefert { session, client, rolle, schalter } oder eine Fehlerantwort. */
async function kontext(aktion = "write") {
  const session = await getSession();
  if (!session) return { antwort: nein("auth", "Bitte neu anmelden.") };
  const rolle = fakturaRolle(session);
  const erlaubt = aktion === "leitung" ? rolle.leitung : aktion === "read" ? rolle.liest : rolle.schreibt;
  if (!erlaubt) return { antwort: nein("forbidden", aktion === "leitung" ? FEHLER.forbidden : "Keine Berechtigung.") };
  const client = backoffice(session);
  stelleMockBestandSicher(client);
  return { session, client, rolle };
}

async function schalter(session, client) {
  const stati = await faehigkeiten(session, SCHALTER_IDS, { katalog: FAKTURA, client, ueberschreibung: await mockUeberschreibung() });
  return schalterAn(stati);
}

/** Idempotenz (Q-A10): gleicher Schlüssel → gleiches Ergebnis, kein zweiter Beleg. */
function idemSpeicher() {
  if (!globalThis.__phFakturaIdem) globalThis.__phFakturaIdem = new Map();
  return globalThis.__phFakturaIdem;
}
async function einmal(schluessel, fn) {
  if (!schluessel || typeof schluessel !== "string") return fn();
  const m = idemSpeicher();
  if (m.has(schluessel)) return m.get(schluessel);
  const p = fn();
  m.set(schluessel, p);
  const r = await p;
  if (!r?.ok) m.delete(schluessel);
  if (m.size > 2000) m.delete(m.keys().next().value);
  return r;
}

// ------------------------------------------------------------ Belege lesen --

/** Pflichtangaben eines Entwurfs serverseitig prüfen (Stellen-Dialog, F-01, F-15). */
export async function pflichtangabenAction({ doctype, name, leistungGeprueft = false } = {}) {
  const k = await kontext("read");
  if (k.antwort) return k.antwort;
  if (!DOCTYPES.has(doctype) || !istName(name)) return nein("invalid", FEHLER.invalid);
  try {
    const doc = await k.client.getDoc(doctype, name);
    const [kontakt, firmen, fe] = await Promise.all([doc.kontakt ? k.client.getDoc("PH Kontakt", doc.kontakt).catch(() => ({})) : {}, k.client.getList("PH Firma", { fields: ["*"], limit: 3 }).catch(() => null), k.client.getDoc("PH Faktura Einstellungen", "PH Faktura Einstellungen").catch(() => ({}))]);
    const r = pruefePflichtangaben(doc, kontakt, firmen ? firmen[0] || {} : null, fe, { leistungGeprueft });
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

// ---------------------------------------------------------------- Stellen --

/**
 * Rechnung oder Gutschrift stellen (§ 5.1). Reihenfolge: Recht → Datumsregel (nur Leitung anderes Datum, nie vor
 * der letzten RE, nie in abgeschlossenen Monat) → Pflichtangaben → stellen() → optional senden().
 */
export async function stellenAction(e = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  const { doctype = "PH Rechnung", name, datum, leistungGeprueft = false, senden = false, empfaenger, betreff, nachricht, idempotency, uebersteuertUid = false, ausfuhrBestaetigt = false } = e;
  if (!["PH Rechnung", "PH Gutschrift"].includes(doctype) || !istName(name)) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `stellen:${doctype}:${name}:${idempotency}`, async () => {
    try {
      const { client, rolle } = k;
      const doc = await client.getDoc(doctype, name);
      if (Number(doc.docstatus) !== 0) return nein("conflict", FEHLER.schonGestellt, { name: doc.name });
      const heute = isoDatum(new Date());
      const [fe, letzte] = await Promise.all([client.getDoc("PH Faktura Einstellungen", "PH Faktura Einstellungen").catch(() => ({})), client.getList("PH Rechnung", { fields: ["name", "nummer", "datum"], filters: [["docstatus", "=", 1]], orderBy: "datum desc", limit: 1 }).catch(() => [])]);
      const d = datum && istDatum(datum) ? datum : heute;
      const dr = pruefeRechnungsdatum({ datum: d, heute, leitung: rolle.leitung, letzte: doctype === "PH Rechnung" ? letzte[0] : null, gesperrtBis: fe.gesperrt_bis || null });
      if (!dr.ok) return nein(dr.code, dr.text, { feld: "datum" });
      if (uebersteuertUid && !rolle.leitung) return nein("forbidden", FEHLER.forbidden);
      if (doctype === "PH Rechnung") {
        if ((doc.land === "CH" || doc.land === "LI") && doc.montage_im_ausland && !(await schalter(k.session, client)).ausfuhr) return nein("invalid", "Montage in der Schweiz ist keine Ausfuhr – vor dem Stellen Steuerberater fragen");
        if (doc.ust_fall === "Ausfuhr" && !ausfuhrBestaetigt && !(await schalter(k.session, client)).ausfuhr) return nein("invalid", "Ausfuhr: Bitte bestätigen, dass der Nachweis vorliegt oder nachgereicht wird.", { feld: "ausfuhr" });
        const kontakt = doc.kontakt ? await client.getDoc("PH Kontakt", doc.kontakt).catch(() => ({})) : {};
        const firmen = await client.getList("PH Firma", { fields: ["*"], limit: 3 }).catch(() => null);
        const p = pruefePflichtangaben(doc, kontakt, firmen ? firmen[0] || {} : null, fe, { leistungGeprueft, uebersteuertUid });
        if (!p.ok) return nein("invalid", FEHLER.nichtStellbar, { fehler: p.befunde.filter((b) => b.blockiert) });
        if (uebersteuertUid) await client.kommentar?.("PH Rechnung", name, "UID-Prüfung durch die Faktura-Leitung übersteuert (Vermerk).", "Comment");
      }
      if (client.modus !== "mock") await client.save(doctype, { name, datum: d, modified: doc.modified });
      const r = await methode(client, doctype, name, "stellen", { datum: d });
      const nummer = r?.nummer || r?.name || (await client.getDoc(doctype, r?.name || name).catch(() => ({}))).name;
      let gesendet = null;
      let sendeFehler = null;
      if (senden) {
        try {
          await methode(client, doctype, nummer, "senden", { empfaenger: text(empfaenger, 300), betreff: text(betreff, 200), nachricht: text(nachricht, 4000), kanal: empfaenger ? "E-Mail" : "Post" });
          gesendet = empfaenger || "Post";
        } catch (err) {
          sendeFehler = istBackofficeError(err) ? err.message : FEHLER.unavailable;
        }
      }
      neuLaden();
      const neu = await client.getDoc(doctype, nummer).catch(() => ({}));
      return { ok: true, name: nummer, nummer, brutto_cent: neu.brutto_cent ?? doc.brutto_cent, gesendet, sendeFehler, rueckzahlung: !!r?.rueckzahlung };
    } catch (err) {
      return fehler(err);
    }
  });
}

/** Nach Zeitüberschreitung: Status eines Belegs nachlesen (§ 5.1, U-07). */
export async function belegStatusAction({ doctype, name } = {}) {
  const k = await kontext("read");
  if (k.antwort) return k.antwort;
  if (!DOCTYPES.has(doctype) || !istName(name)) return nein("invalid", FEHLER.invalid);
  try {
    const d = await k.client.getDoc(doctype, name);
    return { ok: true, name: d.name, docstatus: Number(d.docstatus) || 0, status: d.status };
  } catch (err) {
    return fehler(err);
  }
}

// ---------------------------------------------------------------- Zahlung --

/** Zahlung erfassen (§ 5.2, E2): nur Überweisung (+ Stripe Link mit Schalter), Betrag ≤ offen (F-07, F-19). */
export async function zahlungErfassenAction(e = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  const { rechnung, betragCent, kanal = KANAL.ueberweisung, datum, hinweis, idempotency } = e;
  if (!istName(rechnung)) return nein("invalid", FEHLER.invalid);
  const sch = await schalter(k.session, k.client);
  if (!kanalErlaubt(kanal, sch)) return nein("invalid", ZAHLUNG.kanalUngueltig, { feld: "kanal" });
  const b = Math.round(Number(betragCent));
  if (!Number.isFinite(b) || b <= 0) return nein("invalid", FEHLER.betragNull, { feld: "betrag" });
  return einmal(idempotency && `zahlung:${rechnung}:${idempotency}`, async () => {
    try {
      const re = await k.client.getDoc("PH Rechnung", rechnung);
      if (!(Number(re.offen_cent) > 0)) return nein("conflict", ZAHLUNG.bezahlt);
      if (b > Number(re.offen_cent) && !sch.guthaben) return nein("invalid", FEHLER.betragZuHoch(cent(re.offen_cent)), { feld: "betrag" });
      const r = await methode(k.client, "PH Rechnung", rechnung, "zahlung_erfassen", { betrag_cent: b, kanal, datum: istDatum(datum) ? datum : isoDatum(new Date()), hinweis: text(hinweis, 140) });
      neuLaden();
      const neu = await k.client.getDoc("PH Rechnung", rechnung).catch(() => re);
      return { ok: true, name: rechnung, offen_cent: neu.offen_cent, status: neu.status, anzahlungVoll: neu.art === "Anzahlungsrechnung" && Number(neu.offen_cent) === 0, ...(r && typeof r === "object" ? { zahlung: r.zahlung } : {}) };
    } catch (err) {
      return fehler(err);
    }
  });
}

/** Passender offener Bankeingang zum Betrag (Hinweis im Zahlungsdialog, § 5.2). */
export async function bankTrefferAction({ betragCent } = {}) {
  const k = await kontext("read");
  if (k.antwort) return k.antwort;
  try {
    const l = await k.client.getList("PH Bankumsatz", { fields: ["name", "betrag_cent", "buchungsdatum", "status"], filters: [["status", "in", ["Offen", "Teilweise"]], ["betrag_cent", "=", Math.round(Number(betragCent) || 0)]], limit: 1 });
    return { ok: true, treffer: l[0] || null };
  } catch {
    return { ok: true, treffer: null };
  }
}

// ----------------------------------------------------------------- Senden --

/** Senden (§ 5.4): E-Mail oder Post; FAGG-Belehrung bei Vertragsort ≠ Showroom Pflicht (R-07, F-35). */
export async function sendenAction(e = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  const { doctype, name, kanal = "E-Mail", empfaenger, betreff, nachricht, belehrung = false } = e;
  if (!DOCTYPES.has(doctype) || !istName(name)) return nein("invalid", FEHLER.invalid);
  if (kanal === "E-Mail" && !/^[^\s@]+@[^\s@]+\.[^\s@]+(,\s*[^\s@]+@[^\s@]+\.[^\s@]+)*$/.test(String(empfaenger || ""))) return nein("invalid", "Bitte eine gültige E-Mail-Adresse angeben.", { feld: "empfaenger" });
  try {
    const doc = await k.client.getDoc(doctype, name);
    if (["PH Angebot", "PH Auftragsbestaetigung"].includes(doctype) && doc.vertragsort && doc.vertragsort !== "Showroom" && !belehrung) return nein("invalid", "Vertrag außerhalb des Showrooms – Belehrung ist Pflicht.", { feld: "belehrung" });
    if (doctype === "PH Rechnung" && Number(doc.docstatus) !== 1) return nein("invalid", "Nur gestellte Rechnungen lassen sich senden.");
    await methode(k.client, doctype, name, kanal === "Post" ? (doctype === "PH Mahnung" ? "senden" : "als_gesendet_markieren") : "senden", { empfaenger: text(empfaenger, 300), betreff: text(betreff, 200), nachricht: text(nachricht, 4000), kanal, belehrung: belehrung ? 1 : 0 });
    neuLaden();
    return { ok: true, an: kanal === "Post" ? "Post" : text(empfaenger, 300) };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------ Gutschrift, Korrektur --

export async function gutschriftAnlegenAction({ rechnung, art, grund, erstattung } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(rechnung) || !["Storno", "Teilgutschrift", "Wertminderung", "Kulanz"].includes(art)) return nein("invalid", FEHLER.invalid);
  if (!text(grund)) return nein("invalid", "Bitte den Grund angeben.", { feld: "grund" });
  try {
    const r = await methode(k.client, "PH Rechnung", rechnung, "gutschrift_erstellen", { art, grund: text(grund), erstattung_art: text(erstattung, 60) || "Rückzahlung" });
    neuLaden();
    return { ok: true, gutschrift: r?.gutschrift || r?.name || r };
  } catch (err) {
    return fehler(err);
  }
}

export async function erstattenAction({ gutschrift, betragCent, datum, idempotency } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istName(gutschrift)) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `erstatten:${gutschrift}:${idempotency}`, async () => {
    try {
      await methode(k.client, "PH Gutschrift", gutschrift, "erstatten", { kanal: KANAL.ueberweisung, datum: istDatum(datum) ? datum : isoDatum(new Date()), betrag_cent: Math.round(Number(betragCent) || 0) });
      neuLaden();
      return { ok: true };
    } catch (err) {
      return fehler(err);
    }
  });
}

/** Rechnung korrigieren (§ 5.13): mit Schalter korrekturMitZahlung über korrigieren(), sonst nur ohne Zahlungen. */
export async function korrigierenAction({ rechnung, grund } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(rechnung) || !text(grund)) return nein("invalid", "Bitte den Grund angeben.", { feld: "grund" });
  try {
    const re = await k.client.getDoc("PH Rechnung", rechnung);
    const sch = await schalter(k.session, k.client);
    if (!sch.korrekturMitZahlung && Number(re.bezahlt_cent) > 0) return nein("invalid", "Rechnung hat Zahlungen – Korrektur folgt mit dem Backend.");
    if (re.export_status === "exportiert" && !k.rolle.leitung) return nein("forbidden", FEHLER.forbidden);
    const r = await methode(k.client, "PH Rechnung", rechnung, "korrigieren", { grund: text(grund) });
    neuLaden();
    return { ok: true, rechnung: r?.rechnung || r?.rechnung_entwurf, gutschrift: r?.gutschrift || r?.gutschrift_entwurf };
  } catch (err) {
    return fehler(err);
  }
}

/** Korrektur stellen (§ 5.13): Pflichtangaben der neuen RE prüfen → bei Fehlern nichts stellen → GU → RE (F-36). */
export async function korrekturStellenAction({ neu, gutschrift, idempotency, leistungGeprueft = false } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(neu) || !istName(gutschrift)) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `korrektur:${neu}:${idempotency}`, async () => {
    const p = await pflichtangabenAction({ doctype: "PH Rechnung", name: neu, leistungGeprueft });
    if (!p.ok) return p;
    if (!p.ok || p.befunde.some((b) => b.blockiert)) return nein("invalid", FEHLER.nichtStellbar, { fehler: p.befunde.filter((b) => b.blockiert), schritt: 0 });
    const schritte = [];
    try {
      const g = await stellenAction({ doctype: "PH Gutschrift", name: gutschrift });
      if (!g.ok) return { ...g, schritt: 1, schritte };
      schritte.push({ titel: `Gutschrift ${g.nummer} gestellt`, ok: true });
      const r = await stellenAction({ doctype: "PH Rechnung", name: neu, leistungGeprueft });
      if (!r.ok) return { ...r, schritt: 2, schritte, gutschrift: g.nummer };
      schritte.push({ titel: `Rechnung ${r.nummer} gestellt`, ok: true });
      return { ok: true, rechnung: r.nummer, gutschrift: g.nummer, schritte };
    } catch (err) {
      return { ...fehler(err), schritte };
    }
  });
}

export async function anzahlungenAbziehenAction({ name } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name)) return nein("invalid", FEHLER.invalid);
  try {
    const r = await methode(k.client, "PH Rechnung", name, "anzahlungen_verrechnen", { speichern: 1 });
    neuLaden();
    return { ok: true, abzug_cent: r?.abzug_cent ?? null, blockiert: r?.blockiert || [] };
  } catch (err) {
    return fehler(err);
  }
}

export async function uneinbringlichAction({ rechnung, grund } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  const sch = await schalter(k.session, k.client);
  if (!sch.uneinbringlich) return nein("invalid", "Folgt – Steuerberichtigung fehlt noch");
  if (!istName(rechnung) || !text(grund)) return nein("invalid", "Bitte den Grund angeben.", { feld: "grund" });
  try {
    await methode(k.client, "PH Rechnung", rechnung, "uneinbringlich", { grund: text(grund) });
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Entwurf speichern (Autosave, Positionen, Adresse, „Empfänger ist Unternehmer“) – nur docstatus 0 (B-03). */
export async function belegSpeichernAction({ doctype, name, werte = {}, modified } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!DOCTYPES.has(doctype) || !istName(name)) return nein("invalid", FEHLER.invalid);
  try {
    const alt = await k.client.getDoc(doctype, name);
    if (!darfFeldSchreiben(doctype, alt, werte)) return nein("conflict", "Gestellte Belege nur per Gutschrift ändern.");
    const erlaubt = ["kunde_name", "firma", "strasse", "plz", "ort", "land", "uid_empfaenger", "leistungsdatum", "faellig", "einleitung", "schluss", "positionen", "empfaenger_unternehmer", "mahnsperre", "mahnsperre_grund", "notiz_intern", "titel", "gueltig_bis", "zahlungsbedingung", "vertragsort", "liefertermin_geplant", "liefer_kw", "montage_termin", "lieferadresse", "lieferhinweis", "zahlungsplan", "zugewiesen_an"];
    const daten = Object.fromEntries(Object.entries(werte).filter(([f]) => erlaubt.includes(f)));
    if (Array.isArray(daten.positionen)) {
      daten.positionen = daten.positionen.slice(0, 300).map((p, i) => ({ pos: i + 1, art: text(p.art, 30) || "Produkt", bezeichnung: text(p.bezeichnung, 140), menge: Math.max(0, Number(p.menge) || 0), einheit: text(p.einheit, 10) || "Stk", einzel_netto_cent: Math.round(Number(p.einzel_netto_cent) || 0), rabatt_promille: Math.max(0, Math.min(1000, Math.round(Number(p.rabatt_promille) || 0))), ust_satz_promille: [0, 100, 130, 190, 200].includes(Number(p.ust_satz_promille)) ? Number(p.ust_satz_promille) : 200, raum: text(p.raum, 60), alternativ: p.alternativ ? 1 : 0, produkt: text(p.produkt, 140), marke: text(p.marke, 60) }));
      Object.assign(daten, belegSummen(daten.positionen));
      daten.zahlbar_cent = daten.brutto_cent - (Number(alt.anzahlung_brutto_cent) || 0);
    }
    if (Array.isArray(daten.zahlungsplan)) {
      const pr = zahlungsplanPruefen(daten.zahlungsplan, alt.brutto_cent);
      if (!pr.ok) return nein("invalid", `Zahlungsplan ergibt ${cent(pr.summe_cent)} statt ${cent(alt.brutto_cent)}`, { feld: "zahlungsplan" });
    }
    const r = await k.client.save(doctype, { name, ...daten }, { modified: modified || alt.modified });
    neuLaden();
    return { ok: true, modified: r.modified, gespeichert: new Date().toTimeString().slice(0, 5) };
  } catch (err) {
    return fehler(err);
  }
}

// ----------------------------------------------------------------- Mahnen --

/** Mahnen (§ 5.16): je Rechnung mahnen(stufe) + senden bzw. Post-Entwurf; nie überspringen (F-31). */
export async function mahnenAction({ rechnungen = [], entwurf = false, idempotency } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  const namen = rechnungen.filter(istName).slice(0, 100);
  if (!namen.length) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `mahnen:${namen.join(",")}:${idempotency}`, async () => {
    const ergebnis = { angelegt: 0, gesendet: 0, post: 0, fehler: [] };
    for (const re of namen) {
      try {
        const doc = await k.client.getDoc("PH Rechnung", re);
        if (doc.mahnsperre) {
          ergebnis.fehler.push({ name: re, grund: "Mahnsperre" });
          continue;
        }
        const r = await methode(k.client, "PH Rechnung", re, "mahnen", { stufe: Math.min((Number(doc.mahnstufe) || 0) + 1, 3) });
        ergebnis.angelegt++;
        const ma = r?.mahnung || r?.name;
        if (!entwurf && ma) {
          const kontakt = doc.kontakt ? await k.client.getDoc("PH Kontakt", doc.kontakt).catch(() => ({})) : {};
          const mail = doc.email || kontakt.email;
          if (mail) {
            await methode(k.client, "PH Mahnung", ma, "senden", { empfaenger: mail, kanal: "E-Mail" });
            ergebnis.gesendet++;
          } else ergebnis.post++;
        }
      } catch (err) {
        ergebnis.fehler.push({ name: re, grund: istBackofficeError(err) ? err.message : FEHLER.unavailable });
      }
    }
    neuLaden();
    return { ok: ergebnis.fehler.length < namen.length, ...ergebnis };
  });
}

export async function mahnungStatusAction({ name, aktion } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name) || !["stornieren", "senden"].includes(aktion)) return nein("invalid", FEHLER.invalid);
  try {
    await methode(k.client, "PH Mahnung", name, aktion, { kanal: "Post" });
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// -------------------------------------------- Verzögerte Commits (planen) --

/** Plant einen verzögerten Commit nach Rechteprüfung (E3, Q-C3). */
async function plane(k, action, args, objekt, titel) {
  try {
    const r = await planeCommit(k.session, { action, args, schluessel: `${action}:${objekt.name}`, objekt, titel });
    return { ok: true, ...r };
  } catch (err) {
    return fehler(err);
  }
}

export async function bankZuordnenPlanen({ umsatz, belegDoctype, beleg, betragCent } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istName(umsatz) || !istName(beleg) || !["PH Rechnung", "PH Eingangsrechnung", "PH Gutschrift"].includes(belegDoctype)) return nein("invalid", FEHLER.invalid);
  try {
    const bu = await k.client.getDoc("PH Bankumsatz", umsatz);
    if (bu.status === "Zugeordnet") return nein("conflict", `Bereits zugeordnet (${bu.modified_by || "jemand anderes"}, ${String(bu.modified || "").slice(11, 16)})`, { beleg: (bu.zuordnungen || [])[0]?.beleg });
    const rest = Math.abs(Number(bu.betrag_cent) || 0) - (Number(bu.zugeordnet_cent) || 0);
    const b = Math.round(Number(betragCent) || rest);
    if (b <= 0 || b > rest) return nein("invalid", "Betrag passt nicht zum Umsatz.", { feld: "betrag" });
    if (belegDoctype === "PH Rechnung") {
      const re = await k.client.getDoc("PH Rechnung", beleg);
      if (b > Number(re.offen_cent) && !(await schalter(k.session, k.client)).guthaben) return nein("invalid", FEHLER.betragZuHoch(cent(re.offen_cent)), { feld: "betrag" });
    }
  } catch (err) {
    return fehler(err);
  }
  return plane(k, "faktura.bank-zuordnen", { umsatz, belegDoctype, beleg, betragCent: Math.round(Number(betragCent) || 0) }, { doctype: "PH Bankumsatz", name: umsatz, titel: `Zuordnung ${beleg}` }, `Zuordnung ${beleg}`);
}

/** „Sichere zuordnen (n)“: Rückfrage im Client, danach sofort (§ 2.3). */
export async function bankSicherZuordnenAction({ umsaetze = [] } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  const ergebnis = { zugeordnet: 0, fehler: [] };
  for (const u of umsaetze.filter(istName).slice(0, 100)) {
    try {
      const bu = await k.client.getDoc("PH Bankumsatz", u);
      if (Number(bu.vorschlag_sicherheit) < 100 || bu.vorschlag_doctype !== "PH Rechnung" || bu.status !== "Offen") {
        ergebnis.fehler.push({ name: u, grund: "kein sicherer Vorschlag" });
        continue;
      }
      await methode(k.client, "PH Bankumsatz", u, "zuordnen", { beleg_doctype: "PH Rechnung", beleg: bu.vorschlag_beleg });
      ergebnis.zugeordnet++;
    } catch (err) {
      ergebnis.fehler.push({ name: u, grund: istBackofficeError(err) ? err.message : FEHLER.unavailable });
    }
  }
  neuLaden();
  return { ok: true, ...ergebnis };
}

/** Ignorieren (Grund Pflicht) – echte Gegenaktion „Wieder öffnen“ ist das Undo (§ 2.3). */
export async function bankIgnorierenAction({ umsatz, grund } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istName(umsatz) || !text(grund)) return nein("invalid", "Bitte einen Grund wählen.", { feld: "grund" });
  try {
    await methode(k.client, "PH Bankumsatz", umsatz, "ignorieren", { grund: text(grund, 140) });
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function bankWiederOeffnenAction({ umsatz } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istName(umsatz)) return nein("invalid", FEHLER.invalid);
  try {
    await methode(k.client, "PH Bankumsatz", umsatz, "wieder_oeffnen", {});
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** AB-Nummer erkannt (B-11, F-34): Anzahlungsrechnung stellen und zuordnen – idempotent je Schritt. */
export async function bankAnzahlungZuordnenAction({ umsatz, auftrag, zeile = 1, idempotency } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istName(umsatz) || !istName(auftrag)) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `bank-anzahlung:${umsatz}:${idempotency}`, async () => {
    const schritte = [];
    try {
      const ab = await k.client.getDoc("PH Auftragsbestaetigung", auftrag);
      const z = (ab.zahlungsplan || [])[Math.max(0, Number(zeile) - 1)];
      let entwurf = z?.rechnung || null;
      if (!entwurf) {
        const r = await methode(k.client, "PH Auftragsbestaetigung", auftrag, "anzahlungsrechnung_erstellen", { zeile: Number(zeile) || 1 });
        entwurf = r?.rechnung || r?.name || r;
      }
      schritte.push({ titel: "Anzahlungsrechnung angelegt", ok: true });
      let nummer = entwurf;
      const re = await k.client.getDoc("PH Rechnung", entwurf);
      if (Number(re.docstatus) === 0) {
        const s = await stellenAction({ doctype: "PH Rechnung", name: entwurf, leistungGeprueft: true });
        if (!s.ok) return { ...s, schritte };
        nummer = s.nummer;
      }
      schritte.push({ titel: `Anzahlungsrechnung ${nummer} gestellt`, ok: true });
      await methode(k.client, "PH Bankumsatz", umsatz, "zuordnen", { beleg_doctype: "PH Rechnung", beleg: nummer });
      schritte.push({ titel: `Umsatz ${nummer} zugeordnet`, ok: true });
      neuLaden();
      return { ok: true, rechnung: nummer, schritte };
    } catch (err) {
      return { ...fehler(err), schritte };
    }
  });
}

/** Kontoauszug importieren (§ 3.5): Kontoprüfung (IBAN/Währung) vor dem Import, Doppelimport erkannt (F-08, F-30). */
export async function bankImportAction(formData) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  const datei = formData?.get?.("datei");
  const konto = String(formData?.get?.("konto") || "");
  if (!datei || typeof datei === "string" || !datei.size) return nein("invalid", "Bitte eine Kontoauszug-Datei wählen.", { feld: "datei" });
  if (datei.size > 10 * 1024 * 1024) return nein("invalid", "Die Datei ist größer als 10 MB.", { feld: "datei" });
  try {
    const inhalt = await datei.text();
    if (!/<Document[\s>]|BkToCstmrStmt/.test(inhalt)) return nein("invalid", "Die Datei konnte nicht gelesen werden: kein Kontoauszug im Format CAMT.053", { feld: "datei", art: "unlesbar" });
    const ccy = /Ccy="([A-Z]{3})"/.exec(inhalt)?.[1] || "EUR";
    if (ccy !== "EUR") return nein("invalid", "Konto in CHF – Fremdwährung noch nicht freigegeben", { art: "waehrung" });
    const iban = (/<IBAN>([A-Z0-9 ]+)<\/IBAN>/.exec(inhalt)?.[1] || "").replace(/\s/g, "");
    const kontoDoc = konto ? await k.client.getDoc("PH Bankkonto", konto).catch(() => null) : null;
    if (iban && kontoDoc?.iban && kontoDoc.iban.replace(/\s/g, "") !== iban) return nein("invalid", `Die Datei gehört zum Konto ${iban.slice(0, 4)} … ${iban.slice(-4)}, gewählt ist ${konto} (… ${kontoDoc.iban.replace(/\s/g, "").slice(-4)}).`, { art: "konto" });
    const ref = /<MsgId>([^<]+)<\/MsgId>/.exec(inhalt)?.[1] || datei.name;
    const vorhanden = await k.client.getList("PH Bankimport", { fields: ["name", "camt_ref", "titel"], limit: 200 }).catch(() => []);
    const doppelt = vorhanden.find((x) => x.camt_ref === ref || x.titel === datei.name);
    if (doppelt) return nein("conflict", "Diese Datei wurde bereits importiert", { art: "doppelt", import: doppelt.name });
    const eintraege = (inhalt.match(/<Ntry>/g) || []).length;
    const imp = await neuerBeleg(k.client, "PH Bankimport", { titel: datei.name, konto, status: "Neu", camt_ref: ref, importiert_am: isoDatum(new Date()) });
    const r = k.client.modus === "mock" ? { anzahl: eintraege, neu: eintraege, doppelt: 0, vorschlag: 0, zugeordnet: 0 } : await methode(k.client, "PH Bankimport", imp.name, "importieren", { auto_zuordnen: 0 });
    neuLaden();
    return { ok: true, import: imp.name, anzahl: r?.anzahl ?? eintraege, neu: r?.neu ?? r?.anzahl_neu ?? eintraege, doppelt: r?.doppelt ?? 0, vorschlag: r?.vorschlag ?? 0, zugeordnet: r?.zugeordnet ?? 0 };
  } catch (err) {
    return fehler(err);
  }
}

// ---------------------------------------------------------- Eingangsrechnung --

export async function erFreigebenPlanen({ name } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istName(name)) return nein("invalid", FEHLER.invalid);
  try {
    const er = await k.client.getDoc("PH Eingangsrechnung", name);
    if (!["Erfasst", "Sachlich geprueft"].includes(er.status)) return nein("conflict", "Status erlaubt keine Freigabe.");
    if (er.zuordnung_status === "Offen" && er.belegart !== "Gutschrift" && er.zuordnung_modus !== undefined) return nein("invalid", "Freigabe erst mit vollständiger Kostenzuordnung", { feld: "kosten" });
  } catch (err) {
    return fehler(err);
  }
  return plane(k, "faktura.er-freigeben", { name }, { doctype: "PH Eingangsrechnung", name, titel: `Freigabe ${name}` }, `Freigabe ${name}`);
}

export async function erAktionAction({ name, aktion, vermerk, grund, datum, betragCent } = {}) {
  const k = await kontext(["ablehnen-leitung", "als_bezahlt_buchen"].includes(aktion) ? "leitung" : "write");
  if (k.antwort) return k.antwort;
  if (!istName(name) || !["pruefen", "ablehnen", "zurueck_an_erfassung", "als_bezahlt_buchen"].includes(aktion)) return nein("invalid", FEHLER.invalid);
  try {
    const er = await k.client.getDoc("PH Eingangsrechnung", name);
    if (er.export_status === "exportiert" && ["ablehnen", "zurueck_an_erfassung"].includes(aktion)) return nein("conflict", `Exportiert in ${er.export_lauf} – Korrektur nur über Lieferanten-Gutschrift`);
    if (aktion === "ablehnen" && !text(grund)) return nein("invalid", "Bitte den Grund angeben.", { feld: "grund" });
    if (aktion === "ablehnen" && er.status === "Sachlich geprueft" && !k.rolle.leitung) return nein("forbidden", FEHLER.forbidden);
    await methode(k.client, "PH Eingangsrechnung", name, aktion, { vermerk: text(vermerk), grund: text(grund), datum: istDatum(datum) ? datum : isoDatum(new Date()), kanal: KANAL.ueberweisung, betrag_cent: Math.round(Number(betragCent) || er.zahlbetrag_cent || 0) });
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Neue Eingangsrechnung (§ 3.6 Neu-Sheet): Doppelerfassung live, Brutto = Netto + USt, nur EUR. */
export async function erAnlegenAction(formData) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  const g = (f) => String(formData?.get?.(f) ?? "").trim();
  const lieferant = text(g("lieferant_name"), 140);
  const rnr = text(g("rechnungsnummer_lieferant"), 60);
  const netto = Math.round(Number(g("netto_cent")) || 0);
  const ust = Math.round(Number(g("ust_cent")) || 0);
  const brutto = Math.round(Number(g("brutto_cent")) || 0);
  const fehlerListe = [];
  if (!lieferant) fehlerListe.push({ feld: "lieferant_name", text: "Lieferant fehlt" });
  if (!rnr) fehlerListe.push({ feld: "rechnungsnummer_lieferant", text: "Rechnungsnummer fehlt" });
  if (!istDatum(g("datum"))) fehlerListe.push({ feld: "datum", text: "Datum im Format TT.MM.JJJJ" });
  if (netto + ust !== brutto) fehlerListe.push({ feld: "brutto_cent", text: "Brutto ist nicht Netto plus USt" });
  if (g("fremdwaehrung") === "1") fehlerListe.push({ feld: "fremdwaehrung", text: "Fremdwährung noch nicht freigegeben – Beleg an Steuerberater" });
  if (fehlerListe.length) return nein("invalid", fehlerListe[0].text, { fehler: fehlerListe });
  try {
    const doppelt = await k.client.getList("PH Eingangsrechnung", { fields: ["name"], filters: [["lieferant_name", "=", lieferant], ["rechnungsnummer_lieferant", "=", rnr]], limit: 1 }).catch(() => []);
    if (doppelt.length) return nein("conflict", `Rechnung ${rnr} von ${lieferant} ist bereits als ${doppelt[0].name} erfasst`, { feld: "rechnungsnummer_lieferant", name: doppelt[0].name });
    const skonto = Math.round(Number(g("skonto_promille")) || 0);
    const werte = { titel: `${lieferant} · ${rnr}`, status: "Erfasst", workflow_state: "PH Erfasst", lieferant_name: lieferant, rechnungsnummer_lieferant: rnr, belegart: "Rechnung", datum: g("datum"), eingang: isoDatum(new Date()), faellig: istDatum(g("faellig")) ? g("faellig") : "", netto_cent: netto, ust_cent: ust, brutto_cent: brutto, vorsteuer_cent: ust, ust_fall: text(g("ust_fall"), 60) || "Vorsteuer AT", skonto_promille: skonto, skonto_bis: istDatum(g("skonto_bis")) ? g("skonto_bis") : "", skonto_cent: Math.round((brutto * skonto) / 1000), zahlbetrag_cent: brutto - Math.round((brutto * skonto) / 1000), projekt: text(g("projekt"), 140), herstellerbestellung: text(g("herstellerbestellung"), 140), iban_lieferant: text(g("iban"), 40), zahlungsreferenz: text(g("referenz"), 140), notiz: text(g("notiz"), 500), zuordnung_modus: "", zuordnung_status: "Offen", zuordnung: [], export_status: "offen" };
    const er = await neuerBeleg(k.client, "PH Eingangsrechnung", werte);
    const datei = formData.get("datei");
    if (datei && typeof datei !== "string" && datei.size) {
      const inhalt = new Uint8Array(await datei.arrayBuffer());
      await k.client.uploadFile({ doctype: "PH Eingangsrechnung", name: er.name, dateiname: datei.name, inhalt, privat: true }).catch(() => null);
    }
    if (g("pruefen") === "1") await methode(k.client, "PH Eingangsrechnung", er.name, "pruefen", {});
    neuLaden();
    return { ok: true, name: er.name };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Kostenzuordnung speichern (vor Freigabe) bzw. umbuchen (nach Freigabe, Leitung, Grund Pflicht).
 * Prüft mit dem gleichen Rechenwerk wie der Server (kostenzuordnung.js).
 */
export async function kostenSpeichernAction({ name, modus, zeilen = [], grund, projekt, kostenart } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name) || !KZ.MODI.includes(modus)) return nein("invalid", "Bitte einen Zuordnungsmodus wählen.", { feld: "modus" });
  const sauber = (Array.isArray(zeilen) ? zeilen : []).slice(0, 100).map((z) => ({ projekt: text(z.projekt, 140), kostenart: text(z.kostenart, 60), prozent: Math.max(0, Math.min(100, Number(z.prozent) || 0)), betrag_cent: Math.round(Number(z.betrag_cent) || 0), belegposition: Math.round(Number(z.belegposition) || 0) || undefined, bemerkung: text(z.bemerkung, 140), bezug_doctype: text(z.bezug_doctype, 60), bezug_name: text(z.bezug_name, 140) }));
  try {
    const er = await k.client.getDoc("PH Eingangsrechnung", name);
    const nachFreigabe = ["Freigegeben", "Bezahlt"].includes(er.status);
    if (nachFreigabe) {
      const p = KZ.pruefeUmbuchen({ leitung: k.rolle.leitung, grund });
      if (!p.ok) return nein(p.code, p.text, { feld: "grund" });
    }
    const r = KZ.berechne({ modus, netto_cent: er.netto_cent, zeilen: sauber, positionen: er.positionen || [], projekt: projekt || er.projekt, kostenart: kostenart || er.kostenart });
    if (r.fehler.length) return nein("invalid", r.fehler[0], { fehler: r.fehler.map((t) => ({ text: t })) });
    if (k.client.modus === "mock" || nachFreigabe) await methode(k.client, "PH Eingangsrechnung", name, "zuordnung_umbuchen", { modus, zeilen: r.zeilen, grund: nachFreigabe ? text(grund) : "", projekt: projekt || "", kostenart: kostenart || "" });
    else await k.client.save("PH Eingangsrechnung", { name, zuordnung_modus: modus, zuordnung: r.zeilen, projekt: modus === "Ganz einem Projekt" ? r.zeilen[0]?.projekt : er.projekt, kostenart: r.zeilen[0]?.kostenart || "", modified: er.modified });
    neuLaden();
    return { ok: true, status: r.status };
  } catch (err) {
    return fehler(err);
  }
}

/** Vorschlag aus dem Bezug (Herstellerbestellung → Ware usw.); Frappe-Methode, Mock aus Kopf-Projekt. */
export async function kostenVorschlagAction({ name } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name)) return nein("invalid", FEHLER.invalid);
  try {
    const er = await k.client.getDoc("PH Eingangsrechnung", name);
    if (k.client.modus !== "mock") {
      const zeilen = await methode(k.client, "PH Eingangsrechnung", name, "zuordnung_vorschlagen", {});
      return { ok: true, zeilen: Array.isArray(zeilen) ? zeilen : [] };
    }
    if (er.herstellerbestellung && er.projekt) return { ok: true, modus: "Ganz einem Projekt", zeilen: [{ projekt: er.projekt, kostenart: "Ware", betrag_cent: er.netto_cent, bezug_doctype: "PH Herstellerbestellung", bezug_name: er.herstellerbestellung, prozent: 0 }] };
    if (/spedition/i.test(er.lieferant_name || "")) return { ok: true, modus: "Ganz einem Projekt", zeilen: [{ projekt: er.projekt || "", kostenart: "Fracht", betrag_cent: er.netto_cent, prozent: 0 }] };
    if (er.projekt) return { ok: true, modus: "Ganz einem Projekt", zeilen: [{ projekt: er.projekt, kostenart: er.kostenart || "Sonstiges", betrag_cent: er.netto_cent, prozent: 0 }] };
    return { ok: true, zeilen: [] };
  } catch (err) {
    return fehler(err);
  }
}

export async function zahllaufVormerkenPlanen({ namen = [], wert = true } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  const n = namen.filter(istName).slice(0, 100);
  if (!n.length) return nein("invalid", FEHLER.invalid);
  return plane(k, "faktura.zahllauf", { namen: n, wert: !!wert }, { doctype: "PH Eingangsrechnung", name: n[0], titel: `${n.length} Eingangsrechnungen` }, `Zahllauf ${n.length}`);
}

export async function zahllaufBuchenAction({ namen = [], datum, idempotency } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  const n = namen.filter(istName).slice(0, 100);
  if (!n.length) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `zahllauf:${n.join(",")}:${idempotency}`, async () => {
    let gebucht = 0;
    const fehlerListe = [];
    for (const name of n) {
      try {
        const er = await k.client.getDoc("PH Eingangsrechnung", name);
        await methode(k.client, "PH Eingangsrechnung", name, "als_bezahlt_buchen", { datum: istDatum(datum) ? datum : isoDatum(new Date()), kanal: KANAL.ueberweisung, betrag_cent: er.zahlbetrag_cent });
        gebucht++;
      } catch (err) {
        fehlerListe.push({ name, grund: istBackofficeError(err) ? err.message : FEHLER.unavailable });
      }
    }
    neuLaden();
    return { ok: gebucht > 0, gebucht, fehler: fehlerListe };
  });
}

// -------------------------------------------------- Angebot und Auftrag --

export async function angebotAnlegenAction({ kontakt, projekt, titel, zahlungsbedingung, vertragsort = "Showroom" } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(kontakt)) return nein("invalid", "Bitte einen Kunden wählen.", { feld: "kontakt" });
  if (!text(titel)) return nein("invalid", "Bitte einen Titel angeben.", { feld: "titel" });
  if (!["Showroom", "Beim Kunden", "Fernabsatz"].includes(vertragsort)) return nein("invalid", FEHLER.invalid);
  try {
    const kt = await k.client.getDoc("PH Kontakt", kontakt);
    const fe = await k.client.getDoc("PH Faktura Einstellungen", "PH Faktura Einstellungen").catch(() => ({}));
    const heute = isoDatum(new Date());
    const tage = Number(fe.angebot_gueltig_tage) || 30;
    const bis = new Date(Date.now() + tage * 86400000).toISOString().slice(0, 10);
    const ort = String(kt.ort || "").replace(/^\d+\s*/, "");
    const plz = (/^(\d{4,5})/.exec(kt.ort || "") || [])[1] || kt.plz || "";
    const doc = await neuerBeleg(k.client, "PH Angebot", { titel: text(titel, 140), status: "Entwurf", workflow_state: "PH Entwurf", kontakt, kunde_name: kt.firma || [kt.vorname, kt.nachname].filter(Boolean).join(" ") || kt.titel, projekt: istName(projekt) ? projekt : "", datum: heute, gueltig_bis: bis, version: 1, vertragsort, zahlungsbedingung: text(zahlungsbedingung, 140) || fe.standard_zahlungsbedingung || "", firma: kt.firma || "", strasse: kt.strasse || "", plz, ort, land: kt.land || "AT", uid_empfaenger: kt.uid || "", ust_fall: "Steuerpflichtig AT", waehrung: "EUR", sprache: "de", zugewiesen_an: k.session.user, positionen: [], email: kt.email || "" });
    neuLaden();
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function annehmenAction({ name, annahmeArt, datum, unterschrift, papier = false } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name)) return nein("invalid", FEHLER.invalid);
  if (!["Unterschrift Showroom", "E-Mail", "Portal", "Telefon", "Brief"].includes(annahmeArt)) return nein("invalid", "Bitte wählen, worüber die Annahme kam.", { feld: "annahme" });
  if (annahmeArt === "Unterschrift Showroom" && !unterschrift && !papier) return nein("invalid", "Bitte unterschreiben lassen oder Papier-Unterschrift bestätigen.", { feld: "unterschrift" });
  try {
    await methode(k.client, "PH Angebot", name, "annehmen", { unterschrift: typeof unterschrift === "string" ? unterschrift.slice(0, 200000) : "", annahme_art: annahmeArt, datum: istDatum(datum) ? datum : isoDatum(new Date()) });
    if (k.client.modus !== "mock") await k.client.kommentar?.("PH Angebot", name, `Annahme über ${annahmeArt}${papier ? " (Papier-Unterschrift)" : ""}`, "Comment");
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function angebotAblehnenPlanen({ name, grund } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name) || !["Preis", "Mitbewerber", "Kein Bedarf", "Zeitplan", "Keine Rueckmeldung", "Sonstiges"].includes(grund)) return nein("invalid", "Bitte einen Grund wählen.", { feld: "grund" });
  return plane(k, "faktura.angebot-ablehnen", { name, grund }, { doctype: "PH Angebot", name, titel: `Ablehnen ${name}` }, `${name} abgelehnt`);
}

export async function neueVersionAction({ name } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name)) return nein("invalid", FEHLER.invalid);
  try {
    const r = await methode(k.client, "PH Angebot", name, "neue_version", {});
    neuLaden();
    return { ok: true, name: r?.name || r };
  } catch (err) {
    return fehler(err);
  }
}

export async function auftragUebernehmenAction({ angebot, alternativen = [], zahlungsplan = [], liefertermin, montage = false, lieferadresse, idempotency } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(angebot)) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `auftrag:${angebot}:${idempotency}`, async () => {
    try {
      const an = await k.client.getDoc("PH Angebot", angebot);
      const plan = zahlungsplan.slice(0, 6).map((z) => ({ art: ["Anzahlung", "Teilzahlung", "Schlusszahlung"].includes(z.art) ? z.art : "Teilzahlung", prozent: Math.round(Number(z.prozent) || 0), betrag_cent: Math.round(Number(z.betrag_cent) || 0), faellig_bei: ["Auftrag", "Lieferung", "Montage", "Datum"].includes(z.faellig_bei) ? z.faellig_bei : "Lieferung" }));
      const posAlt = (an.positionen || []).filter((p) => p.alternativ && alternativen.includes(p.pos));
      const brutto = belegSummen((an.positionen || []).map((p) => (posAlt.includes(p) ? { ...p, alternativ: 0 } : p))).brutto_cent;
      const pr = zahlungsplanPruefen(plan, brutto);
      if (plan.length && !pr.ok) return nein("invalid", `Zahlungsplan ergibt ${cent(pr.summe_cent)} statt ${cent(brutto)}`, { feld: "zahlungsplan" });
      const r = await methode(k.client, "PH Angebot", angebot, "auftrag_erstellen", { alternativen: posAlt.map((p) => p.pos), zahlungsplan: plan, liefertermin: istDatum(liefertermin) ? liefertermin : "", montage: !!montage, lieferadresse: text(lieferadresse, 300) });
      neuLaden();
      return { ok: true, auftrag: r?.auftrag || r?.name || r, anzahlungsrechnung: r?.anzahlungsrechnung || null };
    } catch (err) {
      return fehler(err);
    }
  });
}

/** Anzahlung anfordern (§ 5.3): Anzahlungsrechnung aus Zahlungsplan-Zeile, danach Stellen-Fakten im selben Dialog. */
export async function anzahlungAnfordernAction({ auftrag, zeile = 1 } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(auftrag)) return nein("invalid", FEHLER.invalid);
  try {
    const ab = await k.client.getDoc("PH Auftragsbestaetigung", auftrag);
    const z = (ab.zahlungsplan || [])[Math.max(0, Number(zeile) - 1)];
    if (z?.rechnung) return { ok: true, rechnung: z.rechnung, vorhanden: true };
    const r = await methode(k.client, "PH Auftragsbestaetigung", auftrag, "anzahlungsrechnung_erstellen", { zeile: Number(zeile) || 1 });
    neuLaden();
    return { ok: true, rechnung: r?.rechnung || r?.name || r };
  } catch (err) {
    return fehler(err);
  }
}

export async function abrechnenEntwurfAction({ auftrag, art, mengen = {} } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(auftrag) || !["Teilrechnung", "Schlussrechnung"].includes(art)) return nein("invalid", FEHLER.invalid);
  try {
    const m = Object.fromEntries(Object.entries(mengen || {}).map(([p, v]) => [p, Math.max(0, Math.floor(Number(v) || 0))]));
    const r = await methode(k.client, "PH Auftragsbestaetigung", auftrag, "rechnung_erstellen", { art, mengen: m });
    neuLaden();
    return { ok: true, rechnung: r?.rechnung || r?.name || r };
  } catch (err) {
    return fehler(err);
  }
}

export async function auftragAktionAction({ name, aktion, grund, mengen, vollstaendig } = {}) {
  const leitungNoetig = aktion === "stornieren";
  const k = await kontext(leitungNoetig ? "leitung" : "write");
  if (k.antwort) return k.antwort;
  if (!istName(name) || !["herstellerbestellungen_erzeugen", "lieferung_melden", "stornieren"].includes(aktion)) return nein("invalid", FEHLER.invalid);
  if (aktion === "stornieren" && !text(grund)) return nein("invalid", "Bitte den Grund angeben.", { feld: "grund" });
  try {
    await methode(k.client, "PH Auftragsbestaetigung", name, aktion, { grund: text(grund), mengen: mengen || {}, vollstaendig: vollstaendig ? 1 : 0 });
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Rücktritt (FAGG) / Storno ohne P-13 als Teilschritte (§ 5.14): (1) Storno-Gutschrift je gestellter Rechnung mit
 * Rückzahlung → (2) AB stornieren → (3) Aufgabe „Rückzahlung“ an die Leitung → (4) Vermerk. Idempotent je Schritt.
 */
export async function ruecktrittAction({ auftrag, datum, kanal, kulanz = false, idempotency } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(auftrag)) return nein("invalid", FEHLER.invalid);
  return einmal(idempotency && `ruecktritt:${auftrag}:${idempotency}`, async () => {
    const schritte = [];
    try {
      const re = (await k.client.getList("PH Rechnung", { fields: ["name", "docstatus", "status", "art", "brutto_cent", "bezahlt_cent"], filters: [["auftrag", "=", auftrag]], limit: 50 })).filter((r) => Number(r.docstatus) === 1 && !["Storniert", "Uneinbringlich"].includes(r.status));
      let rueck = 0;
      for (const r of re) {
        const g = await methode(k.client, "PH Rechnung", r.name, "gutschrift_erstellen", { art: "Storno", grund: kulanz ? "Kulanz-Storno" : "Rücktritt (FAGG)", erstattung_art: "Rückzahlung" });
        const s = await stellenAction({ doctype: "PH Gutschrift", name: g?.gutschrift || g?.name });
        if (!s.ok) return { ...s, schritt: 1, schritte };
        rueck += Number(r.bezahlt_cent) || 0;
        schritte.push({ titel: `Storno-Gutschrift ${s.nummer} zu ${r.name}`, ok: true });
      }
      await methode(k.client, "PH Auftragsbestaetigung", auftrag, "stornieren", { grund: kulanz ? "Kulanz-Storno" : "Rücktritt FAGG" });
      schritte.push({ titel: `Auftrag ${auftrag} storniert`, ok: true });
      if (rueck > 0) {
        try {
          await k.client.insert("PH Aufgabe", { titel: `Rückzahlung ${cent(rueck)} zu ${auftrag} bis ${new Date(Date.now() + 14 * 86400000).toLocaleDateString("de-AT")}`, status: "Offen", prioritaet: "Hoch", faellig: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), bezug_doctype: "PH Auftragsbestaetigung", bezug_name: auftrag, kennung: `faktura:rueckzahlung:${auftrag}` });
        } catch {
          /* Aufgabe optional – Vermerk folgt */
        }
        schritte.push({ titel: `Aufgabe „Rückzahlung“ an die Faktura-Leitung`, ok: true });
      }
      await k.client.kommentar?.("PH Auftragsbestaetigung", auftrag, `${kulanz ? "Kulanz-Storno" : "Rücktritt"} am ${istDatum(datum) ? datum : isoDatum(new Date())} über ${text(kanal, 40) || "E-Mail"}`, "Comment");
      schritte.push({ titel: "Vermerk mit Datum und Kanal", ok: true });
      neuLaden();
      return { ok: true, schritte, rueckzahlung_cent: rueck };
    } catch (err) {
      return { ...fehler(err), schritte };
    }
  });
}

// ----------------------------------------------------- Export, UVA, Abschluss --

export async function exportErzeugenAction({ von, bis, format, belegarten = "Alle", nurNeue = true, idempotency } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istDatum(von) || !istDatum(bis) || von > bis) return nein("invalid", "Bitte einen gültigen Zeitraum wählen.", { feld: "zeitraum" });
  if (!["BMD CSV", "RZL CSV", "DATEV Buchungsstapel", "CSV generisch"].includes(format)) return nein("invalid", FEHLER.invalid, { feld: "format" });
  return einmal(idempotency && `export:${von}:${bis}:${idempotency}`, async () => {
    let lauf = null;
    try {
      lauf = await neuerBeleg(k.client, "PH Export Lauf", { titel: `Export ${von} bis ${bis}`, status: "Entwurf", format, belegarten, zeitraum_von: von, zeitraum_bis: bis, nur_neue: nurNeue ? 1 : 0, belege: [] });
      await methode(k.client, "PH Export Lauf", lauf.name, "erzeugen", {});
      const neu = await k.client.getDoc("PH Export Lauf", lauf.name);
      neuLaden();
      return { ok: true, name: lauf.name, anzahl: neu.anzahl || 0 };
    } catch (err) {
      neuLaden();
      return { ...fehler(err), name: lauf?.name, abbruch: true };
    }
  });
}

export async function exportStatusAction({ name, aktion, an, datum } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!istName(name) || !["erzeugen", "als_uebergeben", "bestaetigen", "verwerfen"].includes(aktion)) return nein("invalid", FEHLER.invalid);
  try {
    const ex = await k.client.getDoc("PH Export Lauf", name);
    if (aktion === "verwerfen" && ex.status !== "Erzeugt") return nein("invalid", "Nur erzeugte Läufe lassen sich verwerfen.");
    await methode(k.client, "PH Export Lauf", name, aktion, { an: text(an, 140) || "Kanzlei", datum: istDatum(datum) ? datum : isoDatum(new Date()) });
    neuLaden();
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function uvaAction({ name, monat, aktion } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!["berechnen", "uebergeben"].includes(aktion)) return nein("invalid", FEHLER.invalid);
  try {
    let n = istName(name) ? name : null;
    if (!n) {
      if (!/^\d{4}-\d{2}$/.test(String(monat || ""))) return nein("invalid", FEHLER.invalid);
      const [j, m] = monat.split("-").map(Number);
      const bis = new Date(Date.UTC(j, m, 0)).toISOString().slice(0, 10);
      const doc = await neuerBeleg(k.client, "PH UVA Auswertung", { titel: `UVA ${monat}`, status: "Entwurf", zeitraum_art: "Monat", jahr: j, periode: m, zeitraum_von: `${monat}-01`, zeitraum_bis: bis, zeilen: [] });
      n = doc.name;
    }
    await methode(k.client, "PH UVA Auswertung", n, aktion === "berechnen" ? "berechnen" : "als_uebergeben", {});
    neuLaden();
    return { ok: true, name: n };
  } catch (err) {
    return fehler(err);
  }
}

export async function monatAbschliessenAction({ monat, bestaetigt = false } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  const sch = await schalter(k.session, k.client);
  if (!sch.monatsabschluss) return nein("invalid", "Sperre folgt mit dem Backend (gesperrt_bis)");
  if (!/^\d{4}-\d{2}$/.test(String(monat || "")) || !bestaetigt) return nein("invalid", FEHLER.invalid);
  try {
    const [j, m] = monat.split("-").map(Number);
    const bis = new Date(Date.UTC(j, m, 0)).toISOString().slice(0, 10);
    await k.client.save("PH Faktura Einstellungen", { name: "PH Faktura Einstellungen", gesperrt_bis: bis });
    neuLaden();
    return { ok: true, gesperrt_bis: bis };
  } catch (err) {
    return fehler(err);
  }
}

export async function kettePruefenAction() {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  try {
    if (k.client.modus === "mock") {
      const n = await k.client.count("PH Buchungsjournal");
      return { ok: true, geprueft: n, bruch: null };
    }
    const r = await api(k.client, "ph_faktura.api.journal_kette_pruefen", {}, null);
    if (!r) return nein("unavailable", FEHLER.unavailable);
    return { ok: true, geprueft: r.geprueft ?? r.anzahl ?? 0, bruch: r.bruch || r.erste_bruchstelle || null };
  } catch (err) {
    return fehler(err);
  }
}

/** CSV einer Faktura-Liste (nur Leitung, protokolliert ohne Werte – E15, F-32). */
export async function listenexportAction({ liste, zeilen = [] } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  if (!/^[a-z-]{2,30}$/.test(String(liste || ""))) return nein("invalid", FEHLER.invalid);
  const kopf = Object.keys(zeilen[0] || {});
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [kopf.map(esc).join(";"), ...zeilen.slice(0, 5000).map((z) => kopf.map((f) => esc(z[f])).join(";"))].join("\r\n");
  console.info("[faktura] Listenexport", liste, zeilen.length, "Zeilen");
  return { ok: true, csv, dateiname: `faktura-${liste}-${isoDatum(new Date())}.csv` };
}

export async function zahlungsbedingungSpeichernAction({ name, titel, anzahlung_prozent, teilzahlung_prozent, zieltage, skonto_promille, skonto_tage, text: txt, standard } = {}) {
  const k = await kontext("leitung");
  if (k.antwort) return k.antwort;
  const a = Math.round(Number(anzahlung_prozent) || 0);
  const t = Math.round(Number(teilzahlung_prozent) || 0);
  if (a + t > 100) return nein("invalid", "Anzahlung und Teilzahlung dürfen 100 % nicht übersteigen", { feld: "anzahlung_prozent" });
  if (!text(titel)) return nein("invalid", "Bitte einen Titel angeben.", { feld: "titel" });
  try {
    const werte = { titel: text(titel, 140), aktiv: 1, standard: standard ? 1 : 0, anzahlung_prozent: a, teilzahlung_prozent: t, rest_prozent: 100 - a - t, zieltage: Math.round(Number(zieltage) || 14), skonto_promille: Math.round(Number(skonto_promille) || 0), skonto_tage: Math.round(Number(skonto_tage) || 0), text: text(txt, 500) };
    if (istName(name)) await k.client.save("PH Zahlungsbedingung", { name, ...werte });
    else await k.client.insert("PH Zahlungsbedingung", { name: werte.titel, ...werte });
    neuLaden();
    return { ok: true, gespeichert: new Date().toTimeString().slice(0, 5) };
  } catch (err) {
    return fehler(err);
  }
}

export async function mahnungErledigtPlanen({ name } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name)) return nein("invalid", FEHLER.invalid);
  return plane(k, "faktura.mahnung-erledigt", { name }, { doctype: "PH Mahnung", name, titel: `Erledigt ${name}` }, `${name} erledigt`);
}

/** Mahnsperre setzen/aufheben (Grund Pflicht beim Setzen, verzögerter Commit, § 3.4 Inline). */
export async function mahnsperrePlanen({ name, wert, grund } = {}) {
  const k = await kontext("write");
  if (k.antwort) return k.antwort;
  if (!istName(name)) return nein("invalid", FEHLER.invalid);
  if (wert && !text(grund)) return nein("invalid", "Bitte den Grund der Mahnsperre angeben.", { feld: "grund" });
  return plane(k, "faktura.mahnsperre", { name, wert: !!wert, grund: text(grund, 140) }, { doctype: "PH Rechnung", name, titel: `Mahnsperre ${name}` }, `Mahnsperre ${name}`);
}
