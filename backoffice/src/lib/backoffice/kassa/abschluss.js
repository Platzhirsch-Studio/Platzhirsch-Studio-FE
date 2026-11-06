// Kassa – Tagesabschluss-Rechnung (Team B-KAS). Port von Backend-Import/ph_kassa/ph_kassa/logik/abschluss.py:
// Zählprotokoll, Soll aus Belegen, Differenz, Zustandsmaschine – plus Anzeige-Helfer für den Assistenten
// (Toleranz-Wort, Münzrollen). Reines Modul.

import { KassenFehler, STUECKELUNG_CENT } from "./betraege.js";

export const ABSCHLUSS_STATUS = Object.freeze(["Offen", "Gezaehlt", "Abgeschlossen", "Korrigiert"]);
export const KASSENBUCH_ARTEN = Object.freeze(["Anfangsbestand", "Einlage", "Entnahme", "Bareinnahme", "Barausgabe", "Differenz"]);
const VORZEICHEN = { Anfangsbestand: 1, Einlage: 1, Entnahme: -1, Bareinnahme: 1, Barausgabe: -1, Differenz: 1 };

/** Scheine zuerst, dann Münzen – Zählreihenfolge des Assistenten. */
export const SCHEINE = Object.freeze(STUECKELUNG_CENT.filter((s) => s >= 500));
export const MUENZEN = Object.freeze(STUECKELUNG_CENT.filter((s) => s < 500));

/** Übliche Münzrollen (Stück je Rolle) – Eingabehilfe „Rolle“ im Zählraster. */
export const MUENZROLLEN = Object.freeze({ 200: 25, 100: 25, 50: 40, 20: 40, 10: 40, 5: 50, 2: 50, 1: 50 });

export function bewegungCent(art, betragCent) {
  if (!KASSENBUCH_ARTEN.includes(art)) throw new KassenFehler(`Unbekannte Kassenbuch-Art: ${art}`);
  const b = Math.trunc(Number(betragCent) || 0);
  if (art !== "Differenz" && b < 0) throw new KassenFehler("Betrag muss positiv sein; das Vorzeichen bestimmt die Art.");
  return VORZEICHEN[art] * b;
}

export function zaehlprotokollLeer() {
  return STUECKELUNG_CENT.map((s) => ({ stueckelung_cent: s, anzahl: 0, summe_cent: 0 }));
}

export function zaehlprotokollSumme(zeilen = []) {
  let summe = 0;
  for (const z of zeilen) {
    const s = Math.trunc(Number(z.stueckelung_cent) || 0);
    const n = Math.trunc(Number(z.anzahl) || 0);
    if (!STUECKELUNG_CENT.includes(s)) throw new KassenFehler(`Unbekannte Stückelung: ${s} Cent`);
    if (n < 0) throw new KassenFehler("Anzahl im Zählprotokoll darf nicht negativ sein.");
    summe += s * n;
  }
  return summe;
}

/** Zählprotokoll aus {stueckelung: anzahl} (Assistent) → Zeilen mit Summe. */
export function zaehlprotokollAus(anzahlen = {}) {
  return STUECKELUNG_CENT.map((s) => {
    const n = Math.max(0, Math.trunc(Number(anzahlen[s]) || 0));
    return { stueckelung_cent: s, anzahl: n, summe_cent: s * n };
  });
}

export function differenz(istCent, sollCent) {
  return Math.trunc(istCent) - Math.trunc(sollCent);
}

export function differenzGrundPflichtig(differenzCent, toleranzCent = 0) {
  return Math.abs(Math.trunc(differenzCent)) > Math.trunc(Number(toleranzCent) || 0);
}

/** Wort zur Differenz für Mitarbeitende (ohne Schuldzuweisung). */
export function differenzWort(differenzCent, toleranzCent = 0) {
  const d = Math.trunc(differenzCent);
  if (d === 0) return "stimmt";
  if (!differenzGrundPflichtig(d, toleranzCent)) return "innerhalb der Toleranz";
  return d > 0 ? "Überschuss" : "Fehlbetrag";
}

export function bargeldSoll(anfang, einnahmen, ausgaben, einlagen = 0, entnahmen = 0) {
  return Math.trunc(anfang) + Math.trunc(einnahmen) - Math.trunc(ausgaben) + Math.trunc(einlagen) - Math.trunc(entnahmen);
}

/** Soll-Werte eines Tages aus Belegen (wie soll_aus_belegen; Training zählt nicht zum Umsatz). */
export function sollAusBelegen(belege = []) {
  const out = {
    belege_anzahl: 0, stornos_anzahl: 0, trainings_anzahl: 0, nullbelege_anzahl: 0,
    bar_einnahmen_cent: 0, bar_ausgaben_cent: 0, karten_cent: 0, gutschein_cent: 0, ueberweisung_cent: 0,
    umsatz_cent: 0, anzahlungen_cent: 0, gutschein_verkauf_cent: 0, gutschein_einloesung_cent: 0, retouren_cent: 0, retouren_anzahl: 0,
    je_satz: {}, je_zahlart: {}, je_bediener: {},
  };
  for (const b of belege) {
    const art = b.belegart || "Standard";
    if (Number(b.trainings) || art === "Trainingsbeleg") {
      out.trainings_anzahl += 1;
      continue;
    }
    out.belege_anzahl += 1;
    if (art === "Nullbeleg") out.nullbelege_anzahl += 1;
    if (art === "Stornobeleg") out.stornos_anzahl += 1;
    const bed = b.bediener || "unbekannt";
    const jb = (out.je_bediener[bed] ||= { anzahl: 0, umsatz_cent: 0, stornos: 0 });
    jb.anzahl += 1;
    jb.umsatz_cent += Number(b.gesamt_cent) || 0;
    if (art === "Stornobeleg") jb.stornos += 1;
    out.umsatz_cent += Number(b.gesamt_cent) || 0;
    for (const z of b.zahlarten || []) {
      const betrag = Number(z.betrag_cent) || 0;
      out.je_zahlart[z.zahlart] = (out.je_zahlart[z.zahlart] || 0) + betrag;
      if (z.zahlart === "Bar") {
        if (betrag >= 0) out.bar_einnahmen_cent += betrag;
        else out.bar_ausgaben_cent += -betrag;
      } else if (z.zahlart === "Karte Stripe Terminal" || z.zahlart === "Karte extern") out.karten_cent += betrag;
      else if (z.zahlart === "Gutschein") out.gutschein_cent += betrag;
      else if (z.zahlart === "Ueberweisung") out.ueberweisung_cent += betrag;
    }
    for (const p of b.positionen || []) {
      const s = (out.je_satz[p.steuersatz || "Normal 20"] ||= { netto_cent: 0, ust_cent: 0, brutto_cent: 0, anzahl: 0 });
      s.netto_cent += Number(p.netto_cent) || 0;
      s.ust_cent += Number(p.ust_cent) || 0;
      s.brutto_cent += Number(p.brutto_cent) || 0;
      s.anzahl += 1;
      if (["Anzahlung", "Teilzahlung", "Schlusszahlung"].includes(p.art)) out.anzahlungen_cent += Number(p.brutto_cent) || 0;
      else if (p.art === "Gutschein Verkauf") out.gutschein_verkauf_cent += Number(p.brutto_cent) || 0;
      else if (p.art === "Gutschein Einloesung") out.gutschein_einloesung_cent += -(Number(p.brutto_cent) || 0);
      else if (p.art === "Retoure") {
        out.retouren_cent += -(Number(p.brutto_cent) || 0);
        out.retouren_anzahl += 1;
      }
    }
  }
  return out;
}

export function naechsterStatus(aktuell, aktion) {
  const erlaubt = { "Offen|zaehlen": "Gezaehlt", "Gezaehlt|zaehlen": "Gezaehlt", "Korrigiert|zaehlen": "Gezaehlt", "Gezaehlt|abschliessen": "Abgeschlossen", "Abgeschlossen|oeffnen": "Korrigiert" };
  const n = erlaubt[`${aktuell}|${aktion}`];
  if (!n) throw new KassenFehler(`Aktion „${aktion}“ ist im Status „${aktuell}“ nicht möglich.`);
  return n;
}

/** Schritte des Abschluss-Assistenten nach Rolle und Fähigkeit (§3.8). */
export function abschlussSchritte({ leitung = false, abschoepfung = false } = {}) {
  const s = [{ id: "pruefen", titel: "Tag prüfen" }, { id: "zaehlen", titel: "Zählen" }];
  if (!leitung) return [...s, { id: "uebergeben", titel: "Übergeben" }];
  return [...s, { id: "differenz", titel: "Differenz" }, ...(abschoepfung ? [{ id: "abschoepfen", titel: "Abschöpfen" }] : []), { id: "abschliessen", titel: "Abschließen" }];
}
