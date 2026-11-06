// /[locale]/kundenkarte – Platzhirsch Kundenkarte (Stufe 1, ohne Geldwert;
// Inhaber 04.11.2026). Vier Sprachen unter demselben Pfad, index,follow,
// hreflang reziprok, JSON-LD WebPage + BreadcrumbList + FAQPage (gleicher Text
// wie die sichtbare FAQ). Texte: src/lib/kundenkarte/copy.js. Anmeldung mit
// Double-Opt-in über /api/kundenkarte/apply (Mock ohne Backend).
// Kein Bild, keine KI-Grafik: Karten-Visual rein per CSS/SVG (KartenVisual).
import JsonLd from "@/components/Reusable/JsonLd";
import { Breadcrumbs, Button, Container, Eyebrow, Heading } from "@/components/ui";
import KartenVisual from "@/components/Kundenkarte/KartenVisual";
import KundenkarteForm from "@/components/Kundenkarte/KundenkarteForm";
import { Faq, Schritte, VorteileTabelle, faqSchema } from "@/components/Kundenkarte/Abschnitte";
import { KUNDENKARTE_LOCALES, KUNDENKARTE_PATH, KUNDENKARTE_TERMS_PATH, kundenkarteCopy } from "@/lib/kundenkarte/copy";
import { TERMS_STATUS } from "@/lib/kundenkarte/terms";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const pageUrl = (locale) => `${SITE_URL}/${locale}${KUNDENKARTE_PATH}`;
const IN_LANGUAGE = { de: "de-AT", en: "en-GB", fr: "fr-FR", it: "it-IT" };

export function generateStaticParams() {
  return KUNDENKARTE_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const m = kundenkarteCopy(locale).meta;
  return {
    title: `${m.title} | ${SITE_NAME}`,
    description: m.description,
    robots: { index: true, follow: true },
    alternates: { canonical: pageUrl(locale), languages: hreflangLanguages((l) => pageUrl(l)) },
    openGraph: {
      type: "website",
      url: pageUrl(locale),
      title: m.title,
      description: m.description,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
    },
  };
}

export default async function KundenkartePage({ params }) {
  const { locale } = await params;
  const copy = kundenkarteCopy(locale);
  const path = `/${locale}${KUNDENKARTE_PATH}`;
  const url = pageUrl(locale);

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: copy.meta.title,
    description: copy.meta.description,
    inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: homeCrumbLabel(locale), item: `${SITE_URL}/${locale}` },
        { "@type": "ListItem", position: 2, name: copy.crumb, item: url },
      ],
    },
  };

  return (
    <div data-page="kundenkarte" data-terms-status={TERMS_STATUS}>
      <JsonLd data={webPage} />
      <JsonLd data={faqSchema(copy, path, locale)} />

      {/* Hero: Text links, Karte rechts (auf dem Handy darunter). */}
      <section className="bg-surface pt-10 md:pt-14 lg:pt-16" data-kundenkarte-hero="">
        <Container size="page" className="pb-16 md:pb-24">
          <Breadcrumbs className="mb-stack-m" items={[{ label: homeCrumbLabel(locale), href: "/" }, { label: copy.crumb }]} />
          <div className="grid grid-cols-1 items-center gap-y-10 gap-x-grid lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-6">
              <Eyebrow>{copy.hero.eyebrow}</Eyebrow>
              <Heading level={1} size="display-l" className="mt-stack-s text-balance">
                {copy.hero.title}
              </Heading>
              <p className="mt-6 max-w-measure text-lead text-text-soft">{copy.hero.lead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={`${path}#anmeldung`} arrow>
                  {copy.hero.cta}
                </Button>
                <Button href={`${path}#vorteile`} variant="secondary">
                  {copy.hero.ctaSecondary}
                </Button>
              </div>
            </div>
            <div className="min-w-0 lg:col-span-5 lg:col-start-8">
              <KartenVisual stufe="plus" name={copy.hero.cardHolder} nummer="PH-2026-000001" seit="2026" labels={copy.hero} className="mx-auto max-w-[32rem] pt-3" />
            </div>
          </div>
        </Container>
      </section>

      <VorteileTabelle copy={copy} />
      <Schritte copy={copy} />

      <section id="anmeldung" aria-labelledby="kk-form-title" className="scroll-mt-24 border-t border-line bg-surface" data-kundenkarte-anmeldung="">
        <Container size="page" className="py-16 md:py-24">
          <div className="grid grid-cols-1 gap-x-grid gap-y-8 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-4">
              <Eyebrow>{copy.form.eyebrow}</Eyebrow>
              <Heading id="kk-form-title" level={2} className="mt-stack-s text-balance">
                {copy.form.title}
              </Heading>
              <p className="mt-4 max-w-measure text-body text-text-soft">{copy.form.intro}</p>
            </div>
            <div className="min-w-0 lg:col-span-7 lg:col-start-6">
              <KundenkarteForm locale={locale} copy={copy.form} termsHref={`/${locale}${KUNDENKARTE_TERMS_PATH}`} privacyHref={`/${locale}/datenschutz`} />
            </div>
          </div>
        </Container>
      </section>

      <Faq copy={copy} />
    </div>
  );
}
