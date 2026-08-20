// produkte/[title]/page.js
import { Suspense } from "react";
import { notFound } from "next/navigation";
import MarkenItemBanner from "@/components/MarkenItems/markenItemBanner";
import { fetchProdukteData } from "@/lib/api/fetchProdukteData";
import Produkte from "@/components/Produkte/produkte";
import { generateSlug } from "@/lib/slugify";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import {
  fetchProductsKeywords,
  getProductsOGImage,
} from "@/lib/api/Keywords/fetchProductsKeywords";
import { ROUTES } from "@/utils/routing";
import { Link } from "@/i18n/navigation";
import { buildBrandNode, brandModifiedDate } from "@/lib/seo/brandSchema";
import { localizeCategory } from "@/lib/seo/productCategories";

// Localized country names for the brand's origin line. `herkunftsland` is stored in
// German; unknown/empty values simply drop the origin sentence.
const COUNTRY_I18N = {
  "Italien": { de: "Italien", en: "Italy", fr: "Italie", it: "Italia" },
  "Deutschland": { de: "Deutschland", en: "Germany", fr: "Allemagne", it: "Germania" },
  "Belgien": { de: "Belgien", en: "Belgium", fr: "Belgique", it: "Belgio" },
  "Niederlande": { de: "den Niederlanden", en: "the Netherlands", fr: "Pays-Bas", it: "Paesi Bassi" },
  "Großbritannien": { de: "Großbritannien", en: "Great Britain", fr: "Grande-Bretagne", it: "Gran Bretagna" },
  "Griechenland": { de: "Griechenland", en: "Greece", fr: "Grèce", it: "Grecia" },
  "Spanien": { de: "Spanien", en: "Spain", fr: "Espagne", it: "Spagna" },
  "USA": { de: "den USA", en: "the USA", fr: "États-Unis", it: "Stati Uniti" },
  "Frankreich": { de: "Frankreich", en: "France", fr: "France", it: "Francia" },
  "Dänemark": { de: "Dänemark", en: "Denmark", fr: "Danemark", it: "Danimarca" },
};

// Up to 4 distinct, localized categories this brand offers (by frequency), derived
// from the product list — used to make each listing's intro genuinely different.
function getListingCategories(productList, brand, locale) {
  const counts = {};
  for (const p of productList) {
    let raw = (p?.kategories || "").trim();
    if (!raw) continue;
    if (brand) {
      const esc = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      raw = raw.replace(new RegExp(`[\\s-]*${esc}\\s*$`, "i"), "");
    }
    raw = raw.replace(/[-\s]+$/g, "").trim();
    if (!raw) continue;
    const loc = localizeCategory(raw, locale);
    counts[loc] = (counts[loc] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 4);
}

// Unique, localized commercial intro for the brand product-listing page. Deliberately
// NOT the story page's beschreibung/produkte (that would duplicate content) — it is
// generated from the brand name, its real localized categories and origin, so every
// brand's copy differs. Fixes the thin brand-listing pages and targets
// "[brand] kaufen / [brand] [category]".
function buildBrandListingIntro(marke, productList, locale) {
  const brand = (marke?.name1 || "").trim();
  const cats = getListingCategories(productList, brand, locale);
  const more = { de: "und mehr", en: "and more", fr: "et plus", it: "e altro" }[locale] || "und mehr";
  const catStr = cats.length ? (cats.length > 3 ? `${cats.slice(0, 3).join(", ")} ${more}` : cats.join(", ")) : "";
  const year = String(marke?.grundungsjahr || "").trim();
  const c = COUNTRY_I18N[(marke?.herkunftsland || "").trim()];

  const T = {
    de: {
      heading: `${brand} bei Platzhirsch Studio`,
      main: `${brand} kaufen bei Platzhirsch Studio – Ihrem Einrichtungsstudio für exklusive Designermöbel in Lochau am Bodensee (Vorarlberg).${catStr ? ` In unserer Ausstellung entdecken Sie ${brand} ${catStr} zum Anfassen und Erleben.` : ""}`,
      service: `Wir begleiten Sie mit persönlicher Einrichtungsberatung aus einer Hand – von der Planung bis zur Lieferung und Montage in ganz Österreich.`,
      crossborder: `Lochau liegt direkt an der Schweizer Grenze und in guter Reichweite zu Süddeutschland und Norditalien. Auch Kundinnen und Kunden aus der Schweiz und Italien sind herzlich willkommen – besuchen Sie unsere Ausstellung und bestellen Sie direkt vor Ort.`,
      origin: c ? `${brand} steht für exklusives Design aus ${c.de}${year ? `, gegründet ${year}` : ""}.` : "",
    },
    en: {
      heading: `${brand} at Platzhirsch Studio`,
      main: `Buy ${brand} at Platzhirsch Studio – your interior studio for exclusive designer furniture in Lochau on Lake Constance (Vorarlberg).${catStr ? ` In our showroom you can discover ${brand} ${catStr} in person.` : ""}`,
      service: `We support you with personal interior consulting from a single source – from planning to delivery and assembly throughout Austria.`,
      crossborder: `Lochau sits right on the Swiss border and within easy reach of southern Germany and northern Italy. Customers from Switzerland and Italy are warmly welcome too – visit our showroom and order directly on site.`,
      origin: c ? `${brand} stands for exclusive design from ${c.en}${year ? `, founded in ${year}` : ""}.` : "",
    },
    fr: {
      heading: `${brand} chez Platzhirsch Studio`,
      main: `Achetez ${brand} chez Platzhirsch Studio – votre studio d'aménagement pour un mobilier design exclusif à Lochau, au bord du lac de Constance (Vorarlberg).${catStr ? ` Dans notre showroom, découvrez ${brand} ${catStr} en personne.` : ""}`,
      service: `Nous vous accompagnons avec un conseil personnalisé d'une seule main – de la planification à la livraison et au montage dans toute l'Autriche.`,
      crossborder: `Lochau se trouve juste à la frontière suisse et à portée de l'Allemagne du Sud et de l'Italie du Nord. Les clients de Suisse et d'Italie sont également les bienvenus – visitez notre showroom et commandez sur place.`,
      origin: c ? `${brand}, ${c.fr} – design exclusif${year ? ` fondé en ${year}` : ""}.` : "",
    },
    it: {
      heading: `${brand} da Platzhirsch Studio`,
      main: `Acquista ${brand} da Platzhirsch Studio – il tuo studio d'arredo per mobili di design esclusivi a Lochau, sul Lago di Costanza (Vorarlberg).${catStr ? ` Nel nostro showroom scopri ${brand} ${catStr} dal vivo.` : ""}`,
      service: `Ti seguiamo con una consulenza d'arredo personale da un unico interlocutore – dalla progettazione alla consegna e al montaggio in tutta l'Austria.`,
      crossborder: `Lochau si trova proprio al confine svizzero e a breve distanza dalla Germania meridionale e dall'Italia settentrionale. Anche i clienti dalla Svizzera e dall'Italia sono i benvenuti – visitate il nostro showroom e ordinate direttamente in loco.`,
      origin: c ? `${brand}, ${c.it} – design esclusivo${year ? ` fondato nel ${year}` : ""}.` : "",
    },
  };
  const t = T[locale] || T.de;
  return { heading: t.heading, paragraphs: [t.main, t.service, t.crossborder, t.origin].filter(Boolean) };
}

// Helper functions for URL generation
function getBaseUrl(locale) {
  const domain = "https://platzhirsch.studio";
  // Always include the locale in the URL, even for 'de'
  return `${domain}/${locale}`;
}

function getProduktePageUrl(locale) {
  const baseUrl = getBaseUrl(locale);

  switch (locale) {
    case "it":
      return `${baseUrl}/produkte`;
    case "en":
      return `${baseUrl}/produkte`;
    case "fr":
      return `${baseUrl}/produkte`;
    case "de":
      return `${baseUrl}/produkte`;
    default:
      return `${baseUrl}/produkte`;
  }
}

function getProdukteDetailPageUrl(locale, title) {
  const baseUrl = getBaseUrl(locale);
  const produkteBaseUrl = getProduktePageUrl(locale);

  return `${produkteBaseUrl}/${title}`;
}

// ISR (revalidate below), NOT force-dynamic: force-dynamic re-fetched the backend on
// every request, causing 502s under crawl (Sistrix "incorrect_pages_on_sitemap").
export async function generateStaticParams() {
  const data = await fetchRawMarkenData();
  const filterData = data?.filter((marke) => marke.status === "Aktiv");

  // Generate params for all locales
  const locales = ['de', 'en', 'fr', 'it'];
  const params = [];

  for (const locale of locales) {
    for (const marke of filterData || []) {
      params.push({
        locale,
        title: generateSlug(marke.name1),
      });
    }
  }

  return params;
}

// Function to generate metadata for SEO
export async function generateMetadata({ params }) {
  const { locale, title } = await params;

  try {
    const data = await fetchRawMarkenData();
    const marke = data?.find((m) => generateSlug(m.name1) === title);

    if (!marke) notFound();

    const PAGE_URL = getProdukteDetailPageUrl(locale, title);
    // const BASE_URL = getBaseUrl(locale);

    // Fetch keywords for image
    const productsKeywords = await fetchProductsKeywords();
    const defaultImage = getProductsOGImage(productsKeywords);

    // Get localized titles and descriptions
    const getLocalizedTitle = () => {
      switch (locale) {
        case "it": return `Acquista ${marke.name1} in Austria | Platzhirsch Studio`;
        case "en": return `Buy ${marke.name1} in Austria | Platzhirsch Studio`;
        case "fr": return `Acheter ${marke.name1} en Autriche | Platzhirsch Studio`;
        default: return `${marke.name1} kaufen in Österreich | Platzhirsch Studio`;
      }
    };

    const getFallbackDescription = () => {
      switch (locale) {
        case "it": return `Scopri ${marke.name1} da Platzhirsch Studio in Vorarlberg – design esclusivo e consulenza personale. Showroom in loco, consegna in tutta l'Austria.`;
        case "en": return `Discover ${marke.name1} at Platzhirsch Studio in Vorarlberg – exclusive design and personal consulting. Showroom on site, delivery throughout Austria.`;
        case "fr": return `Découvrez ${marke.name1} chez Platzhirsch Studio au Vorarlberg – design exclusif et conseil personnalisé. Showroom sur place, livraison dans toute l'Autriche.`;
        default: return `Entdecken Sie ${marke.name1} bei Platzhirsch Studio in Vorarlberg – exklusives Design und persönliche Beratung. Ausstellung vor Ort, Lieferung in ganz Österreich.`;
      }
    };

    // Product-listing (commercial intent) description — deliberately NOT the brand's
    // metadata_description_* (that copy is reserved for the brand story page at
    // /ueber-uns/marken/[marke]; sharing it produced duplicate meta snippets).
    const getLocalizedDescription = () => getFallbackDescription();

    return {
      title: getLocalizedTitle(),
      description: getLocalizedDescription(),
      // All four locales are indexed — Italy + Switzerland (it/fr) are target markets
      // and the listing title/chrome are localized. hreflang below maps each locale.
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: {
          'de': getProdukteDetailPageUrl('de', title),
          'en': getProdukteDetailPageUrl('en', title),
          'fr': getProdukteDetailPageUrl('fr', title),
          'it': getProdukteDetailPageUrl('it', title),
          'x-default': getProdukteDetailPageUrl('de', title),

        }
      },
      openGraph: {
        type: "website",
        url: PAGE_URL,
        title: getLocalizedTitle(),
        description: getLocalizedDescription(),
        siteName: "Platzhirsch Studio",
        images: [
          {
            url: marke?.bild_anhagen?.[0]?.bild_anhagen || defaultImage || "/default-product-image.jpg",
            width: 1200,
            height: 630,
            alt: marke.name1,
          },
        ],
        locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
      },
      twitter: {
        card: "summary_large_image",
        title: getLocalizedTitle(),
        description: getLocalizedDescription(),
        images: [marke?.bild_anhagen?.[0]?.bild_anhagen || defaultImage || "/default-product-image.jpg"],
      },
    };
  } catch (error) {
    // NEXT_ control-flow signals (the notFound() above for a genuinely missing
    // brand) propagate untouched → real 404.
    if (error?.digest?.startsWith?.("NEXT_")) throw error;
    // A transient PvOne outage must NOT 404 a real brand-listing page — that
    // de-indexes it. Re-throw so the route returns a retriable HTTP 500 (Google
    // retries 5xx and keeps the URL) instead of silently removing it. Mirrors the
    // product-detail page's handling.
    console.error("Error generating metadata:", error);
    throw error;
  }
}

export default async function ProdukteDetailPage(props) {
  const { title, locale } = await props.params;

  const data = await fetchRawMarkenData();

  const marke = data?.find((m) => generateSlug(m.name1) === title);
  if (!marke || marke.status?.toLowerCase() !== "aktiv") {
    notFound(); // 👈 block inactive brand pages
  }

  const titleOne = locale == "it" ? "Prodotti" : locale == "en" ? "Products" : locale == "fr" ? "Produits" : "Produkte";
  const Home = locale == "it" ? "Casa" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const BASE_URL = getBaseUrl(locale);
  const PAGE_URL = getProdukteDetailPageUrl(locale, title);
  const produkteBaseUrl = getProduktePageUrl(locale);
  const productPath = ROUTES.produkte[locale] ? `${ROUTES.produkte[locale]}` : `/produkte`;


  const BannerInfo = {
    image: marke?.bild_anhagen?.[0]?.bild_anhagen ? `/cms${marke.bild_anhagen[0].bild_anhagen}` : "/default-product-image.jpg",
    links: [
      { linkName: Home, link: `/` },
      { linkName: titleOne, link: productPath },
      { linkName: marke?.name1, link: `/produkte/${title}` },
    ],
    // Listing H1 = "{Brand} Produkte" so it differs from the brand-story page H1
    // ("{Brand}") — the two pages no longer share the same <h1>.
    title: `${marke?.name1} ${titleOne}`,
  };

  const marken = marke?.name1;
  const produkte = await fetchProdukteData({ marken });

  // This brand's active products, as an ItemList wired into the CollectionPage
  // below. Each ListItem links to its detail page (URL identical to that page's
  // canonical), giving Google the full product set for the brand-listing page —
  // the commercial target for "[brand] kaufen / [brand] [category]". Kept
  // lightweight (position + name + url, no nested Product) because the detail
  // pages already carry full Product schema, so the payload stays small even for
  // large catalogues.
  const productList = (Array.isArray(produkte) ? produkte : []).filter(
    (p) => p?.path_field && p?.status === "Aktiv"
  );

  // Localized commercial intro for this brand-listing page (fixes thin content).
  const intro = buildBrandListingIntro(marke, productList, locale);

  // ✅ JSON-LD Structured Data for Product Brand Page. `about` is the SAME shared
  // Brand entity as the brand-story page (identical @id + sameAs → Google merges
  // them). dateModified uses the real CMS content date, not new Date() (which
  // churned every deploy and got ignored); omitted when no CMS timestamp exists.
  const brandModified = brandModifiedDate(marke);
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${PAGE_URL}/#webpage`,
    url: PAGE_URL,
    name: `${marke?.name1} ${titleOne}`,
    description: `Entdecken Sie die hochwertigen Produkte von ${marke?.name1} bei Platzhirsch Studio. Exklusive Designmöbel für Ihr Zuhause und Büro.`,
    inLanguage: locale === "it" ? "it-IT" : locale === "en" ? "en-US" : locale === "fr" ? "fr-FR" : "de-AT",
    isPartOf: { "@id": "https://platzhirsch.studio/#website" },
    about: buildBrandNode(marke, title),
    ...(brandModified ? { dateModified: brandModified } : {}),
    ...(productList.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: productList.length,
            itemListElement: productList.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.produkt_name,
              url: `${PAGE_URL}/${p.path_field}`,
            })),
          },
        }
      : {}),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: Home, item: BASE_URL },
        { "@type": "ListItem", position: 2, name: titleOne, item: produkteBaseUrl },
        { "@type": "ListItem", position: 3, name: marke?.name1, item: PAGE_URL },
      ],
    },
  };

  const activeItems = data
    ?.filter(
      (item) =>
        item.status === "Aktiv" &&
        (item.es_gibt_produkte === 1 || item.es_gibt_produkte === "1")
    )
    .map((item) => item.name1);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <MarkenItemBanner info={BannerInfo} />
      {/* Cross-link commercial listing → brand story page. */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <Link
          href={`/ueber-uns/marken/${title}`}
          locale={locale}
          className="inline-flex items-center gap-2 border-2 border-[#d1b250] rounded-[3px] px-6 py-2.5 text-[#30373e] text-sm font-medium uppercase tracking-wide transition-all duration-300 hover:bg-[#d1b250] hover:text-white"
        >
          {locale === "it"
            ? `Scopri di più su ${marke.name1}`
            : locale === "en"
              ? `Learn more about ${marke.name1}`
              : locale === "fr"
                ? `En savoir plus sur ${marke.name1}`
                : `Mehr über ${marke.name1}`}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
      {/* Localized commercial intro — unique per brand (brand + real categories +
          origin), not the story page's text, so no duplicate content. */}
      <section className="max-w-7xl mx-auto px-6 pt-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#30373e] mb-4">{intro.heading}</h2>
        <div className="space-y-3 max-w-4xl text-[#30373e]/80 leading-relaxed">
          {intro.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>
      {/* <Produkte> is a client component using useSearchParams (filter state); with
          ISR (no force-dynamic) it must sit in a Suspense boundary or the build fails
          the static prerender. */}
      <Suspense fallback={null}>
        <Produkte produkte={produkte} brands={activeItems} />
      </Suspense>
    </div>
  );
}

export const revalidate = 3600;