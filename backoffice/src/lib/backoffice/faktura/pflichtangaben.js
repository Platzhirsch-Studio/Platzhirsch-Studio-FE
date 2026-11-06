// Pflichtangaben-Prüfer (10-konzept-faktura § 5.1, § 2.8; § 11 UStG; R-04, R-08, F-01, F-15, F-23).
// Gleiche Regeln wie steuer.pflichtangaben_pruefen nach P-06/P-07. Rein und unit-getestet.
// Ergebnis je Befund: { id, feld, tab, text, blockiert, uebersteuerbar? }.

const KLEINBETRAG_STANDARD = 40000; // 400,00 € brutto
const UID_AB_STANDARD = 1000000; // 10.000,00 € brutto
const UNTERNEHMER_ARTEN = new Set(["Geschaeft", "Architekt", "Partner", "Firma"]);

/** Empfänger ist Unternehmer? Vorbelegung aus Kontaktart oder Firmenname, im Entwurf änderbar (P-07). */
export function istUnternehmer(beleg = {}, kontakt = {}) {
  if (beleg.empfaenger_unternehmer === 0 || beleg.empfaenger_unternehmer === false) return false;
  if (beleg.empfaenger_unternehmer === 1 || beleg.empfaenger_unternehmer === true) return true;
  return UNTERNEHMER_ARTEN.has(kontakt.kontaktart) || !!(beleg.firma || kontakt.firma);
}

/**
 * Quelle des Leistungsdatums: Lieferschein-Zustellung · Montage-Abnahme · Kassa · von Hand.
 * Ist der Wert nur gleich dem Rechnungsdatum ohne Quelle, braucht der Stellen-Dialog „geprüft“ (R-08).
 */
export function leistungsQuelle(beleg = {}) {
  if (beleg.leistung_quelle) return { quelle: beleg.leistung_quelle, belastbar: true };
  if (beleg.kassenbeleg) return { quelle: "Kassa-Datum", belastbar: true };
  if (beleg.leistungszeitraum_von && beleg.leistungszeitraum_bis) return { quelle: "Leistungszeitraum", belastbar: true };
  if (!beleg.leistungsdatum) return { quelle: null, belastbar: false };
  if (beleg.leistungsdatum === beleg.datum) return { quelle: "gleich Rechnungsdatum", belastbar: false };
  return { quelle: "von Hand", belastbar: true };
}

/**
 * @param {object} beleg     PH Rechnung / PH Gutschrift (Entwurf) inkl. positionen
 * @param {object} [kontakt] PH Kontakt (kontaktart, firma, uid, …)
 * @param {object} [firma]   PH Firma (firmenname, uid)
 * @param {object} [einstellungen] PH Faktura Einstellungen (kleinbetragsgrenze_cent, uid_pflicht_ab_cent)
 * @param {{leistungGeprueft?:boolean, uebersteuertUid?:boolean}} [opts]
 * @returns {{ok:boolean, befunde:Array<{id:string, feld:string, tab:string, text:string, blockiert:boolean, uebersteuerbar?:boolean}>, kleinbetrag:boolean, unternehmer:boolean}}
 */
export function pruefePflichtangaben(beleg = {}, kontakt = {}, firma = null, einstellungen = {}, opts = {}) {
  const befunde = [];
  const add = (id, feld, tab, text, blockiert = true, extra = {}) => befunde.push({ id, feld, tab, text, blockiert, ...extra });
  const brutto = Math.abs(Number(beleg.brutto_cent) || 0);
  const klein = brutto <= (Number(einstellungen.kleinbetragsgrenze_cent) || KLEINBETRAG_STANDARD);
  const unternehmer = istUnternehmer(beleg, kontakt);
  const uidAb = Number(einstellungen.uid_pflicht_ab_cent) || UID_AB_STANDARD;

  // Empfänger: Name und Anschrift (entfällt bei Kleinbetrag)
  if (!klein) {
    if (!(beleg.kunde_name || beleg.firma)) add("empfaenger-name", "kunde_name", "uebersicht", "Name des Empfängers fehlt");
    if (!beleg.strasse || !beleg.plz || !beleg.ort) add("empfaenger-anschrift", "strasse", "uebersicht", "Anschrift des Empfängers unvollständig");
  }
  // Aussteller
  // Firmendaten nur prüfen, wenn sie lesbar sind (null = für die Rolle nicht lesbar – Frappe prüft beim Stellen selbst)
  if (firma) {
    if (!firma.firmenname && !firma.name) add("aussteller", "firma", "steuer", "Firmendaten des Ausstellers fehlen (Stammdaten)");
    if (!firma.uid) add("aussteller-uid", "firma", "steuer", "UID des Ausstellers fehlt (Stammdaten)");
  }
  // Positionen: Menge und handelsübliche Bezeichnung
  const pos = (beleg.positionen || []).filter((p) => !p.alternativ && p.art !== "Zwischensumme");
  if (!pos.length) add("positionen", "positionen", "positionen", "Keine Positionen");
  pos.forEach((p, i) => {
    if (p.art === "Text") return;
    if (!String(p.bezeichnung || "").trim()) add(`pos-${i + 1}-bezeichnung`, "positionen", "positionen", `Position ${i + 1}: Bezeichnung fehlt`);
    if (!(Number(p.menge) > 0)) add(`pos-${i + 1}-menge`, "positionen", "positionen", `Position ${i + 1}: Menge fehlt`);
  });
  // Leistungsdatum mit Quelle
  const q = leistungsQuelle(beleg);
  if (!beleg.leistungsdatum && !(beleg.leistungszeitraum_von && beleg.leistungszeitraum_bis) && beleg.art !== "Anzahlungsrechnung") {
    add("leistung", "leistungsdatum", "uebersicht", "Tag der Lieferung oder Leistungszeitraum fehlt");
  } else if (!q.belastbar && beleg.art !== "Anzahlungsrechnung" && !opts.leistungGeprueft) {
    add("leistung-pruefen", "leistungsdatum", "uebersicht", "Leistungsdatum ohne belastbare Quelle – bitte bestätigen", true, { bestaetigbar: true });
  }
  // UID des Empfängers
  const euFirma = beleg.ust_fall === "Innergemeinschaftlich steuerfrei" || beleg.ust_fall === "Reverse Charge";
  if ((unternehmer && brutto > uidAb) || euFirma) {
    if (!beleg.uid_empfaenger) add("uid", "uid_empfaenger", "steuer", "UID des Leistungsempfängers fehlt");
    else if (euFirma && !beleg.uid_geprueft_am && !opts.uebersteuertUid) add("uid-geprueft", "uid_geprueft_am", "steuer", "UID des Empfängers nicht geprüft", true, { uebersteuerbar: true });
  }
  // Hinweistext bei steuerfrei, Steuerschuld Kunde, Ausfuhr, OSS
  if (["Innergemeinschaftlich steuerfrei", "Reverse Charge", "Ausfuhr", "OSS"].includes(beleg.ust_fall) && !String(beleg.ust_hinweistext || "").trim()) {
    add("hinweistext", "ust_hinweistext", "steuer", "Hinweistext zum Steuerfall fehlt");
  }
  // Nur Euro (E9)
  if (beleg.waehrung && beleg.waehrung !== "EUR") add("waehrung", "waehrung", "steuer", "Nur Euro – Fremdwährung noch nicht freigegeben");
  // Teil- und Schlussrechnung: nur vereinnahmte Anzahlungen abgezogen (§ 5.10)
  if (["Teilrechnung", "Schlussrechnung"].includes(beleg.art)) {
    for (const a of beleg.anzahlungen_verrechnet || []) {
      if (a.vereinnahmt === false) add(`anzahlung-${a.anzahlungsrechnung}`, "anzahlungen_verrechnet", "zahlung", `${a.anzahlungsrechnung} ist nicht vollständig bezahlt`);
    }
  }
  const blockierend = befunde.filter((b) => b.blockiert);
  return { ok: blockierend.length === 0, befunde, kleinbetrag: klein, unternehmer };
}
