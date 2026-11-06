// Mock-Seed – Bereich Shop (G-01, MASTER § 3.5). Schreibt: Team B-SHO.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.
//
// B-SHO: `anzahl` und `kern` bleiben unverändert (sie laufen im gemeinsamen Zufallsstrom). Der Nachlauf ersetzt
// die generischen Shop-Datensätze durch die Fälle aus 10-konzept-shop § 12 – jeder Status, jeder Leer- und
// Fehlerfall, Bezüge zwischen Bestellung, Zahlung, Gutschein, Widerruf, Retoure, Lieferschein und Rechnung.

import { isoDatumZeit } from "../../format.js";
import { tage } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen (Lieferscheine/Rechnungen hängen wir hinten an). */
export const nach = ["crm", "logistik", "faktura"];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Bestellung": 16,
  "PH Zahlung": 30,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Bestellung": (doc, { i, r, person }) => {
    doc.status = r.pick(["offen", "zahlung_ausstehend", "bezahlt", "bezahlt", "versandbereit", "versendet", "abholbereit", "abgeschlossen", "abgeschlossen", "storniert"]);
    doc.angelegt = isoDatumZeit(tage(-Math.floor(i * 3), r));
    doc.lieferart = r.pick(["versand", "versand", "abholung"]);
    doc.zahlung = r.pick(["online", "online", "vorort"]);
    doc.kunde_name = person;
    doc.kunde_email = `${person.replace(" ", ".").toLowerCase()}@beispiel.invalid`;
    doc.gesamt_cent = r.pick([4900, 12900, 24900, 38000, 89000, 149000]);
    doc.titel = `Bestellung ${person}`;
    doc.waehrung = "EUR";
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Zahlung": (doc, { i, r, person }) => {
    const monat = -Math.floor(i / 3);
    const d = tage(monat * 30 + r.int(0, 27), r);
    doc.zeitpunkt = isoDatumZeit(d);
    doc.art = r.chance(0.9) ? "Eingang" : "Erstattung";
    doc.kanal = r.pick(["Stripe Checkout", "Stripe Checkout", "Stripe Terminal", "Bar", "Karte extern", "Überweisung"]);
    doc.status = r.pick(["Bezahlt", "Bezahlt", "Bezahlt", "Bezahlt", "Angekuendigt", "Fehlgeschlagen", "Erstattet"]);
    doc.betrag_cent = r.pick([4900, 12900, 24900, 38000, 89000, 149000, 329000, 580000]);
    doc.waehrung = "EUR";
    doc.titel = `${doc.art} ${doc.kanal} – ${person}`;
    doc.bezug_doctype = "PH Bestellung";
  },
};

// --------------------------------------------------------------- Bausteine --

/** Produkte des Shops (Bilder liegen als Kopien unter public/entwurf/lounge). */
const P = {
  bell: { bezeichnung: "Tischleuchte „Bell“ Messing", marke: "Leuchtenmanufaktur", kategorie: "Leuchten", einzel: 28900, bild: "/entwurf/lounge/p-bell-leuchte.webp", ust: 2000, slug: "tischleuchte-bell" },
  bellhop: { bezeichnung: "Akkuleuchte „Bellhop“", marke: "Flos", kategorie: "Leuchten", einzel: 16900, bild: "/entwurf/lounge/p-flos-bellhop.webp", ust: 2000, slug: "akkuleuchte-bellhop" },
  loewe: { bezeichnung: "Keramikfigur Löwe", marke: "Kähler", kategorie: "Accessoires", einzel: 8900, bild: "/entwurf/lounge/p-kaehler-loewe.webp", ust: 2000, slug: "keramik-loewe" },
  halter: { bezeichnung: "Kerzenhalter Messing", marke: "Lyngby", kategorie: "Accessoires", einzel: 7900, bild: "/entwurf/lounge/p-lyngby-halter.webp", ust: 2000, slug: "kerzenhalter-messing" },
  stone: { bezeichnung: "Leuchte „Stone“", marke: "Leuchtenmanufaktur", kategorie: "Leuchten", einzel: 49000, bild: "/entwurf/lounge/p-stone-leuchte.webp", ust: 2000, slug: "leuchte-stone" },
  kerze: { bezeichnung: "Duftkerze Abd el Kader", marke: "Trudon", kategorie: "Accessoires", einzel: 9900, bild: "/entwurf/lounge/p-trudon-kerze.webp", ust: 2000, slug: "duftkerze-trudon" },
  glas: { bezeichnung: "Weinglas Bordeaux, 2 Stück", marke: "Zalto", kategorie: "Tischkultur", einzel: 12900, bild: "/entwurf/lounge/p-zalto-bordeaux.webp", ust: 2000, slug: "weinglas-bordeaux" },
};

const dt = (offsetTage, stunde = 10, minute = 0) => {
  const d = tage(offsetTage);
  d.setHours(stunde, minute, 0, 0);
  return isoDatumZeit(d);
};
const tag = (offsetTage) => dt(offsetTage).slice(0, 10);

function pos(liste) {
  return liste.map(([p, menge = 1, extra = {}], i) => ({
    doctype: "PH Bestellung Position", idx: i + 1, name: `pos-${i + 1}`, parentfield: "positionen", parenttype: "PH Bestellung",
    slug: p.slug, bezeichnung: p.bezeichnung, marke: p.marke, kategorie: p.kategorie, menge, einzel_cent: p.einzel, summe_cent: p.einzel * menge,
    ust_klasse: "normal", ust_satz_promille: p.ust, zurueck_menge: 0, erstattet_cent: 0, storniert_menge: 0, bild: p.bild, preis_stand: tag(-30), ...extra,
  }));
}

function ustVon(brutto) {
  return Math.round((brutto * 0.2) / 1.2);
}

/** Bestellung aus Grunddaten; Summen und USt aus den Positionen. */
function bestellung(kunde, o) {
  const positionen = pos(o.pos);
  const waren = positionen.reduce((s, p) => s + p.summe_cent, 0);
  const versand = o.lieferart === "abholung" ? 0 : o.versand ?? 990;
  const gesamt = o.gesamt ?? waren + versand;
  const bezahlt = o.bezahlt ?? 0;
  const verlauf = (o.verlauf || []).map(([zeit, status, hinweis, von], i) => ({ doctype: "PH Bestellung Verlauf", idx: i + 1, name: `v-${i + 1}`, parentfield: "verlauf", parenttype: "PH Bestellung", zeit, status, hinweis: hinweis || "", von: von || "Website" }));
  return {
    doctype: "PH Bestellung", name: o.name, naming_series: "PH-S-.YY.MM.DD.-.#####", bestellnummer: o.name, titel: `Bestellung ${kunde.name}`,
    status: o.status, workflow_state: WF[o.status], modus: o.modus || "live", angelegt: o.angelegt, lieferart: o.lieferart || "versand",
    zahlung: o.zahlung || (o.lieferart === "abholung" ? "vorort" : "online"), bestellart: o.bestellart || "Online", sprache: "de",
    zugewiesen_an: o.zugewiesen_an || "", bestaetigung_unterdruecken: 0, positionen, waren_cent: waren, versand_cent: versand, gesamt_cent: gesamt,
    offen_cent: Math.max(gesamt - bezahlt, 0), storniert_cent: 0, waehrung: o.waehrung || "EUR", ust_cent: ustVon(gesamt), steuerland: o.adresse_land === "DE" ? "DE" : "AT", oss: 0,
    ust_aufteilung: [{ doctype: "PH Bestellung Steuer", idx: 1, name: "st-1", parentfield: "ust_aufteilung", parenttype: "PH Bestellung", satz_promille: 2000, brutto_cent: gesamt, waren_cent: waren, versand_cent: versand, netto_cent: gesamt - ustVon(gesamt), ust_cent: ustVon(gesamt) }],
    kontakt: kunde.kontakt, kunde_name: kunde.name, kunde_email: kunde.email, kunde_telefon: "+43 5574 000000",
    adresse_land: o.adresse_land || "AT", adresse_plz: o.adresse_land === "DE" ? "88131" : kunde.plz, adresse_ort: o.adresse_land === "DE" ? "Lindau" : kunde.ort, adresse_strasse: "Seestraße", adresse_hausnr: String(o.hausnr || 4), adresse_zusatz: "",
    rechnung_name: o.rechnung_name || "", rechnung_adresse: "", rechnung_uid: o.rechnung_uid || "", rechnungswunsch: o.rechnungswunsch ? 1 : 0,
    bezahlt_am: o.bezahlt_am || "", betrag_bezahlt_cent: bezahlt, erstattet_cent: o.erstattet || 0, zahlung_ref: o.zahlung_ref || "",
    stripe_session: o.payment_intent ? `cs_test_${o.name.slice(-5)}` : "", payment_intent: o.payment_intent || "", livemode: o.modus === "test" ? 0 : 1,
    zahlungslink_url: o.zahlungslink_url || "", zahlungslink_gueltig_bis: o.zahlungslink_gueltig_bis || "", zahlungslink_erstellt_am: o.zahlungslink_erstellt_am || "", zahlungslink_gesendet_am: o.zahlungslink_gesendet_am || "", zahlungslink_simuliert: o.zahlungslink_url ? 1 : 0,
    erstattungen: o.erstattungen || [],
    radar_markiert: o.risiko ? 1 : 0, radar_risk_level: o.risiko ? "elevated" : "normal", radar_risk_score: o.risiko ? 68 : 12, radar_outcome: o.risiko ? "manual_review" : "", radar_hinweis: o.risiko ? "Lieferadresse weicht von der Rechnungsadresse ab" : "", radar_warnung: 0, radar_review: o.risiko ? "offen" : "", radar_geprueft_von: "", radar_geprueft_am: "",
    carrier: o.lieferart === "abholung" ? "" : "DHL", dienst: o.lieferart === "abholung" ? "" : "Paket", laufzeit_tage: 2, versichert: 0, zerbrechlich: 1, kerze: 0,
    versendet_am: o.versendet_am || "", awb: o.awb || "", abholung_bis: o.abholung_bis || "", abholcode: o.abholcode || "", abholbereit_am: o.abholbereit_am || "", abgeholt_am: o.abgeholt_am || "",
    ersatz_fuer: o.ersatz_fuer || "", ersatz_grund: o.ersatz_grund || "",
    verlauf, mail_status: o.mail_status || "gesendet", mail_gesendet_am: o.angelegt,
    notiz_intern: o.notiz_intern || "", notiz_kunde: o.notiz_kunde || "", widerruf: o.widerruf || "", retoure: o.retoure || "",
    agb_stand: "2026-10-01", widerrufsbelehrung_stand: o.ohneBelehrung ? "" : "2026-10-01", einwilligung_zeit: o.angelegt, kunden_token_hash: "vorhanden", quelle: o.quelle || "website",
    owner: "Administrator", creation: o.angelegt, modified: o.modified || o.angelegt, modified_by: "shop@demo.local", docstatus: 0, idx: 0,
  };
}

const WF = {
  offen: "PH Offen", zahlung_ausstehend: "PH Zahlung ausstehend", bezahlt: "PH Bezahlt", versandbereit: "PH Versandbereit", versendet: "PH Versendet", reserviert: "PH Reserviert",
  abholbereit: "PH Abholbereit", abgeholt: "PH Abgeholt", abgeschlossen: "PH Abgeschlossen", fehlgeschlagen: "PH Fehlgeschlagen", abgelaufen: "PH Abgelaufen", storniert: "PH Storniert",
  widerrufen: "PH Widerrufen", erstattet: "PH Erstattet", teilerstattet: "PH Teilerstattet", checkout_fehler: "PH Checkout-Fehler", pruefen: "PH Pruefen",
};
const GS_WF = { Erstellt: "PH Erstellt", Aktiv: "PH Aktiv", "Teilweise eingeloest": "PH Teilweise eingeloest", Eingeloest: "PH Eingeloest", Gesperrt: "PH Gesperrt", Abgelaufen: "PH Abgelaufen", Erstattet: "PH Erstattet" };

function zahlung(o) {
  return {
    doctype: "PH Zahlung", name: o.name, naming_series: "PH-ZAH-.YYYY.-.#####", titel: `${o.art || "Eingang"} ${o.kanal}`, art: o.art || "Eingang", kanal: o.kanal, status: o.status || "Bezahlt",
    betrag_cent: o.betrag, waehrung: "EUR", zeitpunkt: o.zeitpunkt, livemode: o.test ? 0 : 1, bezug_doctype: o.bezug_doctype || "PH Bestellung", bezug: o.bezug || "", kontakt: o.kontakt || "",
    ursprung: o.ursprung || "", zahlungsreferenz: o.referenz || "", bank_referenz: "", gutschein: o.gutschein || "", notiz: "",
    stripe_payment_intent: String(o.kanal).startsWith("Stripe") ? `pi_test_${o.name.slice(-5)}` : "", stripe_charge: String(o.kanal).startsWith("Stripe") ? `ch_test_${o.name.slice(-5)}` : "", stripe_session: "", stripe_refund: o.art === "Erstattung" && String(o.kanal).startsWith("Stripe") ? `re_test_${o.name.slice(-5)}` : "",
    stripe_balance_transaction: String(o.kanal).startsWith("Stripe") ? `txn_test_${o.name.slice(-5)}` : "", stripe_gebuehr_cent: String(o.kanal).startsWith("Stripe") ? Math.round(o.betrag * 0.015 + 25) : 0, stripe_auszahlung: o.auszahlung || "", stripe_ereignis: o.ereignis || "",
    radar_markiert: o.risiko ? 1 : 0, radar_risk_level: o.risiko ? "elevated" : "", radar_risk_score: o.risiko ? 68 : 0, radar_outcome: "", radar_hinweis: "", radar_warnung: 0, radar_review: o.risiko ? "offen" : "", radar_geprueft_von: "", radar_geprueft_am: "",
    dispute_id: o.dispute ? `dp_test_${o.name.slice(-5)}` : "", dispute_status: o.dispute || "", dispute_betrag_cent: o.dispute ? o.betrag : 0, dispute_grund: o.dispute ? "fraudulent" : "", dispute_frist: o.dispute ? dt(10, 23, 59) : "",
    erstattet_cent: o.erstattet || 0, erstattungen: o.erstattungen || [],
    erstattung_angefordert_cent: o.angefordert || 0, erstattung_grund: o.angefordert ? "Kulanz" : "", erstattung_angefordert_von: o.angefordert ? "shop@demo.local" : "", erstattung_angefordert_am: o.angefordert ? dt(0, 8, 40) : "",
    quelle: o.quelle || (o.kanal === "Bar" || o.kanal === "Karte extern" ? "kassa" : String(o.kanal).startsWith("Stripe") ? "stripe" : "backoffice"),
    owner: "Administrator", creation: o.zeitpunkt, modified: o.zeitpunkt, modified_by: "Administrator", docstatus: o.status === "Angekuendigt" ? 0 : 1, idx: 0,
  };
}

function gutschein(o) {
  return {
    doctype: "PH Gutschein", name: o.name, naming_series: "PH-GS-.YYYY.-.#####", titel: `Gutschein ····-${o.code}`, status: o.status, workflow_state: GS_WF[o.status], art: "Mehrzweck", ust_satz_promille: 0, test: o.test ? 1 : 0,
    wert_cent: o.wert, rest_cent: o.rest, waehrung: "EUR", code_hash: "sha256:verborgen", code_letzte4: o.code, ausgegeben_am: o.ausgegeben, kanal_ausgabe: o.kanal || "Kassa", gueltig_bis: o.gueltig_bis || "",
    bedingungen_stand: "2026-10-01", pdf: o.pdf === false ? "" : `/private/files/gutschein-${o.code}.pdf`, mail_gesendet_am: o.ausgegeben, motiv: o.motiv || "seelicht", empfaenger: o.empfaenger || "", grusstext: o.grusstext || "",
    einloesungen: (o.einloesungen || []).map((e, i) => ({ doctype: "PH Gutschein Einloesung", idx: i + 1, name: `e-${i + 1}`, parentfield: "einloesungen", parenttype: "PH Gutschein", ...e })),
    gesperrt_am: o.gesperrt_am || "", sperrgrund: o.sperrgrund || "", sperrgrund_art: o.sperrgrund_art || "", hinweis: o.hinweis || "", ersetzt_durch: o.ersetzt_durch || "",
    kaeufer_kontakt: o.kaeufer_kontakt || "", kaeufer_name: o.kaeufer_name || "", kaeufer_email: o.kaeufer_email || "", kaeufer_firma: "", gutschein_bestellung: o.gutschein_bestellung || "", zahlung: o.zahlung || "",
    ausgabe_beleg_doctype: o.beleg ? "PH Kassenbeleg" : "", ausgabe_beleg: o.beleg || "", livemode: o.test ? 0 : 1, quelle: o.kanal === "Online" ? "website" : o.kanal === "Kassa" ? "kassa" : "backoffice",
    owner: "Administrator", creation: o.ausgegeben, modified: o.ausgegeben, modified_by: "Administrator", docstatus: 0, idx: 0,
  };
}

// ------------------------------------------------------------------ Nachlauf --

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const tabelle = (n) => {
    if (!db.has(n)) db.set(n, new Map());
    return db.get(n);
  };
  // Feste Beispielpersonen (Q-A3: keine echten Personen, E-Mails @beispiel.invalid). Kontakt-Verknüpfung nur, wenn ein
  // Seed-Kontakt mit gleichem Nachnamen existiert – sonst bleibt die Bestellung ohne Kontakt (Fall „nicht verknüpft“).
  const PERS = [["Anna", "Beispiel", "Lochau", "6911"], ["Familie", "Probe", "Bregenz", "6900"], ["Markus", "Testner", "Hard", "6971"], ["Sabine", "Vorlage", "Wolfurt", "6922"], ["Jonas", "Demo", "Dornbirn", "6850"], ["Clara", "Muster", "Lustenau", "6890"], ["Paul", "Schema", "Lochau", "6911"], ["Eva", "Platzhalter", "Bregenz", "6900"], ["Lukas", "Beispiel", "Hörbranz", "6912"], ["Familie", "Muster", "Lochau", "6911"], ["Nina", "Demo", "Hard", "6971"], ["Felix", "Vorlage", "Lindau", "88131"], ["Sophie", "Probe", "Kennelbach", "6921"], ["Theresa", "Testner", "Höchst", "6973"]];
  const kontakte = hilfe.kontakte || [];
  const K = PERS.map(([vor, nach, ort, plz]) => {
    const k = kontakte.find((x) => x.nachname === nach && (vor === "Familie" || x.vorname === vor));
    const name = vor === "Familie" ? `Familie ${nach}` : `${vor} ${nach}`;
    return { kontakt: k?.name || "", name, email: `${(vor === "Familie" ? nach : `${vor}.${nach}`).toLowerCase()}@beispiel.invalid`, ort, plz };
  });

  // --- Bestellungen ------------------------------------------------------------------------------------------
  const B = [
    bestellung(K[0], { name: "PH-S-261104-00012", status: "bezahlt", angelegt: dt(0, 9, 10), pos: [[P.bell], [P.halter]], bezahlt: 37790, bezahlt_am: dt(0, 9, 12), payment_intent: "pi_test_00012", zahlung_ref: "PH-ZAH-2026-00101", risiko: true, zugewiesen_an: "shop@demo.local", verlauf: [[dt(0, 9, 10), "offen", "Bestellung über die Website"], [dt(0, 9, 12), "bezahlt", "Bezahlvorgang abgeschlossen", "Stripe"]] }),
    bestellung(K[1], { name: "PH-S-261103-00009", status: "reserviert", bestellart: "Showroom", lieferart: "abholung", quelle: "backoffice", angelegt: dt(-1, 15, 20), pos: [[P.loewe]], bezahlt: 5000, abholung_bis: tag(20), zahlung_ref: "PH-ZAH-2026-00094", verlauf: [[dt(-1, 15, 20), "reserviert", "Showroom-Reservierung", "Lena Demo"], [dt(-1, 15, 24), "reserviert", "Gutschein PH-GS-2026-00031: 5000 Cent angerechnet", "Lena Demo"]] }),
    bestellung(K[2], { name: "PH-S-261102-00004", status: "reserviert", bestellart: "Showroom", lieferart: "abholung", quelle: "backoffice", angelegt: dt(-2, 11, 5), pos: [[P.stone]], abholung_bis: tag(20), verlauf: [[dt(-2, 11, 5), "reserviert", "Showroom-Reservierung", "Lena Demo"]] }),
    bestellung(K[3], { name: "PH-S-261104-00015", status: "offen", bestellart: "Telefon", quelle: "backoffice", angelegt: dt(0, 8, 30), pos: [[P.bellhop, 2]], zahlungslink_url: "https://checkout.stripe.com/c/pay/cs_test_00015", zahlungslink_gueltig_bis: dt(1, 8, 30), zahlungslink_erstellt_am: dt(0, 8, 31), zahlungslink_gesendet_am: dt(0, 8, 39), verlauf: [[dt(0, 8, 30), "offen", "Telefonbestellung", "Lena Demo"], [dt(0, 8, 39), "offen", "Zahlungslink gesendet", "Lena Demo"]] }),
    bestellung(K[4], { name: "PH-S-261103-00007", status: "pruefen", angelegt: dt(-1, 18, 2), pos: [[P.bellhop]], bezahlt: 15990, gesamt: 16990, bezahlt_am: dt(-1, 18, 4), payment_intent: "pi_test_00007", zahlung_ref: "PH-ZAH-2026-00096", verlauf: [[dt(-1, 18, 2), "offen", "Bestellung über die Website"], [dt(-1, 18, 4), "pruefen", "Betrag weicht ab (15990 Cent statt 16990 Cent)", "Stripe"]] }),
    bestellung(K[5], { name: "PH-S-261104-00016", status: "zahlung_ausstehend", angelegt: dt(0, 7, 55), pos: [[P.glas, 2]], payment_intent: "pi_test_00016", verlauf: [[dt(0, 7, 55), "zahlung_ausstehend", "Sofortüberweisung angekündigt", "Stripe"]] }),
    bestellung(K[6], { name: "PH-S-261030-00004", status: "abholbereit", lieferart: "abholung", angelegt: dt(-5, 14, 0), pos: [[P.kerze, 2]], bezahlt: 19800, bezahlt_am: dt(-5, 14, 2), payment_intent: "pi_test_00004", abholcode: "K7PL3Q", abholung_bis: tag(1), abholbereit_am: dt(-4, 9, 0), zahlung_ref: "PH-ZAH-2026-00088", verlauf: [[dt(-5, 14, 0), "offen", "Bestellung über die Website"], [dt(-5, 14, 2), "bezahlt", "Bezahlvorgang abgeschlossen", "Stripe"], [dt(-4, 9, 0), "abholbereit", "Abholcode K7PL3Q", "Lena Demo"]] }),
    bestellung(K[7], { name: "PH-S-261029-00002", status: "abholbereit", lieferart: "abholung", bestellart: "Showroom", quelle: "backoffice", angelegt: dt(-6, 10, 0), pos: [[P.loewe]], abholcode: "M4QX8R", abholung_bis: tag(3), abholbereit_am: dt(-6, 10, 5), verlauf: [[dt(-6, 10, 0), "reserviert", "Showroom-Reservierung", "Lena Demo"], [dt(-6, 10, 5), "abholbereit", "Abholcode M4QX8R", "Lena Demo"]] }),
    bestellung(K[8], { name: "PH-S-261102-00006", status: "versandbereit", angelegt: dt(-2, 9, 0), pos: [[P.glas], [P.kerze]], bezahlt: 23790, bezahlt_am: dt(-2, 9, 2), payment_intent: "pi_test_00006", zahlung_ref: "PH-ZAH-2026-00093", awb: "", verlauf: [[dt(-2, 9, 2), "bezahlt", "Bezahlvorgang abgeschlossen", "Stripe"], [dt(-1, 10, 0), "versandbereit", "Lieferschein LS-2026-90002", "Sophie Beispiel"]] }),
    bestellung(K[9], { name: "PH-S-261020-00003", status: "versendet", angelegt: dt(-15, 16, 0), pos: [[P.bell], [P.loewe]], bezahlt: 38790, bezahlt_am: dt(-15, 16, 2), payment_intent: "pi_test_00003", versendet_am: dt(-15 + 1, 14, 0), awb: "00340434161094042557", widerruf: "PH-WID-2026-00007", zahlung_ref: "PH-ZAH-2026-00071", verlauf: [[dt(-15, 16, 2), "bezahlt", "Bezahlvorgang abgeschlossen", "Stripe"], [dt(-14, 14, 0), "versendet", "00340434161094042557", "Sophie Beispiel"]] }),
    bestellung(K[10], { name: "PH-S-261015-00002", status: "versendet", angelegt: dt(-20, 12, 0), pos: [[P.stone]], bezahlt: 49990, bezahlt_am: dt(-20, 12, 1), payment_intent: "pi_test_00002", versendet_am: dt(-18, 11, 0), awb: "00340434161094040011", mail_status: "nicht_gesendet", ohneBelehrung: true, widerruf: "PH-WID-2026-00008", zahlung_ref: "PH-ZAH-2026-00066", verlauf: [[dt(-18, 11, 0), "versendet", "00340434161094040011", "Sophie Beispiel"]] }),
    bestellung(K[11], { name: "PH-S-261028-00005", status: "bezahlt", angelegt: dt(-7, 13, 0), pos: [[P.stone, 2]], bezahlt: 98990, bezahlt_am: dt(-7, 13, 4), adresse_land: "DE", rechnung_uid: "DE123456789", rechnung_name: "Atelier Beispiel GmbH", rechnungswunsch: true, payment_intent: "pi_test_00005", zahlung_ref: "PH-ZAH-2026-00084", verlauf: [[dt(-7, 13, 4), "bezahlt", "Bezahlvorgang abgeschlossen", "Stripe"]] }),
    bestellung(K[12], { name: "PH-S-261027-00001", status: "bezahlt", lieferart: "abholung", bestellart: "Showroom", quelle: "backoffice", angelegt: dt(-8, 11, 0), pos: [[P.glas]], bezahlt: 12900, bezahlt_am: dt(-8, 11, 30), zahlung_ref: "PH-ZAH-2026-00082", verlauf: [[dt(-8, 11, 0), "reserviert", "Showroom-Reservierung", "Lena Demo"], [dt(-8, 11, 30), "bezahlt", "Bar erfasst (Kassa 1)", "David Vorlage"]] }),
    bestellung(K[13], { name: "PH-S-261009-00008", status: "abgeschlossen", angelegt: dt(-26, 10, 0), pos: [[P.bellhop], [P.halter]], bezahlt: 25790, bezahlt_am: dt(-26, 10, 2), versendet_am: dt(-25, 15, 0), rechnungswunsch: true, payment_intent: "pi_test_00008", zahlung_ref: "PH-ZAH-2026-00055", verlauf: [[dt(-25, 15, 0), "versendet", "", "Sophie Beispiel"], [dt(-1, 6, 0), "abgeschlossen", "Automatisch abgeschlossen", "(Scheduler)"]] }),
    bestellung(K[0], { name: "PH-S-261003-00010", status: "versendet", angelegt: dt(-32, 10, 0), pos: [[P.kerze]], bezahlt: 10890, bezahlt_am: dt(-32, 10, 2), versendet_am: dt(-31, 15, 0), awb: "00340434161094038877", payment_intent: "pi_test_00010", zahlung_ref: "PH-ZAH-2026-00049", verlauf: [[dt(-31, 15, 0), "versendet", "00340434161094038877", "Sophie Beispiel"]] }),
    bestellung(K[1], { name: "PH-S-261001-00001", status: "abgeschlossen", angelegt: dt(-34, 10, 0), pos: [[P.glas, 2]], bezahlt: 26790, bezahlt_am: dt(-34, 10, 1), versendet_am: dt(-33, 12, 0), payment_intent: "pi_test_00001", zahlung_ref: "PH-ZAH-2026-00045" }),
    bestellung(K[2], { name: "PH-S-261018-00011", status: "storniert", angelegt: dt(-17, 10, 0), pos: [[P.stone, 3]], gesamt: 145000, bezahlt: 145000, bezahlt_am: dt(-17, 10, 2), payment_intent: "pi_test_00011", zahlung_ref: "PH-ZAH-2026-00069", verlauf: [[dt(-17, 10, 2), "bezahlt", "Bezahlvorgang abgeschlossen", "Stripe"], [dt(0, 8, 40), "storniert", "Kundenwunsch", "Lena Demo"]] }),
    bestellung(K[3], { name: "PH-S-261029-00013", status: "versendet", angelegt: dt(-6, 20, 0), pos: [[P.loewe]], gesamt: 8900, versand: 0, bezahlt: 8900, bezahlt_am: dt(-6, 20, 1), versendet_am: dt(-5, 12, 0), payment_intent: "pi_test_00013", zahlung_ref: "PH-ZAH-2026-00087" }),
    bestellung(K[4], { name: "PH-S-261102-00014", status: "fehlgeschlagen", angelegt: dt(-2, 22, 0), pos: [[P.halter]], payment_intent: "pi_test_00014", verlauf: [[dt(-2, 22, 3), "fehlgeschlagen", "Zahlung fehlgeschlagen", "Stripe"]] }),
    bestellung(K[5], { name: "PH-S-261020-00006", status: "abgelaufen", bestellart: "Showroom", lieferart: "abholung", quelle: "backoffice", angelegt: dt(-15, 10, 0), pos: [[P.bell]], bezahlt: 5000, abholung_bis: tag(-1), verlauf: [[dt(-15, 10, 0), "reserviert", "Showroom-Reservierung", "Lena Demo"], [dt(0, 6, 0), "abgelaufen", "Reservierungsfrist überschritten (Scheduler)", "(Scheduler)"]] }),
    bestellung(K[6], { name: "PH-S-261104-00017", status: "bezahlt", modus: "test", angelegt: dt(0, 10, 15), pos: [[P.kerze]], bezahlt: 10890, bezahlt_am: dt(0, 10, 16), payment_intent: "pi_test_00017", zahlung_ref: "PH-ZAH-2026-00103" }),
    bestellung(K[7], { name: "PH-S-261026-00002", status: "abgeholt", lieferart: "abholung", angelegt: dt(-9, 10, 0), pos: [[P.bellhop]], bezahlt: 16900, bezahlt_am: dt(-9, 10, 1), abholcode: "T2QH7D", abgeholt_am: dt(-7, 16, 30), payment_intent: "pi_test_00022", zahlung_ref: "PH-ZAH-2026-00083" }),
    bestellung(K[8], { name: "PH-S-261103-00010", status: "checkout_fehler", angelegt: dt(-1, 21, 0), pos: [[P.glas]], verlauf: [[dt(-1, 21, 1), "checkout_fehler", "Checkout-Session konnte nicht erstellt werden", "Website"]] }),
    bestellung(K[9], { name: "PH-S-261008-00001", status: "widerrufen", angelegt: dt(-27, 10, 0), pos: [[P.bell], [P.kerze]], bezahlt: 39790, erstattet: 28900, bezahlt_am: dt(-27, 10, 1), versendet_am: dt(-26, 12, 0), payment_intent: "pi_test_00024", zahlung_ref: "PH-ZAH-2026-00052", verlauf: [[dt(-10, 9, 0), "widerrufen", "Widerruf PH-WID-2026-00004", "Lena Demo"]] }),
    bestellung(K[10], { name: "PH-S-261103-00011", status: "bezahlt", bestellart: "Ersatz", quelle: "backoffice", angelegt: dt(-1, 11, 0), pos: [[P.glas, 1, { einzel_cent: 0, summe_cent: 0 }]], gesamt: 0, versand: 0, bezahlt: 0, bezahlt_am: dt(-1, 11, 0), ersatz_fuer: "PH-S-261003-00010", ersatz_grund: "Transportschaden", verlauf: [[dt(-1, 11, 0), "bezahlt", "Ersatzlieferung 0 € zu PH-S-261003-00010", "Lena Demo"]] }),
  ];
  // Shop-Fälle werden bei jedem Start gleich aufgebaut (keine Zufallswerte).
  const tb = tabelle("PH Bestellung");
  tb.clear();
  for (const b of B) tb.set(b.name, b);

  // --- Zahlungen ---------------------------------------------------------------------------------------------
  const Z = [
    zahlung({ name: "PH-ZAH-2026-00101", kanal: "Stripe Checkout", betrag: 37790, zeitpunkt: dt(0, 9, 12), bezug: "PH-S-261104-00012", kontakt: K[0].kontakt, risiko: true }),
    zahlung({ name: "PH-ZAH-2026-00094", kanal: "Gutschein", betrag: 5000, zeitpunkt: dt(-1, 15, 24), bezug: "PH-S-261103-00009", kontakt: K[1].kontakt, gutschein: "PH-GS-2026-00031", quelle: "backoffice" }),
    zahlung({ name: "PH-ZAH-2026-00096", kanal: "Stripe Checkout", betrag: 15990, zeitpunkt: dt(-1, 18, 4), bezug: "PH-S-261103-00007", kontakt: K[4].kontakt }),
    zahlung({ name: "PH-ZAH-2026-00097", kanal: "Stripe Checkout", status: "Angekuendigt", betrag: 25800, zeitpunkt: dt(0, 7, 56), bezug: "PH-S-261104-00016", kontakt: K[5].kontakt }),
    zahlung({ name: "PH-ZAH-2026-00088", kanal: "Stripe Checkout", betrag: 19800, zeitpunkt: dt(-5, 14, 2), bezug: "PH-S-261030-00004", auszahlung: "po_test_1104" }),
    zahlung({ name: "PH-ZAH-2026-00093", kanal: "Stripe Checkout", betrag: 23790, zeitpunkt: dt(-2, 9, 2), bezug: "PH-S-261102-00006" }),
    zahlung({ name: "PH-ZAH-2026-00071", kanal: "Stripe Checkout", betrag: 38790, zeitpunkt: dt(-15, 16, 2), bezug: "PH-S-261020-00003", auszahlung: "po_test_1022" }),
    zahlung({ name: "PH-ZAH-2026-00066", kanal: "Stripe Checkout", betrag: 49990, zeitpunkt: dt(-20, 12, 1), bezug: "PH-S-261015-00002", auszahlung: "po_test_1018" }),
    zahlung({ name: "PH-ZAH-2026-00084", kanal: "Stripe Checkout", betrag: 98990, zeitpunkt: dt(-7, 13, 4), bezug: "PH-S-261028-00005", auszahlung: "po_test_1104" }),
    zahlung({ name: "PH-ZAH-2026-00082", kanal: "Bar", betrag: 12900, zeitpunkt: dt(-8, 11, 30), bezug: "PH-S-261027-00001", referenz: "Kassa 1 · Beleg K1-000412" }),
    zahlung({ name: "PH-ZAH-2026-00055", kanal: "Stripe Checkout", betrag: 25790, zeitpunkt: dt(-26, 10, 2), bezug: "PH-S-261009-00008", auszahlung: "po_test_1011" }),
    zahlung({ name: "PH-ZAH-2026-00049", kanal: "Stripe Checkout", betrag: 10890, zeitpunkt: dt(-32, 10, 2), bezug: "PH-S-261003-00010", auszahlung: "po_test_1006" }),
    zahlung({ name: "PH-ZAH-2026-00045", kanal: "Ueberweisung", betrag: 26790, zeitpunkt: dt(-33, 9, 0), bezug: "PH-S-261001-00001", referenz: "Verwendungszweck PH-S-261001-00001" }),
    zahlung({ name: "PH-ZAH-2026-00069", kanal: "Stripe Checkout", status: "Erstattung angefordert", betrag: 145000, angefordert: 145000, zeitpunkt: dt(-17, 10, 2), bezug: "PH-S-261018-00011", auszahlung: "po_test_1022" }),
    zahlung({ name: "PH-ZAH-2026-00087", kanal: "Stripe Checkout", betrag: 8900, zeitpunkt: dt(-6, 20, 1), bezug: "PH-S-261029-00013", dispute: "needs_response" }),
    zahlung({ name: "PH-ZAH-2026-00090", kanal: "Gutschein", betrag: 5000, zeitpunkt: dt(-15, 10, 5), bezug: "PH-S-261020-00006", gutschein: "PH-GS-2026-00027", quelle: "backoffice" }),
    zahlung({ name: "PH-ZAH-2026-00103", kanal: "Stripe Checkout", betrag: 10890, zeitpunkt: dt(0, 10, 16), bezug: "PH-S-261104-00017", test: true }),
    zahlung({ name: "PH-ZAH-2026-00083", kanal: "Stripe Checkout", betrag: 16900, zeitpunkt: dt(-9, 10, 1), bezug: "PH-S-261026-00002", auszahlung: "po_test_1104" }),
    zahlung({ name: "PH-ZAH-2026-00052", kanal: "Stripe Checkout", status: "Teilerstattet", betrag: 39790, erstattet: 28900, zeitpunkt: dt(-27, 10, 1), bezug: "PH-S-261008-00001", auszahlung: "po_test_1011", erstattungen: [{ doctype: "PH Zahlung Erstattung", idx: 1, name: "er-1", parentfield: "erstattungen", parenttype: "PH Zahlung", zeitpunkt: dt(-8, 11, 0), betrag_cent: 28900, grund: "Widerruf PH-WID-2026-00004", stripe_refund: "re_test_00052", gegenbuchung: "PH-ZAH-2026-00079", von: "shop-leitung@beispiel.invalid" }] }),
    zahlung({ name: "PH-ZAH-2026-00079", art: "Erstattung", kanal: "Stripe Checkout", betrag: -28900, zeitpunkt: dt(-8, 11, 0), bezug: "PH-S-261008-00001", ursprung: "PH-ZAH-2026-00052", auszahlung: "po_test_1104" }),
    zahlung({ name: "PH-ZAH-2026-00098", kanal: "Stripe Checkout", status: "Fehlgeschlagen", betrag: 7900, zeitpunkt: dt(-2, 22, 3), bezug: "PH-S-261102-00014" }),
    zahlung({ name: "PH-ZAH-2026-00099", kanal: "Stripe Link", betrag: 120000, zeitpunkt: dt(-3, 10, 0), bezug_doctype: "PH Anzahlung", bezug: "ANZ-2026-0003", auszahlung: "po_test_1104" }),
    zahlung({ name: "PH-ZAH-2026-00100", kanal: "Stripe Checkout", betrag: 20000, zeitpunkt: dt(-4, 19, 0), bezug_doctype: "PH Gutschein Bestellung", bezug: "GB-2026-0012" }),
  ];
  const tz = tabelle("PH Zahlung");
  tz.clear();
  for (const z of Z) tz.set(z.name, z);

  // --- Gutscheine --------------------------------------------------------------------------------------------
  const G = [
    gutschein({ name: "PH-GS-2026-00031", code: "7K3Q", status: "Teilweise eingeloest", wert: 10000, rest: 5000, ausgegeben: dt(-23, 12, 0), kanal: "Kassa", beleg: "K1-000377", kaeufer_name: K[11].name, empfaenger: "Rosa", grusstext: "Für schöne Abende am See.", einloesungen: [{ datum: dt(-1, 15, 24), betrag_cent: 5000, rest_danach_cent: 5000, kanal: "Showroom", beleg_doctype: "PH Bestellung", beleg: "PH-S-261103-00009", mitarbeiter: "shop@demo.local", zahlung: "PH-ZAH-2026-00094" }] }),
    gutschein({ name: "PH-GS-2026-00034", code: "R2D4", status: "Aktiv", wert: 5000, rest: 5000, ausgegeben: dt(-4, 19, 0), kanal: "Online", gutschein_bestellung: "GB-2026-0012", zahlung: "PH-ZAH-2026-00100", kaeufer_name: K[12].name, kaeufer_email: K[12].email, empfaenger: "Familie Beispiel", gueltig_bis: tag(20) }),
    gutschein({ name: "PH-GS-2026-00035", code: "W9ZE", status: "Aktiv", wert: 15000, rest: 15000, ausgegeben: dt(-4, 19, 0), kanal: "Online", gutschein_bestellung: "GB-2026-0012", zahlung: "PH-ZAH-2026-00100", kaeufer_name: K[12].name, kaeufer_email: K[12].email }),
    gutschein({ name: "PH-GS-2026-00019", code: "H8KD", status: "Abgelaufen", wert: 10000, rest: 3750, ausgegeben: dt(-400, 11, 0), gueltig_bis: tag(-34), kanal: "Kassa", beleg: "K1-000102", einloesungen: [{ datum: dt(-380, 12, 0), betrag_cent: 6250, rest_danach_cent: 3750, kanal: "Kassa", beleg_doctype: "PH Kassenbeleg", beleg: "K1-000118", mitarbeiter: "kassa@demo.local" }] }),
    gutschein({ name: "PH-GS-2026-00022", code: "9QWE", status: "Eingeloest", wert: 5000, rest: 0, ausgegeben: dt(-60, 11, 0), kanal: "Online", einloesungen: [{ datum: dt(-30, 12, 0), betrag_cent: 5000, rest_danach_cent: 0, kanal: "Kassa", beleg_doctype: "PH Kassenbeleg", beleg: "K1-000301", mitarbeiter: "kassa@demo.local" }] }),
    gutschein({ name: "PH-GS-2026-00027", code: "LX2P", status: "Gesperrt", wert: 10000, rest: 5000, ausgegeben: dt(-40, 11, 0), kanal: "Kassa", beleg: "K1-000250", gesperrt_am: dt(-3, 10, 0), sperrgrund: "Verlust gemeldet – ersetzt", sperrgrund_art: "Ersetzt", ersetzt_durch: "PH-GS-2026-00033", einloesungen: [{ datum: dt(-15, 10, 5), betrag_cent: 5000, rest_danach_cent: 5000, kanal: "Showroom", beleg_doctype: "PH Bestellung", beleg: "PH-S-261020-00006", mitarbeiter: "shop@demo.local", zahlung: "PH-ZAH-2026-00090" }] }),
    gutschein({ name: "PH-GS-2026-00033", code: "T6NB", status: "Aktiv", wert: 5000, rest: 5000, ausgegeben: dt(-3, 10, 0), kanal: "Ersatz", hinweis: "Ersatz für PH-GS-2026-00027" }),
    gutschein({ name: "PH-GS-2026-00032", code: "A1ZC", status: "Aktiv", wert: 2500, rest: 2500, ausgegeben: dt(-10, 9, 0), kanal: "Showroom", motiv: "schlicht", empfaenger: "Gewinner Herbstfest", pdf: false }),
    gutschein({ name: "PH-GS-2026-00036", code: "Z3TT", status: "Aktiv", wert: 5000, rest: 5000, ausgegeben: dt(-1, 9, 0), kanal: "Online", test: true }),
  ];
  const tg = tabelle("PH Gutschein");
  tg.clear();
  for (const g of G) tg.set(g.name, g);

  const tgb = tabelle("PH Gutschein Bestellung");
  tgb.clear();
  const kauf = (o) => ({ doctype: "PH Gutschein Bestellung", name: o.name, bestellnummer: o.name, titel: `Gutscheinkauf ${o.k.name}`, status: o.status, livemode: 1, erstellt: o.erstellt, betrag_cent: o.betrag, anzahl: o.anzahl, summe_cent: o.betrag * o.anzahl, waehrung: "EUR", motiv: "seelicht", empfaenger: o.empfaenger || "", grusstext: "", kontakt: o.k.kontakt, kaeufer_name: o.k.name, kaeufer_email: o.k.email, kaeufer_firma: "", bezahlt_am: o.status === "bezahlt" ? o.erstellt : "", zahlung: o.zahlung || "", erstattet_cent: 0, gutscheine: (o.codes || []).map(([gs, c], i) => ({ doctype: "PH Gutschein Bestellung Code", idx: i + 1, name: `c-${i + 1}`, parentfield: "gutscheine", parenttype: "PH Gutschein Bestellung", gutschein: gs, code_letzte4: c, status: "Aktiv" })), mail_gesendet_am: o.status === "bezahlt" ? o.erstellt : "", zustimmung_bedingungen_stand: "2026-10-01", zustimmung_widerruf_stand: "2026-10-01", zustimmung_zeit: o.erstellt, verlauf: [], quelle: "website", owner: "Administrator", creation: o.erstellt, modified: o.erstellt, modified_by: "Administrator", docstatus: 0, idx: 0 });
  for (const k of [
    kauf({ name: "GB-2026-0012", k: K[12], status: "bezahlt", erstellt: dt(-4, 19, 0), betrag: 10000, anzahl: 2, zahlung: "PH-ZAH-2026-00100", codes: [["PH-GS-2026-00034", "R2D4"], ["PH-GS-2026-00035", "W9ZE"]], empfaenger: "Familie Beispiel" }),
    kauf({ name: "GB-2026-0013", k: K[13], status: "pruefen", erstellt: dt(-1, 21, 0), betrag: 5000, anzahl: 1 }),
    kauf({ name: "GB-2026-0011", k: K[2], status: "offen", erstellt: dt(-2, 12, 0), betrag: 2500, anzahl: 1 }),
  ]) tgb.set(k.name, k);

  // --- Widerrufe und Retouren --------------------------------------------------------------------------------
  const tw = tabelle("PH Widerruf");
  tw.clear();
  const wid = (o) => ({ doctype: "PH Widerruf", name: o.name, naming_series: "PH-WID-.YYYY.-.#####", eingangsnummer: o.name.slice(-5), titel: `Widerruf ${o.k.name}`, status: o.status, kanal: o.kanal || "Formular", eingegangen_am: o.eingang, zugeordnet: o.bestellung || o.gutschein_bestellung ? 1 : 0, bestellung: o.bestellung || "", gutschein_bestellung: o.gutschein_bestellung || "", angabe: o.angabe || "", kunde_name: o.k.name, kunde_email: o.k.email, anschrift: `Seestraße 4, 6911 ${o.k.ort}`, bestellt_am: o.bestellt_am || "", erhalten_am: o.erhalten_am || "", artikel: o.artikel || "", nachricht: o.nachricht || "", positionen: (o.pos || []).map(([p, m], i) => ({ doctype: "PH Widerruf Position", idx: i + 1, name: `wp-${i + 1}`, parentfield: "positionen", parenttype: "PH Widerruf", slug: p.slug, bezeichnung: p.bezeichnung, menge: m, summe_cent: p.einzel * m })), frist_ende: o.frist_ende || "", fristgerecht: o.fristgerecht ?? 1, rueckgabe_bis: o.rueckgabe_bis || "", erstattung_bis: o.erstattung_bis || "", bestaetigung_gesendet_am: o.mail_status === "gesendet" ? o.eingang : "", mail_status: o.mail_status || "gesendet", retoure: o.retoure || "", erstattung: o.erstattung || "", erstattungsbetrag_cent: o.betrag || 0, ablehnungsgrund: o.ablehnungsgrund || "", notiz_intern: "", quelle: "website", owner: "Administrator", creation: o.eingang, modified: o.eingang, modified_by: "Administrator", docstatus: 0, idx: 0 });
  for (const w of [
    wid({ name: "PH-WID-2026-00007", k: K[9], status: "Ware erwartet", eingang: dt(-2, 18, 20), bestellung: "PH-S-261020-00003", bestellt_am: tag(-15), erhalten_am: tag(-14), frist_ende: tag(0), rueckgabe_bis: tag(12), erstattung_bis: tag(12), retoure: "PH-RET-2026-00004", artikel: "Tischleuchte „Bell“ Messing", nachricht: "Die Leuchte passt farblich nicht, die Figur behalte ich.", pos: [[P.bell, 1]], betrag: 28900 }),
    wid({ name: "PH-WID-2026-00008", k: K[10], status: "Eingegangen", eingang: dt(0, 7, 40), bestellung: "PH-S-261015-00002", bestellt_am: tag(-20), erhalten_am: tag(-18), frist_ende: tag(-4), fristgerecht: 0, rueckgabe_bis: tag(14), erstattung_bis: tag(14), artikel: "Leuchte „Stone“", mail_status: "nicht_gesendet" }),
    wid({ name: "PH-WID-2026-00009", k: K[5], status: "Eingegangen", kanal: "E-Mail", eingang: dt(-1, 9, 0), angabe: "Bestellung vom Oktober, Gläser", artikel: "Weingläser", mail_status: "limit", erstattung_bis: tag(13) }),
    wid({ name: "PH-WID-2026-00006", k: K[7], status: "Ware erhalten", eingang: dt(-12, 9, 0), bestellung: "PH-S-261026-00002", bestellt_am: tag(-9), erhalten_am: tag(-7), frist_ende: tag(7), rueckgabe_bis: tag(2), erstattung_bis: tag(2), retoure: "PH-RET-2026-00003", artikel: "Akkuleuchte „Bellhop“", pos: [[P.bellhop, 1]], betrag: 16900 }),
    wid({ name: "PH-WID-2026-00004", k: K[9], status: "Erstattet", eingang: dt(-18, 9, 0), bestellung: "PH-S-261008-00001", erhalten_am: tag(-24), frist_ende: tag(-10), erstattung_bis: tag(-4), retoure: "PH-RET-2026-00002", pos: [[P.bell, 1]], betrag: 28900, erstattung: "PH-ZAH-2026-00079" }),
    wid({ name: "PH-WID-2026-00003", k: K[1], status: "Abgelehnt", eingang: dt(-25, 9, 0), bestellung: "PH-S-261001-00001", erhalten_am: tag(-32), frist_ende: tag(-18), fristgerecht: 0, ablehnungsgrund: "Frist überschritten – Zustellung 03.10. lt. Sendungsverfolgung, Belehrung mit der Bestätigung zugestellt" }),
  ]) tw.set(w.name, w);

  const tr = tabelle("PH Retoure");
  tr.clear();
  const ret = (o) => ({ doctype: "PH Retoure", name: o.name, naming_series: "PH-RET-.YYYY.-.#####", titel: `Retoure ${o.bestellung}`, status: o.status, bestellung: o.bestellung, widerruf: o.widerruf || "", angekuendigt_am: o.angekuendigt, eingegangen_am: o.eingegangen || "", weg: o.weg || "Ruecksendung", positionen: (o.pos || []).map(([p, m, zustand, wm = 0], i) => ({ doctype: "PH Retoure Position", idx: i + 1, name: `rp-${i + 1}`, parentfield: "positionen", parenttype: "PH Retoure", slug: p.slug, bezeichnung: p.bezeichnung, menge: m, zustand: zustand || "neu", wiedereinlagern: 1, wertminderung_cent: wm })), geprueft_von: o.geprueft ? "shop@demo.local" : "", geprueft_am: o.geprueft || "", wertminderung_cent: o.wm || 0, erstattungsbetrag_cent: o.betrag || 0, erstattung: o.erstattung || "", hinweis: o.hinweis || "", quelle: "backoffice", owner: "Administrator", creation: o.angekuendigt, modified: o.angekuendigt, modified_by: "Administrator", docstatus: 0, idx: 0 });
  for (const r of [
    ret({ name: "PH-RET-2026-00004", status: "Angekuendigt", bestellung: "PH-S-261020-00003", widerruf: "PH-WID-2026-00007", angekuendigt: dt(-1, 10, 0), pos: [[P.bell, 1]], betrag: 28900 }),
    ret({ name: "PH-RET-2026-00003", status: "Eingegangen", bestellung: "PH-S-261026-00002", widerruf: "PH-WID-2026-00006", angekuendigt: dt(-10, 10, 0), eingegangen: dt(-1, 11, 0), pos: [[P.bellhop, 1, "geoeffnet"]], betrag: 16900 }),
    ret({ name: "PH-RET-2026-00002", status: "Erstattet", bestellung: "PH-S-261008-00001", widerruf: "PH-WID-2026-00004", angekuendigt: dt(-17, 10, 0), eingegangen: dt(-12, 10, 0), geprueft: dt(-9, 10, 0), pos: [[P.bell, 1]], betrag: 28900, erstattung: "PH-ZAH-2026-00079" }),
    ret({ name: "PH-RET-2026-00005", status: "Unterwegs", weg: "Showroom", bestellung: "PH-S-261003-00010", angekuendigt: dt(-3, 10, 0), pos: [[P.kerze, 1]], betrag: 9900, hinweis: "Kunde bringt die Ware im Showroom vorbei" }),
    ret({ name: "PH-RET-2026-00001", status: "Geprueft", bestellung: "PH-S-261001-00001", angekuendigt: dt(-30, 10, 0), eingegangen: dt(-27, 10, 0), geprueft: dt(-26, 10, 0), pos: [[P.glas, 1, "beschaedigt", 3000]], wm: 3000, betrag: 9900 }),
  ]) tr.set(r.name, r);

  // --- Anzahlungen -------------------------------------------------------------------------------------------
  const ta = tabelle("PH Anzahlung");
  ta.clear();
  const anz = (o) => ({ doctype: "PH Anzahlung", name: o.name, anzahlung_id: o.name, titel: `Anzahlung ${o.auftrag}`, status: o.status, livemode: 1, auftrag_referenz: o.auftrag, betrag_cent: o.betrag, waehrung: "EUR", beschreibung: o.beschreibung || "Anzahlung 40 % laut Auftragsbestätigung", kontakt: o.k.kontakt, kunde_email: o.k.email, kunde_id: "", erstellt: o.erstellt, erstellt_von: "faktura@demo.local", link_gueltig_bis: o.gueltig, link_token_hash: "verborgen", link_gesendet_am: o.gesendet || "", bezahlt_am: o.bezahlt || "", zahlung: o.zahlung || "", erstattet_cent: 0, doppelt: (o.doppelt || []).map((d, i) => ({ doctype: "PH Anzahlung Doppelt", idx: i + 1, name: `d-${i + 1}`, parentfield: "doppelt", parenttype: "PH Anzahlung", ...d })), verlauf: [], quelle: "backoffice", owner: "Administrator", creation: o.erstellt, modified: o.erstellt, modified_by: "Administrator", docstatus: 0, idx: 0 });
  for (const x of [
    anz({ name: "ANZ-2026-0005", k: K[2], status: "offen", auftrag: "AB-2026-0041", betrag: 340000, erstellt: dt(-1, 10, 0), gueltig: dt(6, 10, 0), gesendet: dt(-1, 10, 2) }),
    anz({ name: "ANZ-2026-0004", k: K[3], status: "offen", auftrag: "AB-2026-0038", betrag: 98000, erstellt: dt(-12, 10, 0), gueltig: dt(-5, 10, 0), gesendet: dt(-12, 10, 2) }),
    anz({ name: "ANZ-2026-0003", k: K[4], status: "bezahlt", auftrag: "AB-2026-0035", betrag: 120000, erstellt: dt(-6, 10, 0), gueltig: dt(1, 10, 0), gesendet: dt(-6, 10, 2), bezahlt: dt(-3, 10, 0), zahlung: "PH-ZAH-2026-00099" }),
    anz({ name: "ANZ-2026-0002", k: K[5], status: "doppelt", auftrag: "AB-2026-0031", betrag: 59440, erstellt: dt(-14, 10, 0), gueltig: dt(-7, 10, 0), gesendet: dt(-14, 10, 2), bezahlt: dt(-13, 10, 0), doppelt: [{ session: "cs_test_dop1", payment_intent: "pi_test_dop1", betrag_cent: 59440, zeit: dt(-13, 10, 4), erstattet_cent: 0 }] }),
    anz({ name: "ANZ-2026-0006", k: K[6], status: "zahlung_ausstehend", auftrag: "AB-2026-0043", betrag: 75000, erstellt: dt(0, 8, 0), gueltig: dt(7, 8, 0), gesendet: dt(0, 8, 1) }),
    anz({ name: "ANZ-2026-0001", k: K[7], status: "fehlgeschlagen", auftrag: "AB-2026-0029", betrag: 45000, erstellt: dt(-20, 10, 0), gueltig: dt(-13, 10, 0), gesendet: dt(-20, 10, 2) }),
  ]) ta.set(x.name, x);

  // --- Stripe ------------------------------------------------------------------------------------------------
  const te = tabelle("PH Stripe Ereignis");
  te.clear();
  const ev = (name, typ, status, zeit, bezug, extra = {}) => ({ doctype: "PH Stripe Ereignis", name, event_id: name, titel: typ, typ, status, livemode: 1, empfangen_am: zeit, verarbeitet_am: status === "verarbeitet" ? zeit : "", versuche: extra.versuche || 1, api_version: "2025-09-30", art: typ.split(".")[0], bezug_doctype: bezug ? (bezug.startsWith("PH-ZAH") ? "PH Zahlung" : bezug.startsWith("po_") ? "PH Stripe Auszahlung" : "PH Bestellung") : "", bezug: bezug || "", ergebnis: extra.ergebnis || (status === "verarbeitet" ? "gebucht" : ""), fehler: extra.fehler || "", payload_json: JSON.stringify({ id: name, type: typ, livemode: true, data: { object: { id: `obj_${name.slice(-6)}` } } }, null, 2), owner: "Administrator", creation: zeit, modified: zeit, modified_by: "Administrator", docstatus: 0, idx: 0 });
  for (const e of [
    ev("evt_test_000101", "checkout.session.completed", "verarbeitet", dt(0, 9, 12), "PH-S-261104-00012"),
    ev("evt_test_000102", "review.opened", "verarbeitet", dt(0, 9, 12), "PH-S-261104-00012", { ergebnis: "Risiko markiert" }),
    ev("evt_test_000097", "checkout.session.async_payment_succeeded", "fehler", dt(-1, 6, 10), "PH-S-261104-00016", { versuche: 3, fehler: "Zahlung ist bereits angekündigt – Betrag weicht um 1,00 € ab." }),
    ev("evt_test_000095", "charge.dispute.created", "verarbeitet", dt(-1, 12, 0), "PH-ZAH-2026-00087", { ergebnis: "Aufgabe an Leitung" }),
    ev("evt_test_000094", "payout.paid", "verarbeitet", dt(-1, 5, 0), "po_test_1104"),
    ev("evt_test_000093", "charge.updated", "ignoriert", dt(-2, 10, 0), "", { ergebnis: "keine Änderung" }),
    ev("evt_test_000092", "checkout.session.expired", "verarbeitet", dt(-2, 22, 3), "PH-S-261102-00014"),
    ev("evt_test_000090", "charge.refunded", "verarbeitet", dt(-8, 11, 0), "PH-ZAH-2026-00079"),
  ]) te.set(e.name, e);

  const tp = tabelle("PH Stripe Auszahlung");
  tp.clear();
  const po = (name, status, betrag, gebuehren, erwartet, extra = {}) => ({ doctype: "PH Stripe Auszahlung", name, payout_id: name, titel: `Auszahlung ${erwartet.slice(8, 10)}.${erwartet.slice(5, 7)}.`, status, livemode: 1, betrag_cent: betrag, brutto_cent: betrag + gebuehren, gebuehren_cent: gebuehren, waehrung: "EUR", datum_erwartet: erwartet, datum_bank: extra.bank || "", abgeglichen_am: status === "abgeglichen" ? `${erwartet} 05:00:00` : "", differenz_cent: extra.differenz || 0, zahlungen: (extra.zahlungen || []).map(([zn, b, g], i) => ({ doctype: "PH Stripe Auszahlung Zahlung", idx: i + 1, name: `pz-${i + 1}`, parentfield: "zahlungen", parenttype: "PH Stripe Auszahlung", balance_transaction: `txn_test_${String(i + 1).padStart(5, "0")}`, typ: b < 0 ? "refund" : "charge", zahlung: zn, betrag_cent: b, gebuehr_cent: g, netto_cent: b - g, hinweis: zn ? "" : "Keine Zahlung im Backoffice gefunden" })), hinweis: "", owner: "Administrator", creation: `${erwartet} 05:00:00`, modified: `${erwartet} 05:00:00`, modified_by: "Administrator", docstatus: 0, idx: 0 });
  for (const p of [
    po("po_test_1104", "bezahlt", 316145, 4335, tag(-1), { bank: tag(-1), zahlungen: [["PH-ZAH-2026-00088", 19800, 322], ["PH-ZAH-2026-00084", 98990, 1510], ["PH-ZAH-2026-00083", 16900, 279], ["PH-ZAH-2026-00099", 120000, 1825], ["PH-ZAH-2026-00079", -28900, 0], ["", 93690, 399]] }),
    po("po_test_1022", "abgeglichen", 181940, 2850, tag(-13), { bank: tag(-13), zahlungen: [["PH-ZAH-2026-00071", 38790, 607], ["PH-ZAH-2026-00069", 145000, 2243]] }),
    po("po_test_1018", "abgeglichen", 49215, 775, tag(-17), { bank: tag(-17), zahlungen: [["PH-ZAH-2026-00066", 49990, 775]] }),
    po("po_test_1011", "bezahlt", 64500, 1080, tag(-24), { differenz: -1000, bank: tag(-24), zahlungen: [["PH-ZAH-2026-00055", 25790, 412], ["PH-ZAH-2026-00052", 39790, 668]] }),
    po("po_test_1006", "abgeglichen", 10701, 189, tag(-29), { bank: tag(-29), zahlungen: [["PH-ZAH-2026-00049", 10890, 189]] }),
    po("po_test_1106", "unterwegs", 23413, 377, tag(2)),
  ]) tp.set(p.name, p);

  // --- Einstellungen -----------------------------------------------------------------------------------------
  const se = tabelle("PH Shop Einstellungen").get("PH Shop Einstellungen");
  if (se) Object.assign(se, { shop_modus: "test", gutschein_modus: "stripe", testmodus_mail_an: "shop-test@beispiel.invalid", abholung_frist_tage: 7, reservierung_frist_tage: 14, session_frist_stunden: 24, auto_abschliessen_tage: 30, zahlungslink_gueltig_stunden: 24, versand_pauschale_at_cent: 990, versand_pauschale_de_cent: 1490, versand_frei_ab_cent: 15000, oss_aktiv: 0, gutschein_art_standard: "Mehrzweck", gutschein_gueltig_jahre: 0, gutschein_min_cent: 1000, gutschein_max_cent: 100000, agb_stand: "2026-10-01", widerrufsbelehrung_stand: "2026-10-01", versandbedingungen_stand: "2026-10-01", datenschutz_stand: "2026-10-01", rechtstexte_status: "kanzlei-offen" });
  const st = tabelle("PH Stripe Einstellungen").get("PH Stripe Einstellungen");
  if (st) Object.assign(st, { testmodus: 1, simulation: 1, livemode_konfiguriert: 0, webhook_pfad: "/api/method/ph_shop.api.stripe.webhook", webhook_toleranz_s: 300, payload_max_zeichen: 20000, schluessel_vorhanden: 1, webhook_secret_vorhanden: 1, ereignistypen: "checkout.session.completed\ncharge.refunded\ncharge.dispute.created\npayout.paid", vier_augen_ab_cent: 100000, auszahlung_abgleich_tage: 7, letzter_abgleich: dt(0, 5, 0) });

  // --- Bezüge in Logistik und Faktura (angehängt, ändern die Daten dieser Bereiche nicht) -----------------------
  const tl = tabelle("PH Lieferschein");
  const ls = (name, bestellung, k, status, extra = {}) => ({ doctype: "PH Lieferschein", name, naming_series: "LS-.YYYY.-.#####", titel: `Lieferschein ${bestellung}`, status, lieferart: "Versand", datum: extra.datum, kontakt: k.kontakt, kunde_name: k.name, kunde_email: k.email, bestellung, positionen: [], pakete: [], gepackt_am: extra.gepackt || "", uebergeben_am: extra.uebergeben || "", zugestellt_am: extra.zugestellt || "", quelle: "backoffice", owner: "Administrator", creation: `${extra.datum} 10:00:00`, modified: `${extra.datum} 10:00:00`, modified_by: "Administrator", docstatus: 0, idx: 0 });
  for (const l of [
    ls("LS-2026-90001", "PH-S-261020-00003", K[9], "Zugestellt", { datum: tag(-14), uebergeben: dt(-14, 14, 0), zugestellt: dt(-12, 10, 42) }),
    ls("LS-2026-90002", "PH-S-261102-00006", K[8], "Gepackt", { datum: tag(-1), gepackt: dt(-1, 10, 0) }),
    ls("LS-2026-90003", "PH-S-261003-00010", K[0], "Zugestellt", { datum: tag(-31), uebergeben: dt(-31, 15, 0), zugestellt: dt(-30, 11, 5) }),
    ls("LS-2026-90004", "PH-S-261001-00001", K[1], "Zugestellt", { datum: tag(-33), uebergeben: dt(-33, 12, 0), zugestellt: dt(-32, 9, 30) }),
  ]) tl.set(l.name, l);
  const tre = tabelle("PH Rechnung");
  tre.set("ENTW-2026-90001", { doctype: "PH Rechnung", name: "ENTW-2026-90001", titel: "Rechnung PH-S-261009-00008", status: "Gestellt", kunde_name: K[13].name, bestellung: "PH-S-261009-00008", owner: "Administrator", creation: dt(-24, 10, 0), modified: dt(-24, 10, 0), modified_by: "Administrator", docstatus: 1, idx: 0 });
}
