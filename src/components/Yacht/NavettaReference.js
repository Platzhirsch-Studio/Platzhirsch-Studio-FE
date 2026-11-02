// "Minotti auf See – Referenzprojekt Custom Line Navetta 42" (owner decision
// 27.10.2026, QA round 2 P2.1). REAL photos by Custom Line, shown UNCHANGED:
// next/image with object-contain in a frame of the image's own ratio – no
// crop, nothing laid over the image. Visible credit under every
// image. No KI label here (these are not AI images) and no data-ki-* hooks.
// Visual-design 31.10.2026 – „Kinosaal“: the chapter stands on ink-deep, the
// photos glow like on a screen. Desktop/tablet (≥ 768 px): one row of all five
// photos as a film strip. With scroll-driven animations the strip is pinned and
// the page scroll moves it sideways like a slow camera dolly along the yacht
// (navettaFilm.module.css); without them, or with reduced motion / "Ruhige
// Ansicht", it is a plain horizontal scroll-snap strip (keyboard: focusable).
// Phones (< 768 px): Embla carousel (NavettaCarousel), controls left so the
// concierge launcher bottom right never covers them (WCAG 2.4.11).
// Data and rules: src/lib/yacht/navetta.js. Server component.
import { useLocale } from "next-intl";
import { NAVETTA_PRODUCTS, navettaCopy } from "@/lib/yacht/navetta";
import { yachtUi } from "@/lib/yacht/ui";
import NavettaCarousel from "./NavettaCarousel";
import NavettaFigure from "./NavettaFigure";
import styles from "./navettaFilm.module.css";
import NavettaFilmVorlader from "./NavettaFilmVorlader";

export default function NavettaReference({ tone = "dark" }) {
  const locale = useLocale();
  const t = yachtUi(locale);
  const dark = tone === "dark";
  const { images, credit, disclaimer } = navettaCopy(locale);
  return (
    <div data-yacht-navetta="">
      <div className="grid grid-cols-1 gap-y-6 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-7">
          <p className={`text-overline uppercase ${dark ? "text-accent-on-dark" : "text-text-accent"}`}>{t.navettaEyebrow}</p>
          <h2 id="navetta-title" className={`mt-stack-s font-display text-display-l ${dark ? "text-text-inverse" : "text-text"}`}>
            {t.navettaTitle}
          </h2>
          {/* phones: shorter chapter (page budget, R7-P4) – facts stay in the disclaimer and the captions */}
          <p className={`mt-4 max-w-measure text-body max-sm:hidden ${dark ? "text-text-inverse-soft" : "text-text-soft"}`}>
            {t.navettaText}
          </p>
        </div>
        <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
          <p className={`max-w-measure border-l-2 pl-4 text-small ${dark ? "border-brass-400 text-text-inverse" : "border-ink text-text"}`} data-navetta-disclaimer="">
            <strong className="font-medium">{disclaimer}</strong> {t.navettaReal}
          </p>
          <p className={`mt-3 max-w-measure text-small max-sm:hidden ${dark ? "text-text-inverse-soft" : "text-text-soft"}`}>
            {t.navettaProducts(NAVETTA_PRODUCTS.outdoor.join(", "), NAVETTA_PRODUCTS.indoor.join(", "))}
          </p>
        </div>
      </div>

      {/* desktop and tablet: film strip (pinned dolly where supported) */}
      <div className={`mt-stack-m hidden md:block ${styles.film}`} data-navetta-film="" data-concierge-avoid="">{/* QM r1: Concierge-Tab blendet aus, solange die randlose Filmleiste (Bildnachweise) unter ihm liegt */}
        <div className={styles.filmSticky}>
          {/* tabIndex: the scrollable strip must be keyboard-reachable (fallback mode) */}
          <ol className={styles.filmTrack} tabIndex={0} aria-label={t.carouselLabel}>
            {images.map((img) => (
              <li key={img.file} className={styles.filmFrame} style={{ "--r": img.width / img.height }}>
                <NavettaFigure img={img} credit={credit} tone={tone} sizes="(min-width: 768px) 880px, 80vw" />{/* Rahmenbreite = min(58svh, 34rem) × Seitenverhältnis ≤ 870 px */}
              </li>
            ))}
          </ol>
          <span aria-hidden="true" className={styles.filmProgress} />
        </div>
      </div>
      <NavettaFilmVorlader />

      {/* phones: carousel */}
      <div className="mt-stack-m md:hidden">
        <NavettaCarousel images={images} credit={credit} tone={tone} />
      </div>
    </div>
  );
}
