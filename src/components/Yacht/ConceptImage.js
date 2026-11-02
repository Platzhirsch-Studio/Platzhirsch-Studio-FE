// Concept image (AI image or Blender rendering, 02.11.2026) with art direction-free <picture> (AVIF + WebP, 1200/2400 w,
// pre-built in public/labs/yacht – no re-encoding by the image optimizer),
// the visible KI label ON the image and a caption with the honest note where
// the result differs from the concept. Server component.
import KiLabel from "./KiLabel";

/** Blurred 24-px preview + mean colour while the image loads (LQIP, ~200 B). */
export function lqipStyle(image, ratioClass) {
  return {
    ...(ratioClass ? null : { aspectRatio: image.ratio }),
    ...(image.tone ? { backgroundColor: image.tone } : null),
    ...(image.lqip ? { backgroundImage: `url(${image.lqip})` } : null),
  };
}

/**
 * @param {object} image renderView(...) from src/lib/yacht/model.js
 * @param {string} sizes real layout width
 * @param {boolean} [priority] LCP candidate: eager + fetchpriority high
 * @param {string} [ratioClass] override box ratio (e.g. "aspect-[21/9]")
 * @param {boolean} [caption=true]
 */
export default function ConceptImage({ image, sizes, priority = false, ratioClass, caption = true, className = "", imgClassName = "" }) {
  const set = (fmt) => `${image[fmt][1200]} 1200w, ${image[fmt][2400]} 2400w`;
  return (
    <figure className={className}>
      <div className={`relative overflow-hidden bg-linen bg-cover bg-center ${ratioClass || ""}`} style={lqipStyle(image, ratioClass)}>
        <picture>
          <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
          <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
          <img
            src={image.webp[1200]}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding={priority ? "sync" : "async"}
            className={`absolute inset-0 size-full object-cover ${imgClassName}`}
            data-pin-nopin="true" // Konzeptbild Yacht: nicht für Pinterest (QA Recht Pinterest P2-4)
          />
        </picture>
        <KiLabel ki={image.kiGenerated !== false} className="absolute bottom-3 left-3" />
      </div>
      {caption && (
        <figcaption className="mt-3 text-small text-text-soft">
          <span className="text-text">{image.title}</span>
          {image.note && <span> · {image.note}</span>}
        </figcaption>
      )}
    </figure>
  );
}
