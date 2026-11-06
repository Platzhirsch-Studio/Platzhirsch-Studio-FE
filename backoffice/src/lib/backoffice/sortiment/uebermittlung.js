// Bestellübermittlung an Hersteller (IWOfurn, EDI, CSV) und AB-Merker – Übertragung von
// ph_sortiment/logik/uebermittlung.py (gleiche Prüfungen, gleiche Dateiinhalte), damit die Oberfläche die Datei
// vorab zeigen kann und der Mock dieselbe Datei erzeugt wie der Server. Es gibt keine Direktübertragung:
// Datei erzeugen → im Portal/IWOfurn hochladen → „Als übermittelt markieren“. IWOfurn/EDI sind unverifiziert.
// Reines Modul (Tests: tests/unit/sortiment-uebermittlung.test.mjs).

export class AdapterFehler extends Error {}

export const WEGE = Object.freeze({
  "E-Mail": { label: "E-Mail mit PDF", datei: false, verifiziert: true, gln: false },
  CSV: { label: "CSV (IWOfurn/pCon-Platzhalter)", datei: true, endung: "csv", mime: "text/csv", verifiziert: true, gln: false },
  IWOfurn: { label: "IWOfurn-Bestellung (XML, unverifiziert)", datei: true, endung: "xml", mime: "application/xml", verifiziert: false, gln: true },
  EDI: { label: "EDIFACT ORDERS (unverifiziert)", datei: true, endung: "edi", mime: "application/edifact", verifiziert: false, gln: true },
});

/** Bestellweg des Lieferanten → Adapter. */
export function wegFuerBestellweg(bestellweg) {
  return { IWOfurn: "IWOfurn", EDI: "EDI", pCon: "CSV", Portal: "CSV" }[bestellweg || ""] || "E-Mail";
}

/** GS1-GLN: 13 Ziffern, Prüfziffer Modulo 10 (Gewichte 3/1 von rechts). */
export function glnGueltig(gln) {
  const s = String(gln || "").trim();
  if (!/^\d{13}$/.test(s)) return false;
  const z = s.split("").map(Number);
  const pruef = z.pop();
  const summe = z.reverse().reduce((a, x, i) => a + x * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (summe % 10)) % 10 === pruef;
}

/** Prüffehler eines Exports (leer = in Ordnung). */
export function pruefeExport(weg, bestellung, absender = {}, lieferant = {}) {
  const w = WEGE[weg];
  if (!w) return [`Unbekannter Übermittlungsweg ${weg}`];
  const fehler = [];
  if (!(bestellung?.positionen || []).length) fehler.push("Bestellung ohne Positionen");
  for (const p of bestellung?.positionen || []) if (!(Number(p.menge) > 0)) fehler.push(`Position ${p.idx}: Menge fehlt`);
  if (w.gln) {
    if (!glnGueltig(absender.gln)) fehler.push("Eigene GLN fehlt/ungültig (Einstellungen Sortiment)");
    if (!glnGueltig(lieferant.gln)) fehler.push("GLN des Lieferanten fehlt/ungültig");
  }
  return fehler;
}

function xmlEsc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attrEsc(v) {
  return xmlEsc(v).replace(/"/g, "&quot;");
}

/** EDIFACT-Freigabe: ? vor ' + : ?, Leerraum zusammengezogen, max. 35 Zeichen. */
export function ediEscape(text) {
  let s = String(text ?? "").split(/\s+/).filter(Boolean).join(" ").slice(0, 35);
  for (const z of ["?", "'", "+", ":"]) s = s.split(z).join(`?${z}`);
  return s;
}

function ediDatum(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ""));
  return m ? `${m[1]}${m[2]}${m[3]}` : null;
}

function csv(b) {
  const zeilen = ["pos;hersteller_artikelnr;bezeichnung;ausfuehrung;menge;wunschtermin;kommission"];
  for (const p of b.positionen) zeilen.push([p.idx, p.hersteller_artikelnr, p.bezeichnung, p.ausfuehrung_text, p.menge, p.wunschtermin, p.kommission].map((x) => x ?? "").join(";"));
  return { dateiname: `${b.name}-csv.csv`, inhalt: "﻿" + zeilen.join("\r\n") + "\r\n" };
}

function iwofurn(b, absender, lieferant) {
  const pos = b.positionen.map(
    (p) =>
      `  <Position Nr="${attrEsc(p.idx)}"><TypNr>${xmlEsc(p.hersteller_artikelnr)}</TypNr><EAN>${xmlEsc(p.ean)}</EAN>` +
      `<Text>${xmlEsc(p.bezeichnung)}</Text><Ausfuehrung>${xmlEsc(p.ausfuehrung_text)}</Ausfuehrung>` +
      `<Menge Einheit="${attrEsc(p.einheit || "Stk")}">${xmlEsc(p.menge)}</Menge><Wunschtermin>${xmlEsc(p.wunschtermin)}</Wunschtermin>` +
      `<Kommission>${xmlEsc(p.kommission || b.kommission)}</Kommission></Position>`
  );
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    "<!-- UNVERIFIZIERT: Platzhirsch-Bestellsatz für IWOfurn, Struktur mit IWOfurn/Lieferant abstimmen -->\n" +
    `<Bestellung Nummer="${attrEsc(b.name)}" Datum="${attrEsc(b.datum)}" Waehrung="${attrEsc(b.waehrung || "EUR")}">\n` +
    `  <Kaeufer GLN="${attrEsc(absender.gln)}" Kundennummer="${attrEsc(lieferant.kundennummer)}">${xmlEsc(absender.firma)}</Kaeufer>\n` +
    `  <Lieferant GLN="${attrEsc(lieferant.gln)}">${xmlEsc(lieferant.firmenname)}</Lieferant>\n` +
    `  <Lieferadresse>${xmlEsc(b.lieferadresse_text)}</Lieferadresse>\n` +
    `  <Kommission>${xmlEsc(b.kommission)}</Kommission><Wunschtermin>${xmlEsc(b.wunschtermin)}</Wunschtermin>\n` +
    `  <Hinweis>${xmlEsc(b.notizen_lieferant)}</Hinweis>\n` +
    pos.join("\n") +
    "\n</Bestellung>\n";
  return { dateiname: `${b.name}-iwofurn.xml`, inhalt: xml };
}

function edi(b, absender, lieferant, jetzt = new Date()) {
  const heute = `${jetzt.getFullYear()}${String(jetzt.getMonth() + 1).padStart(2, "0")}${String(jetzt.getDate()).padStart(2, "0")}`;
  const ref = String(b.name).replace(/[^A-Za-z0-9]/g, "").slice(-14) || "1";
  const seg = ["UNH+1+ORDERS:D:96A:UN:EAN008", `BGM+220+${ediEscape(b.name)}+9`, `DTM+137:${ediDatum(b.datum) || heute}:102`];
  if (ediDatum(b.wunschtermin)) seg.push(`DTM+2:${ediDatum(b.wunschtermin)}:102`);
  if (b.kommission) seg.push(`RFF+CR:${ediEscape(b.kommission)}`);
  seg.push(`NAD+BY+${absender.gln}::9`, `NAD+SU+${lieferant.gln}::9`);
  if (lieferant.kundennummer) seg.push(`RFF+IA:${ediEscape(lieferant.kundennummer)}`);
  if (b.lieferadresse_text) {
    const teile = String(b.lieferadresse_text).split(/\r?\n/).filter((t) => t.trim()).slice(0, 4).map(ediEscape);
    seg.push(`NAD+DP+++${teile.join(":")}`);
  }
  seg.push(`CUX+2:${b.waehrung || "EUR"}:9`);
  for (const p of b.positionen) {
    seg.push(`LIN+${p.idx}${p.ean ? `++${ediEscape(p.ean)}:SRV` : ""}`);
    if (p.hersteller_artikelnr) seg.push(`PIA+1+${ediEscape(p.hersteller_artikelnr)}:SA`);
    seg.push(`IMD+F++:::${ediEscape(p.bezeichnung)}`);
    if (p.ausfuehrung_text) seg.push(`IMD+F+35+:::${ediEscape(p.ausfuehrung_text)}`);
    seg.push(`QTY+21:${Number(p.menge) || 0}`);
    if (ediDatum(p.wunschtermin)) seg.push(`DTM+2:${ediDatum(p.wunschtermin)}:102`);
  }
  seg.push("UNS+S", `CNT+2:${b.positionen.length}`);
  seg.push(`UNT+${seg.length + 1}+1`);
  const yymmdd = heute.slice(2);
  const kopf = ["UNA:+.? '", `UNB+UNOC:3+${absender.gln}:14+${lieferant.gln}:14+${yymmdd}:0000+${ref}`];
  const zeilen = [kopf[1], ...seg, `UNZ+1+${ref}`];
  return { dateiname: `${b.name}-orders.edi`, inhalt: `${kopf[0]}\n${zeilen.join("'\n")}'\n` };
}

/**
 * Exportdatei erzeugen. → { dateiname, inhalt, mime, verifiziert, hinweis } · wirft AdapterFehler mit allen Prüffehlern.
 * @param {"CSV"|"IWOfurn"|"EDI"|"E-Mail"} weg
 */
export function exportieren(weg, bestellung, absender = {}, lieferant = {}, { jetzt = new Date() } = {}) {
  const w = WEGE[weg];
  if (!w) throw new AdapterFehler(`Unbekannter Übermittlungsweg ${weg}`);
  if (!w.datei) throw new AdapterFehler(`${w.label} erzeugt keine Datei – bitte „Per E-Mail senden“.`);
  const fehler = pruefeExport(weg, bestellung, absender, lieferant);
  if (fehler.length) throw new AdapterFehler(fehler.join("; "));
  const datei = weg === "CSV" ? csv(bestellung) : weg === "IWOfurn" ? iwofurn(bestellung, absender, lieferant) : edi(bestellung, absender, lieferant, jetzt);
  return { ...datei, mime: w.mime, verifiziert: w.verifiziert, hinweis: w.verifiziert ? null : "Format unverifiziert – mit Lieferant/IWOfurn abstimmen, bevor es produktiv genutzt wird." };
}

/** Bestellung (PH Herstellerbestellung) → Exportdaten wie PH Herstellerbestellung._export_daten. */
export function exportDaten(doc, { lieferant = {}, einst = {} } = {}) {
  const bestellung = {
    name: doc.name,
    datum: doc.datum,
    wunschtermin: doc.wunschtermin,
    kommission: doc.kommission,
    waehrung: doc.waehrung || "EUR",
    lieferadresse_text: doc.lieferadresse_text || einst.standard_lieferadresse || "",
    notizen_lieferant: doc.notizen_lieferant || "",
    positionen: (doc.positionen || []).filter((p) => p.status !== "Storniert").map((p, i) => ({ idx: p.idx || i + 1, hersteller_artikelnr: p.hersteller_artikelnr, ean: p.ean || "", bezeichnung: p.bezeichnung, ausfuehrung_text: p.ausfuehrung_text, menge: p.menge, einheit: p.einheit, wunschtermin: p.wunschtermin || doc.wunschtermin, kommission: p.kommission || doc.kommission })),
  };
  const absender = { firma: "Platzhirsch Home Living", gln: einst.eigene_gln || "" };
  const lf = { firmenname: lieferant.firmenname || doc.lieferant || "", gln: lieferant.gln || "", kundennummer: lieferant.kundennummer_bei_lieferant || "" };
  return { bestellung, absender, lieferant: lf };
}

const UEBERGAENGE = {
  "": ["Vorbereitet", "Exportiert", "Uebermittelt", "Fehler"],
  Vorbereitet: ["Exportiert", "Uebermittelt", "Fehler"],
  Exportiert: ["Exportiert", "Uebermittelt", "Fehler"],
  Uebermittelt: ["Bestaetigt", "Fehler", "Uebermittelt"],
  Fehler: ["Vorbereitet", "Exportiert", "Uebermittelt", "Fehler"],
  Bestaetigt: ["Bestaetigt"],
};

export function uebermittlungErlaubt(von, nach) {
  return (UEBERGAENGE[von || ""] || []).includes(nach);
}

/** Nächste manuelle Schritte im Übermittlungs-Menü (ohne „Exportiert“, das erzeugt die Datei). */
export function naechsteUebermittlung(von) {
  return (UEBERGAENGE[von || ""] || []).filter((s) => ["Uebermittelt", "Bestaetigt", "Fehler"].includes(s) && s !== von);
}

// ── AB-Merker je Position ────────────────────────────────────────────────

export const MERKER_FERTIG = Object.freeze(["bestaetigt", "geklaert"]);

/** Merker einer Position: offen (keine AB) · abweichung · geklaert · bestaetigt. */
export function abMerker(abVorhanden, zeilen = []) {
  if (!abVorhanden) return "offen";
  if (!zeilen.length) return "bestaetigt";
  if (zeilen.some((z) => ["offen", "pruefen"].includes(z.bewertung || "offen"))) return "abweichung";
  return "geklaert";
}

/** AB vollständig, wenn jede aktive Position bestätigt oder geklärt ist. */
export function abVollstaendig(merker = []) {
  return merker.length > 0 && merker.every((m) => MERKER_FERTIG.includes(m));
}

/** Merker aller Positionen aus Bestellung + Protokoll. */
export function merkerAlle(doc) {
  const ab = !!doc?.ab_nummer;
  return (doc?.positionen || [])
    .filter((p) => p.status !== "Storniert")
    .map((p, i) => {
      const idx = p.idx || i + 1;
      const zeilen = (doc.ab_abgleich || []).filter((z) => Number(z.position) === idx);
      return { idx, merker: abMerker(ab, zeilen) };
    });
}
