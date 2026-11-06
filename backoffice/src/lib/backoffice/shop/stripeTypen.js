// Stripe-Ereignisart → Klartext (10-konzept-shop § 4.9). Unbekannt: Rohtyp. Rein.

const TYPEN = {
  "checkout.session.completed": "Bezahlvorgang abgeschlossen",
  "checkout.session.async_payment_succeeded": "Zahlung nachträglich eingegangen",
  "checkout.session.async_payment_failed": "Zahlung nachträglich fehlgeschlagen",
  "checkout.session.expired": "Bezahlvorgang abgelaufen",
  "payment_intent.succeeded": "Stripe-Zahlung eingegangen",
  "payment_intent.payment_failed": "Zahlung fehlgeschlagen",
  "charge.refunded": "Erstattung",
  "charge.succeeded": "Zahlung aktualisiert",
  "charge.updated": "Zahlung aktualisiert",
  "radar.early_fraud_warning.created": "Betrugswarnung",
  "charge.dispute.created": "Zahlungsstreit eröffnet",
  "charge.dispute.updated": "Zahlungsstreit aktualisiert",
  "charge.dispute.closed": "Zahlungsstreit abgeschlossen",
  "payout.paid": "Auszahlung auf dem Bankkonto",
  "payout.sync": "Auszahlung nachgeladen",
};

export function stripeTyp(typ) {
  const t = String(typ || "");
  if (TYPEN[t]) return TYPEN[t];
  if (t.startsWith("review.")) return "Risikoprüfung";
  return t || "–";
}

/** Gruppe für Ansichten: zahlungsstreit · risiko · zahlung · auszahlung · sonst. */
export function stripeGruppe(typ) {
  const t = String(typ || "");
  if (t.startsWith("charge.dispute")) return "zahlungsstreit";
  if (t.startsWith("review.") || t.startsWith("radar.")) return "risiko";
  if (t.startsWith("payout")) return "auszahlung";
  return "zahlung";
}

export const STRIPE_TYPEN = Object.freeze(Object.keys(TYPEN));
