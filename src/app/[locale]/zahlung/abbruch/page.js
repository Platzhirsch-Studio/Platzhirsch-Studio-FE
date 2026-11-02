// /de/zahlung/abbruch — Rücksprung, wenn die Zahlung bei Stripe abgebrochen
// wurde (cancel_url). Es wurde nichts abgebucht. Immer noindex, nur Deutsch.
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading, Lead, SmartLink } from "@/components/ui";
import { NOINDEX } from "@/lib/commerce/mode";

export const metadata = { title: "Zahlung abgebrochen | Platzhirsch Home Living", robots: NOINDEX };

const TOKEN_RE = /^AZ-[A-Z0-9]{4}-[A-Z0-9]{4}\.[A-Za-z0-9_-]{32}$/;
const button = "inline-flex min-h-12 items-center justify-center bg-action px-8 text-ui text-paper transition-colors duration-(--duration-micro) ease-quiet hover:bg-action-hover";
const link = "text-text underline underline-offset-4 hover:decoration-2";

export default async function ZahlungAbbruchPage({ params, searchParams }) {
  const { locale } = await params;
  const { art, link: token } = await searchParams;
  await connection();
  if (locale !== "de") notFound();
  const back = art === "anzahlung" && typeof token === "string" && TOKEN_RE.test(token) ? `/zahlung/anzahlung/${token}` : art === "gutschein" ? "/gutscheine" : null;
  return (
    <div className="bg-surface pt-16 pb-section text-text md:pt-24">
      <Container size="text">
        <p className="text-overline uppercase text-text-accent">Zahlung</p>
        <Heading level={1} size="display-l" className="mt-stack-s">
          Die Zahlung wurde nicht abgeschlossen
        </Heading>
        <Lead className="mt-stack-m">Es wurde nichts abgebucht. Eine offene Bestellung ohne Zahlung verfällt von selbst.</Lead>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          {back && (
            <SmartLink href={back} className={button}>
              {art === "anzahlung" ? "Zurück zur Anzahlung" : "Zurück zu den Gutscheinen"}
            </SmartLink>
          )}
          <SmartLink href="/kontakt" className={link}>
            Lieber persönlich? Zum Kontakt
          </SmartLink>
        </div>
        <p className="mt-10 text-small text-text-soft">Telefon +43 5574 46255 · info@platzhirsch.studio</p>
      </Container>
    </div>
  );
}
