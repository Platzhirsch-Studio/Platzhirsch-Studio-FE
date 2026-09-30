import SinglePageBanner from "@/components/Reusable/singlePageSlider";
import Uberuns from "@/components/UberUns/uberuns";
import Austellung from "@/components/UberUns/austellung";
import { ROUTES } from "@/utils/routing";

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
            title: "Über uns | Platzhirsch Home Living Lochau",
            description: "Lernen Sie Platzhirsch Home Living kennen: Showroom für exklusive Designermöbel in Lochau mit Minotti, Poliform und Rimadesio.",
            ogAlt: "Platzhirsch Home Living Showroom in Lochau – Designermöbel und Wohnkonzepte",
        },
        en: {
            title: "About Us | Platzhirsch Home Living Lochau",
            description: "Get to know Platzhirsch Home Living: a designer furniture showroom in Lochau featuring Minotti, Poliform and Rimadesio.",
            ogAlt: "Platzhirsch Home Living showroom in Lochau – designer furniture and interior concepts",
        },
        fr: {
            title: "À propos | Platzhirsch Home Living Lochau",
            description: "Découvrez Platzhirsch Home Living : showroom de mobilier design à Lochau avec Minotti, Poliform et Rimadesio.",
            ogAlt: "Showroom Platzhirsch Home Living à Lochau – mobilier design et concepts d'intérieur",
        },
        it: {
            title: "Chi siamo | Platzhirsch Home Living Lochau",
            description: "Scoprite Platzhirsch Home Living: showroom di mobili di design a Lochau con Minotti, Poliform e Rimadesio.",
            ogAlt: "Showroom Platzhirsch Home Living a Lochau – mobili di design e concetti d'arredo",
        },
    };

    const m = metaByLocale[locale] || metaByLocale.de;

    return {
        title: m.title || "Platzhirsch Home Living",
        description: m.description,
        robots: { index: true, follow: true },
        alternates: {
            canonical: PAGE_URL,
            languages: {
                'de-AT': getPartnerPageUrl('de'),
                'de': getPartnerPageUrl('de'),
                'en': getPartnerPageUrl('en'),
                'fr-FR': getPartnerPageUrl('fr'),
                'it-IT': getPartnerPageUrl('it'),
                'x-default': getPartnerPageUrl('de'),

            }
        },
        openGraph: {
            title: m.title,
            description: m.description,
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
            locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: m.title,
            description: m.description,
            images: ["/Images/UberUns/white-sofas.jpg"],
        },
    };

}

export default async function UberUns({ params }) {
    const { locale } = await params;
    const partnerPath = ROUTES.partner[locale] ? `${ROUTES.platzhirsch[locale]}` : `/ueber-uns/platzhirsch`;

    const linkNameOne =
        locale == "it"
            ? "CHI SIAMO"
            : locale == "en"
                ? "ABOUT US"
                : locale == "fr"
                    ? "À PROPOS"
                    : "ÜBER UNS";

    const linkNameTwo = "PLATZHIRSCH";

    const Home =
        locale == "it"
            ? "Casa "
            : locale == "en"
                ? "Home"
                : locale == "fr"
                    ? "Accueil"
                    : "Home";


    const BannerInfo = {
        image: "/Images/UberUns/white-sofas.jpg",
        links: [
            {
                linkName: Home,
                link: "/",
            },
            {
                linkName: linkNameOne,

            },
            {
                linkName: linkNameTwo,
                link: partnerPath

            },
        ],
        title: linkNameTwo,
    };


    return (
        <div>
            <SinglePageBanner info={BannerInfo} />
            <Uberuns />
            <Austellung />
        </div>
    );
}
