// Zusätzliche Beschriftungen der Karriereseiten (Inhaber-Auftrag 31.10.2026):
// Sperr-Markierung der Vorschau, Kachel-Fakten, Datenschutz-Hinweis,
// Entgelt-Satz nach § 9 Abs 2 GlBG. Bewusst ein eigenes Modul statt neuer
// Schlüssel in src/messages/*.json (die Dateien bearbeiten andere Teams).
// Rein: keine Pakete, keine "@/"-Aliase.

// Ansprechperson für Bewerbungen (Inhaber-Ergänzung 31.10.2026): alle Stellen
// und die Initiativbewerbung. Kontaktweg bleibt die allgemeine Adresse und
// Telefonnummer (src/lib/site.js) – keine persönliche Mailadresse bekannt.
export const BEWERBUNG_ANSPRECHPERSON = "Harald Menghin";

const T = {
  de: {
    gesperrt: "Gehaltsangabe fehlt – nicht veröffentlichbar",
    vorschau: "Vorschau: Diese Stelle ist öffentlich nicht sichtbar. Vor der Veröffentlichung fehlen:",
    fehlt: {
      entgelt: "Kollektivvertragliches Mindestentgelt mit Hinweis zur Überzahlung (§ 9 Abs 2 GlBG)",
      ausmass: "Beschäftigungsausmaß",
      start: "Arbeitsbeginn",
      leistungen: "Weitere Leistungen des Unternehmens",
    },
    platzhalter: "[vom Inhaber ergänzen]",
    bereich: "Bereich",
    ort: "Ort",
    ausmass: "Ausmaß",
    start: "Beginn",
    entgelt: "Entgelt",
    datenschutzVor: "Wie wir Ihre Bewerbungsdaten verarbeiten, erklärt unsere",
    datenschutzLink: "Datenschutzerklärung",
    telefon: "Telefon",
    ansprechperson: "Ansprechperson",
    zeitraum: { Monat: "Monat", Jahr: "Jahr" },
    entgeltSatz: (kv, betrag, zeitraum) => `Das kollektivvertragliche Mindestentgelt beträgt ${betrag} brutto pro ${zeitraum} (${kv}).`,
    ueberzahlung: "Bereitschaft zur Überzahlung je nach Qualifikation und Erfahrung.",
  },
  en: {
    gesperrt: "Salary details missing – not publishable",
    vorschau: "Preview: this position is not publicly visible. Missing before publication:",
    fehlt: {
      entgelt: "Minimum pay under the collective agreement and note on overpayment (§ 9 (2) GlBG)",
      ausmass: "Working hours (full or part time)",
      start: "Start date",
      leistungen: "Further company benefits",
    },
    platzhalter: "[to be added by the owner]",
    bereich: "Area",
    ort: "Location",
    ausmass: "Hours",
    start: "Start",
    entgelt: "Pay",
    datenschutzVor: "How we process your application data is explained in our",
    datenschutzLink: "privacy policy",
    telefon: "Phone",
    ansprechperson: "Contact person",
    zeitraum: { Monat: "month", Jahr: "year" },
    entgeltSatz: (kv, betrag, zeitraum) => `The minimum pay under the collective agreement is ${betrag} gross per ${zeitraum} (${kv}).`,
    ueberzahlung: "We are willing to pay above this, depending on qualifications and experience.",
  },
  fr: {
    gesperrt: "Rémunération manquante – publication impossible",
    vorschau: "Aperçu : ce poste n’est pas visible publiquement. Avant publication, il manque :",
    fehlt: {
      entgelt: "Salaire minimum conventionnel et mention d’une éventuelle rémunération supérieure (§ 9 al. 2 GlBG)",
      ausmass: "Temps de travail",
      start: "Date de début",
      leistungen: "Autres avantages de l’entreprise",
    },
    platzhalter: "[à compléter par le propriétaire]",
    bereich: "Domaine",
    ort: "Lieu",
    ausmass: "Temps de travail",
    start: "Début",
    entgelt: "Rémunération",
    datenschutzVor: "Le traitement de vos données de candidature est expliqué dans notre",
    datenschutzLink: "politique de confidentialité",
    telefon: "Téléphone",
    ansprechperson: "Interlocuteur",
    zeitraum: { Monat: "mois", Jahr: "an" },
    entgeltSatz: (kv, betrag, zeitraum) => `Le salaire minimum conventionnel s’élève à ${betrag} brut par ${zeitraum} (${kv}).`,
    ueberzahlung: "Rémunération supérieure possible selon qualification et expérience.",
  },
  it: {
    gesperrt: "Retribuzione mancante – non pubblicabile",
    vorschau: "Anteprima: questa posizione non è visibile pubblicamente. Prima della pubblicazione mancano:",
    fehlt: {
      entgelt: "Retribuzione minima da contratto collettivo e indicazione di un’eventuale retribuzione superiore (§ 9 c. 2 GlBG)",
      ausmass: "Orario di lavoro",
      start: "Data di inizio",
      leistungen: "Ulteriori prestazioni dell’azienda",
    },
    platzhalter: "[da completare a cura del titolare]",
    bereich: "Settore",
    ort: "Luogo",
    ausmass: "Orario",
    start: "Inizio",
    entgelt: "Retribuzione",
    datenschutzVor: "Come trattiamo i dati della Sua candidatura è spiegato nella nostra",
    datenschutzLink: "informativa sulla privacy",
    telefon: "Telefono",
    ansprechperson: "Referente",
    zeitraum: { Monat: "mese", Jahr: "anno" },
    entgeltSatz: (kv, betrag, zeitraum) => `La retribuzione minima da contratto collettivo è di ${betrag} lordi al ${zeitraum} (${kv}).`,
    ueberzahlung: "Disponibilità a una retribuzione superiore in base a qualifica ed esperienza.",
  },
};

/** Texte für eine Sprache (Deutsch als Rückfall). */
export function karriereTexte(locale) {
  return T[locale] || T.de;
}

/** Entgelt-Satz für eine vollständige `entgelt`-Angabe, sonst "". */
export function entgeltText(entgelt, locale) {
  const t = karriereTexte(locale);
  if (!entgelt || typeof entgelt.kvMindestBrutto !== "number" || !entgelt.kollektivvertrag) return "";
  const betrag = new Intl.NumberFormat(locale === "de" ? "de-AT" : locale, { style: "currency", currency: "EUR" }).format(entgelt.kvMindestBrutto);
  const satz = t.entgeltSatz(entgelt.kollektivvertrag, betrag, t.zeitraum[entgelt.zeitraum] || t.zeitraum.Monat);
  const u = entgelt.ueberzahlung;
  const zusatz = u === true ? t.ueberzahlung : typeof u === "string" && u.trim() ? u.trim() : "";
  return zusatz ? `${satz} ${zusatz}` : satz;
}
