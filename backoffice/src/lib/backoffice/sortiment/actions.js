"use server";
// Bereich Sortiment – Server Actions (10-konzept-sortiment § 20.3, MASTER Q-A2). Jede Action prüft Sitzung,
// DocType-Recht und Rolle erneut, validiert die Eingaben und gibt { ok, … } bzw. { ok:false, code, message } zurück –
// sie wirft nie. Außenwirkung (Website, Hersteller) und Workflow-Übergänge werden als verzögerter Commit geplant
// (planeCommit → commit/aktionen/sortiment.js); der Client zeigt 8 s „Rückgängig“. Mock-Pfad über methoden.js.

import { revalidatePath } from "next/cache";
import { getSession } from "../auth/dal.js";
import { darfDoc } from "../auth/rechte.js";
import { backoffice, ladeMeta } from "../frappe/index.js";
import { istBackofficeError } from "../frappe/errors.js";
import { planeCommit } from "../commit/server.js";
import * as M from "./methoden.js";
import { istLeitung } from "./rollen.js";
import { eanGueltig, vorpruefung } from "./regeln.js";
import { mockNachzug } from "./daten.js";
import { FEHLER } from "./texte.js";

function fehler(err) {
  if (istBackofficeError(err)) return { ok: false, code: err.code, message: err.message, detail: err.detail ?? null };
  console.error("[sortiment] Aktion fehlgeschlagen", err?.name || err);
  return { ok: false, code: "unavailable", message: FEHLER.unerwartet };
}

/** Sitzung + Recht am DocType; → { session, client } oder { fehler }. */
async function zugang(doctype, aktion = "write") {
  const session = await getSession();
  if (!session) return { fehler: { ok: false, code: "auth", message: "Bitte neu anmelden." } };
  const client = backoffice(session);
  mockNachzug(client);
  try {
    const meta = await ladeMeta(client, doctype);
    if (!darfDoc(session, meta, aktion)) return { fehler: { ok: false, code: "forbidden", message: FEHLER.keinRecht } };
  } catch (err) {
    return { fehler: fehler(err) };
  }
  return { session, client, leitung: istLeitung(session) };
}

const txt = (v, max = 500) => String(v ?? "").trim().slice(0, max);
const iso = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : "");
const ganz = (v) => (Number.isInteger(Number(v)) ? Number(v) : NaN);

function plan(session, action, args, objekt, titel, schluessel) {
  return planeCommit(session, { action, args, objekt, titel, schluessel });
}

// ---------------------------------------------------------------- Produkte --

export async function produktAnlegenAction(werte = {}) {
  const z = await zugang("PH Produkt", "create");
  if (z.fehler) return z.fehler;
  const fehlerFelder = {};
  if (!txt(werte.marke)) fehlerFelder.marke = "Pflichtfeld";
  if (!txt(werte.kategorie)) fehlerFelder.kategorie = "Pflichtfeld";
  if (!txt(werte.bezeichnung)) fehlerFelder.bezeichnung = "Pflichtfeld";
  if (!eanGueltig(werte.ean)) fehlerFelder.ean = "Prüfziffer passt nicht";
  if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: FEHLER.ungueltig, fehler: fehlerFelder };
  try {
    const doc = await M.produktAnlegen(z.client, { marke: txt(werte.marke, 140), kategorie: txt(werte.kategorie, 140), bezeichnung: txt(werte.bezeichnung, 140), artikelnr: txt(werte.artikelnr, 60), ean: txt(werte.ean, 14), collection: txt(werte.collection, 140), serie: txt(werte.serie, 140), designer: txt(werte.designer, 140) });
    revalidatePath("/sortiment/produkte");
    return { ok: true, name: doc.name, titel: doc.titel };
  } catch (err) {
    return fehler(err);
  }
}

/** Dublettenhinweis der Schnellanlage (gleiche Art.-Nr. + Marke). */
export async function dubletteAction({ marke, artikelnr, slug }) {
  const z = await zugang("PH Produkt", "read");
  if (z.fehler) return z.fehler;
  try {
    const or = [];
    if (txt(artikelnr)) or.push(["hersteller_artikelnr", "=", txt(artikelnr, 60)]);
    if (txt(slug)) or.push(["slug", "=", txt(slug, 120)]);
    if (!or.length) return { ok: true, treffer: [] };
    const treffer = await z.client.getList("PH Produkt", { fields: ["name", "titel", "status", "marke"], filters: txt(artikelnr) && txt(marke) && !txt(slug) ? [["marke", "=", txt(marke)]] : [], orFilters: or, limit: 3 });
    return { ok: true, treffer: treffer.filter((t) => !txt(artikelnr) || t.marke === txt(marke) || t.name === txt(slug)) };
  } catch (err) {
    return fehler(err);
  }
}

const PRODUKT_AKTIONEN = ["Prüfen", "Veröffentlichen", "Zurück auf Entwurf", "Pausieren", "Reaktivieren", "Auslaufen lassen"];
const LEITUNG_AKTIONEN = ["Veröffentlichen", "Reaktivieren", "Auslaufen lassen"];

/**
 * Vorprüfung für Workflow-Aktionen an Produkten (Dialog „n möglich – m gesperrt“). Keine Wirkung.
 * → { ok, moeglich:[name], gesperrt:[{name, titel, grund}] }
 */
export async function produktVorpruefungAction({ namen = [], aktion }) {
  const z = await zugang("PH Produkt", "write");
  if (z.fehler) return z.fehler;
  if (!PRODUKT_AKTIONEN.includes(aktion)) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  try {
    const docs = (await Promise.all(namen.slice(0, 200).map((n) => z.client.getDoc("PH Produkt", n).catch(() => null)))).filter(Boolean);
    const marken = new Map();
    const kategorien = new Map();
    for (const d of docs) {
      if (d.marke && !marken.has(d.marke)) marken.set(d.marke, await z.client.getDoc("PH Marke", d.marke).catch(() => null));
      if (d.kategorie && !kategorien.has(d.kategorie)) kategorien.set(d.kategorie, await z.client.getDoc("PH Kategorie", d.kategorie).catch(() => null));
    }
    return { ok: true, ...vorpruefung(docs, aktion, { marke: (m) => marken.get(m), kategorie: (k) => kategorien.get(k), leitung: z.leitung }) };
  } catch (err) {
    return fehler(err);
  }
}

/** Workflow für Produkte planen (verzögerter Commit, Q-C3). Nur Namen ohne Sperrgrund. */
export async function produktWorkflowAction({ namen = [], aktion }) {
  const z = await zugang("PH Produkt", "write");
  if (z.fehler) return z.fehler;
  if (!PRODUKT_AKTIONEN.includes(aktion)) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  if (LEITUNG_AKTIONEN.includes(aktion) && !z.leitung) return { ok: false, code: "forbidden", message: FEHLER.nurLeitung };
  const liste = [...new Set(namen.map((n) => txt(n, 140)).filter(Boolean))].slice(0, 200);
  if (!liste.length) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  try {
    const objekt = liste.length === 1 ? { doctype: "PH Produkt", name: liste[0] } : { doctype: "PH Produkt", name: `${liste.length} Produkte` };
    const r = await plan(z.session, "sortiment.produkt-workflow", { namen: liste, aktion }, objekt, `${aktion}: ${liste.length === 1 ? liste[0] : `${liste.length} Produkte`}`, `${aktion}:${liste.join(",")}`);
    return { ...r, ok: true, namen: liste };
  } catch (err) {
    return fehler(err);
  }
}

/** Ausblenden/Einblenden, Im Shop an/aus (Außenwirkung → verzögerter Commit). */
export async function produktSichtbarkeitAction({ namen = [], feld, wert }) {
  const z = await zugang("PH Produkt", "write");
  if (z.fehler) return z.fehler;
  if (!["website_sichtbar", "verkauf_online"].includes(feld) || ![0, 1].includes(wert)) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  try {
    const r = await plan(z.session, "sortiment.produkt-feld", { namen: namen.slice(0, 200), feld, wert }, { doctype: "PH Produkt", name: namen.length === 1 ? namen[0] : `${namen.length} Produkte` }, "Sichtbarkeit", `${feld}:${wert}:${namen.join(",")}`);
    return { ...r, ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/**
 * Preis erfassen/bestätigen (§ 5.6). Team: sofort mit Freigabe offen (Undo = Zeile entfernen über die Leitung);
 * Leitung: freigegeben, als verzögerter Commit (Website folgt).
 */
export async function preisErfassenAction({ produkt, brutto_cent, preisart = "Verkaufspreis", stand, quelle = "Herstellerliste", quelle_url = "" }) {
  const z = await zugang("PH Produkt", "write");
  if (z.fehler) return z.fehler;
  const cent = ganz(brutto_cent);
  const fehlerFelder = {};
  if (!Number.isInteger(cent) || cent <= 0) fehlerFelder.betrag = "Betrag im Format 1.234,50";
  if (!["Verkaufspreis", "UVP", "Herstellerpreis", "Angebot"].includes(preisart)) fehlerFelder.preisart = "Bitte wählen";
  if (!iso(stand)) fehlerFelder.stand = "Datum im Format TT.MM.JJJJ";
  if (["Herstellershop", "Herstellerliste"].includes(quelle) && !/^https?:\/\/\S+$/.test(txt(quelle_url))) fehlerFelder.quelle_url = "Adresse der Quelle angeben";
  if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: FEHLER.ungueltig, fehler: fehlerFelder };
  const preis = { brutto_cent: cent, preisart, stand: iso(stand), ab: iso(stand), quelle, quelle_url: txt(quelle_url, 300) };
  try {
    if (z.leitung) {
      const r = await plan(z.session, "sortiment.preis", { produkt: txt(produkt, 140), preis }, { doctype: "PH Produkt", name: txt(produkt, 140) }, `Preis für ${produkt}`, `preis:${produkt}:${cent}:${preis.stand}:${preisart}`);
      return { ...r, ok: true, verzoegert: true };
    }
    await M.preisHinzufuegen(z.client, txt(produkt, 140), { ...preis, freigegeben: 0 });
    revalidatePath(`/sortiment/produkte/${encodeURIComponent(produkt)}`);
    return { ok: true, verzoegert: false };
  } catch (err) {
    return fehler(err);
  }
}

/** Freigabe von Bildern/Preisen/Lieferzeiten planen (Leitung, verzögerter Commit). */
export async function freigabeAction({ art, ziele = [], entscheidung, grund = "" }) {
  const z = await zugang("PH Produkt", "write");
  if (z.fehler) return z.fehler;
  if (!z.leitung) return { ok: false, code: "forbidden", message: FEHLER.nurLeitung };
  if (!["bild", "preis", "lieferzeit"].includes(art) || !["freigeben", "ablehnen"].includes(entscheidung)) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  if (entscheidung === "ablehnen" && txt(grund).length < 5) return { ok: false, code: "invalid", message: "Grund angeben (mindestens 5 Zeichen)", fehler: { grund: "Mindestens 5 Zeichen" } };
  const sauber = ziele.slice(0, 300).map((x) => ({ produkt: txt(x?.produkt, 140), zeile: txt(x?.zeile, 140) })).filter((x) => x.produkt);
  if (!sauber.length) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  try {
    const r = await plan(z.session, "sortiment.freigabe", { art, ziele: sauber, entscheidung, grund: txt(grund) }, { doctype: "PH Produkt", name: sauber.length === 1 ? sauber[0].produkt : `${sauber.length} Freigaben` }, `Freigabe ${art}`, `freigabe:${art}:${entscheidung}:${sauber.map((x) => x.zeile || x.produkt).join(",")}`);
    return { ...r, ok: true, anzahl: sauber.length };
  } catch (err) {
    return fehler(err);
  }
}

/** Website jetzt aktualisieren (einmal für alle). */
export async function websiteAktualisierenAction({ produkt }) {
  const z = await zugang("PH Produkt", "read");
  if (z.fehler) return z.fehler;
  try {
    const r = await M.websiteAktualisieren(z.client, txt(produkt, 140));
    return { ok: true, status: r?.status || "enqueued" };
  } catch (err) {
    return fehler(err);
  }
}

// ------------------------------------------------------------- Bestellungen --

export async function bestellungAnlegenAction(daten = {}) {
  const z = await zugang("PH Herstellerbestellung", "create");
  if (z.fehler) return z.fehler;
  const positionen = (Array.isArray(daten.positionen) ? daten.positionen : []).slice(0, 100).map((p) => ({
    produkt: txt(p.produkt, 140),
    bezeichnung: txt(p.bezeichnung, 140),
    hersteller_artikelnr: txt(p.hersteller_artikelnr, 60),
    ausfuehrung_text: txt(p.ausfuehrung_text, 140),
    menge: p.menge,
    ek_cent: z.leitung && Number.isInteger(ganz(p.ek_cent)) && ganz(p.ek_cent) > 0 ? ganz(p.ek_cent) : undefined,
  }));
  if (positionen.some((p) => p.menge !== "" && p.menge !== undefined && !Number.isInteger(Number(p.menge)))) return { ok: false, code: "invalid", message: "Mengen nur ganzzahlig – „3,6“ geht nicht.", fehler: { positionen: "Mengen nur ganzzahlig" } };
  try {
    const doc = await M.bestellungAnlegen(z.client, { lieferant: txt(daten.lieferant, 140), kommission: txt(daten.kommission, 140), wunschtermin: iso(daten.wunschtermin), lieferadresse: ["Showroom", "Lager", "Kunde direkt"].includes(daten.lieferadresse) ? daten.lieferadresse : "Lager", notizen_lieferant: txt(daten.notizen_lieferant, 1000), positionen });
    revalidatePath("/sortiment/bestellungen");
    return { ok: true, name: doc.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function bestellungLieferantAction({ name, lieferant }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  try {
    const b = await z.client.getDoc("PH Herstellerbestellung", txt(name, 140));
    if (b.status !== "Entwurf") return { ok: false, code: "invalid", message: FEHLER.nichtMoeglich };
    const lf = await z.client.getDoc("PH Lieferant", txt(lieferant, 140));
    await z.client.save("PH Herstellerbestellung", { name: b.name, lieferant: lf.name, marke: b.marke || lf.marke || "", bestellweg: lf.bestellweg || "" }, { modified: b.modified });
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(b.name)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Senden per E-Mail planen (Hersteller-Mail → verzögerter Commit 8 s). */
export async function sendenAction({ name, empfaenger = "", nachricht = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  try {
    const b = await z.client.getDoc("PH Herstellerbestellung", txt(name, 140));
    if (b.status !== "Entwurf") return { ok: false, code: "invalid", message: "Nur Entwürfe können gesendet werden." };
    if (!b.lieferant) return { ok: false, code: "invalid", message: "Erst einen Lieferanten zuordnen." };
    if (!(b.positionen || []).length) return { ok: false, code: "invalid", message: "Ohne Positionen kann nicht gesendet werden." };
    const an = txt(empfaenger, 254);
    if (an && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(an)) return { ok: false, code: "invalid", message: "E-Mail-Adresse prüfen.", fehler: { empfaenger: "E-Mail-Adresse prüfen" } };
    const r = await plan(z.session, "sortiment.senden", { name: b.name, empfaenger: an, nachricht: txt(nachricht, 2000) }, { doctype: "PH Herstellerbestellung", name: b.name }, `Senden von ${b.name}`, `senden:${b.name}`);
    return { ...r, ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function alsGesendetAction({ name, weg }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  try {
    await M.alsGesendetMarkieren(z.client, txt(name, 140), { weg: txt(weg, 60) || "Lieferantenportal" });
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(name)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Stornieren · AB bestätigen · Abschließen (sofort; Stornieren ab Gesendet mit Grund, Leitung). */
export async function bestellWorkflowAction({ name, aktion, grund = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  try {
    await M.bestellWorkflow(z.client, txt(name, 140), aktion, { leitung: z.leitung, grund: txt(grund) });
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(name)}`);
    revalidatePath("/sortiment/bestellungen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function abEinlesenAction({ name, ab_nummer, ab_datum, positionen = [], ab_datei = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  if (!txt(ab_nummer)) return { ok: false, code: "invalid", message: "AB-Nummer angeben", fehler: { ab_nummer: "AB-Nummer angeben" } };
  const sauber = positionen.slice(0, 200).map((p) => {
    const out = { idx: ganz(p.idx) };
    if (p.ab_menge !== "" && p.ab_menge !== undefined && p.ab_menge !== null) out.ab_menge = ganz(p.ab_menge);
    if (z.leitung && p.ab_ek_cent !== "" && p.ab_ek_cent !== undefined && p.ab_ek_cent !== null) out.ab_ek_cent = ganz(p.ab_ek_cent);
    if (iso(p.bestaetigter_termin)) out.bestaetigter_termin = iso(p.bestaetigter_termin);
    if (txt(p.ab_artikelnr)) out.ab_artikelnr = txt(p.ab_artikelnr, 60);
    if (txt(p.ab_ausfuehrung_text)) out.ab_ausfuehrung_text = txt(p.ab_ausfuehrung_text, 140);
    return out;
  });
  if (sauber.some((p) => Number.isNaN(p.idx) || Number.isNaN(p.ab_menge) || Number.isNaN(p.ab_ek_cent))) return { ok: false, code: "invalid", message: "Mengen ganzzahlig, Beträge im Format 1.234,50." };
  try {
    const r = await M.abEinlesen(z.client, txt(name, 140), { ab_nummer: txt(ab_nummer, 60), ab_datum: iso(ab_datum), positionen: sauber, ab_datei: txt(ab_datei, 300) });
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(name)}`);
    return { ok: true, abweichungen: r?.abweichungen ?? null, offen: r?.offen ?? null };
  } catch (err) {
    return fehler(err);
  }
}

/** Bewertung einer Abweichung (sofort + Undo über erneutes Bewerten). */
export async function bewertenAction({ name, zeile, bewertung, kommentar = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  try {
    const r = await M.abweichungBewerten(z.client, txt(name, 140), { zeile, bewertung, kommentar: txt(kommentar, 140) }, { leitung: z.leitung });
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(name)}`);
    return { ok: true, offen: r?.offen ?? null, vollstaendig: r?.vollstaendig ?? null };
  } catch (err) {
    return fehler(err);
  }
}

/** Klärung: Rückfrage beim Hersteller/Verkauf → verzögert; akzeptieren (Leitung) → sofort. */
export async function klaerenAction({ name, zeile, aktion, text = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  if (!["akzeptieren", "lieferant_reklamieren", "kunde_rueckfragen"].includes(aktion)) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  try {
    if (aktion === "akzeptieren") {
      await M.abweichungKlaeren(z.client, txt(name, 140), { zeile, aktion, text: txt(text) }, { leitung: z.leitung });
      revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(name)}`);
      return { ok: true, verzoegert: false };
    }
    const r = await plan(z.session, "sortiment.klaeren", { name: txt(name, 140), zeile, aktion, text: txt(text, 1000) }, { doctype: "PH Herstellerbestellung", name: txt(name, 140) }, aktion === "lieferant_reklamieren" ? "Rückfrage beim Hersteller" : "Rückfrage beim Verkauf", `klaeren:${name}:${zeile}:${aktion}`);
    return { ...r, ok: true, verzoegert: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function terminAction({ name, termin, grund }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  if (!iso(termin)) return { ok: false, code: "invalid", message: "Datum im Format TT.MM.JJJJ", fehler: { termin: "Datum im Format TT.MM.JJJJ" } };
  if (txt(grund).length < 3) return { ok: false, code: "invalid", message: "Grund angeben", fehler: { grund: "Grund angeben" } };
  try {
    await M.terminAendern(z.client, txt(name, 140), { termin: iso(termin), grund: txt(grund, 200) });
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(name)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

/** Exportdatei (IWOfurn/EDI/CSV) erzeugen. Liefert im Testmodus den Dateiinhalt zur Vorschau. */
export async function exportAction({ name, weg }) {
  const z = await zugang("PH Herstellerbestellung", "read");
  if (z.fehler) return z.fehler;
  if (weg && !["CSV", "IWOfurn", "EDI"].includes(weg)) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  try {
    const r = await M.exportieren(z.client, txt(name, 140), weg);
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(name)}`);
    return { ok: true, datei: r?.datei || "", weg: r?.weg || weg, verifiziert: !!r?.verifiziert, hinweis: r?.hinweis || null, inhalt: typeof r?.inhalt === "string" ? r.inhalt.slice(0, 20000) : null, dateiname: r?.dateiname || "" };
  } catch (err) {
    return fehler(err);
  }
}

/** Übermittlung markieren (verzögert: wirkt nach außen auf den Bestellstatus). */
export async function uebermittlungAction({ name, status, hinweis = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  if (!["Uebermittelt", "Bestaetigt", "Fehler"].includes(status)) return { ok: false, code: "invalid", message: FEHLER.ungueltig };
  try {
    const r = await plan(z.session, "sortiment.uebermittlung", { name: txt(name, 140), status, hinweis: txt(hinweis, 140) }, { doctype: "PH Herstellerbestellung", name: txt(name, 140) }, "Übermittlung", `uebermittlung:${name}:${status}`);
    return { ...r, ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function abNachfragenAction({ name, nachricht = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  try {
    const r = await plan(z.session, "sortiment.ab-nachfragen", { name: txt(name, 140), nachricht: txt(nachricht, 2000) }, { doctype: "PH Herstellerbestellung", name: txt(name, 140) }, "AB nachfragen", `ab-nachfragen:${name}`);
    return { ...r, ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// -------------------------------------------------------------- Wareneingang --

export async function wareneingangAction(daten = {}) {
  const z = await zugang("PH Wareneingang", "create");
  if (z.fehler) return z.fehler;
  const positionen = (Array.isArray(daten.positionen) ? daten.positionen : []).slice(0, 200).map((p) => ({ idx: ganz(p.idx), menge_erhalten: ganz(p.menge_erhalten), zustand: ["ok", "beschaedigt", "Transportschaden", "falsch", "fehlt"].includes(p.zustand) ? p.zustand : "ok", hinweis: txt(p.hinweis, 140), seriennummer: txt(p.seriennummer, 60) }));
  if (positionen.some((p) => Number.isNaN(p.menge_erhalten) || p.menge_erhalten < 0)) return { ok: false, code: "invalid", message: "Mengen ganzzahlig angeben." };
  try {
    const we = await M.wareneingangBuchen(z.client, { bestellung: txt(daten.bestellung, 140), datum: iso(daten.datum), lieferschein_nr_lieferant: txt(daten.lieferschein_nr_lieferant, 60), spediteur: txt(daten.spediteur, 140), packstuecke: ganz(daten.packstuecke) || 1, positionen });
    revalidatePath("/sortiment/wareneingang");
    revalidatePath(`/sortiment/bestellungen/${encodeURIComponent(daten.bestellung)}`);
    return { ok: true, name: we.name, status: we.status };
  } catch (err) {
    return fehler(err);
  }
}

export async function schadenAction({ name, beschreibung, regress = false }) {
  const z = await zugang("PH Wareneingang", "write");
  if (z.fehler) return z.fehler;
  try {
    await M.schadenMelden(z.client, txt(name, 140), { beschreibung: txt(beschreibung, 1000), regress: !!regress });
    revalidatePath(`/sortiment/wareneingang/${encodeURIComponent(name)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// --------------------------------------------------------------- Preislisten --

export async function preislisteAnlegenAction(daten = {}) {
  const z = await zugang("PH Preisliste Import", "create");
  if (z.fehler) return z.fehler;
  const fehlerFelder = {};
  if (!txt(daten.marke)) fehlerFelder.marke = "Pflichtfeld";
  if (!["Verkaufspreis", "UVP", "Herstellerpreis", "Einkaufspreis"].includes(daten.preisart)) fehlerFelder.preisart = "Pflichtfeld";
  if (!iso(daten.stand)) fehlerFelder.stand = "Datum der Liste angeben";
  if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: FEHLER.ungueltig, fehler: fehlerFelder };
  try {
    const l = await M.preislisteAnlegen(z.client, { marke: txt(daten.marke, 140), preisart: daten.preisart, stand: iso(daten.stand), lieferant: txt(daten.lieferant, 140), quelle: txt(daten.quelle, 300) });
    revalidatePath("/sortiment/preislisten");
    return { ok: true, name: l.name };
  } catch (err) {
    return fehler(err);
  }
}

export async function preislisteAction({ name, methode }) {
  const z = await zugang("PH Preisliste Import", "write");
  if (z.fehler) return z.fehler;
  try {
    if (methode === "uebernehmen") {
      if (!z.leitung) return { ok: false, code: "forbidden", message: FEHLER.nurLeitung };
      const r = await plan(z.session, "sortiment.preisliste-uebernehmen", { name: txt(name, 140) }, { doctype: "PH Preisliste Import", name: txt(name, 140) }, "Preisliste übernehmen", `pl:${name}`);
      return { ...r, ok: true, verzoegert: true };
    }
    await M.preislisteMethode(z.client, txt(name, 140), methode, { leitung: z.leitung });
    revalidatePath(`/sortiment/preislisten/${encodeURIComponent(name)}`);
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

export async function preislisteZeileAction({ name, zeile, uebernehmen }) {
  const z = await zugang("PH Preisliste Import", "write");
  if (z.fehler) return z.fehler;
  try {
    await M.preislisteZeile(z.client, txt(name, 140), { zeile: txt(zeile, 140), uebernehmen: !!uebernehmen });
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// --------------------------------------------------------- Bestellvorschläge --

export async function vorschlaegeBestellenAction({ namen = [] }) {
  const z = await zugang("PH Herstellerbestellung", "create");
  if (z.fehler) return z.fehler;
  if (!z.leitung) return { ok: false, code: "forbidden", message: "Bestellen aus Vorschlägen: Leitung" };
  try {
    const r = await M.vorschlaegeBestellen(z.client, namen.slice(0, 200).map((n) => txt(n, 140)), { idempotency_key: `vorschlaege:${z.session.user}:${namen.join(",")}`.slice(0, 140) });
    revalidatePath("/sortiment/bestellvorschlaege");
    revalidatePath("/sortiment/bestellungen");
    return { ok: true, angelegt: r?.angelegt || [], ohneLieferant: r?.ohne_lieferant || [] };
  } catch (err) {
    return fehler(err);
  }
}

export async function vorschlagVerwerfenAction({ name, grund = "" }) {
  const z = await zugang("PH Herstellerbestellung", "write");
  if (z.fehler) return z.fehler;
  try {
    await M.vorschlagVerwerfen(z.client, txt(name, 140), { grund: txt(grund, 200) });
    revalidatePath("/sortiment/bestellvorschlaege");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// -------------------------------------------------------------- Marken --

export async function bildfreigabeAnfordernAction({ marke, empfaenger = "", nachricht = "" }) {
  const z = await zugang("PH Marke", "write");
  if (z.fehler) return z.fehler;
  try {
    const r = await plan(z.session, "sortiment.bildfreigabe-anfordern", { marke: txt(marke, 140), empfaenger: txt(empfaenger, 254), nachricht: txt(nachricht, 2000) }, { doctype: "PH Marke", name: txt(marke, 140) }, "Bildfreigabe anfordern", `bildfreigabe:${marke}`);
    return { ...r, ok: true };
  } catch (err) {
    return fehler(err);
  }
}

// --------------------------------------------------------- Einstellungen --

export async function einstellungenAction(werte = {}) {
  const z = await zugang(M.EINST, "write");
  if (z.fehler) return z.fehler;
  if (!z.leitung) return { ok: false, code: "forbidden", message: FEHLER.nurLeitung };
  const zahl = (v, min, max) => {
    const n = ganz(v);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };
  const sauber = {
    website_revalidate_aktiv: werte.website_revalidate_aktiv ? 1 : 0,
    claim_guard_aktiv: werte.claim_guard_aktiv ? 1 : 0,
    revalidate_drossel_sekunden: zahl(werte.revalidate_drossel_sekunden, 10, 3600),
    preis_max_monate_verkaufspreis: zahl(werte.preis_max_monate_verkaufspreis, 1, 36),
    preis_max_monate_uvp: zahl(werte.preis_max_monate_uvp, 1, 36),
    preisliste_schwelle_prozent: zahl(werte.preisliste_schwelle_prozent, 0, 100),
    ab_toleranz_preis_prozent: zahl(werte.ab_toleranz_preis_prozent, 0, 50),
    ab_toleranz_termin_tage: zahl(werte.ab_toleranz_termin_tage, 0, 60),
    eigene_gln: txt(werte.eigene_gln, 13),
    standard_lieferadresse: txt(werte.standard_lieferadresse, 500),
  };
  const fehlerFelder = Object.fromEntries(Object.entries(sauber).filter(([, v]) => v === null).map(([k]) => [k, "Wert außerhalb des erlaubten Bereichs"]));
  if (Object.keys(fehlerFelder).length) return { ok: false, code: "invalid", message: FEHLER.ungueltig, fehler: fehlerFelder };
  try {
    await M.einstellungenSpeichern(z.client, sauber);
    revalidatePath("/sortiment/einstellungen");
    return { ok: true };
  } catch (err) {
    return fehler(err);
  }
}
