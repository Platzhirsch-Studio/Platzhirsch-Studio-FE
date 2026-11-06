import { notFound, permanentRedirect } from "next/navigation";
import PlanLinks, { featureOn } from "@/components/Reusable/PlanLinks";
import { productPlanLinks } from "@/lib/crossSell";
import { sofaplanerFamilySlug } from "@/lib/marken/sofaplanerFamily.server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Breadcrumbs, CTABand, Container, Heading, Leitsatz } from "@/components/ui";
import ProductGallery from "@/components/ShopCatalog/productGallery";
import { probeImageSize } from "@/components/MarkenItems/imageSize";
import { NEW_API_SERVER } from "@/lib/apiBaseUrl";
import { limitPrerender } from "@/lib/build/prerender";
import BrandDesignerShowcase from "@/components/ShopCatalog/brandDesignerShowcase";
import ProductDetailSections from "@/components/ShopCatalog/productInfoTabs";
import BuiltToStay from "@/components/ShopCatalog/builtToStay";
import CatalogTile from "@/components/ShopCatalog/catalogTile";
import { staggerStyle } from "@/components/ShopCatalog/motion";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import { withFallback } from "@/components/ShopCatalog/copy";
import ProductActions from "@/components/ShopCatalog/productActions";
import { toWishlistItem } from "@/lib/shop/wishlistItem";
import { loadProductsByCollection } from "@/lib/marken/collectionPage";
import CollectionSlider from "@/components/ShopCatalog/collectionSlider";
// Dimension table + JSON-LD measures from the backoffice text (R4, only
// labelled values, nothing guessed).
import { dimensionsJsonLd, dimensionsSummaryMap, formatDimensionRows, parseDimensionTable, parseWeight } from "@/lib/shop/dimensions";
import { extractDownloads } from "@/lib/shop/downloads";
// Breadcrumb "Minotti Sofas & Couches" → brand × category page: the one
// shared rule of the brand pages (R5: import only, src/lib/marken owns it).
import { getIndexableBrandCategoryHref } from "@/lib/marken/brandCategoryLoader";
// Products without a backoffice photo: neutral surface, never a stock photo (R5 P1).
import NoPhoto from "@/components/ShopCatalog/noPhoto";
import { Wordmark } from "@/components/Brand";
import { noPhotoLabel, noPhotoOgPath } from "@/lib/shop/noPhoto";
import { getDesignerInfo } from "@/lib/data/staticShopProducts";
import { fetchProduktePaths, fetchProduktNewByPathField, fetchProdukteNewByMarke, fetchRelatedProdukteNew } from "@/lib/api/fetchAllProdukte";
import { cleanProductName, displayBrandName } from "@/lib/content/brands";
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
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { cleanText, withContext } from "@/lib/forms/beratungContext";
import JsonLd from "@/components/Reusable/JsonLd";
// WhatsApp-Beratung (Inhaber-Entscheidung Nr. 15): Nebenweg, nur mit WHATSAPP_NUMBER.
import WhatsApp from "@/components/WhatsApp";
import TrustBlock from "@/components/Beratung/TrustBlock";
import { distinctProductNames, itVoi, productTitle, productTypeFromText, translateProductType } from "@/lib/seo/shopSeoCopy";
import { resolveLegacyProductUrl } from "@/lib/seo/legacyProductRedirects";
// Central claim filter for manufacturer copy (src/lib/legal rules, R3).
import { filterManufacturerParagraphs, filterManufacturerText } from "@/lib/shop/manufacturerText";
import { dropForeignBlocks } from "@/components/ShopCatalog/descriptionBlocks";
// Checked product copy: server-only facade, published view = only fields with
// a valid text-hash approval (src/lib/productCopy/approvals.js).
import { buildFaqJsonLd, getProductCopyPreview, metadataOverride, resolveProductCopy } from "@/lib/productCopy/server";

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

// CMS brand text ("Erhältlich bei Platzhirsch Studio … Lieferung in ganz
// Österreich", "führender Hersteller …"): dealer (ClassiCon excepted),
// superlative, availability and delivery sentences are dropped by the central
// filter (UWG audit, Katalog-Abnahme A1).
function buildBrandInfo(marke, locale) {
  if (!marke) return null;
  const bio = filterManufacturerText(localizedMarkenField(marke, "produkte", locale), { brand: marke.name1 });
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
  if (product.weightRaw) {
    // "3.3 kg" from the backoffice → locale number format ("3,3 kg" on DE/FR/IT).
    const w = parseWeight(product.weightRaw);
    const value = w ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(w.value)} kg` : product.weightRaw;
    fields.push({ key: "weight", label: DETAIL_FIELD_LABELS.weight[locale] || DETAIL_FIELD_LABELS.weight.de, value: [value] });
  }
  return fields;
}

// Short commercial fallback blurb, used only when the CMS beschreibung/
// mehr_beschreibung fields are still empty for this product — real CMS copy
// always wins over this when present (see descriptionParagraphs below).
// Says "the piece" rather than naming the category: category labels are plural
// ("Betten", "Lits"), which no singular "this …" phrasing fits in every locale.
function buildFallbackDescription(product, locale) {
  const T = {
    de: `${product.name} von ${product.brand}${product.designer ? `, entworfen von ${product.designer}` : ""}. Wir beraten Sie zu diesem Stück in unserer Ausstellung in Lochau am Bodensee und planen es für Ihren Raum; Lieferung und Montage auf Wunsch.`,
    en: `${product.name} by ${product.brand}${product.designer ? `, designed by ${product.designer}` : ""}. We advise you on this piece in our showroom in Lochau on Lake Constance and plan it for your room; delivery and assembly on request.`,
    fr: `${product.name} de ${product.brand}${product.designer ? `, conçu par ${product.designer}` : ""}. Nous vous conseillons sur cette pièce dans notre showroom de Lochau, au bord du lac de Constance, et la planifions pour votre espace ; livraison et montage sur demande.`,
    it: `${product.name} di ${product.brand}${product.designer ? `, disegnato da ${product.designer}` : ""}. Vi offriamo consulenza su questo pezzo nel nostro showroom di Lochau, sul Lago di Costanza, e lo progettiamo per il vostro spazio; consegna e montaggio su richiesta.`,
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

  return limitPrerender(params);
}

// CMS metadata_description_<locale> → the product's own description text in
// the page language → German CMS description → a generated sentence. For
// en/fr/it the localized product text ranks ahead of the German CMS meta so
// those pages don't carry a German snippet (duplicate across locales).
// Every CMS text here is manufacturer copy and goes through the claim filter.
function productMetaDescription(detail, product, locale) {
  const ctx = { brand: product.brand };
  const localizedCms = filterManufacturerText(locale !== "de" ? detail?.[`metadata_description_${locale}`] : detail?.metadata_description_de, ctx);
  const ownText = product.descriptionParagraphs.join(" ");
  const fromCms = localizedCms || (locale === "de" ? ownText : ownText || filterManufacturerText(detail?.metadata_description_de, ctx));
  // R9-P5 (recht P1-1): backoffice IT text in the voi form of the site.
  return toMetaDescription(itVoi(fromCms || buildFallbackDescription(product, locale), locale));
}

// Rat 9,5 B17 (T6): products of one brand with the same display name ("Torii"
// coffee table, swivel armchair, armchair) get a qualifier from the data –
// the type the backoffice text names, else the category label
// (distinctProductNames, src/lib/seo/shopSeoCopy.js). Same cached backoffice
// calls as the brand page; only twins fetch the twins' details.
async function productDisplayName(detail, product, locale) {
  const name = product.name;
  if (!detail?.marken || !name) return { name, twins: false };
  const rows = await fetchProdukteNewByMarke(detail.marken);
  const key = name.toLowerCase();
  const twins = (rows || []).filter((r) => r?.path_field && (!r.status || r.status === "Aktiv") && cleanProductName(r.produkt_name).toLowerCase() === key);
  if (twins.length < 2 || !twins.some((r) => r.path_field === detail.path_field)) return { name, twins: false };
  const [details, kategorien] = await Promise.all([
    Promise.all(twins.slice(0, 8).map((r) => (r.path_field === detail.path_field ? detail : fetchProduktNewByPathField(r.path_field, locale)))),
    fetchKategorien(),
  ]);
  const index = indexKategorienByKey(kategorien);
  const entries = details.filter(Boolean).map((d) => {
    const own = cleanProductName(d.produkt_name);
    const brand = displayBrandName(d.marken);
    const text = locale !== "de" ? d[`metadata_description_${locale}`] : d.metadata_description_de;
    const k = index.get(String(d.kategories || "").toLowerCase());
    // Type named in the page language, else the German one translated (never German on en/fr/it).
    const type = productTypeFromText(text, { brand, name: own }) || translateProductType(productTypeFromText(d.metadata_description_de, { brand, name: own }), locale);
    const category = k ? getKategorieLabel(k, locale) : null;
    // After the name, en/fr/it write the type in lower case ("Torii coffee table").
    const low = (v) => (v && locale !== "de" ? v.toLocaleLowerCase(locale) : v);
    return { path: d.path_field, name: own, type: low(type), category: low(category) };
  });
  return { name: distinctProductNames(entries, locale).get(detail.path_field) || name, twins: true };
}

// CMS metadata_title_<locale> → "Name – Brand | Platzhirsch Home Living". The
// German CMS title is only used on the German page: reusing it on en/fr/it
// produced identical titles across the four locales.
function productMetaTitle(detail, product, locale, display = null) {
  // B17: twins never take the backoffice title (it is the same for all of them).
  if (display?.twins) return productTitle({ ...product, name: display.name });
  const fromCms = locale !== "de" ? detail?.[`metadata_title_${locale}`] : detail?.metadata_title_de;
  return itVoi(filterManufacturerText(typeof fromCms === "string" ? fromCms.trim() : "", { brand: product.brand }), locale) || productTitle(product);
}

// Backoffice record -> page model, with the manufacturer description already
// through the claim filter (visible text, meta description and JSON-LD all
// read the filtered paragraphs).
function loadProduct(detail, locale) {
  const product = toShopProductDetail(detail, locale);
  return {
    ...product,
    // Rat 9,5 A2: no paragraph in a foreign language (Italian CMS remnants on DE).
    descriptionParagraphs: dropForeignBlocks(filterManufacturerParagraphs(product.descriptionParagraphs, { brand: product.brand }), locale).map((p) => itVoi(p, locale)),
  };
}

// Checked product copy for this page: the published view (approved fields
// only, German only – en/fr/it get null, never German text). Dev only:
// ?produkttext=vorschau shows the unapproved draft for review, flagged on the
// page and kept out of <title>, meta and JSON-LD. In production searchParams
// is never read, so the page stays static.
async function productCopyFor(locale, categorySlug, productSlug, searchParams) {
  const published = resolveProductCopy(categorySlug, productSlug, locale)?.copy ?? null;
  if (published || locale !== "de" || process.env.NODE_ENV === "production") return published;
  const query = searchParams ? await searchParams : null;
  return query?.produkttext === "vorschau" ? getProductCopyPreview(categorySlug, productSlug) : null;
}

// Indexable in every locale at its translated path (/de/produkte/…,
// /en/products/…, /fr/produits/…, /it/prodotti/…), hreflang between them. Unknown/inactive products 404 in the page itself.
// A backoffice failure throws here as in the page (→ error.js, 500), only a
// product that does not exist gets the noindex/404 path (R5 P2).
export async function generateMetadata({ params }) {
  const { locale, category: categorySlug, product: productSlug } = await params;
  const detail = await fetchProduktNewByPathField(productSlug, locale);
  if (!detail || detail.status !== "Aktiv") return { robots: { index: false, follow: true } };

  const product = loadProduct(detail, locale);
  const display = await productDisplayName(detail, product, locale).catch(() => null);
  // Approved meta title/description (de only) override the backoffice ones;
  // canonical and hreflang stay on the live route (never copy.catalog.path).
  const override = metadataOverride(resolveProductCopy(categorySlug, productSlug, locale)?.copy ?? null);
  return buildPageMetadata({
    locale,
    pathByLocale: productsPathByLocale(categorySlug, productSlug),
    title: override.title || productMetaTitle(detail, product, locale, display),
    description: override.description || productMetaDescription(detail, product, locale),
    // No photo → the neutral typographic share image of this locale (R5 P1),
    // not the generic room photo of buildPageMetadata.
    image: product.images[0] || noPhotoOgPath(locale),
    imageAlt: product.images[0] ? `${product.brand} ${product.name}` : `${product.brand} ${product.name}: ${noPhotoLabel(locale)}`,
  });
}

// "Breite 242 · Tiefe 98 · Höhe 74 cm" one-liner for the fact list (main
// measures only; the full list is the table in #masse).
const SUMMARY_KEYS = ["width", "depth", "height", "diameter", "length"];
function dimensionSummary(dims, dimLabel, locale) {
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (!dims) return null;
  const main = Object.entries(dims).filter(([key]) => SUMMARY_KEYS.includes(key));
  if (!main.length) return null;
  return `${main
    .slice(0, 4)
    .map(([key, value]) => `${dimLabel(key)} ${nf.format(value)}`)
    .join(" · ")} cm`;
}

export default async function ShopProductPage({ params, searchParams }) {
  const { locale, category: categorySlug, product: productSlug } = await params;

  // Order matters: the destructuring names must match the fetch order (they
  // were swapped – "marken" got the categories – so the category label fell
  // back to the slug, "Sofas Couches", and the brand showcase never found its
  // brand; QA P2-3).
  const [detail, kategorien, marken] = await Promise.all([
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

  const product = loadProduct(detail, locale);
  if (!product.categoryKey) notFound();
  // Right product, wrong category segment (moved category, hand-typed URL):
  // one canonical URL per product, so send it to the correct one.
  if (generateSlug(product.categoryKey) !== categorySlug) {
    permanentRedirect(`/${locale}${productsPath(locale, generateSlug(product.categoryKey), productSlug)}`);
  }

  // After the redirect check: the copy is looked up with the live slugs.
  const copy = await productCopyFor(locale, categorySlug, productSlug, searchParams);

  const t = await getTranslations({ locale, namespace: "shop" });
  const tMarken = await getTranslations({ locale, namespace: "marken" });
  const tc = withFallback(t, locale, "shop");
  const dimLabel = (key) => (tc.has(`atelier.dim.${key}`) ? tc(`atelier.dim.${key}`) : key.charAt(0).toUpperCase() + key.slice(1));

  // The brand's real collections (only those with an image — the slider is
  // image-led), each linking to its own collection page
  // (/ueber-uns/marken/[brand]/[collection]).
  const brandPageHref = ROUTES.marken[locale] ? `${ROUTES.marken[locale]}/${generateSlug(product.brand)}` : null;
  // "You may also like" — other pieces from the same brand (same category
  // first), via the backend's related_products endpoint.
  const [collections, related, brandCategory, firstImageSize] = await Promise.all([
    fetchCollectionsByMarke(product.brand),
    fetchRelatedProdukteNew({ marken: detail.marken, kategories: detail.kategories, path_field: detail.path_field || productSlug }),
    // Indexable brand × category page (path without locale) or null – the
    // brand page's own rule (≥ 3 products, no collection slug collision, not
    // on the audit list) and its cached backoffice calls. A failure only
    // drops this crumb.
    detail.marken ? getIndexableBrandCategoryHref(detail.marken, product.categoryKey, locale).catch(() => null) : null,
    // Design-Jury P2-20: the stage takes the first photo's real format (header
    // bytes only, memoized, never throws) instead of a fixed 3:2 box with
    // bone bars above and below. Unknown size → 3:2 as before.
    product.images[0] ? probeImageSize(`${NEW_API_SERVER}${encodeURI(product.images[0].replace(/^\/cmx(?=\/)/, ""))}`) : null,
  ]);
  // Each collection's products, for the card heart (saves them all to the
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
  // Fallback by slug: some CMS keys differ from the product key only in
  // spelling ("sofas & couches" vs "sofas-couches").
  const cmsKategorie =
    indexKategorienByKey(kategorien).get(product.categoryKey) ||
    kategorien.find((k) => k?.category_key && generateSlug(k.category_key) === categorySlug);
  const humanized = product.categoryKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const localized = localizeCategory(product.categoryKey, locale);
  const categoryLabel = (cmsKategorie && getKategorieLabel(cmsKategorie, locale)) || (localized !== product.categoryKey ? localized : humanized);

  // Runde 4 P5: "Startseite" on DE (was "Home"), sprachabhängig, visible and JSON-LD.
  const Home = homeCrumbLabel(locale);
  const productsLabel = locale === "it" ? "Prodotti" : locale === "en" ? "Products" : locale === "fr" ? "Produits" : "Produkte";
  // Translated catalogue paths (/products/…, /produits/…, /prodotti/…) — the
  // middleware serves them from this German-named folder.
  const productPath = productsPath(locale);
  const categoryPath = productsPath(locale, categorySlug);

  // Visible trail; the BreadcrumbList JSON-LD is part of the graph below.
  // Brand × category step ("Minotti Sofas & Couches", R4): only when that
  // page is indexable (≥ 3 products, no collection slug collision, not on the
  // audit list) – never a crumb to a noindex or unreachable page.
  // Runde 4 P5 (ux P2-2): H1 = brand + name ("Flos 2097-18"); a name that
  // already starts with the brand is not doubled.
  // Rat 9,5 B17: twins with the qualifier ("Minotti Torii Couchtisch").
  const display = await productDisplayName(detail, product, locale).catch(() => null);
  const displayName = display?.name || product.name;
  const productHeading =
    product.brand && !displayName.toLowerCase().startsWith(product.brand.toLowerCase()) ? `${product.brand} ${displayName}` : displayName;
  const brandCategoryLabel = brandCategory ? `${product.brand} ${categoryLabel}` : null;
  const crumbs = [
    { label: Home, href: "/" },
    { label: productsLabel, href: productPath },
    { label: categoryLabel, href: categoryPath },
    brandCategory ? { label: brandCategoryLabel, href: brandCategory } : null,
    { label: displayName },
  ].filter(Boolean);

  const hasManufacturerText = product.descriptionParagraphs.length > 0;
  // The checked copy supplements the backoffice text; it only stands in for
  // the generated fallback blurb, never for real manufacturer text.
  const hasCuratedText = copy?.paragraphs?.length > 0;
  const descriptionParagraphs = hasManufacturerText
    ? product.descriptionParagraphs
    : hasCuratedText
      ? []
      : [buildFallbackDescription(product, locale)];
  // FAQ: rendered visibly below (ProductDetailSections) under exactly this
  // condition, so the FAQPage node describes visible content only.
  const showFaq = copy?.faq?.length > 0;

  const marke = marken.find((m) => m.name1 === product.brand);
  const brandInfo = buildBrandInfo(marke, locale);
  // R9-P5 (recht P1-3): bio in the page language, none instead of English.
  const designerInfo = getDesignerInfo(product.designer, locale);
  // Labelled measures as a table + JSON-LD; unlabelled text stays raw.
  const dimTable = parseDimensionTable(product.dimensionsRaw);
  const dims = dimensionsSummaryMap(dimTable);
  const dimensionRows = formatDimensionRows(dimTable, locale, tc, dimLabel);
  const materialsFields = buildMaterialsFields(product, locale);
  const downloads = extractDownloads(detail, tc);
  // The consultation wizard pre-fills "Anfrage zu: <Marke> <Produkt>".
  // Runde 4 P5 (ux P2-2): same format as the header "Termin" link
  // (Navbar/HeaderCta.js: withContext + cleanText of the H1 text), so header
  // and content send the same ?produkt= value.
  const beratungBase = ROUTES.beratung[locale] || "/beratung";
  const consultationHref = withContext(beratungBase, { produkt: cleanText(productHeading, 120) });
  // "Planungsdaten anfragen": the same request form with the subject in the
  // first line ("Anfrage zu: Minotti Lawrence – Planungsdaten (Zeichnungen, CAD)").
  const planningRequest = {
    href: withContext(beratungBase, { produkt: cleanText(`${productHeading} – ${tc("atelier.planningSubject")}`, 120) }),
    label: tc("atelier.planningCta"),
  };

  // Minotti-Sofa → „Dieses Modell im Sofaplaner planen“ (?m=<Familie>), nur
  // wenn die Familie im Sofaplaner-Katalog existiert (sonst der allgemeine Link).
  const sofaFamily = await sofaplanerFamilySlug({ locale, brand: product.brand, name: product.name, categoryKey: product.categoryKey });

  // Only facts we can stand behind (no invented price, stock or lead time).
  const facts = [
    { key: "price", label: tc("atelier.price"), value: tc("atelier.priceValue") },
    { key: "showroom", label: tc("atelier.showroom"), value: tc("atelier.showroomValue") },
    { key: "delivery", label: tc("atelier.delivery"), value: tc("atelier.deliveryValue") },
    dims || product.dimensionsRaw
      ? { key: "dimensions", label: tc("atelier.dimensions"), value: (dims && dimensionSummary(dims, dimLabel, locale)) || product.dimensionsRaw, tabular: true, href: "#masse" }
      : null,
    brandInfo?.country ? { key: "origin", label: tc("atelier.brandOrigin"), value: brandInfo.country } : null,
  ].filter(Boolean);

  // ItemPage + Thing (no Product without offers, Runde 2 seo P1-5) + BreadcrumbList.
  // FAQPage only for a published view (buildFaqJsonLd ignores the dev preview).
  const pageUrl = localeUrl(locale, productsPath(locale, categorySlug, productSlug));
  // width/height/depth (+ weight) as QuantitativeValue – only labelled,
  // unambiguous backoffice values (src/lib/shop/dimensions.js); weight falls
  // back to the separate weight field ("3.3 kg"). Still no offers/price.
  const measures = dimensionsJsonLd(dimTable);
  const weight = !measures.weight && parseWeight(product.weightRaw);
  if (weight) measures.weight = { "@type": "QuantitativeValue", value: weight.value, unitCode: "KGM", unitText: "kg" };
  const structuredData = graph(
    productSchema({
      product,
      url: pageUrl,
      description: metadataOverride(copy).description || productMetaDescription(detail, product, locale),
      categoryLabel,
      measures,
      locale,
    }),
    breadcrumbList(
      [
        { name: Home, url: localeUrl(locale) },
        { name: productsLabel, url: localeUrl(locale, productPath) },
        { name: categoryLabel, url: localeUrl(locale, categoryPath) },
        brandCategory ? { name: brandCategoryLabel, url: localeUrl(locale, brandCategory) } : null,
        { name: product.name },
      ].filter(Boolean),
      `${pageUrl}#breadcrumb`
    ),
    buildFaqJsonLd(copy, pageUrl, { faqVisible: showFaq })
  );

  return (
    <div className="bg-surface">
      <JsonLd data={structuredData} />

      {/* Space below the sticky header (in flow); adjustable via
          --ph-page-top / --ph-page-top-lg. */}
      {/* R4 fix (QM P2-1): phones get a tighter top and a one-line trail
          (parent › piece) so H1, stage and the primary button fit the first
          screen even under the first-visit cookie banner. The full trail
          stays from sm and in the BreadcrumbList JSON-LD. */}
      {/* R5 (iPhone SE, 568 px layout height with Safari bars): on short
          phones the one-line trail drops out (it stays in the JSON-LD; brand
          and category links remain in the overline above the H1), so the
          primary button clears the first-visit cookie banner. */}
      <div className="pt-2 sm:pt-[var(--ph-page-top,2rem)] lg:pt-[var(--ph-page-top-lg,3rem)] max-sm:[@media(max-height:600px)]:hidden">
        <Container>
          <Breadcrumbs items={crumbs.slice(-2)} className="sm:hidden" />
          <Breadcrumbs items={crumbs} className="max-sm:hidden" />
        </Container>
      </div>

      {/* Atelier: gallery left (7/12), title, facts and actions right (5/12).
          R4 (Abnahme R2): on phones overline + H1 come first, above the
          stage, and the primary button follows right after it – DOM order =
          reading order (title → gallery → actions). From lg the title sits in
          row 1 of the right column, the actions in row 2 (sticky). */}
      {/* R6-produkt-perf (Fix): no Suspense boundary here – React 19 outlines large boundaries into a hidden <div id="S:0"> after </main>, so without JS the content was missing. */}
      <>
        <section aria-labelledby="product-title" className="pb-16 pt-3 sm:pt-8 lg:pb-24 lg:pt-12">
          {/* QM wm-r4: two columns from the page container's 64 rem (= lg at
              100 %), so at 200 % text size the atelier reflows to one column
              instead of a ~80 px value column (WCAG 1.4.10). */}
          <Container className="grid gap-3 sm:gap-8 @5xl/page:grid-cols-12 @5xl/page:grid-rows-[auto_1fr] @5xl/page:gap-x-grid @5xl/page:gap-y-0">
            <div className="min-w-0 @5xl/page:col-span-5 @5xl/page:col-start-8 @5xl/page:row-start-1 @5xl/page:pl-6 xl:@5xl/page:pl-12">
              <p className="text-overline uppercase text-text-soft">
                {brandPageHref ? (
                  <Link
                    href={brandPageHref}
                    locale={locale}
                    className="text-text-accent underline decoration-transparent underline-offset-4 hover:decoration-current"
                    title={t("brandPageLink", { brand: product.brand })}
                  >
                    {product.brand}
                  </Link>
                ) : (
                  <span className="text-text-accent">{product.brand}</span>
                )}
                <span aria-hidden="true"> · </span>
                <Link
                  href={categoryPath}
                  locale={locale}
                  className="underline decoration-transparent underline-offset-4 hover:decoration-current"
                >
                  {categoryLabel}
                </Link>
              </p>
              <Heading id="product-title" level={1} size="display-l" className="mt-1 sm:mt-3">
                {productHeading}
              </Heading>
              {product.designer && <p className="mt-1 text-body sm:mt-2 text-text-soft">{tc("atelier.designBy", { designer: product.designer })}</p>}
              {/* Approved lead line of the checked copy – a <p>, the H1 stays the product name. */}
              {copy?.h1 && <p className="mt-4 max-w-measure text-lead text-text">{copy.h1}</p>}
            </div>

            <div className="min-w-0 @5xl/page:col-span-7 @5xl/page:col-start-1 @5xl/page:row-span-2 @5xl/page:row-start-1">
              {product.images.length > 0 ? (
                <ProductGallery images={product.images} alt={`${product.brand} ${product.name}`} ratio={firstImageSize ? firstImageSize.width / firstImageSize.height : null} />
              ) : (
                /* R5 P1: no backoffice photo → neutral surface in the stage's
                   3:2 box (same height cap on phones), no stock photo. */
                <NoPhoto
                  label={noPhotoLabel(locale, t)}
                  mark={<Wordmark decorative tone="current" className="h-4 w-auto text-text-soft sm:h-5" />}
                  className="aspect-[3/2] w-full max-sm:max-h-[28svh] max-sm:[@media(max-height:600px)]:max-h-[18svh]"
                />
              )}
            </div>

            <div className="min-w-0 @5xl/page:col-span-5 @5xl/page:col-start-8 @5xl/page:row-start-2 @5xl/page:pl-6 xl:@5xl/page:pl-12">
              <div className="@5xl/page:sticky @5xl/page:top-32">
                <ProductActions
                  consultationHref={consultationHref}
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
                    requestConsultation: tc("atelier.ctaPrimary"),
                    note: tc("atelier.ctaNote"),
                    save: t("saveToWishlist"),
                    saved: t("savedToWishlist"),
                    callUs: tc("atelier.call"),
                  }}
                />
                {/* "Frage zu diesem Stück per WhatsApp": side path with the
                    piece as context (the H1 as shown – it already carries the
                    brand –, page URL; no personal data). */}
                <WhatsApp
                  locale={locale}
                  variant="link"
                  label="product"
                  qr
                  context={{ kind: "product", product: productHeading, brand: "" }}
                  className="mt-4"
                />

                <h2 className="sr-only">{tc("atelier.factsLabel")}</h2>
                {/* QM wm-r4 (200 % text size): the dl is its own size container – below 20 rem
                    (= 320 px at 100 %, 640 px at 200 %) the label stands above the value
                    instead of a clipped value column („Auf Anfrag…“), as on Presse. */}
                <dl className="@container/facts mt-10 border-t border-line">
                  {facts.map((f) => (
                    <div key={f.key} className="grid gap-1 border-b border-line py-4 @xs/facts:grid-cols-[7.5rem_1fr] @xs/facts:gap-4 @sm/facts:grid-cols-[9rem_1fr]">
                      <dt className="text-small text-text-soft">{f.label}</dt>
                      <dd className={`text-small text-text ${f.tabular ? "tabular" : ""}`}>
                        {f.href ? (
                          <a href={f.href} className="underline decoration-line-strong underline-offset-4 hover:decoration-current">
                            {f.value}
                          </a>
                        ) : (
                          f.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-8 border-l border-line-strong pl-5">
                  <p className="text-ui text-text">{tc("atelier.advisorTitle")}</p>
                  <p className="mt-1 max-w-measure text-small text-text-soft">{tc("atelier.advisorText")}</p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </>

      <>
        <div id="produktdetails" className="scroll-mt-28">
          <ProductDetailSections
            labels={{
              onThisPage: tc("atelier.onThisPage"),
              description: tc("atelier.descriptionHeading"),
              materials: tc("atelier.materialHeading"),
              materialFallback: tc("atelier.materialFallback"),
              dimensions: tc("atelier.dimensionsHeading"),
              dimensionsNote: tc("atelier.dimensionsNote"),
              downloads: tc("atelier.downloadsHeading"),
              downloadsText: tc("atelier.downloadsText"),
              downloadsNone: tc("atelier.downloadsNone"),
              newTab: tc("atelier.newTab"),
              planningText: tc("atelier.planningText"),
              dimensionsCaption: tc("atelier.dimensionsCaption"),
              dimensionsColLabel: tc("atelier.dimensionsColLabel"),
              dimensionsColValue: tc("atelier.dimensionsColValue"),
              manufacturerText: tc("atelier.manufacturerText"),
              readMore: tc("atelier.readMore"),
              readLess: tc("atelier.readLess"),
              curatedFacts: tc("atelier.curatedFacts"),
              factSource: tc("atelier.factSource"),
              factSourceSr: tc("atelier.factSourceSr", { brand: copy?.brand || product.brand }),
              faqNav: tc("atelier.faqNav"),
              faqHeading: tc("atelier.faqHeading", { name: copy?.productName || product.name }),
              previewNote: copy?.preview ? tc("atelier.previewNote") : null,
            }}
            curated={copy}
            fromManufacturer={hasManufacturerText}
            descriptionParagraphs={descriptionParagraphs}
            dims={dims}
            dimensionsRaw={product.dimensionsRaw}
            materialsFields={materialsFields}
            downloads={downloads}
            dimensionRows={dimensionRows}
            dimensionNotes={
              dimTable?.notes?.length
                ? dimTable.notes
                : !dimensionRows?.length && product.dimensionsRaw
                  ? [tc("atelier.dimensionsUnlabelled")]
                  : []
            }
            planningRequest={planningRequest}
            productLabel={`${product.brand} ${product.name}`}
            dimLabel={dimLabel}
          />
          <Container>
            <p className="border-t border-line py-6 text-small text-text-soft">{tc("atelier.sourceNote")}</p>
          </Container>
        </div>

        {/* Planen & Erleben (Inhaber-Entscheidung Nr. 9): 3D/AR, Sofaplaner,
            Küchenplaner, Outdoor/Ezarri – nur Deutsch (deutsche Zielseiten). */}
        <PlanLinks
          links={productPlanLinks({
            locale,
            categoryKey: product.categoryKey,
            brand: product.brand,
            name: product.name,
            sofaFamily,
            on: featureOn(),
          })}
        />

        <BuiltToStay
          labels={{
            eyebrow: tc("atelier.builtEyebrow"),
            title: tc("atelier.builtTitle"),
            lead: tc("atelier.builtLead"),
            refillTitle: tc("atelier.builtRefillTitle"),
            refillText: tc("atelier.builtRefillText"),
            partsTitle: tc("atelier.builtPartsTitle"),
            partsText: tc("atelier.builtPartsText"),
            careTitle: tc("atelier.builtCareTitle"),
            careText: tc("atelier.builtCareText"),
          }}
        />

        {related.length > 0 && (
          <Container>
            <section aria-labelledby="related-title" className="py-section">
              <p className="text-overline uppercase text-text-accent">{tc("atelier.relatedEyebrow", { brand: product.brand })}</p>
              <Heading id="related-title" level={2} size="display-m" className="mt-stack-s">
                {t("relatedHeading")}
              </Heading>
              {/* Plain <a> tiles (R6-produkt-perf); one delegated listener for
                  client navigation and hover/focus prefetch. */}
              {/* QM wm-fix3: three tiles sit in one row from sm on – in two columns
                  the third stood alone in a second row (iPad portrait). */}
              <LinkDelegate as="ul" className={`reveal-group mt-10 grid grid-cols-1 gap-x-grid gap-y-12 ${related.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                {related.map((rp, i) => (
                  <li key={rp.id} style={staggerStyle(i)}>
                    <CatalogTile
                      href={productsPath(locale, generateSlug(rp.categoryKey), rp.url_slug)}
                      locale={locale}
                      image={rp.image}
                      alt={`${rp.brand} ${rp.name}`}
                      brand={rp.brand}
                      name={rp.name}
                      wishlistProduct={{ ...rp, href: productsPath("de", generateSlug(rp.categoryKey), rp.url_slug) }}
                      /* one column on phones; square photos in the 3:2 cover frame need 1.5× (QM 01.11.2026) */
                      sizes="(min-width: 1440px) 630px, (min-width: 1024px) 45vw, (min-width: 640px) 69vw, 138vw"
                      noPhotoText={noPhotoLabel(locale, t)}
                    />
                  </li>
                ))}
              </LinkDelegate>
            </section>
          </Container>
        )}

        {/* Hidden when the brand has no collections with an image. */}
        {collectionItems.length > 0 && (
          <CollectionSlider
            eyebrow={tc("atelier.collectionsEyebrow")}
            title={getLocalizedCollectionTitle(locale, product.brand)}
            items={collectionItems}
          />
        )}

        <BrandDesignerShowcase
          designerName={product.designer}
          designerInfo={designerInfo}
          brandName={product.brand}
          brandInfo={brandInfo}
          brandPageHref={brandPageHref}
          labels={{
            eyebrow: tc("atelier.aboutEyebrow"),
            designer: t("aboutDesigner"),
            brand: t("aboutBrand"),
            founded: t("founded"),
            viewBrandPage: t("viewBrandPage"),
          }}
        />

        {/* Rat 9,5 B6 (rat-neu, Einhängen 31.10.2026): Vertrauensblock vor dem Abschluss –
            Personen nur mit eigenem Porträt und freigegebener Rolle, drei Schritte,
            Öffnungszeiten, ein Datenschutzsatz; keine Antwortfrist, kein Preis.
            Keine Suspense-Grenze (r6-produkt 3c); das Team kommt aus dem 1-h-Cache, ohne
            Daten entfällt die Personenzeile. */}
        {/* Optik-Runde (01.11.2026): Verwandte, Kollektionen und „Hinter dem
            Stück“ enden schon mit py-section – ein zweites pt-section ergab
            ~2 Abschnittsabstände Leere vor der Haarlinie. Oben nur nach dem
            vollflächigen BuiltToStay-Band. */}
        <Container className={related.length > 0 || collectionItems.length > 0 || brandInfo || designerInfo ? "pb-section" : "py-section"}>
          {/* QM wm-r4: on the product page both people stand as text entries –
              Harald has no portrait yet, and one photo next to an indented
              name read like a broken image (the team page keeps the photo). */}
          <TrustBlock locale={locale} variant="band" headingLevel={2} className="[&_li]:block [&_li>span:has(img)]:hidden" />
        </Container>

        {/* The Leitsatz IS the H2 here, the second line is an Instrument lead
            (QA P3-5: no two display lines stacked). */}
        <CTABand
          tone="raised"
          title={<Leitsatz as="span" size="m" className="block pb-2" />}
          text={
            <>
              <p className="text-lead text-text">{tc("atelier.closingTitle")}</p>
              <p className="mt-2">{tc("atelier.closingText")}</p>
            </>
          }
          primary={{ href: consultationHref, label: tc("atelier.closingPrimary") }}
          secondary={{ href: categoryPath, label: t("backToCategory", { category: categoryLabel }) }}
        />
      </>
    </div>
  );
}
