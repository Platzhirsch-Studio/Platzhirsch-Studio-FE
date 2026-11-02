import Image from "next/image";
import cx from "./cx";
import SmartLink from "./SmartLink";

/**
 * Product tile (Bibel §9 ProductTile): 4:5 image on bone, brand (overline),
 * name, optional meta line (price frame, origin, dimensions – tabular).
 * Whole tile clickable via the name link. Optional second image fades in on
 * hover – only on devices that hover, never on touch, never with reduced motion.
 * @param {string} href
 * @param {{src, alt}} image        primary image (alt: "Marke Modell, Material")
 * @param {{src}} [hoverImage]      second view (decorative, alt="")
 * @param {string} [brand]
 * @param {string} name
 * @param {ReactNode} [meta]        e.g. "ab € 4.900" / "Preis auf Anfrage" / "Herstellung: Italien"
 * @param {ReactNode} [badge]       <Badge> from backoffice data only
 * @param {string} [sizes]          default fits a 1/2/3-column grid
 * @param {boolean} [preload]       only if this tile is the LCP element
 * @param {2|3|4} [headingLevel=3]
 */
export default function ProductCard({
  href,
  image,
  hoverImage,
  brand,
  name,
  meta,
  badge,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  preload = false,
  headingLevel = 3,
  as: Tag = "article",
  className,
}) {
  const H = `h${headingLevel}`;
  return (
    <Tag className={cx("group relative flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-raised">
        {image?.src && (
          <Image src={image.src} alt={image.alt ?? ""} fill sizes={sizes} preload={preload || undefined} className="object-cover" />
        )}
        {hoverImage?.src && (
          <Image src={hoverImage.src} alt="" aria-hidden="true" fill sizes={sizes} className="ph-card-media__alt object-cover" />
        )}
        {badge && <div className="absolute left-3 top-3 z-[2]">{badge}</div>}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {brand && <p className="text-overline uppercase text-text-soft">{brand}</p>}
        <H className="text-ui text-text">
          <SmartLink
            href={href}
            className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
          >
            {name}
          </SmartLink>
        </H>
        {meta && <p className="tabular text-small text-text-soft">{meta}</p>}
      </div>
    </Tag>
  );
}
