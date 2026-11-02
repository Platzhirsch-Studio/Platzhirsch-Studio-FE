// src/components/Katalog/KatalogShopListe.js
// Inhaber 31.10.2026: „Wenn ich Küchengeräte klicke, will ich die gleiche
// Ansicht wie Küchen.“ – Übersicht einer Katalog-Welt (/kuechengeraete/produkte)
// im Layout der Küchen-Kategorieseite (src/app/[locale]/produkte/[category]):
// CatalogHeader (kompakt) + ShopCatalog (Filterleiste Marke/Kategorie, Sheet,
// 3er-Raster, „Mehr Produkte anzeigen“ mit ?seite=n, Zwischenbänder) +
// „Über …“-Block + A–Z-Liste aller Modelle für Crawler.
// Unterschiede zur Küchen-Kachel: Herstellerbild unverändert (object-contain
// auf ruhiger Fläche), Preiszeile „Herstellerpreis ab …“ aus preis.js, kein
// Herz (der Katalog merkt über die Detailseite, MerkenButton).
// Server Component: Texte (Namespace „katalog“ ist server-only) werden hier
// aufgelöst und als fertige Strings an die Client-Insel ShopCatalog gegeben.
import { useTranslations } from "next-intl";
import JsonLd from "@/components/Reusable/JsonLd";
import { Container, Heading, LinkArrow } from "@/components/ui";
import CatalogHeader from "@/components/ShopCatalog/catalogHeader";
import ShopCatalog from "@/components/ShopCatalog/shopCatalog";
import { schreibenHref } from "@/lib/forms/terminLink";
import { PRODUCTS_PER_PAGE } from "@/lib/shop/catalogQuery";
import { homeCrumbLabel } from "@/lib/seo/breadcrumbs";
import { kategorieKey } from "@/lib/katalog/schema";
import { WELTEN, beratungThema, produktPath, produktePath } from "@/lib/katalog/welten";
import { KATALOG_MARKEN, nachKategorie, produkteByWelt } from "@/lib/katalog";
import { anzeigePreis, preisTexte } from "./preis";
import { produktListeSchema } from "./katalogSchema";
import { anzeigeName } from "./produktTitel";
import { kachelBild } from "./kachelBild";

// QM R1: „Katalog · 581 Stücke“ passte nicht zu Küchengeräten – im Herstellerkatalog „Produkte“
// (wie die Trefferzahl daneben). Shop-Texte (catalog.categoryEyebrow) bleiben unverändert.
const KATALOG_EYEBROW = { de: "Katalog · {n} Produkte", en: "Catalogue · {n} products", fr: "Catalogue · {n} produits", it: "Catalogo · {n} prodotti" };

/** Reihenfolge der Liste: „Ausgewählte Produkte“ zuerst, dann nach Kategorie (wie KATEGORIEN), je Kategorie nach Marke. */
export function listenReihenfolge(list) {
  const sortiert = nachKategorie(list).flatMap((g) => g.produkte);
  return [...sortiert.filter((p) => p.ausgewaehlt), ...sortiert.filter((p) => !p.ausgewaehlt)];
}

/**
 * @param {{locale: string, welt: string}} props
 */
export default function KatalogShopListe({ locale, welt }) {
  const t = useTranslations("katalog");
  const ts = useTranslations("shop");
  const w = WELTEN[welt];
  const wk = `welt.${w.key}`;
  const nameOf = (slug) => KATALOG_MARKEN.find((m) => m.slug === slug)?.name || slug;
  const katLabel = (k) => t(`kategorie.${kategorieKey(k)}`);

  const alle = listenReihenfolge(produkteByWelt(welt));
  const title = t(`${wk}.produkteTitle`);
  const lead = t(`${wk}.produkteLead`);
  const path = produktePath(welt);

  // Kompakte Produkte für die Client-Insel (nur, was Kachel und Filter brauchen).
  const products = alle.map((p) => {
    const preis = preisTexte(anzeigePreis(p), t, locale);
    return {
      id: p.slug,
      // QM R1: ohne Marken-Wiederholung, einheitliche Schreibweise (produktTitel.js anzeigeName).
      name: anzeigeName(p.name, { name: nameOf(p.marke), slug: p.marke }),
      brand: nameOf(p.marke),
      categoryKey: p.kategorie,
      // QM R4: kachelBild(p) wie in der Katalog-Kachel – Dornbracht-Freisteller statt greller
      // Farbverläufe. Weißer Bildgrund verschmilzt über die Wrapper-Klasse unten (mix-blend-multiply)
      // mit der Leinenfläche: keine weißen Kästen (TARA) oder Rahmen (BORA X Pure Max).
      ...(kachelBild(p) ? { image: kachelBild(p).src } : {}),
      href: produktPath(welt, p.slug),
      ...(preis ? { price: preis.kurz } : {}),
    };
  });
  const categoryLabels = Object.fromEntries([...new Set(alle.map((p) => p.kategorie))].map((k) => [k, katLabel(k)]));

  const crumbs = [
    { label: homeCrumbLabel(locale), href: "/" },
    ...(w.hub ? [{ label: t(`${wk}.crumb`), href: w.hub }] : []),
    { label: t(`${wk}.produkteCrumb`) },
  ];
  const thema = beratungThema(alle[0]?.bereich);
  const beratung = schreibenHref(locale, { context: { thema } });
  const preisHinweis = t(welt === "kuechengeraete" ? "hinweis.preiseKueche" : welt === "accessoires" ? "hinweis.preiseAccessoires" : "hinweis.preise");

  return (
    <div data-kat-liste="shop" className="[&_article_img]:mix-blend-multiply">
      <JsonLd data={produktListeSchema(alle, locale, { name: title, path })} />
      <CatalogHeader crumbs={crumbs} schema eyebrow={KATALOG_EYEBROW[locale]?.replace("{n}", alle.length) ?? ts("catalog.categoryEyebrow", { count: alle.length })} title={title} lead={lead} compact>
        {w.hub && (
          <LinkArrow href={w.hub} className="mt-2" data-kat-ueber={welt}>
            {t("liste.ueberLink")}
          </LinkArrow>
        )}
      </CatalogHeader>

      <ShopCatalog
        products={products}
        excludeGroups={["subCategory", "material", "color", "designer", "indoorOutdoor"]}
        categoryLabels={categoryLabels}
        tileFit="contain"
        wishlist={false}
        basePath={`/${locale}${path}`}
        interlude={{
          eyebrow: t("liste.interludeEyebrow"),
          texts: [t("liste.interlude1"), t("liste.interlude2"), t("liste.interlude3")],
          link: t("produkt.beratung"),
          href: `/${locale}${beratung}`,
        }}
      />

      {/* Wie „Über diese Kategorie“ der Küchen-Seite: Einordnung, Weg zur redaktionellen Seite, Hinweise. */}
      <Container className="pb-section">
        <section aria-labelledby="kat-about" className="border-t border-line pt-10 lg:grid lg:grid-cols-12 lg:gap-grid lg:pt-14">
          <Heading id="kat-about" level={2} size="title" className="lg:col-span-4">
            {w.hub ? t("liste.ueberLink") : ts("catalog.aboutCategory")}
          </Heading>
          <div className="mt-4 max-w-measure lg:col-span-8 lg:mt-0">
            {w.hub && (
              <>
                <p className="text-body text-text-soft">{t("liste.ueberText")}</p>
                <LinkArrow href={w.hub} className="mt-2">
                  {t(`${wk}.crumb`)}
                </LinkArrow>
              </>
            )}
            <p className="mt-stack-s text-small text-text-soft">{preisHinweis}</p>
            <p className="mt-1 text-small text-text-soft">{t("hinweis.marken")}</p>
          </div>
        </section>
      </Container>

      {/* Alle Modelle als einfache Liste im Server-HTML (das Raster zeigt nur den ersten Schwung). */}
      {alle.length > PRODUCTS_PER_PAGE && (
        <Container className="pb-section">
          <details className="border-t border-line pt-6">
            <summary className="cursor-pointer py-2 text-body text-text-soft underline-offset-4 hover:underline focus-visible:underline">
              {ts("catalog.allModels", { count: alle.length })}
            </summary>
            <ul className="mt-4 grid gap-x-grid gap-y-2 text-small sm:grid-cols-2 lg:grid-cols-3">
              {[...alle]
                .sort((a, b) => `${nameOf(a.marke)} ${a.name}`.localeCompare(`${nameOf(b.marke)} ${b.name}`, locale))
                .map((p) => (
                  <li key={p.slug}>
                    <a href={`/${locale}${produktPath(welt, p.slug)}`} className="inline-block py-1 text-text underline-offset-4 hover:underline focus-visible:underline">
                      {nameOf(p.marke)} {p.name}
                    </a>
                  </li>
                ))}
            </ul>
          </details>
        </Container>
      )}
    </div>
  );
}
