// Shared vocabulary of the portal. No "server-only" here: client components
// (e.g. labels in the navigation) may import these constants.

/** Project lifecycle shown as the status timeline, in order. */
export const PROJECT_STEPS = [
  { key: "anfrage", label: "Anfrage" },
  { key: "planung", label: "Planung" },
  { key: "angebot", label: "Angebot" },
  { key: "auftrag", label: "Auftrag" },
  { key: "bestellung", label: "Bestellung beim Hersteller" },
  { key: "lieferung", label: "Lieferung" },
  { key: "montage", label: "Montage" },
  { key: "uebergabe", label: "Übergabe" },
];
export const PROJECT_STEP_KEYS = PROJECT_STEPS.map((s) => s.key);

/** Document types (mapped 1:1 to ERPNext doctypes, see adapters/frappe.js). */
export const DOCUMENT_TYPES = {
  angebot: { label: "Angebot", plural: "Angebote", doctype: "Quotation" },
  auftragsbestaetigung: { label: "Auftragsbestätigung", plural: "Auftragsbestätigungen", doctype: "Sales Order" },
  lieferschein: { label: "Lieferschein", plural: "Lieferscheine", doctype: "Delivery Note" },
  rechnung: { label: "Rechnung", plural: "Rechnungen", doctype: "Sales Invoice" },
};
export const DOCUMENT_TYPE_KEYS = Object.keys(DOCUMENT_TYPES);

export const APPOINTMENT_KINDS = {
  beratung: "Beratung",
  aufmass: "Aufmaß",
  planung: "Planungsgespräch",
  lieferung: "Lieferung",
  montage: "Montage",
  uebergabe: "Übergabe",
};

export const TRADES = {
  tischler: "Tischler",
  elektriker: "Elektriker",
  installateur: "Installateur",
  steinmetz: "Steinmetz",
  maler: "Maler",
  bodenleger: "Bodenleger",
};

/**
 * Internal marker of the first portal round (still found in a persisted dev
 * store .data/portal/demo.json). Never shown to customers any more – see
 * amountLabel(). Einhängen 31.10.2026 (Kundentext-Wächter: no "[… Inhaber
 * festzulegen]" in anything a customer can see).
 */
export const PRICE_PLACEHOLDER = "[Preis vom Inhaber festzulegen]";

/** What the portal shows while a document has no amount: no invented prices. */
export const AMOUNT_ON_REQUEST = "auf Anfrage";

/** Display value of a document amount (number/string), else "auf Anfrage". */
export function amountLabel(doc) {
  if (doc?.amount != null) return String(doc.amount);
  const note = doc?.amountNote;
  return note && note !== PRICE_PLACEHOLDER && !note.startsWith("[") ? note : AMOUNT_ON_REQUEST;
}

export function stepIndex(key) {
  return PROJECT_STEP_KEYS.indexOf(key);
}
