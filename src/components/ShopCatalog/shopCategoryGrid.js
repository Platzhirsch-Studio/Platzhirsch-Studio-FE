import Image from "next/image";
import LinkDelegate from "@/components/Reusable/LinkDelegate";
import TileImage from "@/components/ShopCatalog/tileImage";
import { IMAGE_HOVER, staggerStyle } from "@/components/ShopCatalog/motion";
import { Container, Heading, Hairline } from "@/components/ui";
import { categoryImageBoxClass } from "@/lib/shop/categoryImages";
import { spanTile } from "@/components/ShopCatalog/gridSpan";

// Server-rendered category directory for the /produkte hub (see
// produkte/page.js), grouped like the navbar mega-menu. Neuauftritt: a quiet
// gallery – 3:2 room photographs, the name BESIDE the picture (never text on
// an image, Jury §3.1), max. 3 columns, generous section rhythm.
// The first tile image is the page's LCP candidate on every viewport, so it
// is the only one preloaded.
// R6-produkt-perf (TBT /de/produkte 211 ms): only that first picture is still
// an <Image> (it keeps its preload link); the others are plain <img> from
// getImageProps and the names plain <a href="/{locale}/…">. <LinkDelegate>
// around the grid keeps client navigation and hover/focus prefetch – ~30
// tiles no longer hydrate an <Image> and a <Link> each.
const TILE_SIZES = "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw";
// The wide opening tile of an odd group spans both columns between 640 and 1024 px.
const WIDE_TILE_SIZES = "(min-width: 1024px) 30vw, 100vw";
const TILE_IMG = `object-cover ${IMAGE_HOVER}`;

const ShopCategoryGrid = ({ sections, locale, basePath, jumpLabel }) => {
  return (
    <Container as={LinkDelegate} className="pb-section">
      {sections.length > 1 && (
        <nav aria-label={jumpLabel} className="border-y border-line py-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex min-h-11 items-center text-ui text-text underline decoration-line-strong underline-offset-4 transition-colors duration-(--duration-micro) hover:decoration-current"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-16 space-y-24 lg:mt-24 lg:space-y-32">
        {sections.map((section, sectionIndex) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-32 lg:scroll-mt-48">
            {/* QM wm-fix2: on phones the count always sits under the title –
                flex-wrap put it beside short titles and under long ones
                (Sofas & Sessel vs. Stühle & Tische), an uneven rhythm. */}
            <div className="flex flex-col gap-y-2 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-6 sm:gap-y-2">
              <Heading id={`${section.id}-title`} level={2} size="display-m">
                {section.title}
              </Heading>
              {/* QM wm-fix3: a group with one category (Licht → Leuchten) shows its
                  count once, at the tile – not the same number twice. */}
              {section.countLabel && <p className="tabular text-small text-text-soft">{section.countLabel}</p>}
            </div>
            <Hairline className="mt-6 mb-10" />

            {/* QM wm-r4: columns follow the page container (rem → at 200 % text size
                a desktop shows 2 columns instead of 3 tiles of ~330 px whose names
                overlapped the counts). In the two-column range a group with an odd
                number of tiles opens with one wide tile (spanTile), so no tile
                stands alone beside an empty half row (iPad portrait, landscape
                phone: Sofas & Sessel, Aufbewahrung, Licht). */}
            <ul className="reveal-group grid grid-cols-1 gap-x-grid gap-y-12 @min-[40rem]/page:grid-cols-2 @5xl/page:grid-cols-3">
              {section.tiles.map((cat, tileIndex) => (
                <li
                  key={cat.slug}
                  className={`@container/tile group relative ${spanTile(section.tiles.length, tileIndex) ? "@min-[40rem]/page:col-span-2 @5xl/page:col-span-1" : ""}`}
                  style={staggerStyle(tileIndex)}
                >
                  <div
                    className={`relative overflow-hidden bg-linen ${
                      spanTile(section.tiles.length, tileIndex) ? "aspect-[3/2] @min-[40rem]/page:aspect-[2/1] @5xl/page:aspect-[3/2]" : "aspect-[3/2]"
                    }`}
                  >
                    <div className={categoryImageBoxClass(cat.image)}>
                      {sectionIndex === 0 && tileIndex === 0 ? (
                        <Image
                          src={cat.image || "/Images/fallback-banner.jpg"}
                          alt={cat.alt || cat.label}
                          fill
                          sizes={spanTile(section.tiles.length, tileIndex) ? WIDE_TILE_SIZES : TILE_SIZES}
                          preload
                          className={TILE_IMG}
                        />
                      ) : (
                        <TileImage src={cat.image || "/Images/fallback-banner.jpg"} alt={cat.alt || cat.label} sizes={spanTile(section.tiles.length, tileIndex) ? WIDE_TILE_SIZES : TILE_SIZES} className={TILE_IMG} />
                      )}
                    </div>
                  </div>
                  {/* Name and count side by side only when the tile is ≥ 20 rem wide
                      (container query: at 200 % text size the count goes below). */}
                  <div className="mt-4 flex flex-col gap-1 @xs/tile:flex-row @xs/tile:items-baseline @xs/tile:justify-between @xs/tile:gap-4">
                    <h3 className="min-w-0 text-title text-text">
                      <a
                        href={`/${locale}${basePath}/${cat.slug}`}
                        className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
                      >
                        {cat.label}
                      </a>
                    </h3>
                    <span className="tabular shrink-0 text-small text-text-soft">{cat.countLabel}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
};

export default ShopCategoryGrid;
