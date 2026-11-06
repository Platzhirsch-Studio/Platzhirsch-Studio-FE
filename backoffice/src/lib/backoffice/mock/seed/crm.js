// Mock-Seed – Bereich CRM (G-01, MASTER § 3.5). Schreibt: Team B-CRM.
// anzahl: Datensätze je DocType · kern: Fachwissen je DocType (Verteilung, Bezüge, Titel) nach der
// generischen Erzeugung · default: Nachlauf (db, hilfe) nach dem Grundaufbau, Reihenfolge über `nach`.
// Keine echten Personen, E-Mails @beispiel.invalid, runde Beispielbeträge (Q-A3). Zufall nur über `r`
// (fester Startwert); Reihenfolge der r-Aufrufe nicht ändern, sonst verschieben sich alle Folgedaten.

import { isoDatum, isoDatumZeit } from "../../format.js";
import { ANLIEGEN, FIRMEN, ORTE, tage } from "./basis.js";

/** Nachläufe anderer Bereiche, die vor diesem laufen müssen. */
export const nach = [];

/** Anzahl generischer Datensätze je DocType (nicht gelistete mit Status bekommen 6). */
export const anzahl = {
  "PH Anfrage": 24,
  "PH Kontakt": 20,
  "PH Termin": 16,
  "PH Terminart": 4,
};

/** Fachliche Nachbearbeitung je DocType: (doc, { i, r, ctx, person }) – ändert doc. */
export const kern = {
  "PH Anfrage": (doc, { i, r, person }) => {
    doc.status = r.pick(["Neu", "Neu", "Neu", "Qualifiziert", "Qualifiziert", "Termin vereinbart", "Angebot", "Gewonnen", "Verloren", "Spam"]);
    doc.art = r.pick(["Kontakt", "Beratung", "Beratung", "Produkt", "Gutschein", "Reservierung", "Ezarri", "Termin"]);
    doc.eingang = isoDatumZeit(tage(-Math.floor(i * 2.4), r));
    doc.quelle = r.pick(["website", "website", "website", "telefon", "showroom", "agent", "empfehlung"]);
    doc.prioritaet = r.pick(["Normal", "Normal", "Normal", "Hoch", "Niedrig"]);
    doc.anliegen = r.pick(ANLIEGEN);
    doc.titel = `${doc.art}: ${person}`;
    doc.workflow_state = `PH ${doc.status}`;
    doc.zugewiesen_an = doc.status === "Neu" && r.chance(0.5) ? "" : r.pick(["crm@demo.local", "crm-leitung@demo.local", "gf@demo.local"]);
    doc.naechster_schritt = doc.status === "Qualifiziert" ? "Rückruf vereinbaren" : "";
    doc.wiedervorlage = doc.status === "Neu" || doc.status === "Qualifiziert" ? isoDatum(tage(r.int(0, 7))) : "";
    doc.erstreaktion_am = doc.status !== "Neu" ? isoDatumZeit(tage(-Math.floor(i * 2.4) + 1, r)) : "";
    doc.upload_status = r.chance(0.2) ? "eingegangen" : "";
    doc.upload_anzahl = doc.upload_status ? r.int(1, 4) : 0;
    doc.ip_hash = "";
    doc.idempotency_key = "";
  },
  "PH Kontakt": (doc, { r, person }) => {
    doc.status = r.pick(["Interessent", "Interessent", "Kunde", "Kunde", "Kunde", "Inaktiv"]);
    doc.kontaktart = r.pick(["Privat", "Privat", "Privat", "Geschaeft", "Architekt"]);
    doc.titel = doc.kontaktart === "Geschaeft" ? r.pick(FIRMEN) : person;
    if (doc.kontaktart === "Geschaeft") doc.firma = doc.titel;
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Termin": (doc, { i, r, person }) => {
    doc.status = i < 4 ? "Bestaetigt" : r.pick(["Unbestaetigt", "Bestaetigt", "Bestaetigt", "Erledigt", "Erledigt", "Storniert"]);
    const offset = i < 4 ? 0 : i < 8 ? r.int(1, 6) : r.int(-30, 14);
    const d = tage(offset, r);
    doc.start = isoDatumZeit(d);
    const ende = new Date(d.getTime() + 60 * 60 * 1000);
    if ("ende" in doc) doc.ende = isoDatumZeit(ende);
    doc.modus = r.pick(["Showroom", "Showroom", "Vor Ort", "Video", "Telefon"]);
    doc.terminart = r.pick(["Erstberatung", "Planungsgespräch", "Küchenberatung", "Bemusterung"]);
    doc.titel = `${doc.terminart} ${person} (${doc.modus})`;
    doc.workflow_state = `PH ${doc.status}`;
  },
  "PH Terminart": (doc, { i }) => {
    doc.name = ["Erstberatung", "Planungsgespräch", "Küchenberatung", "Bemusterung"][i] || `Terminart ${i + 1}`;
    doc.titel = doc.name;
    if ("bezeichnung" in doc) doc.bezeichnung = doc.name;
  },
};

// ------------------------------------------------------------------ Nachlauf --
// Team B-CRM: Bezüge und alle Status-/Leer-/Fehlerfälle für die CRM-Seiten (10-konzept-crm § 17.5 Schritt 1).
// Ändert nie vorname/nachname/titel der ersten Kontakte (andere Nachläufe lesen sie), nur Ergänzungen.
// Läuft beim Aufbau und – für eine schon laufende Mock-Datenbank – einmalig über lib/backoffice/crm/daten.js.

export const CRM_SEED_VERSION = 2;

const CRM_BERATER = ["crm@demo.local", "crm-leitung@demo.local", "gf@demo.local"];
const RAEUME = ["Kueche", "Wohnen", "Essen", "Schlafen", "Bad", "Outdoor"];
const WUENSCHE = {
  Kueche: "Insel mit Sitzplatz, Kochfeldabzug, Fronten Eiche geräuchert",
  Wohnen: "Sofalandschaft in Leder, Blick zum Garten frei halten",
  Essen: "Tisch für acht Personen, ausziehbar, Leuchte darüber",
  Schlafen: "Polsterbett 180, ruhige Stoffe, viel Stauraum",
  Bad: "Waschtisch Naturstein, warmes Licht",
  Outdoor: "Lounge für die Terrasse, wetterfest",
};
const PROJEKTARTEN = ["Küche", "Wohnen", "Haus", "Wohnung", "Outdoor", "Hotel"];

const iso = (d) => isoDatumZeit(d);
const plusMin = (s, min) => iso(new Date(new Date(String(s).replace(" ", "T")).getTime() + min * 60000));

function produktZeile(r) {
  return { slug: r.pick(["sofa-modul-240", "esstisch-eiche-220", "pendelleuchte-glas"]), titel: r.pick(["Sofa Modul 240", "Esstisch Eiche 220", "Pendelleuchte Glas"]), marke: r.pick(["Minotti", "Poliform", "Flexform"]), menge: r.int(1, 2), hinweis: "" };
}

/**
 * Nachlauf nach dem Grundaufbau (Bezüge zwischen DocTypes, Leer-/Fehlerfälle). Eigener Zufall über hilfe.rng.
 * @param {Map<string, Map<string, object>>} db
 * @param {import("./index.js").SeedHilfe} hilfe
 */
export default function nachlauf(db, hilfe) {
  const r = hilfe.rng;
  const T = (dt) => hilfe.tabelle(dt);
  const neu = (dt, werte, datum = hilfe.tage(0)) => {
    const meta = hilfe.index.doctypes.get(dt);
    if (!meta) return null;
    const doc = { doctype: dt, ...werte };
    doc.name = hilfe.neuerName(meta, doc, hilfe.naechste, datum);
    const zeit = iso(datum);
    Object.assign(doc, { owner: werte.owner || "crm@demo.local", creation: werte.creation || zeit, modified: zeit, modified_by: "crm@demo.local", docstatus: 0, idx: 0 });
    T(dt).set(doc.name, doc);
    return doc;
  };

  // --- Kontakte ergänzen ---------------------------------------------------
  const kontakte = [...T("PH Kontakt").values()];
  kontakte.forEach((k, i) => {
    const [plz, ...ort] = r.pick(ORTE).split(" ");
    const m = /^(\d{4,5})\s+(.+)$/.exec(String(k.ort || ""));
    if (m) {
      k.plz = m[1];
      k.ort = m[2];
    }
    if (!k.plz) k.plz = plz;
    if (!k.ort) k.ort = ort.join(" ");
    if (!k.personenVomSeed) k.firma_kontakt = "";
    k.loeschung_angefordert_am = "";
    k.aufbewahren_bis = "";
    k.widerspruchshinweis_am = "";
    k.widerspruchshinweis_quelle = "";
    if (k.status !== "Kunde") k.kunde_seit = "";
    if (!k.geburtstag_einwilligung) k.geburtstag = "";
    if (!k.strasse) k.strasse = `Musterweg ${i + 3}`;
    if (!k.berater) k.berater = CRM_BERATER[i % CRM_BERATER.length];
    k.kommunikation_bevorzugt = r.pick(["E-Mail", "E-Mail", "Telefon", "WhatsApp"]);
    k.letzter_kontakt = iso(hilfe.tage(-r.int(0, 40), r));
    k.letzter_kontakt_art = r.pick(["E-Mail", "Termin", "Telefon", "Anfrage"]);
    if (k.status === "Kunde" && !k.kunde_seit) k.kunde_seit = isoDatum(hilfe.tage(-r.int(60, 900)));
    k.nicht_kontaktieren = 0;
    k.anonymisiert_am = "";
    k.notizen = "";
  });
  // Sonderfälle (ab Index 5, die ersten Kontakte lesen andere Nachläufe)
  const sonder = kontakte.slice(5);
  if (sonder[0]) Object.assign(sonder[0], { nicht_kontaktieren: 1, widerspruchshinweis_am: isoDatum(hilfe.tage(-23)), widerspruchshinweis_quelle: "Telefon" });
  if (sonder[1]) Object.assign(sonder[1], { email: "", kommunikation_bevorzugt: "Brief" });
  if (sonder[2]) Object.assign(sonder[2], { land: "Switzerland", plz: "9000", ort: "St. Gallen" });
  if (sonder[3]) Object.assign(sonder[3], { status: "Gesperrt", workflow_state: "PH Gesperrt" });
  if (sonder[4]) Object.assign(sonder[4], { status: "Inaktiv", workflow_state: "PH Inaktiv", anonymisiert_am: iso(hilfe.tage(-10)), email: "", telefon: "", strasse: "" });
  // Firma mit zwei Personen
  const firma = kontakte.find((k) => k.kontaktart === "Geschaeft");
  if (firma && !kontakte.some((k) => k.personenVomSeed)) {
    for (const [vorname, nachname, funktion] of [["Clara", "Vorlage", "Einkauf"], ["Tobias", "Schema", "Geschäftsführung"]]) {
      neu("PH Kontakt", { naming_series: "PH-KON-.#####", kontaktart: "Privat", status: firma.status, workflow_state: firma.workflow_state, vorname, nachname, titel: `${vorname} ${nachname}`, email: `${vorname}.${nachname}@beispiel.invalid`.toLowerCase(), telefon: `+43 5574 ${r.int(10000, 99999)}`, firma_kontakt: firma.name, personenVomSeed: 1, funktion, berater: firma.berater, sprache: "de", quelle: "showroom", plz: firma.plz, ort: firma.ort }, hilfe.tage(-30));
    }
  }

  // --- Anfragen ------------------------------------------------------------
  const anfragen = [...T("PH Anfrage").values()];
  let neuIndex = 0;
  anfragen.forEach((a, i) => {
    if (a.status === "Neu") {
      a.eingang = iso(new Date(hilfe.tage(0).getTime() - [2, 7, 30, 52, 76, 5][neuIndex % 6] * 3600000));
      a.creation = a.eingang;
      if (neuIndex % 2 === 0) a.kontakt = "";
      neuIndex += 1;
    }
    a.ort_der_beratung = r.pick(["Showroom", "Showroom", "Vor Ort", "Video", ""]);
    a.projektart = r.pick(PROJEKTARTEN);
    a.objektart = r.pick(["Einfamilienhaus", "Wohnung", "Ferienhaus", ""]);
    a.wunschzeiten = r.pick(["abends oder Samstag", "vormittags", "", "flexibel"]);
    a.budget_hinweis = r.pick(["", "ca. 30.000 €", "offen", "40–60 T€"]);
    a.wert_cent = ["Qualifiziert", "Termin vereinbart", "Angebot", "Gewonnen"].includes(a.status) ? r.pick([1500000, 3200000, 4800000, 8600000]) : 0;
    a.wahrscheinlichkeit_prozent = { Qualifiziert: 20, "Termin vereinbart": 40, Angebot: 60, Gewonnen: 100 }[a.status] || 0;
    a.gewichtet_cent = Math.round((a.wert_cent * a.wahrscheinlichkeit_prozent) / 100);
    a.wiedervorlage = "";
    a.titel = `${a.art}: ${[a.vorname, a.nachname].filter(Boolean).join(" ")}`;
    if (a.status === "Verloren") a.verloren_grund = r.pick(["Preis", "Mitbewerber", "Projekt verschoben", "Kein Bedarf"]);
    if (a.art === "Produkt") a.produkte = [{ doctype: "PH Anfrage Produkt", idx: 1, parentfield: "produkte", parenttype: "PH Anfrage", ...produktZeile(r) }];
    if (i === 3 && anfragen[0]) a.duplikat_von = anfragen[0].name;
    if (a.upload_status === "eingegangen" && i % 2) a.upload_status = "offen";
  });

  // --- Termine: Bezug zu Anfragen + alle Fälle -----------------------------
  const termine = [...T("PH Termin").values()];
  const vereinbart = anfragen.filter((a) => a.status === "Termin vereinbart");
  const angenommen = anfragen.filter((a) => a.status === "Qualifiziert");
  termine.forEach((t, i) => {
    t.dauer_min = r.pick([45, 60, 60, 90]);
    t.berater = CRM_BERATER[i % CRM_BERATER.length];
    t.quelle = r.pick(["backoffice", "website", "website", "telefon"]);
    t.kundenmail = t.quelle === "website" ? "website" : "backoffice";
    t.email_verifiziert = t.status === "Unbestaetigt" ? (i % 3 ? 1 : 0) : 1;
    t.reserviert_bis = t.status === "Unbestaetigt" && t.quelle === "website" ? iso(new Date(hilfe.tage(0).getTime() + 3600000 * 8)) : "";
    t.thema = r.pick(["Küche", "Wohnen", "Essen", "Outdoor", ""]);
    t.notiz_intern = "";
    t.meet_url = "";
    t.anfrage = "";
    t.beratungsgespraech = "";
    const k = kontakte.find((x) => x.name === t.kontakt);
    if (k) Object.assign(t, { vorname: k.vorname || t.vorname, nachname: k.nachname || t.nachname, email: k.email || "" });
  });
  // Termine heute für Anna Probe (Mein Tag)
  [9, 10.5, 14, 16].forEach((h, i) => {
    const t = termine[i];
    if (!t) return;
    const d = new Date(hilfe.tage(0));
    d.setHours(Math.floor(h), (h % 1) * 60, 0, 0);
    Object.assign(t, { start: iso(d), berater: "crm@demo.local", status: i === 3 ? "Unbestaetigt" : "Bestaetigt", workflow_state: i === 3 ? "PH Unbestaetigt" : "PH Bestaetigt", email_verifiziert: 1, modus: ["Showroom", "Video", "Vor Ort", "Showroom"][i] });
  });
  vereinbart.forEach((a, i) => {
    const t = termine[4 + i];
    if (!t || 4 + i >= 10) return;
    Object.assign(t, { anfrage: a.name, kontakt: a.kontakt || t.kontakt, vorname: a.vorname, nachname: a.nachname, email: a.email, status: "Bestaetigt", workflow_state: "PH Bestaetigt", start: iso(hilfe.tage(2 + i, r)) });
  });
  if (angenommen[0] && termine[10]) Object.assign(termine[10], { anfrage: angenommen[0].name, kontakt: angenommen[0].kontakt || termine[10].kontakt, vorname: angenommen[0].vorname, nachname: angenommen[0].nachname, status: "Storniert", workflow_state: "PH Storniert", storno_grund: "Kunde verhindert", start: iso(hilfe.tage(-1, r)) });
  if (termine[11]) Object.assign(termine[11], { status: "Abgelehnt", workflow_state: "PH Abgelehnt", storno_grund: "E-Mail nicht bestätigt", quelle: "website", kundenmail: "website", email_verifiziert: 0, start: iso(hilfe.tage(1, r)) });
  if (termine[12]) Object.assign(termine[12], { status: "Bestaetigt", workflow_state: "PH Bestaetigt", start: iso(hilfe.tage(-1, r)), berater: "crm@demo.local" });
  if (termine[13]) Object.assign(termine[13], { status: "Nicht erschienen", workflow_state: "PH Nicht erschienen", storno_grund: "nicht erschienen", start: iso(hilfe.tage(-3, r)) });
  termine.forEach((t) => {
    t.ende = plusMin(t.start, t.dauer_min || 60);
    t.titel = `${t.terminart || "Termin"} ${[t.vorname, t.nachname].filter(Boolean).join(" ")} (${t.modus})`;
  });

  // --- Gespräche -----------------------------------------------------------
  const erledigt = termine.filter((t) => t.status === "Erledigt");
  const gespraeche = [...T("PH Beratungsgespraech").values()];
  gespraeche.forEach((g, i) => {
    const t = erledigt[i];
    if (t) {
      g.termin = t.name;
      g.kontakt = t.kontakt || g.kontakt;
      g.datum = String(t.start).slice(0, 10);
      g.berater = t.berater;
      g.ort = t.modus;
      t.beratungsgespraech = g.name;
    }
    g.status = ["Offen", "Offen", "Planung beauftragt", "Abgeschlossen", "Abgeschlossen", "Offen"][i % 6];
    const anzahl = i === 5 ? 0 : r.int(1, 3);
    const raeume = [];
    for (let j = 0; j < anzahl; j++) {
      const raum = RAEUME[(i + j) % RAEUME.length];
      raeume.push({ doctype: "PH Beratungsgespraech Raum", idx: j + 1, parentfield: "raeume", parenttype: "PH Beratungsgespraech", parent: g.name, name: `${g.name}-raum-${j + 1}`, raum, wunsch: WUENSCHE[raum], budget_cent: r.pick([800000, 1500000, 2500000, 3500000]), prioritaet: j === 0 ? "Hoch" : "Normal", marken: r.pick(["Poliform", "Minotti", "Flexform", ""]), masse: r.pick(["4,2 × 3,8 m", "", "6 × 5 m"]) });
    }
    g.raeume = raeume;
    g.fragen = [];
    g.budget_gesamt_cent = raeume.reduce((s, x) => s + x.budget_cent, 0);
    g.zeitrahmen = r.pick(["1-3 Monate", "3-6 Monate", "6-12 Monate"]);
    g.objektart = r.pick(["Einfamilienhaus", "Wohnung", "Ferienhaus"]);
    g.stil = r.pick(["warm, natürliche Materialien", "klar, ruhig", "mediterran"]);
    g.zusammenfassung = raeume.length ? `Wünsche für ${raeume.map((x) => x.raum.replace("Kueche", "Küche")).join(", ")} besprochen. Muster mitgegeben.` : "";
    g.naechster_schritt = g.status === "Abgeschlossen" ? "" : r.pick(["Rendering vorlegen", "Muster zusenden", "Aufmaß vor Ort"]);
    g.naechster_schritt_bis = g.naechster_schritt ? isoDatum(hilfe.tage(r.int(-2, 10))) : "";
    g.notiz_intern = "";
    const k = kontakte.find((x) => x.name === g.kontakt);
    g.titel = `${String(g.datum || "").slice(8, 10)}.${String(g.datum || "").slice(5, 7)}. ${k?.titel || ""}`.trim();
  });

  // --- Aufgaben: Nachfassen und Termin-Folgen ------------------------------
  const offeneAnfragen = anfragen.filter((x) => ["Qualifiziert", "Termin vereinbart", "Angebot"].includes(x.status));
  [...T("PH Aufgabe").values()].forEach((k, i) => {
    const a = offeneAnfragen[i];
    if (a) Object.assign(k, { referenz_doctype: "PH Anfrage", referenz_name: a.name, kontakt: a.kontakt || "", titel: r.pick(["Angebot nachfassen", "Rückruf vereinbaren", "Unterlagen schicken"]) });
    k.zugewiesen_an = i % 2 ? "crm@demo.local" : "crm-leitung@demo.local";
    k.faellig = isoDatum(hilfe.tage([-2, 0, 0, 1, 3, -1][i % 6]));
    k.status = i === 5 ? "Erledigt" : r.pick(["Offen", "Offen", "In Arbeit"]);
    k.quelle = i === 4 ? "scheduler" : "manuell";
  });

  // --- Datenschutzanfragen -------------------------------------------------
  [...T("PH Datenschutzanfrage").values()].forEach((s, i) => {
    const k = kontakte[(i * 3) % kontakte.length];
    const eingang = hilfe.tage([-26, -10, -2, -40, -33, -5][i % 6]);
    const frist = new Date(eingang);
    frist.setMonth(frist.getMonth() + 1);
    Object.assign(s, { art: ["Auskunft", "Loeschung", "Widerspruch", "Berichtigung", "Auskunft", "Einschraenkung"][i % 6], kontakt: k?.name || s.kontakt, eingang: isoDatum(eingang), frist: isoDatum(frist), status: ["In Arbeit", "Offen", "Offen", "Erledigt", "Abgelehnt", "Offen"][i % 6], kanal: r.pick(["E-Mail", "Brief", "Telefon", "Showroom"]), identitaet_geprueft: i === 0 ? 1 : 0, zugewiesen_an: "crm-leitung@demo.local" });
    s.titel = `${s.art}: ${k?.titel || ""}`.trim();
  });

  // --- Verfügbarkeit (3 Berater) --------------------------------------------
  if (hilfe.index.doctypes.has("PH Verfuegbarkeit") && T("PH Verfuegbarkeit").size === 0) {
    const tage = ["0 Montag", "1 Dienstag", "2 Mittwoch", "3 Donnerstag", "4 Freitag", "5 Samstag"];
    CRM_BERATER.forEach((user, b) => {
      tage.forEach((wochentag, tag) => {
        if (b === 2 && tag > 3) return;
        for (const [von, bis] of tag === 5 ? [["09:00:00", "13:00:00"]] : [["09:00:00", "12:00:00"], ["13:00:00", "18:00:00"]]) {
          neu("PH Verfuegbarkeit", { user, wochentag, aktiv: 1, von, bis, modus: b === 1 && tag === 2 ? "Video" : "", titel: `${user.split("@")[0]} ${wochentag.slice(2)} ${von.slice(0, 5)}–${bis.slice(0, 5)}` }, hilfe.tage(-90));
        }
      });
    });
  }

  db.crmSeedVersion = CRM_SEED_VERSION;
}
