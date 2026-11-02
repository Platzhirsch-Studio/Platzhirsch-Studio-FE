// Brands of the yacht page with REAL product images (manufacturer catalogue
// images from the live-checked concept products, src/lib/yacht/catalog.js) –
// up to two per brand, uniform ProductTile cards. Brand name links to the
// brand page; every tile links to its product. Server component.
// Rows are always full (QA round 2, P2.2): the column count of a group
// follows its brand count (shelfLayout), a brand with one product shows it as
// one landscape tile as high as two square tiles; phones swipe through the
// cards of a group (snap carousel, full-width tile). No row is more than a
// third empty on any device.
import { useLocale } from "next-intl";
import { SmartLink } from "@/components/ui";
import { yachtUi } from "@/lib/yacht/ui";
import { ROUTES } from "@/utils/routing";
import { shelfLayout, shelfSpans12 } from "@/lib/yacht/layout";
import ProductTile from "./ProductTile";
import SnapHint from "./SnapHint";

const TILE_SIZES = {
  4: "(min-width: 1440px) 150px, (min-width: 1280px) 11vw, (min-width: 768px) 22vw, 45vw",
  3: "(min-width: 1440px) 200px, (min-width: 1280px) 15vw, (min-width: 768px) 22vw, 45vw",
  2: "(min-width: 1440px) 310px, (min-width: 768px) 22vw, 45vw",
};
// a brand with one product: one landscape tile over the card's full width
const SINGLE_SIZES = {
  4: "(min-width: 1440px) 300px, (min-width: 1280px) 22vw, (min-width: 768px) 45vw, 92vw",
  3: "(min-width: 1440px) 400px, (min-width: 1280px) 30vw, (min-width: 768px) 45vw, 92vw",
  2: "(min-width: 1440px) 620px, (min-width: 768px) 45vw, 92vw",
};
// QM r2: ein 12-Spalten-System für alle Gruppen (lib/yacht/layout.js → shelfSpans12), Klassen statisch
// QM r4 (1440 px, 200 % Text): das 12er-Raster zusätzlich erst ab 48 rem Containerbreite – bei großer
// Schrift bleiben es zwei Karten je Reihe, statt vier schmaler Spalten mit versetzten Bildern.
const XL_SPAN12 = { 3: "xl:@[48rem]/shelf:col-span-3", 4: "xl:@[48rem]/shelf:col-span-4", 6: "xl:@[48rem]/shelf:col-span-6", 12: "xl:@[48rem]/shelf:col-span-12" };


/**
 * Up to `n` products of a brand from all concepts, unique ids: `featured`
 * ids first (e.g. Minotti sofa and coffee table instead of fabric swatches),
 * then cut-outs, then mood photos.
 */
export function productsOfBrand(concepts, brand, n = 2, featured = []) {
  const seen = new Map();
  for (const c of concepts) for (const p of c.products) if (p.brand === brand && p.image && !seen.has(p.id)) seen.set(p.id, p);
  const rank = (p) => (featured.includes(p.id) ? featured.indexOf(p.id) - featured.length : 0);
  return [...seen.values()].sort((a, b) => rank(a) - rank(b) || Number(a.imageFit === "cover") - Number(b.imageFit === "cover")).slice(0, n);
}

// perBrand: products per brand (R7-P4, R2 ux P2-4: fewer product links; yacht page passes 1)
export default function BrandShelf({ groups, concepts, perBrand = 2 }) {
  const locale = useLocale();
  const t = yachtUi(locale);
  const brandsPath = ROUTES.marken[locale] || ROUTES.marken.de;
  return groups.map((group) => {
    const n = group.items.length;
    const { xl, lastSpanMd } = shelfLayout(n);
    const spans12 = shelfSpans12(n);
    return (
    <div key={group.title} className="mt-stack-m first:mt-0 md:mt-12" data-yacht-brands="">
      <h3 className="text-overline uppercase text-text-soft">{group.title}</h3>
      {/* phones: one card per swipe (snap carousel), from 768 px a grid */}
      <div className="@container/shelf">
      <ul
        className={`-mx-gutter mt-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-gutter scroll-px-gutter [scrollbar-width:thin] md:mx-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-2 md:overflow-visible md:px-0 xl:@[48rem]/shelf:grid-cols-12`}
        data-yacht-brand-cols={xl}
      >
        {group.items.map((brand, i) => {
          const products = productsOfBrand(concepts, brand.name, perBrand, brand.featured);
          // uncropped landscape mood photos (Minotti) get landscape tiles
          const wide = products.length > 0 && products.every((p) => p.imageFit === "contain" && p.imageKind === "stimmung");
          const last = i === n - 1;
          const span = [last && lastSpanMd === 2 ? "md:col-span-2" : "", XL_SPAN12[spans12[i]] ?? XL_SPAN12[4]].join(" ");
          return (
            <li key={brand.slug} className={`w-[78%] max-w-[22rem] shrink-0 snap-start border-t border-line py-3 md:flex md:w-auto md:max-w-none md:flex-col md:py-6 ${span}`}>
              <p className="font-display text-display-m text-text">
                <SmartLink
                  href={`${brandsPath}/${brand.slug}`}
                  className="inline-flex min-h-11 items-center underline decoration-transparent underline-offset-8 transition-colors duration-(--duration-micro) hover:decoration-current"
                >
                  {brand.name}
                </SmartLink>
              </p>
              {/* QM r1: Beschreibung auch auf dem Handy (vorher nur der Name – Karten wirkten leer) */}
              <p className="mt-2 max-w-measure text-body text-text-soft max-md:text-small">{brand.text}</p>
              {products.length > 0 && (
                <ul className={`mt-5 grid gap-3 max-md:hidden md:mt-auto md:pt-5 ${products.length === 1 ? "grid-cols-1" : "grid-cols-2"}`} aria-label={t.productsOf(brand.name)}>
                  {products.map((p) => (
                    <ProductTile
                      key={p.id}
                      p={p}
                      sizes={products.length === 1 ? SINGLE_SIZES[xl] : TILE_SIZES[xl]}
                      as="p"
                      meta={false}
                      wide={wide}
                      single={products.length === 1}
                      square
                      landscape={xl === 2}
                    />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      </div>
      {n > 1 && <SnapHint label={t.swipeHint} bp="md" />}
    </div>
    );
  });
}
