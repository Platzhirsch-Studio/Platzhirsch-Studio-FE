// src/components/Katalog/ProduktKachel.js
// Kachel eines Katalog-Produkts (Server Component). Herstellerbild
// unverändert: object-contain in einer ruhigen Fläche, nichts wird beschnitten;
// data-pin-nopin (Herstellerbild, nicht für Pinterest). data-* für die
// Filter-Insel (KatalogFilter.js).
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { produktPath } from "@/lib/katalog/welten";
import { kategorieKey, textOf } from "@/lib/katalog/schema";
import { anzeigePreis, preisTexte } from "./preis";
import { anzeigeName, produktTitel } from "./produktTitel";
import { KACHEL_BILD_CLASS, kachelBild } from "./kachelBild";
import { IMAGE_HOVER, LINK_EASE, staggerStyle } from "@/components/Landing/motionLanding";

/**
 * @param {{p: object, markeName: string, locale: string, t: Function, sizes?: string, hinweis?: string|null}} props
 *   hinweis: optionaler Satz unter dem Namen (Zubehör „Passend dazu“)
 *   eager: Bild sofort laden (erste Kacheln einer Liste, mögliches LCP-Bild; Qualität 01.11.2026)
 *   index/spalten: Position im Raster → Reveal-Versatz je Spalte (Motion 01.11.2026; nur transform,
 *   scrollgetrieben, steht bei reduzierter Bewegung / data-motion still). Bild-Hover 2 % im festen Rahmen.
 */
// kompakt: zweispaltiges Handy-Raster (KatalogListe) – Titel dort in text-ui wie ShopKachel, ab sm text-title.
export default function ProduktKachel({ p, markeName, locale, t, sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw", hinweis = null, eager = false, index = 0, spalten = 3, kompakt = false, className = "" }) {
  // QM R1: einheitliches Raster – Freisteller statt Farbverlauf, Querformat statt schmalem Hochformat (kachelBild.js).
  const acc = p.welt === "accessoires";
  const bild = acc ? p.bilder[0] : kachelBild(p);
  const kat = t(`kategorie.${kategorieKey(p.kategorie)}`);
  // QM R3: kleine Herstellerbilder (Quooker 500 px, Soleum 500 × 311) nicht über Originalbreite ÷ 1,5
  // ziehen – sonst auf Retina sichtbar weich. Das Bild steht dann kleiner mittig im Passepartout;
  // `sizes` nennt die echte Breite (Browser wählt die passende Datei).
  const klein = bild?.width && bild.width < 900 ? Math.round(bild.width / 1.5) : null;
  const bildSizes = klein ? `(min-width: 1024px) min(30vw, ${klein}px), min(50vw, ${klein}px)` : sizes;
  const preis = preisTexte(anzeigePreis(p), t, locale);
  return (
    <li data-kat-item="" data-bereich={p.bereich} data-kategorie={p.kategorie} data-marke={p.marke} className={`reveal flex ${className}`} style={staggerStyle(index, spalten)}>
      <Link
        href={produktPath(p.welt, p.slug)}
        className="group flex w-full flex-col border-b border-line pb-6 text-text no-underline"
        data-kat-produkt={p.slug}
      >
        {/* Fester Rahmen: das Bild liegt absolut darin und kann ihn nicht
            aufdehnen – alle Kacheln gleich groß. Accessoires 4:5 wie ShopKachel. */}
        <div className={`relative flex w-full items-center justify-center overflow-hidden bg-linen ${p.welt === "accessoires" ? "aspect-[4/5]" : "aspect-[4/3]"}`}>
          {bild ? (
            <Image
              src={bild.src}
              width={bild.width}
              height={bild.height}
              alt={textOf(bild.alt, locale)}
              sizes={bildSizes}
              style={klein ? { maxWidth: klein, maxHeight: Math.round(bild.height / 1.5), margin: "auto" } : undefined}
              loading={eager ? "eager" : undefined}
              quality={75}
              className={`${acc ? "absolute inset-0 block h-full w-full object-contain p-[6%] mix-blend-multiply" : KACHEL_BILD_CLASS} ${IMAGE_HOVER}`}
              data-pin-nopin="true" // Herstellerbild: nicht für Pinterest
            />
          ) : (
            <span className="text-small text-text-soft">{t("produkt.keinBild")}</span>
          )}
        </div>
        {/* QM R4: Trennpunkt bleibt am Markennamen (nie am Anfang der zweiten Zeile), die
            Kategorie wird nicht mitten im Wort getrennt („Behand-/lungsraum-Möbel“). */}
        <p className="mt-3 text-small text-text-soft hyphens-none">
          <span className="whitespace-nowrap">{markeName} ·</span> {kat}
        </p>
        <h3 className={`mt-1 ${kompakt ? "text-ui sm:text-title" : "text-title"} text-text underline decoration-transparent underline-offset-4 group-hover:decoration-current ${LINK_EASE}`}>{produktTitel(anzeigeName(p.name, { name: markeName, slug: p.marke }))}</h3>
        {hinweis && <p className="mt-1 text-small text-text-soft">{hinweis}</p>}
        {preis && (
          <p className="mt-1 text-small text-text tabular" data-kat-preis={p.slug}>
            {preis.kurz}
          </p>
        )}
      </Link>
    </li>
  );
}
