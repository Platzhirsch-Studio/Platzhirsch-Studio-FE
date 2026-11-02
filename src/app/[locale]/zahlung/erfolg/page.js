// /de/zahlung/erfolg — Rücksprung nach Stripe Checkout (success_url mit
// ?session_id={CHECKOUT_SESSION_ID}). Zeigt den Stand aus unserer Ablage
// (vom Webhook gesetzt), nie Namen, Adressen oder Codes. Ohne Session-Id
// ein neutraler Dank. Immer noindex, nur Deutsch, nicht verlinkt.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading, Lead, SmartLink } from "@/components/ui";
import AutoRefresh from "@/components/Payments/AutoRefresh";
import { NOINDEX } from "@/lib/commerce/mode";
import { formatEuro } from "@/lib/commerce/priceRules";
import { voucherPriceLabel } from "@/lib/commerce/voucherTerms";
import { paymentStatus } from "@/lib/payments/server";

export const metadata = { title: "Danke | Platzhirsch Home Living", robots: NOINDEX };

const link = "text-text underline underline-offset-4 hover:decoration-2";

function copyFor(s) {
  if (!s) {
    return {
      title: "Danke für Ihren Besuch",
      lead: "Wenn Sie gerade bezahlt haben, kommt die Bestätigung in Kürze per E-Mail. Bei Fragen erreichen Sie uns unter +43 5574 46255.",
    };
  }
  const sum = formatEuro(s.summe_cent / 100);
  const what = s.art === "gutschein" ? `${s.anzahl === 1 ? "Ihr Gutschein" : `Ihre ${s.anzahl} Gutscheine`} über ${sum}` : `Ihre Anzahlung über ${sum}`;
  switch (s.status) {
    case "bezahlt":
      return {
        title: "Danke, die Zahlung ist angekommen",
        lead:
          s.art === "gutschein"
            ? s.mail === "fehlgeschlagen"
              ? `${what}: Die E-Mail mit dem PDF ist noch nicht verschickt. Wir kümmern uns darum und melden uns bei Ihnen, Sie erreichen uns auch unter +43 5574 46255.`
              : `${what}: Das PDF ist per E-Mail an Sie unterwegs. Die Rechnung senden wir gesondert.`
            : `${what} zu Auftrag ${s.referenz} ist bestätigt. Wir weisen sie auf der Rechnung aus.`,
      };
    case "zahlung_ausstehend":
      return {
        title: "Danke, Ihre Zahlung ist unterwegs",
        lead: `${what}: Bei Lastschrift dauert die Bestätigung einige Werktage. ${s.art === "gutschein" ? "Den Gutschein senden wir, sobald die Zahlung bestätigt ist." : "Wir melden uns, sobald sie bestätigt ist."}`,
      };
    case "fehlgeschlagen":
      return { title: "Die Zahlung ist nicht durchgegangen", lead: `${what}: Es wurde nichts abgebucht. Sie können es erneut versuchen oder uns anrufen: +43 5574 46255.` };
    case "erstattet":
    case "teilerstattet":
      return { title: "Die Zahlung wurde erstattet", lead: "Der Betrag geht über das ursprüngliche Zahlungsmittel zurück." };
    default:
      return { title: "Einen Moment bitte", lead: `${what}: Wir bestätigen die Zahlung gerade. Das dauert meist nur wenige Sekunden.`, wait: true };
  }
}

export default async function ZahlungErfolgPage({ params, searchParams }) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;
  await connection();
  if (locale !== "de") notFound();
  const status = typeof sessionId === "string" ? await paymentStatus(sessionId) : null;
  const copy = copyFor(status);
  return (
    <div className="bg-surface pt-16 pb-section text-text md:pt-24">
      <Container size="text">
        <p className="text-overline uppercase text-text-accent">{status?.art === "anzahlung" ? "Anzahlung" : status ? "Gutschein" : "Zahlung"}</p>
        <Heading level={1} size="display-l" className="mt-stack-s">
          {copy.title}
        </Heading>
        <div role="status">
          <Lead className="mt-stack-m">{copy.lead}</Lead>
        </div>
        {status?.test && <p className="mt-6 border-l-2 border-line-strong pl-4 text-small text-text-soft">Testmodus: Es wurde kein echtes Geld bewegt.</p>}
        {copy.wait && (
          <>
            <AutoRefresh />
            <p className="mt-6 text-small text-text-soft">
              Die Seite aktualisiert sich von selbst.{" "}
              <a href={`?session_id=${encodeURIComponent(sessionId)}`} className={link}>
                Status aktualisieren
              </a>
            </p>
          </>
        )}
        {status && (
          <dl className="mt-10 max-w-md divide-y divide-line border-y border-line text-ui">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-text-soft">{status.art === "anzahlung" ? "Auftrag" : "Bestellnummer"}</dt>
              <dd className="tabular-nums">{status.referenz}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              {/* Anzahlung: USt mit Zahlungseingang (Anzahlungsbesteuerung). Gutschein: je nach Einzweck/Mehrzweck (voucherTerms.js). */}
              <dt className="text-text-soft">{status.art === "anzahlung" ? "Betrag inkl. USt" : voucherPriceLabel().total}</dt>
              <dd className="tabular-nums">{formatEuro(status.summe_cent / 100)}</dd>
            </div>
          </dl>
        )}
        <div className="mt-12 space-y-3 text-body">
          <p>Wir freuen uns auf Ihren Besuch im Showroom in Lochau, Landstraße 11.</p>
          <p className="flex flex-wrap gap-x-6 gap-y-2">
            <SmartLink href="/" className={link}>
              Zur Startseite
            </SmartLink>
            <SmartLink href="/kontakt" className={link}>
              Kontakt
            </SmartLink>
            {status?.art === "gutschein" && (
              <SmartLink href="/zahlung/widerruf" className={link}>
                Vertrag widerrufen
              </SmartLink>
            )}
          </p>
        </div>
      </Container>
    </div>
  );
}
