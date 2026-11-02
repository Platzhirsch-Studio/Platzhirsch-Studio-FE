import UberUnsPage from "@/components/UberUns/uberuns";
import { fetchTeamData } from "@/lib/api/fetchTeam";
import { clampDescription, hreflangLanguages, ogLocale } from "@/lib/seo/pageMetadata";
import JsonLd from "@/components/Reusable/JsonLd";
import { IN_LANGUAGE, ORGANIZATION_ID, WEBSITE_ID } from "@/lib/seo/structuredData";
import FactsBlock from "@/components/UberUns/FactsBlock";
import SeoFaq from "@/components/Reusable/SeoFaq";
import { aboutVars } from "@/lib/seo/aboutFacts";
import { keepRangesIn } from "@/components/UberUns/softHyphens";

function getBaseUrl(locale) {
    const domain = "https://platzhirsch.studio";
    // Always include the locale in the URL, even for 'de'
    return `${domain}/${locale}`;
}

function getPartnerPageUrl(locale) {
    const baseUrl = getBaseUrl(locale);

    switch (locale) {
        case "it":
            return `${baseUrl}/chi-siamo/platzhirsch`;
        case "en":
            return `${baseUrl}/about-us/platzhirsch`;
        case "fr":
            return `${baseUrl}/a-propos/platzhirsch`;
        case "de":
            return `${baseUrl}/ueber-uns/platzhirsch`;
        default:
            return `${baseUrl}/ueber-uns/platzhirsch`;
    }
}

export async function generateMetadata({ params }) {
    const { locale } = await params;
    const PAGE_URL = getPartnerPageUrl(locale);

    const metaByLocale = {
        de: {
            title: "Über uns: Studio und Café in Lochau | Platzhirsch",
            description: "Platzhirsch Home Living: Einrichtungsstudio mit Café in Lochau am Bodensee – Designermöbel von Minotti, Poliform, Rimadesio und weiteren Marken.",
            ogAlt: "Platzhirsch Home Living Showroom in Lochau – Designermöbel und Wohnkonzepte",
        },
        en: {
            title: "About us: studio and café in Lochau | Platzhirsch",
            description: "Get to know Platzhirsch Home Living: a designer furniture showroom in Lochau featuring Minotti, Poliform and Rimadesio.",
            ogAlt: "Platzhirsch Home Living showroom in Lochau – designer furniture and interior concepts",
        },
        fr: {
            title: "À propos : studio et café à Lochau | Platzhirsch",
            description: "Découvrez Platzhirsch Home Living : showroom de mobilier design à Lochau avec Minotti, Poliform et Rimadesio.",
            ogAlt: "Showroom Platzhirsch Home Living à Lochau – mobilier design et concepts d'intérieur",
        },
        it: {
            title: "Chi siamo: studio e caffè a Lochau | Platzhirsch",
            description: "Scoprite Platzhirsch Home Living: showroom di mobili di design a Lochau con Minotti, Poliform e Rimadesio.",
            ogAlt: "Showroom Platzhirsch Home Living a Lochau – mobili di design e concetti d'arredo",
        },
    };

    const m = metaByLocale[locale] || metaByLocale.de;
    // Rat 9,5 A15 (Auftrag T6 → T4): Description ≤ 150 als ganzer Satz.
    const description = clampDescription(m.description);

    return {
        title: m.title || "Platzhirsch Home Living",
        description,
        robots: { index: true, follow: true },
        alternates: {
            canonical: PAGE_URL,
            languages: hreflangLanguages((l) => getPartnerPageUrl(l))
        },
        openGraph: {
            title: m.title,
            description,
            url: PAGE_URL,
            siteName: "Platzhirsch Home Living",
            images: [
                {
                    url: "/Images/UberUns/white-sofas.jpg",
                    width: 1200,
                    height: 630,
                    alt: m.ogAlt,
                },
            ],
            locale: ogLocale(locale),
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: m.title,
            description,
            images: ["/Images/UberUns/white-sofas.jpg"],
        },
    };

}

export default async function UberUns({ params }) {
    const { locale } = await params;
    // Descriptive H1 (SEO), unchanged since the "PLATZHIRSCH" fix.
    const pageTitle =
        locale == "it"
            ? "Platzhirsch Home Living – Studio d'arredamento a Lochau"
            : locale == "en"
                ? "Platzhirsch Home Living – Interior Design Studio in Lochau"
                : locale == "fr"
                    ? "Platzhirsch Home Living – Studio d'aménagement à Lochau"
                    : "Platzhirsch Home Living – Einrichtungsstudio in Lochau";

    // Team portraits for the "Die Menschen im Haus" teaser (same cached fetch as /team).
    const team = await fetchTeamData();

    // Rat 9,5 (C6, seo 12): AboutPage about the organisation defined once in
    // the layout (no second Organization node). The BreadcrumbList comes from
    // the page header (breadcrumbSchema).
    const PAGE_URL = getPartnerPageUrl(locale);
    const aboutSchema = {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "@id": `${PAGE_URL}/#webpage`,
        url: PAGE_URL,
        name: pageTitle,
        inLanguage: IN_LANGUAGE[locale] || IN_LANGUAGE.de,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        mainEntity: { "@id": ORGANIZATION_ID },
    };
    return (
        <>
            <JsonLd data={aboutSchema} />
            {/* SEO-Team A (GEO W2/W5): „Auf einen Blick“ + FAQ (FAQPage) vor dem Schluss-CTA. */}
            <UberUnsPage title={pageTitle} team={team}>
                <FactsBlock locale={locale} />
                <SeoFaq locale={locale} page="about" pageUrl={PAGE_URL} vars={keepRangesIn(aboutVars(locale))} />
            </UberUnsPage>
        </>
    );
}
