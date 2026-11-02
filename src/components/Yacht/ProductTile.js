// One product card of the yacht page (concept gallery and brand shelf).
// Uniform 4:5 tiles: cut-outs (imageFit "contain") sit on white with the same
// inset, mood photos ("cover") fill the tile. Minotti images are always
// "contain" – never cropped or altered (manufacturer condition); their mood
// photos sit without inset on stone, and in the brand shelf they get a tile
// in the image's own landscape ratio (`wide`), so the whole piece of
// furniture fills the tile uncropped. Loading state: TileImage (shimmer).
// The whole card is the link (ph-stretched, ≥ 44 px target). Server component.
import { SmartLink } from "@/components/ui";
import TileImage from "./TileImage";
import { CARD_LINK, IMAGE_HOVER } from "@/lib/yacht/motion";

// Bildausschnitt einzelner Stimmungsbilder in der breiten 2:1-Kachel (QM r1): die Leuchte
// sitzt im oberen Bilddrittel und wurde bei mittigem Zuschnitt gekappt. Nur Zuschnitt, Bild unverändert.
const FOCUS = { "Dome Pendant": "object-[50%_15%]" };

/**
 * @param {object} p productView(...) from src/lib/yacht/model.js
 * @param {string} sizes real layout width of the tile
 * @param {"h4"|"h5"|"p"} [as] element of the product name
 * @param {boolean} [meta=true] show role and suitability
 * @param {boolean} [eager] load without lazy delay (first tiles of a row)
 * @param {boolean} [wide] landscape tile for uncropped mood photos
 * @param {boolean} [single] the only product of its brand: landscape 2:1
 *   tile as high as two square tiles side by side (no half-empty rows, QA round 2 P2.2)
 * @param {boolean} [row] image left, text right (a zone with one product)
 * @param {boolean} [square] 1:1 instead of 4:5 (brand shelf, shorter page)
 * @param {boolean} [landscape] 4:3 (wide brand cards with two products)
 */
export default function ProductTile({ p, sizes, as: Name = "h5", meta = true, eager = false, wide = false, single = false, row = false, square = false, landscape = false, className = "" }) {
  const cover = p.imageFit === "cover";
  const mood = !cover && p.imageKind === "stimmung";
  // QM r4: Einzelkacheln im Seitenverhältnis der Minotti-Stimmungsbilder (24:13) statt 2:1 – das
  // unveränderte Minotti-Bild (contain) füllt seinen Rahmen ohne beige Seitenbalken, und alle
  // Einzelkacheln einer Reihe bleiben gleich hoch.
  const ratio = single ? "aspect-[24/13]" : mood && wide ? "aspect-[24/13]" : landscape ? "aspect-[4/3]" : square ? "aspect-square" : "aspect-[4/5]";
  const box = cover || mood ? `${ratio} bg-stone` : `${ratio} border border-line bg-white`;
  return (
    <li className={`group relative ${row ? "grid grid-cols-2 items-center gap-x-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-x-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]" : "flex flex-col"} ${className}`} data-yacht-tile={cover ? "cover" : "contain"}>
      <div className={`relative overflow-hidden ${box}`}>
        {p.image && (
          <TileImage
            src={p.image}
            alt={`${p.brand} ${p.name}`}
            sizes={sizes}
            eager={eager}
            // Hover: 2 % im festen Rahmen (IMAGE_HOVER); Stimmungsbilder (Minotti) bleiben unbewegt
            // QM r1: breite 2:1-Kachel schneidet Stimmungsbilder mittig – Leuchten/Schirme oben (Heatsail Dome Pendant) wurden gekappt
            className={cover ? `object-cover ${(single && FOCUS[p.id]) || ""} ${IMAGE_HOVER}` : mood ? "object-contain" : single ? `object-contain p-[4%] ${IMAGE_HOVER}` : `object-contain p-[9%] ${IMAGE_HOVER}`}
          />
        )}
      </div>
      <div className={row ? "" : "contents"}>
      <p className={`${row ? "" : "mt-3 "}text-overline uppercase text-text-soft`}>{p.brand}</p>
      <Name className="text-ui text-text">
        <SmartLink href={p.path} className={`ph-stretched underline-offset-4 ${CARD_LINK}`}>
          {p.name}
        </SmartLink>
      </Name>
      {meta && (
        <>
          <p className="mt-1 text-small text-text-soft">{p.role}</p>
          <p className="mt-1 text-small text-text-soft">{p.eignungLabel}</p>
        </>
      )}
      </div>
    </li>
  );
}
