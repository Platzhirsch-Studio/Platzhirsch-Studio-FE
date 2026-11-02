// Bildplatz der Seite /de/arbeitsweise. Kennt keinen Bildpfad: das Bild kommt
// als `slot` aus src/lib/arbeitsweise/media.js.
//   slot = Objekt                → Bild mit Credit-Zeile (figcaption)
//   slot = null, Vorschau        → gestalteter Platzhalter „Bild folgt“
//                                  (linen, Haarlinie, Passepartout; kein Icon,
//                                  kein Shimmer – Bibel §8.2), data-placeholder
//   slot = null, Produktion      → nichts (der Bildplatz entfällt)
// Kein "use client", nicht async: im Server und in Inseln nutzbar.
import Media from "@/components/ui/Media";
import { SHOW_PLACEHOLDERS } from "@/lib/arbeitsweise/media";
import { UI } from "@/lib/arbeitsweise/copy";
import styles from "./arbeitsweise.module.css";
import SaveActions from "@/components/Pinterest/SaveActions";

const cx = (...p) => p.filter(Boolean).join(" ");

// Pinterest + Ideenboard (Inhaber-Entscheidung Nr. 14): nur bei echtem
// Material (slot.src). Ob der Merken-Link erscheint, entscheidet die
// Allowlist (src/lib/pinterest/rights.js: /arbeitsweise/ = Haralds Material,
// kiStufe außer keine/retusche gesperrt). Pin-Ziel: die Prozessseite.
const PIN_PAGE = "/de/arbeitsweise";

const RATIO_CLASS = {
  "21/9": "aspect-[21/9]",
  "4/5": "aspect-[4/5]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
};

export function captionOf(slot) {
  if (!slot) return "";
  if (slot.caption) return slot.caption;
  return [slot.credit, slot.datum].filter(Boolean).join(", ");
}

/**
 * @param {object|null} slot   Eintrag aus media.js
 * @param {string} kind        Art des fehlenden Materials („Handzeichnung von Harald Menghin, Schritt 03“)
 * @param {"21/9"|"4/5"|"3/2"|"1/1"} [ratio="3/2"]
 * @param {string} [sizes]     echte Spaltenbreite für next/image
 * @param {"light"|"dark"} [tone="light"]
 * @param {string} [note]      Pflichtzeile unter dem Bild (z. B. Rendering-Kennzeichnung)
 * @param {"de"|"en"|"fr"|"it"} [locale="de"] Sprache der Merken-Knöpfe
 * @param {boolean} [forcePlaceholder] Platzhalter auch in Produktion (nur für Tests/Styleguide)
 */
export default function ImageSlot({ slot, kind, ratio = "3/2", sizes = "(min-width: 1024px) 50vw, 100vw", tone = "light", note, className, forcePlaceholder, locale = "de" }) {
  const dark = tone === "dark";
  const capTone = dark ? "text-text-inverse-soft" : "text-text-soft";
  if (slot?.src) {
    const caption = captionOf(slot);
    return (
      <figure className={className}>
        {slot.srcMobile ? (
          <>
            <Media src={slot.srcMobile} alt={slot.alt} ratio="4/5" sizes="100vw" className="lg:hidden" />
            <Media src={slot.src} alt={slot.alt} ratio={ratio} sizes={sizes} className="hidden lg:block" />
          </>
        ) : (
          <Media src={slot.src} alt={slot.alt} ratio={ratio} sizes={sizes} />
        )}
        {(caption || note) && (
          <figcaption className={cx("mt-3 text-small", capTone)}>
            {caption}
            {caption && note ? " · " : ""}
            {note}
          </figcaption>
        )}
        <SaveActions
          locale={locale}
          onDark={dark}
          compact
          className="mt-1"
          card={{ type: slot.typ === "foto" ? "projekt" : "raumbild", title: slot.alt, href: PIN_PAGE, image: slot.src, quelle: slot.credit }}
          pin={{ url: PIN_PAGE, media: slot.src, title: slot.alt, brand: "Harald Menghin", kiStufe: slot.kiStufe }}
        />
      </figure>
    );
  }
  if (!SHOW_PLACEHOLDERS && !forcePlaceholder) return null;
  return (
    <figure data-placeholder="arbeitsweise" className={className}>
      <div className={cx(styles.placeholder, dark && styles.placeholderDark, RATIO_CLASS[ratio] ?? RATIO_CLASS["3/2"], ratio === "21/9" && "max-lg:aspect-[4/5]")}>
        <p className={cx("relative z-[1] text-overline uppercase", dark ? "text-accent-on-dark" : "text-text-accent")}>{UI.placeholderOverline}</p>
        <p className={cx("relative z-[1] max-w-[32ch] text-small", dark ? "text-text-inverse" : "text-text")}>{kind}</p>
      </div>
      {note && <figcaption className={cx("mt-3 text-small", capTone)}>{note}</figcaption>}
    </figure>
  );
}
