// /de/zahlung/widerruf — „Vertrag widerrufen“ (§ 13a FAGG, seit 01.10.2026).
// Verfügbar, solange Online-Käufe möglich sind oder eine bezahlte Bestellung
// jünger als 30 Tage existiert; Entwicklung zusätzlich mit ?zahlung=mock.
// Immer noindex, nur Deutsch.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading, Lead } from "@/components/ui";
import WithdrawalForm from "@/components/Payments/WithdrawalForm";
import { NOINDEX, voucherDevMock } from "@/lib/commerce/mode";
import { withdrawalOpen } from "@/lib/payments/server";

export const metadata = { title: "Vertrag widerrufen | Platzhirsch Home Living", robots: NOINDEX };

export default async function WiderrufPage({ params, searchParams }) {
  const { locale } = await params;
  const { zahlung, bestellung } = await searchParams;
  await connection();
  if (locale !== "de") notFound();
  const devMock = voucherDevMock(process.env, typeof zahlung === "string" ? zahlung : null);
  if (!devMock && !(await withdrawalOpen())) notFound();
  const initialRef = typeof bestellung === "string" && /^G-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(bestellung) ? bestellung : "";
  return (
    <div className="bg-surface pt-16 pb-section text-text md:pt-24">
      <Container size="text">
        <p className="text-overline uppercase text-text-accent">Gutscheine</p>
        <Heading level={1} size="display-l" className="mt-stack-s">
          Vertrag widerrufen
        </Heading>
        <Lead className="mt-stack-m">
          Sie haben einen Gutschein online gekauft und möchten den Vertrag widerrufen? Innerhalb von 14 Tagen ab Erhalt geht das ohne Angabe von Gründen, solange der Gutschein nicht eingelöst
          ist.
        </Lead>
        <div className="mt-12 border-t border-line-strong pt-8">
          <WithdrawalForm initialRef={initialRef} mock={devMock} />
        </div>
        <p className="mt-10 text-small text-text-soft">Sie können auch per E-Mail an info@platzhirsch.studio oder per Brief an Landstraße 11, 6911 Lochau widerrufen.</p>
      </Container>
    </div>
  );
}
