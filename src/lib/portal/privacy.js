// Retention periods and recipients of the customer portal – single source for
// the portal privacy notice (/de/portal/datenschutz) and the consent texts.
// No "server-only": the voice-note consent (client) quotes VOICE_RETENTION.
//
// OWNER_CONFIRMED = false: these are the developer's proposal, aligned with the
// usual Austrian/German retention practice. The owner (and ideally the data
// protection advisor) must confirm them; until then the page shows a
// development note. Changing a value here changes every text at once.

export const OWNER_CONFIRMED = false;

export const SESSION_DAYS = 30;
export const MAGIC_LINK_MINUTES = 15;

export const VOICE_RETENTION = "nach Abschluss des Projekts, spätestens 12 Monate nach der Übergabe";
export const FEEDBACK_RETENTION =
  "für die Dauer des Projekts und danach, soweit sie Teil der Geschäftskorrespondenz sind, für die gesetzliche Aufbewahrungsfrist (in Österreich 7 Jahre, § 132 BAO)";
export const ACCOUNT_RETENTION = "solange Sie Kunde sind; das Portalkonto wird 3 Jahre nach dem letzten Projekt deaktiviert";

export const RECIPIENTS = [
  "Ihr Beratungsteam bei Platzhirsch Home Living",
  "an Ihrem Projekt beteiligte Partnerbetriebe (z. B. Tischler, Elektriker, Installateur, Steinmetz) – nur die für den Auftrag nötigen Angaben wie Name, Adresse, Termin und Planungsdetails",
  "unser Hosting-Anbieter für die Website und das Backoffice-System (ERP auf Basis von Frappe/ERPNext) als Auftragsverarbeiter nach Art. 28 DSGVO",
  "der E-Mail-Versanddienstleister für die Anmelde-E-Mail als Auftragsverarbeiter nach Art. 28 DSGVO",
];
