import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import BreadcrumbBar from "@/components/Reusable/breadcrumbBar";
import ProductGallery from "@/components/ShopCatalog/productGallery";
import BrandDesignerShowcase from "@/components/ShopCatalog/brandDesignerShowcase";
import ProductInfoTabs from "@/components/ShopCatalog/productInfoTabs";
import ProductActions from "@/components/ShopCatalog/productActions";
import WishlistHeart from "@/components/ShopCatalog/wishlistHeart";
import { toWishlistItem } from "@/lib/shop/wishlistItem";
import { loadProductsByCollection } from "@/lib/marken/collectionPage";
import CollectionSlider from "@/components/ShopCatalog/collectionSlider";
import { parseDimensions } from "@/components/ShopCatalog/dimensionDiagram";
import { getDesignerInfo } from "@/lib/data/staticShopProducts";
import { fetchProduktePaths, fetchProduktNewByPathField, fetchRelatedProdukteNew } from "@/lib/api/fetchAllProdukte";
import { fetchRawMarkenData } from "@/lib/api/fetchMarkenData";
import { fetchKategorien, getKategorieLabel, indexKategorienByKey } from "@/lib/api/fetchKategorien";
import { fetchCollectionsByMarke } from "@/lib/api/fetchCollections";
import { toShopProductDetail } from "@/lib/shop/shopProducts";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import { ROUTES, productsPath, productsPathByLocale } from "@/utils/routing";
import { formatCollectionName, collectionPath } from "@/lib/marken/collections";
import { buildPageMetadata, localeUrl, toMetaDescription } from "@/lib/seo/pageMetadata";
import { breadcrumbList, graph, productSchema } from "@/lib/seo/structuredData";
import JsonLd from "@/components/Reusable/JsonLd";
import { productTitle } from "@/lib/seo/shopSeoCopy";
import { resolveLegacyProductUrl } from "@/lib/seo/legacyProductRedirects";

// A legacy /produkte/{brand}/{old-slug} URL (previous site, still indexed and
// linked) → 308 to the matching new product, else to the brand page. Only
// reached when the slug is not a current product, so the lookups never run
// for regular traffic.
async function redirectLegacyProductUrl(locale, categorySlug, productSlug) {
  const target = await resolveLegacyProductUrl(categorySlug, productSlug);
  if (!target) return;
  if (target.type === "product") {
    permanentRedirect(`/${locale}${productsPath(locale, generateSlug(target.categoryKey), target.pathField)}`);
  }
  permanentRedirect(`/${locale}${ROUTES.marken[locale] || ROUTES.marken.de}/${target.brandSlug}`);
}

const getLocalizedCollectionTitle = (locale, brand) => {
  switch (locale) {
    case "it": return `La collezione ${brand}`;
    case "en": return `The ${brand} Collection`;
    case "fr": return `La collection ${brand}`;
    default: return `Die ${brand} Kollektion`;
  }
};

// Labels for the free-text material/color/weight fields on "Produkte
// Additional Information" — plain CMS strings, not a keyed lookup like
// COLOR_I18N/MATERIAL_I18N, so they get their own small locale map here
// instead of going through localizeAttribute().
const DETAIL_FIELD_LABELS = {
  material: { de: "Material", en: "Material", fr: "Matériau", it: "Materiale" },
  color: { de: "Farbe", en: "Color", fr: "Couleur", it: "Colore" },
  weight: { de: "Gewicht", en: "Weight", fr: "Poids", it: "Peso" },
};

// Real "About the brand" data from the Marken doctype (Frappe) — replaces
// the old static BRAND_INFO lookup in staticShopProducts.js, which only ever
// covered ~9 hand-curated brands and left every other real brand (Treca
// included) with no showcase section even though the CMS has full bios,
// founding info and a photo for each active brand.
function localizedMarkenField(marke, baseKey, locale) {
  if (locale && locale !== "de") {
    const localized = marke?.[`${baseKey}_${locale}`];
    if (typeof localized === "string" && localized.trim()) return localized.trim();
  }
  return (marke?.[baseKey] || "").trim();
}

function buildBrandInfo(marke, locale) {
  if (!marke) return null;
  const bio = localizedMarkenField(marke, "produkte", locale);
  if (!bio) return null;
  return {
    image: marke.bild_anhagen?.[0]?.bild_anhagen ? `/cmx${marke.bild_anhagen[0].bild_anhagen}` : null,
    founded: marke.grundungsjahr || null,
    country: marke.herkunftsland || null,
    bio,
  };
}

function buildMaterialsFields(product, locale) {
  const fields = [];
  if (product.materialRaw) fields.push({ key: "material", label: DETAIL_FIELD_LABELS.material[locale] || DETAIL_FIELD_LABELS.material.de, value: [product.materialRaw] });
  if (product.colorRaw) fields.push({ key: "color", label: DETAIL_FIELD_LABELS.color[locale] || DETAIL_FIELD_LABELS.color.de, value: [product.colorRaw] });
  if (product.weightRaw) fields.push({ key: "weight", label: DETAIL_FIELD_LABELS.weight[locale] || DETAIL_FIELD_LABELS.weight.de, value: [product.weightRaw] });
  return fields;
}

// Short commercial fallback blurb, used only when the CMS beschreibung/
// mehr_beschreibung fields are still empty for this product — real CMS copy
// always wins over this when present (see descriptionParagraphs below).
// Says "the piece" rather than naming the category: category labels are plural
// ("Betten", "Lits"), which no singular "this …" phrasing fits in every locale.
function buildFallbackDescription(product, locale) {
  const T = {
    de: `${product.name} von ${product.brand}${product.designer ? `, entworfen von ${product.designer}` : ""} – erhältlich bei Platzhirsch Home Living in Lochau am Bodensee. Entdecken Sie das Stück in unserer Ausstellung, inklusive persönlicher Einrichtungsberatung sowie Lieferung und Montage in ganz Österreich.`,
    en: `${product.name} by ${product.brand}${product.designer ? `, designed by ${product.designer}` : ""} – available at Platzhirsch Home Living in Lochau on Lake Constance. Discover the piece in our showroom, with personal interior consulting plus delivery and assembly throughout Austria.`,
    fr: `${product.name} de ${product.brand}${product.designer ? `, conçu par ${product.designer}` : ""} – disponible chez Platzhirsch Home Living à Lochau, au bord du lac de Constance. Découvrez cette pièce dans notre showroom, avec conseil personnalisé, livraison et montage dans toute l'Autriche.`,
    it: `${product.name} di ${product.brand}${product.designer ? `, disegnato da ${product.designer}` : ""} – disponibile da Platzhirsch Home Living a Lochau, sul Lago di Costanza. Scopri questo pezzo nel nostro showroom, con consulenza personale, consegna e montaggio in tutta l'Austria.`,
  };
  return T[locale] || T.de;
}

// Every active, category-bearing "Produkte New" record, across every locale.
// Uses the lightweight get_produkte_paths endpoint instead of the >2MB
// get_all_produkte_api. Paths missing here are still rendered on first visit.
export async function generateStaticParams() {
  const paths = await fetchProduktePaths();
  const locales = ["de", "en", "fr", "it"];
  const params = [];

  for (const locale of locales) {
    for (const p of paths) {
      const categoryKey = (p.kategories || "").toLowerCase();
      if (!p.path_field || !categoryKey) continue;
      params.push({ locale, category: generateSlug(categoryKey), product: p.path_field });
    }
  }

  return params;
}

// CMS metadata_description_<locale> → the product's own description text in
// the page language → German CMS description → a generated sentence. For
// en/fr/it the localized product text ranks ahead of the German CMS meta so
// those pages don't carry a German snippet (duplicate across locales).
function productMetaDescription(detail, product, locale) {
  const localizedCms = locale !== "de" ? detail?.[`metadata_description_${locale}`] : detail?.metadata_description_de;
  const ownText = product.descriptionParagraphs.join(" ");
  const fromCms = localizedCms || (locale === "de" ? ownText : ownText || detail?.metadata_description_de);
  return toMetaDescription(fromCms || buildFallbackDescription(product, locale));
}

// CMS metadata_title_<locale> → "Name – Brand | Platzhirsch Home Living". The
// German CMS title is only used on the German page: reusing it on en/fr/it
// produced identical titles across the four locales.
function productMetaTitle(detail, product, locale) {
  const fromCms = locale !== "de" ? detail?.[`metadata_title_${locale}`] : detail?.metadata_title_de;
  return (typeof fromCms === "string" && fromCms.trim()) || productTitle(product);
}

// Indexable in every locale at its translated path (/de/produkte/…,
// /en/products/…, /fr/produits/…, /it/prodotti/…), hreflang between them. Unknown/inactive products 404 in the page itself.
export async function generateMetadata({ params }) {
  const { locale, category: categorySlug, product: productSlug } = await params;
  const detail = await fetchProduktNewByPathField(productSlug, locale);
  if (!detail || detail.status !== "Aktiv") return { robots: { index: false, follow: true } };

  const product = toShopProductDetail(detail, locale);
  return buildPageMetadata({
    locale,
    pathByLocale: productsPathByLocale(categorySlug, productSlug),
    title: productMetaTitle(detail, product, locale),
    description: productMetaDescription(detail, product, locale),
    image: product.images[0],
    imageAlt: `${product.brand} ${product.name}`,
  });
}

export default async function ShopProductPage({ params }) {
  const { locale, category: categorySlug, product: productSlug } = await params;

  const [detail, marken, kategorien] = await Promise.all([
    fetchProduktNewByPathField(productSlug, locale),
    fetchKategorien(),
    // fetchRawMarkenData() throws on a backend hiccup (unlike the other
    // fetch* helpers here, which swallow errors and return []) — a transient
    // Marken outage must not 500 an otherwise-valid product page, so it just
    // falls back to no brand showcase that request instead.
    fetchRawMarkenData().catch(() => []),
  ]);

  if (!detail || detail.status !== "Aktiv") {
    await redirectLegacyProductUrl(locale, categorySlug, productSlug);
    notFound();
  }

  const product = toShopProductDetail(detail, locale);
  if (!product.categoryKey) notFound();
  // Right product, wrong category segment (moved category, hand-typed URL):
  // one canonical URL per product, so send it to the correct one.
  if (generateSlug(product.categoryKey) !== categorySlug) {
    permanentRedirect(`/${locale}${productsPath(locale, generateSlug(product.categoryKey), productSlug)}`);
  }

  const t = await getTranslations({ locale, namespace: "shop" });
  const tBenefits = await getTranslations({ locale, namespace: "Benefits" });
  const tMarken = await getTranslations({ locale, namespace: "marken" });

  // The brand's real collections (only those with an image — the slider is
  // image-led), each linking to its own collection page
  // (/ueber-uns/marken/[brand]/[collection]).
  const brandPageHref = ROUTES.marken[locale] ? `${ROUTES.marken[locale]}/${generateSlug(product.brand)}` : null;
  // "You may also like" — other pieces from the same brand (same category
  // first), via the backend's related_products endpoint.
  const [collections, related] = await Promise.all([
    fetchCollectionsByMarke(product.brand),
    fetchRelatedProdukteNew({ marken: detail.marken, kategories: detail.kategories, path_field: detail.path_field || productSlug }),
  ]);
  // Each collection's products, for the slider's heart (saves them all to the
  // Merkliste) — one get_produkte_by_marke_api call for the whole brand.
  const productsByCollection = await loadProductsByCollection(product.brand, collections);
  const collectionItems = collections
    .filter((c) => c.image)
    .map((c) => ({
      id: c.name,
      name: formatCollectionName(c.name),
      tag: tMarken("productCount", { count: c.produkt_count || 0 }),
      image: `/cmx${c.image}`,
      href: collectionPath(locale, product.brand, c.name),
      wishlistItems: (productsByCollection[c.name] || []).map(toWishlistItem),
    }));

  // Category label: the CMS name (Produkte Kategorie) first; localizeCategory
  // only knows the old space-separated keys, so slugs like "sofas-couches"
  // used to surface raw in breadcrumb, chip and "back" link.
  const cmsKategorie = indexKategorienByKey(kategorien).get(product.categoryKey);
  const humanized = product.categoryKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const localized = localizeCategory(product.categoryKey, locale);
  const categoryLabel = (cmsKategorie && getKategorieLabel(cmsKategorie, locale)) || (localized !== product.categoryKey ? localized : humanized);

  const Home = locale === "it" ? "Home" : locale === "en" ? "Home" : locale === "fr" ? "Accueil" : "Home";
  const productsLabel = locale === "it" ? "Prodotti" : locale === "en" ? "Products" : locale === "fr" ? "Produits" : "Produkte";
  // Translated catalogue paths (/products/…, /produits/…, /prodotti/…) — the
  // middleware serves them from this German-named folder.
  const productPath = productsPath(locale);
  const categoryPath = productsPath(locale, categorySlug);

  const breadcrumbLinks = [
    { linkName: Home, link: "/" },
    { linkName: productsLabel, link: productPath },
    { linkName: categoryLabel, link: categoryPath },
    { linkName: product.name, link: null },
  ];

  const descriptionParagraphs = product.descriptionParagraphs.length > 0
    ? product.descriptionParagraphs
    : [buildFallbackDescription(product, locale)];

  const marke = marken.find((m) => m.name1 === product.brand);
  const brandInfo = buildBrandInfo(marke, locale);
  const designerInfo = getDesignerInfo(product.designer);
  const hasAboutSection = Boolean(brandInfo || designerInfo);
  const dims = parseDimensions(product.dimensionsRaw);
  const materialsFields = buildMaterialsFields(product, locale);
  const trustBullets = [tBenefits("service1.title"), tBenefits("service2.title"), tBenefits("service3.title"), tBenefits("service4.title")];

  // Draw exactly one top divider before the first extra section that renders,
  // instead of every section carrying its own and stacking double lines.
  let dividerDrawn = false;
  const sectionTopClass = () => {
    if (dividerDrawn) return "pt-4";
    dividerDrawn = true;
    return "border-t border-[#30373e]/10 pt-12";
  };

  // Product (no offers/price — prices aren't published) + BreadcrumbList.
  const pageUrl = localeUrl(locale, productsPath(locale, categorySlug, productSlug));
  const structuredData = graph(
    productSchema({
      product,
      url: pageUrl,
      description: productMetaDescription(detail, product, locale),
      categoryLabel,
    }),
    breadcrumbList(
      [
        { name: Home, url: localeUrl(locale) },
        { name: productsLabel, url: localeUrl(locale, productPath) },
        { name: categoryLabel, url: localeUrl(locale, categoryPath) },
        { name: product.name },
      ],
      `${pageUrl}#breadcrumb`
    )
  );

  return (
    <div>
      <JsonLd data={structuredData} />
      <BreadcrumbBar links={breadcrumbLinks} />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {product.images.length > 0 ? (
            <ProductGallery images={product.images} alt={`${product.brand} ${product.name}`} />
          ) : (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-[#30373e]/10 bg-gray-100">
              <Image
                src="/Images/fallback-banner.jpg"
                alt={`${product.brand} ${product.name}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          )}

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-text">
              {brandPageHref ? (
                <Link href={brandPageHref} locale={locale} className="hover:underline" title={t("brandPageLink", { brand: product.brand })}>
                  {product.brand}
                </Link>
              ) : (
                product.brand
              )}
            </p>
            <h1 className="font-display mt-1 text-4xl leading-tight text-ink md:text-5xl">{product.name}</h1>
            {product.designer && <p className="mt-2 text-[#30373e]/75">{product.designer}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#30373e]/15 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#30373e]">
                {categoryLabel}
              </span>
            </div>

            <ProductActions
              locale={locale}
              // The consultation wizard pre-fills "Anfrage zu: <Marke> <Produkt>".
              consultationHref={`${ROUTES.beratung[locale] || "/beratung"}?produkt=${encodeURIComponent(`${product.brand} ${product.name}`)}`}
              detailsAnchor="produktdetails"
              wishlistItem={toWishlistItem({
                id: detail.name,
                name: product.name,
                brand: product.brand,
                categoryKey: product.categoryKey,
                image: product.images[0],
                url_slug: productSlug,
                href: productsPath("de", categorySlug, productSlug),
              })}
              labels={{
                requestConsultation: t("requestConsultation"),
                save: t("saveToWishlist"),
                saved: t("savedToWishlist"),
                addToWishlist: t("addToWishlistAria"),
                removeFromWishlist: t("removeFromWishlistAria"),
                showMoreDetails: t("showMoreDetails"),
                callUs: t("callUs"),
              }}
            />

            <ul className="mt-6 space-y-2">
              {trustBullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2 text-sm text-[#30373e]/70">
                  <Check size={15} strokeWidth={2} className="shrink-0 text-[#d1b250]" />
                  {bullet}
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href={categoryPath}
                locale={locale}
                className="text-sm text-[#30373e]/75 hover:text-[#d1b250] transition-colors"
              >
                ← {t("backToCategory", { category: categoryLabel })}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="produktdetails" className="w-full scroll-mt-28 bg-gradient-to-b from-gray-100 via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <ProductInfoTabs
            labels={{
              description: t("descriptionTab"),
              dimensions: t("dimensionsTab"),
              materials: t("materialsCareTab"),
              configurations: t("configurationsTab"),
            }}
            descriptionParagraphs={descriptionParagraphs}
            dims={dims}
            materialsFields={materialsFields}
            configurations={null}
          />
        </div>
      </section>

      {/* Hidden when the brand has no collections with an image.
          Full-width on purpose (no max-w-7xl here) — CollectionSlider keeps
          its own title constrained to the page's normal text column, but
          the card row itself runs edge to edge. No sectionTopClass() here on
          purpose — this section skips the shared top divider (the next
          section that calls sectionTopClass() becomes "first" and gets it
          instead, so the one-divider-only behavior still holds). */}
      {collectionItems.length > 0 && (
      <section className="w-full pt-4 pb-16">
        <CollectionSlider
          title={getLocalizedCollectionTitle(locale, product.brand)}
          locale={locale}
          items={collectionItems}
        />
      </section>
      )}

      {hasAboutSection && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 pb-16 ${sectionTopClass()}`}>
          <BrandDesignerShowcase
            locale={locale}
            designerName={product.designer}
            designerInfo={designerInfo}
            brandName={product.brand}
            brandInfo={brandInfo}
            brandPageHref={brandPageHref}
            labels={{
              designer: t("aboutDesigner"),
              brand: t("aboutBrand"),
              founded: t("founded"),
              viewBrandPage: t("viewBrandPage"),
            }}
          />
        </section>
      )}

      {related.length > 0 && (
        <section className={`max-w-7xl mx-auto px-4 sm:px-6 pb-20 ${sectionTopClass()}`}>
          <h2 className="text-xl font-light text-[#30373e] mb-6">{t("relatedHeading")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((rp) => {
              const href = productsPath(locale, generateSlug(rp.categoryKey), rp.url_slug);
              return (
                <div key={rp.id} className="relative">
                  <Link
                    href={href}
                    locale={locale}
                    className="group block overflow-hidden rounded-lg border border-[#30373e]/10 bg-white transition-shadow duration-300 hover:shadow-[0_8px_24px_rgba(48,55,62,0.12)]"
                  >
                    <div className="relative h-[200px] w-full overflow-hidden bg-gray-100">
                      <Image
                        src={rp.image || "/Images/fallback-banner.jpg"}
                        alt={`${rp.brand} ${rp.name}`}
                        fill
                        sizes="(max-width: 768px) 90vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-text">{rp.brand}</p>
                      <p className="text-sm text-[#30373e] font-medium">{rp.name}</p>
                    </div>
                  </Link>
                  <WishlistHeart product={{ ...rp, href: productsPath("de", generateSlug(rp.categoryKey), rp.url_slug) }} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
