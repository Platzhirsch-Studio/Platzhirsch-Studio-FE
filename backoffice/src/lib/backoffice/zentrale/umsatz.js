// Buchhalterisch richtige Kennzahlen der Zentrale (10-konzept-zentrale § 6.1, Z-54 … Z-57). Reine Rechenlogik auf
// bereits geladenen Zeilen – unit-getestet (tests/unit/zentrale-umsatz.test.mjs); die Abfragen stehen in daten.js.
// Alle Beträge in Cent, Ergebnis immer in EUR (Fremdwährung über `kurs` am Beleg bzw. `betrag_eur`).

/** Rechnungsarten, die zum Umsatz zählen (Anzahlungsrechnungen nicht – sie sind Vorauszahlung). */
export const UMSATZ_ARTEN = ["Rechnung", "Teilrechnung", "Schlussrechnung", "Barverkauf"];
/** Offene-Posten-Status (gestellt, nicht ausgeglichen). */
export const OP_STATUS = ["Gestellt", "Teilbezahlt", "Ueberfaellig", "Gemahnt"];
/** Kassenbelegarten, die Umsatz tragen (Null-, Start-, Monats-, Jahres-, Schluss- und Trainingsbelege nicht). */
export const KASSA_ARTEN = ["Standard", "Stornobeleg", "Sammelbeleg"];
export const KASSA_STATUS = ["Signiert", "Ausfall", "Nachsigniert"];

/** Betrag eines Belegs in EUR-Cent: Fremdwährung × kurs (Kurs am Beleg, Inhaber-Standard bis Entscheidung). */
export function inEur(cent, waehrung, kurs) {
  const c = Number(cent) || 0;
  if (!waehrung || waehrung === "EUR") return c;
  const k = Number(kurs);
  return Number.isFinite(k) && k > 0 ? Math.round(c * k) : null;
}

/** Monat (JJJJ-MM) eines Belegs: Leistungsdatum, sonst Datum. */
function monatVon(z, feld = "leistungsdatum") {
  return String(z[feld] || z.datum || "").slice(0, 7);
}

/**
 * Umsatz eines Monats netto: Σ Rechnungen (gebucht, nicht storniert, Umsatz-Arten, Leistungsmonat) − Σ Gutschriften
 * (gebucht, Datum im Monat). Zahlungen fließen nie ein. CHF-Belege über `kurs`.
 * @param {string} monat  „2026-10“
 * @returns {{cent:number, chf:boolean, ohneKurs:number}}
 */
export function umsatzMonatNetto(monat, rechnungen = [], gutschriften = []) {
  let cent = 0;
  let chf = false;
  let ohneKurs = 0;
  for (const r of rechnungen) {
    if (Number(r.docstatus) !== 1 || r.status === "Storniert" || !UMSATZ_ARTEN.includes(r.art)) continue;
    if (monatVon(r) !== monat) continue;
    const eur = inEur(r.netto_cent, r.waehrung, r.kurs);
    if (eur === null) {
      ohneKurs++;
      continue;
    }
    if (r.waehrung && r.waehrung !== "EUR") chf = true;
    cent += eur;
  }
  for (const g of gutschriften) {
    if (Number(g.docstatus) !== 1) continue;
    if (String(g.datum || "").slice(0, 7) !== monat) continue;
    const eur = inEur(g.netto_cent, g.waehrung, g.kurs);
    if (eur === null) {
      ohneKurs++;
      continue;
    }
    cent -= eur;
  }
  return { cent, chf, ohneKurs };
}

/** Umsatz netto je Monat für eine Monatsliste („2026-06“ … „2026-11“). */
export function umsatzJeMonat(monate = [], rechnungen = [], gutschriften = []) {
  return monate.map((m) => ({ monat: m, ...umsatzMonatNetto(m, rechnungen, gutschriften) }));
}

/**
 * Zahlungseingang eines Monats: Σ Eingänge (livemode, bezahlt/teilerstattet) − Σ Erstattungen, in EUR (`betrag_eur`,
 * Rückfall `betrag_cent` bei EUR). Testzahlungen (livemode = 0) zählen nie.
 * @returns {{cent:number, anzahlungenCent:number}}
 */
export function zahlungseingangMonat(monat, zahlungen = [], { istAnzahlung = () => false } = {}) {
  let cent = 0;
  let anz = 0;
  for (const z of zahlungen) {
    if (!Number(z.livemode)) continue;
    if (String(z.zeitpunkt || "").slice(0, 7) !== monat) continue;
    const eur = z.betrag_eur !== undefined && z.betrag_eur !== null && z.betrag_eur !== "" ? Math.round(Number(z.betrag_eur) * 100) : inEur(z.betrag_cent, z.waehrung, null);
    if (eur === null) continue;
    if (z.art === "Eingang" && ["Bezahlt", "Teilerstattet"].includes(z.status)) {
      cent += eur;
      if (istAnzahlung(z)) anz += eur;
    } else if (z.art === "Erstattung" && ["Bezahlt", "Erstattet"].includes(z.status)) cent -= eur;
  }
  return { cent, anzahlungenCent: anz };
}

/**
 * Offene Posten ohne Anzahlungsrechnungen; Anzahlungsanforderungen getrennt (Z-56). EUR.
 * @returns {{cent:number, anzahl:number, ueberfaellig:number, anzahlungenCent:number}}
 */
export function offenePosten(rechnungen = [], heute = "9999-12-31") {
  let cent = 0;
  let anzahl = 0;
  let ueber = 0;
  let anzahlungen = 0;
  for (const r of rechnungen) {
    if (!OP_STATUS.includes(r.status)) continue;
    const eur = inEur(r.offen_cent, r.waehrung, r.kurs);
    if (eur === null) continue;
    if (r.art === "Anzahlungsrechnung") {
      anzahlungen += eur;
      continue;
    }
    cent += eur;
    anzahl++;
    if (r.status === "Ueberfaellig" || r.status === "Gemahnt" || (r.faellig && String(r.faellig) < heute)) ueber++;
  }
  return { cent, anzahl, ueberfaellig: ueber, anzahlungenCent: anzahlungen };
}

/**
 * Kassa heute (Z-57): Σ gesamt_cent der Belegarten Standard/Storno/Sammel mit Signatur-Status, ohne Training;
 * Stornobelege negativ (auch wenn der Betrag positiv gespeichert ist).
 * @returns {{cent:number, belege:number, stornos:number}}
 */
export function kassaHeute(belege = [], heute) {
  let cent = 0;
  let n = 0;
  let st = 0;
  for (const b of belege) {
    if (Number(b.trainings)) continue;
    if (!KASSA_ARTEN.includes(b.belegart) || !KASSA_STATUS.includes(b.status)) continue;
    if (heute && String(b.datum_uhrzeit || "").slice(0, 10) !== heute) continue;
    const betrag = Math.abs(Number(b.gesamt_cent) || 0);
    if (b.belegart === "Stornobeleg") {
      cent -= betrag;
      st++;
    } else {
      cent += Number(b.gesamt_cent) || 0;
      n++;
    }
  }
  return { cent, belege: n, stornos: st };
}

/** Monatsliste der letzten n Monate bis einschließlich `heute` („2026-06“ … „2026-11“). */
export function letzteMonate(heute, n = 6) {
  const [j, m] = String(heute).slice(0, 7).split("-").map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(j, m - 1 - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

const KURZ = ["Jän", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const LANG = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

/** „2026-10“ → „Okt“ bzw. „Oktober“. */
export function monatsName(monat, lang = false) {
  const m = Number(String(monat).slice(5, 7));
  return (lang ? LANG : KURZ)[m - 1] || monat;
}

/** Trend in ganzen Prozent gegen einen Vergleichswert; ohne gültigen Vergleich null (kein Pfeil, Konzept § 6). */
export function trendProzent(wert, vergleich) {
  const a = Number(wert);
  const b = Number(vergleich);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
  return Math.round(((a - b) / b) * 100);
}
