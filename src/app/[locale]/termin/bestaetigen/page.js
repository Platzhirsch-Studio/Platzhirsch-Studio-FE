// /[locale]/termin/bestaetigen#<referenz>.<zufall> – E-Mail-Adresse bestätigen
// (Double-Opt-in, Link aus der Mail, 30 Minuten gültig). Der Link steht im
// Fragment, ConfirmClient schickt ihn nach einem Klick per POST.
// noindex, Referrer "no-referrer".
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading } from "@/components/ui";
import ConfirmClient from "@/components/Termin/ConfirmClient";
import { TERMIN_LOCALES, terminCopy } from "@/lib/booking/copy";
import { PHONE_DISPLAY } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: terminCopy(locale).confirm.metaTitle,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
  };
}

export default async function BestaetigenPage({ params }) {
  const { locale } = await params;
  if (!TERMIN_LOCALES.includes(locale)) notFound();
  const { mail: _mail, meta: _meta, testraum: _testraum, manage: _manage, einstieg: _einstieg, ...copy } = terminCopy(locale);
  return (
    <Container size="page" className="pt-8 pb-16 md:pt-16 md:pb-24">
      <div className="max-w-[60rem]">
        <Eyebrow>{copy.confirm.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s text-balance">
          {copy.confirm.title}
        </Heading>
        <ConfirmClient locale={locale} copy={copy} phone={PHONE_DISPLAY} />
      </div>
    </Container>
  );
}
