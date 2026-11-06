// Kassa – Mock der Page-Methoden (Team B-KAS, Konzept §16.1 „mock.js“). Bildet die whitelisted Methoden von
// ph_kassa (page/ph_kassa/ph_kassa.py), ph_kundenkarte (karte_pruefen/einloesen) und den Terminal-Testmodus
// gegen die In-Memory-Datenbank des MockClient nach – gleiche Argumente, gleiche Rückgabeformen. Keine echten
// Signaturen: Belege tragen im Mock einen erkennbaren Platzhalter-Code („MOCK“). Fehler als BackofficeError.
// Reines Modul (keine "@/"-Importe), damit node --test es lädt.

import { BackofficeError } from "../frappe/errors.js";
import { isoDatum, isoDatumZeit } from "../format.js";
import { DEMO_BENUTZER } from "../auth/mockUsers.js";
import { KassenFehler, belegPruefen, rabattFreigabeNoetig, stueckelung, summen } from "./betraege.js";
import { erkennen } from "./codes.js";
import { pruefe, stornoFreigabe, FREIGABE_TEXTE } from "./regeln.js";
import { bargeldSoll, sollAusBelegen, zaehlprotokollSumme, differenzGrundPflichtig } from "./abschluss.js";
import { MOCK_KATALOG, kategorieFuer } from "./katalog.js";
import { STANDARD_EINSTELLUNGEN } from "./einstellungen.js";
import kassaNachlauf, { SEED_VERSION } from "../mock/seed/kassa.js";
import { rng } from "../mock/seed/basis.js";

/**
 * Kassa-Daten im laufenden Mock sicherstellen: Die Mock-Datenbank lebt je Prozess (globalThis) und wird nur
 * beim Start gebaut. Ist sie älter als der Kassa-Seed (anderer SEED_VERSION-Stempel), läuft der Nachlauf der
 * Kassa einmal nach – nur Kassa-Tabellen, andere Bereiche bleiben unberührt.
 */
export function sicherstellen(client) {
  const db = client?.db;
  if (!db?.db || db.kassaSeed === SEED_VERSION || db.db.__kassaSeed === SEED_VERSION) {
    if (db?.db) db.kassaSeed = SEED_VERSION;
    return;
  }
  kassaNachlauf(db.db, { rng: rng(20261104 ^ 0x6b61) });
  db.kassaSeed = SEED_VERSION;
}

export { STANDARD_EINSTELLUNGEN };

/** Muster-Gutscheine des Mock (Codes erfunden, gültiges Alphabet). */
export const MOCK_GUTSCHEINE = Object.freeze({
  "PH-A2B3-C4D5-E6F7-G8H9": { gutschein: "PH-GS-MOCK-0001", art: "Mehrzweck", wert_cent: 10000, rest_cent: 5000, status: "Aktiv" },
  "PH-K7M8-N9P2-Q3R4-S5T6": { gutschein: "PH-GS-MOCK-0002", art: "Mehrzweck", wert_cent: 5000, rest_cent: 0, status: "Eingeloest" },
  "PH-W2X3-Y4Z5-A6B7-C8D9": { gutschein: "PH-GS-MOCK-0003", art: "Mehrzweck", wert_cent: 2500, rest_cent: 2500, status: "Abgelaufen" },
});

/** Leistungsvorteile je Stufe (Mock; Kundenkarte ohne Geldwert – nur Leistungen). */
export const MOCK_VORTEILE = Object.freeze({
  Platzhirsch: [{ vorteil: "lieferung", titel: "Lieferung frei", art: "Leistung" }],
  Select: [{ vorteil: "lieferung", titel: "Lieferung frei", art: "Leistung" }, { vorteil: "pflege", titel: "Pflege-Service", art: "Leistung" }],
  Plus: [{ vorteil: "lieferung", titel: "Lieferung frei", art: "Leistung" }, { vorteil: "pflege", titel: "Pflege-Service", art: "Leistung" }],
  "Privé": [{ vorteil: "lieferung", titel: "Lieferung frei", art: "Leistung" }, { vorteil: "pflege", titel: "Pflege-Service", art: "Leistung" }, { vorteil: "event", titel: "Vorab-Zugang Event", art: "Leistung" }],
});

const LEITUNG = ["PH Kassa Leitung", "System Manager"];
const ROLLEN = ["PH Kassa Mitarbeiter", ...LEITUNG];

function rollen(client, leitung = false) {
  const rs = client.session?.roles || [];
  if (!rs.some((r) => (leitung ? LEITUNG : ROLLEN).includes(r))) throw new BackofficeError("forbidden", leitung ? "Nur die Kassa-Leitung darf das." : "Keine Berechtigung für die Kassa.");
  return rs.some((r) => LEITUNG.includes(r));
}

const fehler = (text, code = "invalid") => new BackofficeError(code, text);
const json = (x) => (typeof x === "string" ? JSON.parse(x) : x || []);
const tabelle = (client, dt) => {
  if (!client.db.db.has(dt)) client.db.db.set(dt, new Map());
  return client.db.db.get(dt);
};
const zustand = (client) => (client.db.kassa ||= { terminal: {}, gutscheine: {}, einloesungen: [], netzfehler: 0 });
const heute = (client) => isoDatum(client.jetzt());
const jetzt = (client) => isoDatumZeit(client.jetzt());

export function einstellungen(client) {
  const doc = tabelle(client, "PH Kassa Einstellungen").get("PH Kassa Einstellungen") || {};
  const out = { ...STANDARD_EINSTELLUNGEN };
  for (const [k, v] of Object.entries(doc)) if (k in out && v !== "" && v !== null && v !== undefined) out[k] = v;
  return out;
}

function kassen(client) {
  return [...tabelle(client, "PH Kasse").values()].sort((a, b) => String(a.name).localeCompare(b.name));
}

function belegeVon(client, kasse, tag) {
  return [...tabelle(client, "PH Kassenbeleg").values()].filter((b) => b.kasse === kasse && b.docstatus === 1 && (!tag || String(b.datum_uhrzeit).startsWith(tag)));
}

function abschlussVon(client, kasse, tag) {
  return [...tabelle(client, "PH Kassenabschluss").values()].find((a) => a.kasse === kasse && a.datum === tag) || null;
}

export function istGesperrt(client, kasse, tag = heute(client)) {
  return abschlussVon(client, kasse, tag)?.status === "Abgeschlossen";
}

export function letzterBestand(client, kasse) {
  const zeilen = [...tabelle(client, "PH Kassenbuch").values()].filter((z) => z.kasse === kasse && z.status === "Gebucht").sort((a, b) => String(a.zeitpunkt).localeCompare(String(b.zeitpunkt)) || String(a.name).localeCompare(String(b.name)));
  return zeilen.length ? Number(zeilen.at(-1).bestand_danach_cent) || 0 : 0;
}

function kassenbuchBuchen(client, kasse, art, betrag, grund, { beleg = "", quelle = "kassa", idem = "" } = {}) {
  const t = tabelle(client, "PH Kassenbuch");
  if (idem) {
    const da = [...t.values()].find((z) => z.idempotency_key === idem);
    if (da) return da;
  }
  const vz = { Anfangsbestand: 1, Einlage: 1, Entnahme: -1, Bareinnahme: 1, Barausgabe: -1, Differenz: 1 }[art];
  if (!vz) throw fehler("Nur Einlage, Entnahme oder Anfangsbestand über die Kassa.");
  const bewegung = art === "Differenz" ? Math.trunc(betrag) : vz * Math.abs(Math.trunc(betrag));
  const bestand = letzterBestand(client, kasse) + bewegung;
  const nr = client.naechsteNummer(`KB-${heute(client).slice(0, 4)}-`) + 900;
  const name = `KB-${heute(client).slice(0, 4)}-${String(nr).padStart(5, "0")}`;
  const z = jetzt(client);
  const doc = { doctype: "PH Kassenbuch", name, naming_series: "KB-.YYYY.-.#####", titel: `${art}: ${grund || ""}`.trim(), kasse, art, status: "Gebucht", zeitpunkt: z, datum: heute(client), bediener: client.session.user, betrag_cent: Math.abs(Math.trunc(betrag)), bewegung_cent: bewegung, bestand_danach_cent: bestand, waehrung: "EUR", grund: grund || "", beleg, kassenabschluss: "", idempotency_key: idem, quelle, docstatus: 0, creation: z, modified: z, owner: client.session.user, modified_by: client.session.user };
  t.set(name, doc);
  return doc;
}

// ------------------------------------------------------------------ Kontext --

export function kontext(client, { kasse } = {}) {
  const leitung = rollen(client);
  const einst = einstellungen(client);
  const liste = kassen(client).map((k) => ({ name: k.name, bezeichnung: k.bezeichnung, standort: k.standort, status: k.status, trainings_modus: k.trainings_modus || 0, bon_drucker: k.bon_drucker, kundendisplay: k.kundendisplay ?? 1, aktiver_abschluss: k.aktiver_abschluss || "" }));
  const k = kasse || einst.standard_kasse || liste[0]?.name || null;
  const doc = liste.find((x) => x.name === k) || null;
  const tag = heute(client);
  const belege = k ? belegeVon(client, k, tag) : [];
  return {
    user: client.session.user,
    user_name: client.session.name,
    leitung,
    einstellungen: einst,
    kassen: liste,
    kasse: doc ? k : null,
    kasse_doc: doc,
    trainings: Number(doc?.trainings_modus || 0),
    gesperrt: k ? istGesperrt(client, k, tag) : false,
    bargeld_bestand_cent: k ? letzterBestand(client, k) : 0,
    terminals: [...tabelle(client, "PH Terminal").values()].filter((t) => t.kasse === k && t.aktiv !== 0).map((t) => ({ reader_id: t.name, bezeichnung: t.bezeichnung, status: t.status, testmodus: t.testmodus })),
    letzter_beleg: k ? letzterBeleg(client, { kasse: k }) : null,
    heute_umsatz_cent: belege.filter((b) => !Number(b.trainings)).reduce((a, b) => a + (Number(b.gesamt_cent) || 0), 0),
    belege_heute_anzahl: belege.length,
    schnelltasten: schnelltasten(client, { kasse: k }),
    geschaeftstag: tag,
    firma: { firmenname: "Platzhirsch Home Living", ort: "Lochau" },
    abschluss_heute: k ? abschlussVon(client, k, tag) && { name: abschlussVon(client, k, tag).name, status: abschlussVon(client, k, tag).status } : null,
    vortag_offen: k ? vortagOffen(client, k) : null,
    tagesstart: k ? tagesstartInfo(client, k) : null,
  };
}

function vortagOffen(client, kasse) {
  const tag = heute(client);
  const offen = [...tabelle(client, "PH Kassenabschluss").values()].filter((a) => a.kasse === kasse && a.datum < tag && ["Offen", "Gezaehlt", "Korrigiert"].includes(a.status)).sort((a, b) => b.datum.localeCompare(a.datum));
  return offen[0] ? { name: offen[0].name, datum: offen[0].datum, status: offen[0].status } : null;
}

function tagesstartInfo(client, kasse) {
  const tag = heute(client);
  const bestaetigt = (client.db.kommentare?.get(`PH Kasse::${kasse}`) || []).some((k) => String(k.creation).startsWith(tag) && /^Tagesstart/.test(k.content || ""));
  const letzter = [...tabelle(client, "PH Kassenabschluss").values()].filter((a) => a.kasse === kasse && a.status === "Abgeschlossen" && a.datum < tag).sort((a, b) => b.datum.localeCompare(a.datum))[0] || null;
  const belegeHeute = belegeVon(client, kasse, tag).length;
  return { bestaetigt: bestaetigt || belegeHeute > 0, letzter: letzter ? { name: letzter.name, datum: letzter.datum, bargeld_ist_cent: letzter.bargeld_ist_cent, geschlossen_am: letzter.geschlossen_am } : null };
}

export function schnelltasten(client, { kasse } = {}) {
  return [...tabelle(client, "PH Kassa Schnelltaste").values()].filter((s) => Number(s.aktiv) && (!s.kasse || s.kasse === kasse)).sort((a, b) => (a.reihenfolge || 0) - (b.reihenfolge || 0)).slice(0, 60).map((s) => ({ name: s.name, titel: s.titel, aktion: s.aktion, produkt: s.produkt, bezeichnung: s.bezeichnung, betrag_cent: s.betrag_cent, steuersatz: s.steuersatz, farbe: s.farbe, bild: s.bild, reihenfolge: s.reihenfolge, kasse: s.kasse }));
}

// ------------------------------------------------------------------- Suche --

function produktAusDoc(p, einst) {
  const preis = p.preisart !== "Auf Anfrage" ? Number(p.aktueller_preis_cent) || 0 : 0;
  return { produkt: p.name, bezeichnung: p.titel || p.name, marke: p.marke || "", bild: "", einzel_brutto_cent: preis, steuersatz: p.ust_klasse === "ermaessigt" ? "Ermaessigt-1 10" : einst.standard_steuersatz, ean: p.ean || "", kategorie: kategorieFuer(p.kategorie), lager: null };
}

export function kassenKatalog(client) {
  rollen(client);
  const einst = einstellungen(client);
  const sortiment = [...tabelle(client, "PH Produkt").values()].filter((p) => p.preisart === "Verkaufspreis" && Number(p.aktueller_preis_cent) > 0).map((p) => produktAusDoc(p, einst));
  return { stand: jetzt(client), produkte: [...MOCK_KATALOG.map((p) => ({ ...p })), ...sortiment] };
}

export function sucheProdukt(client, { q }) {
  rollen(client);
  const t = String(q || "").trim().toLowerCase();
  if (t.length < 2) return [];
  return kassenKatalog(client).produkte.filter((p) => [p.bezeichnung, p.marke, p.ean, p.produkt].some((f) => String(f || "").toLowerCase().includes(t))).slice(0, 16);
}

function kontaktTitel(k) {
  return k.titel || [k.vorname, k.nachname].filter(Boolean).join(" ") || k.firma || k.name;
}

function auftraegeVon(client, kontakt, name) {
  return [...tabelle(client, "PH Auftragsbestaetigung").values()]
    .filter((a) => (name ? a.name === name : a.kontakt === kontakt && !["Storniert", "Abgerechnet"].includes(a.status)))
    .slice(0, 10)
    .map((a) => {
      const soll = Number(a.anzahlung_soll_cent) || 0;
      const ist = Number(a.anzahlung_ist_cent) || 0;
      return { auftrag: a.name, status: a.status, datum: a.datum || "", auftragswert_cent: Number(a.auftragswert_cent) || 0, anzahlung_offen_cent: Math.max(0, soll - ist), offen_cent: Number(a.offen_cent) || 0, steuersatz: "Normal 20", zahlungsplan: [], vertragsort: a.vertragsort || null, fagg_frist_ende: null };
    });
}

function rechnungenVon(client, kontakt) {
  return [...tabelle(client, "PH Rechnung").values()].filter((r) => r.kontakt === kontakt && Number(r.offen_cent) > 0 && r.docstatus === 1).slice(0, 10).map((r) => ({ rechnung: r.name, art: r.art, status: r.status, offen_cent: Number(r.offen_cent) || 0, datum: r.datum || "", steuersatz: "Normal 20" }));
}

function karteVonKontakt(client, kontakt) {
  return [...tabelle(client, "PH Kundenkarte").values()].find((k) => k.kontakt === kontakt && k.status === "Aktiv") || null;
}

export function sucheKunde(client, { q }) {
  rollen(client);
  const t = String(q || "").trim().toLowerCase();
  if (t.length < 2) return [];
  const out = [];
  for (const k of tabelle(client, "PH Kontakt").values()) {
    const felder = [k.titel, k.vorname, k.nachname, k.firma, k.email, k.telefon, k.name];
    if (!felder.some((f) => String(f || "").toLowerCase().includes(t))) continue;
    const karte = karteVonKontakt(client, k.name);
    out.push({ kontakt: k.name, titel: kontaktTitel(k), untertitel: [k.firma && k.firma !== kontaktTitel(k) ? k.firma : "", k.ort || k.plz_ort || ""].filter(Boolean).join(", "), email: k.email || "", auftraege: auftraegeVon(client, k.name), rechnungen: rechnungenVon(client, k.name), bestellungen: [], kartennummer: karte?.kartennummer || "", stufe: karte?.stufe || "" });
    if (out.length >= 12) break;
  }
  if (/^ab/i.test(t)) for (const a of tabelle(client, "PH Auftragsbestaetigung").values()) if (a.name.toLowerCase().includes(t)) out.push({ kontakt: a.kontakt, titel: a.name, untertitel: "Auftrag", auftraege: auftraegeVon(client, null, a.name), rechnungen: [], bestellungen: [] });
  return out;
}

// --------------------------------------------------------------- Kundenkarte --

export function karteFinden(client, nummer) {
  const n = String(nummer || "").toUpperCase().replace(/\s/g, "");
  return [...tabelle(client, "PH Kundenkarte").values()].find((k) => String(k.kartennummer).toUpperCase() === n || String(k.kartennummer).toUpperCase().replace(/^PHK-/, "KK-") === n) || null;
}

/** ph_kundenkarte karte_pruefen: Name, Status, Stufe, verfügbare Vorteile – keine Kontaktdaten, kein Umsatz. */
export function kartePruefen(client, { kartennummer }) {
  rollen(client);
  const k = karteFinden(client, kartennummer);
  if (!k) throw fehler("Kundenkarte nicht gefunden.", "not_found");
  const ok = k.status === "Aktiv";
  const genutzt = zustand(client).einloesungen.filter((e) => e.kartennummer === k.kartennummer && e.status === "Eingeloest").map((e) => e.vorteil);
  const vorteile = ok ? (MOCK_VORTEILE[k.stufe] || MOCK_VORTEILE.Platzhirsch).map((v) => ({ ...v, hinweis: "", einloesbar_pro_jahr: v.vorteil === "pflege" ? 1 : 0, genutzt_im_jahr: genutzt.filter((g) => g === v.vorteil).length, verbleibend: v.vorteil === "pflege" ? Math.max(0, 1 - genutzt.filter((g) => g === "pflege").length) : null, verfuegbar: v.vorteil === "pflege" ? !genutzt.includes("pflege") : true })) : [];
  const kontakt = tabelle(client, "PH Kontakt").get(k.kontakt);
  return { kartennummer: k.kartennummer, status: k.status, code: ok ? "ok" : k.status === "Gesperrt" ? "gesperrt" : "inaktiv", hinweis: ok ? null : `Karte ${k.status.toLowerCase()}`, name: k.kunde_name || (kontakt ? kontaktTitel(kontakt) : ""), stufe: k.stufe, stufe_seit: k.stufe_seit || "", kontakt: k.kontakt, vorteile };
}

function vorteilEinloesen(client, kartennummer, vorteil, beleg) {
  const st = zustand(client);
  const da = st.einloesungen.find((e) => e.kartennummer === kartennummer && e.vorteil === vorteil && e.bezug === beleg && e.status === "Eingeloest");
  if (da) return { referenz: da.referenz, vorteil, bereits_eingeloest: true };
  const referenz = `KKE-MOCK-${st.einloesungen.length + 1}`;
  st.einloesungen.push({ referenz, kartennummer, vorteil, bezug: beleg, status: "Eingeloest", zeit: Date.now() });
  const titel = Object.values(MOCK_VORTEILE).flat().find((v) => v.vorteil === vorteil)?.titel || vorteil;
  return { referenz, vorteil, titel, bereits_eingeloest: false };
}

// ---------------------------------------------------------------- Gutschein --

export function gutscheinPruefen(client, { code }) {
  rollen(client);
  const c = String(code || "").toUpperCase().replace(/\s/g, "");
  const g = zustand(client).gutscheine[c] || MOCK_GUTSCHEINE[c];
  if (!g) return { gueltig: false, code: c, grund: "unbekannt" };
  const rest = g.rest_cent;
  return { gueltig: g.status === "Aktiv" && rest > 0, code: c, gutschein: g.gutschein, art: g.art, wert_cent: g.wert_cent, rest_cent: rest, status: g.status, grund: g.status === "Abgelaufen" ? "abgelaufen" : rest <= 0 ? "eingeloest" : null, letzte4: c.slice(-4) };
}

// ------------------------------------------------------------- Code erkennen --

export function codeErkennen(client, { code }) {
  rollen(client);
  const roh = String(code || "").trim();
  const karte = karteFinden(client, roh);
  const e = karte ? { art: "kundenkarte", wert: karte.kartennummer } : erkennen(roh);
  try {
    if (e.art === "ean") e.treffer = sucheProdukt(client, { q: e.wert });
    else if (e.art === "gutschein") e.treffer = gutscheinPruefen(client, { code: e.wert });
    else if (e.art === "kundenkarte") e.treffer = kartePruefen(client, { kartennummer: e.wert });
    else if (e.art === "kassenbeleg" || e.art === "rksv_qr") {
      const b = e.art === "kassenbeleg" ? tabelle(client, "PH Kassenbeleg").get(e.wert) : [...tabelle(client, "PH Kassenbeleg").values()].find((x) => x.maschinenlesbarer_code === e.wert);
      e.treffer = b ? { name: b.name, belegnummer: b.belegnummer, belegart: b.belegart, gesamt_cent: b.gesamt_cent, datum_uhrzeit: b.datum_uhrzeit, kontakt: b.kontakt } : null;
    } else if (e.art === "auftrag") e.treffer = auftraegeVon(client, null, e.wert);
    else if (e.art === "rechnung") {
      const r = tabelle(client, "PH Rechnung").get(e.wert);
      e.treffer = r ? { name: r.name, kontakt: r.kontakt, offen_cent: r.offen_cent, art: r.art, status: r.status } : null;
    } else e.treffer = { produkte: sucheProdukt(client, { q: e.wert }), kunden: sucheKunde(client, { q: e.wert }) };
  } catch (err) {
    e.treffer = null;
    e.fehler = String(err?.message || err).slice(0, 160);
  }
  return e;
}

// --------------------------------------------------------------- Freigabe --

/** Mock-Freigabe per PIN: Person mit Kassa-Leitung (oder System Manager) und passender PIN. */
export function freigabePruefen(freigabe, gruende = []) {
  if (!gruende.length) return null;
  if (!freigabe?.email || !freigabe?.pin) throw new BackofficeError("forbidden", `Freigabe der Leitung nötig: ${gruende.join(", ")}`, { detail: { freigabe: gruende } });
  const p = DEMO_BENUTZER.find((u) => u.email === String(freigabe.email).toLowerCase());
  if (!p || !p.roles.some((r) => LEITUNG.includes(r))) throw new BackofficeError("forbidden", "Diese Person darf nicht freigeben.");
  if (String(p.pin) !== String(freigabe.pin)) throw new BackofficeError("auth", "PIN stimmt nicht.");
  return p.email;
}

export function leitungFreigabePruefen(client, { email, pin }) {
  rollen(client);
  return { freigabe_von: freigabePruefen({ email, pin }, ["Vorabprüfung"]) };
}

/** Bediener mit Kassa-Leitung für die Freigabe-Kacheln (ohne PIN). */
export function leitungListe() {
  return DEMO_BENUTZER.filter((u) => u.roles.includes("PH Kassa Leitung")).map(({ email, name }) => ({ email, name: String(name).split(" (")[0] }));
}

// ------------------------------------------------------------------ Buchen --

function naechsteBelegnummer(client, kasse) {
  const k = tabelle(client, "PH Kasse").get(kasse);
  const max = Math.max(Number(k?.belegnummer_zaehler) || 0, ...belegeVon(client, kasse).map((b) => Number(b.belegnummer) || 0));
  if (k) k.belegnummer_zaehler = max + 1;
  return max + 1;
}

function belegAnlegen(client, { kasse, belegart, positionen, zahlarten, gesamt, kontakt, kunde_name, trainings, idem, extra = {} }) {
  const nr = naechsteBelegnummer(client, kasse);
  const name = `${kasse}-${String(nr).padStart(6, "0")}`;
  const z = jetzt(client);
  const s = summen(positionen.map((p) => ({ ...p })));
  const doc = {
    doctype: "PH Kassenbeleg", name, titel: `Beleg ${nr}`, kasse, belegnummer: nr, belegart, datum_uhrzeit: z, geschaeftstag: heute(client),
    status: "Signiert", kontakt: kontakt || "", kunde_name: kunde_name || "", bediener: client.session.user, trainings: trainings ? 1 : 0,
    positionen: positionen.map((p, i) => ({ ...p, doctype: "PH Kassenbeleg Position", idx: i + 1, name: `pos-${i + 1}`, parent: name, parentfield: "positionen", parenttype: "PH Kassenbeleg" })),
    zahlarten: zahlarten.map((p, i) => ({ ...p, doctype: "PH Kassenbeleg Zahlung", idx: i + 1, name: `zahl-${i + 1}`, parent: name, parentfield: "zahlarten", parenttype: "PH Kassenbeleg" })),
    ...s.rksv, gesamt_cent: gesamt, ust_cent: s.ust_cent, waehrung: "EUR", idempotency_key: idem || "", quelle: "Kassa",
    maschinenlesbarer_code: `_R1-AT0_${kasse}_${nr}_${z.replace(" ", "T")}_MOCK`, jws_compact: "", signatur_vorbeleg: "", zda_id: "AT0", zertifikat_seriennummer: "MOCK",
    storno_von: "", storniert_durch: "", docstatus: 1, creation: z, modified: z, owner: client.session.user, modified_by: client.session.user, ...extra,
  };
  tabelle(client, "PH Kassenbeleg").set(name, doc);
  const k = tabelle(client, "PH Kasse").get(kasse);
  if (k) Object.assign(k, { letzter_beleg: name, letzter_beleg_am: z });
  return doc;
}

/**
 * page.beleg_buchen – gleiche Argumente wie der Server (JSON-Strings oder Objekte).
 * Mock-Zusatz `_simuliere`: "netz" wirft `unavailable`, solange zustand.netzfehler > 0 (E2E „Zahlung erhalten – Beleg offen“).
 */
export function belegBuchen(client, args) {
  rollen(client);
  const einst = einstellungen(client);
  const { kasse, kontakt = null, auftrag = null, rechnung = null, kundenbeleg_email = null, idempotency_key = null, kundenkarte = null, freigabe = null, empfaenger = null, retoure_original = null } = args;
  const st = zustand(client);
  if (args._simuliere === "netz") {
    if (st.netzfehler === 0 && !st.netzfehlerVerbraucht?.[idempotency_key]) st.netzfehler = 3;
    if (st.netzfehler > 0) {
      st.netzfehler -= 1;
      (st.netzfehlerVerbraucht ||= {})[idempotency_key] = true;
      throw new BackofficeError("unavailable", "Keine Verbindung zum Server.");
    }
  }
  let positionen = json(args.positionen).map((p) => ({ ...p }));
  const zahlarten = json(args.zahlarten);
  const vorteile = args.kundenkarte_vorteile ? json(args.kundenkarte_vorteile) : [];
  if (idempotency_key) {
    const alt = [...tabelle(client, "PH Kassenbeleg").values()].find((b) => b.idempotency_key === idempotency_key && b.docstatus === 1);
    if (alt) return { beleg: alt.name, belegnummer: alt.belegnummer, wiederholung: true, gesamt_cent: alt.gesamt_cent, rueckgeld_cent: (alt.zahlarten || []).reduce((a, z) => a + (Number(z.retour_cent) || 0), 0), hinweise: [], gutschein_codes: alt._gutschein_codes || [], druck: { modus: "keiner" } };
  }
  if (!kasse || !tabelle(client, "PH Kasse").has(kasse)) throw fehler("Kasse nicht gefunden.", "not_found");
  if (istGesperrt(client, kasse)) throw fehler(`Kasse ${kasse} ist heute abgeschlossen – Leitung muss den Abschluss öffnen.`, "conflict");
  const trainings = Number(tabelle(client, "PH Kasse").get(kasse)?.trainings_modus || 0);
  for (const p of positionen) {
    if (p.art === "Gutschein Verkauf") {
      p.steuersatz = einst.gutschein_art === "Mehrzweck" ? "Null 0" : einst.standard_steuersatz;
      if (Number(p.menge || 1) !== 1) throw fehler("Gutscheine einzeln verkaufen (Menge 1 je Gutschein).");
    }
    if (p.art === "Anzahlung" && auftrag) p.steuersatz = einst.steuersatz_anzahlung;
  }
  let s;
  try {
    s = belegPruefen(positionen, zahlarten);
  } catch (err) {
    if (err instanceof KassenFehler) throw fehler(err.message);
    throw err;
  }
  const auftragInfo = auftrag ? auftraegeVon(client, null, auftrag)[0] : null;
  const pr = pruefe({ positionen: s.positionen, zahlarten: s.zahlarten, gesamt_cent: s.gesamt_cent, kontakt, auftrag, rechnung, empfaenger: empfaenger ? json(empfaenger) : null, identitaet: args.identitaet ? json(args.identitaet) : null, retoure_original: !!retoure_original, auftrag_offen_cent: auftragInfo?.anzahlung_offen_cent || null, rabatt_freigabe_index: rabattFreigabeNoetig(positionen, einst.rabatt_freigabe_ab_promille) }, einst);
  if (pr.fehler.length) throw fehler(pr.fehler.join(" "));
  const freigabeVon = freigabePruefen(freigabe ? json(freigabe) : null, pr.freigaben.map((c) => FREIGABE_TEXTE[c]));
  for (const z of s.zahlarten) {
    if (z.zahlart === "Karte Stripe Terminal" && z.betrag_cent > 0) {
      const t = st.terminal[z.terminal_payment_intent];
      if (!t) throw fehler("Terminalzahlung wurde nicht gestartet.");
      if (t.status !== "succeeded") throw fehler(`Terminalzahlung ist noch nicht bestätigt (Status ${t.status}).`);
      if (t.betrag_cent !== z.betrag_cent) throw fehler("Terminalbetrag weicht vom Belegbetrag ab.");
    }
    if (z.zahlart === "Gutschein") {
      const g = gutscheinPruefen(client, { code: z.code || "" });
      if (!z.gutschein || !g.gueltig) throw fehler("Gutschein wurde nicht geprüft.");
      if (z.betrag_cent > g.rest_cent) throw fehler("Gutschein-Betrag übersteigt den Restwert.");
    }
  }
  let kontaktNeu = kontakt;
  if (empfaenger && !kontakt) {
    const e = json(empfaenger);
    kontaktNeu = kundeAnlegen(client, e).kontakt;
  }
  const kd = kontaktNeu ? tabelle(client, "PH Kontakt").get(kontaktNeu) : null;
  const doc = belegAnlegen(client, { kasse, belegart: trainings ? "Trainingsbeleg" : "Standard", positionen: s.positionen, zahlarten: s.zahlarten, gesamt: s.gesamt_cent, kontakt: kontaktNeu, kunde_name: args.kunde_name || (kd ? kontaktTitel(kd) : ""), trainings, idem: idempotency_key, extra: { auftrag: auftrag || "", rechnung: rechnung || "", freigabe_von: freigabeVon || "", freigabe_gruende: pr.freigaben.join(", "), kundenbeleg_email: kundenbeleg_email || "", ph_kundenkarte_kartennummer: kundenkarte || "" } });
  // Gutschein-Einlösung (Restwert mindern) und -Verkauf (neuer Code, nur in diesem Moment sichtbar).
  for (const z of s.zahlarten) if (z.zahlart === "Gutschein") {
    const c = String(z.code || "").toUpperCase();
    const g = st.gutscheine[c] || (MOCK_GUTSCHEINE[c] && (st.gutscheine[c] = { ...MOCK_GUTSCHEINE[c] }));
    if (g) g.rest_cent -= z.betrag_cent;
  }
  const codes = [];
  doc.positionen.forEach((p) => {
    if (p.art !== "Gutschein Verkauf") return;
    const code = mockGutscheinCode(client, `${doc.name}:${p.idx}`);
    st.gutscheine[code] = { gutschein: `PH-GS-MOCK-${doc.belegnummer}-${p.idx}`, art: einst.gutschein_art, wert_cent: p.brutto_cent, rest_cent: trainings ? 0 : p.brutto_cent, status: trainings ? "Test" : "Aktiv" };
    codes.push({ gutschein: st.gutscheine[code].gutschein, code, wert_cent: p.brutto_cent, zeile: p.idx, art: einst.gutschein_art });
  });
  doc._gutschein_codes = codes;
  // Kassenbuch: Bareinnahme (Server führt alle Bar-Belege im Kassenbuch).
  const bar = s.zahlarten.find((z) => z.zahlart === "Bar");
  if (bar && !trainings && bar.betrag_cent) kassenbuchBuchen(client, kasse, bar.betrag_cent >= 0 ? "Bareinnahme" : "Barausgabe", bar.betrag_cent, `Beleg ${doc.belegnummer}`, { beleg: doc.name, quelle: "beleg" });
  for (const z of s.zahlarten) if (z.terminal_payment_intent && st.terminal[z.terminal_payment_intent]) st.terminal[z.terminal_payment_intent].beleg = doc.name;
  const ergebnis = { beleg: doc.name, belegnummer: doc.belegnummer, gesamt_cent: s.gesamt_cent, rueckgeld_cent: s.rueckgeld_cent, rueckgeld_stueckelung: s.rueckgeld_cent > 0 ? stueckelung(s.rueckgeld_cent) : [], trainings, hinweise: [...pr.hinweise], freigabe_von: freigabeVon, gutschein_codes: codes, erstattungen: [], klaerfaelle: [] };
  if (kundenkarte) ergebnis.kundenkarte = { kartennummer: kundenkarte, vorteile: vorteile.map((v) => vorteilEinloesen(client, kundenkarte, v, doc.name)), fehler: [] };
  ergebnis.druck = Number(args.drucken ?? einst.automatisch_drucken) ? { modus: "PDF 80 mm", schublade: !!bar } : { modus: "keiner" };
  if (kundenbeleg_email) ergebnis.email = kundenbeleg_email;
  return ergebnis;
}

function mockGutscheinCode(client, saat) {
  const A = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let h = 2166136261;
  for (const ch of `${saat}:${client.db.kassa?.einloesungen?.length || 0}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  let s = "";
  for (let i = 0; i < 16; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    s += A[h % A.length];
  }
  return `PH-${s.match(/.{4}/g).join("-")}`;
}

export function kundeAnlegen(client, e = {}) {
  rollen(client);
  const name = String(e.firma || e.name || [e.vorname, e.nachname].filter(Boolean).join(" ")).trim();
  if (!name) throw fehler("Name oder Firma angeben.");
  const t = tabelle(client, "PH Kontakt");
  const da = [...t.values()].find((k) => (k.firma || k.titel || "").toLowerCase() === name.toLowerCase() && (!e.ort || String(k.ort || "").includes(e.ort)));
  if (da) return { kontakt: da.name, bestehend: true };
  const nr = t.size + 1;
  const kname = `PH-KON-${String(nr).padStart(5, "0")}`;
  const z = jetzt(client);
  t.set(kname, { doctype: "PH Kontakt", name: kname, naming_series: "PH-KON-.#####", titel: name, firma: e.firma || "", vorname: e.vorname || "", nachname: e.nachname || "", strasse: e.strasse || "", plz: e.plz || "", ort: [e.plz, e.ort].filter(Boolean).join(" "), land: e.land || "AT", uid: e.uid || "", email: e.email || "", quelle: "showroom", status: "Kunde", kontaktart: e.firma ? "Firma" : "Privat", creation: z, modified: z, owner: client.session.user, modified_by: client.session.user, docstatus: 0 });
  return { kontakt: kname, bestehend: false };
}

// ------------------------------------------------------------------ Belege --

export function letzterBeleg(client, { kasse }) {
  const b = belegeVon(client, kasse).sort((x, y) => String(y.datum_uhrzeit).localeCompare(String(x.datum_uhrzeit)) || (y.belegnummer || 0) - (x.belegnummer || 0))[0];
  if (!b) return null;
  return { name: b.name, belegnummer: b.belegnummer, belegart: b.belegart, datum_uhrzeit: b.datum_uhrzeit, gesamt_cent: b.gesamt_cent, trainings: b.trainings, bediener: b.bediener, storno_von: b.storno_von, kundenbeleg_email: b.kundenbeleg_email, kontakt: b.kontakt, storniert: !!b.storniert_durch };
}

export function belegeHeute(client, { kasse, limit = 30 }) {
  rollen(client);
  return belegeVon(client, kasse, heute(client))
    .sort((x, y) => String(y.datum_uhrzeit).localeCompare(String(x.datum_uhrzeit)) || (y.belegnummer || 0) - (x.belegnummer || 0))
    .slice(0, Number(limit) || 30)
    .map((b) => ({ name: b.name, belegnummer: b.belegnummer, belegart: b.belegart, datum_uhrzeit: b.datum_uhrzeit, gesamt_cent: b.gesamt_cent, trainings: b.trainings, bediener: b.bediener, storno_von: b.storno_von, storniert_durch: b.storniert_durch, kontakt: b.kontakt, kunde_name: b.kunde_name, zahlarten: (b.zahlarten || []).map((z) => z.zahlart), positionen_anzahl: (b.positionen || []).length }));
}

export function belegDaten(client, { name }) {
  rollen(client);
  const b = tabelle(client, "PH Kassenbeleg").get(name);
  if (!b) throw fehler("Beleg nicht gefunden.", "not_found");
  return JSON.parse(JSON.stringify(b));
}

export function belegMailen(client, { beleg, email }) {
  rollen(client);
  const e = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw fehler("E-Mail-Adresse ist ungültig.");
  const b = tabelle(client, "PH Kassenbeleg").get(beleg);
  if (!b) throw fehler("Beleg nicht gefunden.", "not_found");
  b.kundenbeleg_email = e;
  client.kommentar("PH Kassenbeleg", beleg, `Beleg per E-Mail gesendet (Mock, kein Versand)`, "Info");
  return { gesendet: true };
}

export function belegDrucken(client, { beleg }) {
  rollen(client);
  if (!tabelle(client, "PH Kassenbeleg").has(beleg)) throw fehler("Beleg nicht gefunden.", "not_found");
  return { modus: "PDF 80 mm", url: `/druck/kassenbeleg/${encodeURIComponent(beleg)}?format=bon` };
}

export function storno(client, { beleg, grund, freigabe = null }) {
  const leitung = rollen(client);
  if (!String(grund || "").trim()) throw fehler("Bitte einen Stornogrund angeben.");
  const t = tabelle(client, "PH Kassenbeleg");
  const alt = t.get(beleg);
  if (!alt || alt.docstatus !== 1) throw fehler("Beleg nicht gefunden oder nicht signiert.", "not_found");
  if (["Stornobeleg", "Nullbeleg", "Startbeleg", "Monatsbeleg", "Jahresbeleg", "Schlussbeleg", "Sammelbeleg"].includes(alt.belegart)) throw fehler("Dieser Beleg kann nicht storniert werden.");
  if (alt.storniert_durch) throw fehler("Beleg ist bereits storniert.", "conflict");
  if (istGesperrt(client, alt.kasse)) throw fehler("Kasse ist heute abgeschlossen.", "conflict");
  const noetig = stornoFreigabe({ bediener: alt.bediener, datum: String(alt.datum_uhrzeit).slice(0, 10), gesamt_cent: alt.gesamt_cent }, client.session.user, heute(client), leitung, einstellungen(client).storno_mitarbeiter_bis_cent);
  const freigabeVon = noetig.length ? freigabePruefen(freigabe ? json(freigabe) : null, noetig.map((c) => FREIGABE_TEXTE[c])) : null;
  const positionen = (alt.positionen || []).map(({ doctype: _d, name: _n, parent: _p, parentfield: _pf, parenttype: _pt, idx: _i, listenpreis_cent: _l, rabatt_promille: _rp, rabatt_cent: _rc, ...p }) => ({ ...p, art: p.art, einzel_brutto_cent: -Number(p.einzel_brutto_cent || 0), brutto_cent: -Number(p.brutto_cent || 0), netto_cent: -Number(p.netto_cent || 0), ust_cent: -Number(p.ust_cent || 0), bezug_doctype: "PH Kassenbeleg", bezug: alt.name }));
  const zahlarten = (alt.zahlarten || []).map((z) => ({ zahlart: z.zahlart, betrag_cent: -Number(z.betrag_cent || 0), gegeben_cent: -Number(z.betrag_cent || 0), retour_cent: 0, barumsatz: z.barumsatz }));
  const doc = belegAnlegen(client, { kasse: alt.kasse, belegart: "Stornobeleg", positionen, zahlarten, gesamt: -Number(alt.gesamt_cent || 0), kontakt: alt.kontakt, kunde_name: alt.kunde_name, trainings: alt.trainings, idem: `storno:${alt.name}`, extra: { storno_von: alt.name, storno_grund: grund, freigabe_von: freigabeVon || "" } });
  alt.storniert_durch = doc.name;
  alt.status = "Storniert";
  const bar = zahlarten.find((z) => z.zahlart === "Bar");
  if (bar && !alt.trainings && bar.betrag_cent) kassenbuchBuchen(client, alt.kasse, "Barausgabe", -bar.betrag_cent, `Storno ${alt.belegnummer}`, { beleg: doc.name, quelle: "beleg" });
  const st = zustand(client);
  for (const e of st.einloesungen) if (e.bezug === alt.name && e.status === "Eingeloest") e.status = "Storniert";
  return { beleg: doc.name, belegnummer: doc.belegnummer, freigabe_von: freigabeVon, erstattungen: zahlarten.filter((z) => z.zahlart === "Karte Stripe Terminal").map((z) => ({ betrag_cent: -z.betrag_cent, status: "succeeded" })), klaerfaelle: [], rueckzahlung: zahlarten.map((z) => ({ zahlart: z.zahlart, betrag_cent: -z.betrag_cent })), druck: { modus: "PDF 80 mm", schublade: !!bar } };
}

export function nullbeleg(client, { kasse }) {
  rollen(client);
  const doc = belegAnlegen(client, { kasse, belegart: "Nullbeleg", positionen: [], zahlarten: [], gesamt: 0, trainings: 0 });
  return { beleg: doc.name, belegnummer: doc.belegnummer, druck: { modus: "PDF 80 mm" } };
}

export function trainingsmodus(client, { kasse, an }) {
  rollen(client, true);
  const k = tabelle(client, "PH Kasse").get(kasse);
  if (!k) throw fehler("Kasse nicht gefunden.", "not_found");
  k.trainings_modus = Number(an) ? 1 : 0;
  client.kommentar("PH Kasse", kasse, `Trainingsmodus ${k.trainings_modus ? "ein" : "aus"} durch ${client.session.user}`, "Info");
  return k.trainings_modus;
}

export function retoureVorbereiten(client, { beleg, auswahl = null, grund = null }) {
  rollen(client);
  const b = tabelle(client, "PH Kassenbeleg").get(beleg);
  if (!b || b.docstatus !== 1) throw fehler("Beleg nicht gefunden.", "not_found");
  const schon = {};
  for (const r of tabelle(client, "PH Kassenbeleg").values()) for (const p of r.positionen || []) if (p.art === "Retoure" && p.bezug === b.name) schon[p.bezug_zeile] = (schon[p.bezug_zeile] || 0) + Number(p.menge || 0);
  const zeilen = (b.positionen || []).filter((p) => ["Artikel", "Freitext"].includes(p.art)).map((p) => ({ name: p.name, bezeichnung: p.bezeichnung, menge: p.menge, einzel_brutto_cent: p.einzel_brutto_cent, steuersatz: p.steuersatz, ruecknehmbar: Math.max(0, Number(p.menge) - (schon[p.name] || 0)), produkt: p.produkt }));
  const out = { beleg: b.name, kontakt: b.kontakt, kunde_name: b.kunde_name, datum: b.datum_uhrzeit, zeilen, standard: einstellungen(client).retoure_standard, zahlarten: (b.zahlarten || []).map((z) => z.zahlart) };
  if (auswahl) {
    const a = json(auswahl);
    const pos = zeilen.filter((z) => Number(a[z.name]) > 0).map((z) => {
      const m = Math.min(Number(a[z.name]), z.ruecknehmbar);
      if (!(m > 0)) throw fehler(`Rücknahme „${z.bezeichnung}“ übersteigt die rücknehmbare Menge.`);
      return { art: "Retoure", bezeichnung: z.bezeichnung, menge: m, einzel_brutto_cent: -Math.abs(z.einzel_brutto_cent), steuersatz: z.steuersatz, zusatz: grund || "", bezug_doctype: "PH Kassenbeleg", bezug: b.name, bezug_zeile: z.name, produkt: z.produkt };
    });
    const betrag = pos.reduce((s, p) => s + p.einzel_brutto_cent * p.menge, 0);
    out.positionen = pos;
    out.betrag_cent = Math.round(betrag);
    out.rueckzahlung = (b.zahlarten || []).some((z) => z.zahlart === "Karte Stripe Terminal") ? [{ zahlart: "Karte Stripe Terminal", betrag_cent: Math.round(betrag) }] : [{ zahlart: "Bar", betrag_cent: Math.round(betrag) }];
  }
  return out;
}

// ---------------------------------------------------------------- Kassenbuch --

export function kassenbuchBuchenSeite(client, { kasse, art, betrag_cent, grund }) {
  rollen(client);
  if (!["Einlage", "Entnahme", "Anfangsbestand"].includes(art)) throw fehler("Nur Einlage, Entnahme oder Anfangsbestand über die Kassa.");
  if (!(Number(betrag_cent) > 0)) throw fehler("Betrag muss größer 0 sein.");
  if (istGesperrt(client, kasse)) throw fehler("Kasse ist heute abgeschlossen.", "conflict");
  const doc = kassenbuchBuchen(client, kasse, art, Number(betrag_cent), grund);
  return { name: doc.name, bestand_danach_cent: doc.bestand_danach_cent };
}

export function ladeOeffnen(client, { kasse, grund }) {
  rollen(client);
  if (!String(grund || "").trim()) throw fehler("Grund angeben (z. B. Wechselgeld).");
  ereignisAnlegen(client, kasse, "Lade geoeffnet", `${client.session.user}: ${grund}`);
  return { modus: "schublade", kasse };
}

function ereignisAnlegen(client, kasse, art, notiz) {
  const t = tabelle(client, "PH Kassa Ereignis");
  const nr = t.size + 1;
  const name = `PH-KEV-${heute(client).slice(0, 4)}-${String(nr + 100).padStart(5, "0")}`;
  const z = jetzt(client);
  t.set(name, { doctype: "PH Kassa Ereignis", name, naming_series: "PH-KEV-.YYYY.-.#####", titel: `${art} · ${kasse}`, kasse, art, status: "Erledigt", zeitpunkt: z, notiz, automatisch: 0, docstatus: 0, creation: z, modified: z, owner: client.session.user, modified_by: client.session.user });
}

// ----------------------------------------------------------------- Abschluss --

function abschlussRechnen(client, doc) {
  const belege = belegeVon(client, doc.kasse, doc.datum);
  const soll = sollAusBelegen(belege);
  const buch = [...tabelle(client, "PH Kassenbuch").values()].filter((z) => z.kasse === doc.kasse && z.datum === doc.datum && z.status === "Gebucht");
  const einlagen = buch.filter((z) => z.art === "Einlage").reduce((a, z) => a + z.betrag_cent, 0);
  const entnahmen = buch.filter((z) => z.art === "Entnahme").reduce((a, z) => a + z.betrag_cent, 0);
  Object.assign(doc, {
    bar_einnahmen_cent: soll.bar_einnahmen_cent, bar_ausgaben_cent: soll.bar_ausgaben_cent, einlagen_cent: einlagen, entnahmen_cent: entnahmen,
    karten_cent: soll.karten_cent, gutschein_cent: soll.gutschein_cent, ueberweisung_cent: soll.ueberweisung_cent, umsatz_cent: soll.umsatz_cent,
    anzahlungen_cent: soll.anzahlungen_cent, gutschein_verkauf_cent: soll.gutschein_verkauf_cent, gutschein_einloesung_cent: soll.gutschein_einloesung_cent, retouren_cent: soll.retouren_cent,
    belege_anzahl: soll.belege_anzahl, stornos_anzahl: soll.stornos_anzahl, trainings_anzahl: soll.trainings_anzahl,
    umsatz_je_satz: Object.entries(soll.je_satz).map(([steuersatz, s]) => ({ steuersatz, ...s })),
  });
  doc.bargeld_soll_cent = bargeldSoll(doc.bargeld_anfang_cent || 0, doc.bar_einnahmen_cent, doc.bar_ausgaben_cent, einlagen, entnahmen);
  if (doc.status !== "Offen") doc.differenz_cent = (doc.bargeld_ist_cent || 0) - doc.bargeld_soll_cent;
  return doc;
}

export function zusammenfassung(doc) {
  const f = ["name", "kasse", "datum", "status", "bargeld_anfang_cent", "bargeld_soll_cent", "bargeld_ist_cent", "differenz_cent", "differenz_grund", "bar_einnahmen_cent", "bar_ausgaben_cent", "einlagen_cent", "entnahmen_cent", "karten_cent", "gutschein_cent", "ueberweisung_cent", "umsatz_cent", "belege_anzahl", "stornos_anzahl", "trainings_anzahl", "anfang_quelle", "anfang_hinweis", "retouren_cent", "anzahlungen_cent", "gutschein_verkauf_cent", "gutschein_einloesung_cent", "von_user", "freigegeben_von", "geschlossen_am", "unterschrift_name"];
  const out = Object.fromEntries(f.map((k) => [k, doc[k] ?? null]));
  out.zaehlprotokoll = (doc.zaehlprotokoll || []).map((z) => ({ stueckelung_cent: z.stueckelung_cent, anzahl: z.anzahl, summe_cent: z.summe_cent }));
  out.umsatz_je_satz = doc.umsatz_je_satz || [];
  return out;
}

function oeffnenOderHolen(client, kasse, tag) {
  let doc = abschlussVon(client, kasse, tag);
  if (!doc) {
    const t = tabelle(client, "PH Kassenabschluss");
    const nr = client.naechsteNummer(`KA-${tag.slice(0, 4)}-`) + 900;
    const name = `KA-${tag.slice(0, 4)}-${String(nr).padStart(5, "0")}`;
    const z = jetzt(client);
    const vor = [...t.values()].filter((a) => a.kasse === kasse && a.datum < tag && a.status === "Abgeschlossen").sort((a, b) => b.datum.localeCompare(a.datum))[0];
    doc = { doctype: "PH Kassenabschluss", name, naming_series: "KA-.YYYY.-.#####", titel: `Kassenabschluss ${tag}`, kasse, datum: tag, status: "Offen", eroeffnet_am: z, bargeld_anfang_cent: vor ? Number(vor.bargeld_ist_cent || 0) - Number(vor._tresor_cent || 0) : 0, anfang_quelle: "Vortag", zaehlprotokoll: [], umsatz_je_satz: [], docstatus: 0, creation: z, modified: z, owner: client.session.user, modified_by: client.session.user, quelle: "kassa" };
    t.set(name, doc);
  }
  return abschlussRechnen(client, doc);
}

function abschlussTag(client, datum) {
  const tag = datum || heute(client);
  if (tag > heute(client)) throw fehler("Abschluss für zukünftige Tage ist nicht möglich.");
  if (tag < heute(client)) rollen(client, true);
  return tag;
}

export function abschlussLaden(client, { kasse, datum }) {
  rollen(client);
  return zusammenfassung(oeffnenOderHolen(client, kasse, abschlussTag(client, datum)));
}

export function abschlussZaehlen(client, { kasse, zaehlprotokoll, bargeld_anfang_cent, unterschrift_name, datum, anfang_grund }) {
  rollen(client);
  const doc = oeffnenOderHolen(client, kasse, abschlussTag(client, datum));
  if (doc.status === "Abgeschlossen") throw fehler("Aktion „zaehlen“ ist im Status „Abgeschlossen“ nicht möglich.", "conflict");
  const zeilen = json(zaehlprotokoll);
  let ist;
  try {
    ist = zaehlprotokollSumme(zeilen);
  } catch (err) {
    throw fehler(err.message);
  }
  if (bargeld_anfang_cent !== undefined && bargeld_anfang_cent !== null && bargeld_anfang_cent !== "") {
    doc.bargeld_anfang_cent = Number(bargeld_anfang_cent);
    doc.anfang_quelle = "manuell";
    doc.anfang_grund = anfang_grund || "";
  }
  Object.assign(doc, { zaehlprotokoll: zeilen.map((z) => ({ stueckelung_cent: z.stueckelung_cent, anzahl: z.anzahl, summe_cent: z.stueckelung_cent * z.anzahl })), bargeld_ist_cent: ist, status: "Gezaehlt", von_user: client.session.user, unterschrift_name: unterschrift_name || "", modified: jetzt(client) });
  abschlussRechnen(client, doc);
  return zusammenfassung(doc);
}

export function abschlussAbschliessen(client, { kasse, differenz_grund, unterschrift_name, datum, tresor_entnahme_cent }) {
  rollen(client, true);
  const tag = abschlussTag(client, datum);
  const doc = oeffnenOderHolen(client, kasse, tag);
  if (doc.status !== "Gezaehlt") throw fehler(`Aktion „abschliessen“ ist im Status „${doc.status}“ nicht möglich.`, "conflict");
  const einst = einstellungen(client);
  if (differenzGrundPflichtig(doc.differenz_cent || 0, einst.differenz_toleranz_cent) && !String(differenz_grund || "").trim()) throw fehler("Differenz außerhalb der Toleranz – Grund angeben.");
  if (Number(einst.abschluss_unterschrift_pflicht) && !String(unterschrift_name || "").trim()) throw fehler("Unterschrift mit Namen ist Pflicht.");
  if (Number(tresor_entnahme_cent) > 0) {
    kassenbuchBuchen(client, kasse, "Entnahme", Number(tresor_entnahme_cent), "Entnahme Tresor/Bank beim Tagesabschluss", { idem: `tresor:${kasse}:${tag}` });
    doc._tresor_cent = Number(tresor_entnahme_cent);
  }
  if (doc.differenz_cent) kassenbuchBuchen(client, kasse, "Differenz", doc.differenz_cent, `Differenz Abschluss ${doc.name}`, { quelle: "abschluss", idem: `diff:${doc.name}` });
  Object.assign(doc, { status: "Abgeschlossen", differenz_grund: differenz_grund || "", freigegeben_von: client.session.user, geschlossen_am: jetzt(client), unterschrift_name: unterschrift_name || doc.unterschrift_name || "", modified: jetzt(client) });
  return { ...zusammenfassung(doc), pdf_url: `/druck/kassenabschluss/${encodeURIComponent(doc.name)}` };
}

// ------------------------------------------------------------------ Terminal --

export function terminalStart(client, { kasse, terminal, betrag_cent }) {
  rollen(client);
  if (!(Number(betrag_cent) > 0)) throw fehler("Betrag muss größer 0 sein.");
  const st = zustand(client);
  const pi = `pi_mock_${Date.now().toString(36)}${Object.keys(st.terminal).length}`;
  st.terminal[pi] = { payment_intent: pi, status: "requires_payment_method", betrag_cent: Number(betrag_cent), reader: terminal, kasse, start: Date.now() };
  return { payment_intent: pi, status: "requires_payment_method", betrag_cent: Number(betrag_cent), fertig: false, bezahlt: false, reader: terminal };
}

export function terminalStatus(client, { payment_intent }) {
  rollen(client);
  const t = zustand(client).terminal[payment_intent];
  if (!t) throw fehler("Zahlung unbekannt.", "not_found");
  const einst = einstellungen(client);
  const alter = (Date.now() - t.start) / 1000;
  const fertig = ["succeeded", "canceled"].includes(t.status);
  const out = { payment_intent, status: t.status, betrag_cent: t.betrag_cent, fertig, bezahlt: t.status === "succeeded", reader: t.reader };
  if (!fertig) out.zeit = alter > einst.terminal_timeout_s ? "abbruch" : alter > einst.terminal_warnung_s ? "warnung" : "ok";
  if (out.zeit === "abbruch") {
    t.status = "canceled";
    Object.assign(out, { status: "canceled", fertig: true, zeit: "abgebrochen" });
  }
  return out;
}

export function terminalAbbruch(client, { payment_intent }) {
  rollen(client);
  const t = zustand(client).terminal[payment_intent];
  if (!t) throw fehler("Zahlung unbekannt.", "not_found");
  if (t.status === "succeeded") throw fehler("Die Zahlung ist bereits bestätigt.", "conflict");
  t.status = "canceled";
  return { payment_intent, status: "canceled", fertig: true, bezahlt: false, betrag_cent: t.betrag_cent };
}

export function terminalSimulieren(client, { terminal, erfolgreich = 1 }) {
  rollen(client);
  const st = zustand(client);
  const t = Object.values(st.terminal).filter((x) => x.reader === terminal && x.status === "requires_payment_method").sort((a, b) => b.start - a.start)[0];
  if (!t) throw fehler("Am Terminal wartet keine Zahlung.", "not_found");
  t.status = Number(erfolgreich) ? "succeeded" : "requires_payment_method";
  if (!Number(erfolgreich)) t.abgelehnt = (t.abgelehnt || 0) + 1;
  return { payment_intent: t.payment_intent, status: t.status, abgelehnt: !Number(erfolgreich) };
}

/** page.beleg_vorschau – Live-Rechnung ohne Buchung. */
export function belegVorschau(client, { positionen, zahlarten }) {
  rollen(client);
  try {
    const s = json(zahlarten).length ? belegPruefen(json(positionen), json(zahlarten)) : { ...summen(json(positionen)), rueckgeld_cent: 0 };
    return { gesamt_cent: s.gesamt_cent, netto_cent: s.netto_cent, ust_cent: s.ust_cent, je_satz: s.je_satz, rueckgeld_cent: s.rueckgeld_cent || 0, rueckgeld_stueckelung: s.rueckgeld_cent > 0 ? stueckelung(s.rueckgeld_cent) : [], positionen: s.positionen };
  } catch (err) {
    if (err instanceof KassenFehler) return { fehler: err.message };
    throw err;
  }
}

/** Mock-Schalter (nur Entwicklung): Netzfehler beim nächsten Buchen. */
export function mockNetzfehler(client, n = 3) {
  zustand(client).netzfehler = n;
}

// -------------------------------------------------------------- Dispatcher --

/** Pfad-Endung → Mock-Funktion (siehe frappe.js). */
export const MOCK_METHODEN = Object.freeze({
  kontext, suche_produkt: sucheProdukt, suche_kunde: sucheKunde, kassen_katalog: kassenKatalog, schnelltasten, code_erkennen: codeErkennen,
  gutschein_pruefen: gutscheinPruefen, beleg_vorschau: belegVorschau, beleg_buchen: belegBuchen, letzter_beleg: letzterBeleg, belege_heute: belegeHeute, beleg_mailen: belegMailen,
  beleg_drucken: belegDrucken, storno, nullbeleg, trainingsmodus, retoure_vorbereiten: retoureVorbereiten, kassenbuch_buchen: kassenbuchBuchenSeite,
  lade_oeffnen: ladeOeffnen, abschluss_laden: abschlussLaden, abschluss_zaehlen: abschlussZaehlen, abschluss_abschliessen: abschlussAbschliessen,
  terminal_start: terminalStart, terminal_status: terminalStatus, terminal_abbruch: terminalAbbruch, terminal_simulieren: terminalSimulieren,
  kunde_anlegen: kundeAnlegen, leitung_freigabe_pruefen: leitungFreigabePruefen, beleg_daten: belegDaten, karte_pruefen: kartePruefen,
});
