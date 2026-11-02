import { getImageProps } from "next/image";

// R6-produkt-perf: a plain <img> with the optimizer's srcset instead of the
// <Image> client component. getImageProps() returns exactly the props
// <Image fill> would put on its <img> (srcset/sizes via /_next/image, lazy
// loading, async decoding, the absolute "fill" style) – but it is a pure
// function, so a catalogue tile no longer hydrates one stateful component per
// photo (useState, ref callback, onLoad handler). No placeholder is used
// anywhere in the catalogue, which is the one thing getImageProps can't do.
// Server-safe; also fine inside client components.
export default function TileImage({ src, alt = "", sizes, eager = false, quality, className = "", ...rest }) {
  const { props } = getImageProps({
    src,
    alt,
    fill: true,
    sizes,
    quality,
    loading: eager ? "eager" : undefined,
    ...rest,
  });
  // data-pin-nopin: Herstellerbild, nicht für Pinterest freigegeben – die
  // Pinterest-Browsererweiterung bietet es dann nicht zum Merken an (wirkt ohne
  // Skript, nur bildweise; QA Recht Pinterest P2-4).
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- props come from getImageProps (alt included)
  return <img {...props} className={className} data-pin-nopin="true" />;
}
