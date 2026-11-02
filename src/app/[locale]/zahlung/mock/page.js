// /de/zahlung/mock?session=cs_mock_… — simulierte Bezahlseite (Mock-Modus).
// Nur außerhalb der Produktion und nur für eine im Mock angelegte Session,
// sonst 404. Ersetzt in Tests die gehostete Stripe-Seite; es fließt kein Geld.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading } from "@/components/ui";
import MockCheckout from "@/components/Payments/MockCheckout";
import { NOINDEX } from "@/lib/commerce/mode";
import { formatEuro } from "@/lib/commerce/priceRules";
import { isProduction } from "@/lib/payments/config";
import { mockSession } from "@/lib/payments/server";

export const metadata = { title: "Bezahlseite (Mock)", robots: NOINDEX };

export default async function MockPayPage({ params, searchParams }) {
  const { locale } = await params;
  const { session } = await searchParams;
  await connection();
  if (locale !== "de" || isProduction(process.env)) notFound();
  const s = await mockSession(session);
  if (!s) notFound();
  const done = s.status === "complete";
  return (
    <div className="bg-surface-raised pt-16 pb-section text-text md:pt-24">
      <Container size="text">
        <div role="note" className="border-l-2 border-line-strong bg-stone px-5 py-4 text-small">
          Mock der Stripe-Bezahlseite. Nur Entwicklung und Tests, es fließt kein Geld.
        </div>
        <Heading level={1} size="display-m" className="mt-10">
          Bezahlseite (simuliert)
        </Heading>
        <dl className="mt-8 max-w-md divide-y divide-line border-y border-line bg-surface text-ui">
          {s.line_items.map((li, i) => (
            <div key={i} className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-text-soft">
                {li.quantity} × {li.name}
              </dt>
              <dd className="tabular-nums">{formatEuro((li.quantity * li.unit_amount) / 100)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt>Gesamt</dt>
            <dd className="tabular-nums">{formatEuro(s.amount_total / 100)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-small text-text-soft">
          {done ? `Ergebnis bisher: ${s.ausgang}. Spätere Ereignisse simulieren:` : "Ausgang der Zahlung wählen:"}
        </p>
        <div className="mt-4">
          <MockCheckout session={s.id} done={done} />
        </div>
      </Container>
    </div>
  );
}
