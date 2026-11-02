// JSON-LD der Ezarri-Welt (Konzept §6.2). Rein, keine Hooks.
// - Brand-Knoten mit derselben @id wie die Markenseiten (brandNodeId("ezarri")),
//   sameAs ezarri.com, ohne Logo (keine Logo-Datei im Material).
// - Mosaik-Detail als ItemPage + Thing (kein Product: ohne Preis/Bewertung wäre
//   das ein ungültiges Produkt-Snippet in der Search Console; F6 28.10.2026).
// - CollectionPage + ItemList, ImageGallery mit creditText/copyrightHolder,
//   BreadcrumbList, FAQPage (nur der Klarheit wegen), Article für die Verlegung.
// Ausgegeben auch bei EZARRI_PUBLIC = false (schadet bei noindex nicht).
import { brandNodeId } from "@/lib/seo/brandSchema";
import { EZARRI_SITE_URL } from "@/lib/ezarri/config";
import { SITE_URL, localeUrl } from "@/lib/seo/pageMetadata";
import { ORGANIZATION_ID } from "@/lib/seo/structuredData";
import { ezBreadcrumbList } from "@/lib/ezarri/crumbs";
import { ezLang } from "@/lib/ezarri/werte";

// Welle 2: jede Funktion nimmt `locale` (Standard "de"); URLs und inLanguage folgen der Sprache.
const IN_LANG = { de: "de-AT", en: "en-GB", fr: "fr", it: "it" };
const inLang = (locale) => IN_LANG[ezLang(locale)];
// 01.11.2026: Texte der Knoten auch fr/it (Reihenfolge de, en, fr, it).
const pick = (L, de, en, fr, it) => ({ de, en, fr, it })[L] ?? de;

export const BRAND_ID = brandNodeId("ezarri");
const abs = (p) => (p ? (/^https?:/.test(p) ? p : `${SITE_URL}${p}`) : undefined);
const ezarriOrg = { "@type": "Organization", name: "Ezarri", url: EZARRI_SITE_URL };

export function brandNode() {
  return { "@type": "Brand", "@id": BRAND_ID, name: "Ezarri", sameAs: [EZARRI_SITE_URL, "https://www.ezarri.com/"] };
}

/**
 * Breadcrumb-Items [{label, href}] (href ohne Locale) → BreadcrumbList.
 * Runde 4 P5 (seo P1-3): jede Stufe außer der letzten hat `item`
 * (ezBreadcrumbList wirft sonst); `pageHref` gibt der letzten Stufe die URL.
 */
export function crumbsSchema(items, { pageHref, locale } = {}, sprache = "de") {
  // Sprache als Option oder drittes Argument (Welle 2, Englisch).
  return ezBreadcrumbList(items, { siteUrl: SITE_URL, locale: ezLang(locale ?? sprache), pageHref });
}

export function graph(...nodes) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}

export function collectionPage({ path, name, description, items, locale = "de" }) {
  const L = ezLang(locale);
  const url = localeUrl(L, path);
  return {
    "@type": "CollectionPage",
    "@id": `${url}#page`,
    url,
    name,
    description,
    inLanguage: inLang(L),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": BRAND_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 100).map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: localeUrl(L, it.href) })),
    },
  };
}

/**
 * Mosaik-Detailseite als ItemPage (F6, 28.10.2026). Früher `Product` ohne
 * offers – das meldet die Search Console als ungültiges Produkt-Snippet
 * („offers, review oder aggregateRating erforderlich“). Preise gibt es nicht
 * (nur „auf Anfrage“) und Bewertungen auch nicht, also kein Product-Typ:
 * ItemPage + mainEntity `Thing` mit Name, Artikelnummer, Bildern und den
 * technischen Angaben als Text. Marke über about → Brand-@id (#brand/ezarri).
 * ref = voller Datensatz, facts = [{name, value}], kollektionPath = Seite der Kollektion.
 */
export function mosaikNode({ ref, path, kollektionName, kollektionPath, images = [], facts = [], locale = "de", farben }) {
  const L = ezLang(locale);
  const url = localeUrl(L, path);
  const name = `Ezarri ${ref.name}`;
  const colours = farben ?? ref.farben ?? [];
  const lines = [
    pick(L, "Glasmosaik (Glas, recycelt, laut Ezarri)", "Glass mosaic (recycled glass, according to Ezarri)", "Mosaïque de verre (verre recyclé, selon Ezarri)", "Mosaico di vetro (vetro riciclato, secondo Ezarri)"),
    ...(colours.length ? [`${pick(L, "Farbe", "Colour", "Couleur", "Colore")}: ${colours.join(", ")}`] : []),
    ...facts.filter((f) => f.value).map((f) => `${f.name}: ${f.value}`),
  ];
  return {
    "@type": "ItemPage",
    "@id": `${url}#page`,
    url,
    name,
    inLanguage: inLang(L),
    isPartOf: kollektionPath ? { "@type": "CollectionPage", "@id": `${localeUrl(L, kollektionPath)}#page`, url: localeUrl(L, kollektionPath), name: `Ezarri ${kollektionName || ""}`.trim() } : { "@id": `${SITE_URL}/#website` },
    about: [{ "@id": BRAND_ID }],
    ...(images.length ? { primaryImageOfPage: { "@type": "ImageObject", contentUrl: abs(images[0]), creditText: "Ezarri", copyrightHolder: ezarriOrg } } : {}),
    mainEntity: {
      "@type": "Thing",
      "@id": `${url}#mosaik`,
      name,
      ...(ref.code ? { identifier: { "@type": "PropertyValue", propertyID: pick(L, "Artikelnummer Ezarri", "Ezarri item number", "Référence Ezarri", "Codice articolo Ezarri"), value: ref.code } } : {}),
      description: lines.join(". ") + ".",
      ...(images.length ? { image: images.map(abs) } : {}),
      url,
    },
  };
}

/** @deprecated Alias – Mosaike sind kein Product-Snippet mehr (siehe mosaikNode). */
export const productNode = mosaikNode;

export function imageGallery({ path, name, items, locale = "de" }) {
  const url = localeUrl(ezLang(locale), path);
  return {
    "@type": "ImageGallery",
    "@id": `${url}#gallery`,
    url,
    name,
    associatedMedia: items
      .filter((g) => g.bild)
      .map((g) => ({
        "@type": "ImageObject",
        contentUrl: abs(`${g.bild.web}-1600.webp`),
        creditText: "Ezarri",
        copyrightHolder: ezarriOrg,
        ...(g.quelle ? { acquireLicensePage: g.quelle } : {}),
      })),
  };
}

export function faqPage({ path, items, locale = "de" }) {
  return {
    "@type": "FAQPage",
    "@id": `${localeUrl(ezLang(locale), path)}#faq`,
    inLanguage: inLang(locale),
    mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
}

export function article({ path, headline, description, locale = "de" }) {
  const url = localeUrl(ezLang(locale), path);
  return { "@type": "Article", "@id": `${url}#article`, url, headline, description, inLanguage: inLang(locale), about: { "@id": BRAND_ID }, publisher: { "@id": ORGANIZATION_ID } };
}
