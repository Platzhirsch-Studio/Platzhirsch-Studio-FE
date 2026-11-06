// /[locale]/kundenkarte/bestaetigen?token=<antrag>.<geheimnis> – E-Mail-Adresse
// bestätigen (Double-Opt-in, Link aus der Mail, 48 Stunden gültig).
// ConfirmClient schickt das Token erst nach einem Klick per POST.
// noindex, Referrer "no-referrer" (das Token steht in der URL).
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading } from "@/components/ui";
import ConfirmClient from "@/components/Kundenkarte/ConfirmClient";
import { KUNDENKARTE_LOCALES, KUNDENKARTE_PATH, kundenkarteCopy } from "@/lib/kundenkarte/copy";
import { PHONE_DISPLAY, SITE_NAME } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: `${kundenkarteCopy(locale).confirm.metaTitle} | ${SITE_NAME}`,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
  };
}

export default async function BestaetigenPage({ params }) {
  const { locale } = await params;
  if (!KUNDENKARTE_LOCALES.includes(locale)) notFound();
  const copy = kundenkarteCopy(locale);
  return (
    <Container size="page" className="pt-8 pb-16 md:pt-16 md:pb-24" data-page="kundenkarte-bestaetigen">
      <div className="max-w-[60rem]">
        <Eyebrow>{copy.confirm.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s text-balance">
          {copy.confirm.title}
        </Heading>
        <Suspense fallback={<p className="mt-10 text-body text-text-soft">{copy.confirm.sending}</p>}>
          <ConfirmClient locale={locale} copy={copy} phone={PHONE_DISPLAY} portalHref="/de/portal/kundenkarte" formHref={`/${locale}${KUNDENKARTE_PATH}#anmeldung`} />
        </Suspense>
      </div>
    </Container>
  );
}
