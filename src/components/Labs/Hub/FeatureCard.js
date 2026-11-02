import { SmartLink, cx } from "@/components/ui";
import FeatureVisual from "./FeatureVisual";

// Karte eines Features (Bibel §9: kein Rahmen um die Karte, kein Schatten,
// die ganze Karte klickbar über ::after des Titel-Links – ein Link, ein
// Tab-Halt). Keine Status-Plakette und kein Schaltername (Usability B4:
// keine Entwicklersprache vor Kunden).

/**
 * @param {object} feature   Eintrag aus src/lib/features.js
 * @param {2|3|4} [headingLevel=3]
 * @param {boolean} [compact] Startseite: ohne Hinweiszeile
 * @param {string} [sizes]
 */
export default function FeatureCard({ feature, headingLevel = 3, compact = false, mobileCompact = false, sizes, className }) {
  const H = `h${headingLevel}`;
  return (
    <article className={cx("group relative flex flex-col", className)} data-feature={feature.id}>
      <FeatureVisual feature={feature} sizes={sizes || "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"} />
      <div className={cx("flex flex-1 flex-col gap-2", mobileCompact ? "mt-2 sm:mt-4" : "mt-4")}>
        <H className={cx("text-text", mobileCompact ? "text-ui font-medium max-sm:min-h-[2lh] sm:text-title sm:font-normal" : "text-title")}>
          <SmartLink
            href={feature.href}
            className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
          >
            {feature.title}
          </SmartLink>
        </H>
        {/* Fix-Runde 1 (F2): mobil im Hub nur Bild und Titel, Text ab sm */}
        <p className={cx("max-w-measure text-body text-text-soft", mobileCompact && "hidden sm:block")}>{feature.summary}</p>
        {!compact && feature.note && <p className={cx("max-w-measure text-small text-text-soft", mobileCompact && "hidden sm:block")}>{feature.note}</p>}
        {/* Quellenangabe für freigegebene Herstellerbilder (z. B. Ezarri) – QM r2: unter dem Text,
            damit die Titel im Raster auf einer Linie stehen */}
        {feature.image?.credit && <p className="mt-auto pt-1 text-small text-text-soft">{feature.image.credit}</p>}
      </div>
    </article>
  );
}
