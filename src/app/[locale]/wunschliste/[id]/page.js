// /<locale>/wunschliste/<shareId> — öffentliche Ansicht einer geteilten
// Wunschliste (Service 10, Inhaber-Entscheidung 13). Nur über den geheimen
// Link erreichbar: noindex/nofollow, kein Referrer, nicht in Sitemap/Menü.
// Unbekannter, widerrufener oder abgelaufener Link → notFound() (HTTP 404,
// ./not-found.js mit Hilfetext). Keine Preise, keine Namen von Schenkenden.
// Doku: qa-screenshots/service/wunschliste-bau.md
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Button, Container, Eyebrow, Heading, Lead } from "@/components/ui";
import PublicItems from "@/components/Wunschliste/PublicItems";
import ContributionForm from "@/components/Wunschliste/ContributionForm";
import { getPublic } from "@/lib/wunschliste/service";
import { isToken } from "@/lib/wunschliste/ids";
import { contributionChannel, wunschlisteAvailable } from "@/lib/wunschliste/mode";
import { REPORT_EMAIL, WUNSCHLISTE_INHABER } from "@/lib/wunschliste/config";
import { formatDate, localeOf, wlCopyFrom } from "@/lib/wunschliste/copy";
import { voucherMode } from "@/lib/commerce/mode";
import { ADDRESS, EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF, SITE_NAME, openingHoursLine } from "@/lib/site";
import { ROUTES } from "@/utils/routing";

export const dynamic = "force-dynamic";

const ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false },
};

async function copyFor(locale) {
  const root = await getTranslations({ locale });
  return wlCopyFrom(localeOf(locale), root);
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const c = await copyFor(locale);
  // Bewusst ohne den Titel der Liste: Tab, Verlauf und Link-Vorschau nennen
  // keine Namen (Datenminimierung).
  return {
    title: { absolute: `${c("public.metaTitle")} | ${SITE_NAME}` },
    robots: ROBOTS,
    referrer: "no-referrer",
    openGraph: {
      title: `${c("public.metaTitle")} | ${SITE_NAME}`,
      siteName: SITE_NAME,
      type: "website",
    },
  };
}

export default async function WunschlistePage({ params }) {
  const { locale: rawLocale, id } = await params;
  await connection();
  const locale = localeOf(rawLocale);
  if (!wunschlisteAvailable() || !isToken(id)) notFound();
  const list = await getPublic(id);
  if (!list) notFound();

  const c = await copyFor(locale);
  const channel = contributionChannel(voucherMode());
  const cafeOffer = WUNSCHLISTE_INHABER.cafeOffer?.[locale] || "";
  const contact = WUNSCHLISTE_INHABER.contactPerson;
  const beratung = `${ROUTES.beratung[locale] || ROUTES.beratung.de}?produkt=${encodeURIComponent(c("public.togetherTopic", { ref: list.ref }))}`;
  const date = formatDate(list.date, locale);

  return (
    <div className="bg-surface text-text">
      <Container className="pt-10 pb-section md:pt-14">
        <header className="max-w-text">
          <Eyebrow>{c("public.overline", { occasion: c(`occasion.${list.occasion}`) })}</Eyebrow>
          <Heading level={1} className="mt-stack-s text-balance wrap-break-word">
            {list.title}
          </Heading>
          {date && <p className="mt-4 text-ui text-text-soft">{c("public.dateLine", { date })}</p>}
          {list.message && <Lead className="mt-stack-m whitespace-pre-line wrap-break-word">{list.message}</Lead>}
          <p className="mt-stack-m max-w-measure text-body text-text-soft text-pretty">{c("public.intro")}</p>
        </header>

        <PublicItems shareId={id} items={list.items} />

        <div className="mt-section grid gap-section lg:grid-cols-12 lg:gap-x-grid">
          {channel !== "aus" && (
            <section aria-labelledby="wl-voucher" className="lg:col-span-7">
              <Heading level={2} id="wl-voucher">
                {c("public.voucherHeading")}
              </Heading>
              <p className="mt-stack-s max-w-measure text-body text-text-soft text-pretty">{c("public.voucherText")}</p>
              <div className="mt-stack-m">
                {channel === "stripe" && (
                  <>
                    {/* Die Gutscheinseite gibt es nur auf Deutsch. */}
                    <Button href="/gutscheine" locale="de" hrefLang={locale === "de" ? undefined : "de"} arrow>
                      {c("public.voucherStripeCta")}
                    </Button>
                    <p className="mt-4 max-w-measure text-small text-text-soft">{c("public.voucherStripeNote", { ref: list.ref })}</p>
                  </>
                )}
                {channel === "anfrage" && <ContributionForm shareId={id} />}
                {channel === "kontakt" && (
                  <>
                    <p className="max-w-measure text-body text-text">{c("public.voucherContact", { ref: list.ref })}</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button variant="secondary" href={PHONE_HREF}>
                        {c("public.call")}: {PHONE_DISPLAY}
                      </Button>
                      <Button variant="secondary" href={`${EMAIL_HREF}?subject=${encodeURIComponent(c("public.togetherTopic", { ref: list.ref }))}`}>
                        {c("public.write")}: {EMAIL}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          <section aria-labelledby="wl-together" className={channel === "aus" ? "lg:col-span-7" : "lg:col-span-4 lg:col-start-9"}>
            <div className="border-t border-line-strong pt-8">
              <Heading level={2} size="title" id="wl-together">
                {c("public.togetherHeading")}
              </Heading>
              <p className="mt-stack-s text-body text-text-soft text-pretty">{c("public.togetherText")}</p>
              {cafeOffer && <p className="mt-4 text-body text-text">{cafeOffer}</p>}
              <address className="mt-6 not-italic text-ui text-text">
                {SITE_NAME}
                <br />
                {ADDRESS.street}, {ADDRESS.postalCode} {ADDRESS.city}
                <br />
                <span className="text-small text-text-soft">{openingHoursLine(locale)}</span>
              </address>
              {contact && <p className="mt-4 text-small text-text-soft">{c("public.contactPerson", { name: contact })}</p>}
              <Button variant="secondary" href={beratung} className="mt-6 w-full sm:w-auto">
                {c("public.togetherCta")}
              </Button>
            </div>
          </section>
        </div>

        <footer className="mt-section border-t border-line pt-6">
          <p className="max-w-measure text-small text-text-soft">{c("public.privacyNote")}</p>
          <p className="mt-2 text-small text-text-soft">
            {c("public.refLabel")}: <span className="tabular text-text">{list.ref}</span>
          </p>
          {/* Missbrauch melden (QA Technik P2-3): freie Texte stehen auf unserer Domain. */}
          <p className="mt-2 max-w-measure text-small text-text-soft">
            {c("public.reportText")}{" "}
            <a className="underline underline-offset-4 hover:text-text" href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(c("public.reportSubject", { ref: list.ref }))}`}>
              {c("public.reportLink")}
            </a>
          </p>
        </footer>
      </Container>
    </div>
  );
}
