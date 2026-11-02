import TileImage from "@/components/ShopCatalog/tileImage";
import { isExternal } from "@/components/ui/SmartLink";

// R6-produkt-perf: the product tile of the brand pages (Marke, Marke ×
// Kategorie) with the markup and classes of ui/ProductCard (Bibel §9: 4:5 on
// bone, brand overline, name link, optional hover view and badge) – but
// without client components: the photos are plain <img> from getImageProps
// (ShopCatalog/tileImage.js) and the name a plain <a href="/{locale}/…">.
// The page wraps its content in <LinkDelegate>, which keeps client
// navigation and hover/focus prefetch with one listener. On /marken/minotti
// that is 12 tiles × (2 <Image> + 1 <Link>) fewer hydrated components.
// `href` is the path without the locale, as for ProductCard/SmartLink.
export default function BrandTile({
  href,
  locale = "de",
  image,
  hoverImage,
  brand,
  name,
  meta,
  badge,
  // 4:5 frame, mostly landscape photos (object-cover) → ~2× the frame width (QM 01.11.2026).
  sizes = "(min-width: 1024px) 66vw, (min-width: 640px) 100vw, 200vw",
  preload = false,
  headingLevel = 3,
  as: Tag = "article",
  className = "",
}) {
  const H = `h${headingLevel}`;
  const url = !href || isExternal(href) ? href : `/${locale}${href}`;
  return (
    <Tag className={`group relative flex flex-col ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-linen">
        {image?.src && (
          <TileImage
            src={image.src}
            alt={image.alt ?? ""}
            sizes={sizes}
            eager={preload}
            fetchPriority={preload ? "high" : undefined}
            className="object-cover"
          />
        )}
        {hoverImage?.src && <TileImage src={hoverImage.src} alt="" aria-hidden="true" sizes={sizes} className="ph-card-media__alt object-cover" />}
        {badge && <div className="absolute left-3 top-3 z-[2]">{badge}</div>}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {brand && <p className="text-overline uppercase text-text-soft">{brand}</p>}
        <H className="text-ui text-text">
          <a
            href={url}
            className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
          >
            {name}
          </a>
        </H>
        {meta && <p className="tabular text-small text-text-soft">{meta}</p>}
      </div>
    </Tag>
  );
}
