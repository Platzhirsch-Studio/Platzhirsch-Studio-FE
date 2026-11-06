// /[locale]/newsletter/abmelden?token=… – Newsletter abbestellen (Link aus jeder
// Mail; Pfad = ph_marketing Einstellung abmelden_pfad). Ohne Token: Abmeldung
// mit der E-Mail-Adresse (Antwort immer gleich, keine Auskunft über den Verteiler).
// Token/Adresse gehen erst nach einem Klick per POST an
// /<locale>/service/senden/newsletter-abmelden (ph: unsubscribe; alt: Postausgang).
// Die One-Click-Abmeldung aus dem Mail-Client bleibt /api/newsletter/abmelden-1klick.
// noindex, Referrer "no-referrer".
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading } from "@/components/ui";
import LinkAktion from "@/components/Service/LinkAktion";
import { LINK_LOCALES, linkCopy } from "@/lib/service/linkAktionenCopy";
import { EMAIL, PHONE_DISPLAY, SITE_NAME } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: `${linkCopy(locale).unsubscribe.metaTitle} | ${SITE_NAME}`,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
  };
}

export default async function NewsletterAbmeldenPage({ params }) {
  const { locale } = await params;
  if (!LINK_LOCALES.includes(locale)) notFound();
  const copy = linkCopy(locale);
  return (
    <Container size="page" className="pt-8 pb-16 md:pt-16 md:pb-24" data-page="newsletter-abmelden">
      <div className="max-w-[60rem]">
        <Eyebrow>{copy.unsubscribe.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s text-balance">
          {copy.unsubscribe.title}
        </Heading>
        <Suspense fallback={<p className="mt-10 text-body text-text-soft">{copy.unsubscribe.sending}</p>}>
          <LinkAktion art="newsletter-abmelden" locale={locale} texts={copy.unsubscribe} common={copy.common} phone={PHONE_DISPLAY} email={EMAIL} emailFallback backHref={`/${locale}`} />
        </Suspense>
      </div>
    </Container>
  );
}
