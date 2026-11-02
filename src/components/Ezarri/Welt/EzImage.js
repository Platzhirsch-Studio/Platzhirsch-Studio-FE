// Ezarri-Bild als <picture> (AVIF/WebP 600/1600 aus public/ezarri, schon
// optimiert → kein next/image). Feste aspect-ratio-Box (CLS), Zuschnitt nur per
// object-fit: cover auf die Bibel-Formate (Konzept §1.1: Herstellerbilder
// bleiben unverändert). Credit „Bild: Ezarri, ezarri.com“ als <figcaption>,
// wenn `credit` gesetzt ist – sonst muss der Aufrufer die Quelle in der Nähe zeigen
// (Galerie-Fußzeile, Kartenraster mit Sammel-Credit).
// Server- und Client-sicher (keine Hooks).
import { useLocale } from "next-intl";
import { imageSources } from "@/lib/ezarri/images";
import { ezarriCredit } from "@/lib/ezarri/config";
import cx from "@/components/ui/cx";

const RATIOS = { "21/9": "aspect-[21/9]", "4/5": "aspect-[4/5]", "3/2": "aspect-[3/2]", "1/1": "aspect-square", auto: "" };

/**
 * @param {{web:string, breite?:number, hoehe?:number}} image compactImage
 * @param {string} alt
 * @param {"21/9"|"4/5"|"3/2"|"1/1"|"auto"} [ratio="1/1"]
 * @param {string} [sizes]
 * @param {boolean} [preload] LCP-Bild: eager + fetchpriority high
 * @param {boolean|string} [credit] true → Standard-Credit, String → eigener Text
 * @param {number[]} [stufen] Zwischenbreiten im srcset (nur, wenn die Dateien existieren)
 * @param {string} [boxClassName] zusätzliche Klassen am Bildrahmen (z. B. Seitenverhältnis je Rasterbreite)
 */
export default function EzImage({ image, alt, ratio = "1/1", sizes = "(min-width: 1024px) 33vw, 100vw", preload = false, credit = false, className, imgClassName, boxClassName, as = "figure", stufen }) {
  const locale = useLocale();
  const s = imageSources(image, stufen);
  const Tag = credit ? "figure" : as === "figure" ? "div" : as;
  const box = cx("relative overflow-hidden bg-linen", RATIOS[ratio] ?? RATIOS["1/1"], boxClassName);
  return (
    <Tag className={cx("min-w-0", className)}>
      <div className={box} style={ratio === "auto" && s ? { aspectRatio: s.ratio } : undefined}>
        {s && (
          <picture>
            <source type="image/avif" srcSet={s.avif} sizes={sizes} />
            <source type="image/webp" srcSet={s.webp} sizes={sizes} />
            { }
            <img
              src={s.src}
              alt={alt ?? ""}
              width={s.width}
              height={s.height}
              loading={preload ? "eager" : "lazy"}
              fetchPriority={preload ? "high" : undefined}
              decoding="async"
              className={cx("absolute inset-0 size-full object-cover", imgClassName)}
            />
          </picture>
        )}
      </div>
      {credit && (
        <figcaption className="mt-2 text-small text-text-soft">{typeof credit === "string" ? credit : ezarriCredit("bild", locale)}</figcaption>
      )}
    </Tag>
  );
}
