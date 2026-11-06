// Zeilen der Faktura-Listen (10-konzept-faktura § 3): Reiter-Filter, Signal (höchstens eines), Zeilen-Primäraktion,
// Spalten. Rein und serialisierbar – die Server-Seite baut die Zeilen, die Client-Liste zeigt sie nur an.

import { cent, datum } from "../format.js";
import { tageZwischen, auftragStand, inAlter } from "./betraege.js";
import { statusAnzeige, RE_OFFEN, AB_LAUFEND, AN_OFFEN } from "./status.js";
import { ART_KURZ, SIGNAL, wertLabel, SPALTE, KOSTEN } from "./texte.js";
import { sicherheitWort, sicherheitMaterial, ankerAusZweck } from "./regeln.js";

const kurzNr = (n) => String(n || "").replace(/^([A-Z]+)-\d{4}-0*(\d+)$/, (m, p, z) => `${p}-…${z.padStart(2, "0")}`);
export { kurzNr };

function suchePasst(q, felder) {
  const s = String(q || "").trim().toLowerCase();
  if (!s) return true;
  const ziffern = s.replace(/[^\d,.]/g, "");
  const centSuche = /^\d+([.,]\d{1,2})?$/.test(s.replace(/\./g, "").replace(/\s|€/g, "")) ? Math.round(Number(s.replace(/\./g, "").replace(",", ".").replace(/\s|€/g, "")) * 100) : null;
  return felder.some((f) => {
    if (typeof f === "number") return centSuche !== null && (f === centSuche || Math.abs(f) === centSuche);
    return String(f || "").toLowerCase().includes(s) || (ziffern.length > 3 && String(f || "").replace(/\D/g, "").includes(ziffern.replace(/\D/g, "")));
  });
}
export { suchePasst };

function zeitraumPasst(d, von, bis) {
  const x = String(d || "").slice(0, 10);
  if (von && x < von) return false;
  if (bis && x > bis) return false;
  return true;
}

/** Gemeinsame Filter (Suche, Status, Zeitraum, Art) auf einer Liste. */
export function filtere(liste, params, { suchFelder, datumFeld = "datum", artFeld = "art" }) {
  const status = String(params.status || "").split(",").filter(Boolean);
  const art = String(params.art || "").split(",").filter(Boolean);
  return liste.filter((x) => {
    if (status.length && !status.includes(x.status)) return false;
    if (art.length && !art.includes(x[artFeld])) return false;
    if (!zeitraumPasst(x[datumFeld], params.von, params.bis)) return false;
    return suchePasst(params.q, suchFelder(x));
  });
}

export function sortiere(liste, feld, richtung = "asc") {
  const f = richtung === "desc" ? -1 : 1;
  return [...liste].sort((a, b) => {
    const x = a[feld] ?? "";
    const y = b[feld] ?? "";
    if (typeof x === "number" && typeof y === "number") return (x - y) * f;
    return String(x).localeCompare(String(y), "de") * f;
  });
}

export function blaettern(liste, seite = 1, groesse = 25) {
  const s = Math.max(1, Number(seite) || 1);
  return { zeilen: liste.slice((s - 1) * groesse, s * groesse), seite: s, seiten: Math.max(1, Math.ceil(liste.length / groesse)), gesamt: liste.length };
}

// ------------------------------------------------------------------- Rechnung --

export function rechnungSignal(r, heute) {
  if (Number(r.docstatus) !== 1 || !(Number(r.offen_cent) > 0) || ["Storniert", "Uneinbringlich", "Bezahlt"].includes(r.status)) return null;
  const t = tageZwischen(r.faellig, heute);
  if (t > 0) return { art: "ueberfaellig", icon: "TriangleAlert", text: SIGNAL.ueberfaellig(t), kurz: SIGNAL.ueberfaelligKurz(t), tage: t };
  if (t >= -7) return { art: "bald", icon: "Clock", text: SIGNAL.bald(-t), tage: t };
  if (Number(r.mahnstufe) >= 2) return { art: "stufe", icon: "Layers", text: SIGNAL.mahnstufe(r.mahnstufe) };
  return null;
}

export function rechnungAktion(r, rolle) {
  if (!rolle?.schreibt) return null;
  if (Number(r.docstatus) === 0) return { id: "stellen", titel: "Stellen" };
  if (["Storniert", "Uneinbringlich", "Bezahlt"].includes(r.status) || !(Number(r.offen_cent) > 0)) return null;
  if (r.status === "Ueberfaellig" || r.status === "Gemahnt") {
    if (r.mahnsperre || Number(r.mahnstufe) >= 3) return { id: "zahlung", titel: "Zahlung erfassen" };
    return { id: "mahnen", titel: `Mahnen (Stufe ${Math.min((Number(r.mahnstufe) || 0) + 1, 3)})` };
  }
  return { id: "zahlung", titel: "Zahlung erfassen" };
}

export const RECHNUNG_REITER = {
  offen: (r) => Number(r.docstatus) === 1 && RE_OFFEN.includes(r.status),
  entwuerfe: (r) => Number(r.docstatus) === 0,
  ueberfaellig: (r, heute) => Number(r.docstatus) === 1 && Number(r.offen_cent) > 0 && tageZwischen(r.faellig, heute) > 0 && !["Storniert", "Uneinbringlich"].includes(r.status),
  "offene-posten": (r) => Number(r.docstatus) === 1 && Number(r.offen_cent) > 0 && !["Storniert", "Uneinbringlich"].includes(r.status),
  anzahlung: (r) => r.art === "Anzahlungsrechnung",
  bezahlt: (r) => r.status === "Bezahlt",
  alle: () => true,
};

/** Daten, die Stellen-, Zahlungs-, Senden- und Mahnen-Dialog brauchen (serialisierbar, ohne interne Felder). */
export function stellDaten(r, email = r.email || "") {
  return {
    doctype: r.doctype || "PH Rechnung",
    offen_cent: Number(r.offen_cent) || 0,
    brutto_cent: Number(r.brutto_cent) || 0,
    zahlbar_cent: Number(r.zahlbar_cent ?? r.brutto_cent) || 0,
    email,
    kunde: r.kunde_name || "",
    kontakt: r.kontakt || "",
    adresse: [r.kunde_name, r.strasse, [r.plz, r.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    mahnstufe: Number(r.mahnstufe) || 0,
    mahnsperre: !!r.mahnsperre,
    mahnsperre_grund: r.mahnsperre_grund || "",
    gesendet: !!(r.gesendet_am || r.versandkanal),
    art: r.art || "",
    auftrag: r.auftrag || "",
    anzahlung_prozent: Number(r.anzahlung_prozent) || 0,
    datum: r.datum || "",
    faellig: r.faellig || "",
    zahlungsziel_tage: Number(r.zahlungsziel_tage) || 14,
    leistungsdatum: r.leistungsdatum || "",
    leistung_quelle: r.leistung_quelle || "",
    ust_fall: r.ust_fall || "",
    land: r.land || "",
    montage_im_ausland: !!r.montage_im_ausland,
    docstatus: Number(r.docstatus) || 0,
    status: r.status || "",
    korrektur_von: r.korrektur_von || "",
    bezahlt_cent: Number(r.bezahlt_cent) || 0,
    export_status: r.export_status || "",
    ort: [r.plz, r.ort].filter(Boolean).join(" "),
  };
}

export function rechnungZeile(r, { heute, rolle, kontakte = {} }) {
  const st = statusAnzeige("PH Rechnung", r.status, { mahnstufe: r.mahnstufe });
  const entwurf = Number(r.docstatus) === 0;
  const email = r.email ?? kontakte[r.kontakt]?.email ?? "";
  return {
    name: r.name,
    doctype: "PH Rechnung",
    href: `/faktura/rechnungen/${encodeURIComponent(r.name)}`,
    nummer: entwurf ? "Entwurf" : r.name,
    entwurf,
    titel: r.kunde_name || r.titel || r.name,
    unter: [r.auftrag ? kurzNr(r.auftrag) : null, r.ort || null].filter(Boolean).join(" · "),
    status: { ...st, gebucht: Number(r.docstatus) === 1, storniert: r.status === "Storniert" },
    signal: rechnungSignal(r, heute),
    zellen: {
      art: ART_KURZ[r.art] || r.art,
      faellig: r.faellig ? datum(r.faellig) : "–",
      offen: Number(r.offen_cent) > 0 ? cent(r.offen_cent) : "–",
      brutto: cent(r.brutto_cent),
      datum: datum(r.datum),
      zahlbar: cent(r.zahlbar_cent ?? r.brutto_cent),
      steuerfall: wertLabel(r.ust_fall),
      exportiert: r.export_status === "exportiert" ? "exportiert" : "",
      gesendet: r.gesendet_am ? datum(r.gesendet_am) : "nicht versandt",
      tage: Math.max(0, tageZwischen(r.faellig, heute)),
      mahnstufe: Number(r.mahnstufe) ? `Stufe ${r.mahnstufe}` : "–",
      letzteMahnung: r.letzte_mahnung ? datum(r.letzte_mahnung) : "–",
      auftrag: r.auftrag || "–",
    },
    betrag_cent: Number(r.offen_cent) || 0,
    aktion: rechnungAktion(r, rolle),
    daten: stellDaten(r, email),
  };
}

export const RECHNUNG_SPALTEN = [
  { key: "kunde", titel: SPALTE.kundeAuftrag, typ: "objekt" },
  { key: "art", titel: SPALTE.art, typ: "wort" },
  { key: "faellig", titel: SPALTE.faellig, typ: "signal" },
  { key: "offen", titel: SPALTE.offen, typ: "betrag" },
  { key: "status", titel: SPALTE.status, typ: "status" },
];
export const OP_SPALTEN = [
  { key: "kunde", titel: SPALTE.kunde, typ: "objekt" },
  { key: "faellig", titel: SPALTE.faellig, typ: "wort" },
  { key: "tage", titel: SPALTE.tage, typ: "zahl" },
  { key: "offen", titel: SPALTE.offen, typ: "betrag" },
  { key: "mahnstufe", titel: SPALTE.mahnstufe, typ: "wort" },
  { key: "letzteMahnung", titel: SPALTE.letzteMahnung, typ: "wort" },
];

export function opFilter(r, alter, heute) {
  return !alter || inAlter(r, alter, heute);
}

// -------------------------------------------------------------------- Angebot --

export const ANGEBOT_REITER = {
  offen: (a) => AN_OFFEN.includes(a.status),
  meine: (a, heute, user) => a.zugewiesen_an === user && AN_OFFEN.includes(a.status),
  bald: (a, heute) => a.status === "Gesendet" && a.gueltig_bis && tageZwischen(heute, a.gueltig_bis) >= 0 && tageZwischen(heute, a.gueltig_bis) <= 7,
  gewonnen: (a) => a.status === "Angenommen",
  alle: () => true,
};

export function angebotZeile(a, { heute, rolle }) {
  const st = statusAnzeige("PH Angebot", a.status);
  const t = a.gueltig_bis ? tageZwischen(heute, a.gueltig_bis) : null;
  const ruht = a.status === "Gesendet" && a.gesendet_am && tageZwischen(a.gesendet_am, heute) > 10;
  let signal = null;
  if (a.status === "Gesendet" && t !== null && t >= 0 && t <= 7) signal = { art: "bald", icon: "Clock", text: SIGNAL.bald(t) };
  else if (ruht) signal = { art: "ruht", icon: "Hourglass", text: SIGNAL.ruht(tageZwischen(a.gesendet_am, heute)) };
  let aktion = null;
  if (rolle?.schreibt) {
    if (a.status === "Entwurf") aktion = { id: "senden", titel: "Senden" };
    else if (a.status === "Gesendet") aktion = { id: "uebernehmen", titel: "Als Auftrag übernehmen" };
  }
  return {
    name: a.name,
    doctype: "PH Angebot",
    href: `/faktura/angebote/${encodeURIComponent(a.name)}`,
    nummer: a.status === "Entwurf" ? "Entwurf" : a.name,
    entwurf: a.status === "Entwurf",
    titel: a.titel || a.name,
    unter: [a.kunde_name, a.ort].filter(Boolean).join(" · "),
    status: { ...st, text: a.status === "Ersetzt" && a.nachfolger ? `Ersetzt · ${kurzNr(a.nachfolger)}` : st.text, gebucht: false, storniert: a.status === "Ersetzt" },
    signal,
    person: a.zugewiesen_an || "",
    zellen: { projekt: a.projekt || "–", gueltig: a.gueltig_bis ? datum(a.gueltig_bis) : "–", brutto: cent(a.brutto_cent), version: `v${a.version || 1}`, vertragsort: a.vertragsort || "–" },
    betrag_cent: Number(a.brutto_cent) || 0,
    aktion,
    daten: { kunde: a.kunde_name, status: a.status, brutto_cent: Number(a.brutto_cent) || 0, vertragsort: a.vertragsort, email: a.email || "", gueltig_bis: a.gueltig_bis || "" },
  };
}

export const ANGEBOT_SPALTEN = [
  { key: "titel", titel: SPALTE.titelKunde, typ: "objekt" },
  { key: "projekt", titel: SPALTE.projekt, typ: "wort" },
  { key: "gueltig", titel: SPALTE.gueltigBis, typ: "signal" },
  { key: "person", titel: SPALTE.berater, typ: "person" },
  { key: "brutto", titel: SPALTE.brutto, typ: "betrag" },
  { key: "status", titel: SPALTE.status, typ: "status" },
];

// --------------------------------------------------------------------- Auftrag --

export function anzahlungOhneRechnung(ab) {
  return (ab.zahlungsplan || []).some((z) => z.art === "Anzahlung" && !z.rechnung && z.status === "Offen");
}

export const AUFTRAG_REITER = {
  laufend: (a) => AB_LAUFEND.includes(a.status),
  anzahlung: (a) => (Number(a.anzahlung_ist_cent) || 0) < (Number(a.anzahlung_soll_cent) || 0) && ["Offen", "In Bestellung"].includes(a.status),
  lieferbereit: (a) => a.status === "In Bestellung",
  "nicht-abgerechnet": (a) => a.status === "Geliefert" && (Number(a.abgerechnet_cent) || 0) < (Number(a.auftragswert_cent) || 0),
  alle: () => true,
};

export function auftragAktion(a, rolle) {
  if (!rolle?.schreibt) return null;
  const s = auftragStand(a);
  if (a.status === "Storniert" || a.status === "Abgerechnet") return null;
  if (["Offen", "In Bestellung"].includes(a.status) && !s.anzahlungErfuellt && anzahlungOhneRechnung(a)) return { id: "anzahlung", titel: "Anzahlung anfordern" };
  if (a.status === "Offen") return { id: "herstellerbestellungen", titel: "Herstellerbestellungen erzeugen" };
  if (a.status === "In Bestellung") return { id: "lieferung", titel: "Lieferung melden" };
  if (a.status === "Teilgeliefert") return { id: "teilrechnung", titel: "Teilrechnung", href: `/faktura/auftraege/${encodeURIComponent(a.name)}/abrechnen?art=teil` };
  if (a.status === "Geliefert") return { id: "schlussrechnung", titel: "Schlussrechnung", href: `/faktura/auftraege/${encodeURIComponent(a.name)}/abrechnen?art=schluss` };
  return null;
}

export function auftragZeile(a, { heute, rolle }) {
  const st = statusAnzeige("PH Auftragsbestaetigung", a.status);
  const s = auftragStand(a);
  const lt = a.liefertermin_bestaetigt || a.liefertermin_geplant;
  let signal = null;
  if (a.liefertermin_bestaetigt && a.liefertermin_bestaetigt < heute && !["Geliefert", "Abgerechnet", "Storniert"].includes(a.status)) signal = { art: "ueberfaellig", icon: "TriangleAlert", text: SIGNAL.ueberfaellig(tageZwischen(a.liefertermin_bestaetigt, heute)) };
  const stand = (Number(a.abgerechnet_cent) || 0) >= (Number(a.auftragswert_cent) || 1) ? "abgerechnet 100 %" : s.geliefert ? `geliefert ${s.geliefert} %` : "–";
  return {
    name: a.name,
    doctype: "PH Auftragsbestaetigung",
    href: `/faktura/auftraege/${encodeURIComponent(a.name)}`,
    nummer: a.name,
    titel: a.kunde_name || a.titel,
    unter: [a.name, a.titel].filter(Boolean).join(" · "),
    status: { ...st, gebucht: false, storniert: a.status === "Storniert" },
    signal,
    zellen: {
      liefertermin: lt ? `${a.liefer_kw || datum(lt)}${a.liefertermin_bestaetigt ? " ✓" : " (geplant)"}` : "–",
      anzahlung: (Number(a.anzahlung_soll_cent) || 0) > 0 ? `${cent(a.anzahlung_ist_cent || 0).replace(/,00\s€$/, "")} / ${cent(a.anzahlung_soll_cent).replace(/,00\s€$/, "")}${s.anzahlungErfuellt ? " ✓" : ""}` : "–",
      stand,
      offen: cent(a.offen_cent ?? a.auftragswert_cent),
      wert: cent(a.auftragswert_cent),
    },
    betrag_cent: Number(a.offen_cent) || 0,
    aktion: auftragAktion(a, rolle),
    daten: { kunde: a.kunde_name, status: a.status, anzahlung_offen_cent: Math.max((Number(a.anzahlung_soll_cent) || 0) - (Number(a.anzahlung_ist_cent) || 0), 0), zeilen: (a.zahlungsplan || []).map((z, i) => ({ zeile: i + 1, art: z.art, prozent: z.prozent, betrag_cent: z.betrag_cent, rechnung: z.rechnung || "", status: z.status })), kassaFehler: !!a.kassa_datenfehler },
  };
}

export const AUFTRAG_SPALTEN = [
  { key: "kunde", titel: SPALTE.kundeProjekt, typ: "objekt" },
  { key: "liefertermin", titel: SPALTE.liefertermin, typ: "signal" },
  { key: "anzahlung", titel: SPALTE.anzahlung, typ: "wort", rechts: true },
  { key: "stand", titel: SPALTE.stand, typ: "wort" },
  { key: "offen", titel: SPALTE.offen, typ: "betrag" },
  { key: "status", titel: SPALTE.status, typ: "status" },
];

// ------------------------------------------------------------------------ Bank --

export const BANK_REITER = {
  offen: (b) => b.status === "Offen",
  teilweise: (b) => b.status === "Teilweise",
  zugeordnet: (b) => b.status === "Zugeordnet",
  ignoriert: (b) => b.status === "Ignoriert",
  alle: () => true,
};

/** Vorschlag eines Bankumsatzes (Backend-Vorschlag, sonst AB-Anker aus dem Verwendungszweck, B-11/P-24). */
export function bankVorschlag(b) {
  if (b.vorschlag_beleg) {
    const auftrag = b.vorschlag_doctype === "PH Auftragsbestaetigung";
    return { doctype: b.vorschlag_doctype, beleg: b.vorschlag_beleg, grund: b.vorschlag_grund, zahl: Number(b.vorschlag_sicherheit) || 0, wort: sicherheitWort(b.vorschlag_sicherheit, { auftrag }), auftrag };
  }
  const ab = ankerAusZweck(b.verwendungszweck).find((t) => t.art === "auftrag");
  if (ab) return { doctype: ab.doctype, beleg: ab.nummer, grund: "Auftragsnummer im Verwendungszweck", zahl: 100, wort: "Auftrag", auftrag: true };
  return null;
}

export function bankZeile(b, { rolle, belege = {} }) {
  const v = bankVorschlag(b);
  const st = statusAnzeige("PH Bankumsatz", b.status);
  const ziel = v ? belege[v.beleg] : null;
  const rest = Math.abs(Number(b.betrag_cent) || 0) - (Number(b.zugeordnet_cent) || 0);
  let aktion = null;
  if (rolle?.leitung && ["Offen", "Teilweise"].includes(b.status)) {
    if (v && v.wort === "Sicher" && v.doctype === "PH Rechnung") aktion = { id: "zuordnen", titel: "Zuordnen" };
    else if (v) aktion = { id: "pruefen", titel: "Prüfen" };
    else aktion = { id: "ignorieren", titel: "Ignorieren" };
  } else if (rolle?.leitung && b.status === "Ignoriert") aktion = { id: "wieder", titel: "Wieder öffnen" };
  return {
    name: b.name,
    doctype: "PH Bankumsatz",
    href: null,
    nummer: datum(b.buchungsdatum),
    titel: b.auftraggeber || "–",
    unter: b.verwendungszweck || "",
    richtung: b.richtung,
    status: { ...st, gebucht: false },
    signal: null,
    zellen: {
      datum: datum(b.buchungsdatum),
      betrag: `${Number(b.betrag_cent) < 0 ? "−" : ""}${cent(Math.abs(Number(b.betrag_cent) || 0))}`,
      vorschlag: v ? `${v.beleg}${ziel?.kunde_name ? ` · ${ziel.kunde_name}` : v.auftrag ? " · Anzahlung" : ""}` : "kein Vorschlag",
      sicherheit: v?.wort || "–",
    },
    sicherheit: v ? { wort: v.wort, material: sicherheitMaterial(v.wort), grund: v.grund, zahl: v.zahl } : null,
    betrag_cent: Number(b.betrag_cent) || 0,
    aktion,
    daten: { rest_cent: rest, vorschlag: v, iban: b.iban_gegen, zweck: b.verwendungszweck, valuta: b.valuta, e2e: b.end_to_end_id, mandat: b.mandatsreferenz, auftraggeber: b.auftraggeber, beleg: ziel ? { name: ziel.name, kunde: ziel.kunde_name, offen_cent: ziel.offen_cent ?? ziel.zahlbetrag_cent, zahlbar_cent: ziel.zahlbar_cent ?? ziel.brutto_cent, faellig: ziel.faellig, mahnstufe: ziel.mahnstufe || 0 } : null, status: b.status, ignoriert_grund: b.ignoriert_grund || "" },
  };
}

export const BANK_SPALTEN = [
  { key: "umsatz", titel: SPALTE.umsatz, typ: "objekt" },
  { key: "betrag", titel: SPALTE.betrag, typ: "betrag" },
  { key: "vorschlag", titel: SPALTE.vorschlag, typ: "wort" },
  { key: "sicherheit", titel: SPALTE.sicherheit, typ: "sicherheit" },
];

// ---------------------------------------------------------- Eingangsrechnung --

export const ER_REITER = {
  pruefen: (e) => e.status === "Erfasst",
  freigabe: (e) => e.status === "Sachlich geprueft",
  zahlen: (e) => e.status === "Freigegeben",
  skonto: (e, heute) => e.skonto_bis && tageZwischen(heute, e.skonto_bis) >= 0 && tageZwischen(heute, e.skonto_bis) <= 5 && e.status !== "Bezahlt",
  kosten: (e) => e.zuordnung_status === "Offen" && !["Abgelehnt"].includes(e.status),
  bezahlt: (e) => e.status === "Bezahlt",
  alle: () => true,
};

export function erAktion(e, rolle) {
  if (!rolle?.schreibt) return null;
  if (e.status === "Erfasst") return { id: "er-pruefen", titel: "Sachlich prüfen" };
  if (e.status === "Sachlich geprueft" && rolle.leitung) return e.zuordnung_status === "Offen" ? { id: "er-kosten", titel: "Kosten zuordnen", href: `/faktura/eingangsrechnungen/${encodeURIComponent(e.name)}?tab=kosten` } : { id: "er-freigeben", titel: "Freigeben" };
  if (e.status === "Freigegeben" && rolle.leitung) return { id: "er-bezahlt", titel: "Als bezahlt buchen" };
  return null;
}

export function erZeile(e, { heute, rolle }) {
  const st = statusAnzeige("PH Eingangsrechnung", e.status);
  const t = e.skonto_bis ? tageZwischen(heute, e.skonto_bis) : null;
  const signal = e.skonto_bis && t >= 0 && t <= 5 && e.status !== "Bezahlt" ? { art: "bald", icon: "Clock", text: `Skonto ${SIGNAL.bald(t)}` } : e.faellig && tageZwischen(e.faellig, heute) > 0 && !["Bezahlt", "Abgelehnt"].includes(e.status) ? { art: "ueberfaellig", icon: "TriangleAlert", text: SIGNAL.ueberfaellig(tageZwischen(e.faellig, heute)) } : null;
  const chips = [e.herstellerbestellung && kurzNr(e.herstellerbestellung), e.projekt && kurzNr(e.projekt), e.auftrag && kurzNr(e.auftrag)].filter(Boolean);
  return {
    name: e.name,
    doctype: "PH Eingangsrechnung",
    href: `/faktura/eingangsrechnungen/${encodeURIComponent(e.name)}`,
    nummer: e.name,
    titel: e.lieferant_name || "–",
    unter: [e.name, e.rechnungsnummer_lieferant].filter(Boolean).join(" · "),
    status: { ...st, gebucht: false },
    signal,
    zellen: { faellig: e.faellig ? datum(e.faellig) : "–", skonto: e.skonto_bis ? datum(e.skonto_bis) : "–", zahlbetrag: cent(e.zahlbetrag_cent ?? e.brutto_cent), bezug: chips.join(" · ") || "–", kosten: KOSTEN.status[e.zuordnung_status] || "Offen" },
    kosten: { status: e.zuordnung_status || "Offen", modus: e.zuordnung_modus || "" },
    betrag_cent: Number(e.zahlbetrag_cent ?? e.brutto_cent) || 0,
    aktion: erAktion(e, rolle),
    daten: { status: e.status, lieferant: e.lieferant_name, zahlbetrag_cent: Number(e.zahlbetrag_cent ?? e.brutto_cent) || 0, kostenOffen: e.zuordnung_status === "Offen", exportiert: e.export_status === "exportiert", datei: e.datei || "", netto_cent: e.netto_cent, brutto_cent: e.brutto_cent, ust_cent: e.ust_cent, steuerfall: wertLabel(e.ust_fall), rnr: e.rechnungsnummer_lieferant, iban: e.iban_lieferant || "", faellig: e.faellig, skonto_bis: e.skonto_bis || "", budget: e.budget_hinweis || "" },
  };
}

export const ER_SPALTEN = [
  { key: "lieferant", titel: SPALTE.lieferantNr, typ: "objekt" },
  { key: "faellig", titel: SPALTE.faellig, typ: "signal" },
  { key: "zahlbetrag", titel: SPALTE.zahlbetrag, typ: "betrag" },
  { key: "bezug", titel: SPALTE.bezug, typ: "wort" },
  { key: "kosten", titel: SPALTE.zuordnung, typ: "kosten" },
  { key: "status", titel: SPALTE.status, typ: "status" },
];

// ------------------------------------------------------- Gutschrift, Mahnung --

export const GUTSCHRIFT_REITER = {
  alle: () => true,
  entwuerfe: (g) => Number(g.docstatus) === 0,
  rueckzahlung: (g) => Number(g.docstatus) === 1 && /R(ü|ue)ckzahlung/.test(g.erstattung_art || "") && (Number(g.erstattet_cent) || 0) < (Number(g.brutto_cent) || 0),
};

export function gutschriftZeile(g, { rolle }) {
  const st = statusAnzeige("PH Gutschrift", g.status);
  const rueck = /R(ü|ue)ckzahlung/.test(g.erstattung_art || "") && Number(g.docstatus) === 1 && (Number(g.erstattet_cent) || 0) < (Number(g.brutto_cent) || 0);
  return {
    name: g.name,
    doctype: "PH Gutschrift",
    href: `/faktura/gutschriften/${encodeURIComponent(g.name)}`,
    nummer: Number(g.docstatus) === 0 ? "Entwurf" : g.name,
    entwurf: Number(g.docstatus) === 0,
    titel: g.kunde_name || g.titel,
    unter: [g.art, g.rechnung].filter(Boolean).join(" · "),
    status: { ...st, gebucht: Number(g.docstatus) === 1 },
    signal: null,
    zellen: { art: g.art, rechnung: g.rechnung || "–", brutto: cent(g.brutto_cent), erstattung: /Verrechnung/.test(g.erstattung_art || "") ? "Verrechnung" : /R(ü|ue)ckzahlung/.test(g.erstattung_art || "") ? "Rückzahlung" : "Keine", erstattet: Number(g.erstattet_cent) ? cent(g.erstattet_cent) : "–" },
    betrag_cent: Number(g.brutto_cent) || 0,
    aktion: rolle?.schreibt ? (Number(g.docstatus) === 0 ? { id: "gs-stellen", titel: "Gutschrift stellen" } : rueck && rolle.leitung ? { id: "erstatten", titel: "Erstatten" } : null) : null,
    daten: { brutto_cent: Number(g.brutto_cent) || 0, rest_cent: (Number(g.brutto_cent) || 0) - (Number(g.erstattet_cent) || 0), kunde: g.kunde_name, rechnung: g.rechnung, art: g.art },
  };
}

export const GUTSCHRIFT_SPALTEN = [
  { key: "kunde", titel: SPALTE.kunde, typ: "objekt" },
  { key: "rechnung", titel: SPALTE.rechnung, typ: "wort" },
  { key: "brutto", titel: SPALTE.brutto, typ: "betrag" },
  { key: "erstattung", titel: SPALTE.erstattung, typ: "wort" },
  { key: "erstattet", titel: SPALTE.erstattet, typ: "betrag" },
  { key: "status", titel: SPALTE.status, typ: "status" },
];

export const MAHNUNG_REITER = {
  offen: (m) => m.status === "Gesendet",
  entwuerfe: (m) => m.status === "Entwurf",
  alle: () => true,
};

export function mahnungZeile(m, { rolle }) {
  const st = statusAnzeige("PH Mahnung", m.status);
  let aktion = null;
  if (rolle?.schreibt) aktion = m.status === "Entwurf" ? { id: "ma-senden", titel: m.kanal === "Post" ? "Drucken" : "Senden" } : m.status === "Gesendet" ? { id: "ma-erledigt", titel: "Erledigt" } : null;
  return {
    name: m.name,
    doctype: "PH Mahnung",
    href: `/faktura/mahnungen/${encodeURIComponent(m.name)}`,
    nummer: m.name,
    titel: m.kunde_name || m.titel,
    unter: [m.name, m.rechnung].filter(Boolean).join(" · "),
    status: { ...st, gebucht: false },
    signal: null,
    gruppe: m.mahnlauf || "",
    zellen: { rechnung: m.rechnung, stufe: `Stufe ${m.stufe}`, frist: m.frist ? datum(m.frist) : "–", offen: cent(m.offen_cent), kanal: m.kanal || "–" },
    betrag_cent: Number(m.offen_cent) || 0,
    aktion,
    daten: { kanal: m.kanal, rechnung: m.rechnung, stufe: m.stufe, status: m.status },
  };
}

export const MAHNUNG_SPALTEN = [
  { key: "kunde", titel: SPALTE.kunde, typ: "objekt" },
  { key: "rechnung", titel: SPALTE.rechnung, typ: "wort" },
  { key: "stufe", titel: SPALTE.stufe, typ: "wort" },
  { key: "frist", titel: SPALTE.zahlungBis, typ: "wort" },
  { key: "offen", titel: SPALTE.offen, typ: "betrag" },
  { key: "kanal", titel: SPALTE.kanal, typ: "wort" },
  { key: "status", titel: SPALTE.status, typ: "status" },
];

// ----------------------------------------------------------------- Export --

export function exportZeile(x, { rolle }) {
  const st = statusAnzeige("PH Export Lauf", x.status);
  const aktion = !rolle?.leitung ? null : x.status === "Entwurf" ? { id: "ex-erzeugen", titel: "Erzeugen" } : x.status === "Erzeugt" ? { id: "ex-uebergeben", titel: "Als übergeben" } : x.status === "Uebergeben" ? { id: "ex-bestaetigt", titel: "Von Kanzlei bestätigt" } : null;
  return {
    name: x.name,
    doctype: "PH Export Lauf",
    href: `/faktura/export/${encodeURIComponent(x.name)}`,
    nummer: x.name,
    titel: x.titel || x.name,
    unter: wertLabel(x.format),
    status: { ...st, gebucht: false },
    signal: null,
    zellen: { zeitraum: `${datum(x.zeitraum_von)}–${datum(x.zeitraum_bis)}`, belege: String(x.anzahl || 0), summe: cent(x.summe_brutto_cent), an: x.uebergeben_an || "–" },
    betrag_cent: Number(x.summe_brutto_cent) || 0,
    aktion,
    daten: { status: x.status, anzahl: x.anzahl || 0 },
  };
}

export const EXPORT_SPALTEN = [
  { key: "lauf", titel: SPALTE.lauf, typ: "objekt" },
  { key: "zeitraum", titel: SPALTE.zeitraum, typ: "wort" },
  { key: "belege", titel: SPALTE.belege, typ: "zahl" },
  { key: "summe", titel: SPALTE.summe, typ: "betrag" },
  { key: "an", titel: SPALTE.uebergebenAn, typ: "wort" },
  { key: "status", titel: SPALTE.status, typ: "status" },
];
