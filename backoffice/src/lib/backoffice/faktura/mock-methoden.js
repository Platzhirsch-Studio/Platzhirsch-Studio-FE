// Mock-Pfad der Faktura-Dokumentmethoden (MASTER § 5.3 Nr. 5: jede Server Action hat einen Mock-Pfad).
// Der Fundament-Mock führt Dokumentmethoden ohne Wirkung aus (Kommentar). Für die Abnahme im Mock bildet dieses
// Modul die fachliche Wirkung der ph_faktura-Methoden nach (Nummer beim Stellen, Zahlung, Mahnung, Zuordnung,
// Freigabe, Export …) – vereinfacht, aber mit denselben Regeln, die die Oberfläche sichtbar macht.
// Nur für client.modus === "mock". Arbeitet auf der In-Memory-Datenbank des MockClient.

import { BackofficeError } from "../frappe/errors.js";
import { belegSummen, vereinnahmteAnzahlungen } from "./betraege.js";
import * as KZ from "./kostenzuordnung.js";
import { plusTage } from "./regeln.js";

const klon = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const heute = (client) => client.jetzt().toISOString().slice(0, 10);
const jahr = (client) => client.jetzt().getFullYear();

function tab(client, dt) {
  return client.tabelle(dt);
}

function lade(client, dt, name) {
  const meta = client.meta(dt);
  client.pruefe(meta, "read");
  const doc = tab(client, dt).get(name);
  if (!doc) throw new BackofficeError("not_found", "Dieser Beleg existiert nicht mehr.");
  return doc;
}

function schreibe(client, dt, alt, neu, aktion = "write") {
  client.pruefe(client.meta(dt), aktion);
  client.stempel(neu);
  tab(client, dt).set(neu.name, neu);
  client.version(dt, neu.name, alt, neu);
  return klon(neu);
}

function neu(client, dt, werte) {
  const meta = client.meta(dt);
  client.pruefe(meta, "create");
  const doc = { doctype: dt, docstatus: 0, ...klon(werte) };
  client.kinderNormalisieren(meta, doc);
  client.stempel(doc, true);
  tab(client, dt).set(doc.name, doc);
  client.version(dt, doc.name, null, doc);
  return doc;
}

function nummer(client, prefixBasis, breite = 5) {
  const prefix = `${prefixBasis}-${jahr(client)}-`;
  return `${prefix}${String(client.naechsteNummer(prefix)).padStart(breite, "0")}`;
}

function entwurfName(client, gu = false) {
  return nummer(client, gu ? "ENTW-GU" : "ENTW");
}

function journal(client, vorgang, doctype, beleg, betrag, details = "") {
  if (!client.index.doctypes.has("PH Buchungsjournal")) return;
  const name = `JR-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  const n = tab(client, "PH Buchungsjournal").size + 1;
  tab(client, "PH Buchungsjournal").set(name, { doctype: "PH Buchungsjournal", name, titel: `${vorgang} ${beleg}`, zeitpunkt: heute(client), vorgang, beleg_doctype: doctype, beleg, nummer: beleg, betrag_cent: betrag, benutzer: client.session.user, details, pruefsumme: `${((n * 2654435761) >>> 0).toString(16).padStart(8, "0")}${((n * 40503) >>> 0).toString(16).padStart(8, "0")}`, creation: client.zeitstempel(), modified: client.zeitstempel(), docstatus: 0 });
}

function umbenennen(client, dt, alt, neuName) {
  tab(client, dt).delete(alt.name);
  // Verweise in Zahlungsplänen und Bezügen nachziehen
  for (const ab of tab(client, "PH Auftragsbestaetigung").values()) for (const z of ab.zahlungsplan || []) if (z.rechnung === alt.name) z.rechnung = neuName;
  for (const b of tab(client, "PH Bankumsatz").values()) for (const z of b.zuordnungen || []) if (z.beleg === alt.name) z.beleg = neuName;
}

function summen(doc) {
  const s = belegSummen(doc.positionen || []);
  Object.assign(doc, s, { ust_aufteilung: s.ust_aufteilung.map((z) => ({ bezeichnung: `USt ${z.ust_satz_promille / 10} %`, ...z })) });
  doc.zahlbar_cent = doc.brutto_cent - (Number(doc.anzahlung_brutto_cent) || 0);
  return doc;
}

// ---------------------------------------------------------------- Rechnung --

function reStellen(client, doc, args) {
  if (Number(doc.docstatus) !== 0) throw new BackofficeError("conflict", "Bereits gestellt.");
  const alt = klon(doc);
  const nr = nummer(client, "RE");
  const d = args.datum || heute(client);
  const n = { ...doc, name: nr, nummer: nr, datum: d, docstatus: 1, status: "Gestellt", workflow_state: "PH Gestellt", gestellt_am: d, zahlungsreferenz: nr, qr_code_girocode: 1, pdf: `/private/files/${nr}.pdf`, pdf_fixiert_am: `${d} ${client.jetzt().toTimeString().slice(0, 8)}` };
  n.faellig = doc.faellig && doc.faellig > d ? doc.faellig : plusTage(d, Number(doc.zahlungsziel_tage) || 14);
  summen(n);
  n.bezahlt_cent = (n.zahlungen || []).reduce((s, z) => s + (Number(z.betrag_cent) || 0), 0);
  n.offen_cent = Math.max(n.zahlbar_cent - n.bezahlt_cent, 0);
  if (n.art === "Anzahlungsrechnung") n.ust_faelligkeit = "nicht faellig";
  umbenennen(client, "PH Rechnung", doc, nr);
  schreibe(client, "PH Rechnung", alt, n, "submit");
  // Zahlungsplan: Zeile auf „In Rechnung“
  if (n.auftrag) {
    const ab = tab(client, "PH Auftragsbestaetigung").get(n.auftrag);
    if (ab) {
      const z = (ab.zahlungsplan || []).find((x) => x.rechnung === nr);
      if (z) z.status = "In Rechnung";
      if (n.art === "Schlussrechnung") ab.status = "Abgerechnet";
      ab.workflow_state = `PH ${ab.status}`;
      if (["Teilrechnung", "Schlussrechnung", "Rechnung"].includes(n.art)) ab.abgerechnet_cent = (Number(ab.abgerechnet_cent) || 0) + n.zahlbar_cent;
      client.stempel(ab);
    }
  }
  journal(client, "Gestellt", "PH Rechnung", nr, n.brutto_cent, n.art);
  client.kommentar("PH Rechnung", nr, `Gestellt als ${nr}`, "Info");
  return { name: nr, nummer: nr };
}

function reZahlung(client, doc, { betrag_cent, kanal = "Ueberweisung", datum, hinweis = "" }) {
  if (Number(doc.docstatus) !== 1) throw new BackofficeError("invalid", "Zahlungen nur auf gestellte Rechnungen.");
  const b = Number(betrag_cent) || 0;
  if (b <= 0) throw new BackofficeError("invalid", "Betrag muss größer 0 sein.");
  const alt = klon(doc);
  const n = klon(doc);
  n.zahlungen = [...(n.zahlungen || []), { datum: datum || heute(client), kanal, betrag_cent: b, hinweis }];
  n.bezahlt_cent = (Number(n.bezahlt_cent) || 0) + b;
  n.offen_cent = Math.max((Number(n.zahlbar_cent) || 0) - n.bezahlt_cent, 0);
  if (n.offen_cent === 0) {
    n.status = "Bezahlt";
    n.bezahlt_am = datum || heute(client);
  } else if (n.status === "Gestellt") n.status = "Teilbezahlt";
  n.workflow_state = `PH ${n.status}`;
  if (n.art === "Anzahlungsrechnung" && n.offen_cent === 0) n.ust_faelligkeit = "faellig";
  schreibe(client, "PH Rechnung", alt, n, "read");
  if (n.auftrag) {
    const ab = tab(client, "PH Auftragsbestaetigung").get(n.auftrag);
    if (ab) {
      ab.bezahlt_cent = (Number(ab.bezahlt_cent) || 0) + b;
      ab.offen_cent = Math.max((Number(ab.auftragswert_cent) || 0) - ab.bezahlt_cent, 0);
      if (n.art === "Anzahlungsrechnung") ab.anzahlung_ist_cent = (Number(ab.anzahlung_ist_cent) || 0) + b;
      const z = (ab.zahlungsplan || []).find((x) => x.rechnung === n.name);
      if (z) {
        z.bezahlt_cent = (Number(z.bezahlt_cent) || 0) + b;
        if (z.bezahlt_cent >= z.betrag_cent) z.status = "Bezahlt";
      }
      client.stempel(ab);
    }
  }
  journal(client, "Zahlung", "PH Rechnung", n.name, b, kanal);
  return { name: n.name, offen_cent: n.offen_cent, status: n.status, vollstaendig: n.offen_cent === 0, anzahlung: n.art === "Anzahlungsrechnung" };
}

function reMahnen(client, doc, { stufe }) {
  const s = Number(stufe) || (Number(doc.mahnstufe) || 0) + 1;
  const name = nummer(client, "MA");
  const m = neu(client, "PH Mahnung", { name, naming_series: "MA-.YYYY.-.#####", titel: `Mahnung Stufe ${s} · ${doc.name}`, status: "Entwurf", rechnung: doc.name, kontakt: doc.kontakt, kunde_name: doc.kunde_name, stufe: s, datum: heute(client), frist: plusTage(heute(client), 10), offen_cent: doc.offen_cent, mahngebuehr_cent: 0, verzugszinsen_cent: 0, gesamt_cent: doc.offen_cent, kanal: doc.email ? "E-Mail" : "Post", mahnlauf: `ML-${heute(client)}`, text: `Zu unserer Rechnung ${doc.name} ist ein Betrag offen.` });
  return { mahnung: m.name };
}

function maSenden(client, doc, args = {}) {
  const alt = klon(doc);
  const n = { ...klon(doc), status: "Gesendet", gesendet_am: heute(client), kanal: args.kanal || doc.kanal };
  schreibe(client, "PH Mahnung", alt, n);
  const re = tab(client, "PH Rechnung").get(doc.rechnung);
  if (re) {
    re.mahnstufe = Math.max(Number(re.mahnstufe) || 0, Number(doc.stufe) || 1);
    re.letzte_mahnung = heute(client);
    if (re.offen_cent > 0) re.status = "Gemahnt";
    re.workflow_state = `PH ${re.status}`;
    client.stempel(re);
  }
  journal(client, "Mahnung", "PH Mahnung", doc.name, doc.gesamt_cent, `Stufe ${doc.stufe}`);
  return { name: doc.name };
}

function belegSenden(client, dt, doc, args = {}) {
  const alt = klon(doc);
  const n = { ...klon(doc), gesendet_am: heute(client), versandkanal: args.kanal || "E-Mail" };
  if (dt === "PH Angebot" && doc.status === "Entwurf") {
    n.status = "Gesendet";
    n.workflow_state = "PH Gesendet";
  }
  if (args.belehrung) n.fagg_belehrung_beigelegt = 1;
  schreibe(client, dt, alt, n, "read");
  client.kommentar(dt, doc.name, args.kanal === "Post" ? `Per Post gesendet am ${heute(client)}` : `Gesendet an ${args.empfaenger || "Kunde"}`, "Info");
  return { name: doc.name, an: args.empfaenger || "" };
}

function reGutschrift(client, doc, { art = "Storno", grund = "", erstattung_art = "Rückzahlung" }) {
  if (Number(doc.docstatus) !== 1) throw new BackofficeError("invalid", "Gutschrift nur zu gestellten Rechnungen.");
  // B-05: abgezogene Anzahlungsrechnung → Sperre
  if (doc.art === "Anzahlungsrechnung") {
    const verrechnet = [...tab(client, "PH Rechnung").values()].find((r) => (r.anzahlungen_verrechnet || []).some((a) => a.anzahlungsrechnung === doc.name) && Number(r.docstatus) === 1);
    if (verrechnet) throw new BackofficeError("conflict", `Zuerst Schlussrechnung ${verrechnet.name} korrigieren`, { detail: { rechnung: verrechnet.name } });
  }
  const name = entwurfName(client, true);
  const positionen = art === "Storno" ? klon(doc.positionen || []) : [];
  const g = neu(client, "PH Gutschrift", summen({ name, naming_series: "GU-.YYYY.-.#####", titel: `Gutschrift ${doc.kunde_name}`, art, status: "Entwurf", rechnung: doc.name, kontakt: doc.kontakt, kunde_name: doc.kunde_name, datum: heute(client), grund, erstattung_art, auftrag: doc.auftrag || "", firma: doc.firma, strasse: doc.strasse, plz: doc.plz, ort: doc.ort, land: doc.land, uid_empfaenger: doc.uid_empfaenger, ust_fall: doc.ust_fall, waehrung: "EUR", sprache: "de", positionen, erstattet_cent: 0, export_status: "offen" }));
  return { gutschrift: g.name };
}

function guStellen(client, doc) {
  if (Number(doc.docstatus) !== 0) throw new BackofficeError("conflict", "Bereits gestellt.");
  const re = tab(client, "PH Rechnung").get(doc.rechnung);
  const bisher = [...tab(client, "PH Gutschrift").values()].filter((g) => g.rechnung === doc.rechnung && Number(g.docstatus) === 1).reduce((s, g) => s + (Number(g.brutto_cent) || 0), 0);
  if (re && (Number(doc.brutto_cent) || 0) + bisher > (Number(re.brutto_cent) || 0)) throw new BackofficeError("invalid", "Gutschrift übersteigt den Rechnungsbetrag.");
  const alt = klon(doc);
  const nr = nummer(client, "GU");
  const n = { ...klon(doc), name: nr, nummer: nr, docstatus: 1, status: "Gestellt", gestellt_am: heute(client), datum: heute(client) };
  tab(client, "PH Gutschrift").delete(doc.name);
  schreibe(client, "PH Gutschrift", alt, n, "submit");
  if (re) {
    if (doc.art === "Storno") {
      re.status = "Storniert";
      re.storno_durch = nr;
      re.storniert_am = heute(client);
      re.offen_cent = 0;
    } else if (/Verrechnung/.test(doc.erstattung_art || "")) {
      re.offen_cent = Math.max((Number(re.offen_cent) || 0) - (Number(doc.brutto_cent) || 0), 0);
      if (re.offen_cent === 0 && re.status !== "Storniert") re.status = "Bezahlt";
      n.status = "Verrechnet";
    }
    re.workflow_state = `PH ${re.status}`;
    client.stempel(re);
  }
  journal(client, "Gutschrift", "PH Gutschrift", nr, -(Number(n.brutto_cent) || 0), doc.art);
  return { name: nr, nummer: nr, rueckzahlung: /R(ü|ue)ckzahlung/.test(doc.erstattung_art || "") && re?.bezahlt_cent > 0 };
}

function guErstatten(client, doc, { betrag_cent, datum, kanal = "Ueberweisung" }) {
  const b = Number(betrag_cent) || 0;
  const rest = (Number(doc.brutto_cent) || 0) - (Number(doc.erstattet_cent) || 0);
  if (b <= 0 || b > rest) throw new BackofficeError("invalid", "Betrag passt nicht zur offenen Erstattung.");
  const alt = klon(doc);
  const n = { ...klon(doc), erstattet_cent: (Number(doc.erstattet_cent) || 0) + b };
  if (n.erstattet_cent >= n.brutto_cent) n.status = "Erstattet";
  schreibe(client, "PH Gutschrift", alt, n, "read");
  journal(client, "Zahlung", "PH Gutschrift", doc.name, -b, `Erstattung ${kanal} ${datum || ""}`.trim());
  return { name: doc.name };
}

function reKorrigieren(client, doc, { grund = "" }) {
  const g = reGutschrift(client, doc, { art: "Storno", grund: `Korrektur: ${grund}`, erstattung_art: "Verrechnung mit offener Rechnung" });
  const name = entwurfName(client);
  const kopie = klon(doc);
  for (const f of ["nummer", "gestellt_am", "gesendet_am", "versandkanal", "pdf", "pdf_fixiert_am", "zahlungen", "mahnstufe", "letzte_mahnung", "export_status", "export_lauf", "storno_durch", "storniert_am", "zahlungsreferenz", "bezahlt_am"]) delete kopie[f];
  const r = neu(client, "PH Rechnung", summen({ ...kopie, name, docstatus: 0, status: "Entwurf", workflow_state: "PH Entwurf", korrektur_von: doc.name, korrektur_gutschrift: g.gutschrift, korrektur_grund: grund, datum: heute(client), bezahlt_cent: 0, offen_cent: 0, export_status: "offen" }));
  return { rechnung: r.name, gutschrift: g.gutschrift };
}

function reAnzahlungenVerrechnen(client, doc) {
  if (Number(doc.docstatus) !== 0) throw new BackofficeError("invalid", "Nur im Entwurf möglich.");
  const ars = [...tab(client, "PH Rechnung").values()].filter((r) => r.auftrag === doc.auftrag && r.art === "Anzahlungsrechnung" && Number(r.docstatus) === 1 && r.status !== "Storniert");
  const v = vereinnahmteAnzahlungen(ars.map((r) => ({ name: r.name, brutto_cent: r.brutto_cent, bezahlt_cent: r.bezahlt_cent, ust_satz_promille: r.ust_aufteilung?.[0]?.ust_satz_promille ?? 200 })));
  const alt = klon(doc);
  const n = { ...klon(doc), anzahlungen_verrechnet: ars.map((r) => ({ anzahlungsrechnung: r.name, datum: r.datum, ust_satz_promille: 200, brutto_cent: Math.min(r.bezahlt_cent, r.brutto_cent), vereinnahmt: r.bezahlt_cent >= r.brutto_cent })), anzahlung_brutto_cent: v.abzug_brutto_cent, anzahlung_netto_cent: v.abzug_netto_cent, anzahlung_ust_cent: v.abzug_ust_cent };
  summen(n);
  schreibe(client, "PH Rechnung", alt, n);
  return { abzug_cent: v.abzug_brutto_cent, blockiert: v.blockiert };
}

// ---------------------------------------------------------------- Angebot --

function anAnnehmen(client, doc, args = {}) {
  if (!["Entwurf", "Gesendet"].includes(doc.status)) throw new BackofficeError("conflict", "Angebot kann nicht mehr angenommen werden.");
  const alt = klon(doc);
  const n = { ...klon(doc), status: "Angenommen", workflow_state: "PH Angenommen", angenommen_am: args.datum || heute(client) };
  schreibe(client, "PH Angebot", alt, n);
  client.kommentar("PH Angebot", doc.name, `Annahme über ${args.annahme_art || "–"} am ${args.datum || heute(client)}${args.unterschrift ? " · Unterschrift liegt vor" : ""}`, "Info");
  return { name: doc.name };
}

function anAblehnen(client, doc, { grund }) {
  const alt = klon(doc);
  schreibe(client, "PH Angebot", alt, { ...klon(doc), status: "Abgelehnt", workflow_state: "PH Abgelehnt", abgelehnt_grund: grund || "Sonstiges" });
  return { name: doc.name };
}

function anNeueVersion(client, doc) {
  const name = nummer(client, "AN");
  const kopie = klon(doc);
  for (const f of ["gesendet_am", "versandkanal", "angenommen_am", "abgelehnt_grund", "auftragsbestaetigung", "nachfolger", "unterschrift_kunde"]) delete kopie[f];
  const n = neu(client, "PH Angebot", { ...kopie, name, status: "Entwurf", workflow_state: "PH Entwurf", version: (Number(doc.version) || 1) + 1, vorgaenger: doc.name, datum: heute(client), gueltig_bis: plusTage(heute(client), 30) });
  const alt = klon(doc);
  schreibe(client, "PH Angebot", alt, { ...klon(doc), status: "Ersetzt", workflow_state: "PH Ersetzt", nachfolger: name });
  return { name: n.name };
}

function anAuftrag(client, doc, args = {}) {
  if (doc.auftragsbestaetigung) throw new BackofficeError("conflict", `Bereits übernommen als ${doc.auftragsbestaetigung}`);
  const name = nummer(client, "AB");
  const positionen = klon(doc.positionen || []).map((p) => (p.alternativ && (args.alternativen || []).includes(p.pos) ? { ...p, alternativ: 0 } : p)).filter((p) => !p.alternativ);
  const ab = summen({ name, naming_series: "AB-.YYYY.-.#####", titel: doc.titel, status: "Offen", workflow_state: "PH Offen", kontakt: doc.kontakt, kunde_name: doc.kunde_name, projekt: doc.projekt, angebot: doc.name, datum: heute(client), vertragsort: doc.vertragsort, firma: doc.firma, strasse: doc.strasse, plz: doc.plz, ort: doc.ort, land: doc.land, uid_empfaenger: doc.uid_empfaenger, zahlungsbedingung: doc.zahlungsbedingung, ust_fall: doc.ust_fall, ust_hinweistext: doc.ust_hinweistext, waehrung: "EUR", sprache: "de", positionen, liefertermin_geplant: args.liefertermin || "", montage: args.montage ? 1 : 0, lieferadresse: args.lieferadresse || "" });
  ab.auftragswert_cent = ab.brutto_cent;
  ab.zahlungsplan = (args.zahlungsplan || []).map((z) => ({ ...z, status: "Offen", bezahlt_cent: 0 }));
  ab.anzahlung_soll_cent = ab.zahlungsplan.filter((z) => z.art === "Anzahlung").reduce((s, z) => s + (Number(z.betrag_cent) || 0), 0);
  Object.assign(ab, { anzahlung_ist_cent: 0, geliefert_cent: 0, abgerechnet_cent: 0, bezahlt_cent: 0, offen_cent: ab.brutto_cent });
  neu(client, "PH Auftragsbestaetigung", ab);
  const alt = klon(doc);
  schreibe(client, "PH Angebot", alt, { ...klon(doc), status: "Angenommen", workflow_state: "PH Angenommen", auftragsbestaetigung: name, angenommen_am: doc.angenommen_am || heute(client) });
  let anzahlung = null;
  const zeile = ab.zahlungsplan.findIndex((z) => z.art === "Anzahlung");
  if (zeile >= 0) anzahlung = abAnzahlungsrechnung(client, tab(client, "PH Auftragsbestaetigung").get(name), { zeile: zeile + 1 }).rechnung;
  return { auftrag: name, anzahlungsrechnung: anzahlung };
}

// ---------------------------------------------------------------- Auftrag --

function abAnzahlungsrechnung(client, ab, { zeile }) {
  const idx = Math.max(0, (Number(zeile) || 1) - 1);
  const z = (ab.zahlungsplan || [])[idx];
  if (!z) throw new BackofficeError("invalid", "Zahlungsplan-Zeile nicht gefunden.");
  if (z.rechnung) throw new BackofficeError("conflict", `Für diese Zeile gibt es bereits ${z.rechnung}`);
  const name = entwurfName(client);
  const netto = Math.round((Number(z.betrag_cent) || 0) / 1.2);
  const r = neu(client, "PH Rechnung", summen({ name, naming_series: "RE-.YYYY.-.#####", titel: `Anzahlungsrechnung ${ab.kunde_name}`, art: "Anzahlungsrechnung", status: "Entwurf", workflow_state: "PH Entwurf", kontakt: ab.kontakt, kunde_name: ab.kunde_name, auftrag: ab.name, projekt: ab.projekt, anzahlung_prozent: z.prozent, anzahlungsplan_zeile: String(idx + 1), datum: heute(client), zahlungsziel_tage: 14, firma: ab.firma, strasse: ab.strasse, plz: ab.plz, ort: ab.ort, land: ab.land, uid_empfaenger: ab.uid_empfaenger, uid_geprueft_am: ab.uid_geprueft_am, ust_fall: ab.ust_fall || "Steuerpflichtig AT", waehrung: "EUR", sprache: "de", positionen: [{ pos: 1, art: "Leistung", bezeichnung: `Anzahlung ${z.prozent} % zu ${ab.name} (${ab.titel})`, menge: 1, einheit: "Pausch", einzel_netto_cent: netto, ust_satz_promille: 200 }], email: "", mahnstufe: 0, export_status: "offen", bezahlt_cent: 0, offen_cent: 0 }));
  // Brutto exakt auf den Zahlungsplan-Betrag ziehen (Rundung über Netto)
  r.positionen[0].netto_cent = netto;
  const ziel = Number(z.betrag_cent) || 0;
  Object.assign(r, { netto_cent: netto, ust_cent: ziel - netto, brutto_cent: ziel, zahlbar_cent: ziel, ust_aufteilung: [{ bezeichnung: "USt 20 %", ust_satz_promille: 200, netto_cent: netto, ust_cent: ziel - netto, brutto_cent: ziel }] });
  z.rechnung = name;
  client.stempel(ab);
  return { rechnung: name };
}

function abRechnung(client, ab, { art, mengen = {} }) {
  const schluss = art === "Schlussrechnung";
  const positionen = [];
  for (const p of ab.positionen || []) {
    if (p.alternativ || p.art === "Text") continue;
    const geliefert = Number(p.lieferschein_menge ?? (ab.status === "Geliefert" ? p.menge : 0)) || 0;
    const abgerechnet = Number(p.rechnung_menge) || 0;
    const m = schluss ? Number(p.menge) - abgerechnet : Math.min(Number(mengen[p.pos] ?? geliefert - abgerechnet), geliefert - abgerechnet);
    if (m > 0) positionen.push({ ...klon(p), menge: m, ab_position: String(p.pos) });
  }
  if (!positionen.length) throw new BackofficeError("invalid", "Keine Positionen zum Abrechnen.");
  const name = entwurfName(client);
  const r = neu(client, "PH Rechnung", summen({ name, naming_series: "RE-.YYYY.-.#####", titel: `${art} ${ab.kunde_name}`, art, status: "Entwurf", workflow_state: "PH Entwurf", kontakt: ab.kontakt, kunde_name: ab.kunde_name, auftrag: ab.name, projekt: ab.projekt, datum: heute(client), zahlungsziel_tage: 14, firma: ab.firma, strasse: ab.strasse, plz: ab.plz, ort: ab.ort, land: ab.land, uid_empfaenger: ab.uid_empfaenger, uid_geprueft_am: ab.uid_geprueft_am, ust_fall: ab.ust_fall || "Steuerpflichtig AT", ust_hinweistext: ab.ust_hinweistext, waehrung: "EUR", sprache: "de", positionen: positionen.map((p, i) => ({ ...p, pos: i + 1 })), leistungsdatum: ab.liefertermin_bestaetigt || "", leistung_quelle: ab.liefertermin_bestaetigt ? "Lieferschein (Zustellung)" : "", mahnstufe: 0, export_status: "offen", bezahlt_cent: 0, offen_cent: 0 }));
  if (schluss) reAnzahlungenVerrechnen(client, tab(client, "PH Rechnung").get(name));
  for (const p of ab.positionen || []) {
    const e = positionen.find((x) => x.ab_position === String(p.pos));
    if (e) p.rechnung_menge = (Number(p.rechnung_menge) || 0) + e.menge;
  }
  client.stempel(ab);
  return { rechnung: name };
}

function abStatus(client, ab, status, extra = {}) {
  const alt = klon(ab);
  return schreibe(client, "PH Auftragsbestaetigung", alt, { ...klon(ab), status, workflow_state: `PH ${status}`, ...extra });
}

// ------------------------------------------------------------------- Bank --

function buZuordnen(client, bu, { beleg_doctype, beleg, betrag_cent }) {
  const rest = Math.abs(Number(bu.betrag_cent) || 0) - (Number(bu.zugeordnet_cent) || 0);
  const b = Math.abs(Number(betrag_cent) || rest);
  if (bu.status === "Zugeordnet" || rest <= 0) throw new BackofficeError("conflict", "Bereits zugeordnet", { detail: { von: bu.modified_by, zeit: bu.modified } });
  if (b > rest) throw new BackofficeError("invalid", "Betrag übersteigt den Umsatz.");
  if (beleg_doctype === "PH Rechnung") {
    const re = lade(client, "PH Rechnung", beleg);
    if (b > (Number(re.offen_cent) || 0)) throw new BackofficeError("invalid", `Höchstens ${(re.offen_cent / 100).toFixed(2).replace(".", ",")} €`);
    reZahlung(client, re, { betrag_cent: b, kanal: "Ueberweisung", datum: bu.valuta || bu.buchungsdatum, hinweis: `Bank ${bu.name}` });
  } else if (beleg_doctype === "PH Eingangsrechnung") {
    const er = lade(client, "PH Eingangsrechnung", beleg);
    erBezahlt(client, er, { datum: bu.valuta, betrag_cent: b, bankumsatz: bu.name });
  }
  const alt = klon(bu);
  const n = { ...klon(bu), zuordnungen: [...(bu.zuordnungen || []), { beleg_doctype, beleg, betrag_cent: b }], zugeordnet_cent: (Number(bu.zugeordnet_cent) || 0) + b };
  n.status = n.zugeordnet_cent >= Math.abs(Number(bu.betrag_cent) || 0) ? "Zugeordnet" : "Teilweise";
  schreibe(client, "PH Bankumsatz", alt, n, "read");
  return { name: bu.name, status: n.status, beleg };
}

// --------------------------------------------------------- Eingangsrechnung --

function erStatus(client, er, status, extra = {}) {
  const alt = klon(er);
  return schreibe(client, "PH Eingangsrechnung", alt, { ...klon(er), status, workflow_state: `PH ${status}`, ...extra });
}

function erBezahlt(client, er, { datum, betrag_cent, bankumsatz = "" }) {
  if (er.status !== "Freigegeben") throw new BackofficeError("invalid", "Nur freigegebene Eingangsrechnungen.");
  return erStatus(client, er, "Bezahlt", { bezahlt_am: datum || heute(client), bezahlt_cent: Number(betrag_cent) || er.zahlbetrag_cent, bankumsatz, zahllauf: 0 });
}

function erUmbuchen(client, er, { modus, zeilen = [], grund, projekt, kostenart }) {
  const r = KZ.berechne({ modus, netto_cent: er.netto_cent, zeilen, positionen: er.positionen || [], projekt: projekt || er.projekt, kostenart: kostenart || er.kostenart });
  if (r.fehler.length) throw new BackofficeError("invalid", r.fehler[0], { detail: r.fehler });
  const alt = klon(er);
  const n = { ...klon(er), zuordnung_modus: modus, zuordnung: r.zeilen, zuordnung_summe_cent: r.summe_cent, zuordnung_differenz_cent: r.differenz_cent, zuordnung_status: r.status, kostenart: r.zeilen[0]?.kostenart || kostenart || "", projekt: modus === "Ganz einem Projekt" ? r.zeilen[0]?.projekt : er.projekt };
  schreibe(client, "PH Eingangsrechnung", alt, n);
  if (grund) client.kommentar("PH Eingangsrechnung", er.name, `Kostenzuordnung umgebucht (${alt.zuordnung_modus || "–"} → ${modus}): ${KZ.unterschied(alt.zuordnung || [], r.zeilen)}. Grund: ${grund}`, "Info");
  return { status: r.status };
}

// ------------------------------------------------------------- Export/UVA --

function exErzeugen(client, ex) {
  const belege = [];
  for (const dt of ["PH Rechnung", "PH Gutschrift"]) {
    for (const b of tab(client, dt).values()) {
      if (Number(b.docstatus) !== 1 || b.export_status === "exportiert") continue;
      if (b.datum < ex.zeitraum_von || b.datum > ex.zeitraum_bis) continue;
      belege.push({ beleg_doctype: dt, beleg: b.name, nummer: b.name, datum: b.datum, kontakt_name: b.kunde_name, konto: "4000", gegenkonto: "20000", steuercode: "20", netto_cent: b.netto_cent, ust_cent: b.ust_cent, brutto_cent: b.brutto_cent, status: "uebergeben", pruefsumme: Math.abs(b.brutto_cent * 7919).toString(16).slice(0, 8) });
      b.export_status = "exportiert";
      b.export_lauf = ex.name;
    }
  }
  const alt = klon(ex);
  return schreibe(client, "PH Export Lauf", alt, { ...klon(ex), status: "Erzeugt", belege, anzahl: belege.length, summe_brutto_cent: belege.reduce((s, b) => s + (b.brutto_cent || 0), 0), erzeugt_am: heute(client), erstellt_von: client.session.user, pruefsumme_gesamt: (belege.length * 2654435761 >>> 0).toString(16).padStart(8, "0"), datei: `/private/files/${ex.name}.csv` });
}

function exVerwerfen(client, ex) {
  for (const b of ex.belege || []) {
    const doc = tab(client, b.beleg_doctype).get(b.beleg);
    if (doc && doc.export_lauf === ex.name) {
      doc.export_status = "offen";
      doc.export_lauf = "";
    }
  }
  const alt = klon(ex);
  return schreibe(client, "PH Export Lauf", alt, { ...klon(ex), status: "Entwurf", belege: [], anzahl: 0, summe_brutto_cent: 0 });
}

// ----------------------------------------------------------------- Verteiler --

/**
 * Führt eine Dokumentmethode im Mock aus.
 * @returns {Promise<any>}
 */
export async function mockMethode(client, doctype, name, methode, args = {}) {
  const doc = lade(client, doctype, name);
  const k = `${doctype}::${methode}`;
  switch (k) {
    case "PH Rechnung::stellen":
    case "PH Rechnung::stellen_mit_datum":
      return reStellen(client, doc, args);
    case "PH Rechnung::zahlung_erfassen":
      return reZahlung(client, doc, args);
    case "PH Rechnung::mahnen":
      return reMahnen(client, doc, args);
    case "PH Rechnung::senden":
    case "PH Rechnung::als_gesendet_markieren":
      return belegSenden(client, doctype, doc, args);
    case "PH Rechnung::gutschrift_erstellen":
      return reGutschrift(client, doc, args);
    case "PH Rechnung::korrigieren":
      return reKorrigieren(client, doc, args);
    case "PH Rechnung::anzahlungen_verrechnen":
      return reAnzahlungenVerrechnen(client, doc, args);
    case "PH Rechnung::uneinbringlich": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Uneinbringlich", workflow_state: "PH Uneinbringlich", uneinbringlich_grund: args.grund, offen_cent: 0 });
    }
    case "PH Gutschrift::stellen":
      return guStellen(client, doc, args);
    case "PH Gutschrift::erstatten":
      return guErstatten(client, doc, args);
    case "PH Gutschrift::senden":
      return belegSenden(client, doctype, doc, args);
    case "PH Mahnung::senden":
      return maSenden(client, doc, args);
    case "PH Mahnung::erledigen": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Erledigt", erledigt_am: heute(client) });
    }
    case "PH Mahnung::stornieren": {
      if (doc.status !== "Entwurf") throw new BackofficeError("invalid", "Nur Entwürfe lassen sich stornieren.");
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Storniert" });
    }
    case "PH Angebot::senden":
      return belegSenden(client, doctype, doc, args);
    case "PH Angebot::annehmen":
      return anAnnehmen(client, doc, args);
    case "PH Angebot::ablehnen":
      return anAblehnen(client, doc, args);
    case "PH Angebot::neue_version":
      return anNeueVersion(client, doc, args);
    case "PH Angebot::auftrag_erstellen":
      return anAuftrag(client, doc, args);
    case "PH Auftragsbestaetigung::anzahlungsrechnung_erstellen":
      return abAnzahlungsrechnung(client, doc, args);
    case "PH Auftragsbestaetigung::rechnung_erstellen":
      return abRechnung(client, doc, args);
    case "PH Auftragsbestaetigung::herstellerbestellungen_erzeugen":
      return abStatus(client, doc, "In Bestellung");
    case "PH Auftragsbestaetigung::lieferung_melden": {
      const voll = !!args.vollstaendig;
      for (const p of doc.positionen || []) p.lieferschein_menge = voll ? p.menge : Math.min(Number(p.menge), Number(args.mengen?.[p.pos] ?? p.lieferschein_menge ?? 0));
      const geliefert = (doc.positionen || []).reduce((s, p) => s + Math.round(((Number(p.lieferschein_menge) || 0) / (Number(p.menge) || 1)) * (Number(p.brutto_cent) || 0)), 0);
      return abStatus(client, doc, voll ? "Geliefert" : "Teilgeliefert", { geliefert_cent: geliefert, liefertermin_bestaetigt: doc.liefertermin_bestaetigt || heute(client) });
    }
    case "PH Auftragsbestaetigung::stornieren":
      return abStatus(client, doc, "Storniert", { storno_grund: args.grund, storniert_am: heute(client), storniert_von: client.session.user });
    case "PH Auftragsbestaetigung::senden":
      return belegSenden(client, doctype, doc, args);
    case "PH Bankumsatz::zuordnen":
      return buZuordnen(client, doc, args);
    case "PH Bankumsatz::ignorieren": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Ignoriert", ignoriert_grund: args.grund || "" }, "read");
    }
    case "PH Bankumsatz::wieder_oeffnen": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: (Number(doc.zugeordnet_cent) || 0) > 0 ? "Teilweise" : "Offen", ignoriert_grund: "" }, "read");
    }
    case "PH Bankimport::importieren":
      return { anzahl: 0, neu: 0, doppelt: 0, vorschlag: 0, zugeordnet: 0 };
    case "PH Eingangsrechnung::pruefen":
      return erStatus(client, doc, "Sachlich geprueft", { geprueft_von: client.session.user, geprueft_am: client.zeitstempel().slice(0, 19), pruefvermerk: args.vermerk || "" });
    case "PH Eingangsrechnung::freigeben":
      if (!["Erfasst", "Sachlich geprueft"].includes(doc.status)) throw new BackofficeError("conflict", "Status erlaubt keine Freigabe.");
      if (doc.zuordnung_status === "Offen" && doc.belegart !== "Gutschrift") throw new BackofficeError("invalid", "Freigabe erst mit vollständiger Kostenzuordnung");
      return erStatus(client, doc, "Freigegeben", { freigegeben_von: client.session.user, freigegeben_am: client.zeitstempel().slice(0, 19), zahllauf: 1 });
    case "PH Eingangsrechnung::ablehnen":
      return erStatus(client, doc, "Abgelehnt", { ablehnungsgrund: args.grund || "" });
    case "PH Eingangsrechnung::zurueck_an_erfassung":
      return erStatus(client, doc, "Erfasst");
    case "PH Eingangsrechnung::als_bezahlt_buchen":
      return erBezahlt(client, doc, args);
    case "PH Eingangsrechnung::zuordnung_umbuchen":
      return erUmbuchen(client, doc, args);
    case "PH Export Lauf::erzeugen":
      return exErzeugen(client, doc);
    case "PH Export Lauf::als_uebergeben": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Uebergeben", uebergeben_am: heute(client), uebergeben_an: args.an || "Kanzlei" });
    }
    case "PH Export Lauf::bestaetigen": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Bestaetigt", bestaetigt_von_kanzlei_am: args.datum || heute(client) });
    }
    case "PH Export Lauf::verwerfen":
      return exVerwerfen(client, doc);
    case "PH UVA Auswertung::berechnen": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Berechnet", berechnet_am: heute(client) });
    }
    case "PH UVA Auswertung::als_uebergeben": {
      const alt = klon(doc);
      return schreibe(client, doctype, alt, { ...klon(doc), status: "Uebergeben", uebergeben_am: heute(client) });
    }
    default:
      return client.runDocMethod(doctype, name, methode, args);
  }
}

/** Neuer Beleg im Mock mit Nummernkreis-Entwurfsnamen (Rechnung/Gutschrift) bzw. Serie. */
export function mockNeu(client, doctype, werte) {
  const praefix = { "PH Angebot": "AN", "PH Eingangsrechnung": "ER", "PH Export Lauf": "EX", "PH UVA Auswertung": "UVA" }[doctype];
  const name = doctype === "PH Rechnung" ? entwurfName(client) : doctype === "PH Gutschrift" ? entwurfName(client, true) : nummer(client, praefix, doctype === "PH Export Lauf" ? 4 : doctype === "PH UVA Auswertung" ? 3 : 5);
  const mitPositionen = ["PH Angebot", "PH Rechnung", "PH Gutschrift"].includes(doctype);
  return klon(neu(client, doctype, mitPositionen ? summen({ ...werte, name }) : { ...werte, name }));
}
