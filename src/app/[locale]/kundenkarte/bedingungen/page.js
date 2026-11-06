// /[locale]/kundenkarte/bedingungen – Teilnahmebedingungen der Kundenkarte.
// ENTWURF (TERMS_STATUS "entwurf", Freigabe Kanzlei offen): sichtbar, aber
// noindex,follow und nicht in der Sitemap; Eyebrow „Entwurf“. Deutscher Text
// in allen vier Sprachen (lang="de"), Hinweis in der Seitensprache – wie
// /agb und /widerruf. Text: src/lib/kundenkarte/terms.js.
import LegalProse from "@/components/Impressum/LegalProse";
import PageHeader from "@/components/UberUns/PageHeader";
import GermanOnlyNotice, { germanText } from "@/components/Legal/GermanOnlyNotice";
import { KUNDENKARTE_LOCALES, KUNDENKARTE_PATH, KUNDENKARTE_TERMS_PATH, kundenkarteCopy } from "@/lib/kundenkarte/copy";
import { TERMS_SECTIONS, TERMS_STATUS, TERMS_SUBTITLE, TERMS_TITLE, termsStandDe } from "@/lib/kundenkarte/terms";
import { AGB_PATH } from "@/lib/legal/agb";
import { DEFAULT_OG_IMAGE, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const pageUrl = (locale) => `${SITE_URL}/${locale}${KUNDENKARTE_TERMS_PATH}`;

export function generateStaticParams() {
  return KUNDENKARTE_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const description = `${TERMS_SUBTITLE} – ${SITE_NAME}.`;
  return {
    title: `${TERMS_TITLE} | ${SITE_NAME}`,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: pageUrl(locale), languages: hreflangLanguages((l) => pageUrl(l)) },
    openGraph: { type: "website", url: pageUrl(locale), title: TERMS_TITLE, description, siteName: SITE_NAME, locale: ogLocale(locale), images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }] },
  };
}

export default async function BedingungenPage({ params }) {
  const { locale } = await params;
  const copy = kundenkarteCopy(locale);
  const entwurf = TERMS_STATUS === "entwurf";
  return (
    <div data-page="kundenkarte-bedingungen" data-terms-status={TERMS_STATUS}>
      <PageHeader
        width="text"
        breadcrumbs={[{ label: homeCrumbLabel(locale), href: "/" }, { label: copy.crumb, href: KUNDENKARTE_PATH }, { label: germanText(TERMS_TITLE, locale) }]}
        eyebrow={entwurf ? "Entwurf – Freigabe Kanzlei offen" : undefined}
        title={germanText(TERMS_TITLE, locale)}
        lead={locale !== "de" ? <GermanOnlyNotice locale={locale} /> : TERMS_SUBTITLE}
      />
      <LegalProse>
        <p>
          <strong>Stand: {termsStandDe()}</strong>
          {entwurf && <span className="text-text-soft"> · Entwurf, noch nicht freigegeben</span>}
        </p>
        <nav aria-label="Inhalt" className="mt-8 border-t border-line pt-6 print:hidden">
          <p className="text-small uppercase tracking-wide text-text-soft">Inhalt</p>
          <ol className="mt-3 space-y-1">
            {TERMS_SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        {TERMS_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="mt-10 scroll-mt-24" data-terms-abschnitt={s.id}>
            <h2>{s.title}</h2>
            {s.blocks.map((b, i) => (
              <p key={i}>{b}</p>
            ))}
          </section>
        ))}
        <p className="mt-12 border-t border-line pt-6 text-small text-text-soft print:hidden">
          Stand {termsStandDe()} · <a href={`/${locale}${KUNDENKARTE_PATH}`}>Kundenkarte</a> · <a href={`/${locale}${AGB_PATH}`}>AGB</a> · <a href={`/${locale}/datenschutz`}>Datenschutzerklärung</a> · <a href={`/${locale}/impressum`}>Impressum</a>
        </p>
      </LegalProse>
    </div>
  );
}
