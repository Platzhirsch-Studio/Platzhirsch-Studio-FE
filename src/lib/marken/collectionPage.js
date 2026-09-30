// Data + metadata for the collection pages. The About section is duplicated per
// language (ueber-uns/marken, about-us/brands, a-propos/marques,
// chi-siamo/marche), so all four [title]/[collection]/page.js files are thin
// wrappers around these two functions instead of four copies of the logic.
import "server-only";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { buildShopProducts } from "@/lib/shop/shopProducts";
import { formatCollectionName, collectionPath } from "@/lib/marken/collections";
import { generateSlug } from "@/lib/slugify";

const DOMAIN = "https://platzhirsch.studio";
const LOCALES = ["de", "en", "fr", "it"];

// The collection's CMS description (get_collections: description_de/_en/_fr/
// _it, rich text), localized with German fallback; "" when not filled in.
function collectionDescription(collection, locale) {
  const hit = [collection?.[`description_${locale}`], collection?.description_de].find(
    (v) => typeof v === "string" && v.trim()
  );
  return hit ? hit.trim() : "";
}

// Same splitting as product descriptions (shopProducts.js): CMS rich text,
// rendered as HTML paragraphs.
const toParagraphs = (text) =>
  (text || "")
    .replace(/[ \t]+/g, " ")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

const stripHtml = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Every collection of one brand → its products (card shape), from a single
// get_produkte_by_marke_api call: { [collectionDocname]: product[] }. Each
// product row carries its `collection` docname (the same field
// get_collections counts by). Used by the collection pages and by the product
// page's collection slider (whose heart saves a whole collection).
export async function loadProductsByCollection(brandName, collections) {
  if (!brandName || !collections?.length) return {};
  const raw = (await fetchProdukteNewByMarke(brandName)).filter(
    (p) => p?.status === "Aktiv" && p?.path_field && p?.kategories
  );

  const groups = Object.fromEntries(collections.map((c) => [c.name, []]));
  for (const p of raw) {
    if (p.collection && groups[p.collection]) groups[p.collection].push(p);
  }

  return Object.fromEntries(
    Object.entries(groups).map(([name, members]) => [
      name,
      buildShopProducts(members).map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        designer: p.designer,
        categoryKey: p.categoryKey,
        image: p.image,
        url_slug: p.url_slug,
        href: `/produkte/${generateSlug(p.categoryKey)}/${p.url_slug}`,
      })),
    ])
  );
}

// null when the brand is unknown/inactive or has no collection with that slug.
export async function loadCollectionPage(brandSlug, collectionSlug, locale = "de") {
  const marken = await fetchRawMarkenData().catch(() => []);
  const marke = marken?.find((m) => generateSlug(m?.name1) === brandSlug);
  if (!marke || marke.status !== "Aktiv") return null;

  const collections = await fetchCollectionsByMarke(marke.name1);
  const collection = collections.find((c) => generateSlug(c.name) === collectionSlug);
  if (!collection) return null;

  const name = formatCollectionName(collection.name);
  const description = collectionDescription(collection, locale);
  return {
    marke,
    collection: {
      id: collection.name,
      name,
      image: collection.image ? `/cmx${collection.image}` : null,
      productCount: collection.produkt_count || 0,
      descriptionParagraphs: toParagraphs(description),
      descriptionText: stripHtml(description),
    },
    products: (await loadProductsByCollection(marke.name1, collections))[collection.name] || [],
    otherCollections: collections
      .filter((c) => c.name !== collection.name)
      .map((c) => ({
        id: c.name,
        name: formatCollectionName(c.name),
        image: c.image ? `/cmx${c.image}` : null,
        productCount: c.produkt_count || 0,
      })),
  };
}

export async function buildCollectionMetadata(locale, brandSlug, collectionSlug) {
  const data = await loadCollectionPage(brandSlug, collectionSlug, locale);
  if (!data) {
    return { title: "Collection Not Found | Platzhirsch Home Living", robots: { index: false, follow: true } };
  }

  const { marke, collection } = data;
  const urlFor = (l) => `${DOMAIN}/${l}${collectionPath(l, marke.name1, collection.id)}`;
  const collectionWord = { en: "Collection", fr: "Collection", it: "Collezione" }[locale] || "Kollektion";
  const title = `${collection.name} ${collectionWord} – ${marke.name1} | Platzhirsch Home Living`;
  // The CMS description when there is one (trimmed to meta length), else a
  // generated sentence.
  const cmsDescription =
    collection.descriptionText.length > 160
      ? `${collection.descriptionText.slice(0, 157).replace(/\s+\S*$/, "")}…`
      : collection.descriptionText;
  const description =
    cmsDescription ||
    {
      en: `Discover the ${collection.name} collection by ${marke.name1} at Platzhirsch Home Living in Lochau, Vorarlberg.`,
      fr: `Découvrez la collection ${collection.name} de ${marke.name1} chez Platzhirsch Home Living à Lochau, Vorarlberg.`,
      it: `Scopri la collezione ${collection.name} di ${marke.name1} da Platzhirsch Home Living a Lochau, Vorarlberg.`,
    }[locale] ||
    `Entdecken Sie die Kollektion ${collection.name} von ${marke.name1} bei Platzhirsch Home Living in Lochau, Vorarlberg.`;
  const image = collection.image || "/Images/fallback-banner.jpg";

  return {
    title,
    description,
    // Indexed on all locales and listed in /sitemap-marken.xml.
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: urlFor(locale),
      siteName: "Platzhirsch Home Living",
      images: [{ url: image, width: 1200, height: 630, alt: collection.name }],
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : locale === "fr" ? "fr_FR" : "de_AT",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: {
      canonical: urlFor(LOCALES.includes(locale) ? locale : "de"),
      languages: {
        "de-AT": urlFor("de"),
        de: urlFor("de"),
        en: urlFor("en"),
        "fr-FR": urlFor("fr"),
        "it-IT": urlFor("it"),
        "x-default": urlFor("de"),
      },
    },
  };
}
