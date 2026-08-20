// export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import MarkenItemBanner from "@/components/MarkenItems/markenItemBanner";
import ProdukteDetails from "@/components/ProdukteDetails/ProdukteDetails";
import RelatedProducts from "@/components/RelatedProducts/RelatedProducts";
import ProductDescriptionTabs from "@/components/InformationProduct/InformationProduct";
import DimensionProdukte from "@/components/DimensionProdukte/DimenstionProdukte";
import { generateSlug } from "@/lib/slugify";
import { fetchAllProducts, fetchProductByPathField } from "@/lib/api/fetchProdukteDetails";
import { fetchProductDimensions } from "@/lib/api/fetchProdukteDimension";
import { fetchRelatedProducts } from "@/lib/api/fetchRelatedProducts";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import {
  fetchProductsKeywords,
  getProductsOGImage,
} from "@/lib/api/Keywords/fetchProductsKeywords";
import { localizeCategory } from "@/lib/seo/productCategories";

// Helper functions for URL generation
function getBaseUrl(locale) {
  // Always include the locale in the URL, even for 'de'
  return `/${locale}`;
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

function getProdukteDetailPageUrl(locale, markenName, productPath) {
  const produkteBaseUrl = getProduktePageUrl(locale);

  return `${produkteBaseUrl}/${generateSlug(markenName)}/${productPath}`;
}

// The backend stores `kategories` as "{Category}-{Marke}" (e.g. "Betten-Poliform").
// Return just the category label ("Betten") — it's the differentiator between
// same-named variants (bed/chair/table share one produkt_name like "CURVE"), so
// it's what keeps <title> and <h1> unique and adds a real category keyword.
function getCategoryLabel(produkt, locale = "de") {
  // Hybrid source of truth. 1) Prefer the CMS translation when the product API
  // exposes it (dedicated Categories fields category_name_en/_fr/_it). Once the
  // backend joins those onto the product response, the owner's exact wording wins
  // with no redeploy. de stays on the code map on purpose: the CMS base
  // `category_name` currently holds English, so trusting it would regress German —
  // add a `category_name_de` field + a branch here to make de CMS-controlled too.
  if (locale !== "de") {
    // The API returns the linked category under a nested `category` object.
    const cms = produkt?.category?.[`category_name_${locale}`];
    if (typeof cms === "string" && cms.trim()) return cms.trim();
  }

  // 2) Fall back to the raw CMS `kategories` (brand suffix stripped) localized via
  // the code map; 3) unknown labels pass through unchanged (never blank).
  const raw = (produkt?.kategories || "").trim();
  if (!raw) return "";
  const marke = (produkt?.marken || "").trim();
  let label = raw;
  if (marke) {
    const escaped = marke.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    label = label.replace(new RegExp(`[\\s-]*${escaped}\\s*$`, "i"), "");
  }
  label = label.replace(/[-\s]+$/g, "").trim();
  // Localize the category so the de/en/fr/it product pages no longer share an
  // identical title/H1 and each carries its real search term ("Divani" for it,
  // "Canapés" for fr, "Sofa" for de); unmapped labels pass through unchanged.
  return localizeCategory(label, locale);
  
}

// Display name used for the breadcrumb leaf and schema, e.g. "CURVE Betten"
// instead of a bare "CURVE" shared by three variants. Localized per locale.
function getProductDisplayName(produkt, locale = "de") {
  const name = (produkt?.produkt_name || "").trim();
  const category = getCategoryLabel(produkt, locale);
  return category ? `${name} ${category}` : name;
}

// Brand-dealer strategy: the <title> and <h1> FRONT-LOAD the manufacturer
// ("Minotti Yoko Sofas"), so every product page ranks for "[brand] [model]" — the
// biggest SEO lever here. Skips the prefix when the brand is missing or already
// leads the model name; the breadcrumb + schema keep the bare model.
function getProductHeading(produkt, locale = "de") {
  const name = getProductDisplayName(produkt, locale);
  const marke = (produkt?.marken || "").trim();
  if (!marke || name.toLowerCase().startsWith(marke.toLowerCase())) return name;
  return `${marke} ${name}`;
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts();

    if (!products.length) return [];

    const locales = ['de', 'en', 'fr', 'it'];
    const params = [];

    for (const locale of locales) {
      for (const produkte of products) {
        params.push({
          locale,
          title: generateSlug(produkte.marken),
          produkte: produkte.path_field,
        });
      }
    }

    return params;
  } catch (error) {
    console.error("Failed to fetch static params:", error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { produkte, locale = "de", title } = await params;

  try {
    const produkt = await fetchProductByPathField(produkte, locale);


    if (!produkt) {
      return {
        title: "Product Not Found | Platzhirsch Studio",
        description: "The requested product could not be found.",
        robots: { index: false, follow: true },
      };
    }

    const PAGE_URL = getProdukteDetailPageUrl(locale, produkt?.marken, produkte);

    // Fetch default image
    const productsKeywords = await fetchProductsKeywords();
    const defaultImage = getProductsOGImage(productsKeywords);

    // Get localized title and description. 56 keeps the rendered <title> under
    // Sistrix's pixel width limit even with wide all-caps product names.
    const MAX_TITLE_LENGTH = 56;
    const TITLE_SUFFIX = " | Platzhirsch Studio";

    const truncateAtWordBoundary = (text, maxLength) => {
      if (text.length <= maxLength) return text;
      const truncated = text.slice(0, maxLength);
      const lastSpace = truncated.lastIndexOf(" ");
      return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…";
    };

    const getLocalizedTitle = () => {
      // namePart carries the category (e.g. "CURVE Betten") so variants sharing a
      // produkt_name never collide on <title>.
      const namePart = getProductDisplayName(produkt, locale).replace(/\s+/g, " ").trim();
      const marke = (produkt?.marken || "").trim();
      const availableForName = MAX_TITLE_LENGTH - TITLE_SUFFIX.length;

      // No brand, or the model name already starts with it → just the model name.
      if (!marke || namePart.toLowerCase().startsWith(marke.toLowerCase())) {
        return `${truncateAtWordBoundary(namePart, availableForName)}${TITLE_SUFFIX}`;
      }

      // Brand-dealer strategy: the manufacturer is FRONT-LOADED and never truncated,
      // so the page always ranks for "[brand] [model]"; only the model is shortened.
      const modelBudget = availableForName - (marke.length + 1); // +1 for the space
      if (modelBudget <= 1) return `${marke}${TITLE_SUFFIX}`;
      return `${marke} ${truncateAtWordBoundary(namePart, modelBudget)}${TITLE_SUFFIX}`;
    };

    const MAX_DESCRIPTION_LENGTH = 150;

    const getLocalizedDescription = () => {
      // Category-qualified name (e.g. "Amii Sofas" vs "Amii Coffee Tables") so
      // same-named variants don't share an identical fallback description.
      const n = getProductDisplayName(produkt, locale).replace(/"/g, " ");
      let description;
      switch (locale) {
        case "en": description = produkt?.metadata_description_en || `Discover ${n} at Platzhirsch Studio in Vorarlberg – designer furniture with personal consulting and delivery across Austria.`; break;
        case "it": description = produkt?.metadata_description_it || `Scopri ${n} da Platzhirsch Studio in Vorarlberg – mobili di design, consulenza personale e consegna in tutta l'Austria.`; break;
        case "fr": description = produkt?.metadata_description_fr || `Découvrez ${n} chez Platzhirsch Studio au Vorarlberg – mobilier design, conseil personnalisé et livraison en Autriche.`; break;
        default: description = produkt?.metadata_description_de || `Entdecken Sie ${n} bei Platzhirsch Studio in Vorarlberg – Designermöbel mit persönlicher Beratung und Lieferung in ganz Österreich.`;
      }
      return truncateAtWordBoundary(description, MAX_DESCRIPTION_LENGTH);
    };

    const productImage = produkt.bild_anhangen?.[0]?.bild_anhagen
      ? `/cms${produkt.bild_anhangen[0].bild_anhagen}`
      : defaultImage || "/Images/fallback-og.jpg";

    return {
      title: getLocalizedTitle(),
      description: getLocalizedDescription(),
      // Indexed on all four locales for Italy + Switzerland (it/fr) reach. Chrome, FAQ
      // and the CMS beschreibung/mehr_beschreibung are localized per locale (de/en/fr/it
      // tabs in the produkte doctype); products with those fields still empty fall back
      // to a placeholder, so filling the remaining translations is the content follow-up.
      robots: { index: true, follow: true },
      alternates: {
        canonical: PAGE_URL,
        languages: {
          'de': getProdukteDetailPageUrl('de', produkt?.marken, produkte),
          'en': getProdukteDetailPageUrl('en', produkt?.marken, produkte),
          'fr': getProdukteDetailPageUrl('fr', produkt?.marken, produkte),
          'it': getProdukteDetailPageUrl('it', produkt?.marken, produkte),
          'x-default': getProdukteDetailPageUrl('de', produkt?.marken, produkte),
        }
      },
      openGraph: {
        type: "article",
        url: PAGE_URL,
        title: getLocalizedTitle(),
        description: getLocalizedDescription(),
        siteName: "Platzhirsch Studio",
        images: [
          {
            url: productImage,
            width: 1200,
            height: 630,
            alt: produkt?.produkt_name,
          },
        ],
        locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_DE",
      },
      twitter: {
        card: "summary_large_image",
        title: getLocalizedTitle(),
        description: getLocalizedDescription(),
        images: [productImage],
      },
    };
  } catch (error) {
    // NEXT_ control-flow signals (notFound/redirect) propagate untouched.
    if (error?.digest?.startsWith?.("NEXT_")) throw error;
    // A transient PvOne outage must NOT noindex a real product page — that actively
    // de-indexes it. Re-throw so the route returns a retriable HTTP 500 (Google
    // retries 5xx and keeps the URL) instead of silently removing it. Genuine
    // not-found is handled above (the `if (!produkt)` branch) and in the component.
    console.error("Product metadata generation failed:", error);
    throw error;
  }
}

export default async function ProdukteDetailPage({ params }) {
  const { produkte, locale = "de", title } = await params;

  // Fetch product
  const produkt = await fetchProductByPathField(produkte, locale);

  if (!produkt || produkt?.status !== "Aktiv") {
    notFound();
  }

  // Fetch marke and check if active. fetchRawMarkenData() THROWS on a backend
  // hiccup, so without this guard a transient PvOne blip during an on-demand render
  // 500s an otherwise-valid, ACTIVE product page — Sistrix flagged clustered 500s
  // from exactly this during a crawl. The product itself is already fetched and
  // Aktiv, so on a transient marken-fetch failure we keep the page up instead of
  // 500-ing; the brand-active gate still applies whenever the list actually loads.
  let marke = null;
  let markenLoaded = false;
  try {
    const marken = await fetchRawMarkenData();
    markenLoaded = true;
    marke = marken.find((m) => m?.name1 === produkt.marken);
  } catch (error) {
    console.error("Marken fetch failed on product page; serving the active product anyway:", error);
  }

  if (markenLoaded && (!marke || marke?.status?.toLowerCase() !== "aktiv")) {
    notFound(); // block inactive/unknown brands — only when the list actually loaded
  }

  // e.g. "CURVE Betten" — the bare model name, used for the breadcrumb leaf.
  const displayName = getProductDisplayName(produkt, locale);
  // e.g. "Poliform CURVE Betten" — brand front-loaded for the <h1>, matching the
  // <title> so the page ranks for "[brand] [model]".
  const heading = getProductHeading(produkt, locale);

  const titleOne = locale == "it" ? "Prodotti" : locale == "en" ? "Products" : locale == "fr" ? "Produits" : "Produkte";
  const Home = locale == "it" ? "Casa" : locale == "en" ? "Home" : locale == "fr" ? "Accueil" : "Home";

  // Dynamic URLs
  const PAGE_URL = getProdukteDetailPageUrl(locale, produkt?.marken, produkte);
  const produkteBaseUrl = getProduktePageUrl(locale);

  const productPath = `/produkte`;
  const markeDetailUrl = `/produkte/${generateSlug(produkt?.marken)}`;
  const productItemPath = `/produkte/${generateSlug(produkt?.marken)}/${generateSlug(produkte)}`

  const BannerInfo = {
    image: produkt?.bannerbild ? `/cms${produkt.bannerbild}` : produkt?.bild_anhangen?.[0]?.bild_anhagen ? `/cms${produkt.bild_anhangen[0].bild_anhagen}` : "/Images/fallback-banner.jpg",
    links: [
      { linkName: Home, link: `/` },
      { linkName: titleOne, link: productPath },
      { linkName: produkt?.marken, link: markeDetailUrl },
      { linkName: displayName, link: productItemPath },
    ],
    title: heading,
  };

  // Fetch dimensions
  const dimensionImages = await fetchProductDimensions({
    name: produkt.name,
    produkt_name: produkt.produkt_name,
    path_field: produkt.path_field,
  });

  // Fetch related products
  const relatedProducts = await fetchRelatedProducts(produkt.marken, produkt.kategories, produkt.path_field);

  // Structured-data URLs must be absolute — JSON-LD is parsed independently of the
  // page, so Google doesn't reliably resolve relative paths.
  const DOMAIN = "https://platzhirsch.studio";

  // ✅ JSON-LD Structured Data for Product
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${DOMAIN}${PAGE_URL}/#article`,
    name: heading,
    description: produkt?.beschreibung || `Entdecken Sie ${produkt?.produkt_name} bei Platzhirsch Studio.`,
    image: produkt?.bild_anhangen?.[0]?.bild_anhagen
      ? `${DOMAIN}/cms${produkt.bild_anhangen[0].bild_anhagen}`
      : `${DOMAIN}/Images/fallback-og.jpg`,
    brand: {
      "@type": "Brand",
      name: produkt?.marken,
    },
    category: produkt?.kategories,
    sku: produkt?.path_field,

  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${DOMAIN}${PAGE_URL}/#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: Home, item: `${DOMAIN}/${locale}` },
      { "@type": "ListItem", position: 2, name: titleOne, item: `${DOMAIN}${produkteBaseUrl}` },
      { "@type": "ListItem", position: 3, name: produkt?.marken, item: `${DOMAIN}${produkteBaseUrl}/${generateSlug(produkt?.marken)}` },
      { "@type": "ListItem", position: 4, name: displayName, item: `${DOMAIN}${PAGE_URL}` },
    ],
  };

  // Enriches otherwise thin product pages with localized, brand-personalized service
  // text (dealer + Vorarlberg/Österreich signal) — real content Google can index.
  const brandName = produkt?.marken || "";
  const serviceInfo = {
    de: { h: `${brandName} bei Platzhirsch Studio`, p: `Dieses ${brandName}-Produkt erhalten Sie bei Platzhirsch Studio in Lochau (Vorarlberg). Wir begleiten Sie mit persönlicher Einrichtungsberatung, einer Ausstellung vor Ort sowie Lieferung und Montage in ganz Österreich. Kontaktieren Sie uns für Verfügbarkeit, Preise und individuelle Konfiguration. Lochau liegt nahe der Schweizer Grenze – auch Kundinnen und Kunden aus der Schweiz und Italien sind herzlich willkommen.` },
    en: { h: `${brandName} at Platzhirsch Studio`, p: `You will find this ${brandName} piece at Platzhirsch Studio in Lochau (Vorarlberg). We offer personal interior consulting, a showroom on site, and delivery and assembly throughout Austria. Contact us for availability, prices and bespoke configuration. Lochau is close to the Swiss border – customers from Switzerland and Italy are warmly welcome too.` },
    fr: { h: `${brandName} chez Platzhirsch Studio`, p: `Ce produit ${brandName} est disponible chez Platzhirsch Studio à Lochau (Vorarlberg). Nous vous accompagnons avec un conseil personnalisé, un showroom sur place, ainsi que la livraison et le montage dans toute l'Autriche. Contactez-nous pour la disponibilité, les prix et la configuration sur mesure. Lochau est proche de la frontière suisse – les clients de Suisse et d'Italie sont également les bienvenus.` },
    it: { h: `${brandName} da Platzhirsch Studio`, p: `Questo prodotto ${brandName} è disponibile da Platzhirsch Studio a Lochau (Vorarlberg). Vi seguiamo con consulenza personale, uno showroom in loco e consegna e montaggio in tutta l'Austria. Contattateci per disponibilità, prezzi e configurazione su misura. Lochau è vicino al confine svizzero – anche i clienti dalla Svizzera e dall'Italia sono i benvenuti.` },
  }[locale];

  // Dealer-intent FAQ: real, brand + location Q&A that adds indexable content to
  // otherwise thin product pages. Rendered visibly below AND mirrored 1:1 in the
  // FAQPage JSON-LD — the markup must match the visible text or Google penalises it.
  const faqInfo = ({
    de: [
      { q: `Ist ${brandName} bei Platzhirsch Studio in Österreich erhältlich?`, a: `Ja. Platzhirsch Studio führt ${brandName} in der Ausstellung in Lochau (Vorarlberg) und liefert in ganz Österreich – von Bregenz und Innsbruck bis Salzburg und Wien.` },
      { q: `Kann ich ${displayName} vor dem Kauf ansehen?`, a: `Gerne. Vereinbaren Sie einen Beratungstermin in unserem Einrichtungsstudio in Lochau am Bodensee, um ${brandName} live zu erleben und Materialien, Maße und Konfiguration zu besprechen.` },
      { q: `Bietet Platzhirsch Studio Einrichtungsberatung für ${brandName}?`, a: `Ja. Wir begleiten Sie von der persönlichen Einrichtungsberatung über die Planung bis zu Lieferung und Montage – exklusives Design aus einer Hand.` },
    ],
    en: [
      { q: `Is ${brandName} available at Platzhirsch Studio in Austria?`, a: `Yes. Platzhirsch Studio carries ${brandName} in its showroom in Lochau (Vorarlberg) and delivers throughout Austria – from Bregenz and Innsbruck to Salzburg and Vienna.` },
      { q: `Can I see ${displayName} before buying?`, a: `Of course. Book a consultation at our interior studio in Lochau on Lake Constance to experience ${brandName} in person and discuss materials, dimensions and configuration.` },
      { q: `Does Platzhirsch Studio offer interior consulting for ${brandName}?`, a: `Yes. We support you from personal interior consulting through planning to delivery and assembly – exclusive design from a single source.` },
    ],
    fr: [
      { q: `${brandName} est-il disponible chez Platzhirsch Studio en Autriche ?`, a: `Oui. Platzhirsch Studio présente ${brandName} dans son showroom à Lochau (Vorarlberg) et livre dans toute l'Autriche – de Bregenz et Innsbruck à Salzbourg et Vienne.` },
      { q: `Puis-je voir ${displayName} avant l'achat ?`, a: `Bien sûr. Prenez rendez-vous dans notre studio d'aménagement à Lochau, au bord du lac de Constance, pour découvrir ${brandName} et discuter des matériaux, dimensions et configurations.` },
      { q: `Platzhirsch Studio propose-t-il un conseil en aménagement pour ${brandName} ?`, a: `Oui. Nous vous accompagnons du conseil personnalisé à la planification, jusqu'à la livraison et le montage – un design exclusif d'une seule main.` },
    ],
    it: [
      { q: `${brandName} è disponibile da Platzhirsch Studio in Austria?`, a: `Sì. Platzhirsch Studio propone ${brandName} nello showroom di Lochau (Vorarlberg) e consegna in tutta l'Austria – da Bregenz e Innsbruck fino a Salisburgo e Vienna.` },
      { q: `Posso vedere ${displayName} prima dell'acquisto?`, a: `Certo. Fissate un appuntamento nel nostro studio d'arredo a Lochau, sul Lago di Costanza, per vivere ${brandName} dal vivo e parlare di materiali, misure e configurazioni.` },
      { q: `Platzhirsch Studio offre consulenza d'arredo per ${brandName}?`, a: `Sì. Vi seguiamo dalla consulenza personale alla progettazione, fino a consegna e montaggio – design esclusivo da un unico interlocutore.` },
    ],
  }[locale]) || [];

  const faqSchema = faqInfo.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${DOMAIN}${PAGE_URL}/#faq`,
        mainEntity: faqInfo.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <MarkenItemBanner info={BannerInfo} />
      <ProdukteDetails produkte={produkt} />
      <ProductDescriptionTabs produkt={produkt} />
      <DimensionProdukte
        dimensionImages={dimensionImages}
        produktName={produkt.produkt_name}
      />
      {serviceInfo && (
        <section className="max-w-7xl mx-auto px-4 my-12 lg:my-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#30373e] mb-4">{serviceInfo.h}</h2>
          <p className="text-[#30373e]/80 leading-relaxed max-w-4xl">{serviceInfo.p}</p>
        </section>
      )}
      {faqInfo.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 my-12 lg:my-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#30373e] mb-6">
            {locale === "en"
              ? "Frequently asked questions"
              : locale === "fr"
                ? "Questions fréquentes"
                : locale === "it"
                  ? "Domande frequenti"
                  : "Häufige Fragen"}
          </h2>
          <div className="space-y-6 max-w-4xl">
            {faqInfo.map((f, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold text-[#30373e] mb-2">{f.q}</h3>
                <p className="text-[#30373e]/80 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}

export const revalidate = 3600;