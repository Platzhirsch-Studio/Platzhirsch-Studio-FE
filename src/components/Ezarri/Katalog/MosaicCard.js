// Mosaik-Karte (Format „Material“ 1:1): Bild, Kollektion, Name, Faktenzeile
// „25 mm · glänzend · Rosa“ (Mosaikfarbe = farben[0]), darunter sichtbar
// „Im Wasser: Grün“ (QM Runde 2 P2-1: Wasserwirkung ist keine Mosaikfarbe;
// ohne Wasserwirkung keine Zeile), darunter Vergleichen und Merken. Die ganze Karte ist ein Link über ::after
// (ph-stretched), die Knöpfe liegen darüber (z-10). Server- und Client-sicher;
// der Sammel-Credit „Bild: Ezarri“ steht unter dem Raster (CreditNote).
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { alt as ALT_DE, KARTE as KARTE_DE, TYP_LABEL as TYP_DE } from "@/lib/ezarri/copy";
import { alt as ALT_EN, KARTE as KARTE_EN, TYP_LABEL as TYP_EN } from "@/lib/ezarri/copy.en";
import { alt as ALT_FR, KARTE as KARTE_FR, TYP_LABEL as TYP_FR } from "@/lib/ezarri/copy.fr";
import { alt as ALT_IT, KARTE as KARTE_IT, TYP_LABEL as TYP_IT } from "@/lib/ezarri/copy.it";

const CARD_COPY = { de: [ALT_DE, KARTE_DE, TYP_DE], en: [ALT_EN, KARTE_EN, TYP_EN], fr: [ALT_FR, KARTE_FR, TYP_FR], it: [ALT_IT, KARTE_IT, TYP_IT] };
import { FORMATE, facetsFor } from "@/lib/ezarri/facets";
import { wert } from "@/lib/ezarri/werte";
import EzImage from "@/components/Ezarri/Welt/EzImage";
import { CompareButton, MerkButton } from "./CardActions";
import { IMAGE_HOVER } from "@/lib/ezarri/motion";
import { mitFesterEinheit } from "@/lib/ezarri/einheit";

// QM r4: Trenner mit geschütztem Leerzeichen am Wort davor – keine Zeile beginnt mit „· Weiß“.
const SEP = "\u00a0· ";
const formatLabel = (ids = []) => ids.map((id) => mitFesterEinheit(FORMATE.find((f) => f.id === id)?.label ?? id)).join(SEP);
const wasserLabel = (vals = [], locale = "de") => vals.map((v) => facetsFor(locale).WASSERWIRKUNG.find((w) => w.value === v)?.label).filter(Boolean)[0];

/**
 * @param {object} card toReferenceCard()
 * @param {number} [headingLevel=3]
 * @param {boolean} [actions=true]
 * @param {boolean} [eager] erstes Bild einer Liste (über der Falz)
 */
export default function MosaicCard({ card, headingLevel = 3, actions = true, eager = false, sizes = "(min-width: 1280px) 22vw, (min-width: 640px) 30vw, 46vw" }) {
  const H = `h${headingLevel}`;
  // Welle 2: Sprache aus next-intl (Server- und Client-Komponente).
  const locale = useLocale();
  const [altText, KARTE, TYP_LABEL] = CARD_COPY[locale] ?? CARD_COPY.de;
  const ober = wert("oberflaeche", card.oberflaeche, locale);
  const fmt = formatLabel(card.formate);
  const wasser = wasserLabel(card.wasserfarbe, locale);
  const meta = [card.typ !== "mosaik" ? TYP_LABEL[card.typ] : null, fmt || null, ober, wert("farbe", card.farben?.[0], locale)].filter(Boolean).join(SEP);
  return (
    <article className="group relative flex h-full min-w-0 flex-col">
      <EzImage
        image={card.bild}
        alt={altText.mosaik(card.name, fmt, ober)}
        ratio="1/1"
        sizes={sizes}
        preload={eager}
        imgClassName={IMAGE_HOVER}
      />
      <div className="mt-3 flex flex-col gap-1">
        <p className="text-overline uppercase text-text-soft">{card.kollektionName}</p>
        <H className="text-ui text-text">
          <Link
            href={`/ezarri/mosaike/${card.id}`}
            className="ph-stretched underline decoration-transparent underline-offset-4 transition-colors duration-(--duration-micro) group-hover:decoration-current"
          >
            {card.name}
          </Link>
        </H>
        {meta && <p className="text-small text-text-soft">{meta}</p>}
        {wasser && (
          <p className="text-small text-text-soft">
            {KARTE.imWasser} <span className="text-see">{wasser}</span>
          </p>
        )}
      </div>
      {actions && (
        // QM r4 (200 % Text): umbrechende Zeile – das Merken-Herz behält seine 44 × 44 px
        <div className="relative z-10 mt-auto flex flex-wrap items-center justify-between gap-x-2 pt-1">
          <CompareButton card={card} />
          <MerkButton card={card} />
        </div>
      )}
    </article>
  );
}
