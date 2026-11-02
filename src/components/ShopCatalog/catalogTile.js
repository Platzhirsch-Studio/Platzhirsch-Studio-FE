import TileImage from "@/components/ShopCatalog/tileImage";
import WishlistHeart from "@/components/ShopCatalog/wishlistHeart";
import NoPhoto from "@/components/ShopCatalog/noPhoto";
import { noPhotoLabel } from "@/lib/shop/noPhoto";
import { typoQuotes } from "@/lib/shop/format";
import { IMAGE_HOVER } from "@/components/ShopCatalog/motion";

// Gallery tile for catalogue grids and "related products" (Bibel §9
// ProductTile). Manufacturer shots stay uncropped (Jury §3.1): 3:2 box on
// bone. Manufacturer shots are almost all landscape room photos wider than 3:2,
// so object-cover fills the box edge to edge (QA P2-5 allows cover for these;
// contain left bone bands above and below = "card in card"). Formerly contain + multiply so white studio backgrounds melt into
// the surface instead of showing as white boxes. No inner padding and the
// heart flush in the corner (QA P2-5: no "card in card"). Whole tile is clickable via
// the name link (.ph-stretched); the heart sits above it (z-10).
// R5-produkt (P1): no image → neutral surface with the hint "Für dieses Stück
// liegt noch kein Foto vor" (noPhotoLabel; pass `noPhotoText` from t() once
// the key is in src/messages), never an unrelated stock photo.
// Server-safe (no hooks) – usable from the client catalogue and server pages.
// R6-produkt-perf (TBT /de/produkte/lamps 460 ms): no client component per
// tile any more except the heart. The photo is a plain <img> from
// getImageProps (./tileImage.js) and the name a plain <a href="/{locale}/…">
// – crawlable and working without JS as before; the list around the tiles
// turns a normal click into router.push() and prefetches on hover/focus
// (useDelegatedNavigation / <LinkDelegate>, R4-shell-perf pattern), so the
// 24 tiles no longer hydrate 24 <Link>s with their own hooks and viewport
// prefetch observers. `href` is the path without the locale (productsPath()).
export default function CatalogTile({
  href,
  locale,
  image,
  alt,
  brand,
  name,
  meta,
  wishlistProduct,
  sizes = "(min-width: 1024px) 30vw, 50vw",
  headingLevel = 3,
  cardIndex,
  eager = false,
  noPhotoText,
  // Herstellerkatalog (Inhaber 31.10.2026, /kuechengeraete/produkte): Freisteller
  // bleiben unverändert – "contain" statt "cover", ruhige Fläche dahinter.
  fit = "cover",
  // Optionale Preiszeile (Katalog: „Herstellerpreis ab € …“), bereits formatiert.
  price = null,
}) {
  const H = `h${headingLevel}`;
  const contain = fit === "contain";
  return (
    <article className="group relative flex flex-col">
      <div className={`relative aspect-[3/2] overflow-hidden ${contain ? "bg-linen" : "bg-surface-raised"}`}>
        {image ? (
          <TileImage
            src={image}
            alt={alt}
            sizes={sizes}
            eager={eager}
            className={`${contain ? "object-contain" : "object-cover"} ${IMAGE_HOVER}`}
          />
        ) : (
          <NoPhoto label={noPhotoText || noPhotoLabel(locale)} className="absolute inset-0" />
        )}
        {wishlistProduct && <WishlistHeart product={wishlistProduct} corner />}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {brand && <p className="text-overline uppercase text-text-soft">{brand}</p>}
        <H className="text-ui text-text">
          <a
            href={`/${locale}${href}`}
            data-card-index={cardIndex}
            className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
          >
            {typoQuotes(name, locale)}
          </a>
        </H>
        {meta && <p className="text-small text-text-soft">{meta}</p>}
        {price && <p className="text-small text-text tabular">{price}</p>}
      </div>
    </article>
  );
}
