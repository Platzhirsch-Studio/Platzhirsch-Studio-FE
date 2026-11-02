// One Navetta 42 photo, UNCHANGED (Minotti condition): next/image, object-contain
// in a frame of the image's own ratio – no crop, no overlay – and the
// visible credit as caption. No KI label: real photos. Used by NavettaReference
// (server) and NavettaCarousel (client), so it has no server-only imports.
// tone "dark": caption and frame for the ink-deep „Kinosaal“ (visual-design 31.10.2026).
import Image from "next/image";
import { CREDIT, navettaSrc } from "@/lib/yacht/navetta";

export default function NavettaFigure({ img, sizes, priority = false, className = "", credit = CREDIT, tone = "light" }) {
  const dark = tone === "dark";
  return (
    <figure className={className} data-navetta-figure="">
      {/* frame in the image's own ratio → contain shows the whole photo, no bars, no crop */}
      <div className={`relative ${dark ? "bg-ink" : "bg-stone"}`} style={{ aspectRatio: `${img.width} / ${img.height}` }}>
        <Image
          src={navettaSrc(img)}
          alt={img.alt}
          fill
          sizes={sizes}
          quality={90}
          loading={priority ? "eager" : "lazy"}
          className="object-contain"
          data-navetta-image=""
        />
      </div>
      <figcaption className={`mt-2 text-small ${dark ? "text-text-inverse-soft" : "text-text-soft"}`}>
        <span className={dark ? "text-text-inverse" : "text-text"}>{img.title}</span> · <span data-navetta-credit="">{credit}</span>
      </figcaption>
    </figure>
  );
}
