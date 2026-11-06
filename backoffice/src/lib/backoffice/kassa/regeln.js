// Kassa – Fachregeln (Team B-KAS). Port von Backend-Import/ph_kassa/ph_kassa/logik/regeln.py (`pruefe`,
// `storno_freigabe`) für die Anzeige vor dem Buchen (Konzept §0.4 `regeln_server`): Die Oberfläche zeigt
// Fehler und nötige Freigaben, bevor gebucht wird; der Server prüft beim Buchen erneut (Wahrheit).
// Dazu die Rechnungsfrage-Schwelle (§3.4, E1: strikt „über“), Bar-Identität (§ 365m GewO). Reines Modul.

import { NEGATIVE_ARTEN } from "./betraege.js";

export const ZAHLUNG_AUF_AUFTRAG = Object.freeze(["Anzahlung", "Teilzahlung", "Schlusszahlung"]);

/** Codes der Freigaben → Text (wie FREIGABE_TEXTE im Backend). */
export const FREIGABE_TEXTE = Object.freeze({
  rabatt: "Rabatt über der Freigabegrenze",
  ueberzahlung: "Anzahlung übersteigt das offene Soll",
  retoure_bar: "Rückzahlung in bar",
  retoure_ohne_beleg: "Rücknahme ohne Originalbeleg",
  storno_fremd: "Storno eines fremden oder älteren Belegs",
  storno_betrag: "Storno über der Mitarbeiter-Grenze",
});

const fmt = (cent) => (cent / 100).toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * @param {object} entwurf {positionen (berechnet), zahlarten, kontakt, auftrag, rechnung, gesamt_cent, empfaenger,
 *   identitaet, auftrag_offen_cent, vertragsort, fagg_frist_ende, retoure_original, rabatt_freigabe_index}
 * @param {object} einst Kassa-Einstellungen
 * @returns {{fehler:string[], freigaben:string[], hinweise:string[]}}
 */
export function pruefe(entwurf = {}, einst = {}) {
  const fehler = [];
  const freigaben = [];
  const hinweise = [];
  const pos = entwurf.positionen || [];
  const zahl = entwurf.zahlarten || [];
  const arten = pos.map((p) => p.art);
  const gesamt = Math.trunc(Number(entwurf.gesamt_cent) || 0);
  const gutscheinart = einst.gutschein_art || "Mehrzweck";

  if (arten.some((a) => ZAHLUNG_AUF_AUFTRAG.includes(a))) {
    if (!(entwurf.auftrag || entwurf.rechnung)) fehler.push("Anzahlung/Teil-/Schlusszahlung nur mit Auftrag oder Rechnung – ohne Auftrag: Gutschein verkaufen.");
    const offen = entwurf.auftrag_offen_cent;
    const summe = pos.filter((p) => ZAHLUNG_AUF_AUFTRAG.includes(p.art)).reduce((a, p) => a + (Number(p.brutto_cent) || 0), 0);
    if (offen !== undefined && offen !== null && summe > Number(offen)) freigaben.push("ueberzahlung");
    if (entwurf.vertragsort === "Beim Kunden" && entwurf.fagg_frist_ende) hinweise.push(`Außergeschäftsraumvertrag (FAGG): Rücktritt bis ${entwurf.fagg_frist_ende} möglich – Anzahlung wäre rückzuzahlen.`);
  }

  if (arten.includes("Gutschein Verkauf") && (arten.includes("Gutschein Einloesung") || zahl.some((z) => z.zahlart === "Gutschein"))) {
    fehler.push("Gutschein verkaufen und einlösen im selben Beleg ist nicht möglich – der neue Gutschein gilt erst nach dem Buchen.");
  }
  if (gutscheinart === "Einzweck" && zahl.some((z) => z.zahlart === "Gutschein")) fehler.push("Einzweck-Gutscheine werden als Position „Gutschein Einlösung“ eingelöst, nicht als Zahlart.");
  if (gutscheinart === "Mehrzweck" && arten.includes("Gutschein Einloesung")) fehler.push("Mehrzweck-Gutscheine werden als Zahlart „Gutschein“ eingelöst, nicht als Position.");
  for (const p of pos) {
    if (p.art === "Gutschein Einloesung" && !p.gutschein) fehler.push("Gutschein-Einlösung ohne geprüften Gutschein.");
    if (p.art === "Gutschein Verkauf" && !(Number(p.brutto_cent) > 0)) fehler.push("Gutschein-Verkauf braucht einen Wert größer 0.");
  }

  if (arten.includes("Retoure")) {
    if (!entwurf.retoure_original) freigaben.push("retoure_ohne_beleg");
    const barNurLeitung = einst.retoure_bar_nur_leitung === undefined ? 1 : Number(einst.retoure_bar_nur_leitung);
    if (gesamt < 0 && zahl.some((z) => z.zahlart === "Bar") && barNurLeitung) freigaben.push("retoure_bar");
    if (pos.some((p) => p.art === "Retoure" && !String(p.zusatz || "").trim())) fehler.push("Retoure braucht einen Grund (Umtausch, Mangel, Kulanz …).");
  }
  if (gesamt < 0 && !arten.some((a) => NEGATIVE_ARTEN.includes(a))) fehler.push("Negativer Beleg nur mit Retoure oder Gutschein-Einlösung (Storno über „Stornieren“).");

  if (entwurf.rabatt_freigabe_index?.length) freigaben.push("rabatt");

  const grenze = Number(einst.barverkauf_rechnung_ab_cent) || 40000;
  const umsatz = umsatzFuerRechnung(pos);
  if (umsatz > grenze && !entwurf.rechnung) {
    const emp = entwurf.empfaenger || {};
    if (!(entwurf.kontakt || (emp.name && emp.strasse && emp.ort))) fehler.push(`Beleg über ${fmt(grenze)} € braucht einen Rechnungsempfänger mit Name und Anschrift (§ 11 UStG).`);
    const uidGrenze = Number(einst.uid_empfaenger_ab_cent) || 1000000;
    if (umsatz > uidGrenze && emp && emp.ist_unternehmer && !emp.uid) fehler.push("Über 10.000 € braucht die Rechnung an Unternehmer die UID des Empfängers.");
  }

  const barGrenze = Number(einst.bar_identitaet_ab_cent) || 1000000;
  const bar = zahl.filter((z) => z.zahlart === "Bar").reduce((a, z) => a + Math.abs(Number(z.betrag_cent) || 0), 0);
  if (bar >= barGrenze) {
    const ident = entwurf.identitaet || {};
    if (!(ident.art && ident.nummer && (entwurf.kontakt || ident.name))) fehler.push(`Barzahlung ab ${fmt(barGrenze)} €: Identität feststellen (Ausweisart, Nummer, Name) – § 365m ff. GewO.`);
  }

  return { fehler, freigaben: [...new Set(freigaben)].sort(), hinweise };
}

/** Umsatz, der für die Rechnungspflicht zählt (ohne Zahlungen auf Auftrag und Gutschein-Verkauf). */
export function umsatzFuerRechnung(positionen = []) {
  return positionen.filter((p) => !ZAHLUNG_AUF_AUFTRAG.includes(p.art) && p.art !== "Gutschein Verkauf").reduce((a, p) => a + (Number(p.brutto_cent) || 0), 0);
}

/**
 * Rechnungsfrage beim Betreten der Zahlmaske (§3.4, E1): nur ohne Kunde, nur ohne bereits gegebene Antwort,
 * nur wenn der Umsatz die Schwelle **übersteigt** (strikt größer).
 */
export function rechnungsfrageNoetig({ positionen = [], kontakt = null, antwort = null, rechnung = null }, einst = {}) {
  if (kontakt || rechnung || antwort) return false;
  const grenze = Number(einst.barverkauf_rechnung_ab_cent) || 40000;
  return umsatzFuerRechnung(positionen) > grenze;
}

/** Bar ab Identitäts-Grenze → Ausweisdaten nötig (§ 365m GewO). */
export function identitaetNoetig(barCent, einst = {}) {
  return Math.abs(Number(barCent) || 0) >= (Number(einst.bar_identitaet_ab_cent) || 1000000);
}

/** Welche Freigaben braucht ein Storno? (wie storno_freigabe) Leitung braucht keine. */
export function stornoFreigabe(beleg, bediener, heute, leitung, grenzeCent) {
  if (leitung) return [];
  const out = [];
  if (beleg.bediener !== bediener || String(beleg.datum) !== String(heute)) out.push("storno_fremd");
  if (!Number(grenzeCent) || Math.abs(Number(beleg.gesamt_cent) || 0) > Number(grenzeCent)) out.push("storno_betrag");
  return out;
}

/** Storno-Sperren laut Konzept (E2/E10/terminal_erstatten): liefert Grund-Schlüssel oder null. */
export function stornoGesperrt(beleg, faehig = {}) {
  if (!beleg) return "nicht_gefunden";
  if (["Stornobeleg", "Nullbeleg", "Startbeleg", "Monatsbeleg", "Jahresbeleg", "Schlussbeleg", "Sammelbeleg"].includes(beleg.belegart)) return "belegart";
  if (beleg.storniert || beleg.status === "Storniert") return "bereits";
  const zahlarten = beleg.zahlarten || [];
  if (zahlarten.some((z) => z.zahlart === "Karte Stripe Terminal") && !faehig.terminal_erstatten) return "karte";
  if ((beleg.auftrag || beleg.rechnung || (beleg.positionen || []).some((p) => ZAHLUNG_AUF_AUFTRAG.includes(p.art))) && !faehig.storno_ursprung) return "ursprung";
  return null;
}
