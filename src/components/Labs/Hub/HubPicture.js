import cx from "@/components/ui/cx";
import { hubSrcSet, hubVariant } from "./hubImage";

// Kartenbild der Leistungs-Übersicht ohne /_next/image (P6 Runde 2,
// r2-technik P1-2: Optimizer-Hänger). Gleiche Box wie <Media ratio="3/2">:
// feste 3:2-Fläche (CLS 0), Leinen-Fläche als Platzhalter. Die Größen liegen
// vorab als AVIF/WebP unter public/bilder/leistungen/ (tools/variants.mjs).
// Runde 5 (gesamtwerk P2): Pfad ohne /labs/hub/v/; Leinen-Fläche bleibt
// sichtbar, falls ein Bild unter Last ausfällt (kein leerer Kasten).
export default function HubPicture({ id, alt, sizes, preload = false, className, imgClassName }) {
  return (
    <div className={cx("relative aspect-[3/2] overflow-hidden bg-linen", className)}>
      <picture>
        <source type="image/avif" srcSet={hubSrcSet(id, "avif")} sizes={sizes} />
        <img
          src={hubVariant(id, 640, "webp")}
          srcSet={hubSrcSet(id, "webp")}
          sizes={sizes}
          alt={alt ?? ""}
          width={1200}
          height={800}
          loading={preload ? "eager" : "lazy"}
          fetchPriority={preload ? "high" : undefined}
          decoding="async"
          className={cx("absolute inset-0 size-full object-cover", imgClassName)}
        />
      </picture>
    </div>
  );
}
