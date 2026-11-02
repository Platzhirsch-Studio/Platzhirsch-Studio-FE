import { getImageProps } from "next/image";

// Request of the lightbox photo, shared by the gallery (warm-up) and the
// lightbox itself, so both ask the optimizer for the same file.
// QM wm-r4 (1920 px screen): the lightbox first showed the 720 px stage file
// upscaled to ~1790 px (soft, JPEG artefacts) until its own file arrived. The
// gallery now fetches that file on the first hover/focus of an opener – the
// browser picks the same srcset candidate as the <Image> later, so by the
// click it usually comes from the cache. Small module (no React, no icons):
// it does not pull the lightbox chunk into the page bundle.
export const LIGHTBOX_SIZES = "100vw";
export const LIGHTBOX_QUALITY = 90;

const warmed = new Set();

/** Starts the download of the lightbox version of `src` once (browser only). */
export function preloadLightboxImage(src) {
  if (typeof window === "undefined" || !src || warmed.has(src)) return;
  warmed.add(src);
  try {
    const { props } = getImageProps({ src, alt: "", fill: true, sizes: LIGHTBOX_SIZES, quality: LIGHTBOX_QUALITY });
    const img = new window.Image();
    img.decoding = "async";
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
  } catch {
    warmed.delete(src);
  }
}
