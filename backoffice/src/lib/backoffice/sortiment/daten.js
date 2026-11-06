// Bereich Sortiment – Lesefunktionen für die Seiten (10-konzept-sortiment § 16.1, § 20.4). Nur Server.
// Liest über backoffice(session) (Mock oder Frappe), Feldlisten statt „*“, entfernt EK/Notizen für Rollen ohne
// permlevel 1 (rollen.ohneIntern). Im Mock wird der fachliche Seed einmal nachgezogen, falls die laufende
// Datenbank älter ist als der Bereichs-Seed (kein Neustart des Dev-Servers nötig).
import "server-only";

import { requireDocRecht, requireSession } from "../auth/dal.js";
import { backoffice, ladeMeta } from "../frappe/index.js";
import { darfDoc } from "../auth/rechte.js";
import nachlauf, { SEED_MARKE, SEED_VERSION } from "../mock/seed/sortiment.js";
import { EINST, einstellungen } from "./methoden.js";
import { istLeitung, ohneIntern, siehtEk } from "./rollen.js";
import { abUeberfaellig, bestellSperrgrund, isoTag, plusTage, preisZustand, tageZwischen } from "./regeln.js";
import { BESTELL_SEGMENTE, OFFENE_BESTELLSTATUS } from "./status.js";
import { ZUTUN } from "./texte.js";
import { datum as datumText } from "../format.js";

const bestellSperrgrundEingang = (b) => bestellSperrgrund(b, "eingang");

export const SEITE = 25;

/** Mock: fachlichen Seed einmal nachziehen (laufende Datenbank aus der Zeit vor B-SOR). */
export function mockNachzug(client) {
  if (client?.modus !== "mock") return;
  const db = client.db?.db;
  if (!db) return;
  const e = db.get(EINST)?.get(EINST);
  if (e?.[SEED_MARKE] === SEED_VERSION) return;
  // Gleiche Nummern wie beim frischen Aufbau: die generische Erzeugung belegt je Serie 1–6.
  for (const p of ["HB-2026-", "WE-2026-", "PH-PLI-2026-"]) client.db.zaehler?.set?.(p, Math.min(6, client.db.zaehler.get(p) || 6));
  nachlauf(db, { naechste: (p) => client.naechsteNummer(p) });
}

/**
 * Sitzung, Client und Recht für eine Sortiment-Seite. Ohne Sitzung → Login, ohne DocType-Recht → /kein-zugriff.
 * @param {{pfad:string, doctype?:string, aktion?:string}} p
 */
export async function sortimentKontext({ pfad, doctype = "PH Produkt", aktion = "read" }) {
  const session = await requireSession(pfad);
  const client = backoffice(session);
  mockNachzug(client);
  const meta = await ladeMeta(client, doctype);
  await requireDocRecht(meta, aktion, pfad);
  return { session, client, meta, leitung: istLeitung(session), ek: siehtEk(session), darf: (dt, a = "read") => darfDocName(client, session, dt, a) };
}

async function darfDocName(client, session, doctype, aktion) {
  try {
    return darfDoc(session, await ladeMeta(client, doctype), aktion);
  } catch {
    return false;
  }
}

/** Fehler einer Teilabfrage als Wert statt Absturz (Q-E1: Block „Nicht geladen“). */
export async function sicher(promise, ersatz = null) {
  try {
    return { ok: true, wert: await promise };
  } catch (err) {
    return { ok: false, wert: ersatz, code: err?.code || "unavailable" };
  }
}

function heute(client) {
  return isoTag(client.jetzt ? client.jetzt() : new Date());
}

// ------------------------------------------------------------------ Produkte --

export const PRODUKT_FELDER = ["name", "titel", "name_herstellerbezeichnung", "marke", "kategorie", "status", "typ", "welt", "bild_hauptbild", "bild_freigegeben", "bilder_anzahl", "bilder_offen", "aktueller_preis_cent", "aktueller_preis_stand", "preisstand_alt", "preisart", "verkauf_online", "website_sichtbar", "abverkauf", "hersteller_artikelnr", "modified", "lieferzeit_freigegeben", "lieferzeit_wochen_von", "lieferzeit_wochen_bis", "sofort_lieferbar", "veroeffentlicht_am", "kurz_de", "ust_klasse", "grundpreis_einheit", "grundpreis_menge"];

/** Systemansichten der Produktliste (§ 3.2). */
export const PRODUKT_ANSICHTEN = Object.freeze({
  alle: [],
  wartet: [["status", "=", "Geprueft"]],
  veraltet: [["preisstand_alt", "=", 1]],
  ohneBild: [["bild_freigegeben", "=", 0], ["status", "!=", "Ausgelaufen"]],
  shop: [["verkauf_online", "=", 1]],
  abverkauf: [["abverkauf", "=", 1]],
});

/** Filter der Produktliste aus den URL-Parametern. */
export function produktFilter(sp = {}) {
  const f = [...(PRODUKT_ANSICHTEN[sp.sicht] || [])];
  if (sp.status) f.push(["status", "in", String(sp.status).split(",").filter(Boolean)]);
  else if (!sp.mitAusgelaufen && (!sp.sicht || sp.sicht === "alle")) f.push(["status", "!=", "Ausgelaufen"]);
  if (sp.marke) f.push(["marke", "=", sp.marke]);
  if (sp.kategorie) f.push(["kategorie", "=", sp.kategorie]);
  if (sp.welt) f.push(["welt", "=", sp.welt]);
  const orFilters = sp.q ? ["name_herstellerbezeichnung", "titel", "hersteller_artikelnr", "ean", "collection", "slug"].map((x) => [x, "like", `%${sp.q}%`]) : undefined;
  return { filters: f, orFilters };
}

export async function produkteListe(client, sp = {}, { limit = SEITE } = {}) {
  const seite = Math.max(1, Number(sp.seite) || 1);
  const { filters, orFilters } = produktFilter(sp);
  const [zeilen, gesamt] = await Promise.all([client.getList("PH Produkt", { fields: PRODUKT_FELDER, filters, orFilters, orderBy: "modified desc", limit, start: (seite - 1) * limit }), client.count("PH Produkt", { filters, orFilters })]);
  return { zeilen, gesamt, seite, limit };
}

/** Zähler je Systemansicht (für das Segment). */
export async function produktAnsichtZaehler(client) {
  const eintraege = await Promise.all(Object.entries(PRODUKT_ANSICHTEN).map(async ([k, f]) => [k, await client.count("PH Produkt", { filters: k === "alle" ? [["status", "!=", "Ausgelaufen"]] : f })]));
  return Object.fromEntries(eintraege);
}

/** Kanban: Entwurf · Wartet · Veröffentlicht (14 Tage) · Pausiert. */
export async function produktKanban(client, sp = {}) {
  const { filters, orFilters } = produktFilter({ ...sp, sicht: "alle" });
  const basis = filters.filter((f) => f[0] !== "status");
  const vor14 = `${plusTage(heute(client), -14)} 00:00:00`;
  const spalten = [
    ["Entwurf", [["status", "=", "Entwurf"]]],
    ["Geprueft", [["status", "=", "Geprueft"]]],
    ["Aktiv", [["status", "=", "Aktiv"], ["veroeffentlicht_am", ">=", vor14]]],
    ["Pausiert", [["status", "=", "Pausiert"]]],
  ];
  return Promise.all(spalten.map(async ([status, f]) => ({ status, karten: await client.getList("PH Produkt", { fields: PRODUKT_FELDER, filters: [...basis, ...f], orFilters, orderBy: "modified desc", limit: 60 }) })));
}

/** Auswahllisten für Filter und Formulare. */
export async function stammAuswahl(client) {
  const [marken, kategorien, lieferanten] = await Promise.all([
    client.getList("PH Marke", { fields: ["name", "status", "haendlerstatus", "lieferant"], orderBy: "name asc", limit: 200 }).catch(() => []),
    client.getList("PH Kategorie", { fields: ["name", "label_de", "ust_klasse", "grundpreis_pflicht", "welt", "status"], orderBy: "sortierung asc", limit: 300 }).catch(() => []),
    client.getList("PH Lieferant", { fields: ["name", "firmenname", "marke", "bestellweg", "bestell_email", "status"], orderBy: "name asc", limit: 200 }).catch(() => []),
  ]);
  return { marken, kategorien, lieferanten };
}

/** Produktakte: Produkt, Marke, Kategorie, Ausführungen, Verknüpfungen, Verlauf. */
export async function produktAkte(client, session, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Produkt", name);
  const [marke, kategorie, ausfuehrungen, bestellungen] = await Promise.all([
    doc.marke ? client.getDoc("PH Marke", doc.marke).catch(() => null) : null,
    doc.kategorie ? client.getDoc("PH Kategorie", doc.kategorie).catch(() => null) : null,
    client.getList("PH Produkt Ausfuehrung", { fields: ["name", "gruppe_key", "option_id", "name_de", "code", "farbe_hex", "standard", "status", "preisgruppe", "reihenfolge"], filters: [["produkt", "=", name]], orderBy: "reihenfolge asc", limit: 200 }).catch(() => []),
    verknuepfteBestellungen(client, name),
  ]);
  return { doc: ohneIntern(doc, session), docinfo, marke, kategorie, ausfuehrungen, bestellungen };
}

async function verknuepfteBestellungen(client, produkt) {
  try {
    // Positionen sind eine Kindtabelle: je offene Bestellung die Akte lesen (Q-L3: höchstens 30).
    const offen = await client.getList("PH Herstellerbestellung", { fields: ["name"], filters: [["status", "not in", ["Abgeschlossen", "Storniert"]]], orderBy: "modified desc", limit: 30 });
    const docs = await Promise.all(offen.map((b) => client.getDoc("PH Herstellerbestellung", b.name).catch(() => null)));
    return docs.filter((b) => b && (b.positionen || []).some((p) => p.produkt === produkt)).map((b) => ({ name: b.name, status: b.status, lieferant: b.lieferant, kommission: b.kommission }));
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------- Marken --

export async function markenListe(client, sp = {}) {
  const f = [];
  if (sp.haendler) f.push(["haendlerstatus", "=", sp.haendler]);
  const or = sp.q ? [["marke", "like", `%${sp.q}%`]] : undefined;
  return client.getList("PH Marke", { fields: ["name", "marke", "status", "welt", "land", "haendlerstatus", "bildfreigabe_status", "lieferant", "vertrag_gueltig_bis", "produkte_anzahl", "bild_anhagen", "bestellweg", "website_sichtbar"], filters: f, orFilters: or, orderBy: "sortierung asc", limit: 200 });
}

export async function markeAkte(client, session, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Marke", name);
  const [produkte, offen, lieferant] = await Promise.all([
    client.getList("PH Produkt", { fields: PRODUKT_FELDER, filters: [["marke", "=", name], ["status", "!=", "Ausgelaufen"]], orderBy: "modified desc", limit: 200 }),
    client.getList("PH Herstellerbestellung", { fields: ["name", "status", "kommission", "bestaetigter_termin", "wunschtermin", "lieferant"], filters: [["marke", "=", name], ["status", "not in", ["Abgeschlossen", "Storniert"]]], orderBy: "modified desc", limit: 50 }).catch(() => []),
    doc.lieferant ? client.getDoc("PH Lieferant", doc.lieferant).catch(() => null) : null,
  ]);
  return { doc: ohneIntern(doc, session), docinfo, produkte, offen, lieferant: lieferant ? ohneIntern(lieferant, session) : null };
}

// ------------------------------------------------------------- Lieferanten --

export async function lieferantenListe(client, sp = {}) {
  const or = sp.q ? [["firmenname", "like", `%${sp.q}%`], ["marke", "like", `%${sp.q}%`]] : undefined;
  const [liste, offen] = await Promise.all([
    client.getList("PH Lieferant", { fields: ["name", "firmenname", "marke", "status", "land", "ort", "bestellweg", "bestell_email", "gln", "lieferzeit_wochen_standard", "ab_erwartet_tage"], orFilters: or, orderBy: "name asc", limit: 200 }),
    client.getList("PH Herstellerbestellung", { fields: ["name", "lieferant", "status"], filters: [["status", "in", ["Entwurf", ...OFFENE_BESTELLSTATUS]]], limit: 500 }).catch(() => []),
  ]);
  return liste.map((l) => ({ ...l, offen: offen.filter((b) => b.lieferant === l.name && b.status !== "Entwurf").length, entwuerfe: offen.filter((b) => b.lieferant === l.name && b.status === "Entwurf").length }));
}

export async function lieferantAkte(client, session, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Lieferant", name);
  const [bestellungen, marken] = await Promise.all([
    client.getList("PH Herstellerbestellung", { fields: BESTELL_FELDER, filters: [["lieferant", "=", name]], orderBy: "datum desc", limit: 50 }),
    client.getList("PH Marke", { fields: ["name", "haendlerstatus", "status", "bild_anhagen"], filters: [["lieferant", "=", name]], limit: 50 }).catch(() => []),
  ]);
  return { doc: ohneIntern(doc, session), docinfo, bestellungen: bestellungen.map((b) => ohneIntern(b, session)), marken };
}

// ------------------------------------------------------------- Bestellungen --

export const BESTELL_FELDER = ["name", "titel", "lieferant", "marke", "status", "kommission", "datum", "wunschtermin", "bestaetigter_termin", "gesendet_am", "ab_nummer", "ab_datum", "abweichungen_anzahl", "abweichungen_offen", "ab_vollstaendig", "summe_ek_cent", "menge_bestellt", "menge_erhalten", "uebermittlung_weg", "uebermittlung_status", "lieferadresse", "bezug_doctype", "bezug_name", "modified", "bestellweg"];

export function bestellFilter(sp = {}) {
  const f = [];
  const seg = BESTELL_SEGMENTE[sp.segment];
  if (seg) f.push(["status", "in", seg]);
  else if (!sp.segment || sp.segment === "alle") f.push(["status", "!=", "Storniert"]);
  if (sp.lieferant) f.push(["lieferant", "=", sp.lieferant]);
  if (sp.ohneLieferant) f.push(["lieferant", "is", "not set"]);
  const or = sp.q ? [["name", "like", `%${sp.q}%`], ["kommission", "like", `%${sp.q}%`], ["ab_nummer", "like", `%${sp.q}%`], ["titel", "like", `%${sp.q}%`]] : undefined;
  return { filters: f, orFilters: or };
}

export async function bestellungenListe(client, session, sp = {}) {
  const seite = Math.max(1, Number(sp.seite) || 1);
  const { filters, orFilters } = bestellFilter(sp);
  const [zeilen, gesamt] = await Promise.all([client.getList("PH Herstellerbestellung", { fields: BESTELL_FELDER, filters, orFilters, orderBy: "datum desc", limit: SEITE, start: (seite - 1) * SEITE }), client.count("PH Herstellerbestellung", { filters, orFilters })]);
  return { zeilen: zeilen.map((z) => ohneIntern(z, session)), gesamt, seite, limit: SEITE };
}

export async function bestellSegmentZaehler(client) {
  return Object.fromEntries(await Promise.all(Object.entries(BESTELL_SEGMENTE).map(async ([k, s]) => [k, await client.count("PH Herstellerbestellung", { filters: s ? [["status", "in", s]] : [["status", "!=", "Storniert"]] })])));
}

export async function bestellKanban(client, session, sp = {}) {
  const { orFilters } = bestellFilter(sp);
  const extra = sp.lieferant ? [["lieferant", "=", sp.lieferant]] : [];
  const spalten = ["Entwurf", "Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert", "Geliefert"];
  return Promise.all(spalten.map(async (status) => ({ status, karten: (await client.getList("PH Herstellerbestellung", { fields: BESTELL_FELDER, filters: [["status", "=", status], ...extra], orFilters, orderBy: "datum desc", limit: 60 })).map((z) => ohneIntern(z, session)) })));
}

export async function bestellAkte(client, session, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Herstellerbestellung", name);
  const [lieferant, eingaenge, einst] = await Promise.all([
    doc.lieferant ? client.getDoc("PH Lieferant", doc.lieferant).catch(() => null) : null,
    client.getList("PH Wareneingang", { fields: ["name", "status", "datum", "lieferschein_nr_lieferant", "packstuecke", "spediteur"], filters: [["herstellerbestellung", "=", name]], orderBy: "datum desc", limit: 20 }).catch(() => []),
    einstellungen(client),
  ]);
  const produkte = new Map();
  const namen = [...new Set((doc.positionen || []).map((p) => p.produkt).filter(Boolean))];
  if (namen.length) {
    const liste = await client.getList("PH Produkt", { fields: ["name", "bild_hauptbild", "titel", "marke"], filters: [["name", "in", namen]], limit: namen.length }).catch(() => []);
    for (const p of liste) produkte.set(p.name, p);
  }
  return { doc: ohneIntern(doc, session), docinfo, lieferant: lieferant ? ohneIntern(lieferant, session) : null, eingaenge, einst: { ab_toleranz_preis_prozent: einst.ab_toleranz_preis_prozent || 0, ab_toleranz_termin_tage: einst.ab_toleranz_termin_tage || 0, eigene_gln: einst.eigene_gln || "" }, bilder: Object.fromEntries([...produkte].map(([k, v]) => [k, v.bild_hauptbild || ""])) };
}

// ------------------------------------------------------------- Wareneingang --

export const WE_FELDER = ["name", "titel", "herstellerbestellung", "lieferant", "kommission", "status", "datum", "lieferschein_nr_lieferant", "packstuecke", "spediteur", "servicefall_ref", "modified"];

export async function wareneingangListe(client, sp = {}) {
  const seite = Math.max(1, Number(sp.seite) || 1);
  const f = sp.status ? [["status", "=", sp.status]] : [];
  const or = sp.q ? [["name", "like", `%${sp.q}%`], ["herstellerbestellung", "like", `%${sp.q}%`], ["lieferschein_nr_lieferant", "like", `%${sp.q}%`], ["kommission", "like", `%${sp.q}%`]] : undefined;
  const [zeilen, gesamt] = await Promise.all([client.getList("PH Wareneingang", { fields: WE_FELDER, filters: f, orFilters: or, orderBy: "datum desc", limit: SEITE, start: (seite - 1) * SEITE }), client.count("PH Wareneingang", { filters: f, orFilters: or })]);
  return { zeilen, gesamt, seite, limit: SEITE };
}

/** Erwartete Lieferungen (AB bestätigt / teilweise geliefert, Termin bis heute + 7, nicht Strecke). */
export async function erwarteteLieferungen(client, { tage = 7 } = {}) {
  const bis = plusTage(heute(client), tage);
  const liste = await client.getList("PH Herstellerbestellung", { fields: BESTELL_FELDER, filters: [["status", "in", ["AB geprueft", "Teilgeliefert"]], ["lieferadresse", "!=", "Kunde direkt"]], orderBy: "bestaetigter_termin asc", limit: 50 });
  return liste.filter((b) => !b.bestaetigter_termin || b.bestaetigter_termin <= bis);
}

export async function weAkte(client, session, name) {
  const { doc, docinfo } = await client.getDocMitInfo("PH Wareneingang", name);
  const hb = doc.herstellerbestellung ? await client.getDoc("PH Herstellerbestellung", doc.herstellerbestellung).catch(() => null) : null;
  return { doc, docinfo, bestellung: hb ? ohneIntern(hb, session) : null };
}

// --------------------------------------------------------------- Freigaben --

/**
 * Was auf Freigabe wartet (§ 3.9): Bilder (Freigabe offen), Preise (freigegeben = 0), Lieferzeiten.
 * → { bilder:[…], preise:[…], lieferzeiten:[…], marken:[{name, n, beleg}] }
 */
export async function freigabenLaden(client, { marke = "" } = {}) {
  const f = [["status", "!=", "Ausgelaufen"]];
  if (marke) f.push(["marke", "=", marke]);
  const namen = await client.getList("PH Produkt", { fields: ["name", "bilder_offen", "lieferzeit_freigegeben", "marke"], filters: f, limit: 500 });
  const markenDocs = await client.getList("PH Marke", { fields: ["name", "bildfreigabe_status", "bildfreigabe_datum", "haendlerstatus"], limit: 200 }).catch(() => []);
  const belegt = new Map(markenDocs.map((m) => [m.name, m.bildfreigabe_status === "schriftlich erteilt"]));
  const bilder = [];
  const preise = [];
  const lieferzeiten = [];
  // Kindtabellen nur je Dokument lesbar – begrenzt auf Produkte mit Hinweis auf Offenes (Q-L3: höchstens 40 Akten).
  const kandidaten = namen.filter((p) => Number(p.bilder_offen) > 0 || !p.lieferzeit_freigegeben).map((p) => p.name);
  const mitPreisen = namen.map((p) => p.name);
  const zuLesen = [...new Set([...kandidaten, ...mitPreisen])].slice(0, 80);
  const docs = await Promise.all(zuLesen.map((n) => client.getDoc("PH Produkt", n).catch(() => null)));
  for (const p of docs.filter(Boolean)) {
    for (const b of p.bilder || []) {
      if ((b.freigabe || "offen") === "offen") bilder.push({ produkt: p.name, titel: p.titel, marke: p.marke, zeile: b.name, bild: b.bild, typ: b.typ, quelle: b.quelle_url || "", beleg: !!belegt.get(p.marke), status: p.status });
    }
    for (const z of p.preise || []) {
      if (!z.freigegeben) {
        const bisher = (p.preise || []).filter((x) => x.freigegeben && x.preisart === z.preisart && !x.ausfuehrung).sort((a, b) => String(b.ab).localeCompare(String(a.ab)))[0];
        preise.push({ produkt: p.name, titel: p.titel, marke: p.marke, zeile: z.name, bild: p.bild_hauptbild, neu: z.brutto_cent, bisher: bisher?.brutto_cent ?? null, preisart: z.preisart, stand: z.stand, ab: z.ab, quelle: z.quelle, quelleUrl: z.quelle_url || "" });
      }
    }
    if (!p.lieferzeit_freigegeben && (p.lieferzeit_wochen_von || p.lieferzeit_wochen_bis) && p.status !== "Entwurf") lieferzeiten.push({ produkt: p.name, titel: p.titel, marke: p.marke, bild: p.bild_hauptbild, von: p.lieferzeit_wochen_von, bis: p.lieferzeit_wochen_bis, imShop: !!p.verkauf_online });
  }
  const zaehle = (liste) => liste.reduce((m, x) => m.set(x.marke, (m.get(x.marke) || 0) + 1), new Map());
  const n = zaehle([...bilder, ...preise, ...lieferzeiten]);
  return { bilder, preise, lieferzeiten, marken: [...n].map(([name, anzahl]) => ({ name, anzahl, beleg: !!belegt.get(name) })).sort((a, b) => b.anzahl - a.anzahl) };
}

// --------------------------------------------------------------- Preislisten --

export async function preislistenListe(client) {
  return client.getList("PH Preisliste Import", { fields: ["name", "titel", "marke", "preisart", "stand", "status", "zeilen_anzahl", "zeilen_auffaellig", "zeilen_ohne_produkt", "modified", "lieferant"], orderBy: "modified desc", limit: 100 });
}

// ---------------------------------------------------------- Bestellvorschläge --

export async function vorschlaegeListe(client, { status = "Offen" } = {}) {
  const f = status ? [["status", "=", status]] : [];
  const liste = await client.getList("PH Bestellvorschlag", { fields: ["name", "titel", "status", "produkt", "produkt_name", "marke", "lieferant", "lagerort", "verfuegbar", "meldebestand", "zielbestand", "vorschlag_menge", "bestellmenge_min", "ek_cent", "wert_cent", "voraussichtlich_am", "herstellerbestellung", "erstellt_am", "offen_bestellt", "bestand", "reserviert"], filters: f, orderBy: "erstellt_am desc", limit: 100 });
  const namen = [...new Set(liste.map((v) => v.produkt).filter(Boolean))];
  const bilder = namen.length ? await client.getList("PH Produkt", { fields: ["name", "bild_hauptbild"], filters: [["name", "in", namen]], limit: namen.length }).catch(() => []) : [];
  const b = new Map(bilder.map((p) => [p.name, p.bild_hauptbild]));
  return liste.map((v) => ({ ...v, bild: b.get(v.produkt) || "" }));
}

// ------------------------------------------------------- Bereichsstart: Zu tun --

/**
 * „Zu tun“-Gruppen (§ 3.1) in fester Reihenfolge; leere Gruppen entfallen. Jede Zeile: titel, unter, href,
 * knopf{titel, href}. Gruppen mit Leitungsentscheidung zeigen dem Team „Leitung entscheidet“.
 */
export async function zuTunGruppen(client, session, { max = 5 } = {}) {
  const leitung = istLeitung(session);
  const t = heute(client);
  const in7 = plusTage(t, 7);
  const [bestellungen, lieferanten, eingaenge, wartet, veraltet, listen, marken, vorschlaege, freigaben] = await Promise.all([
    client.getList("PH Herstellerbestellung", { fields: BESTELL_FELDER, filters: [["status", "in", ["Entwurf", ...OFFENE_BESTELLSTATUS]]], orderBy: "datum asc", limit: 300 }).catch(() => []),
    client.getList("PH Lieferant", { fields: ["name", "ab_erwartet_tage"], limit: 200 }).catch(() => []),
    client.getList("PH Wareneingang", { fields: WE_FELDER, filters: [["status", "=", "Reklamiert"]], limit: 50 }).catch(() => []),
    client.getList("PH Produkt", { fields: ["name", "titel", "marke", "modified"], filters: [["status", "=", "Geprueft"]], orderBy: "modified asc", limit: 100 }).catch(() => []),
    client.getList("PH Produkt", { fields: ["name", "titel", "marke", "aktueller_preis_cent", "aktueller_preis_stand", "preisart", "preisstand_alt"], filters: [["preisstand_alt", "=", 1], ["status", "=", "Aktiv"]], orderBy: "aktueller_preis_stand asc", limit: 100 }).catch(() => []),
    client.getList("PH Preisliste Import", { fields: ["name", "titel", "marke", "stand", "zeilen_anzahl"], filters: [["status", "=", "Geprueft"]], limit: 20 }).catch(() => []),
    client.getList("PH Marke", { fields: ["name", "vertrag_gueltig_bis", "haendlerstatus"], filters: [["vertrag_gueltig_bis", "is", "set"]], limit: 100 }).catch(() => []),
    client.getList("PH Bestellvorschlag", { fields: ["name", "produkt_name", "lieferant", "vorschlag_menge", "verfuegbar", "meldebestand"], filters: [["status", "=", "Offen"]], limit: 50 }).catch(() => []),
    leitung ? freigabenLaden(client).catch(() => null) : null,
  ]);
  const frist = new Map(lieferanten.map((l) => [l.name, Number(l.ab_erwartet_tage) || 5]));
  const hbHref = (b, zusatz = "") => `/sortiment/bestellungen/${encodeURIComponent(b.name)}${zusatz}`;
  const unterHb = (b, extra) => [b.name, b.lieferant || "ohne Lieferant", b.kommission || "Lager", extra].filter(Boolean).join(" · ");
  const gruppen = [];
  const gruppe = (id, liste, zeile, { alleHref, leitungEntscheidet = false } = {}) => {
    if (!liste.length) return;
    const def = ZUTUN[id];
    gruppen.push({ id, titel: def.titel, anzahl: liste.length, zeilen: liste.slice(0, max).map(zeile), alleHref, leitungEntscheidet });
  };

  gruppe("ohneLieferant", bestellungen.filter((b) => b.status === "Entwurf" && !b.lieferant), (b) => ({ titel: b.titel || b.name, unter: unterHb(b), href: hbHref(b), knopf: { titel: ZUTUN.ohneLieferant.knopf, href: hbHref(b, "?bearbeiten=lieferant") } }), { alleHref: "/sortiment/bestellungen?segment=entwurf&ohneLieferant=1" });
  gruppe("entwurfAuftrag", bestellungen.filter((b) => b.status === "Entwurf" && b.lieferant && b.bezug_doctype), (b) => ({ titel: b.titel || b.name, unter: unterHb(b), href: hbHref(b), knopf: { titel: ZUTUN.entwurfAuftrag.knopf, href: hbHref(b, "?dialog=senden") } }), { alleHref: "/sortiment/bestellungen?segment=entwurf" });
  const abOffen = bestellungen.filter((b) => b.status === "Gesendet").map((b) => ({ b, ...abUeberfaellig(b, { frist: frist.get(b.lieferant) || 5, jetzt: client.jetzt ? client.jetzt() : new Date() }) }));
  gruppe("abEinlesen", abOffen.sort((a, b) => (b.tage || 0) - (a.tage || 0)), ({ b, tage, ueberfaellig }) => ({ titel: b.titel || b.name, unter: unterHb(b, `${ZUTUN.seitTagen(tage || 0)}${ueberfaellig ? ` · ${ZUTUN.frist(frist.get(b.lieferant) || 5)}` : ""}`), href: hbHref(b), warn: ueberfaellig, knopf: { titel: ZUTUN.abEinlesen.knopf, href: hbHref(b, "/ab") } }), { alleHref: "/sortiment/bestellungen?segment=unterwegs" });
  gruppe("abweichungen", bestellungen.filter((b) => Number(b.abweichungen_offen) > 0), (b) => ({ titel: b.titel || b.name, unter: unterHb(b, ZUTUN.offen(b.abweichungen_offen)), href: hbHref(b, "?tab=ab"), knopf: { titel: ZUTUN.abweichungen.knopf, href: hbHref(b, "?tab=ab") } }), { alleHref: "/sortiment/bestellungen?segment=ab" });
  gruppe("uebermittlung", bestellungen.filter((b) => b.uebermittlung_status === "Exportiert"), (b) => ({ titel: b.titel || b.name, unter: unterHb(b, `Datei ${b.uebermittlung_weg} erzeugt`), href: hbHref(b, "?tab=uebermittlung"), knopf: { titel: ZUTUN.uebermittlung.knopf, href: hbHref(b, "?tab=uebermittlung") } }));
  const erwartet = bestellungen.filter((b) => ["AB geprueft", "Teilgeliefert"].includes(b.status) && b.lieferadresse !== "Kunde direkt" && b.bestaetigter_termin && b.bestaetigter_termin >= t && b.bestaetigter_termin <= in7);
  gruppe("weErwartet", erwartet, (b) => ({ titel: b.titel || b.name, unter: unterHb(b, ZUTUN.termin(datumText(b.bestaetigter_termin))), href: hbHref(b), knopf: { titel: ZUTUN.weErwartet.knopf, href: `/sortiment/wareneingang/neu?bestellung=${encodeURIComponent(b.name)}` } }), { alleHref: "/sortiment/wareneingang" });
  const ueber = bestellungen.filter((b) => ["AB geprueft", "Teilgeliefert"].includes(b.status) && b.bestaetigter_termin && b.bestaetigter_termin < t);
  gruppe("ueberfaellig", ueber, (b) => ({ titel: b.titel || b.name, unter: unterHb(b, `seit ${tageZwischen(b.bestaetigter_termin, t)} Tagen überfällig`), href: hbHref(b), warn: true, knopf: { titel: ZUTUN.ueberfaellig.knopf, href: hbHref(b, "?dialog=termin") } }));
  gruppe("reklamation", eingaenge.filter((w) => !w.servicefall_ref), (w) => ({ titel: w.titel || w.name, unter: [w.name, w.herstellerbestellung, datumText(w.datum)].join(" · "), href: `/sortiment/wareneingang/${encodeURIComponent(w.name)}`, warn: true, knopf: { titel: ZUTUN.reklamation.knopf, href: `/sortiment/wareneingang/${encodeURIComponent(w.name)}?dialog=schaden` } }));
  gruppe("preisVeraltet", veraltet, (p) => ({ titel: p.titel || p.name, unter: [p.marke, preisZeile(p)].filter(Boolean).join(" · "), href: `/sortiment/produkte/${encodeURIComponent(p.name)}?tab=preise`, knopf: { titel: ZUTUN.preisVeraltet.knopf, href: `/sortiment/produkte/${encodeURIComponent(p.name)}?tab=preise&preis=bestaetigen` } }), { alleHref: "/sortiment/produkte?sicht=veraltet" });
  gruppe("vorschlaege", vorschlaege, (v) => ({ titel: v.produkt_name || v.name, unter: [v.lieferant || "ohne Lieferant", `${v.verfuegbar} verfügbar · Meldebestand ${v.meldebestand}`].join(" · "), href: "/sortiment/bestellvorschlaege", knopf: { titel: ZUTUN.vorschlaege.knopf, href: "/sortiment/bestellvorschlaege" } }), { alleHref: "/sortiment/bestellvorschlaege" });
  gruppe("wartetVeroeffentlichung", wartet, (p) => ({ titel: p.titel || p.name, unter: [p.marke, leitung ? null : "Leitung entscheidet"].filter(Boolean).join(" · "), href: `/sortiment/produkte/${encodeURIComponent(p.name)}`, knopf: leitung ? { titel: ZUTUN.wartetVeroeffentlichung.knopf, href: `/sortiment/produkte/${encodeURIComponent(p.name)}?dialog=veroeffentlichen` } : null }), { alleHref: "/sortiment/produkte?sicht=wartet", leitungEntscheidet: !leitung });
  if (freigaben) {
    const bilderJeMarke = freigaben.bilder.reduce((m, b) => m.set(b.marke, (m.get(b.marke) || 0) + 1), new Map());
    gruppe("bilderOhneFreigabe", [...bilderJeMarke], ([marke, n]) => ({ titel: `Bilder ${marke}`, unter: `${n} ${n === 1 ? "Bild" : "Bilder"} · ${freigaben.marken.find((m) => m.name === marke)?.beleg ? "Markenbeleg vorhanden" : "ohne Markenbeleg"}`, href: `/sortiment/freigaben?art=bilder&marke=${encodeURIComponent(marke)}`, knopf: { titel: ZUTUN.bilderOhneFreigabe.knopf, href: `/sortiment/freigaben?art=bilder&marke=${encodeURIComponent(marke)}` } }), { alleHref: "/sortiment/freigaben?art=bilder" });
    const pl = [...freigaben.preise.map((p) => ({ ...p, art: "preise" })), ...freigaben.lieferzeiten.map((p) => ({ ...p, art: "lieferzeiten" }))];
    gruppe("preiseFreigabe", pl, (p) => ({ titel: p.titel, unter: [p.marke, p.art === "preise" ? `neuer Preis ${euro(p.neu)}` : "Lieferzeit"].join(" · "), href: `/sortiment/freigaben?art=${p.art}`, knopf: { titel: ZUTUN.preiseFreigabe.knopf, href: `/sortiment/freigaben?art=${p.art}` } }), { alleHref: "/sortiment/freigaben?art=preise" });
  }
  if (leitung) {
    gruppe("preislisteAbgeglichen", listen, (l) => ({ titel: l.titel || l.name, unter: [l.name, `${l.zeilen_anzahl || 0} Zeilen`].join(" · "), href: `/sortiment/preislisten/${encodeURIComponent(l.name)}`, knopf: { titel: ZUTUN.preislisteAbgeglichen.knopf, href: `/sortiment/preislisten/${encodeURIComponent(l.name)}?schritt=4` } }));
    const bald = marken.filter((m) => m.vertrag_gueltig_bis && m.vertrag_gueltig_bis <= plusTage(t, 60));
    gruppe("vertragLaeuftAus", bald, (m) => ({ titel: m.name, unter: `Vertrag bis ${datumText(m.vertrag_gueltig_bis)}`, href: `/sortiment/marken/${encodeURIComponent(m.name)}?tab=haendler`, knopf: { titel: ZUTUN.vertragLaeuftAus.knopf, href: `/sortiment/marken/${encodeURIComponent(m.name)}?tab=haendler` } }));
  }
  return gruppen;
}

function euro(cent) {
  return Number.isFinite(cent) ? `${(cent / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : "–";
}

function preisZeile(p) {
  const z = preisZustand(p);
  if (z.art === "veraltet") return `${euro(z.cent)} · ${ZUTUN.veraltetSeit(datumText(z.bis || z.stand))}`;
  return z.cent ? euro(z.cent) : null;
}

/** Vier Kennzahlen des Bereichsstarts (§ 3.1, Number Cards). */
export async function startKennzahlen(client) {
  const t = heute(client);
  const vor30 = `${plusTage(t, -30)} 00:00:00`;
  const [veroeffentlicht, neu30, offen, markenOhne, shopOhnePreis] = await Promise.all([
    sicher(client.count("PH Produkt", { filters: [["status", "=", "Aktiv"]] })),
    sicher(client.count("PH Produkt", { filters: [["status", "=", "Aktiv"], ["veroeffentlicht_am", ">=", vor30]] })),
    sicher(client.count("PH Herstellerbestellung", { filters: [["status", "in", OFFENE_BESTELLSTATUS]] })),
    sicher(client.count("PH Marke", { filters: [["status", "=", "Aktiv"], ["haendlerstatus", "in", ["Keiner", "Anfrage laeuft"]]] })),
    sicher(client.count("PH Produkt", { filters: [["verkauf_online", "=", 1], ["status", "=", "Aktiv"], ["aktueller_preis_cent", "in", [0, null, ""]]] })),
  ]);
  return { veroeffentlicht, neu30, offen, markenOhne, shopOhnePreis };
}

/** Bestellkette: Anzahl je offenem Schritt (Bereichsstart). */
export async function kettenZaehler(client) {
  const schritte = ["Entwurf", "Gesendet", "AB erhalten", "AB geprueft", "Teilgeliefert", "Geliefert"];
  return Promise.all(schritte.map(async (s) => ({ status: s, anzahl: await client.count("PH Herstellerbestellung", { filters: [["status", "=", s]] }).catch(() => 0) })));
}

/** Daten für die Berichte (§ 11.3). */
export async function berichtDaten(client) {
  const [produkte, bestellungen] = await Promise.all([
    client.getList("PH Produkt", { fields: ["name", "marke", "status", "verkauf_online", "lieferzeit_freigegeben", "kurz_en", "preisstand_alt", "bild_freigegeben"], limit: 2000 }),
    client.getList("PH Herstellerbestellung", { fields: ["name", "status", "datum", "lieferant", "wunschtermin", "bestaetigter_termin"], limit: 2000 }),
  ]);
  const eingaenge = await client.getList("PH Wareneingang", { fields: ["name", "status", "datum"], limit: 1000 }).catch(() => []);
  return { produkte, bestellungen, eingaenge };
}

export { einstellungen };

/** S3: Bestellung (mit Positionen) und Produktbilder; null + Grund, wenn nicht buchbar. */
export async function ladeFuerEingang(client, session, name) {
  if (!name) return { bestellung: null, grund: null, bilder: {} };
  try {
    const b = ohneIntern(await client.getDoc("PH Herstellerbestellung", name), session);
    const grund = bestellSperrgrundEingang(b);
    const namen = [...new Set((b.positionen || []).map((p) => p.produkt).filter(Boolean))];
    const produkte = namen.length ? await client.getList("PH Produkt", { fields: ["name", "bild_hauptbild"], filters: [["name", "in", namen]], limit: namen.length }).catch(() => []) : [];
    return { bestellung: grund ? null : b, grund, bilder: Object.fromEntries(produkte.map((p) => [p.name, p.bild_hauptbild || ""])) };
  } catch {
    return { bestellung: null, grund: "Diese Nummer gehört zu keiner offenen Bestellung.", bilder: {} };
  }
}
