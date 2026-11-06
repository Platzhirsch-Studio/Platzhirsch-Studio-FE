// /[locale]/newsletter/bestaetigen?token=… – Newsletter-Anmeldung bestätigen
// (Double-Opt-in, Link aus der Mail; Pfad = ph_marketing Einstellung bestaetigen_pfad).
// LinkAktion schickt das Token erst nach einem Klick per POST an
// /<locale>/service/senden/newsletter-bestaetigen (ph: confirm_newsletter).
// noindex, Referrer "no-referrer" (das Token steht in der URL).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading } from "@/components/ui";
import LinkAktion from "@/components/Service/LinkAktion";
import { LINK_LOCALES, linkCopy } from "@/lib/service/linkAktionenCopy";
import { EMAIL, PHONE_DISPLAY, SITE_NAME } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: `${linkCopy(locale).confirm.metaTitle} | ${SITE_NAME}`,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
  };
}

export default async function NewsletterBestaetigenPage({ params }) {
  const { locale } = await params;
  if (!LINK_LOCALES.includes(locale)) notFound();
  const copy = linkCopy(locale);
  return (
    <Container size="page" className="pt-8 pb-16 md:pt-16 md:pb-24" data-page="newsletter-bestaetigen">
      <div className="max-w-[60rem]">
        <Eyebrow>{copy.confirm.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s text-balance">
          {copy.confirm.title}
        </Heading>
        <Suspense fallback={<p className="mt-10 text-body text-text-soft">{copy.confirm.sending}</p>}>
          <LinkAktion art="newsletter-bestaetigen" locale={locale} texts={copy.confirm} common={copy.common} phone={PHONE_DISPLAY} email={EMAIL} backHref={`/${locale}`} />
        </Suspense>
      </div>
    </Container>
  );
}
