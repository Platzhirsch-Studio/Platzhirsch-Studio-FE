// /[locale]/termin/verwalten#<token> – Termin ansehen, verschieben, absagen.
// Der signierte Link steht im Fragment (erreicht nie ein Server-Log),
// ManageClient schickt ihn per POST. noindex, Referrer "no-referrer".
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading } from "@/components/ui";
import ManageClient from "@/components/Termin/ManageClient";
import { TERMIN_LOCALES, terminCopy } from "@/lib/booking/copy";
import { PHONE_DISPLAY } from "@/lib/site";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: terminCopy(locale).manage.metaTitle,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
  };
}

export default async function VerwaltenPage({ params }) {
  const { locale } = await params;
  if (!TERMIN_LOCALES.includes(locale)) notFound();
  const { mail: _mail, meta: _meta, testraum: _testraum, confirm: _confirm, einstieg: _einstieg, ...copy } = terminCopy(locale);
  return (
    <Container size="page" className="py-16 md:py-24">
      <div className="max-w-[60rem]">
        <Eyebrow>{copy.manage.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s text-balance">
          {copy.manage.title}
        </Heading>
        <ManageClient locale={locale} copy={copy} phone={PHONE_DISPLAY} />
      </div>
    </Container>
  );
}
