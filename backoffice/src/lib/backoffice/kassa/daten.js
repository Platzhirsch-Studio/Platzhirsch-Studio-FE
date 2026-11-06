// Kassa – Lesefunktionen für Server-Seiten (Team B-KAS, Konzept §16.1 „daten.js“). Nur serverseitig:
// Kiosk-Kontext (Kasse aus Gerät oder Einstellungen, Katalog, Schnelltasten, Leitung für die Freigabe,
// Fähigkeiten), Verwaltungs-Übersicht (Kennzahlen, Charts), Listen und Akten.
import "server-only";

import { backoffice } from "../frappe/index.js";
import { getGeraet, getGeraetToken } from "../auth/dal.js";
import { bedienerListe } from "../auth/login.js";
import { rufe } from "./frappe.js";
import { kassaFaehigkeiten } from "./faehigkeiten.js";
import { leitungListe, sicherstellen } from "./mock.js";
import { KATEGORIEN, kategorieFuer, MOCK_KATALOG } from "./katalog.js";
import { sollAusBelegen } from "./abschluss.js";

const ALT_TAGE = 14;

function isoTag(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Client der Sitzung; im Mock mit sichergestellten Kassa-Daten. */
export function kassaClient(session) {
  const client = backoffice(session);
  if (client.modus !== "frappe") sicherstellen(client);
  return client;
}

/** Bild-URL für die Oberfläche: lokale Pfade direkt, Frappe-Dateien über den Datei-Proxy. */
export function bildUrl(bild) {
  if (!bild) return "";
  if (/^\/(private\/)?files\//.test(bild)) return `/api/datei?url=${encodeURIComponent(bild)}`;
  if (/^\/[^/]/.test(bild)) return bild;
  return "";
}

/**
 * Alles, was der Verkauf beim Laden braucht.
 * @returns {Promise<{kontext:object, katalog:object[], kategorien:object[], schnelltasten:object[], leitung:object[], faehig:object, geraet:object|null, fehler?:{code:string, message:string}}>}
 */
export async function kioskDaten(session, { kasse: wunsch } = {}) {
  const client = kassaClient(session);
  const geraet = await getGeraet().catch(() => null);
  const kasse = wunsch || geraet?.kasse || undefined;
  const [kontext, katalogRoh, faehig, bediener] = await Promise.all([
    rufe(client, "kontext", { kasse }),
    rufe(client, "kassen_katalog", {}).catch(() => ({ produkte: [] })),
    kassaFaehigkeiten(session, { client }),
    leitungFuerFreigabe(client).catch(() => []),
  ]);
  const katalog = (katalogRoh?.produkte || [])
    .filter((p) => p.status !== "Archiviert")
    .map((p) => ({ produkt: p.produkt, bezeichnung: p.bezeichnung, marke: p.marke || "", bild: bildUrl(p.bild), einzel_brutto_cent: Number(p.einzel_brutto_cent) || 0, steuersatz: p.steuersatz || "Normal 20", ean: p.ean || "", kategorie: p.kategorie || kategorieFuer(p.kategorie), lager: p.lager ?? null }));
  const schnelltasten = (kontext.schnelltasten || []).map((s) => {
    const p = katalog.find((x) => x.produkt === s.produkt) || null;
    return { name: s.name, titel: s.titel, aktion: s.aktion, produkt: s.produkt || "", bezeichnung: s.bezeichnung || p?.bezeichnung || s.titel, marke: p?.marke || "", betrag_cent: Number(s.betrag_cent) || p?.einzel_brutto_cent || 0, steuersatz: s.steuersatz || p?.steuersatz || "Normal 20", bild: bildUrl(s.bild) || p?.bild || "", kategorie: s.aktion === "Gutschein Verkauf" ? "gutschein" : p?.kategorie || "objekt", lager: p?.lager ?? null };
  });
  const genutzt = new Set(schnelltasten.map((s) => s.kategorie));
  const kategorien = KATEGORIEN.filter((k) => k.id === "alle" || genutzt.has(k.id) || katalog.some((p) => p.kategorie === k.id));
  return { kontext, katalog, kategorien, schnelltasten, leitung: bediener, faehig, geraet: geraet ? { name: geraet.name, standort: geraet.standort, kasse: geraet.kasse || null } : null };
}

/** Personen mit Kassa-Leitung für die Freigabe-Kacheln (ohne PIN). */
export async function leitungFuerFreigabe(client) {
  if (client.modus !== "frappe") return leitungListe();
  const token = await getGeraetToken();
  if (!token) return [];
  const liste = await bedienerListe({ geraetToken: token, alleStandorte: false });
  return liste.filter((b) => (b.roles || []).some((r) => r === "PH Kassa Leitung")).map((b) => ({ email: b.email, name: b.kurzname || b.name }));
}

// --------------------------------------------------------------- Verwaltung --

const BELEG_FELDER = ["name", "belegnummer", "belegart", "datum_uhrzeit", "gesamt_cent", "trainings", "bediener", "kasse", "kunde_name", "kontakt", "status", "storno_von", "storniert_durch"];

/** Übersicht V0: Kennzahlen heute, Umsatz 14 Tage, Zahlarten heute, letzte Belege, Kassen, offene Abschlüsse/Ereignisse. */
export async function uebersicht(session) {
  const client = kassaClient(session);
  const heute = new Date();
  const von = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - (ALT_TAGE - 1));
  const vonIso = `${isoTag(von)} 00:00:00`;
  const [belege, kassen, abschluesse, ereignisse, faehig] = await Promise.all([
    client.getList("PH Kassenbeleg", { fields: BELEG_FELDER, filters: [["docstatus", "=", 1], ["datum_uhrzeit", ">=", vonIso]], orderBy: "datum_uhrzeit desc", limit: 500 }).catch(() => []),
    client.getList("PH Kasse", { fields: ["name", "bezeichnung", "standort", "status", "trainings_modus", "letzter_beleg_am"], limit: 20 }).catch(() => []),
    client.getList("PH Kassenabschluss", { fields: ["name", "kasse", "datum", "status", "differenz_cent", "umsatz_cent"], orderBy: "datum desc", limit: 60 }).catch(() => []),
    client.getList("PH Kassa Ereignis", { fields: ["name", "kasse", "art", "status", "zeitpunkt", "meldung_finanzonline_noetig", "notiz"], filters: [["status", "=", "Offen"]], limit: 20 }).catch(() => []),
    kassaFaehigkeiten(session, { client }),
  ]);
  const heuteIso = isoTag(heute);
  const heuteBelege = await mitZahlarten(client, belege.filter((b) => String(b.datum_uhrzeit).startsWith(heuteIso)));
  const soll = sollAusBelegen(heuteBelege);
  const tage = [];
  for (let i = ALT_TAGE - 1; i >= 0; i--) {
    const d = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() - i);
    const iso = isoTag(d);
    const summe = belege.filter((b) => String(b.datum_uhrzeit).startsWith(iso) && !Number(b.trainings)).reduce((a, b) => a + (Number(b.gesamt_cent) || 0), 0);
    tage.push({ label: `${d.getDate()}.${d.getMonth() + 1}.`, wert: summe, iso });
  }
  const bestand = await Promise.all(kassen.map((k) => rufe(client, "kontext", { kasse: k.name }).then((x) => [k.name, x.bargeld_bestand_cent]).catch(() => [k.name, null])));
  return {
    heute: { umsatz_cent: soll.umsatz_cent, belege: soll.belege_anzahl, stornos: soll.stornos_anzahl, je_zahlart: soll.je_zahlart, bar_cent: soll.bar_einnahmen_cent - soll.bar_ausgaben_cent, karte_cent: soll.karten_cent, gutschein_cent: soll.gutschein_cent },
    tage,
    letzte: belege.slice(0, 6),
    kassen: kassen.map((k) => ({ ...k, bestand_cent: Object.fromEntries(bestand)[k.name] ?? null, abschluss: abschluesse.find((a) => a.kasse === k.name && a.datum === heuteIso) || null })),
    offeneAbschluesse: abschluesse.filter((a) => ["Offen", "Gezaehlt", "Korrigiert"].includes(a.status) && a.datum < heuteIso),
    mitDifferenz: abschluesse.filter((a) => Number(a.differenz_cent) !== 0 && a.status === "Abgeschlossen").length,
    ereignisse,
    faehig,
  };
}

/**
 * Zahlarten zu Belegen nachladen: Frappe über Kindfelder in get_list (eine Abfrage), Mock über getDoc.
 * @returns {Promise<object[]>} Belege mit `zahlarten[]` (positionen leer)
 */
export async function mitZahlarten(client, belege) {
  if (!belege.length) return [];
  if (client.modus === "frappe") {
    const zeilen = await client.getList("PH Kassenbeleg", { fields: ["name", "`tabPH Kassenbeleg Zahlung`.zahlart as zahlart", "`tabPH Kassenbeleg Zahlung`.betrag_cent as z_betrag"], filters: [["name", "in", belege.map((b) => b.name)]], limit: 2000 }).catch(() => []);
    return belege.map((b) => ({ ...b, positionen: [], zahlarten: zeilen.filter((z) => z.name === b.name && z.zahlart).map((z) => ({ zahlart: z.zahlart, betrag_cent: Number(z.z_betrag) || 0 })) }));
  }
  return Promise.all(belege.map((b) => client.getDoc("PH Kassenbeleg", b.name).then((d) => ({ ...b, zahlarten: d.zahlarten || [], positionen: d.positionen || [] })).catch(() => ({ ...b, zahlarten: [], positionen: [] }))));
}

/** Beleg mit Kindtabellen (Akte). */
export async function belegAkte(session, name) {
  const client = kassaClient(session);
  const doc = await client.getDocMitInfo("PH Kassenbeleg", name);
  return { client, ...doc };
}

/** Kassenbuch-Zeilen (Liste, optional Kasse/Monat). */
export async function kassenbuch(session, { kasse, monat } = {}) {
  const client = kassaClient(session);
  const filters = [];
  if (kasse) filters.push(["kasse", "=", kasse]);
  if (/^\d{4}-\d{2}$/.test(monat || "")) filters.push(["datum", "like", `${monat}%`]);
  return client.getList("PH Kassenbuch", { fields: ["name", "kasse", "art", "status", "zeitpunkt", "datum", "bediener", "betrag_cent", "bewegung_cent", "bestand_danach_cent", "grund", "beleg", "kassenabschluss", "quelle"], filters, orderBy: "zeitpunkt desc", limit: 500 });
}

/** Muster-Katalog (nur Mock) – für Tests der Verkaufsseite. */
export const MUSTER = MOCK_KATALOG;

// ------------------------------------------------------------------ Berichte --

const MONAT = /^\d{4}-\d{2}$/;

/** Monat „JJJJ-MM“ → [von, bis] (Tage). */
export function monatsSpanne(monat) {
  const [j, m] = monat.split("-").map(Number);
  const bis = new Date(j, m, 0).getDate();
  return [`${monat}-01`, `${monat}-${String(bis).padStart(2, "0")}`];
}

/** Belege eines Zeitraums mit Kindtabellen (Mock: getDoc je Beleg; Frappe: nur Kopfdaten + Zahlarten). */
async function belegeMitDetails(client, von, bis) {
  const kopf = await client.getList("PH Kassenbeleg", { fields: [...BELEG_FELDER, "ust_cent", "nebenbuchung_status", "see_ausgefallen"], filters: [["docstatus", "=", 1], ["datum_uhrzeit", "between", [`${von} 00:00:00`, `${bis} 23:59:59`]]], orderBy: "datum_uhrzeit asc", limit: 2000 });
  if (client.modus === "frappe") return mitZahlarten(client, kopf);
  return Promise.all(kopf.map((b) => client.getDoc("PH Kassenbeleg", b.name).catch(() => ({ ...b, positionen: [], zahlarten: [] }))));
}

const sp = (feld, titel, art = "text") => ({ feld, titel, art });

/**
 * Bericht laden. Frappe: Query Report der App (getReport); Mock oder Fehler: gleiche Auswertung lokal.
 * @returns {Promise<{spalten:Array<{feld,titel,art}>, zeilen:object[], chart?:{feld:string, label:string}, quelle:"server"|"lokal"}>}
 */
export async function bericht(session, def, { monat } = {}) {
  const client = kassaClient(session);
  const m = MONAT.test(monat || "") ? monat : isoTag(new Date()).slice(0, 7);
  const [von, bis] = monatsSpanne(m);
  if (client.modus === "frappe") {
    try {
      const r = await client.getReport(def.report, { von_datum: von, bis_datum: bis, from_date: von, to_date: bis });
      const spalten = (r.columns || []).map((c) => (typeof c === "string" ? sp(c, c) : sp(c.fieldname, c.label || c.fieldname, /cent$/.test(c.fieldname) ? "cent" : c.fieldtype === "Int" ? "zahl" : "text")));
      return { spalten, zeilen: r.result || [], quelle: "server" };
    } catch {
      // Rückfall: lokale Auswertung
    }
  }
  if (def.slug === "kassenbuch") {
    const zeilen = (await kassenbuch(session, { monat: m })).filter((z) => z.status === "Gebucht");
    return { spalten: [sp("zeitpunkt", "Zeitpunkt", "zeit"), sp("kasse", "Kasse"), sp("art", "Art"), sp("grund", "Grund"), sp("bewegung_cent", "Betrag", "cent"), sp("bestand_danach_cent", "Bestand", "cent")], zeilen, quelle: "lokal" };
  }
  if (def.slug === "differenzen") {
    const a = await client.getList("PH Kassenabschluss", { fields: ["name", "datum", "kasse", "status", "bargeld_soll_cent", "bargeld_ist_cent", "differenz_cent", "differenz_grund"], filters: [["datum", "between", [von, bis]], ["differenz_cent", "!=", 0]], orderBy: "datum asc", limit: 500 });
    return { spalten: [sp("datum", "Tag", "datum"), sp("kasse", "Kasse"), sp("bargeld_soll_cent", "Soll", "cent"), sp("bargeld_ist_cent", "Ist", "cent"), sp("differenz_cent", "Differenz", "cent"), sp("differenz_grund", "Grund")], zeilen: a, quelle: "lokal" };
  }
  const belege = await belegeMitDetails(client, von, bis);
  const echt = belege.filter((b) => !Number(b.trainings));
  const tag = (b) => String(b.datum_uhrzeit).slice(0, 10);
  if (def.slug === "tageslosung" || def.slug === "zahlart") {
    const tage = new Map();
    for (const b of echt) {
      const t = tage.get(tag(b)) || { tag: tag(b), belege: 0, stornos: 0, umsatz_cent: 0, bar_cent: 0, karte_cent: 0, gutschein_cent: 0 };
      t.belege += 1;
      if (b.belegart === "Stornobeleg") t.stornos += 1;
      t.umsatz_cent += Number(b.gesamt_cent) || 0;
      for (const z of b.zahlarten || []) {
        if (z.zahlart === "Bar") t.bar_cent += Number(z.betrag_cent) || 0;
        else if (String(z.zahlart).startsWith("Karte")) t.karte_cent += Number(z.betrag_cent) || 0;
        else if (z.zahlart === "Gutschein") t.gutschein_cent += Number(z.betrag_cent) || 0;
      }
      tage.set(t.tag, t);
    }
    const zeilen = [...tage.values()];
    if (def.slug === "zahlart") return { spalten: [sp("tag", "Tag", "datum"), sp("bar_cent", "Bar", "cent"), sp("karte_cent", "Karte", "cent"), sp("gutschein_cent", "Gutschein", "cent"), sp("umsatz_cent", "Gesamt", "cent")], zeilen, chart: { feld: "umsatz_cent", label: "tag" }, quelle: "lokal" };
    return { spalten: [sp("tag", "Tag", "datum"), sp("belege", "Belege", "zahl"), sp("stornos", "Stornos", "zahl"), sp("umsatz_cent", "Umsatz", "cent"), sp("bar_cent", "davon bar", "cent")], zeilen, chart: { feld: "umsatz_cent", label: "tag" }, quelle: "lokal" };
  }
  if (def.slug === "steuersatz") {
    const s = sollAusBelegen(echt);
    const zeilen = Object.entries(s.je_satz).map(([steuersatz, w]) => ({ steuersatz, anzahl: w.anzahl, netto_cent: w.netto_cent, ust_cent: w.ust_cent, brutto_cent: w.brutto_cent }));
    return { spalten: [sp("steuersatz", "Steuersatz"), sp("anzahl", "Positionen", "zahl"), sp("netto_cent", "Netto", "cent"), sp("ust_cent", "USt.", "cent"), sp("brutto_cent", "Brutto", "cent")], zeilen, quelle: "lokal" };
  }
  if (def.slug === "bediener") {
    const s = sollAusBelegen(echt);
    const zeilen = Object.entries(s.je_bediener).map(([bediener, w]) => ({ bediener, anzahl: w.anzahl, umsatz_cent: w.umsatz_cent, stornos: w.stornos }));
    return { spalten: [sp("bediener", "Bediener"), sp("anzahl", "Belege", "zahl"), sp("stornos", "Stornos", "zahl"), sp("umsatz_cent", "Umsatz", "cent")], zeilen, quelle: "lokal" };
  }
  if (def.slug === "gutscheine" || def.slug === "anzahlungen") {
    const arten = def.slug === "gutscheine" ? ["Gutschein Verkauf", "Gutschein Einloesung"] : ["Anzahlung", "Teilzahlung", "Schlusszahlung"];
    const zeilen = [];
    for (const b of echt) {
      for (const p of b.positionen || []) if (arten.includes(p.art)) zeilen.push({ zeit: b.datum_uhrzeit, beleg: b.name, art: p.art === "Gutschein Einloesung" ? "Gutschein eingelöst" : p.art === "Gutschein Verkauf" ? "Gutschein verkauft" : p.art, bezug: p.bezug || b.auftrag || b.rechnung || "", betrag_cent: p.brutto_cent });
      if (def.slug === "gutscheine") for (const z of b.zahlarten || []) if (z.zahlart === "Gutschein") zeilen.push({ zeit: b.datum_uhrzeit, beleg: b.name, art: "Gutschein eingelöst", bezug: z.gutschein || "", betrag_cent: -z.betrag_cent });
    }
    return { spalten: [sp("zeit", "Zeitpunkt", "zeit"), sp("beleg", "Beleg"), sp("art", "Art"), sp("bezug", "Bezug"), sp("betrag_cent", "Betrag", "cent")], zeilen, quelle: "lokal" };
  }
  if (def.slug === "klaerfaelle") {
    const zeilen = belege.filter((b) => b.nebenbuchung_status === "Fehler" || b.status === "Ausfall" || Number(b.see_ausgefallen)).map((b) => ({ zeit: b.datum_uhrzeit, beleg: b.name, fall: b.status === "Ausfall" || Number(b.see_ausgefallen) ? "Signatureinheit ausgefallen" : "Nebenbuchung fehlgeschlagen", betrag_cent: b.gesamt_cent }));
    return { spalten: [sp("zeit", "Zeitpunkt", "zeit"), sp("beleg", "Beleg"), sp("fall", "Fall"), sp("betrag_cent", "Betrag", "cent")], zeilen, quelle: "lokal" };
  }
  return { spalten: [], zeilen: [], quelle: "lokal" };
}

/** E-Mail/Benutzer → Anzeigename (ohne Klammerzusatz) für Listen ohne Avatar-Spalte. */
export async function personenNamen(client, ids = []) {
  const eindeutig = [...new Set(ids.filter(Boolean))];
  if (!eindeutig.length) return {};
  const zeilen = await client.getList("User", { fields: ["name", "full_name"], filters: [["name", "in", eindeutig]], limit: eindeutig.length }).catch(() => []);
  return Object.fromEntries(zeilen.map((u) => [u.name, String(u.full_name || u.name).split(" (")[0]]));
}
