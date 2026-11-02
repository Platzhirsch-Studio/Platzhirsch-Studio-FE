// Karte für einen Zahlungslink (Anzahlung) – EINBAUPUNKT für das Portal.
// Server-Komponente, nur Darstellung. Daten aus
// depositsForCustomer(customerId) in src/lib/payments/server.js:
//   { id, auftrag, betrag, beschreibung, status, gueltig_bis, href }
// Vorschlag Portal (src/app/[locale]/portal/projekte/[id]/page.js, Portal-Team):
//   const deposits = await depositsForCustomer(portal.customer.id);
//   {deposits.map((d) => <PaymentLinkCard key={d.id} {...d} />)}
// "inkl. USt" bleibt hier fest: Anzahlungen auf einen Auftrag sind mit dem
// Zahlungseingang umsatzsteuerpflichtig (Anzahlungsbesteuerung), unabhängig
// von der offenen Gutschein-Frage Einzweck/Mehrzweck (QA P2-3).
import { SmartLink } from "@/components/ui";

const STATUS = {
  offen: "Offen",
  fehlgeschlagen: "Offen, letzte Zahlung nicht durchgegangen",
  zahlung_ausstehend: "Zahlung unterwegs",
  bezahlt: "Bezahlt",
  abgelaufen: "Link abgelaufen, bitte neu anfordern",
  erstattet: "Erstattet",
  teilerstattet: "Teilweise erstattet",
  pruefen: "Wird geprüft",
};

export default function PaymentLinkCard({ auftrag, betrag, beschreibung, status, href }) {
  const payable = status === "offen" || status === "fehlgeschlagen";
  return (
    <div className="border border-line bg-surface p-6">
      <p className="text-overline uppercase text-text-accent">Anzahlung</p>
      <p className="mt-2 text-title text-text">Auftrag {auftrag}</p>
      {beschreibung && <p className="mt-1 text-body text-text-soft">{beschreibung}</p>}
      <p className="mt-4 text-ui text-text tabular-nums">{betrag} inkl. USt</p>
      <p className="mt-1 text-small text-text-soft">{STATUS[status] || status}</p>
      {payable && href && (
        <SmartLink href={href} className="mt-5 inline-flex min-h-12 items-center bg-action px-6 text-ui text-paper hover:bg-action-hover">
          Anzahlung bezahlen
        </SmartLink>
      )}
    </div>
  );
}
