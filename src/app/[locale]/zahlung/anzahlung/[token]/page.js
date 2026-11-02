// /de/zahlung/anzahlung/<token> — Zahlungslink für eine Anzahlung
// (ANZAHLUNG_MODE=stripe). Der Token ist mit PAYMENTS_LINK_SECRET signiert;
// die Seite selbst ändert nichts (Link-Vorschauen in Mailprogrammen sind
// harmlos). Erst "Anzahlung bezahlen" erzeugt die Checkout-Session.
// Immer noindex, nur Deutsch.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading, Lead, SmartLink } from "@/components/ui";
import PayButton from "@/components/Payments/PayButton";
import { NOINDEX, anzahlungMode } from "@/lib/commerce/mode";
import { mockActive } from "@/lib/payments/config";
import { depositView } from "@/lib/payments/server";

export const metadata = { title: "Anzahlung | Platzhirsch Home Living", robots: NOINDEX, referrer: "no-referrer" };

const dateOf = (iso) => new Date(iso).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Vienna" });

export default async function AnzahlungPage({ params }) {
  const { locale, token } = await params;
  await connection();
  if (locale !== "de" || anzahlungMode() !== "stripe") notFound();
  const d = await depositView(token);
  if (!d) notFound();
  const open = d.status === "offen" || d.status === "fehlgeschlagen";
  return (
    <div className="bg-surface pt-16 pb-section text-text md:pt-24">
      <Container size="text">
        <p className="text-overline uppercase text-text-accent">Anzahlung</p>
        <Heading level={1} size="display-l" className="mt-stack-s">
          Anzahlung zu Auftrag {d.auftrag}
        </Heading>
        <Lead className="mt-stack-m">
          {open
            ? "Wie besprochen: Hier zahlen Sie die Anzahlung zu Ihrem Auftrag. Die Zahlung läuft über die Bezahlseite von Stripe."
            : d.status === "bezahlt"
              ? "Diese Anzahlung ist bezahlt. Danke."
              : d.status === "zahlung_ausstehend"
                ? "Ihre Zahlung ist unterwegs. Bei Lastschrift dauert die Bestätigung einige Werktage."
                : "Dieser Link ist nicht mehr gültig. Bitte melden Sie sich bei uns, wir senden Ihnen gerne einen neuen."}
        </Lead>

        <dl className="mt-10 max-w-md divide-y divide-line border-y border-line text-ui">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-text-soft">Auftrag</dt>
            <dd className="tabular-nums">{d.auftrag}</dd>
          </div>
          {d.beschreibung && (
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-text-soft">Leistung</dt>
              <dd className="text-right">{d.beschreibung}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 py-3">
            <dt>Anzahlung inkl. USt</dt>
            <dd className="tabular-nums">{d.betrag}</dd>
          </div>
          {open && (
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-text-soft">Link gültig bis</dt>
              <dd className="tabular-nums">{dateOf(d.gueltig_bis)}</dd>
            </div>
          )}
        </dl>

        {open && (
          <div className="mt-10 space-y-4">
            <PayButton endpoint={`/api/payments/link/${encodeURIComponent(token)}`} label="Anzahlung bezahlen" mock={mockActive(process.env)} />
            <ul className="max-w-measure space-y-2 text-small text-text-soft">
              <li>Die Anzahlung weisen wir auf der Rechnung zu Ihrem Auftrag aus. Von Stripe erhalten Sie eine Zahlungsbestätigung.</li>
              <li>Kartendaten erreichen uns nicht.</li>
            </ul>
          </div>
        )}
        {d.testmodus && <p className="mt-6 border-l-2 border-line-strong pl-4 text-small text-text-soft">Testmodus: Es wird kein echtes Geld bewegt.</p>}
        <p className="mt-12 text-body">
          Fragen zum Auftrag?{" "}
          <SmartLink href="/kontakt" className="text-text underline underline-offset-4 hover:decoration-2">
            Kontakt
          </SmartLink>{" "}
          oder +43 5574 46255.
        </p>
      </Container>
    </div>
  );
}
