// Öffentliches Referenzbild aus dem Projekt-Tagebuch: <picture> mit AVIF/WebP
// direkt von /api/portal/tagebuch/referenz/… (KEIN next/image: dessen Optimizer-
// Cache hält Bilder 30 Tage, ein Widerruf muss aber sofort wirken).
// `bild.src` ist die größte WebP-Variante; die kleineren Größen ergeben sich aus
// demselben Muster (…-<breite>.<fmt>), BILD_BREITEN bis zur Originalbreite.
import { BILD_BREITEN } from "@/lib/portal/tagebuch/config";

const MUSTER = /^(.*-)(\d{3,4})\.(?:avif|webp)$/;

export function referenzSrcSet(src, maxW, fmt) {
  const m = MUSTER.exec(src);
  if (!m) return "";
  const breiten = [...new Set(BILD_BREITEN.map((w) => Math.min(w, maxW)))];
  return breiten.map((w) => `${m[1]}${w}.${fmt} ${w}w`).join(", ");
}

export default function ReferenzBild({ bild, sizes, priority = false, caption = true }) {
  return (
    <figure className="m-0">
      <picture>
        <source type="image/avif" srcSet={referenzSrcSet(bild.src, bild.width, "avif")} sizes={sizes} />
        <source type="image/webp" srcSet={referenzSrcSet(bild.src, bild.width, "webp")} sizes={sizes} />
        <img
          src={bild.src}
          alt={bild.alt}
          width={bild.width}
          height={bild.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          className="block h-auto w-full bg-surface-band"
        />
      </picture>
      {caption && <figcaption className="mt-2 text-small text-text-soft">Foto: {bild.fotograf}</figcaption>}
    </figure>
  );
}
