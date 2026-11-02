// src/lib/wunschliste/groupVoucher.js — Logik des Gemeinschafts-Gutscheins
// einer Wunschliste. Reine Funktionen, keine "@/..."-Importe (node --test).
//
// Ablauf (Doku: qa-screenshots/service/wunschliste-bau.md, Abschnitt
// „Gruppen-Gutschein“; Frappe: ../platzhirsch-frappe-service/wunschliste/README.md):
//
//  1. Schenkende wählen „Gutschein beitragen“. Es entsteht ein Beitrag
//     (model.addContribution) mit Kanal
//       - "anfrage" (VOUCHER_MODE off/anfrage): Status "angefragt". Es wird
//         nichts bezahlt; das Studio meldet sich bei der Person (E-Mail nur
//         im Studio sichtbar) und stellt den Gutschein persönlich aus.
//       - "stripe"  (VOUCHER_MODE=stripe wirksam): Status "offen". Die
//         Zahlung läuft über die BESTEHENDE Gutschein-Kaufstrecke
//         (src/lib/payments/voucherOrder.js). Die Integration ergänzt dort die
//         Checkout-Metadaten aus checkoutMetadata() – heute geschieht das noch
//         nicht, die Kaufstrecke bleibt unverändert.
//  2. Webhook checkout.session.completed (payment_status "paid") →
//     applyPaidEvent(): Beitrag auf "bezahlt", Betrag aus amount_total
//     (der Server-Preis zählt, nie der Vorschlag aus dem Formular).
//     Idempotent: dieselbe Session zählt nur einmal.
//  3. Ein Gutschein für die Beschenkten: Summe aller bezahlten Beiträge
//     (groupSummary().paidTotal). Je Beitrag erzeugt die Kaufstrecke wie
//     heute einen Registereintrag (Code, PDF an die zahlende Person); das
//     Studio fasst sie beim Ausstellen zu EINEM Gutschein auf den Namen der
//     Beschenkten zusammen (Frappe-Aktion „Gemeinschafts-Gutschein ausstellen“).
//     Bis dahin kann eine einzelne Zahlung nach FAGG widerrufen werden
//     (14 Tage); applyRefundEvent() nimmt sie wieder heraus.
//  Offene Rechtsfragen (Einzweck/Mehrzweck, Inhaber des Gutscheins, Widerruf
//  nach dem Zusammenfassen): Marktresearch/digital/features/service-recht-vorschlag.md.

export const METADATA_KIND = "wunschliste_beitrag";

/** Zahlen für die Verwaltungsansicht (nie öffentlich). */
export function groupSummary(record) {
  const list = Array.isArray(record?.contributions) ? record.contributions : [];
  const paid = list.filter((c) => c.status === "bezahlt");
  const requested = list.filter((c) => c.status === "angefragt" || c.status === "offen");
  return {
    count: list.length,
    paidCount: paid.length,
    paidTotal: paid.reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0),
    requestedCount: requested.length,
    pledgedTotal: requested.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
  };
}

/**
 * Metadaten für die Stripe-Checkout-Session eines Beitrags (Stripe: höchstens
 * 50 Schlüssel, Schlüssel ≤ 40, Werte ≤ 500 Zeichen). Keine personenbezogenen
 * Daten, nur Kennungen.
 */
export function checkoutMetadata(record, contribution) {
  return {
    kind: METADATA_KIND,
    wunschliste: String(record.listId),
    wunschliste_ref: String(record.ref),
    beitrag: String(contribution.id),
  };
}

const isOurs = (record, session) =>
  session?.metadata?.kind === METADATA_KIND && session.metadata.wunschliste === record.listId && typeof session.metadata.beitrag === "string";

/**
 * Bestätigte Zahlung (Stripe-Event oder Mock-Event) auf den Beitrag buchen.
 * @returns {boolean} true, wenn sich etwas geändert hat
 */
export function applyPaidEvent(record, event, now = new Date()) {
  if (event?.type !== "checkout.session.completed") return false;
  const session = event.data?.object;
  if (!isOurs(record, session) || session.payment_status !== "paid") return false;
  const c = record.contributions.find((x) => x.id === session.metadata.beitrag);
  if (!c || c.sessionId === session.id) return false;
  c.status = "bezahlt";
  c.channel = "stripe";
  c.sessionId = session.id;
  c.paidAmount = Math.round(Number(session.amount_total) || 0) / 100;
  c.paidAt = now.toISOString();
  record.updatedAt = c.paidAt;
  return true;
}

/** Widerruf/Erstattung (charge.refunded bzw. eigener Mock-Typ) nimmt den Beitrag heraus. */
export function applyRefundEvent(record, { sessionId }, now = new Date()) {
  const c = record.contributions.find((x) => x.sessionId === sessionId);
  if (!c || c.status !== "bezahlt") return false;
  c.status = "erstattet";
  c.refundedAt = now.toISOString();
  record.updatedAt = c.refundedAt;
  return true;
}

/** Mock-Event wie aus Stripe Checkout (nur Tests und Entwicklungs-Mock). */
export function mockPaidEvent(record, contribution, amountEuro, sessionId = `cs_test_mock_${contribution.id}`) {
  return {
    id: `evt_mock_${contribution.id}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        mode: "payment",
        currency: "eur",
        amount_total: Math.round(amountEuro * 100),
        payment_status: "paid",
        metadata: checkoutMetadata(record, contribution),
      },
    },
  };
}
