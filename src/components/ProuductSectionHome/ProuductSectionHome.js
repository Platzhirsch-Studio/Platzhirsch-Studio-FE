import "server-only";
import { getTranslations } from "next-intl/server";
import { LinkArrow, Media, Section, SmartLink } from "@/components/ui";
import SectionIntro from "@/components/Home/SectionIntro";
import ScrollRow from "@/components/Home/ScrollRow";
import BrandList from "@/components/Home/BrandList";
import { getHomeT } from "@/components/Home/copy";
import { ROW_ITEM, ROW_MOBILE, ROW_REVEAL, SECTION_Y, scrollLabels } from "@/components/Home/row";
import { fetchProduktNewByPathField, fetchProdukteNewByMarke } from "@/lib/api/fetchAllProdukte";
import { buildShopProducts, toShopProductDetail } from "@/lib/shop/shopProducts";
import { generateSlug } from "@/lib/slugify";
import { productsPath } from "@/utils/routing";

// Curated selection of the homepage (Bibel §11 "Kuratieren", §10.2): six real
// catalogue pieces across rooms and manufacturers instead of the former
// "Trend-Produkte" strip (8 × Minotti). Server component, no carousel JS.
//
// The list holds real path_field values (checked against the production
// backoffice on 26.10.2026). Each detail is fetched with the same URL the
// product page uses, so the data cache is shared. A missing or inactive
// entry simply drops out; with fewer than 4 left, the newest Minotti pieces
// fill up so the section never shows half empty.
//
// Manufacturer images are shown uncropped (object-contain on linen, Jury
// §3.1); multiply blends their white studio background into the surface.
// `image` = index of the gallery image to show: the free-standing studio
// shot, so the six tiles read as one calm set (checked visually 26.10.2026;
// most first images are room scenes). Falls back to the first image.
// `lift`: the Poliform studio shots have a light grey (#f8f8f8) ground, not
// white; multiply alone leaves a visible rectangle on linen (QA runde 1,
// P2-1). brightness(1.03) lifts that ground to white before the blend, so
// all six tiles read as one surface. Colours of the piece move by 3 %.
export const CURATED = [
  { slug: "sofas-couches-westside-soft", image: 0, lift: true, fade: "short" }, // Poliform · Wohnen
  { slug: "armchairs-stools-volkshaus-lounge-chair", image: 2 }, // ClassiCon · Wohnen
  { slug: "lamps-taraxacum-88-suspension-1", image: 0, optic: "large" }, // Flos · Licht
  { slug: "beds-yume", image: 0, lift: true, fade: "long" }, // Poliform · Schlafen
  { slug: "side-tables-bell-side-table", image: 3, optic: "small" }, // ClassiCon · Wohnen
  { slug: "lounge-furniture-daybeds-welcome-outdoor-sofa", image: 0 }, // Paola Lenti · Outdoor
];
const MIN_ITEMS = 4;

// QM shell-home r3 ("Sechs Stücke" unruhig): the studio shots frame their
// pieces very differently – Taraxacum is a small ball under a long cable in a
// wide white field, the Bell table fills 60 % of its file. An optical size per
// tile (transform only; the file and its pixels stay untouched) evens the
// set out. "large" also asks for a 1.4× wider file, so the enlarged lamp is
// never upscaled. Static strings for Tailwind.
const OPTIC = {
  large: { img: "[transform:scale(1.4)]", sizes: "(min-width: 1024px) 42vw, (min-width: 640px) 65vw, 62vw" },
  small: { img: "[transform:scale(0.88)]", sizes: null },
};
const SIZES = "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 44vw";
// Designer line (QM shell-home r3): "Design: Jean-/Marie Massaud",
// "Herzog &/de Meuron" broke inside the name – non-breaking hyphen and
// spaces around "&" keep those parts together.
const designerName = (name) => String(name).replace(/-/g, "\u2011").replace(/ & /g, "\u00a0&\u00a0");

// QM shell-home r2: the floor shadow of these two Poliform shots runs into the
// right edge of the file and stopped there as a hard, lighter rectangle edge
// on linen. A short mask fade on the right image edge lets it run out (the
// pixels of the piece are untouched: Westside's side table ends at 96 %, the
// Yume headboard at 91 % of the file width). The files are 6:7; from sm the
// 4:5 tile is filled in width (fade at 100 %), the square phone tile is filled
// in height (image edge at 92.9 % of the box). Static strings for Tailwind.
const FADE = {
  short:
    "[mask-image:linear-gradient(to_right,#000_96%,transparent)] max-sm:[mask-image:linear-gradient(to_right,#000_89.9%,transparent_92.9%)] [mask-origin:content-box] [mask-repeat:no-repeat]",
  long:
    "[mask-image:linear-gradient(to_right,#000_91%,transparent)] max-sm:[mask-image:linear-gradient(to_right,#000_85.2%,transparent_92.9%)] [mask-origin:content-box] [mask-repeat:no-repeat]",
};

// Category links under the selection (QA runde 1, P3-13): the former six
// category tiles linked Sessel, Tische and Leuchten directly; this line keeps
// that link depth. Labels come from the shop menu (ProductsMenu in messages).
const CATEGORY_LINKS = ["sofas-couches", "armchairs-stools", "dining-tables", "coffee-tables", "lamps", "beds", "lounge-furniture-daybeds"];

async function categoryLabels(locale) {
  const t = await getTranslations({ locale, namespace: "ProductsMenu" });
  const groups = t.has("groups") ? t.raw("groups") : [];
  const labels = new Map(groups.flatMap((g) => (g.items || []).map((item) => [item.key, item.label])));
  return CATEGORY_LINKS.filter((key) => labels.has(key)).map((key) => ({ key, label: labels.get(key) }));
}

async function loadCurated() {
  const details = await Promise.all(CURATED.map((c) => fetchProduktNewByPathField(c.slug, "de").catch(() => null)));
  const items = details
    .map((detail, i) => {
      if (!detail || detail.status !== "Aktiv" || !detail.kategories) return null;
      const p = toShopProductDetail(detail, "de");
      const image = p?.images?.[CURATED[i].image] || p?.images?.[0];
      if (!image) return null;
      const { slug } = CURATED[i];
      return { id: slug, slug, lift: Boolean(CURATED[i].lift), fade: CURATED[i].fade, optic: CURATED[i].optic, name: p.name, brand: p.brand, designer: p.designer, categoryKey: p.categoryKey, image };
    })
    .filter(Boolean);
  if (items.length >= MIN_ITEMS) return items;

  const fill = buildShopProducts(await fetchProdukteNewByMarke("Minotti").catch(() => []))
    .filter((p) => p.image && !items.some((i) => i.slug === p.url_slug))
    .slice(0, CURATED.length - items.length)
    .map((p) => ({ id: p.url_slug, slug: p.url_slug, name: p.name, brand: p.brand, designer: p.designer, categoryKey: p.categoryKey, image: p.image }));
  return [...items, ...fill];
}

// B12 (31.10.2026, Startseite 13 → 9 Kapitel): the brands are the foot of this
// chapter (pieces and their manufacturers together; BrandList embedded) instead
// of a chapter of their own. Without products (backend down) the brand list
// stands alone, so its crawlable brand links never disappear.
export default async function CuratedSelection({ locale, brands }) {
  const [t, items, categories] = await Promise.all([getHomeT(locale), loadCurated(), categoryLabels(locale)]);
  if (items.length === 0) return <BrandList locale={locale} brands={brands} />;

  return (
    <Section labelledBy="home-selection-title" spacing="none" className={SECTION_Y}>
      <SectionIntro
        id="home-selection-title"
        eyebrow={t("selection.eyebrow")}
        title={t("selection.title")}
        lead={t("selection.lead")}
        aside={<LinkArrow href={productsPath(locale)}>{t("selection.all")}</LinkArrow>}
      />
      {/* Mobile (R3, page length): one scroll-snap row (44 vw, two pieces and
          a peek, square tiles – the studio shots are shown uncropped anyway) with visible back/forward buttons instead of three rows of
          two; from sm the grid (2, from lg 3 columns). */}
      <div className="mt-6 sm:mt-12 lg:mt-12">
        <ScrollRow
          id="home-selection-list"
          label={t("selection.eyebrow")}
          labels={scrollLabels(t)}
          className={`${ROW_MOBILE} ${ROW_REVEAL} sm:grid-cols-2 sm:gap-x-grid sm:gap-y-10 lg:grid-cols-3`}
        >
        {items.map((p) => (
          <li key={p.id} className={`${ROW_ITEM} w-[44vw]`}>
            <article className="group relative flex flex-col">
              <Media
                src={p.image}
                alt={`${p.brand} ${p.name}`}
                ratio="4/5"
                className="max-sm:aspect-square"
                fit="contain"
                sizes={OPTIC[p.optic]?.sizes || SIZES}
                imgClassName={`${OPTIC[p.optic]?.img || ""} p-3 mix-blend-multiply transition-transform duration-(--duration-enter) ease-quiet motion-safe:group-hover:scale-[1.03] motion-reduce:transition-none sm:p-6${p.lift ? " brightness-[1.03]" : ""}${p.fade ? ` ${FADE[p.fade]}` : ""}`}
              />
              <div className="mt-3 flex flex-col gap-1">
                <p className="text-overline uppercase text-text-soft">{p.brand}</p>
                <h3 className="text-ui text-text">
                  <SmartLink
                    href={productsPath(locale, generateSlug(p.categoryKey), p.slug)}
                    className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
                  >
                    {p.name}
                  </SmartLink>
                </h3>
                {p.designer && <p className="text-small text-text-soft">{t("selection.designer", { name: designerName(p.designer) })}</p>}
              </div>
            </article>
          </li>
        ))}
        </ScrollRow>
      </div>
      {categories.length > 0 && (
        // Phones: hidden (F1, page length – gesamtwerk P2-5 "Sechs Stücke mobil
        // kürzen"); the same categories stay one tap away in the menu "Wohnen".
        <nav aria-labelledby="home-selection-categories" className="mt-6 border-t border-line pt-4 max-sm:hidden sm:mt-12 sm:pt-6 lg:mt-12">
          <h3 id="home-selection-categories" className="text-overline uppercase text-text-soft">
            {t("selection.categories")}
          </h3>
          <ul className="mt-1 flex flex-wrap gap-x-5 sm:mt-2 sm:gap-x-6">
            {categories.map((c) => (
              <li key={c.key}>
                <SmartLink
                  href={productsPath(locale, c.key)}
                  className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                >
                  {c.label}
                </SmartLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <BrandList locale={locale} brands={brands} embedded />
    </Section>
  );
}
