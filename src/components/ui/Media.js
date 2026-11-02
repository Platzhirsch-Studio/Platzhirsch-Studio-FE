import Image from "next/image";
import cx from "./cx";

// Allowed formats only (Bibel §6). Every medium reserves its box → CLS ≤ 0.05.
const RATIOS = {
  "21/9": "aspect-[21/9]", // hero desktop
  "4/5": "aspect-[4/5]", // hero mobile, product
  "3/2": "aspect-[3/2]", // room
  "1/1": "aspect-square", // material, person
  "9/16": "aspect-[9/16]", // social
};

/**
 * next/image in a fixed-ratio box with a linen placeholder surface.
 * Next 16: use `preload` (NOT the deprecated `priority`) for the one LCP image,
 * otherwise images lazy-load.
 * @param {string|object} src
 * @param {string} alt  "Marke, Modell, Material" – "" only for decorative images
 * @param {"21/9"|"4/5"|"3/2"|"1/1"|"9/16"} [ratio="3/2"]
 * @param {string} [sizes="100vw"] ALWAYS pass the real layout width, e.g.
 *   "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
 * @param {boolean} [preload] LCP image only
 * @param {number} [quality] one of next.config qualities (50, 75, 90, 100)
 * @param {"cover"|"contain"} [fit="cover"]
 */
export default function Media({
  src,
  alt,
  ratio = "3/2",
  sizes = "100vw",
  preload = false,
  quality,
  fit = "cover",
  className,
  imgClassName,
  children,
  ...imageProps
}) {
  return (
    <div className={cx("relative overflow-hidden bg-linen", RATIOS[ratio] ?? RATIOS["3/2"], className)}>
      {src && (
        <Image
          src={src}
          alt={alt ?? ""}
          fill
          sizes={sizes}
          preload={preload || undefined}
          quality={quality}
          className={cx(fit === "contain" ? "object-contain" : "object-cover", imgClassName)}
          {...imageProps}
        />
      )}
      {children}
    </div>
  );
}
