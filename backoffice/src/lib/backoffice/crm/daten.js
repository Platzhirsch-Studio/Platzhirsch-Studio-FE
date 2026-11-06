import "server-only";
// Lesefunktionen des CRM (10-konzept-crm § 17.4). Nur aus Server Components / Server Actions.
// Jede Funktion bekommt den an die Sitzung gebundenen Client (`backoffice(session)`), Mock und Frappe gleich.
// Fehlendes Leserecht auf Nachbar-DocTypes (Faktura, Projekte, Service) blendet den Teil aus, statt zu werfen.

import { DEMO_BENUTZER } from "../auth/mockUsers.js";
import { darf, darfDoc } from "../auth/rechte.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { metaIndex } from "../frappe/meta.js";
import nachlaufCrm, { CRM_SEED_VERSION } from "../mock/seed/crm.js";
import { neuerName } from "../mock/engine.js";
import { rng, tage, erzeugeDokument } from "../mock/seed/basis.js";
import { faehigkeit } from "../faehigkeiten.js";
import { CRM_FAEHIGKEITEN } from "./faehigkeiten.js";
import { mailsUnzugeordnet, istMock } from "./backend.js";
import { gruppiereMails } from "./mails.js";
import { ANFRAGE_OFFEN, statusAnzeige } from "./status.js";
import { abgeleiteterStatus, alsDatum } from "./vorgang.js";
import { hrefFuer, zuErledigenZeilen } from "./zuErledigen.js";


// ---------------------------------------------------------------- Grundlagen --

/** Mock: Seed-Ergänzung des CRM für eine schon laufende Mock-Datenbank einmalig nachziehen. */
export function crmSeedSicherstellen(client) {
  if (!istMock(client)) return;
  const db = client.db?.db;
  if (!db || db.crmSeedVersion === CRM_SEED_VERSION) return;
  const hilfe = {
    rng: rng(424242),
    tage,
    index: client.index,
    tabelle: (dt) => client.tabelle(dt),
    naechste: (p) => client.naechsteNummer(p),
    erzeugeDokument,
    neuerName,
    kontakte: [...client.tabelle("PH Kontakt").values()],
  };
  nachlaufCrm(db, hilfe);
}

/** Sicher lesen: Fehler (Recht, fehlende App) → Rückfallwert. */
export async function sicher(fn, rueckfall) {
  try {
    return await fn();
  } catch {
    return rueckfall;
  }
}

/** Hat die Sitzung Leserecht auf den DocType (fehlender DocType → false)? */
export function darfLesen(session, doctype, aktion = "read") {
  const meta = metaIndex().doctypes.get(doctype);
  if (!meta) return false;
  try {
    return darfDoc(session, meta, aktion);
  } catch {
    return false;
  }
}

const ohneKlammer = (n) => String(n || "").replace(/\s*\(.*\)\s*$/, "").trim();

/** Personenverzeichnis user → {name, rolle} (Mock: Demo-Benutzer; Frappe: User). */
export async function personen(client) {
  if (istMock(client)) return Object.fromEntries(DEMO_BENUTZER.map((u) => [u.email, { name: ohneKlammer(u.name), user: u.email }]));
  const liste = await sicher(() => client.getList("User", { fields: ["name", "full_name"], filters: [["enabled", "=", 1], ["user_type", "=", "System User"]], limit: 200 }), []);
  return Object.fromEntries(liste.map((u) => [u.name, { name: u.full_name || u.name, user: u.name }]));
}

/** Berater-Auswahl (CRM-Rollen). */
export async function beraterListe(client) {
  if (istMock(client)) return DEMO_BENUTZER.filter((u) => u.roles.some((r) => /CRM|Geschäftsführung/.test(r))).map((u) => ({ wert: u.email, titel: ohneKlammer(u.name) }));
  const p = await personen(client);
  return Object.values(p).map((x) => ({ wert: x.user, titel: x.name }));
}

export const personName = (doc) => [doc?.vorname, doc?.nachname].filter(Boolean).join(" ") || doc?.firma || doc?.titel || "";
export const istLeitung = (session) => darf(session, "crm", "cancel") || (session?.roles || []).some((r) => r === "PH Geschäftsführung" || r === "PH Backoffice-Admin" || r === "System Manager");

const heuteIso = () => isoDatum(new Date());

// -------------------------------------------------------------- Anfragen --

/** Ansichten der Anfragenliste (§ 3.2) als Frappe-Filter. */
export function anfrageSicht(sicht, session) {
  switch (sicht) {
    case "neu":
      return { filters: [["status", "=", "Neu"]], orderBy: "eingang asc" };
    case "meine":
      return { filters: [["status", "in", ANFRAGE_OFFEN], ["zugewiesen_an", "=", session.user]] };
    case "gewonnen":
      return { filters: [["status", "=", "Gewonnen"]] };
    case "verloren":
      return { filters: [["status", "in", ["Verloren", "Spam"]]] };
    case "alle":
      return { filters: [] };
    default:
      return { filters: [["status", "in", ANFRAGE_OFFEN]] };
  }
}

/**
 * Anfragenliste mit abgeleitetem Status, Nachfass-Aufgabe und Zählern je Ansicht.
 * @param {{sicht?:string, q?:string, art?:string, zustaendig?:string, seite?:number, groesse?:number}} p
 */
export async function ladeAnfragen(session, client, p = {}) {
  crmSeedSicherstellen(client);
  const sicht = p.sicht || "offen";
  const s = anfrageSicht(sicht, session);
  const filters = [...s.filters];
  if (p.art) filters.push(["art", "=", p.art]);
  if (p.quelle) filters.push(["quelle", "=", p.quelle]);
  if (p.zustaendig === "ich") filters.push(["zugewiesen_an", "=", session.user]);
  else if (p.zustaendig === "niemand") filters.push(["zugewiesen_an", "in", ["", null]]);
  const q = String(p.q || "").trim();
  const orFilters = q ? ["nachname", "vorname", "email", "telefon", "firma", "name", "titel"].map((f) => [f, "like", `%${q}%`]) : undefined;
  const groesse = Math.min(Math.max(Number(p.groesse) || 25, 10), 100);
  const seite = Math.max(Number(p.seite) || 1, 1);
  const [zeilen, gesamt, zaehler] = await Promise.all([
    client.getList("PH Anfrage", { fields: ["*"], filters, orFilters, orderBy: s.orderBy || "eingang desc", limit: groesse, start: (seite - 1) * groesse }),
    client.count("PH Anfrage", { filters, orFilters }),
    anfrageZaehler(session, client),
  ]);
  const namen = zeilen.map((z) => z.name);
  const [termine, aufgaben, angebote] = await Promise.all([
    namen.length ? sicher(() => client.getList("PH Termin", { fields: ["name", "anfrage", "status", "start", "storno_grund"], filters: [["anfrage", "in", namen]], limit: 500 }), []) : [],
    namen.length ? sicher(() => client.getList("PH Aufgabe", { fields: ["name", "referenz_name", "faellig", "status", "titel"], filters: [["referenz_doctype", "=", "PH Anfrage"], ["referenz_name", "in", namen], ["status", "in", ["Offen", "In Arbeit"]]], orderBy: "faellig asc", limit: 500 }), []) : [],
    namen.length && darfLesen(session, "PH Angebot") ? sicher(() => client.getList("PH Angebot", { fields: ["name", "anfrage", "status", "creation"], filters: [["anfrage", "in", namen]], limit: 500 }), []) : [],
  ]);
  const p2 = await personen(client);
  const liste = zeilen.map((a) => {
    const abg = abgeleiteterStatus(a, { termine, angebote });
    const nach = aufgaben.find((k) => k.referenz_name === a.name) || null;
    return {
      ...a,
      person: personName(a),
      abgeleitet: abg,
      nachfassen: nach ? { name: nach.name, faellig: nach.faellig, titel: nach.titel } : null,
      zustaendigName: p2[a.zugewiesen_an]?.name || "",
    };
  });
  return { liste, gesamt, seite, groesse, zaehler, sicht };
}

/** Zähler je Ansicht (Segment). */
export async function anfrageZaehler(session, client) {
  const n = (sicht) => client.count("PH Anfrage", { filters: anfrageSicht(sicht, session).filters }).catch(() => 0);
  const [neu, meine, offen, gewonnen] = await Promise.all([n("neu"), n("meine"), n("offen"), n("gewonnen")]);
  return { neu, meine, offen, gewonnen };
}

/** Anfrage-Akte (§ 3.4) mit Vorgang und Bezügen. */
export async function ladeAnfrage(session, client, name) {
  crmSeedSicherstellen(client);
  const { doc, docinfo } = await client.getDocMitInfo("PH Anfrage", name);
  const [termine, aufgaben, angebote, auftraege, kontakt, duplikat] = await Promise.all([
    sicher(() => client.getList("PH Termin", { fields: ["*"], filters: [["anfrage", "=", name]], orderBy: "start desc", limit: 20 }), []),
    sicher(() => client.getList("PH Aufgabe", { fields: ["*"], filters: [["referenz_doctype", "=", "PH Anfrage"], ["referenz_name", "=", name]], orderBy: "faellig asc", limit: 20 }), []),
    darfLesen(session, "PH Angebot") ? sicher(() => client.getList("PH Angebot", { fields: ["name", "status", "creation", "datum", "netto_cent", "anfrage", "version"], filters: [["anfrage", "=", name]], limit: 20 }), []) : [],
    Promise.resolve([]),
    doc.kontakt ? sicher(() => client.getDoc("PH Kontakt", doc.kontakt), null) : null,
    doc.duplikat_von ? sicher(() => client.getDoc("PH Anfrage", doc.duplikat_von), null) : null,
  ]);
  const terminNamen = termine.map((t) => t.name);
  const gespraeche = terminNamen.length ? await sicher(() => client.getList("PH Beratungsgespraech", { fields: ["*"], filters: [["termin", "in", terminNamen]], limit: 20 }), []) : [];
  const ab = angebote.length && darfLesen(session, "PH Auftragsbestaetigung") ? await sicher(() => client.getList("PH Auftragsbestaetigung", { fields: ["name", "status", "datum", "creation", "angebot"], filters: [["angebot", "in", angebote.map((x) => x.name)]], limit: 10 }), []) : auftraege;
  const transitions = await sicher(() => client.getTransitions("PH Anfrage", name), []);
  return { doc, docinfo, termine, aufgaben, angebote, auftraege: ab, gespraeche, kontakt, duplikat, transitions, abgeleitet: abgeleiteterStatus(doc, { termine, angebote }), personen: await personen(client) };
}

// -------------------------------------------------------------- Kontakte --

export function kontaktSicht(sicht, session) {
  switch (sicht) {
    case "kunden":
      return [["status", "=", "Kunde"]];
    case "interessenten":
      return [["status", "=", "Interessent"]];
    case "meine":
      return [["berater", "=", session.user]];
    case "partner":
      return [["kontaktart", "in", ["Architekt", "Partner"]]];
    case "firmen":
      return [["kontaktart", "=", "Geschaeft"]];
    default:
      return [];
  }
}

export async function ladeKontakte(session, client, p = {}) {
  crmSeedSicherstellen(client);
  const filters = kontaktSicht(p.sicht, session);
  if (p.status) filters.push(["status", "=", p.status]);
  const q = String(p.q || "").trim();
  const orFilters = q ? ["titel", "nachname", "vorname", "email", "telefon", "ort", "firma", "name"].map((f) => [f, "like", `%${q}%`]) : undefined;
  const groesse = Math.min(Math.max(Number(p.groesse) || 25, 10), 100);
  const seite = Math.max(Number(p.seite) || 1, 1);
  const felder = ["name", "titel", "vorname", "nachname", "firma", "kontaktart", "status", "email", "telefon", "mobil", "plz", "ort", "berater", "letzter_kontakt", "letzter_kontakt_art", "nicht_kontaktieren", "anonymisiert_am", "firma_kontakt", "kunde_seit", "modified"];
  const [zeilen, gesamt] = await Promise.all([
    client.getList("PH Kontakt", { fields: felder, filters, orFilters, orderBy: "letzter_kontakt desc", limit: groesse, start: (seite - 1) * groesse }),
    client.count("PH Kontakt", { filters, orFilters }),
  ]);
  const firmen = zeilen.filter((z) => z.kontaktart === "Geschaeft").map((z) => z.name);
  const personenJeFirma = firmen.length ? await sicher(() => client.getList("PH Kontakt", { fields: ["name", "firma_kontakt"], filters: [["firma_kontakt", "in", firmen]], limit: 500 }), []) : [];
  const p2 = await personen(client);
  const zaehl = (sicht) => client.count("PH Kontakt", { filters: kontaktSicht(sicht, session) }).catch(() => 0);
  const [kunden, interessenten, meine, alle] = await Promise.all([zaehl("kunden"), zaehl("interessenten"), zaehl("meine"), zaehl("alle")]);
  return {
    liste: zeilen.map((k) => ({ ...k, beraterName: p2[k.berater]?.name || "", personen: personenJeFirma.filter((x) => x.firma_kontakt === k.name).length })),
    gesamt, seite, groesse, zaehler: { kunden, interessenten, meine, alle },
  };
}

/** Kundenakte (§ 4): Kopf, Vorgänge, Belege, Zeitleiste – je Bereich nur mit Leserecht. */
export async function ladeKundenakte(session, client, name) {
  crmSeedSicherstellen(client);
  const { doc, docinfo } = await client.getDocMitInfo("PH Kontakt", name);
  const nach = (dt, felder, extra = {}) => (darfLesen(session, dt) ? sicher(() => client.getList(dt, { fields: felder, filters: [["kontakt", "=", name]], limit: 50, ...extra }), []) : Promise.resolve(null));
  const [anfragen, termine, gespraeche, aufgaben, angebote, auftraege, rechnungen, lieferungen, montagen, servicefaelle, projekte, kundenkarte, dsa, firmenPersonen, firma] = await Promise.all([
    nach("PH Anfrage", ["*"], { orderBy: "eingang desc" }),
    nach("PH Termin", ["*"], { orderBy: "start desc" }),
    nach("PH Beratungsgespraech", ["*"], { orderBy: "datum desc" }),
    nach("PH Aufgabe", ["*"], { orderBy: "faellig asc" }),
    nach("PH Angebot", ["name", "status", "datum", "creation", "netto_cent", "brutto_cent", "waehrung", "anfrage", "titel", "owner"], { orderBy: "creation desc" }),
    nach("PH Auftragsbestaetigung", ["name", "status", "datum", "creation", "netto_cent", "brutto_cent", "waehrung", "anzahlung_soll_cent", "anzahlung_ist_cent", "liefer_kw", "titel", "owner", "bezahlt_cent", "offen_cent", "fagg_frist_ende", "vertragsort"], { orderBy: "creation desc" }),
    nach("PH Rechnung", ["name", "status", "art", "datum", "faellig", "brutto_cent", "offen_cent", "bezahlt_cent", "waehrung", "titel"], { orderBy: "datum desc" }),
    nach("PH Lieferschein", ["name", "status", "datum", "titel"], { orderBy: "datum desc" }),
    nach("PH Montageauftrag", ["name", "status", "start", "titel"], { orderBy: "start desc" }),
    nach("PH Servicefall", ["name", "status", "titel", "gemeldet_am", "creation", "verantwortlich"], { orderBy: "creation desc" }),
    nach("PH Projekt", ["name", "titel", "status", "projektart", "auftragswert_cent", "bezahlt_cent", "berater", "objekt_ort"], { orderBy: "modified desc" }),
    darfLesen(session, "PH Kundenkarte") ? sicher(() => client.getList("PH Kundenkarte", { fields: ["name", "kartennummer", "status", "stufe", "stufe_seit"], filters: [["kontakt", "=", name], ["status", "=", "Aktiv"]], limit: 1 }), []) : [],
    nach("PH Datenschutzanfrage", ["name", "art", "status", "frist", "eingang"]),
    sicher(() => client.getList("PH Kontakt", { fields: ["name", "titel", "funktion", "email", "telefon"], filters: [["firma_kontakt", "=", name]], limit: 20 }), []),
    doc.firma_kontakt ? sicher(() => client.getDoc("PH Kontakt", doc.firma_kontakt), null) : null,
  ]);
  const ab = auftraege || [];
  const positionen = [];
  const groessterAuftrag = ab.filter((a) => a.status !== "Storniert").sort((a, b) => (b.netto_cent || 0) - (a.netto_cent || 0))[0];
  if (groessterAuftrag) {
    const voll = await sicher(() => client.getDoc("PH Auftragsbestaetigung", groessterAuftrag.name), null);
    for (const p of voll?.positionen || []) positionen.push(p);
  }
  return {
    doc, docinfo,
    anfragen: anfragen || [], termine: termine || [], gespraeche: gespraeche || [], aufgaben: aufgaben || [],
    angebote, auftraege, rechnungen, lieferungen, montagen, servicefaelle, projekte, dsa: dsa || [],
    kundenkarte: kundenkarte?.[0] || null, firmenPersonen, firma, positionen, groessterAuftrag: groessterAuftrag || null,
    personen: await personen(client),
  };
}

// --------------------------------------------------------------- Termine --

/** Termine eines Zeitraums (Kalender/Liste). */
export async function ladeTermine(session, client, { von, bis, berater, sicht } = {}) {
  crmSeedSicherstellen(client);
  const filters = [];
  if (von) filters.push(["start", ">=", `${von} 00:00:00`]);
  if (bis) filters.push(["start", "<=", `${bis} 23:59:59`]);
  if (berater) filters.push(["berater", "=", berater]);
  if (sicht === "bestaetigen") filters.push(["status", "=", "Unbestaetigt"], ["email_verifiziert", "=", 1]);
  if (sicht === "meine") filters.push(["berater", "=", session.user]);
  if (sicht === "ohne-protokoll") filters.push(["status", "=", "Bestaetigt"], ["ende", "<", isoDatumZeit(new Date())]);
  const liste = await client.getList("PH Termin", { fields: ["*"], filters, orderBy: "start asc", limit: 400 });
  const p2 = await personen(client);
  return liste.map((t) => ({ ...t, beraterName: p2[t.berater]?.name || "", person: personName(t) }));
}

export async function ladeTermin(session, client, name) {
  crmSeedSicherstellen(client);
  const { doc, docinfo } = await client.getDocMitInfo("PH Termin", name);
  const [anfrage, kontakt, gespraech, aufgaben, transitions] = await Promise.all([
    doc.anfrage ? sicher(() => client.getDoc("PH Anfrage", doc.anfrage), null) : null,
    doc.kontakt ? sicher(() => client.getDoc("PH Kontakt", doc.kontakt), null) : null,
    doc.beratungsgespraech ? sicher(() => client.getDoc("PH Beratungsgespraech", doc.beratungsgespraech), null) : null,
    sicher(() => client.getList("PH Aufgabe", { fields: ["*"], filters: [["referenz_doctype", "=", "PH Termin"], ["referenz_name", "=", name]], limit: 10 }), []),
    sicher(() => client.getTransitions("PH Termin", name), []),
  ]);
  const weitere = doc.anfrage ? await sicher(() => client.getList("PH Termin", { fields: ["name", "status", "start", "anfrage"], filters: [["anfrage", "=", doc.anfrage]], limit: 20 }), [doc]) : [doc];
  return { doc, docinfo, anfrage, kontakt, gespraech, aufgaben, transitions, termine: weitere, personen: await personen(client) };
}

// ------------------------------------------------------------- Gespräche --

export async function ladeGespraeche(session, client, { sicht = "offen", q } = {}) {
  crmSeedSicherstellen(client);
  const filters = [];
  if (sicht === "offen") filters.push(["status", "!=", "Abgeschlossen"]);
  if (sicht === "meine") filters.push(["berater", "=", session.user]);
  if (sicht === "faellig") filters.push(["naechster_schritt_bis", "<=", heuteIso()], ["status", "!=", "Abgeschlossen"]);
  const orFilters = q ? ["titel", "name", "zusammenfassung"].map((f) => [f, "like", `%${q}%`]) : undefined;
  const liste = await client.getList("PH Beratungsgespraech", { fields: ["*"], filters, orFilters, orderBy: "datum desc", limit: 100 });
  const kontaktNamen = [...new Set(liste.map((g) => g.kontakt).filter(Boolean))];
  const kontakte = kontaktNamen.length ? await sicher(() => client.getList("PH Kontakt", { fields: ["name", "titel", "ort"], filters: [["name", "in", kontaktNamen]], limit: 200 }), []) : [];
  const voll = await Promise.all(liste.map((g) => (g.raeume ? g : sicher(() => client.getDoc("PH Beratungsgespraech", g.name), g))));
  const p2 = await personen(client);
  const zaehl = (f) => client.count("PH Beratungsgespraech", { filters: f }).catch(() => 0);
  const [offen, faellig, meine, alle] = await Promise.all([zaehl([["status", "!=", "Abgeschlossen"]]), zaehl([["naechster_schritt_bis", "<=", heuteIso()], ["status", "!=", "Abgeschlossen"]]), zaehl([["berater", "=", session.user]]), zaehl([])]);
  return {
    liste: voll.map((g) => ({ ...g, kontaktTitel: kontakte.find((k) => k.name === g.kontakt)?.titel || "", kontaktOrt: kontakte.find((k) => k.name === g.kontakt)?.ort || "", beraterName: p2[g.berater]?.name || "" })),
    zaehler: { offen, faellig, meine, alle },
  };
}

export async function ladeGespraech(session, client, name) {
  crmSeedSicherstellen(client);
  const { doc, docinfo } = await client.getDocMitInfo("PH Beratungsgespraech", name);
  const [kontakt, termin, vorlagen, aufgaben] = await Promise.all([
    doc.kontakt ? sicher(() => client.getDoc("PH Kontakt", doc.kontakt), null) : null,
    doc.termin ? sicher(() => client.getDoc("PH Termin", doc.termin), null) : null,
    sicher(() => client.getList("PH Beratungsvorlage", { fields: ["name", "titel"], limit: 50 }), []),
    sicher(() => client.getList("PH Aufgabe", { fields: ["*"], filters: [["referenz_doctype", "=", "PH Beratungsgespraech"], ["referenz_name", "=", name]], limit: 10 }), []),
  ]);
  const anfrage = termin?.anfrage ? await sicher(() => client.getDoc("PH Anfrage", termin.anfrage), null) : null;
  const angebote = anfrage && darfLesen(session, "PH Angebot") ? await sicher(() => client.getList("PH Angebot", { fields: ["name", "status", "creation"], filters: [["anfrage", "=", anfrage.name]], limit: 10 }), []) : [];
  return { doc, docinfo, kontakt, termin, anfrage, angebote, vorlagen, aufgaben, personen: await personen(client) };
}

// ------------------------------------------------------------ Datenschutz --

export async function ladeDatenschutz(session, client, { sicht = "offen" } = {}) {
  crmSeedSicherstellen(client);
  const filters = [];
  if (sicht === "offen") filters.push(["status", "in", ["Offen", "In Arbeit"]]);
  if (sicht === "frist") filters.push(["status", "in", ["Offen", "In Arbeit"]], ["frist", "<=", isoDatum(new Date(Date.now() + 7 * 86400000))]);
  if (sicht === "erledigt") filters.push(["status", "in", ["Erledigt", "Abgelehnt"]]);
  const liste = await client.getList("PH Datenschutzanfrage", { fields: ["*"], filters, orderBy: "frist asc", limit: 100 });
  const kNamen = [...new Set(liste.map((x) => x.kontakt).filter(Boolean))];
  const kontakte = kNamen.length ? await sicher(() => client.getList("PH Kontakt", { fields: ["name", "titel"], filters: [["name", "in", kNamen]], limit: 200 }), []) : [];
  const p2 = await personen(client);
  return liste.map((s) => ({ ...s, kontaktTitel: kontakte.find((k) => k.name === s.kontakt)?.titel || s.kontakt, zustaendigName: p2[s.zugewiesen_an]?.name || "" }));
}

export async function ladeDatenschutzanfrage(session, client, name) {
  crmSeedSicherstellen(client);
  const { doc, docinfo } = await client.getDocMitInfo("PH Datenschutzanfrage", name);
  const kontakt = doc.kontakt ? await sicher(() => client.getDoc("PH Kontakt", doc.kontakt), null) : null;
  return { doc, docinfo, kontakt, personen: await personen(client) };
}

// ---------------------------------------------------------------- E-Mails --

/** Nicht zugeordnete Mails (Live-Liste) + Fähigkeiten. Fehler/fehlende Verbindung → {fehler}. */
export async function ladeMails(session, client, { postfach, tage: t = 14 } = {}) {
  const [f, zuordnen, sperren, kontaktNeu] = await Promise.all([
    faehigkeit(session, "crm.mails", { katalog: CRM_FAEHIGKEITEN, client }),
    faehigkeit(session, "crm.mail-zuordnen", { katalog: CRM_FAEHIGKEITEN, client }),
    faehigkeit(session, "crm.adresse-sperren", { katalog: CRM_FAEHIGKEITEN, client }),
    faehigkeit(session, "crm.kontakt-aus-mail", { katalog: CRM_FAEHIGKEITEN, client }),
  ]);
  const faehig = { liste: f, zuordnen, sperren, kontaktNeu };
  if (!f.an) return { ...gruppiereMails([]), faehig, fehler: { code: "unavailable", nichtVerbunden: true } };
  try {
    crmSeedSicherstellen(client);
    const roh = await mailsUnzugeordnet(client, { postfach, tage: t });
    return { ...gruppiereMails(Array.isArray(roh) ? roh : roh?.mails || []), faehig, fehler: null, testdaten: istMock(client) };
  } catch (err) {
    return { ...gruppiereMails([]), faehig, fehler: { code: err?.code || "unavailable", message: err?.message || "" } };
  }
}

// -------------------------------------------------------------- Übersicht --

/** Zeilen „Zu erledigen“ für CRM-Übersicht und Zentrale (§ 3.1). */
export async function zuErledigen(session, client) {
  crmSeedSicherstellen(client);
  const jetzt = new Date();
  const ich = session.user;
  const leitung = istLeitung(session);
  const [neu, zuBestaetigen, ohneProtokoll, aufgaben, angenommen, dsa] = await Promise.all([
    sicher(() => client.getList("PH Anfrage", { fields: ["*"], filters: [["status", "=", "Neu"]], orderBy: "eingang asc", limit: 20 }), []),
    sicher(() => client.getList("PH Termin", { fields: ["*"], filters: [["status", "=", "Unbestaetigt"], ["email_verifiziert", "=", 1]], orderBy: "start asc", limit: 20 }), []),
    sicher(() => client.getList("PH Termin", { fields: ["*"], filters: [["status", "=", "Bestaetigt"], ["ende", "<", isoDatumZeit(jetzt)]], orderBy: "start asc", limit: 20 }), []),
    sicher(() => client.getList("PH Aufgabe", { fields: ["*"], filters: [["status", "in", ["Offen", "In Arbeit"]], ["faellig", "<=", isoDatum(jetzt)], ["zugewiesen_an", "=", ich]], orderBy: "faellig asc", limit: 20 }), []),
    sicher(() => client.getList("PH Anfrage", { fields: ["*"], filters: [["status", "in", ["Qualifiziert", "Termin vereinbart"]]], limit: 100 }), []),
    leitung ? sicher(() => client.getList("PH Datenschutzanfrage", { fields: ["*"], filters: [["status", "in", ["Offen", "In Arbeit"]], ["frist", "<=", isoDatum(new Date(jetzt.getTime() + 7 * 86400000))]], limit: 20 }), []) : [],
  ]);
  const anfrNamen = angenommen.map((a) => a.name);
  const termineAnfr = anfrNamen.length ? await sicher(() => client.getList("PH Termin", { fields: ["name", "anfrage", "status", "start", "modified"], filters: [["anfrage", "in", anfrNamen]], limit: 500 }), []) : [];
  const entfallen = angenommen
    .map((a) => ({ a, abg: abgeleiteterStatus(a, { termine: termineAnfr }) }))
    .filter((x) => x.abg.entfallen)
    .map((x) => ({ ...x.a, entfallenAm: termineAnfr.filter((t) => t.anfrage === x.a.name).sort((p, q) => String(q.modified).localeCompare(String(p.modified)))[0]?.modified }));
  const meinOderLeer = (u) => !u || u === ich || leitung;
  return zuErledigenZeilen({
    neu: neu.filter((a) => meinOderLeer(a.zugewiesen_an)),
    zuBestaetigen: zuBestaetigen.filter((t) => meinOderLeer(t.berater)),
    ohneProtokoll: ohneProtokoll.filter((t) => meinOderLeer(t.berater)),
    entfallen,
    aufgaben,
    datenschutz: dsa,
  }, { jetzt });
}

/** Übersicht `/crm` (§ 3.1): Heute, Zu erledigen, Mein Tag, Kennzahlen, Verkaufsverlauf. */
export async function ladeUebersicht(session, client, { zeitraumTage = 30 } = {}) {
  crmSeedSicherstellen(client);
  const jetzt = new Date();
  const heute = isoDatum(jetzt);
  const seit = isoDatumZeit(new Date(jetzt.getTime() - zeitraumTage * 86400000));
  const gestern = isoDatumZeit(new Date(jetzt.getTime() - 86400000));
  const leitung = istLeitung(session);
  const c = (dt, filters) => client.count(dt, { filters }).catch(() => 0);
  const [zeilen, heuteTermine, offeneAnfragen, neuSeitGestern, termine7, offeneAufgaben, ueberfaellig, vAnfragen, vTermine, vGespraeche, vAngebote, vAuftraege, aktivitaet, mails] = await Promise.all([
    zuErledigen(session, client),
    sicher(() => client.getList("PH Termin", { fields: ["*"], filters: [["start", ">=", `${heute} 00:00:00`], ["start", "<=", `${heute} 23:59:59`], ["status", "in", ["Unbestaetigt", "Bestaetigt", "Erledigt"]]], orderBy: "start asc", limit: 50 }), []),
    c("PH Anfrage", [["status", "in", ANFRAGE_OFFEN]]),
    c("PH Anfrage", [["status", "=", "Neu"], ["eingang", ">=", gestern]]),
    c("PH Termin", [["start", ">=", `${heute} 00:00:00`], ["start", "<=", `${isoDatum(new Date(jetzt.getTime() + 7 * 86400000))} 23:59:59`], ["status", "in", ["Unbestaetigt", "Bestaetigt"]]]),
    c("PH Aufgabe", [["status", "in", ["Offen", "In Arbeit"]], ["zugewiesen_an", "=", session.user]]),
    c("PH Aufgabe", [["status", "in", ["Offen", "In Arbeit"]], ["faellig", "<", heute], ["zugewiesen_an", "=", session.user]]),
    c("PH Anfrage", [["eingang", ">=", seit]]),
    c("PH Termin", [["creation", ">=", seit]]),
    c("PH Beratungsgespraech", [["creation", ">=", seit]]),
    darfLesen(session, "PH Angebot") ? c("PH Angebot", [["creation", ">=", seit], ["status", "!=", "Ersetzt"]]) : Promise.resolve(null),
    darfLesen(session, "PH Auftragsbestaetigung") ? c("PH Auftragsbestaetigung", [["creation", ">=", seit], ["status", "!=", "Storniert"]]) : Promise.resolve(null),
    sicher(() => client.getList("PH Anfrage", { fields: ["name", "titel", "status", "modified", "modified_by", "vorname", "nachname"], orderBy: "modified desc", limit: 6 }), []),
    sicher(() => ladeMails(session, client), { gesamt: 0, faehig: { liste: { an: false } } }),
  ]);
  const p2 = await personen(client);
  const meinTag = heuteTermine.filter((t) => leitung || t.berater === session.user || !t.berater).map((t) => ({ ...t, person: personName(t), beraterName: p2[t.berater]?.name || "" }));
  const naechster = meinTag.length ? null : await sicher(() => client.getList("PH Termin", { fields: ["*"], filters: [["start", ">", `${heute} 23:59:59`], ["status", "in", ["Unbestaetigt", "Bestaetigt"]]], orderBy: "start asc", limit: 1 }).then((l) => l[0] || null), null);
  const zuBestaetigen = zeilen.filter((z) => z.art === "bestaetigen").length;
  const neuAnzahl = zeilen.filter((z) => z.art === "neu").length;
  return {
    zeilen,
    heute: { termine: meinTag.filter((t) => t.status !== "Erledigt").length, bestaetigen: zuBestaetigen, neu: neuAnzahl, ueberfaellig },
    meinTag, naechster: naechster ? { ...naechster, person: personName(naechster) } : null,
    kennzahlen: { offeneAnfragen, neuSeitGestern, termine7, offeneAufgaben },
    verlauf: leitung ? [
      { id: "anfragen", titel: "Anfragen", wert: vAnfragen, href: "/crm/anfragen?sicht=alle" },
      { id: "termine", titel: "Termine", wert: vTermine, href: "/crm/termine?ansicht=liste" },
      { id: "gespraeche", titel: "Gespräche", wert: vGespraeche, href: "/crm/gespraeche?sicht=alle" },
      { id: "angebote", titel: "Angebote", wert: vAngebote, href: "/d/ph-angebot" },
      { id: "auftraege", titel: "Aufträge", wert: vAuftraege, href: "/d/ph-auftragsbestaetigung" },
    ] : null,
    aktivitaet: aktivitaet.map((a) => ({ ...a, person: personName(a), wer: p2[a.modified_by]?.name || "", status: statusAnzeige("anfrage", a.status) })),
    mails: { anzahl: mails?.gesamt || 0, an: !!mails?.faehig?.liste?.an },
    leitung,
  };
}

// --------------------------------------------------------------- Berichte --

/** Kennzahlen für die Berichtsseite (§ 3.10), nur Anzahlen – Beträge kommen aus Faktura. */
export async function ladeBerichte(session, client, { tage: t = 90 } = {}) {
  crmSeedSicherstellen(client);
  const seit = isoDatumZeit(new Date(Date.now() - t * 86400000));
  const leitung = istLeitung(session);
  const filterEigen = leitung ? [] : [["zugewiesen_an", "=", session.user]];
  const anfragen = await sicher(() => client.getList("PH Anfrage", { fields: ["name", "art", "quelle", "status", "eingang", "verloren_grund", "zugewiesen_an"], filters: [["eingang", ">=", seit], ...filterEigen], limit: 2000 }), []);
  const termine = await sicher(() => client.getList("PH Termin", { fields: ["name", "modus", "status", "start", "berater", "storno_grund"], filters: [["start", ">=", seit], ...(leitung ? [] : [["berater", "=", session.user]])], limit: 2000 }), []);
  const p2 = await personen(client);
  const zaehle = (liste, schluessel) => {
    const m = new Map();
    for (const x of liste) {
      const k = schluessel(x);
      if (!k) continue;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].map(([label, wert]) => ({ label, wert })).sort((a, b) => b.wert - a.wert);
  };
  const wochen = [];
  const jetzt = new Date();
  const anzahlWochen = Math.min(13, Math.ceil(t / 7));
  for (let i = anzahlWochen - 1; i >= 0; i--) {
    const ende = new Date(jetzt.getTime() - i * 7 * 86400000);
    const start = new Date(ende.getTime() - 7 * 86400000);
    const n = anfragen.filter((a) => {
      const d = alsDatum(a.eingang);
      return d && d > start && d <= ende;
    }).length;
    wochen.push({ label: `${String(start.getDate()).padStart(2, "0")}.${String(start.getMonth() + 1).padStart(2, "0")}.`, wert: n });
  }
  const { CRM_TEXTE: T } = await import("./texte.js");
  return {
    leitung,
    wochen,
    nachArt: zaehle(anfragen, (a) => T.art[a.art] || a.art),
    nachQuelle: zaehle(anfragen, (a) => T.quelle[a.quelle] || a.quelle),
    termineModus: zaehle(termine.filter((x) => !/E-Mail nicht bestätigt/.test(x.storno_grund || "")), (x) => T.modus[x.modus] || x.modus),
    verlust: leitung ? zaehle(anfragen.filter((a) => a.status === "Verloren"), (a) => a.verloren_grund || "ohne Grund") : null,
    berater: zaehle(termine.filter((x) => !/E-Mail nicht bestätigt/.test(x.storno_grund || "")), (x) => p2[x.berater]?.name || "ohne Berater"),
    summen: { anfragen: anfragen.length, termine: termine.length, gewonnen: anfragen.filter((a) => a.status === "Gewonnen").length },
  };
}

// ---------------------------------------------------------- Einstellungen --

export async function ladeEinstellungen(session, client) {
  crmSeedSicherstellen(client);
  const [verfuegbarkeit, terminarten, einst] = await Promise.all([
    sicher(() => client.getList("PH Verfuegbarkeit", { fields: ["*"], orderBy: "wochentag asc", limit: 500 }), []),
    sicher(() => client.getList("PH Terminart", { fields: ["*"], limit: 100 }), []),
    sicher(() => client.getDoc("PH Termin Einstellungen", "PH Termin Einstellungen"), null),
  ]);
  return { verfuegbarkeit, terminarten, einstellungen: einst, berater: await beraterListe(client), leitung: istLeitung(session) };
}

export { hrefFuer };
