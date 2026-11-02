// Blur preview without next/image's placeholder="blur" (R2 P2, Android).
// next/image flips an internal `blurComplete` state asynchronously after
// img.decode(). When a dev HMR refresh (or any discarded hydration attempt)
// restarts the render, that callback lands on a fiber that never mounted and
// React logs "Can't perform a React state update on a component that hasn't
// mounted yet". Painting the static blurDataURL as a CSS background needs no
// state at all; the loaded photo simply covers it.
export function blurBackdrop(src) {
  const url = src && typeof src === "object" ? src.blurDataURL : null;
  if (!url) return undefined;
  return {
    backgroundImage: `url("${url}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}
