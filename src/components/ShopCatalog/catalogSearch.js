// Search form (hub + /produkte/suche) and server-rendered results of the search page (?q=, F6;
// Runde 2: own route /produkte/suche so the hub stays static, technik P2-1)
// 28.10.2026). Plain GET form: works without JavaScript and uses the same URL
// as the Enter key in the navbar search (Navbar/SearchSheet.js). Results come
// from searchCatalog() (src/lib/shop/catalogSearch.js). Server component.
import CatalogTile from "@/components/ShopCatalog/catalogTile";
import { staggerStyle } from "@/components/ShopCatalog/motion";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import { Container, Heading } from "@/components/ui";
import { localizeCategory } from "@/lib/seo/productCategories";
import { generateSlug } from "@/lib/slugify";
import { productsPath } from "@/utils/routing";

const COPY = {
  de: { label: "Im Katalog suchen", submit: "Suchen", heading: (q) => `Suchergebnisse für „${q}“`, count: (n) => (n === 1 ? "1 Stück gefunden." : `${n} Stücke gefunden.`), none: (q) => `Für „${q}“ haben wir kein Stück gefunden. Versuchen Sie einen Marken- oder Produktnamen oder stöbern Sie in den Kategorien unten.`, brand: "Marke", category: "Kategorie", products: "Gefundene Stücke", reset: "Suche zurücksetzen", all: "Alle Kategorien", title: (q) => `Suche „${q}“ – Produktkatalog` },
  en: { label: "Search the catalogue", submit: "Search", heading: (q) => `Search results for “${q}”`, count: (n) => (n === 1 ? "1 piece found." : `${n} pieces found.`), none: (q) => `We found no piece for “${q}”. Try a brand or product name, or browse the categories below.`, brand: "Brand", category: "Category", products: "Pieces found", reset: "Clear search", all: "All categories", title: (q) => `Search “${q}” – Product catalogue` },
  fr: { label: "Rechercher dans le catalogue", submit: "Rechercher", heading: (q) => `Résultats pour « ${q} »`, count: (n) => (n === 1 ? "1 pièce trouvée." : `${n} pièces trouvées.`), none: (q) => `Aucune pièce trouvée pour « ${q} ». Essayez un nom de marque ou de produit, ou parcourez les catégories ci-dessous.`, brand: "Marque", category: "Catégorie", products: "Pièces trouvées", reset: "Effacer la recherche", all: "Toutes les catégories", title: (q) => `Recherche « ${q} » – Catalogue` },
  it: { label: "Cerca nel catalogo", submit: "Cerca", heading: (q) => `Risultati per «${q}»`, count: (n) => (n === 1 ? "1 pezzo trovato." : `${n} pezzi trovati.`), none: (q) => `Nessun pezzo trovato per «${q}». Provi con un marchio o un nome di prodotto, oppure sfogli le categorie qui sotto.`, brand: "Marchio", category: "Categoria", products: "Pezzi trovati", reset: "Cancella ricerca", all: "Tutte le categorie", title: (q) => `Ricerca «${q}» – Catalogo` },
};
export const searchCopy = (locale) => COPY[locale] || COPY.de;

const withLocale = (locale, href) => `/${locale}${href}`;
const CHIP = "ph-press inline-flex min-h-11 items-center border border-line px-4 text-ui text-text transition-colors duration-(--duration-micro) hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2";

export function CatalogSearchForm({ locale, q }) {
  const c = searchCopy(locale);
  return (
    <form role="search" action={withLocale(locale, `${productsPath(locale)}/suche`)} method="get" className="mt-8 flex max-w-xl flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 basis-56 flex-col gap-1 text-ui text-text-soft">
        {c.label}
        <input
          type="search"
          name="q"
          defaultValue={q}
          minLength={2}
          maxLength={100}
          autoComplete="off"
          enterKeyHint="search"
          className="min-h-11 w-full border-b border-line-strong bg-transparent px-1 py-2 text-body text-text focus-visible:border-text focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </label>
      <button type="submit" className="ph-press min-h-11 border border-text px-5 text-ui text-text transition-colors duration-(--duration-micro) hover:bg-text hover:text-surface focus-visible:outline-2 focus-visible:outline-offset-2">
        {c.submit}
      </button>
    </form>
  );
}

export function CatalogSearchResults({ locale, q, hits, basePath }) {
  const c = searchCopy(locale);
  const n = hits.products.length;
  const empty = !n && !hits.brands.length && !hits.categories.length;
  return (
    <Container as={LinkDelegate} className="pb-4 pt-10 lg:pt-14">
      <section aria-labelledby="katalog-suche-titel" data-testid="katalog-suche">
        <Heading level={2} size="display-m" id="katalog-suche-titel">
          {c.heading(q)}
        </Heading>
        <p className="mt-3 text-body text-text-soft" role="status">
          {empty ? c.none(q) : c.count(n)}{" "}
          <a href={withLocale(locale, productsPath(locale))} className="underline underline-offset-4">
            {c.reset}
          </a>
        </p>
        {hits.brands.length || hits.categories.length ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {hits.brands.map((b) => (
              <li key={`b-${b.href}`}>
                <a href={withLocale(locale, b.href)} className={CHIP}>
                  {c.brand}: {b.name}
                </a>
              </li>
            ))}
            {hits.categories.map((cat) => (
              <li key={`c-${cat.slug}`}>
                <a href={withLocale(locale, `${basePath}/${cat.slug}`)} className={CHIP}>
                  {c.category}: {cat.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {n ? (
          <ul className="reveal-group mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-label={c.products}>
            {hits.products.map((p, index) => (
              <li key={p.id} style={staggerStyle(index)}>
                <CatalogTile
                  href={productsPath(locale, generateSlug(p.categoryKey), p.url_slug)}
                  locale={locale}
                  image={p.image}
                  alt={`${p.brand} ${p.name}`}
                  brand={p.brand}
                  name={p.name}
                  meta={localizeCategory(p.categoryKey, locale)}
                  wishlistProduct={{ ...p, href: productsPath("de", generateSlug(p.categoryKey), p.url_slug) }}
                  cardIndex={index}
                  eager={index < 3}
                  sizes="(min-width: 1440px) 420px, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                />
              </li>
            ))}
          </ul>
        ) : null}
        <Heading level={2} size="display-m" className="mt-16">
          {c.all}
        </Heading>
      </section>
    </Container>
  );
}
