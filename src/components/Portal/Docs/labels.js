// Labels, tones and small helpers for the portal areas Dokumente, Termine,
// Produktpass, Gewerke and Anfragen. No "server-only": client forms use them.
import { APPOINTMENT_KINDS, DOCUMENT_TYPES, TRADES } from "@/lib/portal/constants";

export const DOCS_BASE = "/de/portal";

/** Document status -> label + badge tone. Payment wording only for invoices. */
export function documentStatus(doc) {
  if (doc.type === "rechnung") {
    if (doc.status === "bezahlt") return { label: "Bezahlt", tone: "neutral" };
    return { label: "Offen", tone: "gold" };
  }
  const map = {
    neu: { label: "Neu", tone: "new" },
    gelesen: { label: "Gelesen", tone: "neutral" },
    angenommen: { label: "Angenommen", tone: "neutral" },
    offen: { label: "Offen", tone: "gold" },
    bezahlt: { label: "Erledigt", tone: "neutral" },
  };
  return map[doc.status] || { label: doc.status, tone: "neutral" };
}

export const documentTypeLabel = (type, plural = false) =>
  DOCUMENT_TYPES[type] ? (plural ? DOCUMENT_TYPES[type].plural : DOCUMENT_TYPES[type].label) : type;

/** Appointment kinds; "service" is not (yet) in the core constants. */
export const KIND_LABELS = { ...APPOINTMENT_KINDS, service: "Service" };
export const kindLabel = (kind) => KIND_LABELS[kind] || kind;

export const APPOINTMENT_STATUS = {
  bestaetigt: { label: "Bestätigt", tone: "neutral" },
  angefragt: { label: "Noch nicht bestätigt", tone: "gold" },
  abgesagt: { label: "Abgesagt", tone: "neutral" },
};

export const tradeLabel = (trade) => TRADES[trade] || trade;

export const TRADE_STATUS_ORDER = ["offen", "geplant", "in_arbeit", "erledigt"];
export const TRADE_STATUS = {
  offen: { label: "Offen", tone: "neutral" },
  geplant: { label: "Geplant", tone: "gold" },
  in_arbeit: { label: "In Arbeit", tone: "gold" },
  erledigt: { label: "Erledigt", tone: "neutral" },
};

export const ITEM_STATUS = {
  geplant: "In Planung",
  angeboten: "Angeboten",
  bestellt: "Beim Hersteller bestellt",
  geliefert: "Geliefert",
  montiert: "Montiert",
};

/** Requests that can be started from a product pass. */
export const PASS_REQUESTS = {
  service: { label: "Service anfragen", hint: "Reparatur, Nachjustieren, Pflege oder Ersatzteil." },
  neubezug: { label: "Neubezug anfragen", hint: "Neuer Stoff oder neues Leder für Ihr Stück." },
  inzahlungnahme: { label: "Inzahlungnahme anfragen", hint: "Wir prüfen, ob wir das Stück beim Kauf eines neuen in Zahlung nehmen." },
};

export const APPOINTMENT_CHANGE_REASONS = {
  verschieben: "Termin verschieben",
  zeitfenster: "Anderes Zeitfenster am selben Tag",
  absagen: "Termin absagen",
  sonstiges: "Sonstiges",
};

export const ROOMS = ["Wohnzimmer", "Küche", "Esszimmer", "Schlafzimmer", "Bad", "Arbeitszimmer", "Garten & Terrasse", "Ganzes Haus / Wohnung", "Gewerbe / Objekt", "Yacht"];

// Customer budget brackets (the customer's own frame, not our prices).
export const BUDGETS = {
  "": "Keine Angabe",
  "bis-10k": "bis 10.000 €",
  "10k-30k": "10.000 – 30.000 €",
  "30k-75k": "30.000 – 75.000 €",
  "ueber-75k": "über 75.000 €",
  offen: "Noch offen – gerne Beratung",
};

export const TIMEFRAMES = {
  "": "Keine Angabe",
  bald: "In den nächsten 3 Monaten",
  halbjahr: "In 3 bis 6 Monaten",
  spaeter: "Später als in 6 Monaten",
};

export const CONTACT_OPTIONS = { email: "E-Mail", telefon: "Telefon", termin: "Termin im Showroom" };

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";
