// Ein freigegebenes Ezarri-Bild als eigenes Modul (Rat 9,5 A6, gesamtwerk M3):
// Inhaber-Entscheidung Nr. 7 – Ezarri erlaubt die Nutzung der Inhalte seiner
// Website, mit Quellenangabe. Bibel §7.1: Herstellerbild nur unverändert, in
// einem eigenen Modul, mit sichtbarem Credit („Bild: Ezarri, ezarri.com“).
// Rahmen im eigenen Seitenverhältnis (kein Zuschnitt), <picture> mit den schon
// optimierten AVIF/WebP-Dateien aus public/ezarri (lazy, nie LCP).
// Server-Komponente, kein Client-JS.
import { cx } from "@/components/ui";
import { ezarriCredit } from "@/lib/ezarri/config";
import { sharedCopy } from "@/lib/content/landingKern/shared";
import { imageSources } from "@/lib/ezarri/images";

/**
 * @param {{web: string, breite: number, hoehe: number}} image Basis aus public/ezarri
 * @param {string} alt Bildinhalt (nicht der Filterbegriff)
 * @param {string} [caption] Text vor dem Credit (z. B. Mosaik-Name)
 * @param {string} [sizes]
 * @param {"de"|"en"|"fr"|"it"} [locale] FR/IT: Credit aus landingKern/shared.js („Image : …“, „Immagine: …“)
 */
export default function EzarriFigure({ image, alt, caption, sizes = "(min-width: 1024px) 40vw, 100vw", locale = "de", className, ...rest }) {
  const s = imageSources(image);
  if (!s) return null;
  return (
    <figure className={cx("m-0", className)} {...rest}>
      <div className="relative overflow-hidden bg-linen" style={{ aspectRatio: s.ratio }}>
        <picture>
          <source type="image/avif" srcSet={s.avif} sizes={sizes} />
          <source type="image/webp" srcSet={s.webp} sizes={sizes} />
          <img src={s.src} alt={alt} width={s.width} height={s.height} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        </picture>
      </div>
      <figcaption className="mt-2 text-small text-text-soft">
        {caption ? `${caption} · ` : ""}
        <span className="text-text" data-ezarri-credit="">
          {locale === "fr" || locale === "it" ? sharedCopy(locale).ezarriCredit : ezarriCredit("bild", locale)}
        </span>
      </figcaption>
    </figure>
  );
}
