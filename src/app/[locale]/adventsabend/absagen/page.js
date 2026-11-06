// /de/adventsabend/absagen?token=… – Anmeldung zum Adventsabend absagen (Link aus
// der Bestätigungsmail von ph_marketing, events.py absagen_url). Nur Deutsch wie
// der Adventsabend selbst (/en|fr|it/adventsabend → 404, src/proxy.js FOREIGN_GATED_404).
// Das Token geht erst nach einem Klick per POST an /de/service/senden/adventsabend-absagen
// (ph: cancel_event_registration; alt: Postausgang .data/adventsabend/absagen, nur Token-Hash).
// noindex, Referrer "no-referrer".
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container, Eyebrow, Heading } from "@/components/ui";
import LinkAktion from "@/components/Service/LinkAktion";
import { linkCopy } from "@/lib/service/linkAktionenCopy";
import { EMAIL, PHONE_DISPLAY, SITE_NAME } from "@/lib/site";

export async function generateMetadata() {
  return {
    title: `${linkCopy("de").event.metaTitle} | ${SITE_NAME}`,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    referrer: "no-referrer",
  };
}

export default async function AdventsabendAbsagenPage({ params }) {
  const { locale } = await params;
  if (locale !== "de") notFound();
  const copy = linkCopy("de");
  return (
    <Container size="page" className="pt-8 pb-16 md:pt-16 md:pb-24" data-page="adventsabend-absagen">
      <div className="max-w-[60rem]">
        <Eyebrow>{copy.event.eyebrow}</Eyebrow>
        <Heading level={1} className="mt-stack-s text-balance">
          {copy.event.title}
        </Heading>
        <Suspense fallback={<p className="mt-10 text-body text-text-soft">{copy.event.sending}</p>}>
          <LinkAktion art="adventsabend-absagen" locale="de" texts={copy.event} common={copy.common} phone={PHONE_DISPLAY} email={EMAIL} backHref="/de/adventsabend" backLabel={copy.event.back} />
        </Suspense>
      </div>
    </Container>
  );
}
