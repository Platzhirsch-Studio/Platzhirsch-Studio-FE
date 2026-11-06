// Mock-Seed – Bereich Kassa (G-01, MASTER § 3.5). Schreibt: Team B-KAS.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// B-KAS: `kern` bleibt unverändert (die r-Aufrufe laufen über alle DocTypes). Der Nachlauf baut die
// Kassa-Tabellen danach fachlich stimmig neu auf (eigener Zufall `hilfe.rng`): zwei Kassen, Signatureinheit,
// Terminal, Schnelltasten, Einstellungen, ~50 Belege der letzten 14 Tage (heute inklusive) mit Positionen und
// Zahlarten, Storno-Paar, Trainings-, Null- und Ausfallbeleg, Kassenbuch mit laufendem Bestand, Abschlüsse in
// jedem Status (Offen · Gezählt · Abgeschlossen mit/ohne Differenz · wieder geöffnet), Ereignisse und DEP-Exporte.
// Datumsbezug ist der echte heutige Tag (die Kassa zeigt „heute“).

import { isoDatumZeit } from "../../format.js";
import { tage } from "./basis.js";
import { summen } from "../../kassa/betraege.js";
import { MOCK_KATALOG } from "../../kassa/katalog.js";
import { STANDARD_EINSTELLUNGEN } from "../../kassa/einstellungen.js";

/** Stempel der Kassa-Daten (kassa/mock.js `sicherstellen` baut veraltete Daten im laufenden Mock neu). */
export const SEED_VERSION = "b-kas-2026-11-04-2";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen (Kontakte/Kundenkarten nur gelesen). */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Kassenbeleg": 20,
  "PH Kasse": 2,
  "PH Terminal": 1,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Kassenbeleg": (doc, { i, r }) => {
    doc.kasse = "KASSE-LOCHAU-01";
    doc.belegnummer = 1000 + i;
    doc.name = `KASSE-LOCHAU-01-${1000 + i}`;
    doc.belegart = i === 0 ? "Startbeleg" : r.chance(0.9) ? "Standard" : "Nullbeleg";
    doc.datum_uhrzeit = isoDatumZeit(tage(-Math.floor(i / 2), r));
    doc.status = r.pick(["Signiert", "Signiert", "Signiert", "Signiert", "Ausfall", "Storniert"]);
    doc.gesamt_cent = doc.belegart === "Standard" ? r.pick([1900, 4900, 12900, 24900, 38000]) : 0;
    doc.docstatus = doc.status === "Entwurf" ? 0 : 1;
    doc.titel = `Beleg ${doc.belegnummer}`;
  },
  "PH Kasse": (doc, { i }) => {
    doc.kassen_id = i === 0 ? "KASSE-LOCHAU-01" : "KASSE-LOCHAU-02";
    doc.name = doc.kassen_id;
    doc.bezeichnung = i === 0 ? "Kassa Showroom Lochau" : "Kassa Lager/Abholung";
    doc.status = i === 0 ? "Aktiv" : "Registriert";
  },
};

export const K1 = "KASSE-LOCHAU-01";
export const K2 = "KASSE-LOCHAU-02";
export const TERMINAL = "tmr_MOCK_LOCHAU_01";
const MITARBEITER = "kassa@demo.local";
const LEITUNG = "kassa-leitung@demo.local";

const pad = (n, l) => String(n).padStart(l, "0");
function tagIso(offset, basis = new Date()) {
  const d = new Date(basis.getFullYear(), basis.getMonth(), basis.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}
const zeitpunkt = (tag, h, m) => `${tag} ${pad(h, 2)}:${pad(m, 2)}:00`;

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  if (db && typeof db === "object") db.__kassaSeed = SEED_VERSION;
  const r = hilfe.rng;
  const tab = (dt) => {
    if (!db.has(dt)) db.set(dt, new Map());
    return db.get(dt);
  };
  const basis = { owner: LEITUNG, modified_by: LEITUNG, idx: 0 };
  const jetzt = new Date();
  const heute = tagIso(0, jetzt);
  const stunde = Math.max(10, Math.min(jetzt.getHours(), 18));

  // ---- Einstellungen (Single) ----
  const einst = tab("PH Kassa Einstellungen");
  const e = einst.get("PH Kassa Einstellungen") || { doctype: "PH Kassa Einstellungen", name: "PH Kassa Einstellungen" };
  einst.set("PH Kassa Einstellungen", { ...e, ...STANDARD_EINSTELLUNGEN, trainings_banner_text: "Training – kein gültiger Beleg", bondrucker_modus: "PDF 80 mm", bon_breite_zeichen: "42", schublade_oeffnen: 1, beleg_email_kopie_an: "", abschluss_nullbeleg_automatisch: 0, trinkgeld_erfassen: 0, anzahlungsrechnung_automatisch: 1, tageswechsel_uhrzeit: "00:00:00", kundendisplay_text: "Schön, dass Sie da sind.", chf_kurs_mikro: 0, chf_kurs_datum: "", chf_kurs_max_alter_tage: 7 });

  // ---- Signatureinheit, Kassen, Terminal ----
  const see = tab("PH Signatureinheit");
  see.clear();
  see.set("SEE Test Lochau", { doctype: "PH Signatureinheit", name: "SEE Test Lochau", bezeichnung: "SEE Test Lochau", art: "Test", env: "test", status: "Aktiv", vda_id: "AT0", zertifikat_seriennummer: "MOCK-0001", zertifikat_gueltig_bis: tagIso(700, jetzt), letzte_pruefung: zeitpunkt(tagIso(-1, jetzt), 8, 0), letzte_pruefung_ergebnis: "Verbindung in Ordnung (Testumgebung)", docstatus: 0, creation: zeitpunkt(tagIso(-40, jetzt), 9, 0), modified: zeitpunkt(tagIso(-1, jetzt), 8, 0), ...basis });
  see.set("SEE Reserve", { doctype: "PH Signatureinheit", name: "SEE Reserve", bezeichnung: "SEE Reserve", art: "A-Trust a.sign RK Online", env: "produktiv", status: "Angelegt", vda_id: "AT1", docstatus: 0, creation: zeitpunkt(tagIso(-10, jetzt), 9, 0), modified: zeitpunkt(tagIso(-10, jetzt), 9, 0), ...basis });

  const kassen = tab("PH Kasse");
  kassen.clear();
  const checkliste = (fertig) => ["AES-Schluessel erzeugt", "SEE bestellt", "SEE registriert FinanzOnline", "Kasse registriert FinanzOnline", "Startbeleg erstellt", "Startbeleg geprueft (BMF-App)"].map((schritt, i) => ({ doctype: "PH Kassa Checkliste", schritt, erledigt: i < fertig ? 1 : 0, datum: i < fertig ? tagIso(-40 + i, jetzt) : "", hinweis: "", idx: i + 1, name: `chk-${i + 1}`, parentfield: "registrierung", parenttype: "PH Kasse" }));
  kassen.set(K1, { doctype: "PH Kasse", name: K1, kassen_id: K1, bezeichnung: "Kassa 1", standort: "Showroom Lochau", status: "Aktiv", see: "SEE Test Lochau", trainings_modus: 0, bon_drucker: "PDF A4", kundendisplay: 1, aes_schluessel_vorhanden: 1, aes_pruefwert: "MOCK", belegnummer_zaehler: 0, startbeleg_erstellt_am: zeitpunkt(tagIso(-30, jetzt), 9, 0), startbeleg_geprueft_am: "", finanzonline_registriert_am: tagIso(-33, jetzt), registrierung: checkliste(5), notiz: "", docstatus: 0, creation: zeitpunkt(tagIso(-40, jetzt), 9, 0), modified: zeitpunkt(heute, 8, 0), ...basis });
  kassen.set(K2, { doctype: "PH Kasse", name: K2, kassen_id: K2, bezeichnung: "Kassa 2", standort: "Lager und Abholung", status: "Registriert", see: "SEE Test Lochau", trainings_modus: 1, bon_drucker: "PDF A4", kundendisplay: 0, aes_schluessel_vorhanden: 1, belegnummer_zaehler: 0, registrierung: checkliste(1), notiz: "Training bis zur Inbetriebnahme", docstatus: 0, creation: zeitpunkt(tagIso(-12, jetzt), 9, 0), modified: zeitpunkt(tagIso(-1, jetzt), 8, 0), ...basis });

  const term = tab("PH Terminal");
  term.clear();
  term.set(TERMINAL, { doctype: "PH Terminal", name: TERMINAL, reader_id: TERMINAL, bezeichnung: "Terminal Tresen", titel: "Terminal Tresen", status: "Online", kasse: K1, testmodus: 1, aktiv: 1, geraetetyp: "Test-Terminal", seriennummer: "MOCK-TERM-01", letzter_kontakt: zeitpunkt(heute, 8, 5), docstatus: 0, creation: zeitpunkt(tagIso(-30, jetzt), 9, 0), modified: zeitpunkt(heute, 8, 5), ...basis });
  term.set("tmr_MOCK_LAGER", { doctype: "PH Terminal", name: "tmr_MOCK_LAGER", reader_id: "tmr_MOCK_LAGER", bezeichnung: "Terminal Abholung", titel: "Terminal Abholung", status: "Offline", kasse: K2, testmodus: 1, aktiv: 1, geraetetyp: "Test-Terminal", letzter_kontakt: zeitpunkt(tagIso(-3, jetzt), 16, 0), docstatus: 0, creation: zeitpunkt(tagIso(-12, jetzt), 9, 0), modified: zeitpunkt(tagIso(-3, jetzt), 16, 0), ...basis });

  // ---- Schnelltasten (Produktkacheln) ----
  const st = tab("PH Kassa Schnelltaste");
  st.clear();
  MOCK_KATALOG.forEach((p, i) => st.set(`st-${i + 1}`, { doctype: "PH Kassa Schnelltaste", name: `st-${i + 1}`, titel: p.bezeichnung, kasse: "", reihenfolge: (i + 1) * 10, aktion: "Produkt", produkt: p.produkt, bezeichnung: p.bezeichnung, betrag_cent: p.einzel_brutto_cent, steuersatz: p.steuersatz, farbe: "", bild: p.bild, aktiv: 1, docstatus: 0, creation: zeitpunkt(tagIso(-20, jetzt), 9, 0), modified: zeitpunkt(tagIso(-20, jetzt), 9, 0), ...basis }));
  st.set("st-gutschein", { doctype: "PH Kassa Schnelltaste", name: "st-gutschein", titel: "Geschenkgutschein", kasse: "", reihenfolge: 900, aktion: "Gutschein Verkauf", produkt: "", bezeichnung: "Geschenkgutschein", betrag_cent: 25000, steuersatz: "Null 0", farbe: "", bild: "", aktiv: 1, docstatus: 0, creation: zeitpunkt(tagIso(-20, jetzt), 9, 0), modified: zeitpunkt(tagIso(-20, jetzt), 9, 0), ...basis });

  // ---- Belege und Kassenbuch ----
  const belege = tab("PH Kassenbeleg");
  belege.clear();
  const buch = tab("PH Kassenbuch");
  buch.clear();
  const kontakte = [...tab("PH Kontakt").values()];
  const zaehler = { [K1]: 0, [K2]: 0 };
  const bestand = { [K1]: 0, [K2]: 0 };
  let kbNr = 0;
  const kb = (kasse, art, betrag, grund, z, extra = {}) => {
    const vz = { Anfangsbestand: 1, Einlage: 1, Entnahme: -1, Bareinnahme: 1, Barausgabe: -1, Differenz: 1 }[art];
    const bew = art === "Differenz" ? betrag : vz * Math.abs(betrag);
    bestand[kasse] += bew;
    kbNr += 1;
    const name = `KB-${z.slice(0, 4)}-${pad(kbNr, 5)}`;
    buch.set(name, { doctype: "PH Kassenbuch", name, naming_series: "KB-.YYYY.-.#####", titel: `${art}: ${grund}`, kasse, art, status: "Gebucht", zeitpunkt: z, datum: z.slice(0, 10), bediener: extra.bediener || MITARBEITER, betrag_cent: Math.abs(betrag), bewegung_cent: bew, bestand_danach_cent: bestand[kasse], waehrung: "EUR", grund, beleg: extra.beleg || "", kassenabschluss: extra.kassenabschluss || "", zahlung: "", storno_von: "", storniert_durch: "", idempotency_key: "", quelle: extra.quelle || "kassa", docstatus: 0, creation: z, modified: z, ...basis });
    return name;
  };
  const beleg = (kasse, tag, h, m, { art = "Standard", pos = [], zahl = [], kontakt = null, bediener = MITARBEITER, training = 0, status = "Signiert", extra = {} } = {}) => {
    zaehler[kasse] += 1;
    const nr = zaehler[kasse];
    const name = `${kasse}-${pad(nr, 6)}`;
    const z = zeitpunkt(tag, h, m);
    const s = summen(pos);
    const k = kontakt ? kontakte.find((c) => c.name === kontakt) : null;
    const doc = {
      doctype: "PH Kassenbeleg", name, titel: `Beleg ${nr}`, kasse, belegnummer: nr, belegart: training ? "Trainingsbeleg" : art, datum_uhrzeit: z, geschaeftstag: tag, status, kontakt: kontakt || "", kunde_name: k ? k.titel || "" : "",
      bediener, freigabe_von: "", freigabe_gruende: "", trainings: training, see_ausgefallen: status === "Ausfall" ? 1 : 0, nachsigniert: 0, auftrag: "", rechnung: "", barverkauf_rechnung: "", bestellung: "", zahlungsplan_position: "", kassenabschluss: "", storno_von: "", storno_grund: "", storniert_durch: "",
      positionen: s.positionen.map((p, i) => ({ ...p, doctype: "PH Kassenbeleg Position", idx: i + 1, name: `pos-${i + 1}`, parent: name, parentfield: "positionen", parenttype: "PH Kassenbeleg" })),
      zahlarten: zahl.map((x, i) => ({ zahlart: x.zahlart, betrag_cent: x.betrag_cent, gegeben_cent: x.gegeben_cent ?? x.betrag_cent, retour_cent: x.retour_cent || 0, barumsatz: x.zahlart === "Ueberweisung" ? 0 : 1, terminal_payment_intent: x.zahlart === "Karte Stripe Terminal" ? `pi_seed_${name}` : "", doctype: "PH Kassenbeleg Zahlung", idx: i + 1, name: `zahl-${i + 1}`, parent: name, parentfield: "zahlarten", parenttype: "PH Kassenbeleg" })),
      ...s.rksv, gesamt_cent: s.gesamt_cent, ust_cent: s.ust_cent, waehrung: "EUR", umsatzzaehler_verschluesselt: "MOCK", signatur_vorbeleg: "MOCK", zertifikat_seriennummer: status === "Ausfall" ? "" : "MOCK-0001", zda_id: "AT0",
      jws_compact: status === "Ausfall" ? "" : `eyJhbGciOiJFUzI1NiJ9.MOCK.${name}`, maschinenlesbarer_code: `_R1-AT0_${kasse}_${nr}_${z.replace(" ", "T")}_MOCK`, ocr_code: "", gedruckt_am: z, druck_pdf: "", kundenbeleg_email: "",
      dep_exportiert: 0, dep_export: "", quelle: "Kassa", nebenbuchung_status: "OK", idempotency_key: `seed:${name}`, docstatus: 1, creation: z, modified: z, ...basis, ...extra,
    };
    belege.set(name, doc);
    const bar = doc.zahlarten.find((x) => x.zahlart === "Bar");
    if (bar && !training && bar.betrag_cent) kb(kasse, bar.betrag_cent > 0 ? "Bareinnahme" : "Barausgabe", bar.betrag_cent, `Beleg ${nr}`, z, { beleg: name, bediener, quelle: "beleg" });
    return doc;
  };
  const artikel = (i, menge = 1) => {
    const p = MOCK_KATALOG[i];
    return { art: "Artikel", produkt: p.produkt, bezeichnung: p.bezeichnung, menge, einzel_brutto_cent: p.einzel_brutto_cent, steuersatz: p.steuersatz };
  };
  const zahlweise = (gesamt, art) => {
    if (art === "bar") {
      const gegeben = Math.ceil(gesamt / 5000) * 5000;
      return [{ zahlart: "Bar", betrag_cent: gesamt, gegeben_cent: gegeben, retour_cent: gegeben - gesamt }];
    }
    if (art === "split") return [{ zahlart: "Karte Stripe Terminal", betrag_cent: gesamt - 5000 }, { zahlart: "Bar", betrag_cent: 5000, gegeben_cent: 5000 }];
    return [{ zahlart: "Karte Stripe Terminal", betrag_cent: gesamt }];
  };

  // Startbeleg vor 30 Tagen + Anfangsbestand
  beleg(K1, tagIso(-30, jetzt), 9, 0, { art: "Startbeleg", bediener: LEITUNG });
  kb(K1, "Anfangsbestand", 15000, "Wechselgeld Erstbefüllung", zeitpunkt(tagIso(-30, jetzt), 9, 5), { bediener: LEITUNG });
  beleg(K2, tagIso(-12, jetzt), 9, 0, { art: "Startbeleg", bediener: LEITUNG, training: 0 });
  kb(K2, "Anfangsbestand", 10000, "Wechselgeld Erstbefüllung", zeitpunkt(tagIso(-12, jetzt), 9, 5), { bediener: LEITUNG });

  const abschluesse = tab("PH Kassenabschluss");
  abschluesse.clear();
  let kaNr = 0;
  const tagesBelege = (kasse, tag) => [...belege.values()].filter((b) => b.kasse === kasse && b.geschaeftstag === tag);

  const abschluss = (kasse, tag, status, { differenz = 0, grund = "", tresor = 0 } = {}) => {
    kaNr += 1;
    const name = `KA-${tag.slice(0, 4)}-${pad(kaNr, 5)}`;
    const bl = tagesBelege(kasse, tag).filter((b) => !b.trainings);
    const bar = (x) => x.zahlarten.filter((z) => z.zahlart === "Bar").reduce((a, z) => a + z.betrag_cent, 0);
    const einnahmen = bl.reduce((a, b) => a + Math.max(0, bar(b)), 0);
    const ausgaben = bl.reduce((a, b) => a + Math.max(0, -bar(b)), 0);
    const buchTag = [...buch.values()].filter((z) => z.kasse === kasse && z.datum === tag);
    const einlagen = buchTag.filter((z) => z.art === "Einlage").reduce((a, z) => a + z.betrag_cent, 0);
    const entnahmen = buchTag.filter((z) => z.art === "Entnahme").reduce((a, z) => a + z.betrag_cent, 0);
    const anfang = [...buch.values()].filter((z) => z.kasse === kasse && z.datum < tag).reduce((a, z) => a + z.bewegung_cent, 0);
    const soll = anfang + einnahmen - ausgaben + einlagen - entnahmen;
    const ist = status === "Offen" ? 0 : soll + differenz;
    const zaehl = [];
    let rest = ist;
    for (const s of [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]) {
      const n = Math.floor(rest / s);
      rest -= n * s;
      zaehl.push({ doctype: "PH Kassenabschluss Zaehlung", stueckelung_cent: s, bezeichnung: s >= 500 ? `${s / 100} €` : s >= 100 ? `${s / 100} €` : `${s} Cent`, anzahl: n, summe_cent: n * s, idx: zaehl.length + 1, name: `z-${zaehl.length + 1}`, parentfield: "zaehlprotokoll", parenttype: "PH Kassenabschluss" });
    }
    const jeSatz = summen(bl.flatMap((b) => b.positionen.map(({ doctype: _d, ...p }) => p)));
    const geschlossen = ["Abgeschlossen", "Korrigiert"].includes(status) ? zeitpunkt(tag, 18, 40) : "";
    const doc = {
      doctype: "PH Kassenabschluss", name, naming_series: "KA-.YYYY.-.#####", titel: `Kassenabschluss ${tag}`, kasse, datum: tag, status, eroeffnet_am: zeitpunkt(tag, 9, 0), geschlossen_am: geschlossen,
      von_user: status === "Offen" ? "" : MITARBEITER, freigegeben_von: geschlossen ? LEITUNG : "", bargeld_anfang_cent: anfang, anfang_quelle: "Vortag", anfang_grund: "", anfang_hinweis: "",
      bar_einnahmen_cent: einnahmen, bar_ausgaben_cent: ausgaben, einlagen_cent: einlagen, entnahmen_cent: entnahmen, bargeld_soll_cent: soll,
      karten_cent: bl.reduce((a, b) => a + b.zahlarten.filter((z) => z.zahlart.startsWith("Karte")).reduce((x, z) => x + z.betrag_cent, 0), 0),
      gutschein_cent: bl.reduce((a, b) => a + b.zahlarten.filter((z) => z.zahlart === "Gutschein").reduce((x, z) => x + z.betrag_cent, 0), 0), ueberweisung_cent: 0,
      umsatz_cent: bl.reduce((a, b) => a + b.gesamt_cent, 0), anzahlungen_cent: 0, gutschein_verkauf_cent: bl.reduce((a, b) => a + b.positionen.filter((p) => p.art === "Gutschein Verkauf").reduce((x, p) => x + p.brutto_cent, 0), 0), gutschein_einloesung_cent: 0, retouren_cent: 0,
      belege_anzahl: bl.length, stornos_anzahl: bl.filter((b) => b.belegart === "Stornobeleg").length, trainings_anzahl: tagesBelege(kasse, tag).filter((b) => b.trainings).length, nullbeleg: "",
      zaehlprotokoll: status === "Offen" ? [] : zaehl, bargeld_ist_cent: ist, differenz_cent: status === "Offen" ? 0 : differenz, differenz_grund: grund, differenz_buchung: "",
      umsatz_je_satz: Object.entries(jeSatz.je_satz).map(([steuersatz, s], i) => ({ doctype: "PH Kassenabschluss Steuersatz", steuersatz, ...s, idx: i + 1, name: `s-${i + 1}`, parentfield: "umsatz_je_satz", parenttype: "PH Kassenabschluss" })),
      unterschrift: "", unterschrift_name: status === "Offen" ? "" : "David Vorlage", pdf: "", idempotency_key: "", quelle: "kassa", notiz: status === "Korrigiert" ? "Wieder geöffnet: Kartenbeleg nachgetragen" : "",
      _tresor_cent: tresor, docstatus: 0, creation: zeitpunkt(tag, 9, 0), modified: geschlossen || zeitpunkt(tag, 18, 30), ...basis,
    };
    abschluesse.set(name, doc);
    if (geschlossen) {
      if (differenz) doc.differenz_buchung = kb(kasse, "Differenz", differenz, `Differenz Abschluss ${name}`, zeitpunkt(tag, 18, 41), { bediener: LEITUNG, quelle: "abschluss", kassenabschluss: name });
      if (tresor) kb(kasse, "Entnahme", tresor, "Entnahme Tresor/Bank beim Tagesabschluss", zeitpunkt(tag, 18, 42), { bediener: LEITUNG, kassenabschluss: name });
    }
    return doc;
  };

  // 14 Tage Verkauf an Kassa 1 (Sonntage frei), heute bis zur aktuellen Stunde.
  const zahlMix = ["karte", "karte", "bar", "karte", "split", "bar", "karte"];
  for (let off = -14; off <= 0; off++) {
    const tag = tagIso(off, jetzt);
    const wt = new Date(`${tag}T12:00:00`).getDay();
    if (wt === 0 && off !== 0) continue;
    const n = off === 0 ? 6 : 2 + Math.floor(r.next() * 4);
    for (let j = 0; j < n; j++) {
      const h = off === 0 ? Math.min(stunde - 1, 9 + j) : 10 + Math.floor((j * 8) / n);
      const pos = [artikel(Math.floor(r.next() * MOCK_KATALOG.length), 1 + Math.floor(r.next() * 2))];
      if (r.next() < 0.45) pos.push(artikel(Math.floor(r.next() * MOCK_KATALOG.length)));
      if (off === -3 && j === 0) pos.push({ art: "Gutschein Verkauf", bezeichnung: "Geschenkgutschein", menge: 1, einzel_brutto_cent: 10000, steuersatz: "Null 0" });
      const gesamt = summen(pos).gesamt_cent;
      const za = zahlMix[(off + 14 + j) % zahlMix.length];
      const kontakt = r.next() < 0.35 && kontakte.length ? kontakte[Math.floor(r.next() * kontakte.length)].name : null;
      beleg(K1, tag, h, 5 + ((j * 13) % 50), { pos, zahl: zahlweise(gesamt, za === "split" && gesamt <= 5000 ? "karte" : za), kontakt, bediener: j % 3 === 2 ? LEITUNG : MITARBEITER, status: off === -6 && j === 1 ? "Ausfall" : "Signiert" });
    }
    if (off === -5) kb(K1, "Entnahme", 1240, "Ausgabe: Porto (Projekt PH-PRJ-2026-0001)", zeitpunkt(tag, 15, 20));
    if (off === -2) kb(K1, "Einlage", 5000, "Wechselgeld: aus dem Tresor", zeitpunkt(tag, 9, 10), { bediener: LEITUNG });
    if (off === 0) kb(K1, "Entnahme", 890, "Ausgabe: Blumen Schaufenster", zeitpunkt(tag, Math.max(9, stunde - 2), 15));
  }

  // Storno-Paar gestern (Leitung, Grund „Falscher Preis“) und ein Nullbeleg vor 9 Tagen (Monatsbeleg-Ersatz).
  const gestern = [...belege.values()].filter((b) => b.kasse === K1 && b.geschaeftstag === tagIso(-1, jetzt) && b.belegart === "Standard").at(-1);
  if (gestern) {
    const pos = gestern.positionen.map(({ doctype: _d, name: _n, parent: _p, parentfield: _pf, parenttype: _pt, idx: _i, ...p }) => ({ ...p, einzel_brutto_cent: -p.einzel_brutto_cent }));
    const sb = beleg(K1, gestern.geschaeftstag, 17, 55, { art: "Stornobeleg", pos, zahl: gestern.zahlarten.map((z) => ({ zahlart: z.zahlart, betrag_cent: -z.betrag_cent })), kontakt: gestern.kontakt, bediener: LEITUNG, extra: { storno_von: gestern.name, storno_grund: "Falscher Preis", freigabe_von: "" } });
    gestern.storniert_durch = sb.name;
    gestern.status = "Storniert";
  }
  beleg(K1, tagIso(-9, jetzt), 18, 59, { art: "Nullbeleg", bediener: LEITUNG });

  // Kassa 2: Trainingsbelege (zählen nicht) gestern.
  for (let j = 0; j < 3; j++) {
    const pos = [artikel(j + 2)];
    beleg(K2, tagIso(-1, jetzt), 11 + j, 20, { pos, zahl: zahlweise(summen(pos).gesamt_cent, "bar"), training: 1, bediener: MITARBEITER });
  }

  // Abschlüsse: alle vergangenen Tage von Kassa 1 abgeschlossen (Differenzen −2,40 € und +0,50 €);
  // Kassa 2: vorgestern wieder geöffnet, gestern gezählt (Leitung schließt ab); heute Kassa 1 offen.
  const tageK1 = [...new Set([...belege.values()].filter((b) => b.kasse === K1 && b.geschaeftstag < heute && b.geschaeftstag > tagIso(-15, jetzt)).map((b) => b.geschaeftstag))].sort();
  tageK1.forEach((tag, i) => {
    const status = "Abgeschlossen";
    const differenz = i === tageK1.length - 3 ? -240 : i === tageK1.length - 8 ? 50 : 0;
    abschluss(K1, tag, status, { differenz, grund: differenz < 0 ? "Wechselgeld falsch herausgegeben" : differenz ? "Zählfehler" : "", tresor: i % 3 === 2 ? 30000 : 0 });
  });
  abschluss(K2, tagIso(-2, jetzt), "Korrigiert");
  abschluss(K2, tagIso(-1, jetzt), "Gezaehlt");
  abschluss(K1, heute, "Offen");
  kassen.get(K1).aktiver_abschluss = [...abschluesse.values()].find((a) => a.kasse === K1 && a.datum === heute)?.name || "";
  kassen.get(K1).belegnummer_zaehler = zaehler[K1];
  kassen.get(K2).belegnummer_zaehler = zaehler[K2];
  const letzter = [...belege.values()].filter((b) => b.kasse === K1).sort((a, b) => a.datum_uhrzeit.localeCompare(b.datum_uhrzeit)).at(-1);
  if (letzter) Object.assign(kassen.get(K1), { letzter_beleg: letzter.name, letzter_beleg_am: letzter.datum_uhrzeit, startbeleg: `${K1}-000001` });

  // Bestand je Kassenbuch-Zeile chronologisch neu rechnen (Differenz-/Tresorzeilen kamen nachträglich dazu).
  for (const kasse of [K1, K2]) {
    let b = 0;
    for (const z of [...buch.values()].filter((x) => x.kasse === kasse).sort((x, y) => x.zeitpunkt.localeCompare(y.zeitpunkt) || x.name.localeCompare(y.name))) {
      b += z.bewegung_cent;
      z.bestand_danach_cent = b;
    }
  }

  // ---- Ereignisse ----
  const ev = tab("PH Kassa Ereignis");
  ev.clear();
  const ereignis = (i, art, status, tag, h, extra = {}) => {
    const name = `PH-KEV-${tag.slice(0, 4)}-${pad(i, 5)}`;
    ev.set(name, { doctype: "PH Kassa Ereignis", name, naming_series: "PH-KEV-.YYYY.-.#####", titel: `${art}`, kasse: K1, see: "SEE Test Lochau", art, status, zeitpunkt: zeitpunkt(tag, h, 0), ende: "", dauer_h: 0, meldung_finanzonline_noetig: 0, gemeldet_am: "", beleg: "", anzahl_belege: 0, notiz: "", nachweis: "", automatisch: 1, docstatus: 0, creation: zeitpunkt(tag, h, 0), modified: zeitpunkt(tag, h, 0), ...basis, ...extra });
  };
  ereignis(1, "Startbeleg", "Erledigt", tagIso(-30, jetzt), 9, { beleg: `${K1}-000001`, notiz: "Startbeleg erstellt" });
  ereignis(2, "SEE Ausfall Beginn", "Beendet", tagIso(-6, jetzt), 11, { ende: zeitpunkt(tagIso(-6, jetzt), 12, 30), dauer_h: 1.5, anzahl_belege: 1, notiz: "Signatureinheit nicht erreichbar – Belege mit Vermerk „Sicherheitseinrichtung ausgefallen“" });
  ereignis(3, "SEE Ausfall Ende", "Erledigt", tagIso(-6, jetzt), 12, { notiz: "Nachsignatur per Sammelbeleg" });
  ereignis(4, "Kasse Ausfall Beginn", "Offen", tagIso(-2, jetzt), 8, { kasse: K2, meldung_finanzonline_noetig: 1, dauer_h: 50, automatisch: 0, notiz: "Kassa 2 länger als 48 Stunden außer Betrieb – Meldung in FinanzOnline nötig" });

  // ---- DEP-Exporte ----
  const dep = tab("PH DEP Export");
  dep.clear();
  const ersterK1 = `${K1}-000001`;
  dep.set(`PH-DEP-${heute.slice(0, 4)}-0001`, { doctype: "PH DEP Export", name: `PH-DEP-${heute.slice(0, 4)}-0001`, naming_series: "PH-DEP-.YYYY.-.####", titel: `DEP ${K1} Vollständig`, kasse: K1, art: "Vollstaendig", status: "Archiviert", zeitraum_von: tagIso(-30, jetzt), zeitraum_bis: tagIso(-15, jetzt), erstellt_von: LEITUNG, erstellt_am: zeitpunkt(tagIso(-14, jetzt), 19, 0), anzahl_belege: 12, erste_belegnummer: 1, letzte_belegnummer: 12, erster_beleg: ersterK1, letzter_beleg: `${K1}-000012`, datei: "", dateiname: `dep-${K1}-vollstaendig.json`, pruefsumme_sha256: "9f2c6a0b5e1d4c7a8b3f0e2d1c4b5a6978e6d5c4b3a291807f6e5d4c3b2a1908", pruefung_struktur: "Struktur in Ordnung", archiviert: 1, archiv_pfad: "Archiv/DEP", notiz: "", docstatus: 0, creation: zeitpunkt(tagIso(-14, jetzt), 19, 0), modified: zeitpunkt(tagIso(-14, jetzt), 19, 0), ...basis });
  dep.set(`PH-DEP-${heute.slice(0, 4)}-0002`, { doctype: "PH DEP Export", name: `PH-DEP-${heute.slice(0, 4)}-0002`, naming_series: "PH-DEP-.YYYY.-.####", titel: `DEP ${K1} Zeitraum`, kasse: K1, art: "Zeitraum", status: "Erstellt", zeitraum_von: tagIso(-14, jetzt), zeitraum_bis: tagIso(-1, jetzt), erstellt_von: LEITUNG, erstellt_am: zeitpunkt(tagIso(-1, jetzt), 19, 0), anzahl_belege: Math.max(0, zaehler[K1] - 12), erste_belegnummer: 13, letzte_belegnummer: zaehler[K1], dateiname: `dep-${K1}-zeitraum.json`, pruefsumme_sha256: "", pruefung_struktur: "", archiviert: 0, notiz: "", docstatus: 0, creation: zeitpunkt(tagIso(-1, jetzt), 19, 0), modified: zeitpunkt(tagIso(-1, jetzt), 19, 0), ...basis });

  void r;
}
